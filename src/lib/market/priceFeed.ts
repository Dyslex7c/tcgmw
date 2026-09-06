import { AssetSymbol, LivePriceData } from "@/types";

// Base price anchors for the 22 supported blockchain assets
const INITIAL_ASSET_DATA: Record<AssetSymbol, { name: string; price: number; change24h: number }> = {
  ROBINHOOD: { name: "Robinhood Chain", price: 21.40, change24h: 5.82 },
  ETH: { name: "Ethereum", price: 3480.5, change24h: 2.15 },
  ARBITRUM: { name: "Arbitrum", price: 0.54, change24h: -1.4 },
  OPTIMISM: { name: "Optimism", price: 1.45, change24h: 2.8 },
  BASE: { name: "Base", price: 2.10, change24h: 5.6 },
  AVAX: { name: "Avalanche", price: 29.4, change24h: 4.8 },
  POLYGON: { name: "Polygon", price: 0.42, change24h: 3.1 },
  BNB: { name: "BNB Chain", price: 585.0, change24h: 0.6 },
  ZKSYNC: { name: "zkSync Era", price: 0.142, change24h: 4.15 },
  MONAD: { name: "Monad", price: 12.80, change24h: 18.4 },
  COSMOS: { name: "Cosmos", price: 4.80, change24h: 0.9 },
  APECHAIN: { name: "ApeChain", price: 0.75, change24h: 12.4 },
  GNOSIS: { name: "Gnosis Chain", price: 172.50, change24h: 3.2 },
  LINEA: { name: "Linea", price: 1.85, change24h: 5.6 },
  WORLDCHAIN: { name: "World Chain", price: 1.95, change24h: 8.8 },
  HEDERA: { name: "Hedera", price: 0.054, change24h: 2.1 },
  BTC: { name: "Bitcoin", price: 65420.0, change24h: 3.42 },
  SOL: { name: "Solana", price: 152.8, change24h: 8.74 },
  DOGE: { name: "Dogecoin", price: 0.138, change24h: -1.2 },
  LINK: { name: "Chainlink", price: 14.6, change24h: 1.9 },
  PEPE: { name: "Pepe", price: 0.0000094, change24h: 14.2 },
  NEAR: { name: "Near Protocol", price: 4.95, change24h: -2.8 },
  SUI: { name: "Sui Network", price: 1.84, change24h: 6.3 },
  CARDANO: { name: "Cardano", price: 0.36, change24h: -0.8 },
  POLKADOT: { name: "Polkadot", price: 4.30, change24h: 1.2 },
  APTOS: { name: "Aptos", price: 6.85, change24h: 4.2 },
  TRON: { name: "TRON", price: 0.15, change24h: 1.1 },
  TON: { name: "Toncoin", price: 5.15, change24h: 7.9 },
  RIPPLE: { name: "XRP", price: 0.58, change24h: 2.4 },
  FANTOM: { name: "Sonic/Fantom", price: 0.48, change24h: 6.7 }
};

type PriceListener = (data: Record<AssetSymbol, LivePriceData>) => void;

class MarketPriceService {
  private prices: Record<AssetSymbol, LivePriceData>;
  private listeners: Set<PriceListener> = new Set();
  private intervalId: NodeJS.Timeout | null = null;
  private simulatedShock: Partial<Record<AssetSymbol, number>> = {}; // percent offset

  constructor() {
    this.prices = {} as Record<AssetSymbol, LivePriceData>;

    // Initialize state
    (Object.keys(INITIAL_ASSET_DATA) as AssetSymbol[]).forEach((symbol) => {
      const init = INITIAL_ASSET_DATA[symbol];
      const base = init.price;
      const history: number[] = [];
      for (let i = 20; i >= 0; i--) {
        const noise = (Math.sin(i * 0.5) + (Math.random() - 0.5) * 0.4) * (base * 0.02);
        history.push(Number((base + noise).toFixed(symbol === "PEPE" ? 8 : 2)));
      }

      this.prices[symbol] = {
        symbol,
        price: base,
        change24h: init.change24h,
        change5m: 0.2,
        high24h: base * 1.05,
        low24h: base * 0.95,
        history,
        lastUpdate: Date.now()
      };
    });

    if (typeof window !== "undefined") {
      this.startPolling();
    }
  }

  public getPrices(): Record<AssetSymbol, LivePriceData> {
    return { ...this.prices };
  }

  public getPrice(symbol: AssetSymbol): LivePriceData {
    return this.prices[symbol];
  }

  public subscribe(listener: PriceListener): () => void {
    this.listeners.add(listener);
    listener(this.getPrices());
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * Market Volatility Simulator:
   * Instantly trigger a pump or dump on any asset to test live in-game stat adjustments!
   */
  public triggerMarketShock(symbol: AssetSymbol, percentChange: number) {
    this.simulatedShock[symbol] = (this.simulatedShock[symbol] || 0) + percentChange;
    const current = this.prices[symbol];
    if (!current) return;

    const newPrice = current.price * (1 + percentChange / 100);
    const newHistory = [...current.history.slice(1), newPrice];

    this.prices[symbol] = {
      ...current,
      price: Number(newPrice.toFixed(symbol === "PEPE" ? 8 : 2)),
      change5m: Number(((current.change5m || 0) + percentChange).toFixed(2)),
      change24h: Number(((current.change24h || 0) + percentChange * 0.7).toFixed(2)),
      history: newHistory,
      lastUpdate: Date.now()
    };

    this.notify();
  }

  public resetShocks() {
    this.simulatedShock = {};
    (Object.keys(INITIAL_ASSET_DATA) as AssetSymbol[]).forEach((sym) => {
      const init = INITIAL_ASSET_DATA[sym];
      this.prices[sym].price = init.price;
      this.prices[sym].change5m = 0;
      this.prices[sym].change24h = init.change24h;
    });
    this.notify();
  }

  private startPolling() {
    if (this.intervalId) return;

    // Tick every 3.5 seconds with micro-movements
    this.intervalId = setInterval(() => {
      let updated = false;

      (Object.keys(this.prices) as AssetSymbol[]).forEach((sym) => {
        // Subtle organic random walk ±0.15%
        const deltaPct = (Math.random() - 0.49) * 0.3;
        const p = this.prices[sym];
        const nextPrice = p.price * (1 + deltaPct / 100);
        const history = [...p.history.slice(1), nextPrice];

        this.prices[sym] = {
          ...p,
          price: Number(nextPrice.toFixed(sym === "PEPE" ? 8 : 2)),
          change5m: Number((p.change5m + deltaPct * 0.8).toFixed(2)),
          change24h: Number((p.change24h + deltaPct * 0.1).toFixed(2)),
          history,
          lastUpdate: Date.now()
        };
        updated = true;
      });

      if (updated) {
        this.notify();
      }
    }, 3500);
  }

  private notify() {
    const snapshot = this.getPrices();
    this.listeners.forEach((fn) => fn(snapshot));
  }
}

export const marketService = new MarketPriceService();
