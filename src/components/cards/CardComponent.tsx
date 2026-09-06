"use client";

import React, { useState } from "react";
import { Card, CardRarity, FoilType } from "@/types";
import { sound } from "@/lib/audio/soundEngine";
import { Swords, Shield, Zap, Sparkles, TrendingUp, TrendingDown, Info } from "lucide-react";
import { getChainLogoUrl } from "@/lib/constants/chainLogos";
import { BorderGlow } from "@/components/ui/BorderGlow";

interface CardComponentProps {
  card: Card;
  onClick?: () => void;
  selected?: boolean;
  size?: "sm" | "md" | "lg";
  isBattleCard?: boolean;
  hpCurrent?: number;
  hpMax?: number;
  shield?: number;
  energyCurrent?: number;
  energyMax?: number;
}

const RARITY_THEMES: Record<CardRarity, {
  border: string;
  glow: string;
  badge: string;
  gradient: string;
  nameColor: string;
}> = {
  Common: {
    border: "border-slate-700/80",
    glow: "",
    badge: "bg-slate-800 text-slate-300 border-slate-600",
    gradient: "from-slate-900 via-[#111624] to-[#0A0D15]",
    nameColor: "text-slate-200"
  },
  Rare: {
    border: "border-cyan-500/70",
    glow: "",
    badge: "bg-cyan-950/80 text-cyan-300 border-cyan-500/50",
    gradient: "from-cyan-950/40 via-[#0A1624] to-[#040A12]",
    nameColor: "text-cyan-300"
  },
  Epic: {
    border: "border-purple-500/80",
    glow: "",
    badge: "bg-purple-950/80 text-purple-300 border-purple-500/50",
    gradient: "from-purple-950/40 via-[#150F28] to-[#0A0716]",
    nameColor: "text-purple-300"
  },
  Legendary: {
    border: "border-blue-600/90",
    glow: "",
    badge: "bg-blue-950/95 text-blue-200 border-blue-500/80 shadow-[0_0_10px_rgba(37,99,235,0.3)]",
    gradient: "from-[#0A1938] via-[#071328] to-[#030814]",
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

export function CardComponent({
  card,
  onClick,
  selected = false,
  size = "md",
  isBattleCard = false,
  hpCurrent,
  hpMax,
  shield = 0,
  energyCurrent,
  energyMax
}: CardComponentProps) {
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const theme = RARITY_THEMES[card.rarity] || RARITY_THEMES.Common;
  const assetVisual = ASSET_LOGOS[card.assetSymbol] || {
    bg: "bg-slate-800",
    text: "text-slate-300",
    iconSymbol: card.assetSymbol.slice(0, 1),
    logoFile: `${card.assetSymbol.toLowerCase()}.png`
  };
  const logoSrc = getChainLogoUrl(card.assetSymbol);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 14;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -14;
    setTilt({ x, y });
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const isPumping = card.trend === "pump";
  const isDumping = card.trend === "dump";

  const sizeClasses = {
    sm: "w-48 text-xs",
    md: "w-64 text-sm",
    lg: "w-72 text-base"
  }[size];

  // Render mini SVG sparkline
  const renderSparkline = () => {
    const data = card.sparkline && card.sparkline.length > 0 ? card.sparkline : [100, 102, 99, 105, 108];
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const points = data
      .map((val, idx) => {
        const x = (idx / (data.length - 1)) * 100;
        const y = 28 - ((val - min) / range) * 22;
        return `${x},${y}`;
      })
      .join(" ");

    return (
      <svg className="w-full h-7 overflow-visible stroke-2" viewBox="0 0 100 28">
        <polyline
          fill="none"
          stroke={isPumping ? "#10b981" : isDumping ? "#f43f5e" : "#06b6d4"}
          points={points}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  };

  // Dynamic glow color configuration for BorderGlow on hover
  const getGlowConfig = () => {
    if (isPumping) {
      return {
        glowColor: "150 90 60",
        colors: ["#10b981", "#34d399", "#6ee7b7"]
      };
    }
    if (isDumping) {
      return {
        glowColor: "350 85 60",
        colors: ["#f43f5e", "#fb7185", "#fda4af"]
      };
    }
    switch (card.rarity) {
      case "Legendary":
        return {
          glowColor: "224 85 52",
          colors: ["#1e3a8a", "#2563eb", "#60a5fa"]
        };
      case "Epic":
        return {
          glowColor: "270 90 65",
          colors: ["#a855f7", "#c084fc", "#e879f9"]
        };
      case "Rare":
        return {
          glowColor: "195 90 60",
          colors: ["#06b6d4", "#38bdf8", "#67e8f9"]
        };
      default:
        return {
          glowColor: "160 65 55",
          colors: ["#10b981", "#64748b", "#34d399"]
        };
    }
  };

  const glowConfig = getGlowConfig();

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onMouseEnter={() => sound.playCardHover()}
      onClick={() => {
        sound.playClick();
        if (onClick) onClick();
      }}
      style={{
        transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
        transition: "transform 0.15s ease-out"
      }}
      className={`relative select-none cursor-pointer ${sizeClasses} transition-transform duration-300 ${
        selected ? "scale-[1.03] ring-2 ring-emerald-400 rounded-2xl" : "hover:scale-[1.02]"
      }`}
    >
      <BorderGlow
        borderRadius={16}
        backgroundColor="#080C14"
        glowColor={glowConfig.glowColor}
        colors={glowConfig.colors}
        edgeSensitivity={26}
        glowRadius={36}
        glowIntensity={1.3}
        coneSpread={28}
        className={`w-full h-full border ${theme.border} bg-gradient-to-b ${theme.gradient}`}
        innerClassName="p-3 w-full h-full flex flex-col justify-between"
      >
        {/* Foil Overlays */}
        {card.foilType === "Holo" && <div className="absolute inset-0 rounded-2xl holo-card-overlay pointer-events-none" />}
        {card.foilType === "GoldFoil" && <div className="absolute inset-0 rounded-2xl gold-foil-overlay pointer-events-none" />}

      {/* Top Header: Asset Icon, Symbol, Rarity & Foil Badge */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-1.5">
          <div className={`w-7 h-7 rounded-full border ${assetVisual.bg} flex items-center justify-center p-0.5 overflow-hidden shadow-[0_0_8px_rgba(0,0,0,0.5)] bg-slate-950 shrink-0`}>
            <img
              src={logoSrc}
              alt={card.assetSymbol}
              className="w-full h-full object-contain"
              loading="lazy"
            />
          </div>
          <div>
            <div className="flex items-center space-x-1">
              <span className="font-extrabold text-xs text-slate-100 font-chakra tracking-wider">{card.assetSymbol}</span>
              <span className="text-[9px] text-slate-400 font-inconsolata">#{card.tokenId}</span>
            </div>
            <div className="text-[9px] text-slate-400 font-hanken leading-none">{card.category}</div>
          </div>
        </div>

        <div className="flex flex-col items-end space-y-0.5">
          <span className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded border ${theme.badge} tracking-wider font-chakra`}>
            {card.rarity}
          </span>
          {card.foilType !== "Standard" && (
            <span className="flex items-center space-x-0.5 text-[8px] font-chakra text-amber-300">
              <Sparkles className="w-2.5 h-2.5" />
              <span>{card.foilType === "GoldFoil" ? "Gold Foil" : "Holo"}</span>
            </span>
          )}
        </div>
      </div>

      {/* Card Visual Artwork Plate */}
      <div className="relative w-full h-28 rounded-lg bg-[#080C14] border border-slate-800/80 overflow-hidden flex flex-col items-center justify-center p-2 mb-2 group">
        <div className="relative mb-1 flex items-center justify-center">
          <div className="w-12 h-12 rounded-xl bg-slate-900/90 border border-slate-700/60 p-2 shadow-[0_0_20px_rgba(0,0,0,0.7)] flex items-center justify-center transition-transform duration-300 group-hover:scale-110">
            <img
              src={logoSrc}
              alt={card.assetSymbol}
              className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(255,255,255,0.35)]"
              loading="lazy"
            />
          </div>
        </div>
        <div className={`font-bold text-xs ${theme.nameColor} text-center leading-tight truncate px-1 font-chakra`}>
          {card.name}
        </div>
        <div className="text-[9px] text-slate-400 italic text-center truncate px-2 font-hanken">
          {card.subtitle}
        </div>

        {/* Live Market Performance Pill overlay */}
        <div className={`absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded font-inconsolata text-[9px] font-bold border flex items-center space-x-0.5 backdrop-blur-md ${
          isPumping
            ? "bg-emerald-950/90 border-emerald-500/50 text-emerald-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]"
            : isDumping
            ? "bg-rose-950/90 border-rose-500/50 text-rose-400 shadow-[0_0_8px_rgba(244,63,94,0.4)]"
            : "bg-slate-900/80 border-slate-700 text-slate-300"
        }`}>
          {isPumping ? <TrendingUp className="w-2.5 h-2.5" /> : isDumping ? <TrendingDown className="w-2.5 h-2.5" /> : null}
          <span>{card.deltaPercent >= 0 ? "+" : ""}{card.deltaPercent}%</span>
        </div>
      </div>

      {/* Mini 24h Trend Sparkline */}
      <div className="w-full bg-[#0A0E18]/60 rounded border border-slate-800/60 p-1 mb-2">
        <div className="flex justify-between items-center text-[9px] text-slate-400 px-1 mb-0.5">
          <span className="font-hanken">Live Oracle Feed</span>
          <span className="font-inconsolata font-semibold">{card.statMultiplier.toFixed(2)}x Power</span>
        </div>
        {renderSparkline()}
      </div>

      {/* Battle Stats: ATK, DEF, SPD (Showing Base vs Live Modified) */}
      <div className="grid grid-cols-3 gap-1 bg-[#0B0F19] rounded-lg p-1.5 border border-slate-800/90 text-center mb-2">
        <div>
          <div className="flex items-center justify-center space-x-0.5 text-[9px] text-rose-400 font-bold uppercase font-chakra">
            <Swords className="w-2.5 h-2.5" />
            <span>ATK</span>
          </div>
          <div className="font-inconsolata font-bold text-xs text-slate-100 flex items-center justify-center space-x-1">
            <span>{card.currentAtk}</span>
            {card.currentAtk !== card.baseAtk && (
              <span className={`text-[9px] ${card.currentAtk > card.baseAtk ? "text-emerald-400" : "text-rose-400"}`}>
                ({card.currentAtk > card.baseAtk ? "+" : ""}{card.currentAtk - card.baseAtk})
              </span>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-center space-x-0.5 text-[9px] text-cyan-400 font-bold uppercase font-chakra">
            <Shield className="w-2.5 h-2.5" />
            <span>DEF</span>
          </div>
          <div className="font-inconsolata font-bold text-xs text-slate-100 flex items-center justify-center space-x-1">
            <span>{card.currentDef}</span>
            {card.currentDef !== card.baseDef && (
              <span className={`text-[9px] ${card.currentDef > card.baseDef ? "text-emerald-400" : "text-rose-400"}`}>
                ({card.currentDef > card.baseDef ? "+" : ""}{card.currentDef - card.baseDef})
              </span>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-center space-x-0.5 text-[9px] text-amber-400 font-bold uppercase font-chakra">
            <Zap className="w-2.5 h-2.5" />
            <span>SPD</span>
          </div>
          <div className="font-inconsolata font-bold text-xs text-slate-100 flex items-center justify-center space-x-1">
            <span>{card.currentSpd}</span>
            {card.currentSpd !== card.baseSpd && (
              <span className={`text-[9px] ${card.currentSpd > card.baseSpd ? "text-emerald-400" : "text-rose-400"}`}>
                ({card.currentSpd > card.baseSpd ? "+" : ""}{card.currentSpd - card.baseSpd})
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Special Skill & Flavor */}
      <div className="bg-[#090D16] rounded border border-slate-800/80 p-1.5 text-[10px]">
        <div className="flex items-center justify-between text-slate-300 font-bold mb-0.5">
          <span className="text-emerald-400 truncate">{card.skill.name}</span>
          <span className="font-mono text-cyan-400 shrink-0">{card.skill.manaCost} MP</span>
        </div>
        <p className="text-slate-400 text-[9px] line-clamp-1 leading-snug">
          {card.skill.description}
        </p>
      </div>

      {/* Battle-Specific HUD: HP Bar, Shield & Energy */}
      {isBattleCard && hpMax && hpCurrent !== undefined && (
        <div className="mt-2 pt-2 border-t border-slate-800 space-y-1">
          <div className="flex justify-between text-[10px] font-mono-nums font-bold">
            <span className="text-rose-400">HP {hpCurrent} / {hpMax}</span>
            {shield > 0 && <span className="text-cyan-400">+{shield} Shield</span>}
          </div>
          {/* Eased HP bar */}
          <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-rose-500 to-emerald-400 transition-all duration-500 ease-out"
              style={{ width: `${Math.max(0, Math.min(100, (hpCurrent / hpMax) * 100))}%` }}
            />
          </div>

          {energyMax && energyCurrent !== undefined && (
            <div className="w-full h-1 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-cyan-400 transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(100, (energyCurrent / energyMax) * 100))}%` }}
              />
            </div>
          )}
        </div>
      )}
      </BorderGlow>
    </div>
  );
}
