import type { Hex } from 'viem';

/**
 * Full configuration for creating a Privy-backed EIP-1193 provider
 * or viem WalletClient.
 */
export interface PrivyProviderConfig {
  /** Privy App ID (from Dashboard). */
  privyAppId: string;
  /** Privy App Secret (from Dashboard). */
  privyAppSecret: string;
  /** The Privy wallet ID. */
  walletId: string;
  /** The Ethereum address of the Privy wallet. */
  walletAddress: Hex;
  /** Base64-encoded PKCS8 P-256 authorization private key. */
  authorizationPrivateKey: string;
  /** JSON-RPC URL for read-only calls. */
  rpcUrl: string;
  /** Chain ID (e.g. 11155111 for Sepolia). */
  chainId: number;
}

/**
 * Options for creating a new Privy wallet programmatically.
 */
export interface CreateWalletOptions {
  /** Privy App ID (from Dashboard). */
  privyAppId: string;
  /** Privy App Secret (from Dashboard). */
  privyAppSecret: string;
}

/**
 * Shape of the persisted wallet file (.privy-wallet.json).
 */
export interface PersistedWallet {
  /** Privy wallet ID. */
  walletId: string;
  /** Ethereum address of the wallet. */
  address: string;
  /** Base64-encoded PKCS8 P-256 authorization private key. */
  authPrivateKey: string;
  /** Base64-encoded SPKI P-256 authorization public key. */
  authPublicKey: string;
  /** ISO 8601 timestamp of when the wallet was created. */
  createdAt: string;
}
