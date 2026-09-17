"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { MarketplaceListing, Card, CardRarity, AssetSymbol } from "@/types";
import { marketplaceStore } from "@/lib/storage/marketplaceStore";
import { userStore } from "@/lib/storage/userStore";
import { walletStore, WalletState } from "@/lib/web3/walletStore";
import { marketService } from "@/lib/market/priceFeed";
import { applyLiveStatsToCard } from "@/lib/market/statModifier";
import { sound } from "@/lib/audio/soundEngine";
import { CardComponent } from "@/components/cards/CardComponent";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import {
  Store,
  Filter,
  ArrowUpDown,
  Tag,
  CheckCircle2,
  X,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  Wallet,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import confetti from "canvas-confetti";
import { CONTRACT_CONFIG, getExplorerAddressUrl, getExplorerTxUrl } from "@/lib/constants/contracts";

export function MarketplaceView() {
  const [listings, setListings] = useState<MarketplaceListing[]>(marketplaceStore.getListings());
  const [selectedRarity, setSelectedRarity] = useState<string>("All");
  const [selectedAsset, setSelectedAsset] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"price_asc" | "price_desc" | "power_desc">("price_asc");
  const [inspectedCard, setInspectedCard] = useState<Card | null>(null);
  const [buyingListing, setBuyingListing] = useState<MarketplaceListing | null>(null);
  const [showListModal, setShowListModal] = useState(false);
  const [cardToList, setCardToList] = useState<Card | null>(null);
  const [listPriceInput, setListPriceInput] = useState<string>("0.05");

  const [wallet, setWallet] = useState<WalletState>(walletStore.getState());
  const [isProcessing, setIsProcessing] = useState(false);
  const [txNotice, setTxNotice] = useState<{ message: string; txHash?: string; isError?: boolean } | null>(null);

  const profile = userStore.getProfile();
  const prices = marketService.getPrices();

  useEffect(() => {
    const unsubMarket = marketplaceStore.subscribe(setListings);
    const unsubWallet = walletStore.subscribe(setWallet);
    return () => {
      unsubMarket();
      unsubWallet();
    };
  }, []);

  // Filter & Sort
  const filteredListings = listings
    .filter((l) => l.isActive)
    .filter((l) => (selectedRarity === "All" ? true : l.card.rarity === selectedRarity))
    .filter((l) => (selectedAsset === "All" ? true : l.card.assetSymbol === selectedAsset))
    .sort((a, b) => {
      if (sortBy === "price_asc") return a.priceEth - b.priceEth;
      if (sortBy === "price_desc") return b.priceEth - a.priceEth;
      if (sortBy === "power_desc") {
        const powerA = a.card.baseAtk + a.card.baseDef + a.card.baseSpd;
        const powerB = b.card.baseAtk + b.card.baseDef + b.card.baseSpd;
        return powerB - powerA;
      }
      return 0;
    });

  const handleBuyCard = async () => {
    if (!buyingListing) return;

    if (!wallet.isConnected || !wallet.address) {
      await walletStore.connect();
      return;
    }

    const currentAddr = wallet.address;

    if (wallet.ethBalance < buyingListing.priceEth) {
      alert(`Insufficient ETH balance (${wallet.ethBalance.toFixed(4)} ETH). You need ${buyingListing.priceEth} ETH.`);
      return;
    }

    sound.playClick();
    setIsProcessing(true);
    setTxNotice({ message: "Confirming card purchase in Web3 wallet..." });

    try {
      const txHash = await marketplaceStore.buyCardOnChain(
        buyingListing.card.tokenId,
        buyingListing.priceEth,
        currentAddr as `0x${string}`
      );

      userStore.addCardsToCollection([buyingListing.card]);
      sound.playLegendaryReveal();
      confetti({ particleCount: 70, spread: 60 });
      setBuyingListing(null);

      setTxNotice({
        message: `Successfully purchased ${buyingListing.card.name} on-chain! 2.5% fee routed to Prize Pool.`,
        txHash
      });

      walletStore.refreshBalance();
    } catch (err: any) {
      console.error("Purchase error:", err);
      setTxNotice({
        message: err?.message || "Failed to complete card purchase on-chain.",
        isError: true
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCreateListing = async () => {
    if (!cardToList) return;
    const price = parseFloat(listPriceInput);
    if (isNaN(price) || price <= 0) {
      alert("Enter a valid price in ETH");
      return;
    }

    if (!wallet.isConnected || !wallet.address) {
      await walletStore.connect();
      return;
    }

    const currentAddr = wallet.address;

    sound.playClick();
    setIsProcessing(true);
    setTxNotice({ message: "Approving NFT and confirming listing in your Web3 wallet..." });

    try {
      const txHash = await marketplaceStore.listCardOnChain(
        cardToList.tokenId,
        price,
        currentAddr as `0x${string}`
      );

      userStore.removeCardFromCollection(cardToList.id);
      setShowListModal(false);
      setCardToList(null);

      setTxNotice({
        message: `Successfully listed ${cardToList.name} (#${cardToList.tokenId}) for ${price} ETH on-chain!`,
        txHash
      });
    } catch (err: any) {
      console.error("Listing error:", err);
      setTxNotice({
        message: err?.message || "Failed to list card on-chain.",
        isError: true
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const assets: AssetSymbol[] = ["BTC", "ETH", "SOL", "DOGE", "AVAX", "LINK", "BNB", "PEPE", "NEAR", "SUI"];
  const rarities: CardRarity[] = ["Common", "Rare", "Epic", "Legendary"];

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6">
      {/* Transaction Status Notice */}
      {txNotice && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between border ${
            txNotice.isError
              ? "bg-red-950/70 border-red-500/60 text-red-200"
              : "bg-[#0F1626] border-cyan-500/50 text-cyan-200"
          }`}
        >
          <div className="flex items-center space-x-2">
            <Store className="w-4 h-4 shrink-0" />
            <span>{txNotice.message}</span>
            {txNotice.txHash && (
              <a
                href={getExplorerTxUrl(txNotice.txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-orange-400 hover:text-orange-300 font-mono ml-2 inline-flex items-center"
              >
                View on Etherscan <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            )}
          </div>
          <button onClick={() => setTxNotice(null)} className="text-slate-400 hover:text-slate-200 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0A0F19] p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-indigo-600 p-[1px] flex items-center justify-center">
              <div className="w-full h-full bg-[#0B0F18] rounded-xl flex items-center justify-center">
                <Store className="w-5 h-5 text-cyan-400" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-silkscreen font-bold text-slate-100 uppercase tracking-wide">
                Secondary NFT Trading Floor
              </h1>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <p className="text-xs text-slate-400">
                  Trade verified AVOX cards on Robinhood Testnet. 2.5% protocol fee automatically funds the Seasonal Prize Pool.
                </p>
                <a
                  href={getExplorerAddressUrl(CONTRACT_CONFIG.marketplaceContract)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyan-400 hover:text-cyan-300 inline-flex items-center space-x-1 underline font-mono text-[11px]"
                >
                  <span>Contract Verified ({CONTRACT_CONFIG.marketplaceContract.slice(0, 6)}...{CONTRACT_CONFIG.marketplaceContract.slice(-4)})</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={() => marketplaceStore.refreshListingsFromContract()}
            className="p-2.5 rounded-xl bg-[#111724] hover:bg-[#182030] border border-slate-700 text-slate-300 transition-colors"
            title="Refresh On-Chain Listings"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          <button
            onClick={() => {
              sound.playClick();
              setShowListModal(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 font-bold text-slate-950 text-xs uppercase tracking-wider flex items-center space-x-1.5 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
          >
            <Tag className="w-4 h-4" />
            <span>List a Card for Sale</span>
          </button>
        </div>
      </div>

      {/* Filter & Sort Bar */}
      <div className="bg-[#090D15] p-4 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Asset Filter */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-slate-500 font-mono uppercase text-[10px]">Asset:</span>
          <button
            onClick={() => setSelectedAsset("All")}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-colors cursor-pointer ${
              selectedAsset === "All" ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All
          </button>
          {assets.map((sym) => (
            <button
              key={sym}
              onClick={() => setSelectedAsset(sym)}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-colors cursor-pointer ${
                selectedAsset === sym ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {sym}
            </button>
          ))}
        </div>

        {/* Rarity & Sort Controls */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-1">
            <span className="text-slate-500 font-mono uppercase text-[10px]">Rarity:</span>
            <select
              value={selectedRarity}
              onChange={(e) => setSelectedRarity(e.target.value)}
              className="bg-[#111724] border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none"
            >
              <option value="All">All Rarities</option>
              {rarities.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center space-x-1">
            <span className="text-slate-500 font-mono uppercase text-[10px]">Sort:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-[#111724] border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none"
            >
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="power_desc">Highest Battle Power</option>
            </select>
          </div>
        </div>
      </div>

      {/* Grid of Listings */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {filteredListings.map((item) => {
          const liveCard = applyLiveStatsToCard(item.card, prices[item.card.assetSymbol]);

          return (
            <div
              key={item.id}
              className="bg-[#0A0E17] rounded-2xl border border-slate-800/90 p-4 flex flex-col justify-between hover:border-slate-700 transition-all group"
            >
              <div className="flex justify-center mb-3">
                <CardComponent
                  card={liveCard}
                  size="sm"
                  onClick={() => setInspectedCard(liveCard)}
                />
              </div>

              <div className="pt-3 border-t border-slate-800 space-y-2">
                <div className="flex items-baseline justify-between">
                  <span className="text-xs text-slate-400">Listing Price:</span>
                  <span className="font-mono font-black text-emerald-400 text-base">
                    {item.priceEth} ETH
                  </span>
                </div>

                <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
                  <span>Seller: {item.seller.slice(0, 8)}...</span>
                  <span>2.5% Pool Fee</span>
                </div>

                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    onClick={() => setInspectedCard(liveCard)}
                    className="py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Inspect
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setBuyingListing(item);
                    }}
                    className="py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold uppercase transition-all shadow-[0_0_12px_rgba(16,185,129,0.25)] cursor-pointer"
                  >
                    Buy NFT
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {filteredListings.length === 0 && (
        <div className="text-center py-20 text-slate-500 text-xs font-mono space-y-2">
          <div>No cards currently listed matching your criteria on the Robinhood marketplace.</div>
          <div className="text-slate-400">Mint a pack or click "List a Card for Sale" to create the first listing!</div>
        </div>
      )}

      {/* Inspect Card Modal */}
      <CardDetailModal
        card={inspectedCard}
        onClose={() => setInspectedCard(null)}
      />

      {/* Buy Confirmation Modal */}
      {buyingListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0B0F18] border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl">
            <h3 className="font-bold text-lg mb-2">Confirm Card Purchase</h3>
            <p className="text-xs text-slate-400 mb-4">
              You are purchasing <strong>{buyingListing.card.name} (#{buyingListing.card.tokenId})</strong> on Robinhood Chain.
            </p>

            <div className="p-3 rounded-lg bg-[#111724] border border-slate-800 space-y-2 text-xs font-mono mb-4">
              <div className="flex justify-between">
                <span className="text-slate-400">Card Price:</span>
                <span className="text-slate-100 font-bold">{buyingListing.priceEth} ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Prize Pool Cut (2.5%):</span>
                <span className="text-emerald-400">{(buyingListing.priceEth * 0.025).toFixed(5)} ETH</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Seller Net Proceeds:</span>
                <span className="text-slate-100">{(buyingListing.priceEth * 0.975).toFixed(5)} ETH</span>
              </div>
            </div>

            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setBuyingListing(null)}
                disabled={isProcessing}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleBuyCard}
                disabled={isProcessing}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-slate-950 text-xs uppercase disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? "Processing..." : "Confirm on Robinhood"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* List Card Modal */}
      {showListModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-[#0B0F18] border border-slate-800 rounded-2xl p-6 text-slate-100 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-lg">List an On-Chain Card</h3>
              <button onClick={() => setShowListModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Select one of your minted cards from your collection to list for sale in ETH.
            </p>

            {/* Select card from collection */}
            {(() => {
              const onChainCards = profile.collection.filter(
                (c) => c.id.startsWith("card-onchain-") || (wallet.address && c.owner?.toLowerCase() === wallet.address.toLowerCase())
              );

              if (onChainCards.length === 0) {
                return (
                  <div className="py-6 px-4 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs text-center space-y-2 font-mono mb-4">
                    <div className="font-bold text-amber-300">No On-Chain Minted Cards Found</div>
                    <p className="text-[11px] text-slate-400 font-hanken leading-relaxed">
                      Cards currently in your collection are local starter deck practice cards. Only verifiable ERC-721 NFT cards minted to your wallet on Robinhood Chain can be listed on the secondary market.
                    </p>
                    <div className="pt-2">
                      <Link
                        href="/packs"
                        onClick={() => setShowListModal(false)}
                        className="inline-flex items-center px-4 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-slate-950 font-bold text-xs uppercase"
                      >
                        Open Booster Pack on Robinhood
                      </Link>
                    </div>
                  </div>
                );
              }

              return (
                <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto mb-4 p-1">
                  {onChainCards.map((c) => {
                    const isSelected = cardToList?.id === c.id;
                    return (
                      <div
                        key={c.id}
                        onClick={() => setCardToList(c)}
                        className={`p-2 rounded-lg border cursor-pointer text-center text-xs transition-all ${
                          isSelected
                            ? "border-emerald-400 bg-emerald-950/70 text-emerald-300 ring-1 ring-emerald-400"
                            : "border-slate-800 bg-[#111724] text-slate-300 hover:border-slate-700"
                        }`}
                      >
                        <span className="font-bold block font-mono">{c.assetSymbol}</span>
                        <span className="text-[10px] text-slate-400 truncate block">{c.name}</span>
                        <span className="text-[9px] text-amber-400 font-mono block">Token #{c.tokenId} • {c.rarity}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {cardToList && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Listing Price (ETH):</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.001"
                    value={listPriceInput}
                    onChange={(e) => setListPriceInput(e.target.value)}
                    className="w-full bg-[#121824] border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="p-3 rounded-lg bg-[#0E1420] border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
                  <div className="flex justify-between">
                    <span>Marketplace Protocol Fee (2.5%):</span>
                    <span className="text-emerald-400">
                      {((parseFloat(listPriceInput) || 0) * 0.025).toFixed(5)} ETH
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>You receive upon sale:</span>
                    <span className="text-slate-200 font-bold">
                      {((parseFloat(listPriceInput) || 0) * 0.975).toFixed(5)} ETH
                    </span>
                  </div>
                </div>

                <button
                  onClick={handleCreateListing}
                  disabled={isProcessing}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-slate-950 text-xs uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isProcessing ? "Approving & Listing..." : "Approve & List on Robinhood"}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
