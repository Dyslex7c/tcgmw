import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { sepolia, mainnet, arbitrum, base, polygon, optimism } from "@reown/appkit/networks";

export const projectId =
  process.env.NEXT_PUBLIC_PROJECT_ID || "b56e18d47c72ab683b10814fe9495694";

// Sepolia is the primary game network; mainnet and popular L2s ensure connected wallets are recognized
export const networks = [sepolia, mainnet, arbitrum, base, polygon, optimism] as any;

export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
  ssr: true
});

export const wagmiConfig = wagmiAdapter.wagmiConfig;
