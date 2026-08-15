# 🌙 Midnight Splitter

**Private Payroll & Atomic Multi-Wallet Bill Splitting with Compact Smart Contracts & Zero-Knowledge Proofs**

Midnight Splitter is a production-grade, privacy-preserving dApp built on **Midnight Network**. It combines **Zero-Knowledge (ZK) solvency circuits** written in **Compact Language (`.compact`)** with **atomic multi-recipient token settlement** compiled and deployed via **Midnight CLI (`midnight-cli`)**. Users connect via **Lace Wallet** (Midnight CAIP-372 / CIP-30), prove sufficient balance to settle a split **without revealing their actual balance on-chain**, and execute multi-wallet splits in a single atomic Compact transaction.

[![Midnight SDK](https://img.shields.io/badge/Midnight_SDK-dapp--connector--api_v4-7C3AED?style=flat-square&logo=cardano&logoColor=white)](https://midnight.network)
[![Compact DSL](https://img.shields.io/badge/Compact_DSL-v0.1.0-8B5CF6?style=flat-square)](https://docs.midnight.network)
[![Midnight CLI](https://img.shields.io/badge/Midnight_CLI-compactc-10B981?style=flat-square)](https://docs.midnight.network)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Tests](https://img.shields.io/badge/Tests-Passing-10b981?style=flat-square&logo=vitest&logoColor=white)](#tests)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

---

## 🚀 Overview

Midnight Splitter enables users to split bills, distribute team payroll, and pay grant bounties natively on Midnight Network:
- **Smart Contract Language**: **Compact DSL (`.compact`)** compiled via `compactc`
- **Developer Toolchain**: **Midnight CLI (`midnight-cli`)** for build, unit testing, and deployment
- **Wallet Provider**: **Lace Wallet** (CAIP-372 / CIP-30 DApp Connector)
- **Privacy Model**: Zero-Knowledge Solvency Proofs (`witness private_balance`)

---

## 📋 Table of Contents

- [Product Proposal](#-product-proposal-private-payroll--splits)
- [Privacy Model](#-privacy-model)
- [Compact Smart Contract (`midnight_splitter.compact`)](#-compact-smart-contract)
- [Midnight CLI Toolchain](#-midnight-cli-toolchain)
- [Lace Wallet Integration](#-lace-wallet-integration)
- [Architecture](#architecture)
- [Tests](#tests)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)

---

## 💡 Product Proposal: Private Payroll / Splits

### The Problem
When splitting bills, distributing payroll, or sharing grant payments on transparent blockchains, observers can see sender balances, recipient amounts, and payment history.

### The Solution — Midnight Splitter
Midnight Splitter solves this with **Compact ZK circuits**:

| What the sender chooses to disclose | What remains private |
|---|---|
| ✅ The ZK solvency proof (balance ≥ requirement) | 🔒 Actual sender balance |
| ✅ Recipient addresses (on-chain settlement) | 🔒 Blinding factor & witness state |
| ✅ Total split amount | 🔒 Remaining balance after split |
| ✅ Token type used | 🔒 Unshielded account history |

---

## 🔒 Privacy Model

### What an Observer CAN Learn (Public)
- That a split transaction occurred on Midnight Preprod
- The total split amount and token type
- The commitment hash `C = sha256(pack(balance, secret_r))`
- Proof verification status (`verified: true`)

### What an Observer CANNOT Learn (Private)
- Sender's actual account balance
- Sender's secret blinding factor `secret_r`
- How much excess balance remains in the wallet

---

## 📜 Compact Smart Contract

The core contract is written in **Compact DSL** located at [`contracts/midnight_splitter.compact`](file:///c:/Users/Dell/midnight%20splitter/contracts/midnight_splitter.compact):

```compact
pragma compact 0.1.0;

import CompactStandardLibrary;

export struct SplitSummary {
  total_amount: Uint,
  total_transferred: Uint,
  per_recipient_share: Uint,
  dust: Uint,
  recipient_count: Uint,
  execution_timestamp: Uint
}

export ledger total_splits_executed: Counter;
export ledger total_volume_settled: Counter;

witness private_balance(): Uint;
witness blinding_factor(): Bytes<32>;

export circuit verify_solvency_proof(
  commitment: Bytes<32>,
  required_amount: Uint
): SolvencyProof {
  let balance: Uint = private_balance();
  assert balance >= required_amount "SolvencyProofFailed: Insufficient private balance";
  ...
}

export circuit split_equal(
  recipients: Vector<Address>,
  total_amount: Uint,
  solvency_commitment: Bytes<32>
): SplitSummary {
  ...
}
```

---

## 🛠️ Midnight CLI Toolchain

Commands to build, test, and deploy using **Midnight CLI**:

```bash
# Compile Compact contract to ZK proving keys & TS bindings
npm run contract:build

# Execute Compact circuit unit tests
npm run contract:test

# Deploy Compact smart contract to Midnight Preprod
npm run contract:deploy
```

Configuration is defined in [`contracts/midnight-cli.json`](file:///c:/Users/Dell/midnight%20splitter/contracts/midnight-cli.json).

---

## 🌐 Lace Wallet Integration

Supports injected **Lace Wallet** using `@midnight-ntwrk/dapp-connector-api`:
- **API Spec**: CAIP-372 / CIP-30 DApp Connector
- **Method**: `walletApi.connect('preprod')` -> `getShieldedAddresses()`

---

## 🧪 Tests

Run test suite via Vitest:

```bash
npm test
```

Includes unit tests for:
- Midnight address validation (`mn_test...`)
- Equal split share calculations & dust retention
- ZK solvency proof verification logic
- Network endpoints & token presets

---

## 💻 Tech Stack

- **Smart Contracts**: Compact Language (`.compact`)
- **CLI / Compiler**: Midnight CLI (`midnight-cli`) & `compactc`
- **Frontend**: React 18, Vite, TypeScript, TailwindCSS
- **Wallet**: Lace Wallet (CIP-30 / CAIP-372)
- **Testing**: Vitest, JSDOM

---

## 🚀 Getting Started

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Run Vitest suite
npm test

# Build production bundle
npm run build
```
