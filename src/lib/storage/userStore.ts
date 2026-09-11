import { Card, AssetSymbol, CardRarity, FoilType } from "@/types";
import { BASE_CARD_CATALOG } from "@/lib/storage/mockCards";
import { publicClient, cardContractConfig } from "@/lib/web3/client";

export interface UserProfile {
  address: string;
  isGuest: boolean;
  ethBalance: number;
  avoxBalance: number; // AVOX game reward tokens
  collection: Card[];
  deckCardIds: string[]; // 3 cards for battle
  wins: number;
  losses: number;
  ratingMMR: number;
  rankTier: "Bronze" | "Silver" | "Gold" | "Diamond" | "Crypto Whale";
}

const RARITY_MAP: Record<number, CardRarity> = {
  0: "Common",
  1: "Rare",
  2: "Epic",
  3: "Legendary"
};

const FOIL_MAP: Record<number, FoilType> = {
  0: "Standard",
  1: "Holo",
  2: "GoldFoil"
};

class UserStore {
  private profile: UserProfile = {
    address: "Not Connected",
    isGuest: false,
    ethBalance: 0,
    avoxBalance: 100,
    collection: [
      BASE_CARD_CATALOG[0], // BTC
      BASE_CARD_CATALOG[1], // ETH
      BASE_CARD_CATALOG[2]  // SOL
    ],
    deckCardIds: [
      BASE_CARD_CATALOG[0].id,
      BASE_CARD_CATALOG[1].id,
      BASE_CARD_CATALOG[2].id
    ],
    wins: 0,
    losses: 0,
    ratingMMR: 1200,
    rankTier: "Silver"
  };

  private listeners: Set<(profile: UserProfile) => void> = new Set();

  constructor() {
    if (typeof window !== "undefined") {
      this.loadSavedState();
    }
  }

  private loadSavedState() {
    try {
      const saved = localStorage.getItem("marketwars_user_profile");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.collection) && parsed.collection.length > 0) {
          this.profile.collection = parsed.collection;
          this.profile.deckCardIds = parsed.deckCardIds || this.profile.deckCardIds;
          this.profile.wins = parsed.wins || 0;
          this.profile.losses = parsed.losses || 0;
          this.profile.ratingMMR = parsed.ratingMMR || 1200;
          this.profile.avoxBalance = typeof parsed.avoxBalance === "number" ? parsed.avoxBalance : 100;
        }
      }
    } catch {
      // ignore localStorage errors
    }
  }

  private saveState() {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem("marketwars_user_profile", JSON.stringify({
        collection: this.profile.collection,
        deckCardIds: this.profile.deckCardIds,
        wins: this.profile.wins,
        losses: this.profile.losses,
        ratingMMR: this.profile.ratingMMR,
        avoxBalance: this.profile.avoxBalance
      }));
    } catch {
      // ignore
    }
  }

  public getProfile(): UserProfile {
    return { ...this.profile };
  }

  public subscribe(fn: (profile: UserProfile) => void): () => void {
    this.listeners.add(fn);
    fn(this.getProfile());
    return () => {
      this.listeners.delete(fn);
    };
  }

  public addCardsToCollection(cards: Card[]) {
    // Avoid duplicate cards by ID
    const existingIds = new Set(this.profile.collection.map((c) => c.id));
    const newUniqueCards = cards.filter((c) => !existingIds.has(c.id));

    this.profile.collection = [...newUniqueCards, ...this.profile.collection];

    // If deck has fewer than 3 cards, auto-populate deck
    if (this.profile.deckCardIds.length < 3 && this.profile.collection.length > 0) {
      this.profile.deckCardIds = this.profile.collection.slice(0, 3).map((c) => c.id);
    }

    this.saveState();
    this.notify();
  }

  public removeCardFromCollection(cardId: string) {
    this.profile.collection = this.profile.collection.filter((c) => c.id !== cardId);
    this.profile.deckCardIds = this.profile.deckCardIds.filter((id) => id !== cardId);

    // If deck emptied, select available cards
    if (this.profile.deckCardIds.length === 0 && this.profile.collection.length > 0) {
      this.profile.deckCardIds = [this.profile.collection[0].id];
    }

    this.saveState();
    this.notify();
  }

  public setDeckCardIds(ids: string[]) {
    if (ids.length <= 3) {
      this.profile.deckCardIds = ids;
      this.saveState();
      this.notify();
    }
  }

  public recordMatchResult(isWin: boolean) {
    if (isWin) {
      this.profile.wins += 1;
      this.profile.ratingMMR += 25;
      this.profile.avoxBalance = (this.profile.avoxBalance || 0) + 50;
    } else {
      this.profile.losses += 1;
      this.profile.ratingMMR = Math.max(800, this.profile.ratingMMR - 18);
    }

    if (this.profile.ratingMMR >= 2000) this.profile.rankTier = "Crypto Whale";
    else if (this.profile.ratingMMR >= 1600) this.profile.rankTier = "Diamond";
    else if (this.profile.ratingMMR >= 1300) this.profile.rankTier = "Gold";
    else if (this.profile.ratingMMR >= 1000) this.profile.rankTier = "Silver";
    else this.profile.rankTier = "Bronze";

    this.saveState();
    this.notify();
  }

  public addAvoxTokens(amount: number) {
    if (amount > 0) {
      this.profile.avoxBalance = (this.profile.avoxBalance || 0) + amount;
      this.saveState();
      this.notify();
    }
  }

  public getAvoxBalance(): number {
    return this.profile.avoxBalance || 0;
  }

  public connectCustomWallet(address: string) {
    this.profile.address = address;
    this.profile.isGuest = false;
    this.notify();
    this.syncWithOnChainCards(address);
  }

  /**
   * Syncs user cards from MarketWarsCard ERC-721 contract on Sepolia
   */
  public async syncWithOnChainCards(address: string) {
    if (!address || !address.startsWith("0x")) return;

    try {
      const balance = (await publicClient.readContract({
        ...cardContractConfig,
        functionName: "balanceOf",
        args: [address as `0x${string}`]
      })) as bigint;

      console.log(`On-chain card balance for ${address}: ${balance.toString()}`);
    } catch (e) {
      console.warn("Could not query card balance on-chain:", e);
    }
  }

  private notify() {
    const copy = this.getProfile();
    this.listeners.forEach((fn) => fn(copy));
  }
}

export const userStore = new UserStore();
