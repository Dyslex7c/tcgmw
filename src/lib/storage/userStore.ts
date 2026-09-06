import { Card } from "@/types";
import { INITIAL_USER_COLLECTION } from "@/lib/storage/mockCards";

export interface UserProfile {
  address: string;
  isGuest: boolean;
  ethBalance: number;
  collection: Card[];
  deckCardIds: string[]; // 3 cards for battle
  wins: number;
  losses: number;
  ratingMMR: number;
  rankTier: "Bronze" | "Silver" | "Gold" | "Diamond" | "Crypto Whale";
}

class UserStore {
  private profile: UserProfile = {
    address: "0x71C8F...39e1",
    isGuest: true,
    ethBalance: 1.5, // Pre-funded for instant gameplay & pack opens!
    collection: [...INITIAL_USER_COLLECTION],
    deckCardIds: [
      INITIAL_USER_COLLECTION[0].id, // BTC
      INITIAL_USER_COLLECTION[1].id, // ETH
      INITIAL_USER_COLLECTION[2].id  // SOL
    ],
    wins: 14,
    losses: 4,
    ratingMMR: 1680,
    rankTier: "Diamond"
  };

  private listeners: Set<(profile: UserProfile) => void> = new Set();

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
    this.profile.collection = [...cards, ...this.profile.collection];
    this.notify();
  }

  public removeCardFromCollection(cardId: string) {
    this.profile.collection = this.profile.collection.filter((c) => c.id !== cardId);
    // If it was in the deck, replace or clean
    this.profile.deckCardIds = this.profile.deckCardIds.filter((id) => id !== cardId);
    this.notify();
  }

  public setDeckCardIds(ids: string[]) {
    if (ids.length <= 3) {
      this.profile.deckCardIds = ids;
      this.notify();
    }
  }

  public deductEth(amount: number): boolean {
    if (this.profile.ethBalance < amount) return false;
    this.profile.ethBalance = Number((this.profile.ethBalance - amount).toFixed(4));
    this.notify();
    return true;
  }

  public addEth(amount: number) {
    this.profile.ethBalance = Number((this.profile.ethBalance + amount).toFixed(4));
    this.notify();
  }

  public recordMatchResult(isWin: boolean) {
    if (isWin) {
      this.profile.wins += 1;
      this.profile.ratingMMR += 25;
      this.profile.ethBalance = Number((this.profile.ethBalance + 0.002).toFixed(4)); // Victory reward!
    } else {
      this.profile.losses += 1;
      this.profile.ratingMMR = Math.max(800, this.profile.ratingMMR - 18);
    }

    if (this.profile.ratingMMR >= 2000) this.profile.rankTier = "Crypto Whale";
    else if (this.profile.ratingMMR >= 1600) this.profile.rankTier = "Diamond";
    else if (this.profile.ratingMMR >= 1300) this.profile.rankTier = "Gold";
    else if (this.profile.ratingMMR >= 1000) this.profile.rankTier = "Silver";
    else this.profile.rankTier = "Bronze";

    this.notify();
  }

  public connectCustomWallet(address: string) {
    this.profile.address = address;
    this.profile.isGuest = false;
    this.notify();
  }

  private notify() {
    const copy = this.getProfile();
    this.listeners.forEach((fn) => fn(copy));
  }
}

export const userStore = new UserStore();
