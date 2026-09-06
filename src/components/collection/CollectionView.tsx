"use client";

import { useState, useEffect } from "react";
import { Card, AssetSymbol } from "@/types";
import { userStore, UserProfile } from "@/lib/storage/userStore";
import { marketService } from "@/lib/market/priceFeed";
import { applyLiveStatsToCard } from "@/lib/market/statModifier";
import { sound } from "@/lib/audio/soundEngine";
import { CardComponent } from "@/components/cards/CardComponent";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import { Layers, Shield, Sparkles, Trophy, Plus, Check, Zap, Info } from "lucide-react";

export function CollectionView() {
  const [profile, setProfile] = useState<UserProfile>(userStore.getProfile());
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const prices = marketService.getPrices();

  useEffect(() => {
    const unsub = userStore.subscribe(setProfile);
    return () => unsub();
  }, []);

  const deckCards = profile.deckCardIds
    .map((id) => profile.collection.find((c) => c.id === id))
    .filter(Boolean) as Card[];

  const handleToggleDeckCard = (card: Card) => {
    sound.playCardFlip();
    const isAlreadyInDeck = profile.deckCardIds.includes(card.id);

    if (isAlreadyInDeck) {
      if (profile.deckCardIds.length <= 1) {
        alert("Your deck must have at least 1 card!");
        return;
      }
      userStore.setDeckCardIds(profile.deckCardIds.filter((id) => id !== card.id));
    } else {
      if (profile.deckCardIds.length >= 3) {
        alert("Battle deck is limited to 3 active cards! Remove one first.");
        return;
      }
      userStore.setDeckCardIds([...profile.deckCardIds, card.id]);
    }
  };

  // Stats calculation
  const totalCards = profile.collection.length;
  const legendaryCount = profile.collection.filter((c) => c.rarity === "Legendary").length;
  const epicCount = profile.collection.filter((c) => c.rarity === "Epic").length;
  const rareCount = profile.collection.filter((c) => c.rarity === "Rare").length;

  // Approximate collection floor value in ETH
  const estimatedPortfolioEth = (
    legendaryCount * 0.35 +
    epicCount * 0.08 +
    rareCount * 0.025 +
    (totalCards - legendaryCount - epicCount - rareCount) * 0.005
  ).toFixed(3);

  // Synergy detection
  const l1Count = deckCards.filter((c) => c.category === "L1").length;
  const memeCount = deckCards.filter((c) => c.category === "Meme").length;

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-8">
      {/* Header & Portfolio Stats */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-[#0A0F19] p-5 rounded-2xl border border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 p-[1px] flex items-center justify-center">
              <div className="w-full h-full bg-[#0B0F18] rounded-xl flex items-center justify-center">
                <Layers className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-silkscreen font-bold text-slate-100 uppercase tracking-wide">
                Vault & Deck Builder
              </h1>
              <p className="text-xs text-slate-400">
                Construct your 3-card tactical lineup. Cards sync live with market feeds during battles.
              </p>
            </div>
          </div>
        </div>

        {/* Portfolio Stats Pills */}
        <div className="flex items-center space-x-3 text-xs font-mono">
          <div className="bg-[#111724] px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Cards Owned:</span>
            <span className="font-bold text-slate-100">{totalCards}</span>
          </div>
          <div className="bg-[#111724] px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Est. Floor Value:</span>
            <span className="font-bold text-emerald-400">{estimatedPortfolioEth} ETH</span>
          </div>
          <div className="bg-[#111724] px-3 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 block text-[10px]">Rank Standing:</span>
            <span className="font-bold text-amber-400">{profile.rankTier} ({profile.ratingMMR})</span>
          </div>
        </div>
      </div>

      {/* ACTIVE BATTLE DECK (3 SLOTS) */}
      <div className="bg-gradient-to-r from-[#0C121E] via-[#0D1525] to-[#0A0F19] p-6 rounded-2xl border border-emerald-500/30 shadow-[0_0_30px_rgba(16,185,129,0.1)]">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 mb-4">
          <div>
            <div className="flex items-center space-x-2">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h2 className="text-base sm:text-lg font-silkscreen font-bold text-slate-100 uppercase tracking-wide">
                Active Battle Lineup ({deckCards.length} / 3 Selected)
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              These 3 cards will represent your portfolio in PvP and PvE Arena battles.
            </p>
          </div>

          {/* Active Synergies Badge */}
          <div className="flex items-center space-x-3">
            {l1Count >= 2 && (
              <span className="text-cyan-400 text-xs font-chakra font-bold flex items-center space-x-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>L1 Consensus Synergy (+10% Base DEF)</span>
              </span>
            )}
            {memeCount >= 1 && (
              <span className="text-orange-400 text-xs font-chakra font-bold flex items-center space-x-1.5">
                <Zap className="w-3.5 h-3.5" />
                <span>Meme Volatility Aura (+15% Crit Chance)</span>
              </span>
            )}
          </div>
        </div>

        {/* Deck Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 justify-items-center">
          {[0, 1, 2].map((slotIdx) => {
            const card = deckCards[slotIdx];
            if (card) {
              const liveCard = applyLiveStatsToCard(card, prices[card.assetSymbol]);
              return (
                <div key={card.id} className="relative group">
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10 text-[10px] font-chakra font-bold text-orange-400 tracking-wider">
                    SLOT {slotIdx + 1}
                  </div>
                  <CardComponent
                    card={liveCard}
                    size="md"
                    onClick={() => setSelectedCard(liveCard)}
                  />
                  <button
                    onClick={() => handleToggleDeckCard(card)}
                    className="mt-2 w-full py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-chakra font-bold uppercase tracking-wider transition-colors"
                  >
                    Remove from Deck
                  </button>
                </div>
              );
            }

            return (
              <div
                key={slotIdx}
                className="w-64 h-80 rounded-2xl border-2 border-dashed border-slate-800 bg-[#080B12]/60 flex flex-col items-center justify-center p-6 text-center text-slate-500 hover:border-slate-700 transition-all"
              >
                <Plus className="w-8 h-8 mb-2 opacity-50" />
                <span className="text-xs font-mono font-bold">SLOT {slotIdx + 1} EMPTY</span>
                <p className="text-[10px] mt-1 text-slate-600">
                  Select a card below to assign to this slot.
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* FULL CARD COLLECTION VAULT */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base sm:text-lg font-silkscreen font-bold text-slate-100 uppercase tracking-tight">
            All Owned Cards ({totalCards})
          </h2>
          <span className="text-xs text-slate-400 font-mono">
            Click card to inspect or toggle deck slot
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {profile.collection.map((card) => {
            const isInDeck = profile.deckCardIds.includes(card.id);
            const liveCard = applyLiveStatsToCard(card, prices[card.assetSymbol]);

            return (
              <div
                key={card.id}
                className={`p-3 rounded-2xl bg-[#0B0F19] border transition-all ${
                  isInDeck ? "border-emerald-500/60 ring-1 ring-emerald-500/40" : "border-slate-800/90 hover:border-slate-700"
                }`}
              >
                <div className="flex justify-center mb-3">
                  <CardComponent
                    card={liveCard}
                    size="sm"
                    onClick={() => setSelectedCard(liveCard)}
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <button
                    onClick={() => handleToggleDeckCard(card)}
                    className={`w-full py-1.5 rounded-lg text-xs font-mono font-bold uppercase transition-all flex items-center justify-center space-x-1.5 ${
                      isInDeck
                        ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                        : "bg-slate-800 hover:bg-slate-700 text-slate-200"
                    }`}
                  >
                    {isInDeck ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>In Active Deck</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-3.5 h-3.5" />
                        <span>Equip to Deck</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Card Detail Modal */}
      <CardDetailModal
        card={selectedCard}
        onClose={() => setSelectedCard(null)}
      />
    </div>
  );
}
