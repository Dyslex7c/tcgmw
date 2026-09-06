"use client";

import Link from "next/link";
import { useState, useEffect, useRef, useMemo } from "react";
import { BASE_CARD_CATALOG, EVM_CARD_CATALOG } from "@/lib/storage/mockCards";
import { marketService } from "@/lib/market/priceFeed";
import { applyLiveStatsToCard } from "@/lib/market/statModifier";
import { sound } from "@/lib/audio/soundEngine";
import { CardComponent } from "@/components/cards/CardComponent";
import { CardDetailModal } from "@/components/cards/CardDetailModal";
import { DriftCardTile } from "@/components/cards/DriftCardTile";
import DriftWall from "@/components/ui/DriftWall";
import { Card } from "@/types";
import {
  Swords,
  Package,
  Store,
  Trophy,
  ShieldCheck,
  Zap,
  Flame,
  Activity,
  ArrowRight,
  TrendingUp,
  Sparkles
} from "lucide-react";

export default function HomePage() {
  const [prices, setPrices] = useState(marketService.getPrices());
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const unsub = marketService.subscribe((updated) => {
      setPrices(updated);
    });
    return () => {
      unsub();
    };
  }, []);

  // Ensure slow-motion playback rate persists seamlessly
  useEffect(() => {
    const vid = videoRef.current;
    if (!vid) return;

    vid.playbackRate = 0.8;
    const handleEnded = () => {
      vid.currentTime = 0;
      vid.playbackRate = 0.8;
      vid.play().catch(() => {});
    };

    vid.addEventListener("ended", handleEnded);
    return () => {
      vid.removeEventListener("ended", handleEnded);
    };
  }, []);

  const cardRobinhood = BASE_CARD_CATALOG.find((c) => c.assetSymbol === "ROBINHOOD") || BASE_CARD_CATALOG[0];
  const cardEth = BASE_CARD_CATALOG.find((c) => c.assetSymbol === "ETH") || BASE_CARD_CATALOG[1];
  const cardMonad = BASE_CARD_CATALOG.find((c) => c.assetSymbol === "MONAD") || BASE_CARD_CATALOG[2];

  const featuredRobinhood = applyLiveStatsToCard(cardRobinhood, prices.ROBINHOOD);
  const featuredEth = applyLiveStatsToCard(cardEth, prices.ETH);
  const featuredMonad = applyLiveStatsToCard(cardMonad, prices.MONAD);

  // Prepare EVM-only cards with real-time live stats for the DriftWall
  const driftCards = useMemo(() => {
    const liveList = EVM_CARD_CATALOG.map((card) =>
      applyLiveStatsToCard(card, prices[card.assetSymbol])
    );
    // Repeat to create an expansive 78-card EVM wall across the 5 drifting columns for an ultra-long continuous cycle
    return [...liveList, ...liveList, ...liveList];
  }, [prices]);

  return (
    <div className="w-full">
      {/* FULL-WIDTH EDGE-TO-EDGE HERO SECTION WITH SLOW-MOTION LOOPING VIDEO */}
      <section className="relative w-full overflow-hidden border-b border-slate-800/80 min-h-[640px] lg:min-h-[720px] flex items-center bg-[#07090E]">
        {/* Full-width Edge-to-Edge Video Container */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 w-full h-full">
          <video
            ref={videoRef}
            src="/hero.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover opacity-95 filter contrast-105 brightness-100"
          >
            <source src="/hero.mp4" type="video/mp4" />
          </video>
          {/* Soft multi-stop gradient overlays: keeps left side text readable while letting video shine brightly */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#07090E]/90 via-[#07090E]/50 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#07090E] via-transparent to-[#07090E]/40" />
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-red-600/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-orange-600/15 rounded-full blur-3xl pointer-events-none" />
        </div>

        {/* Hero Content (Centered Max Width within Full-Width Hero) */}
        <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 w-full">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-12">
            {/* Left Column: Headlines & Call to Actions */}
            <div className="max-w-3xl space-y-6 text-center lg:text-left">
              {/* Tactical Header Label */}
              <div className="flex items-center space-x-2.5 text-xs font-chakra font-bold tracking-widest text-orange-400">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span>SEASON 01 // LIVE COMBAT ARENA</span>
              </div>

              {/* Hero Heading (Silkscreen retro arcade font) */}
              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-silkscreen font-bold text-slate-100 tracking-wider leading-[1.25] uppercase drop-shadow-[0_4px_25px_rgba(0,0,0,0.9)]">
                YOUR CARDS HUNT. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-500 to-rose-600">
                  THE MARKET BLEEDS.
                </span>
              </h1>

              {/* Subtitle (Clean reduced game body font) */}
              <p className="text-xs sm:text-sm text-slate-400 max-w-lg font-hanken leading-relaxed mx-auto lg:mx-0">
                Real-time crypto candles fuel your deck. Green spikes supercharge your attack power; sudden dumps smash through rival shields.
                Build your squad, wage war against rival traders, and pillage the on-chain prize pool.
              </p>

              {/* Action CTAs */}
              <div className="flex flex-wrap items-center justify-center lg:justify-start gap-4 pt-2">
                <Link
                  href="/battle"
                  onClick={() => sound.playClick()}
                  className="px-7 py-4 rounded-xl bg-gradient-to-r from-orange-600 via-red-600 to-rose-700 hover:from-orange-500 hover:via-red-500 hover:to-rose-600 text-white font-chakra font-black text-xs uppercase tracking-wider flex items-center space-x-2 shadow-[0_0_30px_rgba(220,38,38,0.45)] border border-red-500/40 transition-all hover:scale-105"
                >
                  <Swords className="w-4 h-4 text-orange-200" />
                  <span>Enter the Arena</span>
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Link>

                <Link
                  href="/packs"
                  onClick={() => sound.playClick()}
                  className="px-7 py-4 rounded-xl bg-[#111726]/90 hover:bg-[#162035] border border-slate-700 text-slate-200 font-chakra font-bold text-xs uppercase tracking-wider flex items-center space-x-2 transition-colors shadow-lg"
                >
                  <Package className="w-4 h-4 text-orange-400" />
                  <span>Crack Booster Packs</span>
                </Link>

                <Link
                  href="/marketplace"
                  onClick={() => sound.playClick()}
                  className="px-6 py-4 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-slate-100 font-hanken text-xs font-semibold tracking-wider transition-colors"
                >
                  Browse Armory
                </Link>
              </div>
            </div>

            {/* Right Column: Live Floating Cards Showcase */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 shrink-0">
              <div className="transform -rotate-2 hover:rotate-0 transition-transform duration-300">
                <CardComponent card={featuredRobinhood} size="md" onClick={() => setSelectedCard(featuredRobinhood)} />
              </div>
              <div className="transform rotate-2 hover:rotate-0 transition-transform duration-300 hidden sm:block">
                <CardComponent card={featuredEth} size="md" onClick={() => setSelectedCard(featuredEth)} />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOWER CONTENT CONTAINER */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-20 py-16">
        {/* FEATURE PILLARS */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="space-y-3">
            <Activity className="w-6 h-6 text-red-500" />
            <h3 className="text-base font-chakra font-bold text-slate-100 uppercase tracking-wide">
              Ticker-Powered Damage
            </h3>
            <p className="text-xs text-slate-400 font-hanken leading-relaxed">
              Cards sync live to real exchange charts. When Bitcoin surges, your BTC Berserker lands lethal critical strikes. When the market bleeds, shields buckle. Volatility is your weapon.
            </p>
          </div>

          <div className="space-y-3">
            <ShieldCheck className="w-6 h-6 text-orange-500" />
            <h3 className="text-base font-chakra font-bold text-slate-100 uppercase tracking-wide">
              Provably Fair Loot
            </h3>
            <p className="text-xs text-slate-400 font-hanken leading-relaxed">
              Zero rigged pulls. Every booster pack rolls through Chainlink VRF on-chain entropy. Foil rarities and mythical drops are mathematically sealed and provably unhackable.
            </p>
          </div>

          <div className="space-y-3">
            <Trophy className="w-6 h-6 text-rose-500" />
            <h3 className="text-base font-chakra font-bold text-slate-100 uppercase tracking-wide">
              The War Chest
            </h3>
            <p className="text-xs text-slate-400 font-hanken leading-relaxed">
              Every pack cracked and card traded funnels ETH straight into the tournament bounty. Slay contenders on the seasonal leaderboard and loot the pot directly to your wallet.
            </p>
          </div>
        </section>
      </div>

      {/* FULL-WIDTH EDGE-TO-EDGE CLASH OF MARKET COLOSSI SECTION */}
      <section className="relative w-full overflow-hidden border-y border-slate-800/80 bg-[#05070D] min-h-[580px] sm:min-h-[640px] lg:min-h-[700px] flex items-center justify-center">
        {/* Full-width Edge-to-Edge Artwork - High Visibility & Full Opacity */}
        <div className="absolute inset-0 z-0 w-full h-full overflow-hidden pointer-events-none">
          <img
            src="/battle-clash.jpg"
            alt="Clash of the Market Colossi - Robinhood Vanguard vs Ethereum Titan"
            className="w-full h-full object-cover object-center filter brightness-105 contrast-105 opacity-80"
          />
          {/* Subtle Top & Bottom Seamless Edge Blends (middle is clear and vivid) */}
          <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-[#07090E] via-[#07090E]/50 to-transparent pointer-events-none" />
          <div className="absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-[#07090E] via-[#07090E]/50 to-transparent pointer-events-none" />
        </div>

        {/* Tactical HUD Overlay - Balanced Middle-Ground Sizing */}
        <div className="relative z-10 max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 w-full flex flex-col justify-between min-h-[580px] sm:min-h-[640px] lg:min-h-[700px] space-y-6">
          {/* Top Tactical Status Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2 text-xs font-chakra font-bold tracking-wider text-orange-400">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span>THE KILLING FLOOR // MATCH 04</span>
            </div>

            <div className="flex items-center space-x-2 text-xs font-chakra font-bold text-red-400">
              <Flame className="w-4 h-4 text-orange-500" />
              <span>High-Volatility Deathmatch</span>
            </div>
          </div>

          {/* Open Battlefield Spacer - Keeps the epic central duel completely visible */}
          <div className="my-auto pointer-events-none" />

          {/* Bottom HUD: Lore & Dual Telemetry Cards */}
          <div className="space-y-6 pt-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end">
              {/* Lore Card (Glassmorphic) */}
              <div className="lg:col-span-6 p-6 sm:p-7 rounded-2xl bg-[#060912]/85 border border-slate-700/60 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] space-y-3.5">
                <div className="inline-flex items-center space-x-1.5 text-[11px] font-chakra font-bold text-orange-400 uppercase tracking-widest">
                  <span>TITAN SHOWDOWN</span>
                  <span>•</span>
                  <span>WHO DIES FIRST?</span>
                </div>
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-silkscreen font-bold text-slate-100 uppercase tracking-wider leading-[1.2] drop-shadow-lg">
                  CLASH OF THE <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-red-500 to-rose-600">
                    MARKET COLOSSI
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-slate-300 font-hanken leading-relaxed drop-shadow">
                  Two titans lock into fatal combat. Robinhood&apos;s sharpshooter draws back on high-velocity momentum arrows, looking to puncture vital points on sudden market spikes. Across the killing floor stands the towering Ethereum Golem—a monolith forged from validator consensus and unyielding gas shields. Pick your champion, build your deck, and fight for the spoils.
                </p>
                <div className="flex flex-wrap items-center gap-3 pt-1">
                  <Link
                    href="/battle"
                    onClick={() => sound.playClick()}
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-orange-600 via-red-600 to-rose-700 hover:from-orange-500 hover:via-red-500 hover:to-rose-600 text-white font-chakra font-black text-xs uppercase tracking-wider flex items-center space-x-2 shadow-[0_0_25px_rgba(220,38,38,0.5)] border border-red-500/40 transition-all hover:scale-105"
                  >
                    <Swords className="w-4 h-4 text-orange-200" />
                    <span>Deploy Into Battle</span>
                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                  </Link>

                  <Link
                    href="/packs"
                    onClick={() => sound.playClick()}
                    className="px-5 py-3 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-200 font-chakra font-bold text-xs uppercase tracking-wider flex items-center space-x-2 transition-colors"
                  >
                    <Package className="w-4 h-4 text-orange-400" />
                    <span>Loot Titan Packs</span>
                  </Link>
                </div>
              </div>

              {/* Combatants Dual Cards (Archer on Left, Titan on Right) */}
              <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Robinhood Archer Card */}
                <div className="p-4 rounded-xl bg-[#060912]/85 border border-orange-500/40 backdrop-blur-xl shadow-[0_15px_35px_rgba(234,88,12,0.2)] flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xl">🪶</span>
                    <span className="text-[11px] font-chakra font-bold text-orange-400 uppercase tracking-wider">
                      AGILITY SNIPER
                    </span>
                  </div>
                  <div>
                    <div className="font-chakra font-bold text-sm text-slate-100 uppercase">
                      Robinhood Vanguard
                    </div>
                    <div className="text-[11px] font-hanken text-slate-400">
                      High-Frequency Volatility Striker
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs font-inconsolata">
                    <span className="text-slate-400">Passive Buff</span>
                    <span className="font-bold text-orange-400">+14.2% Volatility Surge</span>
                  </div>
                </div>

                {/* Ethereum Titan Card */}
                <div className="p-4 rounded-xl bg-[#060912]/85 border border-red-600/40 backdrop-blur-xl shadow-[0_15px_35px_rgba(220,38,38,0.2)] flex flex-col justify-between space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xl font-bold font-mono text-red-400">Ξ</span>
                    <span className="text-[11px] font-chakra font-bold text-red-400 uppercase tracking-wider">
                      IRONCLAD TANK
                    </span>
                  </div>
                  <div>
                    <div className="font-chakra font-bold text-sm text-slate-100 uppercase">
                      Ethereum Colossus
                    </div>
                    <div className="text-[11px] font-hanken text-slate-400">
                      Validator Consensus Armor • Gas Shield
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800 text-xs font-inconsolata">
                    <span className="text-slate-400">Passive Armor</span>
                    <span className="font-bold text-red-400">1.25x Burst Reduction</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* LOWER CONTENT CONTAINER */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 space-y-20 py-16">
        {/* 3D DRIFT WALL SECTION - THE DRIFTING VAULT */}
        <section className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2 text-xs font-chakra font-bold tracking-wider text-orange-400 mb-2">
                <Sparkles className="w-3.5 h-3.5" />
                <span>ARMORY ARCHIVES // 78 COMBAT ASSETS</span>
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-silkscreen font-bold text-slate-100 uppercase tracking-wider">
                The Armory Wall
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 font-hanken">
                Tilt perspective to scan the vault. Hover any card to inspect live ticker modifiers and combat power.
              </p>
            </div>

            <div className="flex items-center space-x-3 text-xs font-chakra">
              <span className="text-slate-400 flex items-center space-x-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span className="text-orange-400 font-bold">17 Active Chains</span>
              </span>
              <Link
                href="/collection"
                onClick={() => sound.playClick()}
                className="px-4 py-2 rounded-lg bg-gradient-to-r from-orange-600 via-red-600 to-rose-700 hover:from-orange-500 hover:via-red-500 hover:to-rose-600 text-white font-bold uppercase transition-all shadow-[0_0_15px_rgba(220,38,38,0.35)] border border-red-500/30"
              >
                Inspect Armory
              </Link>
            </div>
          </div>

          {/* DriftWall Component Container */}
          <div className="w-full h-[620px] rounded-3xl border border-slate-800/80 bg-[#06080E] relative overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.8)]">
            <DriftWall
              items={driftCards}
              columns={5}
              tileWidth={200}
              tileHeight={285}
              gap={18}
              radius={14}
              tilt={16}
              turn={-14}
              roll={0}
              perspective={1200}
              depth={120}
              speed={24}
              direction="up"
              variance={0.45}
              parallax={0.65}
              lift={70}
              fade={0.55}
              dim={0.7}
              overlayColor="#07090e"
              renderItem={(card: Card) => <DriftCardTile card={card} />}
              onTileClick={(card: Card) => setSelectedCard(card)}
            />
          </div>
        </section>

        {/* FEATURED VOLATILITY CARDS SECTION */}
        <section className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-silkscreen font-bold text-slate-100 uppercase tracking-wider">
                Featured Combatants
              </h2>
              <p className="text-xs text-slate-400 font-hanken">
                Real-time volatility feeds directly modify Attack, Defense, and Speed ratings.
              </p>
            </div>
            <Link
              href="/marketplace"
              className="text-xs font-chakra font-bold text-orange-400 hover:text-orange-300 flex items-center space-x-1"
            >
              <span>Browse Black Market Armory</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="flex flex-wrap justify-center sm:justify-start gap-6">
            <CardComponent card={featuredRobinhood} size="md" onClick={() => setSelectedCard(featuredRobinhood)} />
            <CardComponent card={featuredEth} size="md" onClick={() => setSelectedCard(featuredEth)} />
            <CardComponent card={featuredMonad} size="md" onClick={() => setSelectedCard(featuredMonad)} />
          </div>
        </section>
      </div>

      {/* Card Detail Modal */}
      <CardDetailModal
        card={selectedCard}
        onClose={() => setSelectedCard(null)}
      />
    </div>
  );
}
