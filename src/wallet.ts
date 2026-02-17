/**
 * Wallet lifecycle helpers for Privy agentic wallets.
 *
 * - createWallet()      — generate a keypair and create a new wallet via Privy API
 * - loadWallet()        — read a persisted wallet from disk
 * - saveWallet()        — write a wallet to disk
 * - getOrCreateWallet() — load from disk or create + save if not found
 */

import fs from 'node:fs';
import path from 'node:path';
import { PrivyClient, generateP256KeyPair } from '@privy-io/node';
import type { CreateWalletOptions, PersistedWallet } from './types.js';

const DEFAULT_WALLET_FILE = '.privy-wallet.json';

/**
 * Create a new Privy wallet with a fresh P-256 authorization keypair.
 *
 * Calls `generateP256KeyPair()` to create an authorization key, then
 * `privy.wallets().create()` to create an Ethereum wallet owned by that key.
 *
 * @returns The wallet details including the authorization keypair.
 *
 * @example
 * ```ts
 * const wallet = await createWallet({
 *   privyAppId: process.env.PRIVY_APP_ID!,
 *   privyAppSecret: process.env.PRIVY_APP_SECRET!,
 * });
 * console.log(wallet.address); // 0x...
 * ```
 */
export async function createWallet(opts: CreateWalletOptions): Promise<PersistedWallet> {
  const privy = new PrivyClient({
    appId: opts.privyAppId,
    appSecret: opts.privyAppSecret,
  });

  const keypair = await generateP256KeyPair();

  const wallet = await privy.wallets().create({
    chain_type: 'ethereum',
    owner: { public_key: keypair.publicKey },
  });

  return {
    walletId: wallet.id,
    address: wallet.address,
    authPrivateKey: keypair.privateKey,
    authPublicKey: keypair.publicKey,
    createdAt: new Date().toISOString(),
  };
}

/**
 * Load a persisted wallet from a JSON file.
 *
 * @param filePath — Path to the wallet file. Defaults to `.privy-wallet.json`
 *                   in the current working directory.
 * @returns The wallet, or `null` if the file does not exist.
 */
export function loadWallet(filePath?: string): PersistedWallet | null {
  const resolved = path.resolve(filePath ?? DEFAULT_WALLET_FILE);
  if (!fs.existsSync(resolved)) return null;
  return JSON.parse(fs.readFileSync(resolved, 'utf-8')) as PersistedWallet;
}

/**
 * Save a wallet to a JSON file.
 *
 * @param wallet   — The wallet to persist.
 * @param filePath — Path to the wallet file. Defaults to `.privy-wallet.json`
 *                   in the current working directory.
 */
export function saveWallet(wallet: PersistedWallet, filePath?: string): void {
  const resolved = path.resolve(filePath ?? DEFAULT_WALLET_FILE);
  fs.writeFileSync(resolved, JSON.stringify(wallet, null, 2) + '\n');
}

/**
 * Load an existing wallet from disk, or create a new one and save it.
 *
 * On first call this creates a wallet via Privy's API and writes it to
 * `.privy-wallet.json`. On subsequent calls it loads from that file.
 *
 * @param opts     — Privy credentials for wallet creation.
 * @param filePath — Path to the wallet file. Defaults to `.privy-wallet.json`.
 * @returns The wallet (loaded or newly created).
 *
 * @example
 * ```ts
 * const wallet = await getOrCreateWallet({
 *   privyAppId: process.env.PRIVY_APP_ID!,
 *   privyAppSecret: process.env.PRIVY_APP_SECRET!,
 * });
 * // wallet.walletId, wallet.address, wallet.authPrivateKey are all available
 * ```
 */
export async function getOrCreateWallet(
  opts: CreateWalletOptions,
  filePath?: string
): Promise<PersistedWallet> {
  const existing = loadWallet(filePath);
  if (existing) return existing;

  const wallet = await createWallet(opts);
  saveWallet(wallet, filePath);
  return wallet;
}
