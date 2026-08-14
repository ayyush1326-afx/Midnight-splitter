/**
 * @file stellar.test.ts
 * @description Unit tests for the Midnight Splitter wallet & address utilities
 *
 * Tests cover:
 *  1. Stellar address validation (valid G... addresses)
 *  2. Rejection of malformed / short addresses
 *  3. Random Stellar address generation shape
 *  4. Random Midnight address generation prefix
 *  5. Multi-chain address validation (Cardano addr_test, Midnight mn_test)
 *  6. Address shortening utility
 *  7. SUPPORTED_TOKENS contains required fields
 *  8. Network provider returns preprod networkId
 */

import { describe, it, expect } from 'vitest';
import {
  isValidStellarAddress,
  isValidMultiChainAddress,
  generateRandomStellarAddress,
  generateRandomMidnightAddress,
  shortenAddress,
  SUPPORTED_TOKENS,
  STELLAR_TESTNET_HORIZON,
  STELLAR_TESTNET_SOROBAN_RPC,
  DEFAULT_CONTRACT_ID,
} from '../services/stellar';
import {
  getPreprodProviders,
  PREPROD_CONFIG,
} from '../midnight/midnight-js-network-provider/index';

// ── Address Validation ─────────────────────────────────────────────────────────

describe('isValidStellarAddress', () => {
  // Valid Stellar addresses use Base32 chars: A-Z and 2-7 only
  const VALID_ADDR = 'GAAAT6IIWY7ZPWZVRFLTXQ26W7G3E5R6WQX5E3L2A56QWE7R5TY2345A';

  it('accepts a valid 56-character Stellar public key starting with G', () => {
    // Use a proper Stellar Base32 address (chars: A-Z, 2-7 only)
    expect(isValidStellarAddress(VALID_ADDR)).toBe(true);
  });

  it('rejects an address that is too short', () => {
    expect(isValidStellarAddress('GABC')).toBe(false);
  });

  it('rejects an address not starting with G', () => {
    const notG = 'AAAT6IIWY7ZPWZVRFLTXQ26W7G3E5R6WQX5E3L2A56QWE7R5TY2345AA';
    expect(isValidStellarAddress(notG)).toBe(false);
  });

  it('rejects an empty string', () => {
    expect(isValidStellarAddress('')).toBe(false);
  });

  it('rejects an address with lowercase characters', () => {
    const lower = 'gaaat6iiwy7zpwzvrfltxq26w7g3e5r6wqx5e3l2a56qwe7r5ty2345a';
    expect(isValidStellarAddress(lower)).toBe(false);
  });

  it('trims whitespace before validation', () => {
    // Use a runtime-generated address that is guaranteed valid
    const generated = generateRandomStellarAddress();
    expect(isValidStellarAddress(`  ${generated}  `)).toBe(true);
  });
});

// ── Multi-Chain Address Validation ────────────────────────────────────────────

describe('isValidMultiChainAddress', () => {
  it('accepts valid Stellar addresses', () => {
    expect(
      isValidMultiChainAddress('GAT6E47IWY7ZPWZVRFLTXQ26W7G3E5R6WQX5E3L2A56QWE7R8TY90123')
    ).toBe(true);
  });

  it('accepts Cardano testnet addresses (addr_test1...)', () => {
    expect(
      isValidMultiChainAddress('addr_test1qpu5ladslh5ze3c8swhtqfajsldnlvjvvkqhj2q98vzwmn')
    ).toBe(true);
  });

  it('accepts Midnight testnet addresses (mn_test1...)', () => {
    expect(
      isValidMultiChainAddress('mn_test1abc123def456ghi789jkl012mno345pqr678stuv')
    ).toBe(true);
  });

  it('rejects an empty string', () => {
    expect(isValidMultiChainAddress('')).toBe(false);
  });
});

// ── Address Generation ────────────────────────────────────────────────────────

describe('generateRandomStellarAddress', () => {
  it('generates a 56-character address starting with G', () => {
    const addr = generateRandomStellarAddress();
    expect(addr.length).toBe(56);
    expect(addr.startsWith('G')).toBe(true);
  });

  it('passes isValidStellarAddress validation', () => {
    const addr = generateRandomStellarAddress();
    expect(isValidStellarAddress(addr)).toBe(true);
  });

  it('generates unique addresses on successive calls', () => {
    const a = generateRandomStellarAddress();
    const b = generateRandomStellarAddress();
    // Astronomically unlikely to be equal
    expect(a).not.toBe(b);
  });
});

describe('generateRandomMidnightAddress', () => {
  it('generates an address prefixed with mn_test1', () => {
    const addr = generateRandomMidnightAddress();
    expect(addr.startsWith('mn_test1')).toBe(true);
  });

  it('generates an address of at least 30 characters', () => {
    const addr = generateRandomMidnightAddress();
    expect(addr.length).toBeGreaterThanOrEqual(30);
  });

  it('generates unique addresses on successive calls', () => {
    const a = generateRandomMidnightAddress();
    const b = generateRandomMidnightAddress();
    expect(a).not.toBe(b);
  });
});

// ── Address Shortening ────────────────────────────────────────────────────────

describe('shortenAddress', () => {
  it('shortens a long address to the expected format', () => {
    const addr = 'GAT6E47IWY7ZPWZVRFLTXQ26W7G3E5R6WQX5E3L2A56QWE7R8TY90123';
    const short = shortenAddress(addr);
    expect(short).toContain('...');
    expect(short.length).toBeLessThan(addr.length);
  });

  it('returns the original address when it is short enough', () => {
    const addr = 'GABC';
    expect(shortenAddress(addr)).toBe(addr);
  });

  it('returns empty string for an empty input', () => {
    expect(shortenAddress('')).toBe('');
  });
});

// ── Supported Tokens ──────────────────────────────────────────────────────────

describe('SUPPORTED_TOKENS', () => {
  it('contains at least 3 token entries', () => {
    expect(SUPPORTED_TOKENS.length).toBeGreaterThanOrEqual(3);
  });

  it('has XLM as the first (native) token', () => {
    expect(SUPPORTED_TOKENS[0].symbol).toBe('XLM');
    expect(SUPPORTED_TOKENS[0].isNative).toBe(true);
  });

  it('every token has required fields: symbol, name, decimals, icon', () => {
    for (const token of SUPPORTED_TOKENS) {
      expect(token.symbol).toBeDefined();
      expect(token.name).toBeDefined();
      expect(typeof token.decimals).toBe('number');
      expect(token.icon).toBeDefined();
    }
  });
});

// ── Network Constants ─────────────────────────────────────────────────────────

describe('Network constants', () => {
  it('STELLAR_TESTNET_HORIZON points to the correct endpoint', () => {
    expect(STELLAR_TESTNET_HORIZON).toBe('https://horizon-testnet.stellar.org');
  });

  it('STELLAR_TESTNET_SOROBAN_RPC points to the correct endpoint', () => {
    expect(STELLAR_TESTNET_SOROBAN_RPC).toBe('https://soroban-testnet.stellar.org');
  });

  it('DEFAULT_CONTRACT_ID is a non-empty string', () => {
    expect(DEFAULT_CONTRACT_ID.length).toBeGreaterThan(0);
  });
});

// ── Midnight Network Provider ─────────────────────────────────────────────────

describe('Midnight Network Provider (midnight-js-network-provider)', () => {
  it('getPreprodProviders returns a providers bundle with required keys', () => {
    const providers = getPreprodProviders();
    expect(providers).toBeDefined();
    expect(providers.publicDataProvider).toBeDefined();
    expect(providers.proofProvider).toBeDefined();
    expect(providers.networkId).toBe('preprod');
  });

  it('PREPROD_CONFIG has correct networkId', () => {
    expect(PREPROD_CONFIG.networkId).toBe('preprod');
  });

  it('PREPROD_CONFIG nodeEndpoint targets Midnight testnet', () => {
    expect(PREPROD_CONFIG.nodeEndpoint).toContain('midnight.network');
  });

  it('publicDataProvider.getNetworkId() returns preprod', () => {
    const { publicDataProvider } = getPreprodProviders();
    expect(publicDataProvider.getNetworkId()).toBe('preprod');
  });

  it('publicDataProvider.queryContractState() resolves with a contract state object', async () => {
    const { publicDataProvider } = getPreprodProviders();
    const state = await publicDataProvider.queryContractState('CDG63NAWGK3CSAVXO7KNCV7ONGLUAXTY2JNOOPIHQNCL5ZDRZEUXEWIQ');
    expect(state).not.toBeNull();
    expect(state!.contractAddress).toBeDefined();
    expect(typeof state!.blockHeight).toBe('number');
  });

  it('proofProvider.generateProof() resolves with proof bytes and inputs', async () => {
    const { proofProvider } = getPreprodProviders();
    const result = await proofProvider.generateProof(
      'MidnightSolvencyVerifier_v1.compact',
      { balance: 4850, blinding_r: '0xdeadbeef' },
      { split_requirement: 240, recipient_count: 4 }
    );
    expect(result.proof).toBeInstanceOf(Uint8Array);
    expect(result.proof.length).toBeGreaterThan(0);
    expect(result.provingTimeMs).toBeGreaterThan(0);
  });
});
