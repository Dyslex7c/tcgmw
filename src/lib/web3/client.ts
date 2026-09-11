import {
  createPublicClient,
  createWalletClient,
  custom,
  fallback,
  http,
  PublicClient,
  WalletClient
} from "viem";
import { sepolia } from "viem/chains";
import { CONTRACT_CONFIG } from "@/lib/constants/contracts";
import {
  MarketWarsCardABI,
  MarketWarsPackVRFABI,
  MarketWarsMarketplaceABI,
  MarketWarsPrizePoolABI
} from "@/lib/contracts/abis";

import { getWalletClient, switchChain, getChainId } from "wagmi/actions";
import { wagmiConfig, projectId } from "./wagmiConfig";

// High-reliability fallback RPC endpoints for Ethereum Sepolia
export const SEPOLIA_RPC_URLS = [
  "https://gateway.tenderly.co/public/sepolia",
  "https://1rpc.io/sepolia",
  "https://ethereum-sepolia-rpc.publicnode.com"
];

/**
 * Global viem Public Client for reading smart contract state on Sepolia
 */
export const publicClient: PublicClient = createPublicClient({
  chain: sepolia,
  transport: fallback(SEPOLIA_RPC_URLS.map((url) => http(url, { timeout: 10_000 })))
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
      chain: sepolia,
      transport: custom((window as any).ethereum)
    });
  }

  return null;
}

/**
 * Ensures the connected wallet is on Ethereum Sepolia (Chain ID: 11155111 / 0xaa36a7)
 */
export async function ensureSepoliaNetwork(): Promise<boolean> {
  if (typeof window === "undefined") {
    return false;
  }

  // 1. Check if wagmi is already on Sepolia
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
    const sepoliaChainIdHex = "0x" + CONTRACT_CONFIG.chainId.toString(16);

    if (
      currentChainId &&
      (currentChainId.toLowerCase() === sepoliaChainIdHex.toLowerCase() ||
        parseInt(currentChainId, 16) === CONTRACT_CONFIG.chainId)
    ) {
      return true;
    }

    try {
      await ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: sepoliaChainIdHex }]
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
              chainId: sepoliaChainIdHex,
              chainName: CONTRACT_CONFIG.chainName,
              nativeCurrency: {
                name: "Sepolia Ether",
                symbol: "SEP",
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
    console.error("Failed to switch/add Sepolia network:", err);
    return false;
  }
}

// Contract typed configurations
export const cardContractConfig = {
  address: CONTRACT_CONFIG.cardContract,
  abi: MarketWarsCardABI
} as const;

export const packContractConfig = {
  address: CONTRACT_CONFIG.packContract,
  abi: MarketWarsPackVRFABI
} as const;

export const marketplaceContractConfig = {
  address: CONTRACT_CONFIG.marketplaceContract,
  abi: MarketWarsMarketplaceABI
} as const;

export const prizePoolContractConfig = {
  address: CONTRACT_CONFIG.prizePoolContract,
  abi: MarketWarsPrizePoolABI
} as const;
