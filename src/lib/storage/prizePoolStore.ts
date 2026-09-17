import { PrizeInflowRecord } from "@/types";
import { publicClient, getBrowserWalletClient, prizePoolContractConfig, ensureRobinhoodNetwork } from "@/lib/web3/client";
import { formatEther, parseEther } from "viem";
import { robinhoodTestnet } from "@/lib/web3/chains";

export interface PrizePoolOnChainState {
  currentSeasonPool: number;
  currentSeason: number;
  seasonEndTime: number;
  inflows: PrizeInflowRecord[];
  isLoading: boolean;
  error: string | null;
}

type PrizePoolListener = (state: PrizePoolOnChainState) => void;

class PrizePoolStore {
  private state: PrizePoolOnChainState = {
    currentSeasonPool: 0,
    currentSeason: 1,
    seasonEndTime: Date.now() + 86400000 * 30,
    inflows: [],
    isLoading: true,
    error: null
  };

  private listeners: Set<PrizePoolListener> = new Set();
  private pollIntervalId: NodeJS.Timeout | null = null;

  constructor() {
    if (typeof window !== "undefined") {
      this.refreshFromContract();
      this.startPolling();
    }
  }

  public getState(): PrizePoolOnChainState {
    return { ...this.state };
  }

  public subscribe(fn: PrizePoolListener): () => void {
    this.listeners.add(fn);
    fn(this.getState());
    return () => {
      this.listeners.delete(fn);
    };
  }

  private notify() {
    const snapshot = this.getState();
    this.listeners.forEach((fn) => fn(snapshot));
  }

  /**
   * Reads the real on-chain prize pool state directly from Robinhood Chain Testnet
   */
  public async refreshFromContract() {
    try {
      // 1. Fetch current season pool balance in Wei
      const poolWei = (await publicClient.readContract({
        ...prizePoolContractConfig,
        functionName: "currentSeasonPool"
      })) as bigint;

      // 2. Fetch current season
      const season = (await publicClient.readContract({
        ...prizePoolContractConfig,
        functionName: "currentSeason"
      })) as bigint;

      // 3. Fetch season end timestamp
      const endTimeSec = (await publicClient.readContract({
        ...prizePoolContractConfig,
        functionName: "seasonEndTime"
      })) as bigint;

      // 4. Fetch recent inflows
      const rawInflows = (await publicClient.readContract({
        ...prizePoolContractConfig,
        functionName: "getRecentInflows",
        args: [BigInt(15)]
      })) as any[];

      const parsedInflows: PrizeInflowRecord[] = (rawInflows || []).map((inf, idx) => ({
        hash: `0x${inf.contributor.slice(2, 10)}...${inf.blockNumber}`,
        amountEth: parseFloat(formatEther(inf.amount || BigInt(0))),
        timestamp: Number(inf.timestamp) * 1000 || Date.now(),
        source: inf.source || "Protocol Allocation",
        contributor: inf.contributor,
        blockNumber: Number(inf.blockNumber)
      }));

      this.state = {
        currentSeasonPool: parseFloat(formatEther(poolWei)),
        currentSeason: Number(season),
        seasonEndTime: Number(endTimeSec) * 1000,
        inflows: parsedInflows,
        isLoading: false,
        error: null
      };

      this.notify();
    } catch (err: any) {
      console.warn("Prize pool on-chain read:", err);
      this.state.isLoading = false;
      this.state.error = err?.message || "Failed to read on-chain prize pool";
      this.notify();
    }
  }

  /**
   * Allows any player to donate or bootstrap the on-chain prize pool with Robinhood ETH
   */
  public async donateToPrizePool(amountEth: number, senderAddress: `0x${string}`) {
    const isRobinhood = await ensureRobinhoodNetwork();
    if (!isRobinhood) {
      throw new Error("Please connect your wallet to Robinhood Chain Testnet.");
    }

    const walletClient = await getBrowserWalletClient();
    if (!walletClient) {
      throw new Error("No Web3 wallet found.");
    }

    const valueWei = parseEther(amountEth.toString());
    const hash = await (walletClient as any).writeContract({
      ...prizePoolContractConfig,
      functionName: "recordInflow",
      args: ["Direct Player Donation"],
      value: valueWei,
      account: senderAddress,
      chain: robinhoodTestnet,
      gas: BigInt(150_000)
    });

    await publicClient.waitForTransactionReceipt({ hash });
    await this.refreshFromContract();
    return hash;
  }

  private startPolling() {
    if (this.pollIntervalId) return;
    this.pollIntervalId = setInterval(() => {
      this.refreshFromContract();
    }, 12000);
  }
}

export const prizePoolStore = new PrizePoolStore();
