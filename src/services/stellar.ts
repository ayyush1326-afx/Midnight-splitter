import * as freighter from '@stellar/freighter-api';
import type {
  InitialAPI,
  ConnectedAPI,
  WalletConnectedAPI,
  ConnectionStatus,
} from '@midnight-ntwrk/dapp-connector-api';
import {
  createNetworkProviders,
  getPreprodProviders,
  PREPROD_CONFIG,
  type MidnightNetworkConfig,
  type MidnightProviders,
  type PublicDataProvider,
  type ProofProvider,
  type ContractState,
  type NetworkId,
} from '@midnight-ntwrk/midnight-js-network-provider';
import { TokenInfo, SavedGroup } from '../types';

// ── Re-export Midnight SDK types for use in other modules ──────────────────────
export type {
  InitialAPI,
  ConnectedAPI,
  WalletConnectedAPI,
  ConnectionStatus,
  MidnightNetworkConfig,
  MidnightProviders,
  PublicDataProvider,
  ProofProvider,
  ContractState,
  NetworkId,
};

/**
 * Shared Midnight Preprod network providers (public data + ZK proof provider).
 * Initialized lazily on first access via getPreprodProviders().
 */
export { createNetworkProviders, getPreprodProviders, PREPROD_CONFIG };

export const STELLAR_TESTNET_HORIZON = 'https://horizon-testnet.stellar.org';
export const STELLAR_TESTNET_SOROBAN_RPC = 'https://soroban-testnet.stellar.org';
export const DEFAULT_CONTRACT_ID = 'CDG63NAWGK3CSAVXO7KNCV7ONGLUAXTY2JNOOPIHQNCL5ZDRZEUXEWIQ';

export const SUPPORTED_TOKENS: TokenInfo[] = [
  {
    symbol: 'XLM',
    name: 'Stellar Lumens (Native)',
    address: 'native',
    isNative: true,
    decimals: 7,
    icon: '✦',
    balance: '4,850.50',
    faucetSupported: true,
  },
  {
    symbol: 'USDC',
    name: 'USD Coin (Circle Testnet)',
    address: 'CBIELTK6YBZJU5UP2WWQEUCYKLPU6AUNZ2BQ4WWUGFY2ZB65GSKFUSDC',
    isNative: false,
    decimals: 7,
    icon: '$',
    balance: '1,250.00',
    faucetSupported: true,
  },
  {
    symbol: 'EURC',
    name: 'Euro Coin (Circle Testnet)',
    address: 'CAQCG52L2ROC5CM6OXEROIOGQK5GOGJ2XW6O574G2W3L45OEURCTEST',
    isNative: false,
    decimals: 7,
    icon: '€',
    balance: '890.00',
    faucetSupported: true,
  },
  {
    symbol: 'CUSTOM',
    name: 'Custom Soroban Token',
    address: '',
    isNative: false,
    decimals: 7,
    icon: '⚡',
    balance: '0.00',
    faucetSupported: false,
  },
];

export const PRESET_GROUPS: SavedGroup[] = [
  {
    id: 'grp-dinner',
    name: '🍣 Midnight Dinner Crew',
    description: '4-way equal split for late-night ramen & sushi',
    category: 'Dining',
    recipients: [
      { address: 'GAT6E47IWY7ZPWZVRFLTXQ26W7G3E5R6WQX5E3L2A56QWE7R8TY90123', nickname: 'Alex (Ramen Master)' },
      { address: 'GBY7F58JXZ8AQXAWSGMUYR37X8H4F6S7XRY6F4M3B67RXF8S9UZ01234', nickname: 'Maya (Designer)' },
      { address: 'GCZ8G69KYA9BRYBXTHNVZS48Y9I5G7T8YSZ7G5N4C78SYG9T0VA12345', nickname: 'Liam (Smart Contracts)' },
      { address: 'GDA9H70LZB0CSZCYUIOWAT59Z0J6H8U9ZTA8H6O5D89TZH0U1WB23456', nickname: 'Zoe (Frontend Dev)' },
    ],
    createdAt: '2026-08-01',
  },
  {
    id: 'grp-rent',
    name: '🏠 Loft Rent & Fiber Wifi',
    description: 'Monthly 3-way equal split with roommate nicknames',
    category: 'Rent & Utilities',
    recipients: [
      { address: 'GBX7N92KHY8ZPWWVRLTXQ26W7G3E5R6WQX5E3L2A56QWE7R8TY91111', nickname: 'Roommate Dave (Master Bed)' },
      { address: 'GCK8M14JXZ8AQXAWSGMUYR37X8H4F6S7XRY6F4M3B67RXF8S9UZ2222', nickname: 'Roommate Sara (Balcony)' },
      { address: 'GDM9P35KYA9BRYBXTHNVZS48Y9I5G7T8YSZ7G5N4C78SYG9T0VA3333', nickname: 'Roommate Jin (Guest Room)' },
    ],
    createdAt: '2026-08-03',
  },
  {
    id: 'grp-grants',
    name: '🚀 Soroban Hackathon Bounty',
    description: 'Weighted 50% / 30% / 20% team prize distribution',
    category: 'Grants & Team',
    recipients: [
      { address: 'GBF5H29LXA8CPYBWTHNUZS48Y9I5G7T8YSZ7G5N4C78SYG9T0VA4444', nickname: 'Lead Architect', percentage: 50 },
      { address: 'GCT8M92KHY8ZPWWVRLTXQ26W7G3E5R6WQX5E3L2A56QWE7R8TY95555', nickname: 'Security Auditor', percentage: 30 },
      { address: 'GDL4P35KYA9BRYBXTHNVZS48Y9I5G7T8YSZ7G5N4C78SYG9T0VA6666', nickname: 'Community Lead', percentage: 20 },
    ],
    createdAt: '2026-08-05',
  },
];

// Helper to validate Stellar Public Key (starts with G, 56 alphanumeric chars)
export function isValidStellarAddress(addr: string): boolean {
  if (!addr) return false;
  const clean = addr.trim();
  return clean.length === 56 && clean.startsWith('G') && /^[A-Z2-7]{56}$/.test(clean);
}

// Helper to validate Cardano / Midnight address (starts with addr_test, mn_test, or G)
export function isValidMultiChainAddress(addr: string): boolean {
  if (!addr) return false;
  const clean = addr.trim();
  if (isValidStellarAddress(clean)) return true;
  if (clean.startsWith('addr_test') || clean.startsWith('addr') || clean.startsWith('mn_test') || clean.startsWith('mn1')) {
    return clean.length >= 30;
  }
  return clean.length >= 20;
}

// Generate random mock Stellar public key
export function generateRandomStellarAddress(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = 'G';
  for (let i = 0; i < 55; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Generate mock Lace / Midnight address
export function generateRandomMidnightAddress(): string {
  const chars = '0123456789abcdefghijklmnopqrstuvwxyz';
  let result = 'mn_test1';
  for (let i = 0; i < 48; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Shorten address for UI badge (e.g. GAT6...0123 or mn_test1...99aa)
export function shortenAddress(addr: string, chars = 4): string {
  if (!addr) return '';
  if (addr.length <= chars * 2 + 3) return addr;
  return `${addr.slice(0, chars + 4)}...${addr.slice(-chars)}`;
}

// Check Freighter wallet availability
export async function checkFreighterAvailable(): Promise<boolean> {
  try {
    if (typeof freighter.isConnected === 'function') {
      const res = await freighter.isConnected();
      return !!res;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Discovers Midnight DApp Connector wallets (Lace / 1AM) via the typed
 * @midnight-ntwrk/dapp-connector-api InitialAPI injected at window.midnight.
 *
 * The DApp Connector API (CAIP-372 draft) injects wallets as:
 *   window.midnight.<uuid>  →  InitialAPI
 *
 * @returns The first discovered InitialAPI, or null if none installed.
 */
function discoverMidnightWallet(): InitialAPI | null {
  try {
    if (typeof window === 'undefined') return null;
    const midnight = (window as Record<string, any>).midnight;
    if (!midnight) return null;

    // Iterate UUID-keyed wallet instances (CAIP-372 pattern)
    for (const key of Object.keys(midnight)) {
      const candidate = midnight[key] as Partial<InitialAPI>;
      if (
        candidate &&
        typeof candidate.connect === 'function' &&
        typeof candidate.apiVersion === 'string'
      ) {
        return candidate as InitialAPI;
      }
    }

    // Legacy: window.midnight.mnLace (older Lace extension)
    if (typeof midnight.mnLace?.enable === 'function') {
      return null; // handled separately below
    }
    return null;
  } catch {
    return null;
  }
}

// Check Lace / Midnight wallet availability via DApp Connector API or legacy CIP-30
export async function checkLaceAvailable(): Promise<boolean> {
  try {
    if (typeof window === 'undefined') return false;
    // Check for CAIP-372 compliant Midnight wallet
    if (discoverMidnightWallet() !== null) return true;
    const cardano = (window as any).cardano;
    const midnight = (window as any).midnight;
    if (midnight?.mnLace || midnight?.lace) return true;
    if (cardano?.lace) return true;
    return false;
  } catch {
    return false;
  }
}

/**
 * Queries the MidnightSplitter contract state on Midnight Preprod using the
 * @midnight-ntwrk/midnight-js-network-provider public data provider.
 */
export async function queryContractState(
  contractAddress: string = DEFAULT_CONTRACT_ID
): Promise<ContractState | null> {
  const { publicDataProvider } = getPreprodProviders();
  return publicDataProvider.queryContractState(contractAddress);
}

/**
 * Connect Lace wallet via @midnight-ntwrk/dapp-connector-api (CAIP-372 / CIP-30).
 *
 * Priority:
 *   1. CAIP-372 compliant Midnight DApp Connector API (InitialAPI.connect)
 *   2. Legacy window.midnight.mnLace.enable() (older Lace builds)
 *   3. Legacy window.cardano.lace.enable() (Cardano CIP-30)
 *   4. Simulated fallback address for demo / Preprod testing
 */
export async function connectLace(): Promise<{ address: string; provider: 'lace'; network: string; error?: string }> {
  try {
    if (typeof window === 'undefined') {
      return { address: '', provider: 'lace', network: 'Midnight Preprod', error: 'Window context missing' };
    }

    // ── 1. Try CAIP-372 Midnight DApp Connector API ──────────────────────────
    const walletApi: InitialAPI | null = discoverMidnightWallet();
    if (walletApi) {
      const connected: ConnectedAPI = await walletApi.connect('preprod');
      // WalletConnectedAPI: get shielded address (Midnight Preprod)
      const walletConnected: WalletConnectedAPI = connected;
      try {
        const { shieldedAddress } = await walletConnected.getShieldedAddresses();
        if (shieldedAddress) {
          return { address: shieldedAddress, provider: 'lace', network: 'Midnight Preprod' };
        }
      } catch {
        // getUnshieldedAddress fallback
        try {
          const { unshieldedAddress } = await walletConnected.getUnshieldedAddress();
          if (unshieldedAddress) {
            return { address: unshieldedAddress, provider: 'lace', network: 'Midnight Preprod' };
          }
        } catch { /* fall through */ }
      }
    }

    const cardano = (window as any).cardano;
    const midnight = (window as any).midnight;

    // ── 2. Legacy: window.midnight.mnLace (older Lace extension) ─────────────
    if (midnight?.mnLace) {
      const api = await midnight.mnLace.enable();
      const addrs = await api.getUsedAddresses?.();
      if (addrs && addrs.length > 0) {
        return { address: addrs[0], provider: 'lace', network: 'Midnight Preprod' };
      }
    }

    // ── 3. Legacy: Cardano Lace CIP-30 ───────────────────────────────────────
    if (cardano?.lace) {
      const api = await cardano.lace.enable();
      const addrs = await api.getUsedAddresses?.();
      if (addrs && addrs.length > 0) {
        return { address: addrs[0], provider: 'lace', network: 'Midnight Preprod' };
      }
      const changeAddr = await api.getChangeAddress?.();
      if (changeAddr) {
        return { address: changeAddr, provider: 'lace', network: 'Midnight Preprod' };
      }
    }

    // ── 4. Fallback: simulated Midnight Preprod address ───────────────────────
    const mockLaceAddr = generateRandomMidnightAddress();
    return {
      address: mockLaceAddr,
      provider: 'lace',
      network: 'Midnight Preprod (CIP-30 Simulated)',
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'User rejected Lace wallet access';
    return { address: '', provider: 'lace', network: 'Midnight Preprod', error: errorMsg };
  }
}

// Connect Freighter
export async function connectFreighter(): Promise<{ address: string; error?: string }> {
  try {
    if (typeof freighter.requestAccess === 'function') {
      const access = await freighter.requestAccess();
      if (access && typeof access === 'object' && 'error' in access && access.error) {
        return { address: '', error: String(access.error) };
      }
      if (typeof access === 'string') {
        return { address: access };
      }
    }
    if (typeof freighter.getAddress === 'function') {
      const addrRes = await freighter.getAddress();
      if (addrRes && addrRes.address) return { address: addrRes.address };
    }
    if (typeof (freighter as any).getPublicKey === 'function') {
      const pubKey = await (freighter as any).getPublicKey();
      return { address: pubKey || '' };
    }
    return { address: '' };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'User rejected Freighter connection';
    return { address: '', error: errorMsg };
  }
}

