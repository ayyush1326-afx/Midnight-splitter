/**
 * @midnight-ntwrk/midnight-js-network-provider
 *
 * Local shim that mirrors the real Midnight.js network provider interface.
 * Provides typed wrappers for connecting a dApp to the Midnight Preprod / Testnet
 * node via WebSocket + GraphQL, following the MidnightProviders pattern.
 *
 * When the official npm package becomes available, replace this file with:
 *   import { ... } from '@midnight-ntwrk/midnight-js-network-provider';
 */

// ── Network IDs ────────────────────────────────────────────────────────────────

export type NetworkId = 'preprod' | 'mainnet' | 'undeployed';

export const MIDNIGHT_PREPROD: NetworkId = 'preprod';
export const MIDNIGHT_MAINNET: NetworkId = 'mainnet';

// ── Endpoint Configuration ─────────────────────────────────────────────────────

export interface MidnightNetworkConfig {
  /** Midnight node WebSocket RPC endpoint */
  nodeEndpoint: string;
  /** Midnight indexer GraphQL endpoint */
  indexerEndpoint: string;
  /** ZK Proof server endpoint */
  proverEndpoint: string;
  /** Network identifier */
  networkId: NetworkId;
}

/** Official Midnight Preprod network endpoints */
export const PREPROD_CONFIG: MidnightNetworkConfig = {
  nodeEndpoint:    'wss://rpc.testnet-02.midnight.network/ws',
  indexerEndpoint: 'https://indexer.testnet-02.midnight.network/api/v1/graphql',
  proverEndpoint:  'https://proves.testnet-02.midnight.network',
  networkId:       'preprod',
};

// ── Public Data Provider ───────────────────────────────────────────────────────

export interface ContractState {
  contractAddress: string;
  ledgerState: Record<string, unknown>;
  blockHeight: number;
  transactionHash?: string;
}

export interface PublicDataProvider {
  queryContractState(contractAddress: string): Promise<ContractState | null>;
  subscribeToContractUpdates(
    contractAddress: string,
    onUpdate: (state: ContractState) => void
  ): () => void;
  getNetworkId(): NetworkId;
}

// ── Proof Provider ─────────────────────────────────────────────────────────────

export interface ProofRequestResult {
  proof: Uint8Array;
  publicInputs: Record<string, unknown>;
  provingTimeMs: number;
}

export interface ProofProvider {
  generateProof(
    circuitName: string,
    privateInputs: Record<string, unknown>,
    publicInputs: Record<string, unknown>
  ): Promise<ProofRequestResult>;
}

// ── Midnight Providers (pluggable provider pattern) ────────────────────────────

export interface MidnightProviders {
  publicDataProvider: PublicDataProvider;
  proofProvider: ProofProvider;
  networkId: NetworkId;
}

// ── Network Provider Factory ───────────────────────────────────────────────────

/**
 * Creates a MidnightProviders bundle for a given network configuration.
 * In a production dApp, this calls the real Midnight RPC / indexer endpoints.
 * Here it returns a simulated provider for Preprod demo purposes.
 */
export function createNetworkProviders(
  config: MidnightNetworkConfig
): MidnightProviders {
  const publicDataProvider: PublicDataProvider = {
    async queryContractState(contractAddress: string): Promise<ContractState | null> {
      // In production: fetch from config.indexerEndpoint via GraphQL
      console.info(
        `[MidnightNetworkProvider] queryContractState(${contractAddress}) → ${config.indexerEndpoint}`
      );
      return {
        contractAddress,
        ledgerState: { initialized: true, splitCount: 0 },
        blockHeight: Math.floor(45_000_000 + Math.random() * 100_000),
      };
    },
    subscribeToContractUpdates(
      contractAddress: string,
      onUpdate: (state: ContractState) => void
    ): () => void {
      // In production: open a WebSocket subscription to config.nodeEndpoint
      console.info(
        `[MidnightNetworkProvider] subscribeToContractUpdates(${contractAddress})`
      );
      let active = true;
      const interval = setInterval(() => {
        if (!active) return;
        onUpdate({
          contractAddress,
          ledgerState: { initialized: true, splitCount: Math.floor(Math.random() * 10) },
          blockHeight: Math.floor(45_000_000 + Math.random() * 100_000),
        });
      }, 15_000);
      return () => {
        active = false;
        clearInterval(interval);
      };
    },
    getNetworkId(): NetworkId {
      return config.networkId;
    },
  };

  const proofProvider: ProofProvider = {
    async generateProof(
      circuitName: string,
      privateInputs: Record<string, unknown>,
      publicInputs: Record<string, unknown>
    ): Promise<ProofRequestResult> {
      // In production: POST to config.proverEndpoint
      console.info(
        `[MidnightNetworkProvider] generateProof(${circuitName}) → ${config.proverEndpoint}`
      );
      // Simulate proof generation delay
      await new Promise((r) => setTimeout(r, 200));
      const proofBytes = crypto.getRandomValues(new Uint8Array(64));
      return {
        proof: proofBytes,
        publicInputs,
        provingTimeMs: 180 + Math.floor(Math.random() * 100),
      };
    },
  };

  return { publicDataProvider, proofProvider, networkId: config.networkId };
}

// ── Singleton preprod provider ─────────────────────────────────────────────────

let _preprodProviders: MidnightProviders | null = null;

/** Returns a shared MidnightProviders instance for Midnight Preprod. */
export function getPreprodProviders(): MidnightProviders {
  if (!_preprodProviders) {
    _preprodProviders = createNetworkProviders(PREPROD_CONFIG);
  }
  return _preprodProviders;
}
