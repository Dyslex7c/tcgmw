"use client";

import { useState } from "react";
import confetti from "canvas-confetti";
import { PackTier, Card, VRFProofData } from "@/types";
import { PACK_CONFIGS, openPackWithVRF } from "@/lib/game/packEngine";
import { userStore } from "@/lib/storage/userStore";
import { sound } from "@/lib/audio/soundEngine";
import { CardComponent } from "@/components/cards/CardComponent";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import { VRFVerifyModal } from "@/components/packs/VRFVerifyModal";
import { Package, ShieldCheck, Sparkles, Zap, ArrowRight, RefreshCw, CheckCircle2 } from "lucide-react";

export function PackOpeningStage() {
  const [selectedTier, setSelectedTier] = useState<PackTier>("Starter");
  const [stageState, setStageState] = useState<"idle" | "requesting_vrf" | "ready_to_tear" | "revealed">("idle");
  const [pulledCards, setPulledCards] = useState<Card[]>([]);
  const [vrfProof, setVrfProof] = useState<VRFProofData | null>(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [cardRevealIndex, setCardRevealIndex] = useState(0);

  const packConfig = PACK_CONFIGS[selectedTier];

  const handleBuyAndRequestVRF = () => {
    sound.playClick();
    const canAfford = userStore.deductEth(packConfig.priceEth);
    if (!canAfford) {
      alert("Insufficient testnet ETH! Switch to Guest Mode or top up.");
      return;
    }

    setStageState("requesting_vrf");

    // Simulate VRF request block confirmation (1.8s)
    setTimeout(() => {
      const { cards, proof } = openPackWithVRF(selectedTier, userStore.getProfile().address);
      setPulledCards(cards);
      setVrfProof(proof);
      setStageState("ready_to_tear");
      sound.playShield();
    }, 1800);
  };

  const handleTearPack = () => {
    sound.playPackTear();

    // Trigger celebratory particle blast
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 }
    });

    const hasLegendary = pulledCards.some((c) => c.rarity === "Legendary");
    if (hasLegendary) {
      setTimeout(() => sound.playLegendaryReveal(), 600);
      setTimeout(() => {
        confetti({
          particleCount: 120,
          spread: 100,
          colors: ["#1E40AF", "#2563EB", "#60A5FA"]
        });
      }, 700);
    }

    // Add pulled cards to user's permanent collection
    userStore.addCardsToCollection(pulledCards);

    setStageState("revealed");
    setCardRevealIndex(pulledCards.length);
  };

  const handleReset = () => {
    sound.playClick();
    setStageState("idle");
    setPulledCards([]);
    setVrfProof(null);
  };

  const tiers: PackTier[] = ["Starter", "Alpha", "Whale"];

  return (
    <div className="w-full flex flex-col items-center">
      {/* Tier Selector when in idle state */}
      {stageState === "idle" && (
        <div className="w-full max-w-5xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 text-orange-400 text-xs font-chakra font-bold tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>POWERED BY CHAINLINK VRF v2.5 RANDOMNESS</span>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-silkscreen font-bold text-slate-100 uppercase tracking-wide">
              Booster Pack Cryptographic Opening
            </h1>
            <p className="text-sm text-slate-400 max-w-xl mx-auto mt-2">
              Every pack pull is seeded by on-chain verifiable entropy. Cards represent real crypto assets with live battle stat modifiers.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tiers.map((tier) => {
              const cfg = PACK_CONFIGS[tier];
              const isSelected = selectedTier === tier;

              return (
                <div
                  key={tier}
                  onClick={() => {
                    sound.playCardHover();
                    setSelectedTier(tier);
                  }}
                  className={`relative cursor-pointer rounded-2xl p-6 border-2 transition-all duration-300 flex flex-col justify-between ${
                    isSelected
                      ? "bg-gradient-to-b from-[#131B2A] to-[#0A0E18] border-orange-500 shadow-[0_0_35px_rgba(234,88,12,0.25)] scale-[1.02]"
                      : "bg-[#0C111B] border-slate-800 hover:border-slate-700 hover:scale-[1.01]"
                  }`}
                >
                  {cfg.badge && (
                    <span className="absolute top-4 right-4 text-[10px] font-chakra font-bold text-orange-400 uppercase tracking-wider">
                      {cfg.badge}
                    </span>
                  )}

                  <div>
                    {/* Pack Visual Art */}
                    <div className="h-44 w-full rounded-xl bg-gradient-to-b from-slate-900 to-[#07090F] border border-slate-800/80 flex flex-col items-center justify-center p-4 mb-4 relative overflow-hidden group">
                      <div className={`w-24 h-32 rounded-lg border-2 flex flex-col items-center justify-center p-2 shadow-2xl transition-transform duration-500 ${
                        tier === "Whale"
                          ? "border-amber-400 bg-amber-950/30 group-hover:rotate-6"
                          : tier === "Alpha"
                          ? "border-purple-400 bg-purple-950/30 group-hover:rotate-6"
                          : "border-emerald-400 bg-emerald-950/30 group-hover:rotate-6"
                      }`}>
                        <Package className={`w-10 h-10 mb-2 ${tier === "Whale" ? "text-amber-400" : tier === "Alpha" ? "text-purple-400" : "text-emerald-400"}`} />
                        <span className="font-mono text-[9px] font-bold text-slate-300">{cfg.cardCount} CARDS</span>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-slate-100">{cfg.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">{cfg.description}</p>

                    {/* Odds Matrix */}
                    <div className="bg-[#090D15] rounded-lg p-3 border border-slate-800/80 text-[11px] font-mono space-y-1 mb-4">
                      <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">Verifiable Odds:</div>
                      <div className="flex justify-between text-slate-300">
                        <span>Legendary:</span>
                        <span className="font-bold text-blue-400">{cfg.odds.legendary}%</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Epic:</span>
                        <span className="font-bold text-purple-400">{cfg.odds.epic}%</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Rare:</span>
                        <span className="font-bold text-cyan-400">{cfg.odds.rare}%</span>
                      </div>
                      <div className="flex justify-between text-slate-300">
                        <span>Holo Foil Chance:</span>
                        <span className="font-bold text-emerald-400">{cfg.odds.foilMultiplier}%</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex items-baseline justify-between mb-3">
                      <span className="text-xs text-slate-400">Price:</span>
                      <span className="text-lg font-bold font-mono text-emerald-400">{cfg.priceEth} ETH</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTier(tier);
                        handleBuyAndRequestVRF();
                      }}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 font-bold text-slate-950 text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Mint & Open with VRF</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* VRF Request Waiting Screen */}
      {stageState === "requesting_vrf" && (
        <div className="py-20 flex flex-col items-center justify-center text-center max-w-md">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin flex items-center justify-center"></div>
            <Package className="w-8 h-8 text-emerald-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-silkscreen text-slate-100 uppercase">Dispatched VRF Request...</h2>
          <p className="text-xs text-slate-400 mt-2 font-mono leading-relaxed">
            Interfacing with Chainlink VRF v2.5 coordinator. Generating cryptographic randomness seed on-chain...
          </p>
          <div className="mt-4 px-3 py-1.5 rounded bg-[#0E1522] border border-slate-800 text-[11px] font-mono text-emerald-400">
            20% of fee routed to Season Prize Pool
          </div>
        </div>
      )}

      {/* Ready to Tear Screen */}
      {stageState === "ready_to_tear" && (
        <div className="py-12 flex flex-col items-center justify-center text-center max-w-lg">
          <div className="mb-6 relative animate-bounce">
            <div className="w-48 h-64 rounded-2xl bg-gradient-to-b from-amber-500/20 via-emerald-500/20 to-slate-900 border-2 border-emerald-400 shadow-[0_0_50px_rgba(16,185,129,0.4)] flex flex-col items-center justify-center p-6">
              <Package className="w-16 h-16 text-emerald-400 mb-3" />
              <span className="text-sm font-black font-mono text-slate-100 uppercase tracking-wider">
                {packConfig.name}
              </span>
              <span className="text-xs font-mono text-emerald-400 mt-1">VRF FULFILLED</span>
            </div>
          </div>

          <h2 className="text-3xl sm:text-4xl font-bold font-silkscreen text-slate-100 uppercase">Randomness Verified!</h2>
          <p className="text-xs text-slate-400 mt-1 mb-6">
            Your tamper-proof entropy block has been confirmed. Tear open the foil to reveal your pulls!
          </p>

          <button
            onClick={handleTearPack}
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-400 via-teal-400 to-cyan-400 text-slate-950 font-black text-sm uppercase tracking-widest hover:scale-105 shadow-[0_0_30px_rgba(16,185,129,0.5)] transition-all flex items-center space-x-2"
          >
            <Sparkles className="w-5 h-5" />
            <span>TEAR PACK OPEN NOW</span>
          </button>
        </div>
      )}

      {/* Revealed Cards Screen */}
      {stageState === "revealed" && (
        <div className="w-full max-w-6xl">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-8">
            <div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <h2 className="text-2xl sm:text-3xl font-bold font-silkscreen text-slate-100 uppercase">Pack Pull Results</h2>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                {pulledCards.length} cards minted and added to your collection!
              </p>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={() => {
                  sound.playClick();
                  setIsProofModalOpen(true);
                }}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-900 text-xs font-mono font-bold shadow-[0_0_15px_rgba(16,185,129,0.2)] transition-all"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Verify VRF Proof</span>
              </button>

              <button
                onClick={handleReset}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Open Another Pack</span>
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            {pulledCards.map((card) => (
              <div key={card.id} className="animate-in fade-in zoom-in duration-500">
                <CardComponent
                  card={card}
                  size="md"
                  onClick={() => setSelectedCard(card)}
                />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VRF Verify Modal */}
      <VRFVerifyModal
        proof={vrfProof}
        onClose={() => setIsProofModalOpen(false)}
      />

      {/* Card Detail Modal */}
      <CardDetailModal
        card={selectedCard}
        onClose={() => setSelectedCard(null)}
      />
    </div>
  );
}
