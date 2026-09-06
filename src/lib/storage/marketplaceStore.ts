import { MarketplaceListing, Card } from "@/types";
import { BASE_CARD_CATALOG } from "@/lib/storage/mockCards";
import { prizePoolStore } from "@/lib/storage/prizePoolStore";

const INITIAL_LISTINGS: MarketplaceListing[] = [
  {
    id: "list-1",
    card: {
      ...BASE_CARD_CATALOG[2], // SOL Epic
      id: "market-sol-1",
      tokenId: 8841,
      owner: "0x8920...F992"
    },
    seller: "0x8920...F992",
    priceEth: 0.085,
    listedAt: Date.now() - 86400000 * 2,
    isActive: true
  },
  {
    id: "list-2",
    card: {
      ...BASE_CARD_CATALOG[0], // BTC Legendary Gold Foil
      id: "market-btc-1",
      tokenId: 7701,
      owner: "0x44B1...C399"
    },
    seller: "0x44B1...C399",
    priceEth: 0.45,
    listedAt: Date.now() - 86400000 * 4,
    isActive: true
  },
  {
    id: "list-3",
    card: {
      ...BASE_CARD_CATALOG[4], // DOGE Rare
      id: "market-doge-1",
      tokenId: 1204,
      owner: "0x33A0...EE21"
    },
    seller: "0x33A0...EE21",
    priceEth: 0.015,
    listedAt: Date.now() - 86400000 * 1,
    isActive: true
  },
  {
    id: "list-4",
    card: {
      ...BASE_CARD_CATALOG[3], // LINK Epic Holo
      id: "market-link-1",
      tokenId: 9940,
      owner: "0x77E1...00A9"
    },
    seller: "0x77E1...00A9",
    priceEth: 0.095,
    listedAt: Date.now() - 86400000 * 3,
    isActive: true
  },
  {
    id: "list-5",
    card: {
      ...BASE_CARD_CATALOG[7], // PEPE Rare Holo
      id: "market-pepe-1",
      tokenId: 4022,
      owner: "0x110A...BB42"
    },
    seller: "0x110A...BB42",
    priceEth: 0.045,
    listedAt: Date.now() - 86400000 * 1,
    isActive: true
  },
  {
    id: "list-6",
    card: {
      ...BASE_CARD_CATALOG[9], // SUI Rare
      id: "market-sui-1",
      tokenId: 5590,
      owner: "0x66B8...88C2"
    },
    seller: "0x66B8...88C2",
    priceEth: 0.025,
    listedAt: Date.now() - 86400000 * 5,
    isActive: true
  }
];

class MarketplaceStore {
  private listings: MarketplaceListing[] = [...INITIAL_LISTINGS];
  private listeners: Set<(listings: MarketplaceListing[]) => void> = new Set();

  public getListings(): MarketplaceListing[] {
    return [...this.listings];
  }

  public subscribe(fn: (listings: MarketplaceListing[]) => void): () => void {
    this.listeners.add(fn);
    fn([...this.listings]);
    return () => {
      this.listeners.delete(fn);
    };
  }

  public listCard(card: Card, priceEth: number, seller: string = "0x71C...Demo"): MarketplaceListing {
    const newListing: MarketplaceListing = {
      id: `list-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      card: { ...card, owner: seller },
      seller,
      priceEth,
      listedAt: Date.now(),
      isActive: true
    };
    this.listings = [newListing, ...this.listings];
    this.notify();
    return newListing;
  }

  public buyCard(listingId: string, buyer: string = "0x71C...Demo"): { success: boolean; card?: Card; feeEth?: number } {
    const listing = this.listings.find((l) => l.id === listingId && l.isActive);
    if (!listing) return { success: false };

    listing.isActive = false;

    // 2.5% protocol fee to Prize Pool
    const feeEth = Number((listing.priceEth * 0.025).toFixed(5));
    prizePoolStore.recordInflow(feeEth, "Marketplace Trade Fee (2.5%)", buyer);

    const boughtCard: Card = {
      ...listing.card,
      owner: buyer
    };

    this.notify();
    return { success: true, card: boughtCard, feeEth };
  }

  public cancelListing(listingId: string): boolean {
    const listing = this.listings.find((l) => l.id === listingId && l.isActive);
    if (!listing) return false;
    listing.isActive = false;
    this.notify();
    return true;
  }

  private notify() {
    this.listeners.forEach((fn) => fn([...this.listings]));
  }
}

export const marketplaceStore = new MarketplaceStore();
