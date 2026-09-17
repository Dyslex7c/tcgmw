import {
  createPublicClient,
  createWalletClient,
  custom,
  fallback,
  http,
  PublicClient,
  WalletClient
} from "viem";
import { robinhood, robinhoodTestnet } from "./chains";
import { CONTRACT_CONFIG } from "@/lib/constants/contracts";
import {
  AvoxCardABI,
  AvoxPackVRFABI,
  AvoxMarketplaceABI,
  AvoxPrizePoolABI
} from "@/lib/contracts/abis";

import { getWalletClient, switchChain, getChainId } from "wagmi/actions";
import { wagmiConfig, projectId } from "./wagmiConfig";

// RPC endpoints for Robinhood Chain (Chain ID: 4663)
export const ROBINHOOD_RPC_URLS = [
  CONTRACT_CONFIG.rpcUrl,
  "https://rpc.mainnet.chain.robinhood.com"
];

/**
 * Global viem Public Client for reading smart contract state on Robinhood Chain
 */
export const publicClient: PublicClient = createPublicClient({
  chain: robinhood,
  transport: fallback(ROBINHOOD_RPC_URLS.map((url) => http(url, { timeout: 10_000 })))
});

/**
 * Creates or retrieves the active wallet client (Reown AppKit, MetaMask, Rabby, Coinbase, etc.)
 */
export async function getBrowserWalletClient(): Promise<WalletClient | null> {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const client = await getWalletClient(wagmiConfig);
    if (client) {
      return client as unknown as WalletClient;
    }
  } catch (err) {
    // Fallback to window.ethereum if wagmi client is not ready
  }

  if ((window as any).ethereum) {
    return createWalletClient({
      chain: robinhood,
      transport: custom((window as any).ethereum)
    });
  }

  return null;
}

/**
 * Ensures the connected wallet is on Robinhood Chain (Chain ID: 4663)
 */
export async function ensureRobinhoodNetwork(): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  // 1. Check if wagmi is already on Robinhood Chain Mainnet (or testnet)
  try {
    const activeChainId = getChainId(wagmiConfig);
    if (activeChainId === CONTRACT_CONFIG.chainId) {
      return true;
    }
    await switchChain(wagmiConfig, { chainId: CONTRACT_CONFIG.chainId });
    return true;
  } catch (err) {
    console.warn("Wagmi switchChain error:", err);
  }

  // 2. Fallback to direct EIP-1193 provider if available
  if (!(window as any).ethereum) {
    return false;
  }

  const ethereum = (window as any).ethereum;

  try {
    const currentChainId = await ethereum.request({ method: "eth_chainId" });
    const robinhoodChainIdHex = "0x" + CONTRACT_CONFIG.chainId.toString(16);

    if (
      currentChainId &&
      (currentChainId.toLowerCase() === robinhoodChainIdHex.toLowerCase() ||
        parseInt(currentChainId, 16) === CONTRACT_CONFIG.chainId)
    ) {
      return true;
    }

    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: robinhoodChainIdHex }]
      });
      return true;
    } catch (switchError: any) {
      const isNotFound =
        switchError?.code === 4902 ||
        switchError?.data?.originalError?.code === 4902 ||
        switchError?.message?.includes("4902") ||
        switchError?.message?.toLowerCase().includes("unrecognized chain");

      if (isNotFound) {
        await ethereum.request({
          method: "wallet_addEthereumChain",
          params: [
            {
              chainId: robinhoodChainIdHex,
              chainName: CONTRACT_CONFIG.chainName,
              nativeCurrency: {
                name: "Ether",
                symbol: "ETH",
                decimals: 18
              },
              rpcUrls: [CONTRACT_CONFIG.rpcUrl],
              blockExplorerUrls: [CONTRACT_CONFIG.explorerUrl]
            }
          ]
        });
        return true;
      }
      throw switchError;
    }
  } catch (err) {
    console.error("Failed to switch/add Robinhood Chain network:", err);
    return false;
  }
}

// Aliases for network naming
export const ensureSepoliaNetwork = ensureRobinhoodNetwork;
export const ensureGameNetwork = ensureRobinhoodNetwork;

// Contract typed configurations
export const cardContractConfig = {
  address: CONTRACT_CONFIG.cardContract,
  abi: AvoxCardABI
} as const;

export const packContractConfig = {
  address: CONTRACT_CONFIG.packContract,
  abi: AvoxPackVRFABI
} as const;

export const marketplaceContractConfig = {
  address: CONTRACT_CONFIG.marketplaceContract,
  abi: AvoxMarketplaceABI
} as const;

export const prizePoolContractConfig = {
  address: CONTRACT_CONFIG.prizePoolContract,
  abi: AvoxPrizePoolABI
} as const;
