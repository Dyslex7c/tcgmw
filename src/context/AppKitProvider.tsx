"use client";

import React, { ReactNode, useState } from "react";
import { createAppKit } from "@reown/appkit/react";
import { robinhood } from "@/lib/web3/chains";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";

import { projectId, networks, wagmiAdapter } from "@/lib/web3/wagmiConfig";
export { projectId, networks, wagmiAdapter };

// Neutralize Coinbase Wallet SDK telemetry to prevent external analytics fetch errors
if (typeof window !== "undefined" && !(window as any).ClientAnalytics) {
  (window as any).ClientAnalytics = {
    init: () => {},
    identify: () => {},
    PlatformName: { web: "web", ios: "ios", android: "android" },
    logEvent: () => {},
    logPageView: () => {},
    logMetric: () => {},
    logTrace: () => {},
    markStep: () => {},
    markStepOnce: () => {},
    incrementUjNavigation: () => {},
  };
}

// 4. Create metadata
const metadata = {
  name: "AVOX",
  description: "Tactical PvP Crypto TCG Powered by Real-Time Oracles and Chainlink VRF",
  url: typeof window !== "undefined" ? window.location.origin : "https://avox.app",
  icons: ["https://avatars.githubusercontent.com/u/179229932"]
};

// 5. Initialize AppKit
export const modal = createAppKit({
  adapters: [wagmiAdapter],
  networks: networks as any,
  defaultNetwork: robinhood as any,
  allowUnsupportedChain: true,
  enableReconnect: false,
  enableWalletGuide: false,
  enableCoinbase: false,
  projectId,
  metadata,
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#ea580c",
    "--w3m-color-mix": "#070A10",
    "--w3m-color-mix-strength": 40,
    "--w3m-border-radius-master": "12px",
    "--w3m-font-family": "var(--font-chakra), sans-serif"
  },
  features: {
    analytics: false,
    email: false,
    socials: false,
    swaps: false,
    onramp: false
  }
});

export function AppKitProvider({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig} reconnectOnMount={false}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
