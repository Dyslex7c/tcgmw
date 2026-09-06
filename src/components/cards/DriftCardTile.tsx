"use client";

import React from "react";
import { Card, CardRarity } from "@/types";
import { Swords, Shield, Zap, Sparkles, TrendingUp, TrendingDown } from "lucide-react";
import { getChainLogoUrl } from "@/lib/constants/chainLogos";

interface DriftCardTileProps {
  card: Card;
}

const RARITY_STYLES: Record<CardRarity, {
  border: string;
  glow: string;
  badge: string;
  nameColor: string;
}> = {
  Common: {
    border: "border-slate-700/80",
    glow: "",
    badge: "bg-slate-800 text-slate-300 border-slate-600",
    nameColor: "text-slate-200"
  },
  Rare: {
    border: "border-cyan-500/70",
    glow: "group-hover:shadow-[0_0_20px_rgba(6,182,212,0.4)]",
    badge: "bg-cyan-950/80 text-cyan-300 border-cyan-500/50",
    nameColor: "text-cyan-300"
  },
  Epic: {
    border: "border-purple-500/80",
    glow: "group-hover:shadow-[0_0_25px_rgba(168,85,247,0.5)]",
    badge: "bg-purple-950/80 text-purple-300 border-purple-500/50",
    nameColor: "text-purple-300"
  },
  Legendary: {
    border: "border-blue-600/90",
    glow: "group-hover:shadow-[0_0_30px_rgba(37,99,235,0.6)]",
    badge: "bg-blue-950/95 text-blue-200 border-blue-500/80 shadow-[0_0_10px_rgba(37,99,235,0.3)]",
    nameColor: "text-blue-300"
  }
};

const ASSET_LOGOS: Record<string, { bg: string; text: string; iconSymbol: string; logoFile: string }> = {
  ROBINHOOD: { bg: "bg-[#00C805]/20 border-[#00C805]/40", text: "text-[#00C805]", iconSymbol: "🪶", logoFile: "robinhood.svg" },
  ETH: { bg: "bg-[#627EEA]/20 border-[#627EEA]/40", text: "text-[#627EEA]", iconSymbol: "Ξ", logoFile: "eth.png" },
  ARBITRUM: { bg: "bg-[#28A0F0]/20 border-[#28A0F0]/40", text: "text-[#28A0F0]", iconSymbol: "◈", logoFile: "arbitrum.png" },
  OPTIMISM: { bg: "bg-[#FF0420]/20 border-[#FF0420]/40", text: "text-[#FF0420]", iconSymbol: "🔴", logoFile: "optimism.png" },
  BASE: { bg: "bg-[#0052FF]/20 border-[#0052FF]/40", text: "text-[#0052FF]", iconSymbol: "🔵", logoFile: "base.png" },
  AVAX: { bg: "bg-[#E84142]/20 border-[#E84142]/40", text: "text-[#E84142]", iconSymbol: "▲", logoFile: "avax.png" },
  POLYGON: { bg: "bg-[#8247E5]/20 border-[#8247E5]/40", text: "text-[#8247E5]", iconSymbol: "⬡", logoFile: "polygon.png" },
  BNB: { bg: "bg-[#F3BA2F]/20 border-[#F3BA2F]/40", text: "text-[#F3BA2F]", iconSymbol: "❖", logoFile: "bnb.png" },
  ZKSYNC: { bg: "bg-[#1E69FF]/20 border-[#1E69FF]/40", text: "text-[#1E69FF]", iconSymbol: "∎", logoFile: "zksync.png" },
  MONAD: { bg: "bg-[#836EF9]/20 border-[#836EF9]/40", text: "text-[#836EF9]", iconSymbol: "⬢", logoFile: "monad.png" },
  COSMOS: { bg: "bg-[#2E3148]/40 border-slate-600", text: "text-[#6F7390]", iconSymbol: "⚛", logoFile: "cosmos.png" },
  APECHAIN: { bg: "bg-[#0054F7]/20 border-[#0054F7]/40", text: "text-[#0054F7]", iconSymbol: "🦧", logoFile: "apechain.png" },
  GNOSIS: { bg: "bg-[#133629]/40 border-[#00A6C4]/40", text: "text-[#00A6C4]", iconSymbol: "🦉", logoFile: "gnosis.png" },
  LINEA: { bg: "bg-[#61DFFF]/20 border-[#61DFFF]/40", text: "text-[#61DFFF]", iconSymbol: "⚡", logoFile: "linea.png" },
  WORLDCHAIN: { bg: "bg-slate-900/90 border-slate-600", text: "text-slate-100", iconSymbol: "🌐", logoFile: "worldchain.png" },
  HEDERA: { bg: "bg-slate-900/90 border-slate-600", text: "text-slate-100", iconSymbol: "Ħ", logoFile: "hedera.png" },
  BTC: { bg: "bg-[#F7931A]/20 border-[#F7931A]/40", text: "text-[#F7931A]", iconSymbol: "₿", logoFile: "btc.png" },
  SOL: { bg: "bg-[#14F195]/20 border-[#14F195]/40", text: "text-[#14F195]", iconSymbol: "◎", logoFile: "sol.png" },
  DOGE: { bg: "bg-[#C2A633]/20 border-[#C2A633]/40", text: "text-[#C2A633]", iconSymbol: "Ð", logoFile: "doge.png" },
  LINK: { bg: "bg-[#375BD2]/20 border-[#375BD2]/40", text: "text-[#375BD2]", iconSymbol: "⬡", logoFile: "link.png" },
  PEPE: { bg: "bg-[#259C38]/20 border-[#259C38]/40", text: "text-[#259C38]", iconSymbol: "🐸", logoFile: "pepe.png" },
  NEAR: { bg: "bg-[#000000]/40 border-slate-500/40", text: "text-slate-100", iconSymbol: "Ⓝ", logoFile: "near.png" },
  SUI: { bg: "bg-[#4DA2FF]/20 border-[#4DA2FF]/40", text: "text-[#4DA2FF]", iconSymbol: "💧", logoFile: "sui.png" },
  CARDANO: { bg: "bg-[#0033AD]/20 border-[#0033AD]/40", text: "text-[#0033AD]", iconSymbol: "₳", logoFile: "cardano.png" },
  POLKADOT: { bg: "bg-[#E6007A]/20 border-[#E6007A]/40", text: "text-[#E6007A]", iconSymbol: "●", logoFile: "polkadot.png" },
  APTOS: { bg: "bg-slate-900 border-slate-600", text: "text-slate-200", iconSymbol: "▲", logoFile: "aptos.png" },
  TRON: { bg: "bg-[#FF0013]/20 border-[#FF0013]/40", text: "text-[#FF0013]", iconSymbol: "TRX", logoFile: "tron.png" },
  TON: { bg: "bg-[#0088CC]/20 border-[#0088CC]/40", text: "text-[#0088CC]", iconSymbol: "💎", logoFile: "ton.png" },
  RIPPLE: { bg: "bg-[#23292F]/40 border-slate-600", text: "text-slate-100", iconSymbol: "✕", logoFile: "ripple.png" },
  FANTOM: { bg: "bg-[#1969FF]/20 border-[#1969FF]/40", text: "text-[#1969FF]", iconSymbol: "👻", logoFile: "fantom.png" }
};

export function DriftCardTile({ card }: DriftCardTileProps) {
  const rarityStyle = RARITY_STYLES[card.rarity] || RARITY_STYLES.Common;
  const assetVisual = ASSET_LOGOS[card.assetSymbol] || {
    bg: "bg-slate-800",
    text: "text-slate-300",
    iconSymbol: card.assetSymbol.slice(0, 1),
    logoFile: `${card.assetSymbol.toLowerCase()}.png`
  };

  const logoSrc = getChainLogoUrl(card.assetSymbol);
  const isPumping = card.trend === "pump";
  const isDumping = card.trend === "dump";

  return (
    <div className={`w-full h-full p-2.5 rounded-[13px] border ${rarityStyle.border} ${rarityStyle.glow} bg-gradient-to-b from-[#121928] via-[#0B0F18] to-[#07090E] flex flex-col justify-between select-none relative overflow-hidden group`}>
      {/* Foil Overlays */}
      {card.foilType === "Holo" && <div className="absolute inset-0 rounded-[13px] holo-card-overlay pointer-events-none" />}
      {card.foilType === "GoldFoil" && <div className="absolute inset-0 rounded-[13px] gold-foil-overlay pointer-events-none" />}

      {/* Header: Official TrustWallet Logo, Asset, Rarity */}
      <div className="flex items-center justify-between z-10">
        <div className="flex items-center space-x-1.5">
          <div className={`w-6 h-6 rounded-full border ${assetVisual.bg} flex items-center justify-center p-0.5 overflow-hidden shadow-[0_0_8px_rgba(0,0,0,0.5)] shrink-0 bg-slate-950`}>
            <img
              src={logoSrc}
              alt={card.assetSymbol}
              className="w-full h-full object-contain"
              loading="lazy"
            />
          </div>
          <div>
            <span className="font-chakra font-bold text-xs text-slate-100 tracking-wider block leading-tight">
              {card.assetSymbol}
            </span>
            <span className="text-[8px] font-inconsolata text-slate-400 block leading-tight">
              #{card.tokenId}
            </span>
          </div>
        </div>

        <div className="flex flex-col items-end">
          <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border ${rarityStyle.badge} tracking-wider font-chakra`}>
            {card.rarity}
          </span>
          {card.foilType !== "Standard" && (
            <span className="flex items-center space-x-0.5 text-[7px] font-chakra text-amber-300 mt-0.5">
              <Sparkles className="w-2 h-2" />
              <span>{card.foilType === "GoldFoil" ? "Gold Foil" : "Holo"}</span>
            </span>
          )}
        </div>
      </div>

      {/* Art Plate & Center TrustWallet Blockchain Emblem */}
      <div className="my-1.5 h-24 w-full rounded-lg bg-[#070A11] border border-slate-800/80 flex flex-col items-center justify-center p-1.5 relative overflow-hidden z-10">
        {/* Ambient subtle glow behind emblem */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-slate-700/20 via-transparent to-transparent pointer-events-none" />

        <div className="relative mb-1 w-11 h-11 rounded-xl bg-slate-900/90 border border-slate-700/60 p-1.5 shadow-[0_0_16px_rgba(0,0,0,0.8)] flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
          <img
            src={logoSrc}
            alt={card.assetSymbol}
            className="w-full h-full object-contain filter drop-shadow-[0_0_6px_rgba(255,255,255,0.35)]"
            loading="lazy"
          />
        </div>
        <div className={`font-chakra font-bold text-xs ${rarityStyle.nameColor} text-center truncate w-full px-1`}>
          {card.name}
        </div>
        <div className="text-[8px] text-slate-400 truncate w-full text-center font-hanken">
          {card.subtitle}
        </div>

        {/* Live Market Delta Pill */}
        <div className={`absolute top-1 right-1 px-1 py-0.5 rounded font-inconsolata text-[8px] font-bold border flex items-center space-x-0.5 backdrop-blur-md ${
          isPumping
            ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-400"
            : isDumping
            ? "bg-rose-950/90 border-rose-500/50 text-rose-400"
            : "bg-slate-900/80 border-slate-700 text-slate-300"
        }`}>
          {isPumping ? <TrendingUp className="w-2 h-2" /> : isDumping ? <TrendingDown className="w-2 h-2" /> : null}
          <span>{card.deltaPercent >= 0 ? "+" : ""}{card.deltaPercent}%</span>
        </div>
      </div>

      {/* Stats Matrix: ATK, DEF, SPD */}
      <div className="grid grid-cols-3 gap-1 bg-[#090D15] rounded-md p-1 border border-slate-800/90 text-center z-10">
        <div>
          <div className="flex items-center justify-center space-x-0.5 text-[7px] text-rose-400 font-bold uppercase font-chakra">
            <Swords className="w-2 h-2" />
            <span>ATK</span>
          </div>
          <div className="font-inconsolata font-bold text-[11px] text-slate-100">
            {card.currentAtk}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-center space-x-0.5 text-[7px] text-cyan-400 font-bold uppercase font-chakra">
            <Shield className="w-2 h-2" />
            <span>DEF</span>
          </div>
          <div className="font-inconsolata font-bold text-[11px] text-slate-100">
            {card.currentDef}
          </div>
        </div>
        <div>
          <div className="flex items-center justify-center space-x-0.5 text-[7px] text-amber-400 font-bold uppercase font-chakra">
            <Zap className="w-2 h-2" />
            <span>SPD</span>
          </div>
          <div className="font-inconsolata font-bold text-[11px] text-slate-100">
            {card.currentSpd}
          </div>
        </div>
      </div>

      {/* Skill footer */}
      <div className="mt-1 bg-[#080B12] rounded p-1 text-[8px] flex items-center justify-between text-slate-400 z-10">
        <span className="font-chakra text-emerald-400 font-bold truncate max-w-[110px]">{card.skill.name}</span>
        <span className="font-inconsolata text-cyan-400 font-bold">{card.skill.manaCost} MP</span>
      </div>
    </div>
  );
}
