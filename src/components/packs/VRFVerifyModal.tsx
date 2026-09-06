"use client";

import { VRFProofData } from "@/types";
import { sound } from "@/lib/audio/soundEngine";
import { X, ShieldCheck, CheckCircle, Hash, Database, Binary, ExternalLink, Cpu } from "lucide-react";
import { CONTRACT_CONFIG, getExplorerAddressUrl } from "@/lib/constants/contracts";

interface VRFVerifyModalProps {
  proof: VRFProofData | null;
  onClose: () => void;
}

export function VRFVerifyModal({ proof, onClose }: VRFVerifyModalProps) {
  if (!proof) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
      <div className="w-full max-w-2xl bg-[#0B0F19] border border-emerald-500/40 rounded-2xl shadow-[0_0_50px_rgba(16,185,129,0.15)] p-6 text-slate-100 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/80 border border-emerald-500/50 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-bold text-base text-slate-100 flex items-center space-x-2">
                <span>Chainlink VRF v2.5 Randomness Proof</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                  VERIFIED ON-CHAIN
                </span>
              </h3>
              <p className="text-xs text-slate-400 font-mono">
                Cryptographically verifiable entropy and deterministic card expansion.
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Overview Proof Parameters */}
        <div className="my-4 grid grid-cols-2 gap-3 text-xs">
          <div className="p-3 rounded-lg bg-[#111724] border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-mono">VRF Request ID</span>
            <span className="font-mono text-emerald-400 font-bold text-sm">{proof.requestId}</span>
          </div>
          <div className="p-3 rounded-lg bg-[#111724] border border-slate-800">
            <span className="text-slate-400 block text-[10px] uppercase font-mono">Block Number</span>
            <span className="font-mono text-slate-200 font-bold text-sm">#{proof.blockNumber}</span>
          </div>
          <div className="p-3 rounded-lg bg-[#111724] border border-slate-800 col-span-2">
            <span className="text-slate-400 block text-[10px] uppercase font-mono">Raw 256-bit Random Seed (Hex)</span>
            <span className="font-mono text-[11px] text-amber-300 break-all select-all">
              {proof.randomSeedHex}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-[#111724] border border-slate-800 col-span-2">
            <span className="text-slate-400 block text-[10px] uppercase font-mono">Commitment Hash</span>
            <span className="font-mono text-[11px] text-cyan-300 break-all select-all">
              {proof.commitHash}
            </span>
          </div>
          <div className="p-3 rounded-lg bg-[#111724] border border-slate-800 col-span-2 flex items-center justify-between">
            <div>
              <span className="text-slate-400 block text-[10px] uppercase font-mono">Verified On-Chain Contract ({CONTRACT_CONFIG.chainName})</span>
              <span className="font-mono text-xs text-slate-200 font-bold">{CONTRACT_CONFIG.packContract}</span>
            </div>
            <a
              href={getExplorerAddressUrl(CONTRACT_CONFIG.packContract)}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-1.5 rounded bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-bold flex items-center space-x-1 transition-colors"
            >
              <span>View Contract</span>
              <ExternalLink className="w-3.5 h-3.5 ml-1" />
            </a>
          </div>
        </div>

        {/* Step-by-Step Expansion Breakdown */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider font-mono flex items-center space-x-1.5">
            <Cpu className="w-4 h-4 text-emerald-400" />
            <span>Deterministic Card Generation Breakdown</span>
          </h4>

          <div className="space-y-2">
            {proof.rolls.map((roll) => (
              <div
                key={roll.cardIndex}
                className="p-3 rounded-lg bg-[#0F1420] border border-slate-800/80 text-xs flex flex-col space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">Card Slot #{roll.cardIndex}</span>
                  <div className="flex space-x-2 font-mono text-[10px]">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                      Asset: {roll.determinedAsset}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded ${
                      roll.determinedRarity === "Legendary"
                        ? "bg-blue-950 text-blue-200 border border-blue-500/60 font-bold shadow-[0_0_8px_rgba(37,99,235,0.3)]"
                        : roll.determinedRarity === "Epic"
                        ? "bg-purple-950 text-purple-300 border border-purple-500/40"
                        : "bg-cyan-950 text-cyan-300 border border-cyan-500/40"
                    }`}>
                      {roll.determinedRarity}
                    </span>
                    {roll.determinedFoil !== "Standard" && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-950 text-amber-200 border border-amber-500/30">
                        {roll.determinedFoil}
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-400 grid grid-cols-3 gap-2 bg-[#090D15] p-2 rounded">
                  <div>
                    <span className="text-slate-500 block text-[9px]">Rarity Modulo</span>
                    <span>{roll.rarityRoll} / 100</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">Foil Modulo</span>
                    <span>{roll.foilRoll} / 100</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[9px]">Derived Sub-Seed</span>
                    <span className="truncate block">{roll.rawSubSeedHex.slice(0, 10)}...</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Verification Note */}
        <div className="mt-5 p-3 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-start space-x-2 text-xs text-emerald-300">
          <CheckCircle className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
          <p>
            This pull was generated via deterministic smart-contract math seeded by Chainlink VRF. Neither the player nor the game operators could predict or manipulate these results prior to block confirmation.
          </p>
        </div>

        <div className="flex justify-end pt-4 mt-4 border-t border-slate-800">
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 transition-colors"
          >
            Close Proof Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
