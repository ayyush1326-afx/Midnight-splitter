import * as freighter from '@stellar/freighter-api';
import { TokenInfo, SavedGroup } from '../types';

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

// Generate random mock Stellar public key
export function generateRandomStellarAddress(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let result = 'G';
  for (let i = 0; i < 55; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// Shorten address for UI badge (e.g. GAT6...0123)
export function shortenAddress(addr: string, chars = 4): string {
  if (!addr) return '';
  if (addr.length <= chars * 2 + 3) return addr;
  return `${addr.slice(0, chars + 1)}...${addr.slice(-chars)}`;
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
