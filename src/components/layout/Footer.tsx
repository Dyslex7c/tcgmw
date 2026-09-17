"use client";

import Link from "next/link";
import Image from "next/image";
import { sound } from "@/lib/audio/soundEngine";
import { getChainLogoUrl } from "@/lib/constants/chainLogos";
import {
  Swords,
  Package,
  Store,
  Layers,
  Trophy,
  ShieldCheck,
  Zap,
  Activity,
  ExternalLink,
  Cpu,
  Globe,
  Flame,
  ArrowUpRight,
  Sparkles,
  BookOpen
} from "lucide-react";

interface FooterProps {
  onOpenSimulator?: () => void;
}

const SUPPORTED_CHAINS = [
  { symbol: "ROBINHOOD", name: "Robinhood" },
  { symbol: "ETH", name: "Ethereum" },
  { symbol: "ARBITRUM", name: "Arbitrum" },
  { symbol: "OPTIMISM", name: "Optimism" },
  { symbol: "BASE", name: "Base" },
  { symbol: "AVAX", name: "Avalanche" },
  { symbol: "POLYGON", name: "Polygon" },
  { symbol: "BNB", name: "BNB Chain" },
  { symbol: "ZKSYNC", name: "zkSync" },
  { symbol: "MONAD", name: "Monad" },
  { symbol: "COSMOS", name: "Cosmos" },
  { symbol: "APECHAIN", name: "ApeChain" },
  { symbol: "GNOSIS", name: "Gnosis" },
  { symbol: "LINEA", name: "Linea" },
  { symbol: "TON", name: "TON" },
  { symbol: "WORLDCHAIN", name: "World Chain" },
  { symbol: "HEDERA", name: "Hedera" }
];

export function Footer({ onOpenSimulator }: FooterProps) {
  return (
    <footer className="w-full border-t border-slate-800/80 bg-[#06080F] text-slate-300 relative z-20">
      {/* Top Telemetry & Protocol Status Banner */}
      <div className="border-b border-slate-800/60 bg-[#080C14]/90 px-4 sm:px-6 lg:px-8 py-3">
        <div className="max-w-[1400px] mx-auto flex flex-wrap items-center justify-between gap-3 text-xs font-chakra">
          <div className="flex items-center space-x-3">
            <span className="flex items-center space-x-1.5 text-orange-400 font-bold">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
              </span>
              <span>AVOX // COMBAT PROTOCOL ACTIVE</span>
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-400 font-inconsolata hidden sm:inline">
              17 Live Oracle Feeds Streaming
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1.5 text-slate-400 text-[11px] font-mono">
              <ShieldCheck className="w-3.5 h-3.5 text-orange-400" />
              <span>Chainlink VRF v2.5 Verified</span>
            </div>
            {onOpenSimulator && (
              <button
                onClick={() => {
                  sound.playClick();
                  onOpenSimulator();
                }}
                className="flex items-center space-x-1.5 px-3 py-1 rounded bg-red-600 hover:bg-red-500 text-white text-xs font-chakra font-bold uppercase tracking-wider transition-colors shadow-[0_0_12px_rgba(220,38,38,0.4)]"
              >
                <Zap className="w-3 h-3 text-white" />
                <span>Simulate Market Shock</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Multi-Column Content Area */}
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-8 lg:gap-12">
          {/* Column 1: Brand & Lore (5 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <Link
              href="/"
              onClick={() => sound.playClick()}
              className="flex items-center space-x-3 group w-fit"
            >
              <div className="relative w-10 h-10 rounded-xl bg-[#090D15] p-1 border border-orange-500/40 shadow-[0_0_18px_rgba(234,88,12,0.4)] group-hover:shadow-[0_0_28px_rgba(234,88,12,0.65)] group-hover:border-orange-400 transition-all duration-300 flex items-center justify-center overflow-hidden shrink-0">
                <Image
                  src="/logo.png"
                  alt="AVOX"
                  width={36}
                  height={36}
                  className="w-8 h-8 object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_8px_rgba(249,115,22,0.6)]"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-1.5">
                  <span className="text-2xl sm:text-3xl font-bold font-silkscreen tracking-wide text-slate-100 uppercase leading-none">
                    AV<span className="text-red-500">OX</span>
                  </span>
                </div>
                <span className="text-[10px] font-chakra font-bold text-orange-400 tracking-widest uppercase">
                  Tactical PvP Crypto TCG
                </span>
              </div>
            </Link>

            <p className="text-xs text-slate-400 font-hanken leading-relaxed max-w-sm">
              A cutthroat player-versus-player card battler where live market volatility drives every strike.
              Ride green candle rallies, withstand brutal flash crashes, and plunder the on-chain prize pool.
            </p>

            {/* Smart Contract Deployments Tags */}
            <div className="space-y-1.5 pt-1 font-chakra text-[11px]">
              <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                Deployment Networks:
              </div>
              <div className="flex flex-wrap items-center gap-2 text-slate-400 font-inconsolata">
                <span className="text-orange-400 font-bold">Sepolia #11155111</span>
                <span className="text-slate-600">•</span>
                <span>Base Sepolia #84532</span>
                <span className="text-slate-600">•</span>
                <span>Arbitrum Sepolia #421614</span>
              </div>
            </div>
          </div>

          {/* Column 2: Game Arenas & Navigation (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-chakra font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center space-x-1.5">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>Game Arenas</span>
            </h4>
            <ul className="space-y-2 text-xs font-hanken text-slate-400">
              <li>
                <Link
                  href="/battle"
                  onClick={() => sound.playClick()}
                  className="flex items-center justify-between hover:text-orange-400 transition-colors py-0.5 group"
                >
                  <span className="flex items-center space-x-2">
                    <Swords className="w-3.5 h-3.5 text-rose-400" />
                    <span>Battle Arena (PvP / AI)</span>
                  </span>
                  <span className="text-[10px] font-chakra font-bold text-rose-400">
                    Live
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/packs"
                  onClick={() => sound.playClick()}
                  className="flex items-center justify-between hover:text-orange-400 transition-colors py-0.5 group"
                >
                  <span className="flex items-center space-x-2">
                    <Package className="w-3.5 h-3.5 text-amber-400" />
                    <span>Booster Packs Store</span>
                  </span>
                  <span className="text-[10px] font-chakra font-bold text-amber-400">
                    VRF
                  </span>
                </Link>
              </li>
              <li>
                <Link
                  href="/marketplace"
                  onClick={() => sound.playClick()}
                  className="flex items-center justify-between hover:text-orange-400 transition-colors py-0.5 group"
                >
                  <span className="flex items-center space-x-2">
                    <Store className="w-3.5 h-3.5 text-cyan-400" />
                    <span>NFT Trading Floor</span>
                  </span>
                  <span className="text-[10px] font-inconsolata text-slate-500">2.5% Inflow</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/collection"
                  onClick={() => sound.playClick()}
                  className="flex items-center justify-between hover:text-orange-400 transition-colors py-0.5 group"
                >
                  <span className="flex items-center space-x-2">
                    <Layers className="w-3.5 h-3.5 text-purple-400" />
                    <span>Card Vault & Lineup</span>
                  </span>
                  <span className="text-[10px] font-inconsolata text-slate-500">Synergies</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/prize-pool"
                  onClick={() => sound.playClick()}
                  className="flex items-center justify-between hover:text-orange-400 transition-colors py-0.5 group"
                >
                  <span className="flex items-center space-x-2">
                    <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    <span>Seasonal Prize Pool</span>
                  </span>
                  <span className="text-[10px] font-chakra font-bold text-orange-400">
                    Rewards
                  </span>
                </Link>
              </li>
              <li>
                <a
                  href="https://myorg-41.gitbook.io/myorg-docs"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => sound.playClick()}
                  className="flex items-center justify-between hover:text-orange-400 transition-colors py-0.5 group"
                >
                  <span className="flex items-center space-x-2">
                    <BookOpen className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Documentation</span>
                  </span>
                  <span className="text-[10px] font-chakra font-bold text-emerald-400 flex items-center space-x-0.5">
                    <span>GitBook</span>
                    <ExternalLink className="w-2.5 h-2.5 ml-0.5" />
                  </span>
                </a>
              </li>
            </ul>
          </div>

          {/* Column 3: 17 Live Tracked Ecosystem Chains (3 cols) */}
          <div className="lg:col-span-3 space-y-3">
            <h4 className="font-chakra font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center space-x-1.5">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <span>17 Live Feeds</span>
            </h4>
            <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-xs font-chakra">
              {SUPPORTED_CHAINS.slice(0, 10).map((c) => (
                <div
                  key={c.symbol}
                  className="flex items-center space-x-1.5 text-slate-400 hover:text-slate-200 transition-colors py-0.5"
                >
                  <img
                    src={getChainLogoUrl(c.symbol)}
                    alt={c.name}
                    className="w-3.5 h-3.5 object-contain rounded-full bg-slate-900 shrink-0"
                    loading="lazy"
                  />
                  <span className="truncate text-[11px]">{c.name}</span>
                </div>
              ))}
            </div>
            <div className="text-[11px] font-hanken text-slate-500 pt-0.5">
              + ApeChain, Gnosis, Linea, TON, World Chain, Hedera
            </div>
          </div>

          {/* Column 4: Smart Contracts & Security (2 cols) */}
          <div className="lg:col-span-2 space-y-3">
            <h4 className="font-chakra font-bold text-xs uppercase tracking-wider text-slate-200 flex items-center space-x-1.5">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>Contracts</span>
            </h4>
            <ul className="space-y-2 text-xs font-inconsolata text-slate-400">
              <li>
                <div className="text-[10px] text-slate-500 font-chakra font-bold">ERC-721 TCG</div>
                <div className="text-slate-300 text-[11px] truncate">AvoxCard</div>
              </li>
              <li>
                <div className="text-[10px] text-slate-500 font-chakra font-bold">VRF COORDINATOR</div>
                <div className="text-slate-300 text-[11px] truncate">AvoxPackVRF</div>
              </li>
              <li>
                <div className="text-[10px] text-slate-500 font-chakra font-bold">PRIZE POOL LEDGER</div>
                <div className="text-slate-300 text-[11px] truncate">AvoxPrizePool</div>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Horizontal Divider with Cyber Glow Pip */}
        <div className="relative my-8 border-t border-slate-800/80">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-red-600 rounded-full blur-[3px] opacity-70" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-orange-500 rounded-full" />
        </div>

        {/* Bottom Sub-Footer: Copyright, Badges & Legal Disclaimer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-hanken text-slate-500">
          <div className="flex flex-col sm:flex-row items-center space-y-1 sm:space-y-0 sm:space-x-3 text-center sm:text-left">
            <span>&copy; 2026 AVOX Protocol. All rights reserved.</span>
            <span className="hidden sm:inline text-slate-700">•</span>
            <a
              href="https://myorg-41.gitbook.io/myorg-docs"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 hover:text-orange-400 transition-colors inline-flex items-center space-x-1 font-chakra text-[11px]"
            >
              <span>Documentation</span>
              <ExternalLink className="w-2.5 h-2.5 opacity-70" />
            </a>
            <span className="hidden sm:inline text-slate-700">•</span>
            <span className="font-chakra text-[11px] text-slate-400">
              Verifiable Decentralized Card Battler
            </span>
          </div>

          <div className="flex items-center space-x-2 text-[11px] font-chakra text-slate-400">
            <span>PYTH LIVE STREAMS</span>
            <span className="text-slate-700">•</span>
            <span>CHAINLINK VRF</span>
            <span className="text-slate-700">•</span>
            <span>ERC-721 IMMUTABLE</span>
          </div>
        </div>

        {/* Disclaimers */}
        <div className="mt-8 pt-6 border-t border-slate-800/60 text-slate-500 font-hanken text-[11px] leading-relaxed max-w-5xl mx-auto space-y-2.5">
          <div className="text-[10px] font-chakra uppercase tracking-wider text-slate-400 font-bold text-center sm:text-left">
            Disclaimers
          </div>
          <p>
            The website maintainer is not responsible for interactions with the token or the contract address. Please verify independently and use at your own risk.
          </p>
          <p>
            The website maintainer&apos;s role is limited to the development and technical maintenance of this website. The website maintainer is not involved in the creation, deployment, management, trading, liquidity operations, tokenomics, or financial decisions relating to any mainnet digital asset referenced on this website.
          </p>
          <p>
            Token contract address displayed on this website is provided by the project operators. Users should independently verify all relevant information before interacting with any smart contract or digital asset.
          </p>
          <p>
            Nothing on this website constitutes financial, investment, legal, or tax advice, nor should any information be interpreted as a recommendation or solicitation to buy, sell, or hold any digital asset.
          </p>
          <p>
            Digital assets involve significant risk and may lose all or a substantial portion of their value. Users are solely responsible for their own decisions and interactions with any digital asset or smart contract.
          </p>
          <p className="text-[10px] text-slate-600 pt-1">
            Disclaimer: AVOX simulates in-game battle power based on real-time cryptocurrency feeds. Tokens used on testnets are for gameplay and testing purposes and hold no fiat value.
          </p>
        </div>
      </div>
    </footer>
  );
}
