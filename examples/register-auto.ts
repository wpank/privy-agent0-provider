/**
 * Example: Register an ERC-8004 agent with auto-created Privy wallet
 *
 * On first run this creates a new Privy wallet and saves it to
 * .privy-wallet.json. On subsequent runs it reuses that wallet.
 *
 * Required env vars:
 *   PRIVY_APP_ID
 *   PRIVY_APP_SECRET
 *   PINATA_JWT
 *   RPC_URL  (optional)
 *
 * Run with: yarn example:auto
 */

import 'dotenv/config';
import { SDK } from 'agent0-sdk';
import { getOrCreateWallet, createPrivyProvider } from '../src/index.js';
import type { Hex } from 'viem';

async function main() {
  const privyAppId = process.env.PRIVY_APP_ID;
  if (!privyAppId) throw new Error('PRIVY_APP_ID not set in .env');

  const privyAppSecret = process.env.PRIVY_APP_SECRET;
  if (!privyAppSecret) throw new Error('PRIVY_APP_SECRET not set in .env');

  const pinataJwt = process.env.PINATA_JWT;
  if (!pinataJwt) throw new Error('PINATA_JWT not set in .env');

  const rpcUrl = process.env.RPC_URL || 'https://ethereum-sepolia-rpc.publicnode.com';

  // ---- Get or create wallet ------------------------------------------------
  console.log('Loading or creating Privy wallet...');
  const wallet = await getOrCreateWallet({ privyAppId, privyAppSecret });

  console.log(`  Wallet ID: ${wallet.walletId}`);
  console.log(`  Address:   ${wallet.address}`);
  console.log('');

  // ---- Create EIP-1193 provider for Agent0 SDK -----------------------------
  const provider = createPrivyProvider({
    privyAppId,
    privyAppSecret,
    walletId: wallet.walletId,
    walletAddress: wallet.address as Hex,
    authorizationPrivateKey: wallet.authPrivateKey,
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
    'An agent registered with a Privy agentic wallet',
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
