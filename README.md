# 🌙 Midnight Splitter

**Atomic Multi-Wallet Bill Splitting on Stellar Soroban**

Midnight Splitter is a premium, fintech-grade dApp that enables atomic multi-recipient token distribution on the Stellar blockchain. Built with a Soroban smart contract backend and a React + TypeScript frontend, it allows users to split payments across multiple wallets in a single atomic transaction — ensuring all transfers succeed or none do.

[![Stellar](https://img.shields.io/badge/Stellar-Soroban-7C3AED?style=for-the-badge&logo=stellar&logoColor=white)](https://stellar.org)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Rust](https://img.shields.io/badge/Rust-Soroban_SDK_27-DEA584?style=for-the-badge&logo=rust&logoColor=black)](https://soroban.stellar.org)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

## 📋 Table of Contents

- [Overview](#overview)
- [Live Contract](#live-contract)
- [Features](#features)
- [Architecture](#architecture)
- [Smart Contract](#smart-contract)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Smart Contract Deployment](#smart-contract-deployment)
- [Screenshots](#screenshots)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Splitting bills, distributing grant payouts, or sharing expenses with roommates on traditional payment rails is slow, error-prone, and non-atomic. If one transfer fails mid-batch, funds get stuck.

**Midnight Splitter** solves this by leveraging Soroban's atomic transaction model:

> **All transfers succeed, or none do.** Zero partial failures. Zero fund loss.

The app provides three splitting modes — **Equal**, **Weighted**, and **Custom** — all executed atomically in a single ledger transaction on Stellar Testnet.

---

## Live Contract

| Field | Value |
|-------|-------|
| **Contract Address** | `CDG63NAWGK3CSAVXO7KNCV7ONGLUAXTY2JNOOPIHQNCL5ZDRZEUXEWIQ` |
| **Network** | Stellar Testnet |
| **Explorer** | [View on Stellar Lab](https://lab.stellar.org/r/testnet/contract/CDG63NAWGK3CSAVXO7KNCV7ONGLUAXTY2JNOOPIHQNCL5ZDRZEUXEWIQ) |
| **Soroban SDK** | v27.0.5 |
| **WASM Target** | `wasm32v1-none` |

---

## Features

### 🔀 Three Split Modes

- **Equal Split** — Divides the total amount evenly across all recipients. Indivisible dust (remainder) stays safely in the sender's wallet.
- **Weighted Split** — Distributes funds based on basis points (10,000 bps = 100%). Perfect for team payouts where each member gets a different percentage.
- **Custom Split** — Sends explicit custom amounts to each recipient atomically in one transaction.

### 💰 Multi-Token Support

- **XLM** (Stellar Lumens — Native)
- **USDC** (USD Coin — Circle Testnet)
- **EURC** (Euro Coin — Circle Testnet)
- **Custom Soroban Token** (any SAC-compatible token by contract address)

### 🔐 Wallet Integration

- **Freighter Wallet** support via `@stellar/freighter-api`
- Connect/Disconnect with visual feedback
- Demo mode with randomly generated testnet keypairs when Freighter is not installed

### 🧰 Developer Tools

- **Split History** — Full transaction log with receipt viewer
- **Saved Groups** — One-click recipient group presets (roommates, grant teams, dinner crews)
- **Contract Inspector** — View the full Rust source code, ABI signatures, and atomicity model
- **Testnet Faucet** — Mint 1,000 XLM to your testnet wallet instantly

### 🎨 Premium UI

- Glassmorphism dark theme with cyan/purple neon accents
- Smooth micro-animations and hover effects
- Real-time visual breakdown with animated pie chart
- QR code sharing for payment requests
- Bulk CSV address import
- Sound effects with toggle control
- Light/Dark theme switching
- Fully responsive (mobile → desktop)

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                       │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐  │
│  │  Navbar   │  │ SplitterCard │  │   ToolsPage      │  │
│  │ (wallet)  │  │ (split form) │  │ (dev tools grid) │  │
│  └──────────┘  └──────┬───────┘  └──────────────────┘  │
│                       │                                 │
│              ┌────────▼────────┐                        │
│              │ VisualBreakdown │                        │
│              │ (pie chart/stats)│                        │
│              └─────────────────┘                        │
├─────────────────────────────────────────────────────────┤
│                  Stellar Services                       │
│  ┌─────────────────┐  ┌────────────────────────────┐   │
│  │ stellar.ts       │  │ soundEffects.ts            │   │
│  │ (wallet, tokens) │  │ (audio feedback)           │   │
│  └────────┬────────┘  └────────────────────────────┘   │
│           │                                             │
├───────────▼─────────────────────────────────────────────┤
│              Soroban Smart Contract (Rust)               │
│  ┌──────────────┐ ┌───────────────┐ ┌──────────────┐   │
│  │ split_equal() │ │split_weighted()│ │split_custom()│   │
│  └──────────────┘ └───────────────┘ └──────────────┘   │
│           │                                             │
│  ┌────────▼──────────────────────────────────────────┐  │
│  │         Stellar Testnet (Soroban RPC)             │  │
│  │         Atomic Transaction Execution              │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## Smart Contract

The Soroban smart contract (`contracts/midnight_splitter/src/lib.rs`) exposes three core functions:

### `split_equal(from, token, recipients, total_amount) → SplitSummary`
Divides `total_amount` evenly across all recipients. Dust (indivisible remainder) stays in the sender's account.

### `split_weighted(from, token, recipients, weights_bps, total_amount) → SplitSummary`
Distributes funds according to basis point weights. Validates that weights sum to exactly 10,000 (100.00%).

### `split_custom(from, token, payouts) → SplitSummary`
Sends explicit amounts to each recipient. All transfers happen atomically.

### `calculate_equal_split(total_amount, recipient_count) → SplitPreview`
Pure calculation helper (no state mutation) to preview the split distribution and dust amount.

### Error Handling

| Error | Code | Description |
|-------|------|-------------|
| `ZeroAmount` | 1 | Total amount must be > 0 |
| `EmptyRecipients` | 2 | At least one recipient required |
| `AmountTooSmall` | 3 | Amount too small to split evenly |
| `MismatchedWeights` | 4 | Weights count ≠ recipients count |
| `InvalidWeightsSum` | 5 | Weights don't sum to 10,000 bps |
| `InvalidPayoutAmount` | 6 | Custom payout amount ≤ 0 |
| `ZeroWeight` | 7 | Individual weight cannot be 0 |

### Atomicity Guarantee

Soroban executes the entire transfer loop inside an atomic transaction context. If **any** transfer fails (invalid recipient, insufficient balance, etc.), the **entire transaction reverts** with zero state mutation and zero fund loss.

---

## Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 18** | UI framework |
| **TypeScript** | Type safety |
| **Vite 6** | Build tool & dev server |
| **Lucide React** | Icon system |
| **qrcode.react** | QR code generation |
| **canvas-confetti** | Success celebration effects |
| **@stellar/freighter-api** | Freighter wallet integration |
| **@stellar/stellar-sdk** | Stellar blockchain SDK |

### Smart Contract
| Technology | Purpose |
|------------|---------|
| **Rust** (`no_std`) | Contract language |
| **Soroban SDK v27** | Stellar smart contract framework |
| **wasm32v1-none** | Compilation target |

---

## Getting Started

### Prerequisites

- **Node.js** 18+ and **npm**
- **Rust** 1.84+ with `wasm32v1-none` target (for contract development)
- **Stellar CLI** v27+ (for contract deployment)
- **Freighter Wallet** browser extension (optional — app works in demo mode without it)

### Installation

```bash
# Clone the repository
git clone https://github.com/ayyush1326-afx/Midnight-splitter.git
cd Midnight-splitter

# Install frontend dependencies
npm install

# Start the development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

---

## Project Structure

```
midnight-splitter/
├── contracts/
│   └── midnight_splitter/
│       ├── src/
│       │   ├── lib.rs              # Smart contract (3 split functions)
│       │   └── test.rs             # Unit tests (9 test cases)
│       ├── Cargo.toml              # Rust dependencies
│       └── test_snapshots/         # Test snapshot data
├── src/
│   ├── components/
│   │   ├── SplitterCard.tsx        # Main split configuration form
│   │   ├── VisualBreakdown.tsx     # Animated pie chart & stats
│   │   ├── Navbar.tsx              # Top nav with wallet connect
│   │   ├── ToolsPage.tsx           # Developer tools grid
│   │   ├── Footer.tsx              # App footer
│   │   ├── ReceiptModal.tsx        # Transaction receipt viewer
│   │   ├── ContractInspector.tsx   # Rust source & ABI viewer
│   │   ├── HistoryDrawer.tsx       # Transaction history sidebar
│   │   ├── BulkImportModal.tsx     # CSV address bulk import
│   │   ├── ShareModal.tsx          # QR code share link
│   │   ├── GroupsModal.tsx         # Saved recipient groups
│   │   └── SimulationSandbox.tsx   # Execution sandbox component
│   ├── services/
│   │   ├── stellar.ts              # Wallet, tokens, helpers
│   │   └── soundEffects.ts         # UI sound effects
│   ├── types/
│   │   └── index.ts                # TypeScript interfaces
│   ├── App.tsx                     # Root application component
│   ├── main.tsx                    # React entry point
│   └── index.css                   # Global design system
├── index.html                      # HTML entry point
├── package.json
├── tsconfig.json
├── vite.config.ts
└── .gitignore
```

---

## Smart Contract Deployment

### Build the Contract

```bash
cd contracts/midnight_splitter

# Build for Soroban (requires Rust 1.84+ with wasm32v1-none target)
cargo build --target wasm32v1-none --release
```

### Run Tests

```bash
cargo test
```

### Deploy to Testnet

```bash
# Generate and fund a deployer keypair
stellar keys generate deployer --network testnet --fund

# Deploy the WASM binary
stellar contract deploy \
  --wasm target/wasm32v1-none/release/midnight_splitter.wasm \
  --source deployer \
  --network testnet
```

### Invoke Contract Functions

```bash
# Preview an equal split (read-only, no auth needed)
stellar contract invoke \
  --id CDG63NAWGK3CSAVXO7KNCV7ONGLUAXTY2JNOOPIHQNCL5ZDRZEUXEWIQ \
  --network testnet \
  -- calculate_equal_split \
  --total_amount 1000 \
  --recipient_count 4

# Get contract version
stellar contract invoke \
  --id CDG63NAWGK3CSAVXO7KNCV7ONGLUAXTY2JNOOPIHQNCL5ZDRZEUXEWIQ \
  --network testnet \
  -- get_version
```

---

## Screenshots

### 🔗 Contract Deployment — Stellar Expert

The successful deployment transaction on Stellar Testnet, showing the WASM upload and contract creation:

![Stellar Expert — Deployment Transaction](screenshots/stellar-expert-transaction.png)

### 📋 Contract Explorer — Stellar Lab

The deployed contract on Stellar Lab, showing the Contract ID, creator account, WASM hash, and storage:

![Stellar Lab — Contract Explorer](screenshots/stellar-lab-contract.png)

---

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is open source and available under the [MIT License](LICENSE).

---

<p align="center">
  Built with 💜 on <a href="https://stellar.org">Stellar</a> & <a href="https://soroban.stellar.org">Soroban</a>
</p>
