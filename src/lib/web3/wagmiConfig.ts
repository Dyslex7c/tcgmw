import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet, arbitrum, base, polygon, optimism } from "@reown/appkit/networks";
import { robinhoodTestnet } from "./chains";

export const projectId =
  process.env.NEXT_PUBLIC_PROJECT_ID || "b56e18d47c72ab683b10814fe9495694";

// Robinhood Chain Testnet is the primary game network
export const networks = [robinhoodTestnet, mainnet, arbitrum, base, polygon, optimism] as any;

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  ssr: true
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
