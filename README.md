# privy-agent0-provider

Privy agentic wallet provider for the [Agent0 ERC-8004 SDK](https://sdk.ag0.xyz/docs). Register and manage on-chain AI agents without ever touching a raw private key.

Your Ethereum signing key stays in [Privy's secure enclave](https://docs.privy.io/recipes/agent-integrations/agentic-wallets) -- this library gives you an EIP-1193 provider that plugs directly into the Agent0 SDK's `walletProvider` config.

## Install

```bash
yarn add privy-agent0-provider @privy-io/node viem agent0-sdk
```

## Quick Start

```ts
import { getOrCreateWallet, createPrivyProvider } from 'privy-agent0-provider';
import { SDK } from 'agent0-sdk';

// 1. Get or create a Privy wallet (saved to .privy-wallet.json)
const wallet = await getOrCreateWallet({
  privyAppId: process.env.PRIVY_APP_ID!,
  privyAppSecret: process.env.PRIVY_APP_SECRET!,
});

// 2. Create an EIP-1193 provider
const provider = createPrivyProvider({
  privyAppId: process.env.PRIVY_APP_ID!,
  privyAppSecret: process.env.PRIVY_APP_SECRET!,
  walletId: wallet.walletId,
  walletAddress: wallet.address as `0x${string}`,
  authorizationPrivateKey: wallet.authPrivateKey,
  rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
  chainId: 11155111,
});

// 3. Use it with the Agent0 SDK
const sdk = new SDK({
  chainId: 11155111,
  rpcUrl: 'https://ethereum-sepolia-rpc.publicnode.com',
  walletProvider: provider,
  ipfs: 'pinata',
  pinataJwt: process.env.PINATA_JWT!,
});

const agent = sdk.createAgent('My Agent', 'Registered with Privy');
const tx = await agent.registerIPFS();
const { result } = await tx.waitMined();
console.log('Agent ID:', result.agentId);
```

## API

### `createPrivyProvider(config)`

Creates an EIP-1193 compatible provider for the Agent0 SDK.

Signing operations (`eth_sendTransaction`, `personal_sign`, `eth_signTypedData_v4`) are handled by a viem `WalletClient` backed by Privy's `createViemAccount`. All other RPC calls are proxied to the configured JSON-RPC URL.

**Parameters:** `PrivyProviderConfig`

| Field | Type | Description |
|---|---|---|
| `privyAppId` | `string` | Privy App ID |
| `privyAppSecret` | `string` | Privy App Secret |
| `walletId` | `string` | Privy wallet ID |
| `walletAddress` | `` `0x${string}` `` | Ethereum address |
| `authorizationPrivateKey` | `string` | Base64 PKCS8 P-256 authorization key |
| `rpcUrl` | `string` | JSON-RPC URL |
| `chainId` | `number` | Chain ID |

**Returns:** An object with a `request()` method satisfying the Agent0 SDK's `EIP1193Provider` type.

---

### `createPrivyWalletClient(config)`

Creates a viem `WalletClient` backed by a Privy wallet. Useful when you want to use viem directly instead of going through the Agent0 SDK.

**Parameters:** Same `PrivyProviderConfig` as above.

**Returns:** A viem `WalletClient`.

---

### `createWallet(opts)`

Creates a new Ethereum wallet via Privy's API with a fresh P-256 authorization keypair.

**Parameters:** `CreateWalletOptions`

| Field | Type | Description |
|---|---|---|
| `privyAppId` | `string` | Privy App ID |
| `privyAppSecret` | `string` | Privy App Secret |

**Returns:** `Promise<PersistedWallet>`

---

### `getOrCreateWallet(opts, filePath?)`

Loads a wallet from `.privy-wallet.json`, or creates a new one and saves it if the file doesn't exist.

**Parameters:**
- `opts` — `CreateWalletOptions` (Privy credentials)
- `filePath` — Optional path to the wallet file (defaults to `.privy-wallet.json`)

**Returns:** `Promise<PersistedWallet>`

---

### `loadWallet(filePath?)`

Reads a persisted wallet from disk.

**Returns:** `PersistedWallet | null`

---

### `saveWallet(wallet, filePath?)`

Writes a wallet to disk.

---

### `resolveChain(chainId)`

Maps a chain ID to a viem `Chain` object. Supports Ethereum mainnet (1), Sepolia (11155111), and Base (8453).

## How It Works

```
Your server                     Privy                        Ethereum
─────────────────────────────────────────────────────────────────────
                                                              
  authorizationPrivateKey ──▶  Privy API verifies the        
  (P-256, NOT an ETH key)      authorization signature        
                                       │                      
                               Secure enclave holds           
                               the actual ETH private key     
                                       │                      
                               Signs the transaction ──────▶  Network
```

- The **authorization key** (P-256) proves your server is allowed to request signatures
- The **Ethereum private key** (secp256k1) never leaves Privy's enclave
- You can attach **policies** in the Privy Dashboard to restrict what the wallet can do

## Examples

Copy `.env.example` to `.env` and fill in your credentials, then:

```bash
# Auto-create wallet on first run
yarn example:auto

# Use an existing wallet from env vars
yarn example:existing
```

See [`examples/`](examples/) for the full source.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `PRIVY_APP_ID` | Yes | From Privy Dashboard |
| `PRIVY_APP_SECRET` | Yes | From Privy Dashboard |
| `PRIVY_WALLET_ID` | For `existing` example | Wallet ID from Dashboard |
| `PRIVY_WALLET_ADDRESS` | For `existing` example | Wallet's Ethereum address |
| `PRIVY_AUTH_PRIVATE_KEY` | For `existing` example | Base64 PKCS8 P-256 key |
| `PINATA_JWT` | For examples | Pinata JWT for IPFS uploads |
| `RPC_URL` | No | Defaults to public Sepolia endpoint |

## License

MIT
