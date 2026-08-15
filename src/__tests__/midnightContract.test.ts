/**
 * @file midnightContract.test.ts
 * Tests for Midnight Network & Compact Contract Integration Service:
 *  1. Midnight address validation (mn_test... / hex 0x...)
 *  2. Multi-chain address validation
 *  3. Random Midnight address generation
 *  4. Equal split share calculations & indivisible dust logic
 *  5. Midnight token preset availability
 */

import { describe, it, expect } from 'vitest';
import {
  isValidMidnightAddress,
  isValidMultiChainAddress,
  generateRandomMidnightAddress,
  calculateEqualSplitShares,
  shortenAddress,
  SUPPORTED_TOKENS,
  MIDNIGHT_PREPROD_INDEXER,
  MIDNIGHT_PREPROD_RPC,
} from '../services/midnightContract';

describe('isValidMidnightAddress', () => {
  it('accepts a valid Midnight Bech32 testnet address', () => {
    const validAddr = 'mn_test1q639a7g28h9x101y202z303a404b505c606d707e808f909g';
    expect(isValidMidnightAddress(validAddr)).toBe(true);
  });

  it('accepts valid Hex 0x addresses', () => {
    const hexAddr = '0x12345678901234567890123456789012345678901234';
    expect(isValidMidnightAddress(hexAddr)).toBe(true);
  });

  it('rejects short invalid addresses', () => {
    expect(isValidMidnightAddress('mn_short')).toBe(false);
  });

  it('rejects empty address strings', () => {
    expect(isValidMidnightAddress('')).toBe(false);
  });
});

describe('generateRandomMidnightAddress', () => {
  it('generates a valid Midnight address string starting with mn_test1', () => {
    const addr = generateRandomMidnightAddress();
    expect(addr.startsWith('mn_test1')).toBe(true);
    expect(addr.length).toBeGreaterThanOrEqual(30);
  });

  it('passes isValidMidnightAddress validation', () => {
    const addr = generateRandomMidnightAddress();
    expect(isValidMidnightAddress(addr)).toBe(true);
  });
});

describe('calculateEqualSplitShares', () => {
  it('divides evenly when divisible without dust', () => {
    const { perRecipientShare, dust, totalTransferred } = calculateEqualSplitShares(100, 4);
    expect(perRecipientShare).toBe(25);
    expect(dust).toBe(0);
    expect(totalTransferred).toBe(100);
  });

  it('retains dust when indivisible', () => {
    const { perRecipientShare, dust, totalTransferred } = calculateEqualSplitShares(100, 3);
    expect(perRecipientShare).toBe(33);
    expect(dust).toBe(1);
    expect(totalTransferred).toBe(99);
  });

  it('returns zero on invalid inputs', () => {
    const { perRecipientShare, dust, totalTransferred } = calculateEqualSplitShares(0, 0);
    expect(perRecipientShare).toBe(0);
    expect(dust).toBe(0);
    expect(totalTransferred).toBe(0);
  });
});

describe('shortenAddress', () => {
  it('shortens long addresses with ellipsis', () => {
    const addr = 'mn_test1q639a7g28h9x101y202z303a404b505c606d707e808f909g';
    expect(shortenAddress(addr, 4)).toBe('mn_test1...909g');
  });

  it('returns short strings unchanged', () => {
    expect(shortenAddress('mn_123', 4)).toBe('mn_123');
  });
});

describe('Midnight Network Presets & Endpoints', () => {
  it('includes DUST as native shielded token preset', () => {
    const dustToken = SUPPORTED_TOKENS.find((t) => t.symbol === 'DUST');
    expect(dustToken).toBeDefined();
    expect(dustToken?.isNative).toBe(true);
  });

  it('MIDNIGHT_PREPROD_INDEXER points to valid GraphQL endpoint', () => {
    expect(MIDNIGHT_PREPROD_INDEXER).toContain('indexer.preprod.midnight.network');
  });

  it('MIDNIGHT_PREPROD_RPC points to valid RPC node endpoint', () => {
    expect(MIDNIGHT_PREPROD_RPC).toContain('rpc.preprod.midnight.network');
  });
});
