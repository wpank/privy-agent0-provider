/**
 * Example: Register an ERC-8004 agent with an existing Privy wallet
 *
 * Uses a wallet you already created in the Privy Dashboard.
 * All config comes from env vars -- fully deterministic.
 *
 * Required env vars:
 *   PRIVY_APP_ID
 *   PRIVY_APP_SECRET
 *   PRIVY_WALLET_ID
 *   PRIVY_WALLET_ADDRESS
 *   PRIVY_AUTH_PRIVATE_KEY
 *   PINATA_JWT
 *   RPC_URL  (optional)
 *
 * Run with: yarn example:existing
 */

import 'dotenv/config';
import { SDK } from 'agent0-sdk';
import { createPrivyProvider } from '../src/index.js';
import type { Hex } from 'viem';

async function main() {
  const privyAppId = process.env.PRIVY_APP_ID;
  if (!privyAppId) throw new Error('PRIVY_APP_ID not set');

  const privyAppSecret = process.env.PRIVY_APP_SECRET;
  if (!privyAppSecret) throw new Error('PRIVY_APP_SECRET not set');

  const walletId = process.env.PRIVY_WALLET_ID;
  if (!walletId) throw new Error('PRIVY_WALLET_ID not set');

  const walletAddress = process.env.PRIVY_WALLET_ADDRESS;
  if (!walletAddress) throw new Error('PRIVY_WALLET_ADDRESS not set');

  const authKey = process.env.PRIVY_AUTH_PRIVATE_KEY;
  if (!authKey) throw new Error('PRIVY_AUTH_PRIVATE_KEY not set');

  const pinataJwt = process.env.PINATA_JWT;
  if (!pinataJwt) throw new Error('PINATA_JWT not set');

  const rpcUrl = process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';

  // ---- Create EIP-1193 provider for Agent0 SDK -----------------------------
  console.log(`Using existing Privy wallet: ${walletAddress}`);
  console.log('');

  const provider = createPrivyProvider({
    privyAppId,
    privyAppSecret,
    walletId,
    walletAddress: walletAddress as Hex,
    authorizationPrivateKey: authKey,
    rpcUrl,
    chainId: 11155111,
  });

  // ---- Initialize Agent0 SDK -----------------------------------------------
  const sdk = new SDK({
    chainId: 11155111,
    rpcUrl,
    walletProvider: provider,
    ipfs: 'pinata',
    pinataJwt,
  });

  // ---- Register agent ------------------------------------------------------
  const agent = sdk.createAgent(
    'My Agent',
    'An agent registered with an existing Privy wallet',
  );

  await agent.setA2A('https://my-agent.example.com/.well-known/agent-card.json');
  agent.setTrust(true, true, true);
  agent.setActive(false);

  console.log('Registering agent on Sepolia...');
  const txHandle = await agent.registerIPFS();
  console.log(`  Tx hash: ${txHandle.hash}`);
  console.log('  Waiting for confirmation...');
  const { result } = await txHandle.waitMined();

  console.log('');
  console.log('Agent registered!');
  console.log(`  Agent ID: ${result.agentId}`);
  console.log(`  URI:      ${result.agentURI}`);
}

main().catch((err) => {
  console.error('Error:', err.message || err);
  process.exit(1);
});
