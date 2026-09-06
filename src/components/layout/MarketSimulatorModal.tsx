"use client";

import { useState } from "react";
import { marketService } from "@/lib/market/priceFeed";
import { AssetSymbol, LivePriceData } from "@/types";
import { X, TrendingUp, TrendingDown, RefreshCw, Zap } from "lucide-react";
import { sound } from "@/lib/audio/soundEngine";

interface MarketSimulatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MarketSimulatorModal({ isOpen, onClose }: MarketSimulatorModalProps) {
  const [selectedAsset, setSelectedAsset] = useState<AssetSymbol>("ROBINHOOD");
  const prices = marketService.getPrices();
  const current = prices[selectedAsset];

  if (!isOpen) return null;

  const handleApplyShock = (pct: number) => {
    if (pct > 0) {
      sound.playPumpSurge();
    } else {
      sound.playAttackHit(true);
    }
    marketService.triggerMarketShock(selectedAsset, pct);
  };

  const handleResetAll = () => {
    sound.playClick();
    marketService.resetShocks();
  };

  const assets: AssetSymbol[] = [
    "ROBINHOOD",
    "ETH",
    "ARBITRUM",
    "OPTIMISM",
    "BASE",
    "AVAX",
    "POLYGON",
    "BNB",
    "ZKSYNC",
    "MONAD",
    "COSMOS",
    "APECHAIN",
    "GNOSIS",
    "LINEA",
    "TON",
    "WORLDCHAIN",
    "HEDERA"
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-[#0B0F18] border border-[#1E293B] rounded-xl shadow-2xl p-5 text-slate-100">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Zap className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base text-slate-100">Market Volatility Simulator</h3>
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

        <p className="text-xs text-slate-400 mt-3 mb-4">
          Manually trigger market movements to witness live card in-battle stat transformations in real time.
        </p>

        {/* Asset Selector */}
        <div className="grid grid-cols-5 gap-2 mb-5">
          {assets.map((sym) => {
            const isSelected = selectedAsset === sym;
            const assetPrice = prices[sym];
            return (
              <button
                key={sym}
                onClick={() => {
                  sound.playClick();
                  setSelectedAsset(sym);
                }}
                className={`py-2 px-1 rounded-lg text-xs font-semibold flex flex-col items-center justify-center border transition-all ${
                  isSelected
                    ? "bg-red-600 border-red-500 text-white font-bold shadow-[0_0_12px_rgba(220,38,38,0.4)]"
                    : "bg-black border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <span>{sym}</span>
                <span className={`text-[10px] font-mono-nums ${isSelected ? "text-orange-200" : assetPrice.change24h >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {assetPrice.change24h >= 0 ? "+" : ""}{assetPrice.change24h.toFixed(0)}%
                </span>
              </button>
            );
          })}
        </div>

        {/* Selected Asset Info */}
        <div className="py-3 mb-5 border-y border-slate-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-slate-400">Current {selectedAsset} Price</span>
            <div className="text-xl font-bold font-mono-nums text-slate-100">
              ${current.price < 0.01 ? current.price.toFixed(7) : current.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
          </div>
          <div className="text-right">
            <span className="text-xs text-slate-400">5m Momentum</span>
            <div className={`text-base font-bold font-mono-nums ${current.change5m >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              {current.change5m >= 0 ? "+" : ""}{current.change5m.toFixed(2)}%
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="space-y-2 mb-5">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleApplyShock(12)}
              className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)]"
            >
              <TrendingUp className="w-4 h-4 text-slate-950" />
              <span>Bull Rally (+12%)</span>
            </button>
            <button
              onClick={() => handleApplyShock(25)}
              className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-[0_0_20px_rgba(16,185,129,0.5)]"
            >
              <Zap className="w-4 h-4 text-slate-950" />
              <span>Mega God Candle (+25%)</span>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleApplyShock(-8)}
              className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-all shadow-[0_0_15px_rgba(244,63,94,0.3)]"
            >
              <TrendingDown className="w-4 h-4 text-white" />
              <span>Flash Dump (-8%)</span>
            </button>
            <button
              onClick={() => handleApplyShock(-18)}
              className="flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-lg bg-red-700 hover:bg-red-600 text-white font-black text-xs transition-all shadow-[0_0_20px_rgba(220,38,38,0.5)]"
            >
              <TrendingDown className="w-4 h-4 text-white" />
              <span>Black Swan Panic (-18%)</span>
            </button>
          </div>
        </div>

        {/* Reset button */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
          <button
            onClick={handleResetAll}
            className="flex items-center space-x-1.5 text-xs text-slate-400 hover:text-slate-200 py-1.5 px-2 rounded hover:bg-slate-800 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset All Feeds to Baseline</span>
          </button>
          <button
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
