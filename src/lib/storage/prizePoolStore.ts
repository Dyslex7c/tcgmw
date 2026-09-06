import { PrizeInflowRecord } from "@/types";

class PrizePoolStore {
  private currentSeasonPool: number = 24.85; // Initial ETH
  private currentSeason: number = 4;
  private seasonEndTime: number = Date.now() + 1000 * 60 * 60 * 24 * 18; // 18 days remaining
  private inflows: PrizeInflowRecord[] = [
    {
      hash: "0x8f2a1749920bf8c39e0117462fa189c4d9b139ec49b29e00192837bc9281a910",
      amountEth: 5.0,
      timestamp: Date.now() - 86400000 * 5,
      source: "Genesis Season 4 Bootstrap",
      contributor: "0x000000000000000000000000000000000000dEaD",
      blockNumber: 19472010
    },
    {
      hash: "0x39b20e18471c0d9238e8179234b92c8192837bc9281a9108f2a1749920bf8c3",
      amountEth: 0.01,
      timestamp: Date.now() - 86400000 * 3,
      source: "Whale Citadel Cache Purchase (20% Split)",
      contributor: "0x38Bc...71E9",
      blockNumber: 19474580
    },
    {
      hash: "0x44c9281a9108f2a1749920bf8c39e0117462fa189c4d9b139ec49b29e0019283",
      amountEth: 0.004,
      timestamp: Date.now() - 86400000 * 2,
      source: "Alpha Syndicate Pack Purchase (20% Split)",
      contributor: "0x991A...31F0",
      blockNumber: 19478120
    },
    {
      hash: "0x77e0117462fa189c4d9b139ec49b29e00192837bc9281a9108f2a1749920bf8c",
      amountEth: 0.0075,
      timestamp: Date.now() - 86400000 * 1,
      source: "Marketplace Secondary Trade Fee (2.5%)",
      contributor: "0x12Fa...990B",
      blockNumber: 19480990
    }
  ];

  private listeners: Set<(pool: number, inflows: PrizeInflowRecord[]) => void> = new Set();

  public getState() {
    return {
      currentSeasonPool: this.currentSeasonPool,
      currentSeason: this.currentSeason,
      seasonEndTime: this.seasonEndTime,
      inflows: [...this.inflows]
    };
  }

  public subscribe(fn: (pool: number, inflows: PrizeInflowRecord[]) => void): () => void {
    this.listeners.add(fn);
    fn(this.currentSeasonPool, [...this.inflows]);
    return () => {
      this.listeners.delete(fn);
    };
  }

  public recordInflow(amountEth: number, source: string, contributor: string = "0x71C...Demo") {
    this.currentSeasonPool = Number((this.currentSeasonPool + amountEth).toFixed(5));
    const rawHash = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
    const newRecord: PrizeInflowRecord = {
      hash: "0x" + rawHash,
      amountEth,
      timestamp: Date.now(),
      source,
      contributor,
      blockNumber: 19482500 + Math.floor(Math.random() * 200)
    };

    this.inflows = [newRecord, ...this.inflows];
    this.notify();
  }

  private notify() {
    this.listeners.forEach((fn) => fn(this.currentSeasonPool, [...this.inflows]));
  }
}

export const prizePoolStore = new PrizePoolStore();
