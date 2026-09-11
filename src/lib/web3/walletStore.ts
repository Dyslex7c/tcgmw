import { formatEther } from "viem";
import { publicClient, ensureSepoliaNetwork } from "./client";
import { CONTRACT_CONFIG } from "@/lib/constants/contracts";
import { wagmiConfig } from "./wagmiConfig";
import {
  watchAccount,
  watchChainId,
  getChainId,
  getBalance,
  disconnect as wagmiDisconnect
} from "wagmi/actions";

export interface WalletState {
  address: string | null;
  chainId: number | null;
  ethBalance: number;
  isConnecting: boolean;
  isConnected: boolean;
  isCorrectNetwork: boolean;
  error: string | null;
}

type WalletListener = (state: WalletState) => void;

class WalletStore {
  private state: WalletState = {
    address: null,
    chainId: null,
    ethBalance: 0,
    isConnecting: false,
    isConnected: false,
    isCorrectNetwork: false,
    error: null
  };

  private listeners: Set<WalletListener> = new Set();
  private initialized = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.initListeners();
    }
  }

  public getState(): WalletState {
    return { ...this.state };
  }

  public subscribe(listener: WalletListener): () => void {
    this.listeners.add(listener);
    listener(this.getState());
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify() {
    const snapshot = this.getState();
    this.listeners.forEach((fn) => fn(snapshot));
  }

  private initListeners() {
    if (this.initialized) return;
    this.initialized = true;

    // 1. Listen for wagmi / Reown AppKit account state changes
    try {
      watchAccount(wagmiConfig, {
        onChange: async (account) => {
          if (account.isConnected && account.address) {
            let activeChainId: number | null = account.chainId ?? null;
            if (!activeChainId) {
              try {
                activeChainId = getChainId(wagmiConfig);
              } catch (e) {
                // ignore
              }
            }
            this.state.address = account.address;
            this.state.chainId = activeChainId;
            this.state.isConnected = true;
            this.state.isCorrectNetwork = activeChainId === CONTRACT_CONFIG.chainId;
            this.state.isConnecting = false;
            this.state.error = null;
            this.notify();
            await this.refreshBalance();
          } else if (!account.isConnected && this.state.isConnected) {
            this.state = {
              address: null,
              chainId: null,
              ethBalance: 0,
              isConnecting: false,
              isConnected: false,
              isCorrectNetwork: false,
              error: null
            };
            this.notify();
          }
        }
      });

      watchChainId(wagmiConfig, {
        onChange: async (chainId) => {
          this.state.chainId = chainId;
          this.state.isCorrectNetwork = chainId === CONTRACT_CONFIG.chainId;
          this.notify();
          await this.refreshBalance();
        }
      });
    } catch (err) {
      console.warn("Wagmi watchAccount setup:", err);
    }

    // 2. Fallback EIP-1193 listeners if window.ethereum exists
    if (typeof window !== "undefined" && (window as any).ethereum) {
      const ethereum = (window as any).ethereum;

      ethereum.on?.("accountsChanged", async (accounts: string[]) => {
        if (!accounts || accounts.length === 0) {
          this.disconnect();
        } else {
          this.state.address = accounts[0];
          this.state.isConnected = true;
          this.notify();
          await this.refreshBalance();
        }
      });

      ethereum.on?.("chainChanged", async (chainIdHex: string) => {
        const chainId = parseInt(chainIdHex, 16);
        this.state.chainId = chainId;
        this.state.isCorrectNetwork = chainId === CONTRACT_CONFIG.chainId;
        this.notify();
        await this.refreshBalance();
      });
    }
  }

  public async switchNetwork(): Promise<boolean> {
    const success = await ensureSepoliaNetwork();
    if (success) {
      this.state.chainId = CONTRACT_CONFIG.chainId;
      this.state.isCorrectNetwork = true;
      this.notify();
      await this.refreshBalance();
      return true;
    }
    return false;
  }

  public async connect(): Promise<boolean> {
    if (typeof window === "undefined") return false;

    this.state.isConnecting = true;
    this.state.error = null;
    this.notify();

    try {
      const { modal } = await import("@/context/AppKitProvider");
      await modal.open();
      this.state.isConnecting = false;
      this.notify();
      return true;
    } catch (err: any) {
      // Fallback to direct injected wallet if Reown modal has an issue
      try {
        if ((window as any).ethereum) {
          await ensureSepoliaNetwork();
          const accounts = await (window as any).ethereum.request({
            method: "eth_requestAccounts"
          });
          if (accounts && accounts.length > 0) {
            this.state.address = accounts[0];
            this.state.isConnected = true;
            this.state.isConnecting = false;
            this.notify();
            await this.refreshBalance();
            return true;
          }
        }
      } catch (injectedErr) {
        // ignore
      }

      this.state.isConnecting = false;
      this.state.error = err?.message || "Wallet connection failed";
      this.notify();
      return false;
    }
  }

  public async disconnect() {
    try {
      await wagmiDisconnect(wagmiConfig);
    } catch (e) {
      // ignore
    }
    this.state = {
      address: null,
      chainId: null,
      ethBalance: 0,
      isConnecting: false,
      isConnected: false,
      isCorrectNetwork: false,
      error: null
    };
    this.notify();
  }

  public async openAccountModal() {
    if (typeof window === "undefined") return;
    try {
      const { modal } = await import("@/context/AppKitProvider");
      await modal.open({ view: "Account" });
    } catch (e) {
      console.warn("Could not open account modal:", e);
    }
  }

  public async openNetworksModal() {
    if (typeof window === "undefined") return;
    try {
      const { modal } = await import("@/context/AppKitProvider");
      await modal.open({ view: "Networks" });
    } catch (e) {
      console.warn("Could not open networks modal:", e);
    }
  }

  public setEthBalance(balance: number) {
    if (this.state.ethBalance !== balance) {
      this.state.ethBalance = balance;
      this.notify();
    }
  }

  /**
   * Fetches the user's real SepoliaETH balance specifically from Ethereum Sepolia (Chain ID: 11155111)
   */
  public async refreshBalance() {
    if (!this.state.address) return;
    const address = this.state.address as `0x${string}`;

    // 1. First priority: Wagmi getBalance specifically on Ethereum Sepolia
    try {
      const wagmiBal = await getBalance(wagmiConfig, {
        address,
        chainId: CONTRACT_CONFIG.chainId
      });
      if (wagmiBal && typeof wagmiBal.value === "bigint") {
        const eth = parseFloat(formatEther(wagmiBal.value));
        this.state.ethBalance = eth;
        this.notify();
        return;
      }
    } catch (wagmiErr) {
      // fallback to next method
    }

    // 2. Second priority: Injected wallet provider (MetaMask, Rabby, Coinbase)
    if (typeof window !== "undefined" && (window as any).ethereum) {
      try {
        const hexBal = await (window as any).ethereum.request({
          method: "eth_getBalance",
          params: [address, "latest"]
        });
        if (hexBal) {
          const eth = parseFloat(formatEther(BigInt(hexBal)));
          this.state.ethBalance = eth;
          this.notify();
          return;
        }
      } catch (e) {
        // fallback to publicClient
      }
    }

    // 3. Third priority: viem publicClient configured for Sepolia
    try {
      const balanceWei = await publicClient.getBalance({
        address
      });
      this.state.ethBalance = parseFloat(formatEther(balanceWei));
      this.notify();
    } catch (err) {
      console.warn("Could not fetch on-chain Sepolia balance:", err);
    }
  }
}

export const walletStore = new WalletStore();

