"use client";

import { useEffect, useState } from "react";
import { marketService } from "@/lib/market/priceFeed";
import { AssetSymbol, LivePriceData } from "@/types";
import { TrendingUp, TrendingDown, Zap } from "lucide-react";
import { sound } from "@/lib/audio/soundEngine";
import { getChainLogoUrl } from "@/lib/constants/chainLogos";

interface LiveMarketTickerProps {
  onOpenSimulator?: () => void;
}

export function LiveMarketTicker({ onOpenSimulator }: LiveMarketTickerProps) {
  const [prices, setPrices] = useState<Record<AssetSymbol, LivePriceData>>(marketService.getPrices());
  const [highlightedAsset, setHighlightedAsset] = useState<string | null>(null);

  useEffect(() => {
    const unsub = marketService.subscribe((updated) => {
      setPrices(updated);
    });
    return () => {
      unsub();
    };
  }, []);

  const handleQuickPump = (sym: AssetSymbol, e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playPumpSurge();
    marketService.triggerMarketShock(sym, 8.5);
    setHighlightedAsset(sym);
    setTimeout(() => setHighlightedAsset(null), 1500);
  };

  const assetList = Object.values(prices);

  // Repeat items to ensure a perfectly seamless infinite loop
  const loopedAssets = [...assetList, ...assetList, ...assetList, ...assetList];

  return (
    <div className="w-full bg-[#080C14] border-b border-[#161F2E] flex items-center text-xs select-none relative z-30 h-9">
      {/* Pinned Left Oracle Status & Volatility Sim Trigger */}
      <div className="flex items-center space-x-2 shrink-0 px-3 py-1 bg-[#080C14] border-r border-[#161F2E] z-20 shadow-[10px_0_15px_-3px_rgba(0,0,0,0.5)]">
        <div className="flex items-center space-x-1.5 text-emerald-400 font-bold uppercase tracking-wider font-chakra">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-[10px] text-slate-300 font-mono tracking-wider">ORACLE LIVE</span>
        </div>
        {onOpenSimulator && (
          <button
            onClick={() => {
              sound.playClick();
              onOpenSimulator();
            }}
            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-red-600 hover:bg-red-500 text-white font-bold transition-colors text-[10px] font-chakra uppercase tracking-wider shadow-sm"
            title="Open Market Volatility Simulator"
          >
            <Zap className="w-2.5 h-2.5 text-white" />
            <span className="hidden sm:inline">Simulate</span>
          </button>
        )}
      </div>

      {/* Infinite Self-Looping Marquee Slider Track */}
      <div className="relative flex-1 overflow-hidden h-full flex items-center group">
        {/* Left and Right Edge Gradient Masks */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#080C14] to-transparent z-10" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#080C14] to-transparent z-10" />

        <div className="animate-ticker-loop flex items-center space-x-6 whitespace-nowrap">
          {loopedAssets.map((asset, index) => {
            const isUp = asset.change24h >= 0;
            const isHighlighted = highlightedAsset === asset.symbol;

            return (
              <div
                key={`${asset.symbol}-${index}`}
                onClick={(e) => handleQuickPump(asset.symbol, e)}
                className={`flex items-center space-x-1.5 shrink-0 px-2 py-0.5 rounded cursor-pointer transition-all duration-200 ${
                  isHighlighted
                    ? "bg-emerald-500/20 ring-1 ring-emerald-400 scale-105"
                    : "hover:bg-slate-800/70 hover:scale-105"
                }`}
                title={`Click to trigger +8.5% rally on ${asset.symbol} (Hover to pause ticker)`}
              >
                <img
                  src={getChainLogoUrl(asset.symbol)}
                  alt={asset.symbol}
                  className="w-3.5 h-3.5 object-contain rounded-full inline-block shrink-0 bg-slate-900"
                  loading="lazy"
                />
                <span className="font-chakra font-bold text-slate-200 tracking-wide">
                  {asset.symbol}
                </span>
                <span className="font-inconsolata text-slate-400 text-[11px]">
                  ${asset.price < 0.01 ? asset.price.toFixed(7) : asset.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
                <span
                  className={`flex items-center font-inconsolata font-bold text-[10px] ${
                    isUp ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  {isUp ? <TrendingUp className="w-2.5 h-2.5 mr-0.5 inline" /> : <TrendingDown className="w-2.5 h-2.5 mr-0.5 inline" />}
                  {isUp ? "+" : ""}{asset.change24h.toFixed(1)}%
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
