"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { userStore, UserProfile } from "@/lib/storage/userStore";
import { sound } from "@/lib/audio/soundEngine";
import {
  Swords,
  Package,
  Store,
  Layers,
  Trophy,
  Volume2,
  VolumeX,
  Wallet,
  Zap,
  CheckCircle2,
  ShieldAlert
} from "lucide-react";

interface NavbarProps {
  onOpenSimulator: () => void;
}

export function Navbar({ onOpenSimulator }: NavbarProps) {
  const pathname = usePathname();
  const [profile, setProfile] = useState<UserProfile>(userStore.getProfile());
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [customAddressInput, setCustomAddressInput] = useState("");

  useEffect(() => {
    const unsub = userStore.subscribe(setProfile);
    return () => unsub();
  }, []);

  const navLinks = [
    { href: "/battle", label: "Battle Arena", icon: Swords, badge: "PvP" },
    { href: "/packs", label: "Pack Store", icon: Package, badge: "VRF" },
    { href: "/marketplace", label: "Marketplace", icon: Store },
    { href: "/collection", label: "Collection", icon: Layers },
    { href: "/prize-pool", label: "Prize Pool", icon: Trophy, highlight: true }
  ];

  const toggleSound = () => {
    const next = sound.toggleMute();
    setIsMuted(next);
  };

  const handleConnectWallet = () => {
    if (customAddressInput.startsWith("0x") && customAddressInput.length >= 10) {
      userStore.connectCustomWallet(customAddressInput);
      setShowWalletModal(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#070A10]/95 backdrop-blur-md border-b border-[#182030]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link
            href="/"
            onClick={() => sound.playClick()}
            className="flex items-center space-x-2.5 group"
          >
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 via-red-600 to-rose-700 p-[1px] shadow-[0_0_15px_rgba(234,88,12,0.4)] group-hover:shadow-[0_0_25px_rgba(220,38,38,0.6)] transition-all duration-300">
              <div className="w-full h-full bg-[#0B0F18] rounded-lg flex items-center justify-center">
                <Swords className="w-5 h-5 text-orange-400 group-hover:rotate-12 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-1.5">
                <span className="font-silkscreen font-bold text-xl sm:text-2xl tracking-wide text-slate-100 uppercase leading-none">
                  Market<span className="text-red-500">Wars</span>
                </span>
                <span className="text-xs font-chakra font-bold text-orange-400">
                  TCG
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-chakra tracking-widest hidden sm:block">
                REAL-TIME ON-CHAIN PVP COMBAT
              </p>
            </div>
          </Link>

          {/* Navigation Items */}
          <nav className="hidden md:flex items-center space-x-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => sound.playClick()}
                  className={`relative flex items-center space-x-2 px-3.5 py-2 rounded-lg text-xs font-chakra font-bold tracking-wider transition-all ${
                    isActive
                      ? "bg-slate-800/80 text-orange-400 border border-red-500/40 shadow-[0_0_15px_rgba(220,38,38,0.2)]"
                      : "text-slate-300 hover:text-slate-100 hover:bg-slate-800/40"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-orange-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] font-mono text-slate-400">
                      {item.badge}
                    </span>
                  )}
                  {item.highlight && (
                    <span className="flex h-1.5 w-1.5 relative">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500"></span>
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Controls: Audio, Volatility Sim, Wallet */}
          <div className="flex items-center space-x-2.5">
            {/* Market Volatility Simulator Trigger */}
            <button
              onClick={() => {
                sound.playClick();
                onOpenSimulator();
              }}
              className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-chakra font-bold uppercase tracking-wider transition-colors shadow-[0_0_15px_rgba(220,38,38,0.4)]"
              title="Open Market Volatility Simulator"
            >
              <Zap className="w-3.5 h-3.5 text-white" />
              <span className="hidden lg:inline">Shock Market</span>
            </button>

            {/* Audio Mute/Unmute */}
            <button
              onClick={toggleSound}
              className="p-2 rounded-lg bg-[#0F1420] border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
              title={isMuted ? "Unmute Procedural Audio" : "Mute Sound"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-orange-400" />}
            </button>

            {/* Wallet / Demo Mode Status */}
            <button
              onClick={() => {
                sound.playClick();
                setShowWalletModal(true);
              }}
              className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#121927] to-[#1A2438] border border-slate-700/80 hover:border-slate-500 transition-all text-xs"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-400"></div>
              <div className="flex flex-col text-left">
                <span className="font-mono-nums font-bold text-slate-100 text-[11px]">
                  {profile.ethBalance.toFixed(3)} ETH
                </span>
                <span className="text-[9px] font-mono text-slate-400 truncate max-w-[80px]">
                  {profile.isGuest ? "Guest: " + profile.address.slice(0, 6) : profile.address.slice(0, 8)}
                </span>
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Navigation bar */}
        <div className="md:hidden flex items-center justify-around py-2 border-t border-slate-800/80 bg-[#090D15] text-[11px]">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => sound.playClick()}
                className={`flex flex-col items-center space-y-0.5 ${
                  isActive ? "text-orange-400 font-bold" : "text-slate-400"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </div>
      </header>

      {/* Wallet Management Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0B0F18] border border-slate-800 rounded-xl p-5 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Wallet & Account Status</h3>
              </div>
              <button
                onClick={() => setShowWalletModal(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs">
              <div className="p-3 rounded-lg bg-[#111724] border border-slate-800 flex justify-between items-center">
                <div>
                  <span className="text-slate-400 block">Connected Account:</span>
                  <span className="font-mono text-slate-200 font-bold text-sm">
                    {profile.address}
                  </span>
                </div>
                <span className="text-[10px] font-mono font-bold text-emerald-400">
                  {profile.isGuest ? "PRE-FUNDED DEMO" : "CUSTOM WEB3"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 rounded-lg bg-[#111724] border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Testnet ETH Balance</span>
                  <span className="font-mono font-bold text-sm text-emerald-400">
                    {profile.ethBalance.toFixed(4)} ETH
                  </span>
                </div>
                <div className="p-2.5 rounded-lg bg-[#111724] border border-slate-800">
                  <span className="text-slate-400 block text-[10px]">Rank MMR</span>
                  <span className="font-mono font-bold text-sm text-cyan-400">
                    {profile.ratingMMR} ({profile.rankTier})
                  </span>
                </div>
              </div>

              <div className="pt-2">
                <label className="text-slate-400 block mb-1">
                  Connect Custom EVM Address (Base / Arbitrum Sepolia):
                </label>
                <div className="flex space-x-2">
                  <input
                    type="text"
                    placeholder="0x..."
                    value={customAddressInput}
                    onChange={(e) => setCustomAddressInput(e.target.value)}
                    className="flex-1 bg-[#151D2C] border border-slate-700 rounded px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-400"
                  />
                  <button
                    onClick={handleConnectWallet}
                    className="px-3 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-slate-950 transition-colors"
                  >
                    Connect
                  </button>
                </div>
              </div>

              <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 flex items-start space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  The built-in Guest Wallet has 1.5 testnet ETH pre-loaded. You can immediately open card packs, battle bots, and buy cards without testnet faucet delays!
                </span>
              </div>
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowWalletModal(false)}
                className="px-4 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
