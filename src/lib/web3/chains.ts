import { defineChain } from "viem";

/**
 * Robinhood Chain Mainnet (Arbitrum Orbit L2)
 * Chain ID: 4663 (0x1237)
 * RPC: https://rpc.mainnet.chain.robinhood.com
 * Explorer: https://robinhoodchain.blockscout.com
 */
export const robinhood = defineChain({
  id: 4663,
  name: "Robinhood Chain",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.mainnet.chain.robinhood.com"]
    }
  },
  blockExplorers: {
    default: {
      name: "Robinhood Chain Explorer",
      url: "https://robinhoodchain.blockscout.com"
    }
  }
});

/**
 * Robinhood Chain Testnet (Arbitrum Orbit L2)
 * Chain ID: 46630 (0xb626)
 * RPC: https://rpc.testnet.chain.robinhood.com
 * Explorer: https://explorer.testnet.chain.robinhood.com
 */
export const robinhoodTestnet = defineChain({
  id: 46630,
  name: "Robinhood Chain Testnet",
  nativeCurrency: {
    name: "Ether",
    symbol: "ETH",
    decimals: 18
  },
  rpcUrls: {
    default: {
      http: ["https://rpc.testnet.chain.robinhood.com"]
    }
  },
  blockExplorers: {
    default: {
      name: "Robinhood Chain Explorer",
      url: "https://explorer.testnet.chain.robinhood.com"
    }
  },
  testnet: true
});
