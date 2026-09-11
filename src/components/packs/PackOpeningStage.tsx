"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import confetti from "canvas-confetti";
import { PackTier, Card, VRFProofData } from "@/types";
import { PACK_CONFIGS, buyPackOnChain, waitForPackFulfillment } from "@/lib/game/packEngine";
import { userStore } from "@/lib/storage/userStore";
import { walletStore, WalletState } from "@/lib/web3/walletStore";
import { CONTRACT_CONFIG, getExplorerTxUrl } from "@/lib/constants/contracts";
import { sound } from "@/lib/audio/soundEngine";
import { CardComponent } from "@/components/cards/CardComponent";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import { VRFVerifyModal } from "@/components/packs/VRFVerifyModal";
import {
  Package,
  ShieldCheck,
  Zap,
  ArrowRight,
  RefreshCw,
  ExternalLink,
  Wallet,
  AlertCircle
} from "lucide-react";

export function PackOpeningStage() {
  const [selectedTier, setSelectedTier] = useState<PackTier>("Starter");
  const [stageState, setStageState] = useState<"idle" | "requesting_vrf" | "ready_to_tear" | "revealed">("idle");
  const [vrfStatusText, setVrfStatusText] = useState<string>("Waiting for wallet signature...");
  const [pendingTxHash, setPendingTxHash] = useState<string | null>(null);
  const [pulledCards, setPulledCards] = useState<Card[]>([]);
  const [vrfProof, setVrfProof] = useState<VRFProofData | null>(null);
  const [isProofModalOpen, setIsProofModalOpen] = useState(false);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [cardRevealIndex, setCardRevealIndex] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [wallet, setWallet] = useState<WalletState>(walletStore.getState());

  useEffect(() => {
    const unsub = walletStore.subscribe(setWallet);
    return () => unsub();
  }, []);

  const packConfig = PACK_CONFIGS[selectedTier];

  const handleBuyAndRequestVRF = async (tierToBuy: PackTier = selectedTier) => {
    sound.playClick();
    setErrorMessage(null);
    setSelectedTier(tierToBuy);

    // Ensure wallet is connected
    if (!wallet.isConnected || !wallet.address) {
      await walletStore.connect();
      return;
    }

    const currentAddr = wallet.address;
    const targetConfig = PACK_CONFIGS[tierToBuy];

    // Check balance against requested tier
    if (wallet.ethBalance < targetConfig.priceEth) {
      setErrorMessage(
        `Insufficient SepoliaETH balance (${wallet.ethBalance.toFixed(4)} SepoliaETH). You need at least ${targetConfig.priceEth} SepoliaETH to buy a ${targetConfig.name}. Please claim free testnet funds from a Sepolia faucet below.`
      );
      return;
    }

    setStageState("requesting_vrf");
    setVrfStatusText("Confirm transaction in your Web3 wallet...");
    setPendingTxHash(null);

    try {
      // Step 1: Send on-chain transaction to MarketWarsPackVRF
      const txHash = await buyPackOnChain(tierToBuy, currentAddr as `0x${string}`);
      setPendingTxHash(txHash);
      setVrfStatusText("Transaction broadcast! Awaiting Ethereum Sepolia confirmation & VRF fulfillment...");

      // Step 2: Await fulfillment and read minted NFTs from contract
      const { cards, proof } = await waitForPackFulfillment(txHash);

      setPulledCards(cards);
      setVrfProof(proof);
      setStageState("ready_to_tear");
      sound.playShield();

      // Refresh real on-chain balance
      walletStore.refreshBalance();
    } catch (err: any) {
      console.error("Pack purchase error:", err);

      let userMsg = err?.shortMessage || err?.message || "Failed to complete on-chain pack purchase.";
      if (
        err?.code === 4001 ||
        userMsg.includes("User rejected") ||
        userMsg.includes("user rejected") ||
        userMsg.includes("User denied")
      ) {
        userMsg = "Transaction was cancelled in your Web3 wallet.";
      } else if (userMsg.includes("insufficient funds") || userMsg.includes("exceeds balance")) {
        userMsg = `Insufficient SepoliaETH balance (${wallet.ethBalance.toFixed(4)} SepoliaETH) to cover pack cost and gas fees. Please claim free testnet SepoliaETH from a faucet.`;
      } else if (userMsg.includes("switch your wallet")) {
        userMsg = "Please switch your wallet to Ethereum Sepolia network (Chain ID: 11155111).";
      }

      setErrorMessage(userMsg);
      setStageState("idle");
    }
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

    // Add real on-chain pulled cards to user's collection
    userStore.addCardsToCollection(pulledCards);

    setStageState("revealed");
    setCardRevealIndex(pulledCards.length);
  };

  const handleReset = () => {
    sound.playClick();
    setStageState("idle");
    setPulledCards([]);
    setVrfProof(null);
    setPendingTxHash(null);
    setErrorMessage(null);
  };

  const tiers: PackTier[] = ["Starter", "Alpha", "Whale"];

  return (
    <div className="w-full flex flex-col items-center">
      {/* Error notification */}
      {errorMessage && (
        <div className="w-full max-w-3xl mb-6 p-4 rounded-xl bg-red-950/70 border border-red-500/60 text-red-200 text-xs flex items-start space-x-3">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold block text-sm mb-0.5">Transaction Notice</span>
            <span className="leading-relaxed">{errorMessage}</span>
            {errorMessage.toLowerCase().includes("faucet") && (
              <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-red-800/40">
                <span className="text-[11px] text-red-300 font-bold">Claim Free SepoliaETH:</span>
                <a
                  href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-md bg-red-900/60 hover:bg-red-800 border border-red-700/60 text-cyan-300 text-[11px] font-mono inline-flex items-center space-x-1"
                >
                  <span>Google Cloud Faucet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
                <a
                  href="https://faucet.quicknode.com/ethereum/sepolia"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 rounded-md bg-red-900/60 hover:bg-red-800 border border-red-700/60 text-cyan-300 text-[11px] font-mono inline-flex items-center space-x-1"
                >
                  <span>QuickNode Faucet</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            )}
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="text-red-400 hover:text-red-200 font-bold text-xs cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Tier Selector when in idle state */}
      {stageState === "idle" && (
        <div className="w-full max-w-5xl">
          <div className="text-center mb-8">
            <div className="flex items-center justify-center space-x-2 text-orange-400 text-xs font-chakra font-bold tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>CHAINLINK VRF v2.5 VERIFIABLE ON-CHAIN MINTING</span>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-silkscreen font-bold text-slate-100 uppercase tracking-wide">
              Booster Pack Cryptographic Opening
            </h1>
            <p className="text-sm text-slate-400 max-w-xl mx-auto mt-2">
              Cards are minted directly as ERC-721 NFTs on Ethereum Sepolia. 20% of every pack purchase automatically fuels the transparent prize pool.
            </p>

            {/* Wallet Status Banner */}
            <div className="mt-4 inline-flex items-center space-x-2 px-4 py-1.5 rounded-full bg-[#0D1424] border border-slate-700/60 text-xs font-mono">
              <Wallet className="w-3.5 h-3.5 text-emerald-400" />
              {wallet.isConnected ? (
                <span className="text-slate-300">
                  Connected: <span className="text-emerald-400 font-bold">{wallet.address?.slice(0, 6)}...{wallet.address?.slice(-4)}</span> | Balance: <span className="text-emerald-400 font-bold">{wallet.ethBalance.toFixed(4)} SepoliaETH</span>
                </span>
              ) : (
                <button
                  onClick={() => walletStore.connect()}
                  className="text-orange-400 hover:text-orange-300 font-bold underline"
                >
                  Connect Web3 Wallet (Sepolia)
                </button>
              )}
            </div>
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
                      <div
                        className={`w-24 h-32 rounded-lg border-2 flex flex-col items-center justify-center p-2 shadow-2xl transition-transform duration-500 ${
                          tier === "Whale"
                            ? "border-amber-400 bg-amber-950/30 group-hover:rotate-6"
                            : tier === "Alpha"
                            ? "border-purple-400 bg-purple-950/30 group-hover:rotate-6"
                            : "border-emerald-400 bg-emerald-950/30 group-hover:rotate-6"
                        }`}
                      >
                        <Package
                          className={`w-10 h-10 mb-2 ${
                            tier === "Whale"
                              ? "text-amber-400"
                              : tier === "Alpha"
                              ? "text-purple-400"
                              : "text-emerald-400"
                          }`}
                        />
                        <span className="font-mono text-[9px] font-bold text-slate-300">{cfg.cardCount} CARDS</span>
                      </div>
                    </div>

                    <h3 className="text-xl font-bold text-slate-100">{cfg.name}</h3>
                    <p className="text-xs text-slate-400 mt-1 mb-4 leading-relaxed">{cfg.description}</p>

                    {/* Odds Matrix */}
                    <div className="bg-[#090D15] rounded-lg p-3 border border-slate-800/80 text-[11px] font-mono space-y-1 mb-4">
                      <div className="text-slate-400 text-[10px] uppercase font-bold mb-1">On-Chain Odds:</div>
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
                      <span className="text-xs text-slate-400">On-Chain Price:</span>
                      <span className="text-lg font-bold font-mono text-emerald-400">{cfg.priceEth} SepoliaETH</span>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedTier(tier);
                        handleBuyAndRequestVRF(tier);
                      }}
                      className="w-full py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 font-bold text-slate-950 text-xs uppercase tracking-wider flex items-center justify-center space-x-1.5 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
                    >
                      <Zap className="w-4 h-4" />
                      <span>Mint & Open on Sepolia</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Real On-Chain VRF Request Waiting Screen */}
      {stageState === "requesting_vrf" && (
        <div className="py-20 flex flex-col items-center justify-center text-center max-w-lg">
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-full border-4 border-emerald-500/20 border-t-emerald-400 animate-spin flex items-center justify-center"></div>
            <Package className="w-8 h-8 text-emerald-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-bold font-silkscreen text-slate-100 uppercase">
            Executing On-Chain Mint...
          </h2>
          <p className="text-xs text-slate-400 mt-2 font-mono leading-relaxed">
            {vrfStatusText}
          </p>

          {pendingTxHash && (
            <a
              href={getExplorerTxUrl(pendingTxHash)}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 px-3 py-1.5 rounded bg-[#111724] border border-slate-700 text-cyan-400 hover:text-cyan-300 text-xs font-mono inline-flex items-center space-x-1 underline"
            >
              <span>View Sepolia TX ({pendingTxHash.slice(0, 10)}...{pendingTxHash.slice(-8)})</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* Ready to Tear Screen */}
      {stageState === "ready_to_tear" && (
        <div className="py-12 flex flex-col items-center justify-center text-center max-w-md">
          <div className="relative mb-6 cursor-pointer group" onClick={handleTearPack}>
            <div className="w-48 h-64 rounded-2xl bg-gradient-to-br from-amber-500/20 via-orange-600/30 to-red-700/40 border-2 border-orange-500/80 p-4 flex flex-col items-center justify-between shadow-[0_0_50px_rgba(234,88,12,0.35)] group-hover:scale-105 transition-transform duration-300">
              <span className="text-[10px] font-mono text-orange-400 font-bold uppercase tracking-wider">
                {selectedTier} BOOSTER
              </span>
              <div className="relative flex flex-col items-center justify-center py-2">
                <Image
                  src="/logo.png"
                  alt="AVOX"
                  width={96}
                  height={96}
                  className="w-20 h-20 object-contain drop-shadow-[0_0_25px_rgba(249,115,22,0.85)] group-hover:scale-110 transition-transform duration-300"
                  priority
                />
                <span className="text-[10px] font-chakra font-bold text-orange-300 tracking-widest uppercase mt-2">
                  AVOX PROTOCOL
                </span>
              </div>
              <div className="text-center">
                <span className="text-xs font-bold text-slate-200 block">ON-CHAIN MINTED</span>
                <span className="text-[10px] text-slate-400 font-mono">CLICK TO TEAR OPEN</span>
              </div>
            </div>
          </div>

          <h2 className="text-2xl sm:text-3xl font-bold font-silkscreen text-slate-100 uppercase">
            Pack Ready to Tear!
          </h2>
          <p className="text-xs text-slate-400 mt-1 mb-6 font-mono">
            {pulledCards.length} verifiable ERC-721 tokens minted on-chain.
          </p>

          <button
            onClick={handleTearPack}
            className="px-8 py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 font-bold text-white text-sm uppercase tracking-wider shadow-[0_0_30px_rgba(234,88,12,0.5)] transition-all cursor-pointer"
          >
            Tear Open Pack
          </button>
        </div>
      )}

      {/* Cards Revealed Screen */}
      {stageState === "revealed" && (
        <div className="w-full max-w-6xl space-y-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold font-silkscreen text-slate-100 uppercase">
                {selectedTier} Pack Pulls
              </h2>
              <p className="text-xs text-slate-400">
                All {pulledCards.length} cards have been minted on-chain to your wallet.
              </p>
            </div>

            <div className="flex items-center space-x-3">
              {vrfProof && (
                <button
                  onClick={() => setIsProofModalOpen(true)}
                  className="px-3.5 py-2 rounded-xl bg-[#111724] hover:bg-[#182030] border border-slate-700 text-cyan-400 text-xs font-mono font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify On-Chain Proof</span>
                </button>
              )}

              <button
                onClick={handleReset}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 font-bold text-slate-950 text-xs uppercase tracking-wider flex items-center space-x-1.5 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Open Another Pack</span>
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
            {pulledCards.map((card) => (
              <div
                key={card.id}
                onClick={() => setSelectedCard(card)}
                className="cursor-pointer group flex flex-col items-center"
              >
                <CardComponent card={card} />
                <div className="mt-2 text-center">
                  <span className="text-[11px] font-mono text-cyan-400 block font-bold">
                    Token #{card.tokenId}
                  </span>
                  <span className="text-[10px] text-slate-500 uppercase font-mono">
                    {card.rarity} • {card.foilType}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Card Detail Modal */}
      {selectedCard && (
        <CardDetailModal
          card={selectedCard}
          onClose={() => setSelectedCard(null)}
        />
      )}

      {/* VRF Cryptographic Verification Modal */}
      {isProofModalOpen && vrfProof && (
        <VRFVerifyModal
          proof={vrfProof}
          onClose={() => setIsProofModalOpen(false)}
        />
      )}
    </div>
  );
}
