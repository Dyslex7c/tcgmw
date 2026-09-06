"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardRarity } from "@/types";
import { sound } from "@/lib/audio/soundEngine";
import { marketService } from "@/lib/market/priceFeed";
import { getChainLogoUrl } from "@/lib/constants/chainLogos";
import { BorderGlow } from "@/components/ui/BorderGlow";
import {
  X,
  Swords,
  Shield,
  Zap,
  Sparkles,
  ExternalLink,
  Copy,
  Check,
  TrendingUp,
  TrendingDown,
  Activity,
  Award,
  ArrowRight,
  Flame,
  ShieldAlert,
  Cpu
} from "lucide-react";

interface CardDetailModalProps {
  card: Card | null;
  onClose: () => void;
}

const RARITY_THEMES: Record<CardRarity, {
  border: string;
  badge: string;
  badgeText: string;
  gradient: string;
  accent: string;
  glowColor: string;
  glowColors: string[];
}> = {
  Common: {
    border: "border-slate-700",
    badge: "bg-slate-800 text-slate-300 border-slate-600",
    badgeText: "Common",
    gradient: "from-slate-900 via-[#111624] to-[#0A0D15]",
    accent: "text-slate-300",
    glowColor: "160 65 55",
    glowColors: ["#10b981", "#64748b", "#34d399"]
  },
  Rare: {
    border: "border-cyan-500/70",
    badge: "bg-cyan-950/80 text-cyan-300 border-cyan-500/50",
    badgeText: "Rare",
    gradient: "from-cyan-950/40 via-[#0A1624] to-[#040A12]",
    accent: "text-cyan-400",
    glowColor: "195 90 60",
    glowColors: ["#06b6d4", "#38bdf8", "#67e8f9"]
  },
  Epic: {
    border: "border-purple-500/80",
    badge: "bg-purple-950/80 text-purple-300 border-purple-500/50",
    badgeText: "Epic",
    gradient: "from-purple-950/40 via-[#150F28] to-[#0A0716]",
    accent: "text-purple-400",
    glowColor: "270 90 65",
    glowColors: ["#a855f7", "#c084fc", "#e879f9"]
  },
  Legendary: {
    border: "border-blue-600/90",
    badge: "bg-blue-950/95 text-blue-200 border-blue-500/80 shadow-[0_0_12px_rgba(37,99,235,0.4)]",
    badgeText: "Legendary",
    gradient: "from-[#0A1A3A] via-[#071328] to-[#030814]",
    accent: "text-blue-300",
    glowColor: "224 85 52",
    glowColors: ["#1e3a8a", "#2563eb", "#60a5fa"]
  }
};

export function CardDetailModal({ card, onClose }: CardDetailModalProps) {
  const [copied, setCopied] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  // Play audio on open
  useEffect(() => {
    if (card) {
      sound.playCardFlip();
    }
  }, [card]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  if (!card) return null;

  const rarityTheme = RARITY_THEMES[card.rarity] || RARITY_THEMES.Common;
  const logoUrl = getChainLogoUrl(card.assetSymbol);
  const livePriceData = marketService.getPrices()[card.assetSymbol];
  const isPumping = card.trend === "pump";
  const isDumping = card.trend === "dump";

  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width - 0.5) * 16;
    const y = ((e.clientY - rect.top) / rect.height - 0.5) * -16;
    setTilt({ x, y });
  };

  const handleCardMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const handleCopyContract = () => {
    sound.playClick();
    navigator.clipboard.writeText("0x799C0212a45B7B124C270bA33De49F27E9113B92");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Sparkline data calculation for telemetry
  const sparkline = card.sparkline && card.sparkline.length > 0 ? card.sparkline : [100, 102, 99, 105, 108];
  const minPrice = Math.min(...sparkline);
  const maxPrice = Math.max(...sparkline);
  const priceRange = maxPrice - minPrice || 1;
  const points = sparkline
    .map((val, idx) => {
      const x = (idx / (sparkline.length - 1)) * 320;
      const y = 60 - ((val - minPrice) / priceRange) * 48;
      return `${x},${y}`;
    })
    .join(" ");

  // Battle Power Index computation
  const battlePowerIndex = card.currentAtk + card.currentDef + card.currentSpd;
  const bpiTier =
    battlePowerIndex >= 260 ? "S+ TIER" : battlePowerIndex >= 210 ? "A TIER" : "B TIER";

  // Max stat reference for progress bars
  const maxStatRef = 150;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-6 overflow-y-auto">
      {/* Tactical Cyber Modal Frame */}
      <div className="w-full max-w-5xl bg-[#080B12] border border-slate-700/70 rounded-2xl shadow-[0_25px_70px_rgba(0,0,0,0.85)] text-slate-100 relative overflow-hidden my-auto">
        {/* Subtle Ambient Background Gradients */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-[#0A0E18]">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-700/80 text-[11px] font-chakra text-slate-300">
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span className="font-bold tracking-wider">TACTICAL CARD DOSSIER</span>
            </div>
            <span className="text-xs text-slate-500 font-inconsolata">ID #{card.tokenId}</span>
          </div>

          <div className="flex items-center space-x-2">
            <div className="hidden sm:flex items-center space-x-1.5 text-xs text-slate-400 font-chakra mr-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-emerald-400 font-semibold">Live Oracle Active</span>
            </div>
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 border border-transparent hover:border-slate-700 transition-colors"
              title="Close (Esc)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content Grid */}
        <div className="p-5 sm:p-7 grid grid-cols-1 lg:grid-cols-12 gap-7">
          {/* LEFT COLUMN: 3D Holographic Cyber Showcase with BorderGlow */}
          <div className="lg:col-span-5 flex flex-col items-center justify-between space-y-4">
            <div
              onMouseMove={handleCardMouseMove}
              onMouseLeave={handleCardMouseLeave}
              style={{
                transform: `perspective(1000px) rotateX(${tilt.y}deg) rotateY(${tilt.x}deg)`,
                transition: "transform 0.15s ease-out"
              }}
              className="w-full max-w-[320px] aspect-[2/3] rounded-2xl relative select-none cursor-grab active:cursor-grabbing"
            >
              <BorderGlow
                borderRadius={18}
                backgroundColor="#080C14"
                glowColor={rarityTheme.glowColor}
                colors={rarityTheme.glowColors}
                edgeSensitivity={26}
                glowRadius={36}
                glowIntensity={1.3}
                coneSpread={30}
                className={`w-full h-full border-2 ${rarityTheme.border} bg-gradient-to-b ${rarityTheme.gradient} shadow-2xl relative overflow-hidden`}
                innerClassName="p-4 w-full h-full flex flex-col justify-between"
              >
                {/* Dynamic Foil Overlays */}
                {card.foilType === "Holo" && (
                  <div className="absolute inset-0 rounded-2xl holo-card-overlay pointer-events-none" />
                )}
                {card.foilType === "GoldFoil" && (
                  <div className="absolute inset-0 rounded-2xl gold-foil-overlay pointer-events-none" />
                )}

                {/* Card Header: Chain Logo, Symbol & Rarity Badge */}
                <div className="flex items-center justify-between z-10">
                  <div className="flex items-center space-x-2">
                    <div className="w-9 h-9 rounded-xl border border-slate-700 bg-slate-950 p-1.5 flex items-center justify-center shadow-lg">
                      <img
                        src={logoUrl}
                        alt={card.assetSymbol}
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <div>
                      <div className="font-chakra font-black text-sm text-slate-100 tracking-wider">
                        {card.assetSymbol}
                      </div>
                      <div className="text-[10px] text-slate-400 font-hanken">
                        {card.category}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-end space-y-1">
                    <span
                      className={`text-[10px] font-chakra font-black uppercase px-2 py-0.5 rounded border ${rarityTheme.badge} tracking-wider`}
                    >
                      {card.rarity}
                    </span>
                    {card.foilType !== "Standard" && (
                      <span className="flex items-center space-x-1 text-[9px] font-chakra text-amber-300 bg-amber-950/60 px-1.5 py-0.2 rounded border border-amber-500/40">
                        <Sparkles className="w-2.5 h-2.5" />
                        <span>{card.foilType === "GoldFoil" ? "Gold Foil" : "Holographic"}</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Card Artwork Plate */}
                <div className="relative w-full h-44 rounded-xl bg-[#050810] border border-slate-800/80 overflow-hidden flex flex-col items-center justify-center p-3 z-10 group">
                  <div className="absolute inset-0 bg-gradient-to-t from-[#050810] via-transparent to-transparent opacity-80" />
                  <div className="w-20 h-20 rounded-2xl bg-slate-900/90 border border-slate-700 p-3.5 shadow-[0_0_30px_rgba(0,0,0,0.8)] flex items-center justify-center mb-2">
                    <img
                      src={logoUrl}
                      alt={card.assetSymbol}
                      className="w-full h-full object-contain filter drop-shadow-[0_0_12px_rgba(255,255,255,0.4)]"
                    />
                  </div>

                  <div className="font-chakra font-black text-base text-slate-100 text-center leading-tight tracking-wide z-10">
                    {card.name}
                  </div>
                  <div className="text-xs text-slate-400 italic text-center font-hanken z-10 mt-0.5">
                    {card.subtitle}
                  </div>

                  {/* Market Volatility Ribbon Indicator */}
                  <div
                    className={`absolute bottom-2 flex items-center space-x-1 font-mono text-[11px] font-bold ${
                      isPumping
                        ? "text-emerald-400"
                        : isDumping
                        ? "text-rose-400"
                        : "text-slate-400"
                    }`}
                  >
                    {isPumping ? (
                      <TrendingUp className="w-3.5 h-3.5" />
                    ) : isDumping ? (
                      <TrendingDown className="w-3.5 h-3.5" />
                    ) : (
                      <Activity className="w-3.5 h-3.5" />
                    )}
                    <span>
                      {card.deltaPercent >= 0 ? "+" : ""}
                      {card.deltaPercent}% Oracle Modifier
                    </span>
                  </div>
                </div>

                {/* Card Flavor & Provenance Footer */}
                <div className="bg-[#060912]/90 rounded-lg p-2.5 border border-slate-800/80 z-10">
                  <p className="text-[11px] text-slate-400 italic font-hanken leading-relaxed text-center">
                    &ldquo;{card.flavorText}&rdquo;
                  </p>
                </div>
              </BorderGlow>
            </div>

            {/* Interactive 3D Rotation Note */}
            <div className="text-center text-[11px] text-slate-500 font-chakra">
              <span>Hover near edges to ignite reactive border glow • Move to tilt 3D</span>
            </div>
          </div>

          {/* RIGHT COLUMN: Tactical Combat HUD, Live Telemetry & Provenance */}
          <div className="lg:col-span-7 space-y-4">
            {/* Header Identity & Quick Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-2xl sm:text-3xl font-bold font-silkscreen text-slate-100 tracking-tight">
                    {card.name}
                  </h2>
                  <span className="text-xs font-chakra font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/40">
                    {bpiTier}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-hanken mt-0.5">
                  {card.subtitle} • {card.category} • Token #{card.tokenId}
                </p>
              </div>

              <div className="text-right">
                <div className="text-xs font-chakra text-slate-400">Battle Power Index</div>
                <div className="text-2xl font-black font-inconsolata text-emerald-400 leading-tight">
                  {battlePowerIndex} <span className="text-xs text-slate-500 font-normal">PTS</span>
                </div>
              </div>
            </div>

            {/* Section 1: Live Oracle Telemetry Module */}
            <div className="p-4 rounded-xl bg-[#0C111C] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="w-4 h-4 text-cyan-400" />
                  <span className="text-xs font-chakra font-bold text-slate-200 uppercase tracking-wide">
                    Real-Time Oracle Telemetry
                  </span>
                </div>
                <div className="text-xs font-inconsolata text-slate-400 flex items-center space-x-2">
                  <span>Feed: Chainlink Streams</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                </div>
              </div>

              {/* Price & Multiplier Metric Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[#090D16] border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-chakra">SPOT PRICE</span>
                  <span className="text-sm font-bold font-inconsolata text-slate-100">
                    ${livePriceData?.price ? livePriceData.price.toLocaleString() : "N/A"}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#090D16] border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-chakra">24H CHANGE</span>
                  <span
                    className={`text-sm font-bold font-inconsolata ${
                      (livePriceData?.change24h ?? 0) >= 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {(livePriceData?.change24h ?? 0) >= 0 ? "+" : ""}
                    {livePriceData?.change24h ?? 0}%
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#090D16] border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-chakra">STAT MULTIPLIER</span>
                  <span className="text-sm font-bold font-inconsolata text-emerald-400">
                    {card.statMultiplier.toFixed(2)}x
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-[#090D16] border border-slate-800">
                  <span className="text-[10px] text-slate-400 block font-chakra">COMBAT TREND</span>
                  <span
                    className={`text-xs font-bold font-chakra capitalize block truncate ${
                      isPumping ? "text-emerald-400" : isDumping ? "text-rose-400" : "text-slate-300"
                    }`}
                  >
                    {isPumping ? "Bull Rally" : isDumping ? "Bear Dip" : "Equilibrium"}
                  </span>
                </div>
              </div>

              {/* Live Sparkline Area Chart */}
              <div className="w-full bg-[#080B13] rounded-lg border border-slate-800/80 p-3">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-inconsolata mb-1">
                  <span>24h Trajectory</span>
                  <span>Range: ${minPrice.toFixed(2)} — ${maxPrice.toFixed(2)}</span>
                </div>
                <svg className="w-full h-12 overflow-visible" viewBox="0 0 320 60">
                  <defs>
                    <linearGradient id={`grad-${card.id}`} x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop
                        offset="0%"
                        stopColor={isPumping ? "#10b981" : isDumping ? "#f43f5e" : "#06b6d4"}
                        stopOpacity="0.4"
                      />
                      <stop
                        offset="100%"
                        stopColor={isPumping ? "#10b981" : isDumping ? "#f43f5e" : "#06b6d4"}
                        stopOpacity="0.0"
                      />
                    </linearGradient>
                  </defs>
                  <polygon
                    fill={`url(#grad-${card.id})`}
                    points={`0,60 ${points} 320,60`}
                  />
                  <polyline
                    fill="none"
                    stroke={isPumping ? "#10b981" : isDumping ? "#f43f5e" : "#06b6d4"}
                    strokeWidth="2.5"
                    points={points}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>

            {/* Section 2: Combat Attributes Progress Gauges (Base vs Live Modifier) */}
            <div className="p-4 rounded-xl bg-[#0C111C] border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-chakra font-bold text-slate-200 uppercase tracking-wide flex items-center space-x-1.5">
                  <Swords className="w-4 h-4 text-rose-400" />
                  <span>Combat Attributes Matrix</span>
                </span>
                <span className="text-[11px] font-chakra text-slate-400">
                  Base vs Oracle Modified
                </span>
              </div>

              <div className="space-y-3">
                {/* ATTACK GAUGE */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-chakra">
                    <span className="text-rose-400 font-bold flex items-center space-x-1">
                      <Swords className="w-3.5 h-3.5" />
                      <span>ATTACK POWER</span>
                    </span>
                    <span className="font-inconsolata font-bold text-slate-200">
                      {card.currentAtk}{" "}
                      <span className="text-slate-500 font-normal">(Base {card.baseAtk})</span>
                      {card.currentAtk !== card.baseAtk && (
                        <span
                          className={`ml-1 text-[11px] font-bold ${
                            card.currentAtk > card.baseAtk ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {card.currentAtk > card.baseAtk ? "+" : ""}
                          {card.currentAtk - card.baseAtk}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-rose-600 to-rose-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (card.currentAtk / maxStatRef) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* DEFENSE GAUGE */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-chakra">
                    <span className="text-cyan-400 font-bold flex items-center space-x-1">
                      <Shield className="w-3.5 h-3.5" />
                      <span>DEFENSE SHIELD</span>
                    </span>
                    <span className="font-inconsolata font-bold text-slate-200">
                      {card.currentDef}{" "}
                      <span className="text-slate-500 font-normal">(Base {card.baseDef})</span>
                      {card.currentDef !== card.baseDef && (
                        <span
                          className={`ml-1 text-[11px] font-bold ${
                            card.currentDef > card.baseDef ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {card.currentDef > card.baseDef ? "+" : ""}
                          {card.currentDef - card.baseDef}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-600 to-cyan-400 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (card.currentDef / maxStatRef) * 100)}%` }}
                    />
                  </div>
                </div>

                {/* SPEED GAUGE */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-chakra">
                    <span className="text-amber-400 font-bold flex items-center space-x-1">
                      <Zap className="w-3.5 h-3.5" />
                      <span>SPEED & INITIATIVE</span>
                    </span>
                    <span className="font-inconsolata font-bold text-slate-200">
                      {card.currentSpd}{" "}
                      <span className="text-slate-500 font-normal">(Base {card.baseSpd})</span>
                      {card.currentSpd !== card.baseSpd && (
                        <span
                          className={`ml-1 text-[11px] font-bold ${
                            card.currentSpd > card.baseSpd ? "text-emerald-400" : "text-rose-400"
                          }`}
                        >
                          {card.currentSpd > card.baseSpd ? "+" : ""}
                          {card.currentSpd - card.baseSpd}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className="h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min(100, (card.currentSpd / maxStatRef) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section 3: Special Ability & Tactical Dossier */}
            <div className="p-4 rounded-xl bg-[#0C111C] border border-slate-800 space-y-2">
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                  <Flame className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-chakra font-bold text-slate-200 uppercase">
                    Combat Ability: {card.skill.name}
                  </span>
                </div>
                <span className="text-xs font-inconsolata font-bold text-cyan-400 bg-cyan-950/80 px-2 py-0.5 rounded border border-cyan-500/40">
                  {card.skill.manaCost} Energy Cost
                </span>
              </div>
              <p className="text-xs text-slate-300 font-hanken leading-relaxed">
                {card.skill.description}
              </p>
            </div>

            {/* Section 4: On-Chain Provenance */}
            <div className="p-3.5 rounded-xl bg-[#090D16] border border-slate-800 text-[11px] font-inconsolata space-y-2">
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-chakra">SMART CONTRACT:</span>
                <button
                  onClick={handleCopyContract}
                  className="flex items-center space-x-1 text-slate-300 hover:text-emerald-400 transition-colors"
                  title="Copy contract address"
                >
                  <span>0x799C...3B92 (Sepolia)</span>
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center justify-between text-slate-400">
                <span className="font-chakra">OWNERSHIP TOKEN:</span>
                <span className="text-slate-300">ERC-721 #00{card.tokenId} • {card.owner}</span>
              </div>
            </div>

            {/* Modal Bottom Action Bar */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
              <Link
                href="/battle"
                onClick={() => {
                  sound.playClick();
                  onClose();
                }}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 font-chakra font-bold text-xs uppercase tracking-wider flex items-center space-x-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all"
              >
                <Swords className="w-4 h-4" />
                <span>Battle With This Card</span>
                <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
              </Link>

              <Link
                href="/marketplace"
                onClick={() => {
                  sound.playClick();
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-chakra font-bold text-xs uppercase tracking-wider flex items-center space-x-1.5 transition-colors"
              >
                <span>Find On Market</span>
              </Link>

              <button
                onClick={() => {
                  sound.playClick();
                  onClose();
                }}
                className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 font-chakra text-xs uppercase transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
