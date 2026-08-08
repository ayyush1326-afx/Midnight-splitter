export type SplitMode = 'equal' | 'weighted' | 'custom';

export interface TokenInfo {
  symbol: string;
  name: string;
  address: string; // Contract ID or 'native' for XLM
  isNative: boolean;
  decimals: number;
  icon: string;
  balance?: string;
  faucetSupported?: boolean;
}

export interface Recipient {
  id: string;
  address: string;
  nickname: string;
  percentage?: number; // e.g. 25 for 25%
  customAmount?: string; // in human token units
  calculatedShare?: number; // calculated preview
  isValidAddress: boolean;
  avatarSeed: string;
}

export interface SplitResultState {
  totalAmount: number;
  totalTransferred: number;
  perRecipientShare: number;
  dust: number;
  recipientCount: number;
  token: TokenInfo;
  tipAmount: number;
  gasEstimatedXlm: number;
}

export interface SavedGroup {
  id: string;
  name: string;
  description: string;
  category: 'Dining' | 'Rent & Utilities' | 'Grants & Team' | 'Travel' | 'Custom';
  recipients: Array<{
    address: string;
    nickname: string;
    percentage?: number;
    customAmount?: string;
  }>;
  createdAt: string;
}

export interface SplitReceipt {
  id: string;
  txHash: string;
  timestamp: string;
  sender: string;
  token: TokenInfo;
  mode: SplitMode;
  totalAmount: number;
  perRecipientShare: number;
  dust: number;
  recipients: Array<{
    address: string;
    nickname: string;
    amount: number;
    percentage?: number;
  }>;
  note?: string;
  network: string;
  blockLedger: number;
}

export interface SimulationLog {
  timestamp: string;
  type: 'info' | 'auth' | 'calc' | 'transfer' | 'event' | 'success' | 'warn';
  message: string;
  detail?: string;
}
