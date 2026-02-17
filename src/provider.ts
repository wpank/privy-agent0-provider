/**
 * EIP-1193 provider backed by a Privy agentic wallet.
 *
 * Signing operations are handled by a viem WalletClient that delegates to
 * Privy's secure enclave via `createViemAccount`. Read-only RPC calls are
 * proxied directly to the configured JSON-RPC URL.
 */

import { PrivyClient } from '@privy-io/node';
import { createViemAccount } from '@privy-io/node/viem';
import { createWalletClient, http, type Hex } from 'viem';
import { resolveChain } from './chains.js';
import type { PrivyProviderConfig } from './types.js';

/**
 * Creates an EIP-1193 compatible provider backed by a Privy agentic wallet.
 *
 * The returned object satisfies the `EIP1193Provider` type expected by the
 * Agent0 SDK's `walletProvider` config option.
 *
 * @example
 * ```ts
 * import { createPrivyProvider } from 'privy-agent0-provider';
 * import { SDK } from 'agent0-sdk';
 *
 * const provider = createPrivyProvider({ ... });
 * const sdk = new SDK({ walletProvider: provider, ... });
 * ```
 */
export function createPrivyProvider(config: PrivyProviderConfig) {
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
  const rpcUrl = config.rpcUrl;
  const walletAddress = config.walletAddress;
  const chainId = config.chainId;

  const walletClient = createWalletClient({
    account,
    chain,
    transport: http(rpcUrl),
  });

  async function proxyToRpc(method: string, params?: unknown): Promise<unknown> {
    const res = await fetch(rpcUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params: params ?? [] }),
    });

    const json = (await res.json()) as { result?: unknown; error?: { message: string } };
    if (json.error) {
      throw new Error(`RPC error (${method}): ${json.error.message}`);
    }
    return json.result;
  }

  return {
    async request(args: {
      method: string;
      params?: unknown[] | Record<string, unknown>;
    }): Promise<unknown> {
      const { method, params } = args;

      switch (method) {
        case 'eth_accounts':
        case 'eth_requestAccounts':
          return [walletAddress];

        case 'eth_chainId':
          return `0x${chainId.toString(16)}`;

        case 'eth_sendTransaction': {
          const paramsList = params as unknown[];
          const tx = paramsList[0] as Record<string, unknown>;
          const hash = await walletClient.sendTransaction({
            to: tx.to as Hex | undefined,
            data: tx.data as Hex | undefined,
            value: tx.value != null ? BigInt(tx.value as string | number) : undefined,
            gas: tx.gas != null ? BigInt(tx.gas as string | number) : undefined,
            nonce: tx.nonce != null ? Number(tx.nonce) : undefined,
            chain,
          });
          return hash;
        }

        case 'personal_sign': {
          const paramsList = params as unknown[];
          const message = paramsList[0] as Hex;
          const signature = await walletClient.signMessage({ message: { raw: message } });
          return signature;
        }

        case 'eth_signTypedData_v4': {
          const paramsList = params as unknown[];
          const typedDataRaw = paramsList[1] as string | Record<string, unknown>;
          const typedData: Record<string, unknown> =
            typeof typedDataRaw === 'string' ? JSON.parse(typedDataRaw) : typedDataRaw;
          const { EIP712Domain: _, ...typesWithoutDomain } = typedData.types as Record<string, unknown>;
          const signature = await walletClient.signTypedData({
            domain: typedData.domain as Record<string, unknown>,
            types: typesWithoutDomain as Record<string, Array<{ name: string; type: string }>>,
            primaryType: (typedData.primaryType ?? typedData.primary_type) as string,
            message: typedData.message as Record<string, unknown>,
          });
          return signature;
        }

        default:
          return proxyToRpc(method, params);
      }
    },
  };
}
