#!/usr/bin/env node
/**
 * ============================================================================
 * 🌙 Midnight Splitter — Preprod Deployment Script
 * ============================================================================
 *
 * Deploys the compiled MidnightSplitter Compact contract to Midnight Preprod.
 *
 * Prerequisites (see DEPLOY.md for full setup guide):
 *   1. WSL2 with `compact` CLI installed  →  compile the contract first:
 *        compact compile contracts/midnight_splitter.compact --output dist/contracts
 *   2. A funded Midnight Preprod wallet   →  set MIDNIGHT_SEED_PHRASE in .env
 *   3. Docker proof server running        →  docker compose up -d in .devcontainer/
 *
 * Usage:
 *   npm run contract:deploy
 *   node scripts/deploy-preprod.mjs [--dry-run] [--force] [--record <address>]
 *
 * Flags:
 *   --dry-run          Validate config & endpoints without submitting a tx
 *   --force            Re-deploy even if deployed-address.json already exists
 *   --record <addr>    Skip deployment; just record a manually obtained address
 * ============================================================================
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT      = resolve(__dirname, '..');

// ── CLI Flags ─────────────────────────────────────────────────────────────────
const args    = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const FORCE   = args.includes('--force');

// ── ANSI colour helpers ───────────────────────────────────────────────────────
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
const PATHS = {
  envFile:         resolve(ROOT, '.env'),
  cliConfig:       resolve(ROOT, 'contracts', 'midnight-cli.json'),
  contractSource:  resolve(ROOT, 'contracts', 'midnight_splitter.compact'),
  compiledDir:     resolve(ROOT, 'dist', 'contracts'),
  deployedAddress: resolve(ROOT, 'contracts', 'deployed-address.json'),
  contractService: resolve(ROOT, 'src', 'services', 'midnightContract.ts'),
};

// ── Midnight Preprod Network Config ───────────────────────────────────────────
const PREPROD = {
  name:         'midnight-preprod',
  indexerUrl:   'https://indexer.preprod.midnight.network/api/v1/graphql',
  nodeRpcUrl:   'wss://rpc.preprod.midnight.network/ws',
  proverUrl:    'https://prover.preprod.midnight.network',
  explorerBase: 'https://explorer.preprod.midnight.network/contract',
  faucetUrl:    'https://midnight-tmnight-preprod.nethermind.dev/',
  gasLimit:     10_000_000,
};

// ── Load .env manually (no external dependencies) ────────────────────────────
function loadEnv() {
  if (!existsSync(PATHS.envFile)) return {};
  const lines = readFileSync(PATHS.envFile, 'utf8').split('\n');
  const env   = {};
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key   = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    env[key] = value;
  }
  return env;
}

// ── Config validation ─────────────────────────────────────────────────────────
function loadAndValidateConfig(env) {
  const seedPhrase = env.MIDNIGHT_SEED_PHRASE || process.env.MIDNIGHT_SEED_PHRASE || '';
  const proverUrl  = env.MIDNIGHT_PROVER_URL  || process.env.MIDNIGHT_PROVER_URL  || PREPROD.proverUrl;
  const gasLimit   = parseInt(env.MIDNIGHT_GAS_LIMIT || String(PREPROD.gasLimit), 10);
  const errors     = [];

  if (!seedPhrase) {
    errors.push('MIDNIGHT_SEED_PHRASE is not set in .env');
  } else {
    const wordCount = seedPhrase.trim().split(/\s+/).length;
    if (wordCount !== 12 && wordCount !== 15 && wordCount !== 24) {
      errors.push(`MIDNIGHT_SEED_PHRASE should be 12, 15, or 24 words (got ${wordCount})`);
    }
  }

  if (!existsSync(PATHS.cliConfig))      errors.push(`midnight-cli.json not found at ${PATHS.cliConfig}`);
  if (!existsSync(PATHS.contractSource)) errors.push(`Compact source not found at ${PATHS.contractSource}`);

  return { seedPhrase, proverUrl, gasLimit, errors };
}

// ── GraphQL helper ────────────────────────────────────────────────────────────
async function graphqlQuery(url, query) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10_000);
  try {
    const res  = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ query }),
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

// ── HTTP ping ─────────────────────────────────────────────────────────────────
async function httpPing(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8_000);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return { ok: res.ok || res.status === 404, status: res.status };
  } catch (e) {
    return { ok: false, error: e.message };
  } finally {
    clearTimeout(timer);
  }
}

// ── Step 1: Compiled artifacts ────────────────────────────────────────────────
async function checkCompiledArtifacts() {
  log.step('1', 'Checking compiled contract artifacts');

  if (!existsSync(PATHS.compiledDir)) {
    log.warn(`Compiled output not found: ${PATHS.compiledDir}`);
    log.dim('To compile, run in WSL2:');
    log.dim('  compact compile contracts/midnight_splitter.compact --output dist/contracts');
    log.dim('Or:  npm run contract:compile  (requires compact CLI in WSL2 PATH)');
    if (!DRY_RUN) {
      throw new Error(
        'Contract must be compiled before deployment.\n' +
        'See DEPLOY.md Step 2 for full instructions.'
      );
    }
    log.warn('DRY RUN: continuing without compiled artifacts');
    return false;
  }

  log.success('Compiled artifacts found → dist/contracts/');

  const expected = [
    'midnight_splitter.contract',
    'midnight_splitter_split_equal.zkir',
    'midnight_splitter_split_weighted.zkir',
    'midnight_splitter_split_custom.zkir',
    'midnight_splitter_verify_solvency_proof.zkir',
  ];

  for (const f of expected) {
    const exists = existsSync(resolve(PATHS.compiledDir, f));
    log.dim(`${exists ? 'OK' : 'MISSING'} ${f}`);
  }

  return true;
}

// ── Step 2: Endpoint health checks ───────────────────────────────────────────
async function checkNetworkEndpoints(proverUrl) {
  log.step('2', 'Checking Midnight Preprod network endpoints');

  const indexerResult = await graphqlQuery(PREPROD.indexerUrl, '{ __typename }');
  if (indexerResult.ok) {
    log.success(`Indexer GraphQL reachable   ${PREPROD.indexerUrl}`);
  } else {
    log.warn(`Indexer unreachable: ${indexerResult.error || 'unknown error'}`);
  }

  const proverResult = await httpPing(proverUrl);
  if (proverResult.ok) {
    log.success(`Proof server reachable      ${proverUrl}`);
  } else {
    log.warn(`Proof server unreachable: ${proverResult.error || `HTTP ${proverResult.status}`}`);
    log.dim('If using local Docker prover: docker compose up -d');
  }

  return indexerResult.ok;
}

// ── Step 3: Query latest block ────────────────────────────────────────────────
async function queryNetworkInfo() {
  log.step('3', 'Querying Midnight Preprod ledger state');

  const result = await graphqlQuery(PREPROD.indexerUrl, `
    query {
      blockchainInfo {
        latestBlock { height hash timestamp }
      }
    }
  `);

  if (result.ok && result.data?.blockchainInfo?.latestBlock) {
    const block = result.data.blockchainInfo.latestBlock;
    log.success('Connected to Midnight Preprod');
    log.dim(`Latest block: #${block.height}  hash: ${String(block.hash).slice(0, 16)}...`);
    return block.height;
  }

  log.warn('Could not fetch block info from indexer');
  return null;
}

// ── Step 4: Check existing deployment ────────────────────────────────────────
async function checkExistingDeployment() {
  log.step('4', 'Checking for existing deployment');

  if (!existsSync(PATHS.deployedAddress)) {
    log.info('No existing deployment found — proceeding with fresh deploy');
    return null;
  }

  const existing = JSON.parse(readFileSync(PATHS.deployedAddress, 'utf8'));

  if (existing.contractAddress && existing.contractAddress !== 'PENDING') {
    log.warn(`Already deployed: ${existing.contractAddress}`);
    log.dim(`Network: ${existing.network} | Block: ${existing.deployedAtBlock}`);
    log.dim(`Deployed at: ${existing.deployedAt}`);

    if (!FORCE) {
      log.warn('Use --force to re-deploy');
      log.info(`Explorer: ${PREPROD.explorerBase}/${existing.contractAddress}`);
      return existing.contractAddress;
    }
    log.warn('--force: proceeding with re-deployment');
  }

  return null;
}

// ── Step 5: Deploy ────────────────────────────────────────────────────────────
async function deployContract(config, blockHeight) {
  log.step('5', DRY_RUN ? 'Dry-run deployment simulation' : 'Deploying contract to Midnight Preprod');

  const cliConfig = JSON.parse(readFileSync(PATHS.cliConfig, 'utf8'));
  log.dim(`Contract:   ${cliConfig.cli.defaultContract}`);
  log.dim(`Network:    ${PREPROD.name}`);
  log.dim(`Gas limit:  ${config.gasLimit.toLocaleString()}`);
  log.dim(`Prover:     ${config.proverUrl}`);
  log.dim(`Seed words: ${'*'.repeat(8)} (${config.seedPhrase.trim().split(/\s+/).length} words)`);

  if (DRY_RUN) {
    log.warn('DRY RUN: skipping deployment transaction');
    log.info('Remove --dry-run to execute real deployment');
    return null;
  }

  // ── Try WSL2 compact CLI ──────────────────────────────────────────────────
  const { execSync } = await import('child_process');

  let wsl2Available = false;
  try {
    execSync('wsl --status', { timeout: 5_000, stdio: 'pipe' });
    wsl2Available = true;
    log.success('WSL2 detected');
  } catch {
    log.warn('WSL2 not available from this PowerShell session');
  }

  if (wsl2Available) {
    try {
      const ver = execSync(
        'wsl bash -c "compact --version 2>/dev/null || echo NOT_FOUND"',
        { timeout: 8_000, encoding: 'utf8' }
      ).trim();

      if (ver.includes('NOT_FOUND')) {
        log.warn('compact CLI not found in WSL2');
        log.dim('Install: wsl bash -c "curl --proto=https --tlsv1.2 -LsSf https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh"');
        log.dim('Then:    wsl bash -c "compact update"');
      } else {
        log.success(`compact CLI in WSL2: ${ver}`);

        const wslRoot = execSync(
          `wsl wslpath -u "${ROOT.replace(/\\/g, '/')}"`,
          { timeout: 3_000, encoding: 'utf8' }
        ).trim();

        // Write temp env for WSL2 (only seed phrase, short-lived file)
        const tmpEnv = resolve(ROOT, '.compact-deploy.tmp');
        writeFileSync(tmpEnv, `MIDNIGHT_SEED_PHRASE="${config.seedPhrase}"\n`, { mode: 0o600 });
        const wslTmpEnv = execSync(
          `wsl wslpath -u "${tmpEnv.replace(/\\/g, '/')}"`,
          { timeout: 3_000, encoding: 'utf8' }
        ).trim();

        const deployCmd = [
          `set -a && source ${wslTmpEnv} && set +a`,
          `&& cd "${wslRoot}"`,
          `&& compact deploy`,
          `--network preprod`,
          `--contract dist/contracts/midnight_splitter.contract`,
          `--indexer "${PREPROD.indexerUrl}"`,
          `--prover "${config.proverUrl}"`,
          `--gas-limit ${config.gasLimit}`,
        ].join(' ');

        let deployOutput = '';
        try {
          deployOutput = execSync(`wsl bash -c '${deployCmd}'`, {
            timeout:  180_000,
            encoding: 'utf8',
          });
          log.success('compact deploy succeeded!');
          console.log(deployOutput);
        } finally {
          try { writeFileSync(tmpEnv, ''); } catch { /* ignore cleanup error */ }
        }

        // Parse contract address from output
        const addrMatch = deployOutput.match(
          /contract[_ ]address[:\s]+([0-9a-fA-F]{60,})/i
        );
        if (addrMatch) return addrMatch[1];

        log.warn('Could not parse contract address from output');
        log.dim('Run:  node scripts/deploy-preprod.mjs --record <CONTRACT_ADDRESS>');
        return null;
      }
    } catch (e) {
      log.error(`WSL2 deployment failed: ${e.message}`);
    }
  }

  // ── Manual instructions fallback ──────────────────────────────────────────
  console.log(`
${c.bold}Manual deployment steps (open WSL2 terminal):${c.reset}

  ${c.cyan}# 1. Install compact CLI${c.reset}
  curl --proto='=https' --tlsv1.2 -LsSf \\
    https://github.com/midnightntwrk/compact/releases/latest/download/compact-installer.sh | sh
  compact update

  ${c.cyan}# 2. Compile the contract${c.reset}
  cd /path/to/midnight-splitter
  compact compile contracts/midnight_splitter.compact --output dist/contracts

  ${c.cyan}# 3. Deploy to Preprod${c.reset}
  export MIDNIGHT_SEED_PHRASE="word1 word2 ... word24"
  compact deploy \\
    --network preprod \\
    --contract dist/contracts/midnight_splitter.contract \\
    --indexer "${PREPROD.indexerUrl}" \\
    --prover  "${config.proverUrl}" \\
    --gas-limit ${config.gasLimit}

  ${c.cyan}# 4. Record the contract address${c.reset}
  node scripts/deploy-preprod.mjs --record <CONTRACT_ADDRESS_FROM_OUTPUT>

${c.dim}Full step-by-step guide:${c.reset}  DEPLOY.md
`);

  throw new Error(
    'Manual deployment required — WSL2 compact CLI not reachable.\n' +
    'Follow the steps printed above, then run:\n' +
    '  node scripts/deploy-preprod.mjs --record <CONTRACT_ADDRESS>'
  );
}

// ── Step 6: Write deployed-address.json ──────────────────────────────────────
function recordDeployment(contractAddress, blockHeight) {
  const record = {
    contractAddress,
    contractName:     'MidnightSplitter',
    network:          PREPROD.name,
    indexerUrl:       PREPROD.indexerUrl,
    nodeRpcUrl:       PREPROD.nodeRpcUrl,
    proverUrl:        PREPROD.proverUrl,
    deployedAt:       new Date().toISOString(),
    deployedAtBlock:  blockHeight ?? 'unknown',
    compactVersion:   '0.1.0',
    explorerUrl:      `${PREPROD.explorerBase}/${contractAddress}`,
    circuits: [
      'initialize',
      'calculate_equal_split',
      'verify_solvency_proof',
      'split_equal',
      'split_weighted',
      'split_custom',
    ],
  };

  writeFileSync(PATHS.deployedAddress, JSON.stringify(record, null, 2) + '\n');
  log.success('Wrote contracts/deployed-address.json');
  log.dim(`Address: ${contractAddress}`);
  log.dim(`Explorer: ${record.explorerUrl}`);
  return record;
}

// ── Step 7: Patch midnightContract.ts ────────────────────────────────────────
function updateContractService(contractAddress) {
  const src     = readFileSync(PATHS.contractService, 'utf8');
  const pattern = /export const DEFAULT_COMPACT_CONTRACT_ID = '[^']+';[^\n]*/;
  const replacement =
    `export const DEFAULT_COMPACT_CONTRACT_ID = '${contractAddress}'; // Deployed to Midnight Preprod – ${new Date().toISOString().split('T')[0]}`;

  if (!pattern.test(src)) {
    log.warn('Pattern not found in midnightContract.ts — skipping auto-update');
    log.dim(`Manually set DEFAULT_COMPACT_CONTRACT_ID = '${contractAddress}'`);
    return;
  }

  writeFileSync(PATHS.contractService, src.replace(pattern, replacement));
  log.success('Updated DEFAULT_COMPACT_CONTRACT_ID in midnightContract.ts');
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`\n${c.bold}${c.purple}🌙 Midnight Splitter — Preprod Deployment${c.reset}`);
  console.log('='.repeat(55));

  if (DRY_RUN) log.warn('DRY RUN MODE — no transactions will be submitted\n');

  // --record <address> shortcut — skip deployment, just record address
  const recordIdx = args.indexOf('--record');
  if (recordIdx !== -1 && args[recordIdx + 1]) {
    const addr = args[recordIdx + 1];
    log.step('R', `Recording manually provided address: ${addr}`);
    const rec = recordDeployment(addr, null);
    log.step('7', 'Updating contract service file');
    updateContractService(addr);
    console.log(`\n${'='.repeat(55)}`);
    console.log(`${c.bold}${c.green}Address recorded!${c.reset}`);
    console.log(`  Explorer: ${rec.explorerUrl}`);
    console.log(`  Run: npm run contract:verify  to confirm on-chain\n`);
    return;
  }

  // Full deployment flow
  const env    = loadEnv();
  const config = loadAndValidateConfig(env);

  if (config.errors.length > 0) {
    log.warn('Configuration issues:');
    config.errors.forEach((e) => log.error(`  • ${e}`));
    if (!DRY_RUN) {
      log.info('\nCreate .env from .env.example and fill in MIDNIGHT_SEED_PHRASE');
      log.dim('cp .env.example .env');
      process.exit(1);
    }
  }

  await checkCompiledArtifacts();
  await checkNetworkEndpoints(config.proverUrl);
  const blockHeight = await queryNetworkInfo();

  const existing = await checkExistingDeployment();
  if (existing && !FORCE) {
    console.log(`\n${'='.repeat(55)}`);
    console.log(`${c.bold}${c.green}Already deployed!${c.reset}`);
    console.log(`  Address: ${c.cyan}${existing}${c.reset}`);
    console.log(`  Explorer: ${PREPROD.explorerBase}/${existing}\n`);
    process.exit(0);
  }

  const contractAddress = await deployContract(config, blockHeight);
  if (!contractAddress) return;

  log.step('6', 'Recording deployment');
  const rec = recordDeployment(contractAddress, blockHeight);

  log.step('7', 'Updating source files');
  updateContractService(contractAddress);

  console.log(`\n${'='.repeat(55)}`);
  console.log(`${c.bold}${c.green}Deployment complete!${c.reset}`);
  console.log(`  Contract:  MidnightSplitter`);
  console.log(`  Network:   Midnight Preprod`);
  console.log(`  Address:   ${c.cyan}${contractAddress}${c.reset}`);
  console.log(`  Explorer:  ${rec.explorerUrl}`);
  console.log(`  Block:     ${blockHeight ?? 'unknown'}`);
  console.log('='.repeat(55));
  console.log('\nNext steps:');
  console.log('  npm run contract:verify    — confirm on-chain');
  console.log('  git add contracts/deployed-address.json && git commit');
  console.log('  Update README.md with the contract address\n');
}

main().catch((err) => {
  console.error(`\n${c.red}${c.bold}Deployment failed:${c.reset} ${err.message}\n`);
  if (process.env.DEBUG) console.error(err.stack);
  process.exit(1);
});
