import { sepolia, mainnet, base, type Chain } from 'viem/chains';

/**
 * Default mapping of chain IDs to viem Chain objects.
 */
export const CHAIN_MAP: Record<number, Chain> = {
  1: mainnet,
  11155111: sepolia,
  8453: base,
};

/**
 * Resolve a chain ID to a viem Chain object.
 * Throws if the chain ID is not in the default map.
 */
export function resolveChain(chainId: number): Chain {
  const chain = CHAIN_MAP[chainId];
  if (!chain) {
    throw new Error(
      `Unsupported chain ID: ${chainId}. Supported: ${Object.keys(CHAIN_MAP).join(', ')}`
    );
  }
  return chain;
}
