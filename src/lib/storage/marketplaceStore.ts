import { MarketplaceListing, Card, AssetSymbol, CardRarity, FoilType } from "@/types";
import { BASE_CARD_CATALOG } from "@/lib/storage/mockCards";
import {
  publicClient,
  getBrowserWalletClient,
  marketplaceContractConfig,
  cardContractConfig,
  ensureRobinhoodNetwork
} from "@/lib/web3/client";
import { parseEther, formatEther, decodeEventLog } from "viem";
import { robinhoodTestnet } from "@/lib/web3/chains";

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

class MarketplaceStore {
  private listings: MarketplaceListing[] = [];
  private listeners: Set<(listings: MarketplaceListing[]) => void> = new Set();
  private isRefreshing = false;

  constructor() {
    if (typeof window !== "undefined") {
      this.refreshListingsFromContract();
    }
  }

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

  private notify() {
    this.listeners.forEach((fn) => fn([...this.listings]));
  }

  /**
   * Fetches real active listings from the Robinhood Chain Testnet blockchain
   */
  public async refreshListingsFromContract() {
    if (this.isRefreshing) return;
    this.isRefreshing = true;

    try {
      const currentBlock = await publicClient.getBlockNumber();
      const fromBlock = currentBlock > BigInt(10000) ? currentBlock - BigInt(10000) : BigInt(0);

      const logs = await publicClient.getLogs({
        address: marketplaceContractConfig.address,
        fromBlock,
        toBlock: "latest"
      });

      const tokenSet = new Set<bigint>();
      for (const log of logs) {
        try {
          const decoded = decodeEventLog({
            abi: marketplaceContractConfig.abi,
            data: log.data,
            topics: log.topics
          });

          if (decoded.eventName === "ItemListed") {
            tokenSet.add((decoded.args as any).tokenId);
          }
        } catch {
          // ignore non-matching logs
        }
      }

      const activeListings: MarketplaceListing[] = [];

      for (const tokenId of tokenSet) {
        try {
          const listingData = (await publicClient.readContract({
            ...marketplaceContractConfig,
            functionName: "getListing",
            args: [tokenId]
          })) as any;

          if (listingData && listingData.isActive) {
            // Verify current NFT owner
            const currentOwner = (await publicClient.readContract({
              ...cardContractConfig,
              functionName: "ownerOf",
              args: [tokenId]
            })) as string;

            if (currentOwner.toLowerCase() === listingData.seller.toLowerCase()) {
              // Fetch Card Metadata from contract
              const onChainCard = (await publicClient.readContract({
                ...cardContractConfig,
                functionName: "getCard",
                args: [tokenId]
              })) as any;

              const assetSymbol = (onChainCard.assetSymbol || "BTC") as AssetSymbol;
              const template = BASE_CARD_CATALOG.find((c) => c.assetSymbol === assetSymbol) || BASE_CARD_CATALOG[0];

              const card: Card = {
                ...template,
                id: `card-onchain-${tokenId.toString()}`,
                tokenId: Number(tokenId),
                assetSymbol,
                rarity: RARITY_MAP[onChainCard.rarity] || "Common",
                foilType: FOIL_MAP[onChainCard.foilType] || "Standard",
                baseAtk: Number(onChainCard.baseAtk || 60),
                baseDef: Number(onChainCard.baseDef || 60),
                baseSpd: Number(onChainCard.baseSpd || 60),
                currentAtk: Number(onChainCard.baseAtk || 60),
                currentDef: Number(onChainCard.baseDef || 60),
                currentSpd: Number(onChainCard.baseSpd || 60),
                statMultiplier: 1.0,
                deltaPercent: 0,
                trend: "neutral",
                mintedAt: Number(onChainCard.mintedAt) * 1000 || Date.now(),
                owner: listingData.seller
              };

              activeListings.push({
                id: `list-${tokenId.toString()}`,
                card,
                seller: listingData.seller,
                priceEth: parseFloat(formatEther(listingData.price)),
                listedAt: Number(listingData.listedAt) * 1000,
                isActive: true
              });
            }
          }
        } catch (e) {
          console.warn("Listing check error for token:", tokenId, e);
        }
      }

      this.listings = activeListings;
      this.notify();
    } catch (err) {
      console.warn("Failed to fetch on-chain listings:", err);
    } finally {
      this.isRefreshing = false;
    }
  }

  /**
   * Lists an on-chain card for sale: Validates on-chain ownership, checks approval, & calls listCard
   */
  public async listCardOnChain(
    tokenId: number,
    priceEth: number,
    sellerAddress: `0x${string}`
  ): Promise<string> {
    const isRobinhood = await ensureRobinhoodNetwork();
    if (!isRobinhood) {
      throw new Error("Please switch your wallet to Robinhood Chain Testnet.");
    }

    const walletClient = await getBrowserWalletClient();
    if (!walletClient) {
      throw new Error("No Web3 wallet found.");
    }

    const priceWei = parseEther(priceEth.toString());
    const tokenBigInt = BigInt(tokenId);

    // 1. Verify on-chain ownership before sending transaction
    try {
      const onChainOwner = (await publicClient.readContract({
        ...cardContractConfig,
        functionName: "ownerOf",
        args: [tokenBigInt]
      })) as string;

      if (onChainOwner.toLowerCase() !== sellerAddress.toLowerCase()) {
        throw new Error(
          `Your connected wallet (${sellerAddress.slice(0, 6)}...${sellerAddress.slice(-4)}) does not own Token #${tokenId} on Robinhood Chain Testnet. (On-chain owner: ${onChainOwner.slice(0, 6)}...${onChainOwner.slice(-4)}). You can only list cards that were minted directly to your wallet.`
        );
      }
    } catch (err: any) {
      if (err?.message?.includes("Your connected wallet")) {
        throw err;
      }
      throw new Error(
        `Card #${tokenId} does not exist on-chain on Robinhood Chain Testnet yet! Starter cards are for local battle practice; please open a Booster Pack in the Pack Store to mint your real on-chain NFT cards first.`
      );
    }

    // 2. Check if marketplace is already approved (AvoxCard automatically approves marketplace contract)
    const isApproved = (await publicClient.readContract({
      ...cardContractConfig,
      functionName: "isApprovedForAll",
      args: [sellerAddress, marketplaceContractConfig.address]
    })) as boolean;

    if (!isApproved) {
      const approveHash = await (walletClient as any).writeContract({
        ...cardContractConfig,
        functionName: "approve",
        args: [marketplaceContractConfig.address, tokenBigInt],
        account: sellerAddress,
        chain: robinhoodTestnet,
        gas: BigInt(100_000)
      });
      await publicClient.waitForTransactionReceipt({ hash: approveHash });
    }

    // 3. Call listCard on marketplace contract with explicit safe gas limit
    const listHash = await (walletClient as any).writeContract({
      ...marketplaceContractConfig,
      functionName: "listCard",
      args: [tokenBigInt, priceWei],
      account: sellerAddress,
      chain: robinhoodTestnet,
      gas: BigInt(200_000)
    });

    await publicClient.waitForTransactionReceipt({ hash: listHash });
    await this.refreshListingsFromContract();
    return listHash;
  }

  /**
   * Purchases a card on-chain: Sends ETH payment, transfers NFT, routes 2.5% fee to prize pool
   */
  public async buyCardOnChain(
    tokenId: number,
    priceEth: number,
    buyerAddress: `0x${string}`
  ): Promise<string> {
    const isRobinhood = await ensureRobinhoodNetwork();
    if (!isRobinhood) {
      throw new Error("Please switch your wallet to Robinhood Chain Testnet.");
    }

    const walletClient = await getBrowserWalletClient();
    if (!walletClient) {
      throw new Error("No Web3 wallet found.");
    }

    const priceWei = parseEther(priceEth.toString());
    const tokenBigInt = BigInt(tokenId);

    const buyHash = await (walletClient as any).writeContract({
      ...marketplaceContractConfig,
      functionName: "buyCard",
      args: [tokenBigInt],
      value: priceWei,
      account: buyerAddress,
      chain: robinhoodTestnet,
      gas: BigInt(300_000)
    });

    await publicClient.waitForTransactionReceipt({ hash: buyHash });
    await this.refreshListingsFromContract();
    return buyHash;
  }

  /**
   * Cancels an active listing on-chain
   */
  public async cancelListingOnChain(tokenId: number, sellerAddress: `0x${string}`): Promise<string> {
    const isRobinhood = await ensureRobinhoodNetwork();
    if (!isRobinhood) {
      throw new Error("Please switch your wallet to Robinhood Chain Testnet.");
    }

    const walletClient = await getBrowserWalletClient();
    if (!walletClient) {
      throw new Error("No Web3 wallet found.");
    }

    const cancelHash = await (walletClient as any).writeContract({
      ...marketplaceContractConfig,
      functionName: "cancelListing",
      args: [BigInt(tokenId)],
      account: sellerAddress,
      chain: robinhoodTestnet,
      gas: BigInt(150_000)
    });

    await publicClient.waitForTransactionReceipt({ hash: cancelHash });
    await this.refreshListingsFromContract();
    return cancelHash;
  }
}

export const marketplaceStore = new MarketplaceStore();
