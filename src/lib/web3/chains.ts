import { defineChain } from "viem";

/**
 * Robinhood Chain Testnet (Arbitrum Orbit L2)
 * Chain ID: 46630
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
