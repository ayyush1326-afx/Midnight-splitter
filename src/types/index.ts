export type SplitMode = 'equal' | 'weighted' | 'custom';
export type WalletProvider = 'lace' | 'freighter' | 'demo';

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

export interface ZKProofData {
  proofId: string;
  commitment: string;
  nullifierHash: string;
  statement: string;
  isSolvent: boolean;
  verified: boolean;
  timestamp: string;
  circuitName: string;
  provingTimeMs: number;
  verificationGas: string;
  publicInputs: {
    splitRequirement: number;
    tokenSymbol: string;
    recipientCount: number;
  };
  privacyClaim: string;
}

export interface SplitReceipt {
  id: string;
  txHash: string;
  timestamp: string;
  sender: string;
  walletProvider?: WalletProvider;
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
  zkProof?: ZKProofData;
}

export interface SimulationLog {
  timestamp: string;
  type: 'info' | 'auth' | 'calc' | 'transfer' | 'event' | 'success' | 'warn' | 'zk';
  message: string;
  detail?: string;
}

