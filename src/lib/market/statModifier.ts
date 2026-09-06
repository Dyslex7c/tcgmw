import { Card, LivePriceData } from "@/types";

export interface StatModificationResult {
  multiplier: number;
  deltaPercent: number;
  trend: "pump" | "dump" | "neutral";
  displayText: string;
  badgeColor: string;
}

/**
 * Calculates real-time stat modifiers from live price movements.
 * Sane bounds: capped between -40% debuff and +60% buff to preserve competitive balance.
 */
export function calculateStatModifier(
  card: Card,
  marketPrice: LivePriceData | undefined
): StatModificationResult {
  if (!marketPrice) {
    return {
      multiplier: 1.0,
      deltaPercent: 0,
      trend: "neutral",
      displayText: "0% — Market Neutral",
      badgeColor: "text-slate-400 border-slate-700 bg-slate-800/40"
    };
  }

  // Use rolling 5m/24h blended delta for dynamic responsive gameplay
  const delta = (marketPrice.change5m * 1.5) + (marketPrice.change24h * 0.2);

  // Sensitivity curve with clamping
  const rawModifier = delta * 0.02; // e.g. +10% price move gives +20% stat buff
  const clampedModifier = Math.max(-0.4, Math.min(0.6, rawModifier));
  const multiplier = 1 + clampedModifier;
  const effectiveDeltaPercent = Number((clampedModifier * 100).toFixed(1));

  let trend: "pump" | "dump" | "neutral" = "neutral";
  let displayText = "0% — Flat Market";
  let badgeColor = "text-slate-400 border-slate-700 bg-slate-800/40";

  if (effectiveDeltaPercent >= 3.0) {
    trend = "pump";
    displayText = `+${effectiveDeltaPercent}% ATK — ${card.assetSymbol} Rallying!`;
    badgeColor = "text-emerald-400 border-emerald-500/40 bg-emerald-950/60 shadow-[0_0_12px_rgba(16,185,129,0.3)]";
  } else if (effectiveDeltaPercent <= -3.0) {
    trend = "dump";
    displayText = `${effectiveDeltaPercent}% ATK — ${card.assetSymbol} Dump`;
    badgeColor = "text-rose-400 border-rose-500/40 bg-rose-950/60 shadow-[0_0_12px_rgba(244,63,94,0.3)]";
  }

  return {
    multiplier,
    deltaPercent: effectiveDeltaPercent,
    trend,
    displayText,
    badgeColor
  };
}

/**
 * Returns a cloned card with current stats updated by live price feeds.
 */
export function applyLiveStatsToCard(card: Card, marketPrice?: LivePriceData): Card {
  const result = calculateStatModifier(card, marketPrice);
  return {
    ...card,
    statMultiplier: result.multiplier,
    deltaPercent: result.deltaPercent,
    trend: result.trend,
    currentAtk: Math.round(card.baseAtk * result.multiplier),
    currentDef: Math.round(card.baseDef * result.multiplier),
    currentSpd: Math.round(card.baseSpd * result.multiplier)
  };
}
