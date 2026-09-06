"use client";

import { useState, useEffect } from "react";
import { MarketplaceListing, Card, CardRarity, AssetSymbol } from "@/types";
import { marketplaceStore } from "@/lib/storage/marketplaceStore";
import { userStore } from "@/lib/storage/userStore";
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
  ExternalLink
} from "lucide-react";
import confetti from "canvas-confetti";

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

  const profile = userStore.getProfile();
  const prices = marketService.getPrices();

  useEffect(() => {
    const unsub = marketplaceStore.subscribe(setListings);
    return () => unsub();
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

  const handleBuyCard = () => {
    if (!buyingListing) return;

    sound.playClick();
    const canAfford = userStore.deductEth(buyingListing.priceEth);
    if (!canAfford) {
      alert("Insufficient ETH balance! Use the Guest Account or deposit testnet ETH.");
      return;
    }

    const res = marketplaceStore.buyCard(buyingListing.id, profile.address);
    if (res.success && res.card) {
      userStore.addCardsToCollection([res.card]);
      sound.playLegendaryReveal();
      confetti({ particleCount: 70, spread: 60 });
      setBuyingListing(null);
    }
  };

  const handleCreateListing = () => {
    if (!cardToList) return;
    const price = parseFloat(listPriceInput);
    if (isNaN(price) || price <= 0) {
      alert("Enter a valid price in ETH");
      return;
    }

    sound.playClick();
    marketplaceStore.listCard(cardToList, price, profile.address);
    userStore.removeCardFromCollection(cardToList.id);
    setShowListModal(false);
    setCardToList(null);
  };

  const assets: AssetSymbol[] = ["BTC", "ETH", "SOL", "DOGE", "AVAX", "LINK", "BNB", "PEPE", "NEAR", "SUI"];
  const rarities: CardRarity[] = ["Common", "Rare", "Epic", "Legendary"];

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-6">
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
              <p className="text-xs text-slate-400">
                Trade verified MarketWars cards. 2.5% protocol fee automatically funds the Seasonal Prize Pool.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => {
            sound.playClick();
            setShowListModal(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 font-bold text-slate-950 text-xs uppercase tracking-wider flex items-center space-x-1.5 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
        >
          <Tag className="w-4 h-4" />
          <span>List a Card for Sale</span>
        </button>
      </div>

      {/* Filter & Sort Bar */}
      <div className="bg-[#090D15] p-4 rounded-xl border border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
        {/* Asset Filter */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 sm:pb-0">
          <span className="text-slate-500 font-mono uppercase text-[10px]">Asset:</span>
          <button
            onClick={() => setSelectedAsset("All")}
            className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-colors ${
              selectedAsset === "All" ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40" : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All
          </button>
          {assets.map((sym) => (
            <button
              key={sym}
              onClick={() => setSelectedAsset(sym)}
              className={`px-2.5 py-1 rounded-lg font-mono text-[11px] transition-colors ${
                selectedAsset === sym ? "bg-emerald-950 text-emerald-400 border border-emerald-500/40" : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {sym}
            </button>
          ))}
        </div>

        {/* Rarity Filter & Sort */}
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
                    className="py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                  >
                    Inspect
                  </button>
                  <button
                    onClick={() => {
                      sound.playClick();
                      setBuyingListing(item);
                    }}
                    className="py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 text-xs font-bold uppercase transition-all shadow-[0_0_12px_rgba(16,185,129,0.25)]"
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
        <div className="text-center py-20 text-slate-500 text-xs font-mono">
          No cards match the selected asset or rarity filters.
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
              You are purchasing <strong>{buyingListing.card.name} (#{buyingListing.card.tokenId})</strong>.
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
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleBuyCard}
                className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 font-bold text-slate-950 text-xs uppercase"
              >
                Confirm Purchase
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
              <h3 className="font-bold text-lg">List a Card on the Marketplace</h3>
              <button onClick={() => setShowListModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Select one of your owned cards to list for sale in ETH.
            </p>

            {/* Select card from collection */}
            <div className="grid grid-cols-3 gap-2 max-h-52 overflow-y-auto mb-4 p-1">
              {profile.collection.map((c) => {
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
                    <span className="text-[9px] text-amber-400 font-mono block">{c.rarity}</span>
                  </div>
                );
              })}
            </div>

            {cardToList && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">Listing Price (ETH):</label>
                  <input
                    type="number"
                    step="0.01"
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
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 font-bold text-slate-950 text-xs uppercase tracking-wider transition-all"
                >
                  Create Listing
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
