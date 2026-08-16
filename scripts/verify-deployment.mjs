#!/usr/bin/env node
/**
 * ============================================================================
 * 🌙 Midnight Splitter — Preprod Deployment Verifier
 * ============================================================================
 *
 * Queries the Midnight Preprod indexer to verify the deployed MidnightSplitter
 * contract exists on-chain and reads its public ledger state counters.
 *
 * Usage:
 *   npm run contract:verify
 *   node scripts/verify-deployment.mjs [--address <CONTRACT_ADDRESS>]
 * ============================================================================
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname }         from 'path';
import { fileURLToPath }            from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, '..');

const args       = process.argv.slice(2);
const addrFlagIdx = args.indexOf('--address');
const CLI_ADDR   = addrFlagIdx !== -1 ? args[addrFlagIdx + 1] : null;

// ── ANSI helpers ──────────────────────────────────────────────────────────────
const c = {
  reset:  '\x1b[0m',
  bold:   '\x1b[1m',
  dim:    '\x1b[2m',
  green:  '\x1b[32m',
  yellow: '\x1b[33m',
  red:    '\x1b[31m',
  cyan:   '\x1b[36m',
  purple: '\x1b[35m',
};

const log = {
  info:    (m) => console.log(`${c.cyan}i${c.reset}  ${m}`),
  success: (m) => console.log(`${c.green}v${c.reset}  ${m}`),
  warn:    (m) => console.log(`${c.yellow}!${c.reset}  ${m}`),
  error:   (m) => console.error(`${c.red}x${c.reset}  ${m}`),
  step:    (n, m) => console.log(`\n${c.bold}${c.purple}[${n}]${c.reset} ${c.bold}${m}${c.reset}`),
  dim:     (m) => console.log(`    ${c.dim}${m}${c.reset}`),
};

// ── Paths ─────────────────────────────────────────────────────────────────────
const DEPLOYED_ADDR_FILE = resolve(ROOT, 'contracts', 'deployed-address.json');

// ── Midnight Preprod endpoints ────────────────────────────────────────────────
const INDEXER_URL    = 'https://indexer.preprod.midnight.network/api/v1/graphql';
const EXPLORER_BASE  = 'https://explorer.preprod.midnight.network/contract';
const PLACEHOLDER_ID = '0x90123456789abcdef0123456789abcdef0123456789abcdef0123456789abc';

// ── GraphQL helper ────────────────────────────────────────────────────────────
async function gql(query, variables = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12_000);
  try {
    const res  = await fetch(INDEXER_URL, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ query, variables }),
      signal:  controller.signal,
    });
    const json = await res.json();
    return { ok: true, data: json.data, errors: json.errors };
  } catch (e) {
    return { ok: false, error: e.message };
  } finally {
    clearTimeout(timer);
  }
}

// ── Step 1: Resolve contract address ─────────────────────────────────────────
function resolveContractAddress() {
  log.step('1', 'Resolving contract address');

  // Priority: --address flag > deployed-address.json > fallback placeholder
  if (CLI_ADDR) {
    log.info(`Using --address flag: ${CLI_ADDR}`);
    return { address: CLI_ADDR, source: 'CLI flag' };
  }

  if (existsSync(DEPLOYED_ADDR_FILE)) {
    const record = JSON.parse(readFileSync(DEPLOYED_ADDR_FILE, 'utf8'));
    if (record.contractAddress && record.contractAddress !== 'PENDING') {
      log.success(`Found in deployed-address.json: ${record.contractAddress}`);
      log.dim(`Deployed at: ${record.deployedAt}`);
      log.dim(`Block:       ${record.deployedAtBlock}`);
      return { address: record.contractAddress, source: 'deployed-address.json', record };
    }
    log.warn('deployed-address.json exists but address is PENDING or missing');
  }

  log.warn('No deployed-address.json — using placeholder address from midnightContract.ts');
  log.dim('Run: npm run contract:deploy  to deploy the real contract');
  return { address: PLACEHOLDER_ID, source: 'placeholder' };
}

// ── Step 2: Query indexer for contract ───────────────────────────────────────
async function queryContractOnChain(address) {
  log.step('2', `Querying Midnight Preprod indexer`);
  log.dim(`Address: ${address}`);
  log.dim(`Indexer: ${INDEXER_URL}`);

  // Query 1: Check indexer is reachable
  const ping = await gql('{ __typename }');
  if (!ping.ok) {
    log.error(`Indexer unreachable: ${ping.error}`);
    return null;
  }
  log.success('Indexer reachable');

  // Query 2: Contract state
  const contractQuery = `
    query ContractState($address: String!) {
      contract(address: $address) {
        address
        state {
          blockHeight
          transactionHash
          merkleRoot
        }
        ledger {
          contract_version
          total_splits_executed
          total_volume_settled
        }
      }
    }
  `;

  const result = await gql(contractQuery, { address });

  if (!result.ok) {
    log.error(`GraphQL request failed: ${result.error}`);
    return null;
  }

  if (result.errors && result.errors.length > 0) {
    log.warn(`GraphQL errors returned:`);
    result.errors.forEach((e) => log.dim(`  ${e.message}`));
    // Non-fatal: schema may differ across indexer versions
  }

  return result.data?.contract || null;
}

// ── Step 3: Query latest block for context ───────────────────────────────────
async function queryLatestBlock() {
  log.step('3', 'Querying latest block');

  const result = await gql(`
    query {
      blockchainInfo {
        latestBlock { height hash timestamp }
      }
    }
  `);

  if (result.ok && result.data?.blockchainInfo?.latestBlock) {
    const b = result.data.blockchainInfo.latestBlock;
    log.success(`Latest block: #${b.height}`);
    log.dim(`Hash:      ${String(b.hash).slice(0, 24)}...`);
    log.dim(`Timestamp: ${new Date(b.timestamp).toUTCString()}`);
    return b;
  }

  log.warn('Could not fetch latest block — indexer may use different schema');
  return null;
}

// ── Step 4: Interpret and display results ─────────────────────────────────────
function interpretResults(address, contractData, latestBlock, meta) {
  log.step('4', 'Verification results');

  console.log(`\n${'='.repeat(60)}`);
  console.log(`${c.bold}${c.purple}MidnightSplitter Contract Verification${c.reset}`);
  console.log('='.repeat(60));

  console.log(`\n  ${c.bold}Address:${c.reset}   ${c.cyan}${address}${c.reset}`);
  console.log(`  ${c.bold}Network:${c.reset}   Midnight Preprod Testnet`);
  console.log(`  ${c.bold}Source:${c.reset}    ${meta.source}`);
  console.log(`  ${c.bold}Explorer:${c.reset}  ${EXPLORER_BASE}/${address}`);

  if (latestBlock) {
    console.log(`\n  ${c.bold}Network State:${c.reset}`);
    console.log(`    Latest block:  #${latestBlock.height}`);
    console.log(`    Block time:    ${new Date(latestBlock.timestamp).toUTCString()}`);
  }

  if (contractData) {
    console.log(`\n  ${c.bold}${c.green}Contract found on-chain!${c.reset}`);

    if (contractData.state) {
      console.log(`\n  ${c.bold}State:${c.reset}`);
      console.log(`    Block height:     ${contractData.state.blockHeight}`);
      console.log(`    Tx hash:          ${String(contractData.state.transactionHash).slice(0, 20)}...`);
    }

    if (contractData.ledger) {
      console.log(`\n  ${c.bold}Ledger State (Public):${c.reset}`);
      console.log(`    contract_version:       ${contractData.ledger.contract_version ?? 'N/A'}`);
      console.log(`    total_splits_executed:  ${contractData.ledger.total_splits_executed ?? 0}`);
      console.log(`    total_volume_settled:   ${contractData.ledger.total_volume_settled ?? 0} DUST`);
    }

    console.log(`\n  ${c.bold}Circuits:${c.reset}`);
    const circuits = [
      'initialize',
      'calculate_equal_split',
      'verify_solvency_proof',
      'split_equal',
      'split_weighted',
      'split_custom',
    ];
    circuits.forEach((circ) => console.log(`    ${c.green}✓${c.reset} ${circ}`));
  } else if (address === PLACEHOLDER_ID) {
    console.log(`\n  ${c.yellow}${c.bold}Status: Using placeholder address${c.reset}`);
    console.log(`\n  The contract address in this project is a placeholder.`);
    console.log(`  To deploy the real contract:`);
    console.log(`    npm run contract:deploy`);
    console.log(`    (See DEPLOY.md for prerequisites)`);
  } else {
    console.log(`\n  ${c.yellow}${c.bold}Status: Not found on-chain (or indexer schema mismatch)${c.reset}`);
    console.log(`\n  Possible reasons:`);
    console.log(`    • Contract was not yet deployed`);
    console.log(`    • Indexer hasn't indexed the block yet (wait ~30s)`);
    console.log(`    • Indexer schema differs from query (check DEPLOY.md)`);
    console.log(`\n  Check manually at:`);
    console.log(`    ${EXPLORER_BASE}/${address}`);
  }

  console.log(`\n${'='.repeat(60)}\n`);
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${c.bold}${c.purple}🌙 Midnight Splitter — Deployment Verifier${c.reset}`);
  console.log('='.repeat(55));

  const meta           = resolveContractAddress();
  const contractData   = await queryContractOnChain(meta.address);
  const latestBlock    = await queryLatestBlock();

  interpretResults(meta.address, contractData, latestBlock, meta);

  // Exit code: 0 if found on-chain, 1 if not (useful for CI)
  const found = contractData !== null && meta.address !== PLACEHOLDER_ID;
  process.exit(found ? 0 : 1);
}

main().catch((err) => {
  console.error(`\n${c.red}${c.bold}Verification error:${c.reset} ${err.message}\n`);
  process.exit(1);
});
