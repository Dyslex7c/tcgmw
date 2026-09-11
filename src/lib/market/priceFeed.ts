import { AssetSymbol, LivePriceData } from "@/types";

// Asset ticker mapping for live real-time Binance 24hr API
const BINANCE_TICKER_MAP: Partial<Record<AssetSymbol, string>> = {
  BTC: "BTCUSDT",
  ETH: "ETHUSDT",
  SOL: "SOLUSDT",
  DOGE: "DOGEUSDT",
  AVAX: "AVAXUSDT",
  LINK: "LINKUSDT",
  BNB: "BNBUSDT",
  PEPE: "1000PEPEUSDT",
  NEAR: "NEARUSDT",
  SUI: "SUIUSDT",
  ARBITRUM: "ARBUSDT",
  OPTIMISM: "OPUSDT",
  POLYGON: "POLUSDT",
  ZKSYNC: "ZKUSDT",
  COSMOS: "ATOMUSDT",
  APECHAIN: "APEUSDT",
  GNOSIS: "GNOUSDT",
  TON: "TONUSDT",
  WORLDCHAIN: "WLDUSDT",
  HEDERA: "HBARUSDT",
  CARDANO: "ADAUSDT",
  POLKADOT: "DOTUSDT",
  APTOS: "APTUSDT",
  TRON: "TRXUSDT",
  RIPPLE: "XRPUSDT",
  FANTOM: "FTMUSDT"
};

// Initial baseline prices for fast cold starts
const BASELINE_ASSET_DATA: Record<AssetSymbol, { name: string; price: number; change24h: number }> = {
  ROBINHOOD: { name: "Robinhood", price: 21.40, change24h: 3.82 },
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
  private isFetching: boolean = false;
  private simulatedShock: Partial<Record<AssetSymbol, number>> = {};

  constructor() {
    this.prices = {} as Record<AssetSymbol, LivePriceData>;

    // Initialize state from baseline
    (Object.keys(BASELINE_ASSET_DATA) as AssetSymbol[]).forEach((symbol) => {
      const init = BASELINE_ASSET_DATA[symbol];
      const base = init.price;
      const history: number[] = [base * 0.98, base * 0.99, base * 0.995, base * 1.002, base];

      this.prices[symbol] = {
        symbol,
        price: base,
        change24h: init.change24h,
        change5m: 0,
        high24h: base * 1.04,
        low24h: base * 0.96,
        history,
        lastUpdate: Date.now()
      };
    });

    if (typeof window !== "undefined") {
      this.fetchRealMarketPrices();
      this.startRealPolling();
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
   * Fetches genuine real-time prices from the public Binance 24hr API
   */
  public async fetchRealMarketPrices() {
    if (this.isFetching) return;
    this.isFetching = true;

    try {
      const response = await fetch("https://api.binance.com/api/v3/ticker/24hr", {
        cache: "no-store"
      });

      if (!response.ok) return;

      const data: Array<{
        symbol: string;
        lastPrice: string;
        priceChangePercent: string;
        highPrice: string;
        lowPrice: string;
      }> = await response.json();

      const tickerLookup = new Map<string, { price: number; change24h: number; high: number; low: number }>();
      for (const item of data) {
        tickerLookup.set(item.symbol, {
          price: parseFloat(item.lastPrice),
          change24h: parseFloat(item.priceChangePercent),
          high: parseFloat(item.highPrice),
          low: parseFloat(item.lowPrice)
        });
      }

      let hasUpdates = false;

      (Object.keys(BINANCE_TICKER_MAP) as AssetSymbol[]).forEach((sym) => {
        const pair = BINANCE_TICKER_MAP[sym];
        if (!pair) return;

        const info = tickerLookup.get(pair);
        if (info && !isNaN(info.price) && info.price > 0) {
          // Normalize 1000PEPE to single PEPE
          const actualPrice = pair === "1000PEPEUSDT" ? info.price / 1000 : info.price;
          const current = this.prices[sym];
          const shock = this.simulatedShock[sym] || 0;
          const adjustedPrice = actualPrice * (1 + shock / 100);

          const newHistory = current ? [...current.history.slice(1), adjustedPrice] : [adjustedPrice];

          this.prices[sym] = {
            symbol: sym,
            price: Number(adjustedPrice.toFixed(sym === "PEPE" ? 8 : 2)),
            change24h: Number((info.change24h + shock * 0.7).toFixed(2)),
            change5m: current ? Number((((adjustedPrice - current.price) / current.price) * 100).toFixed(2)) : 0,
            high24h: info.high,
            low24h: info.low,
            history: newHistory,
            lastUpdate: Date.now()
          };
          hasUpdates = true;
        }
      });

      if (hasUpdates) {
        this.notify();
      }
    } catch (err) {
      // In sandbox or isolated network, keep robust fallback
      console.warn("Live crypto ticker fetch:", err);
    } finally {
      this.isFetching = false;
    }
  }

  private startRealPolling() {
    if (this.intervalId) return;
    // Poll real market feeds every 6 seconds
    this.intervalId = setInterval(() => {
      this.fetchRealMarketPrices();
    }, 6000);
  }

  /**
   * Optional manual simulator for testing extreme market movements in BattleArena
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
    this.fetchRealMarketPrices();
  }

  private notify() {
    const snapshot = this.getPrices();
    this.listeners.forEach((fn) => fn(snapshot));
  }
}

export const marketService = new MarketPriceService();
