/**
 * @file zkCircuit.test.ts
 * @description Unit tests for the Midnight Zero-Knowledge Solvency Circuit
 *
 * Tests cover:
 *  1. Proof generation returns a valid ZKProofData structure
 *  2. Solvency verification passes when balance >= split requirement
 *  3. Commitment hash is deterministic in structure but randomized by blinding factor
 *  4. Insufficient balance throws an error (circuit constraint violated)
 *  5. Proof verification returns verified=true for a valid proof
 *  6. Public inputs are correctly embedded in the proof output
 *  7. Proving time is recorded and is a positive number
 *  8. Nullifier hash is unique across two separate proof generations
 */

import { describe, it, expect, beforeAll } from 'vitest';
import {
  executeZKBalanceCircuit,
  verifyZKProof,
  type CircuitProofInputs,
} from '../services/zkCircuit';
import type { ZKProofData } from '../types';

// ── Shared fixtures ────────────────────────────────────────────────────────────

const SOLVENT_INPUTS: CircuitProofInputs = {
  privateBalance: 4850.5,
  splitRequirement: 240,
  recipientCount: 4,
  tokenSymbol: 'XLM',
  senderAddress: 'GAT6E47IWY7ZPWZVRFLTXQ26W7G3E5R6WQX5E3L2A56QWE7R8TY90123',
};

const INSOLVENT_INPUTS: CircuitProofInputs = {
  privateBalance: 100,
  splitRequirement: 500,
  recipientCount: 2,
  tokenSymbol: 'XLM',
  senderAddress: 'GBY7F58JXZ8AQXAWSGMUYR37X8H4F6S7XRY6F4M3B67RXF8S9UZ01234',
};

// ── Test Suite ─────────────────────────────────────────────────────────────────

describe('Midnight ZK Solvency Circuit', () => {
  let proof: ZKProofData;

  // Generate one proof shared by multiple tests
  beforeAll(async () => {
    proof = await executeZKBalanceCircuit(SOLVENT_INPUTS);
  });

  // ── Test 1: Proof generation returns a complete ZKProofData structure ────────
  it('generates a ZKProofData with all required fields', () => {
    expect(proof).toBeDefined();
    expect(proof.proofId).toBeDefined();
    expect(proof.commitment).toBeDefined();
    expect(proof.nullifierHash).toBeDefined();
    expect(proof.statement).toBeDefined();
    expect(proof.circuitName).toBeDefined();
    expect(proof.publicInputs).toBeDefined();
    expect(proof.privacyClaim).toBeDefined();
  });

  // ── Test 2: Solvency proof is verified when balance >= split requirement ─────
  it('marks the proof as verified and solvent when sender has sufficient balance', () => {
    expect(proof.verified).toBe(true);
    expect(proof.isSolvent).toBe(true);
  });

  // ── Test 3: Public inputs are correctly embedded in proof output ─────────────
  it('embeds correct public inputs in the proof', () => {
    expect(proof.publicInputs.splitRequirement).toBe(SOLVENT_INPUTS.splitRequirement);
    expect(proof.publicInputs.tokenSymbol).toBe(SOLVENT_INPUTS.tokenSymbol);
    expect(proof.publicInputs.recipientCount).toBe(SOLVENT_INPUTS.recipientCount);
  });

  // ── Test 4: Proof ID starts with the ZK prefix ───────────────────────────────
  it('generates a proofId with the correct zk-proof prefix', () => {
    expect(proof.proofId.startsWith('zk-proof-0x')).toBe(true);
  });

  // ── Test 5: Proving time is a positive recorded duration ─────────────────────
  it('records a positive proving time in milliseconds', () => {
    expect(typeof proof.provingTimeMs).toBe('number');
    expect(proof.provingTimeMs).toBeGreaterThan(0);
  });

  // ── Test 6: Commitment hash starts with 0x ───────────────────────────────────
  it('produces a commitment hash prefixed with 0x (Pedersen commitment)', () => {
    expect(proof.commitment.startsWith('0x')).toBe(true);
    expect(proof.commitment.length).toBeGreaterThan(10);
  });

  // ── Test 7: Nullifier hash is unique across separate proof generations ────────
  it('generates unique nullifier hashes for different proof executions', async () => {
    const secondProof = await executeZKBalanceCircuit(SOLVENT_INPUTS);
    // Two runs of same inputs produce different nullifiers (random blinding factor)
    expect(proof.nullifierHash).not.toBe(secondProof.nullifierHash);
  });

  // ── Test 8: Insufficient balance throws a solvency error ─────────────────────
  it('throws a ZK Proof Failure when balance is below split requirement', async () => {
    await expect(
      executeZKBalanceCircuit(INSOLVENT_INPUTS)
    ).rejects.toThrow(/ZK Proof Failure|Insufficient funds/i);
  });

  // ── Test 9: verifyZKProof returns verified=true for a valid proof ─────────────
  it('verifyZKProof confirms a valid proof against the expected split requirement', async () => {
    const result = await verifyZKProof(proof, SOLVENT_INPUTS.splitRequirement);
    expect(result.verified).toBe(true);
    expect(result.message).toMatch(/verified/i);
  });

  // ── Test 10: verifyZKProof fails when split requirement has changed ───────────
  it('verifyZKProof rejects a proof when the split requirement does not match', async () => {
    const result = await verifyZKProof(proof, 9999); // wrong expected amount
    expect(result.verified).toBe(false);
    expect(result.message).toMatch(/mismatch|invalid|failed/i);
  });

  // ── Test 11: Circuit name identifies the correct Midnight verifier ────────────
  it('embeds the correct Midnight circuit name in the proof', () => {
    expect(proof.circuitName).toBe('MidnightSolvencyVerifier_v1.compact');
  });

  // ── Test 12: Privacy claim states balance is hidden ──────────────────────────
  it('includes a privacy claim guaranteeing balance is not disclosed', () => {
    expect(proof.privacyClaim).toMatch(/balance|reveal|hidden|without/i);
  });
});
