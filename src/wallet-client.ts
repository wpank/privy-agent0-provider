/**
 * Create a viem WalletClient backed by a Privy agentic wallet.
 *
 * Useful when you want the full viem interface for direct use
 * (sendTransaction, signMessage, etc.) outside of the Agent0 SDK.
 */

import { PrivyClient } from '@privy-io/node';
import { createViemAccount } from '@privy-io/node/viem';
import { createWalletClient, http, type WalletClient } from 'viem';
import { resolveChain } from './chains.js';
import type { PrivyProviderConfig } from './types.js';

/**
 * Creates a viem WalletClient backed by a Privy agentic wallet.
 *
 * @example
 * ```ts
 * import { createPrivyWalletClient } from 'privy-agent0-provider';
 *
 * const client = createPrivyWalletClient({ ... });
 * const hash = await client.sendTransaction({ to: '0x...', value: 1n });
 * ```
 */
export function createPrivyWalletClient(config: PrivyProviderConfig): WalletClient {
  const privy = new PrivyClient({
    appId: config.privyAppId,
    appSecret: config.privyAppSecret,
  });

  const account = createViemAccount(privy, {
    walletId: config.walletId,
    address: config.walletAddress,
    authorizationContext: {
      authorization_private_keys: [config.authorizationPrivateKey],
    },
  });

  const chain = resolveChain(config.chainId);

  return createWalletClient({
    account,
    chain,
    transport: http(config.rpcUrl),
  });
}
