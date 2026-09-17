"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useAppKit, useAppKitAccount, useAppKitNetwork } from "@reown/appkit/react";
import { useBalance } from "wagmi";
import { formatEther } from "viem";
import { userStore, UserProfile } from "@/lib/storage/userStore";
import { walletStore, WalletState } from "@/lib/web3/walletStore";
import { sound } from "@/lib/audio/soundEngine";
import { CONTRACT_CONFIG, getExplorerAddressUrl } from "@/lib/constants/contracts";
import {
  Volume2,
  VolumeX,
  AlertTriangle,
  ExternalLink,
  ShieldCheck
} from "lucide-react";

interface NavbarProps {
  onOpenSimulator: () => void;
}

export function Navbar({ onOpenSimulator }: NavbarProps) {
  const pathname = usePathname();
  const { open } = useAppKit();
  const [profile, setProfile] = useState<UserProfile>(userStore.getProfile());
  const [wallet, setWallet] = useState<WalletState>(walletStore.getState());
  const [isMuted, setIsMuted] = useState(sound.getMuted());
  const [showWalletModal, setShowWalletModal] = useState(false);

  // Dedicated reactive balance query targeting Ethereum Sepolia (Chain ID: 11155111)
  const { data: wagmiBalance, refetch: refetchWagmiBalance } = useBalance({
    address: wallet.address ? (wallet.address as `0x${string}`) : undefined,
    chainId: CONTRACT_CONFIG.chainId
  });

  useEffect(() => {
    if (wagmiBalance && typeof wagmiBalance.value === "bigint") {
      const eth = parseFloat(formatEther(wagmiBalance.value));
      if (eth !== wallet.ethBalance) {
        walletStore.setEthBalance(eth);
      }
    }
  }, [wagmiBalance, wallet.ethBalance]);

  const effectiveBalance =
    wagmiBalance && typeof wagmiBalance.value === "bigint"
      ? parseFloat(formatEther(wagmiBalance.value))
      : wallet.ethBalance;

  useEffect(() => {
    const unsubUser = userStore.subscribe(setProfile);
    const unsubWallet = walletStore.subscribe((w) => {
      setWallet(w);
      if (w.address) {
        userStore.connectCustomWallet(w.address);
      }
    });
    return () => {
      unsubUser();
      unsubWallet();
    };
  }, []);

  const navLinks = [
    { href: "/battle", label: "Battle Arena", badge: "PvP" },
    { href: "/packs", label: "Pack Store", badge: "VRF" },
    { href: "/marketplace", label: "Marketplace" },
    { href: "/collection", label: "Collection" },
    { href: "/prize-pool", label: "Prize Pool", highlight: true },
    { href: "https://myorg-41.gitbook.io/myorg-docs", label: "Docs", external: true }
  ];

  const toggleSound = () => {
    const next = sound.toggleMute();
    setIsMuted(next);
  };

  const handleConnect = async () => {
    sound.playClick();
    try {
      await open();
    } catch (e) {
      await walletStore.connect();
    }
  };

  const [isSwitchingNetwork, setIsSwitchingNetwork] = useState(false);

  const handleOpenAccount = async () => {
    sound.playClick();
    try {
      await open({ view: "Account" });
    } catch (e) {
      setShowWalletModal(true);
    }
  };

  const handleSwitchNetwork = async () => {
    sound.playClick();
    setIsSwitchingNetwork(true);
    try {
      const success = await walletStore.switchNetwork();
      if (success) {
        setIsSwitchingNetwork(false);
        return;
      }
    } catch (e) {
      console.warn("Direct switchNetwork:", e);
    }

    try {
      await open({ view: "Networks" });
    } catch (e) {
      console.warn("Open networks modal:", e);
    } finally {
      setIsSwitchingNetwork(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-[#06080F]/55 backdrop-blur-2xl backdrop-saturate-[180%] border-b border-white/[0.08] shadow-[0_4px_30px_rgba(0,0,0,0.5),inset_0_1px_0_0_rgba(255,255,255,0.08)] transition-all duration-300">
        {/* Top ambient specular highlight line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent pointer-events-none" />

        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link
            href="/"
            onClick={() => sound.playClick()}
            className="flex items-center space-x-3 group"
          >
            <div className="relative w-11 h-11 rounded-xl bg-white/[0.04] p-1 border border-white/[0.1] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2),0_0_20px_rgba(234,88,12,0.2)] group-hover:shadow-[0_0_28px_rgba(234,88,12,0.5)] group-hover:border-orange-500/50 backdrop-blur-xl transition-all duration-300 flex items-center justify-center overflow-hidden shrink-0">
              <Image
                src="/logo.png"
                alt="AVOX"
                width={48}
                height={48}
                className="w-9 h-9 object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_10px_rgba(249,115,22,0.7)]"
                priority
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-silkscreen font-bold text-xl sm:text-2xl tracking-wide text-slate-100 uppercase leading-none">
                  AV<span className="text-red-500">OX</span>
                </span>
              </div>
              <p className="text-[9px] text-slate-400 font-chakra tracking-widest hidden sm:block mt-0.5 uppercase">
                Tactical PvP Crypto TCG
              </p>
            </div>
          </Link>

          {/* Navigation Items - Glass Capsule Segmented Dock (No Generic Icons) */}
          <nav className="hidden md:flex items-center p-1 rounded-full bg-white/[0.03] border border-white/[0.07] backdrop-blur-xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.08)]">
            {navLinks.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  target={item.external ? "_blank" : undefined}
                  rel={item.external ? "noopener noreferrer" : undefined}
                  onClick={() => sound.playClick()}
                  className={`relative flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-chakra font-semibold tracking-wider transition-all duration-200 group ${
                    isActive
                      ? "bg-white/[0.1] text-orange-400 border border-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.25),0_2px_12px_rgba(0,0,0,0.35)]"
                      : "text-slate-400 hover:text-slate-100 hover:bg-white/[0.04] border border-transparent"
                  }`}
                >
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.8)]" />
                  )}
                  <span>{item.label}</span>
                  {item.external && (
                    <ExternalLink className="w-3 h-3 text-slate-500 group-hover:text-orange-400 transition-colors" />
                  )}
                  {item.badge && (
                    <span
                      className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${
                        isActive
                          ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                          : "bg-white/[0.05] text-slate-400 border border-white/10"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Right Action Items */}
          <div className="flex items-center space-x-2.5">
            {/* AVOX Token Vault Pill */}
            <div
              className="hidden sm:flex items-center space-x-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.08] backdrop-blur-xl text-xs shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1),0_2px_10px_rgba(0,0,0,0.3)] hover:border-orange-500/30 transition-all group"
              title="Your AVOX Game Reward Token Balance"
            >
              <Image
                src="/logo.png"
                alt="AVOX"
                width={16}
                height={16}
                className="w-4 h-4 object-contain group-hover:scale-110 transition-transform duration-200"
              />
              <span className="font-mono font-bold text-orange-400 text-xs">
                {profile.avoxBalance ?? 100}
              </span>
              <span className="font-chakra text-[10px] text-slate-400 uppercase tracking-widest font-semibold">
                AVOX
              </span>
            </div>

            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              className="p-2 rounded-full bg-white/[0.03] border border-white/[0.08] text-slate-400 hover:text-slate-100 hover:bg-white/[0.08] hover:border-white/20 transition-all cursor-pointer backdrop-blur-xl shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]"
              title={isMuted ? "Unmute Procedural Audio" : "Mute Sound"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-orange-400" />}
            </button>

            {/* Wrong Network Indicator if connected but not Sepolia */}
            {wallet.isConnected && wallet.address && !wallet.isCorrectNetwork && (
              <button
                onClick={handleSwitchNetwork}
                disabled={isSwitchingNetwork}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/40 hover:border-amber-400 text-amber-300 font-mono text-[10px] uppercase font-bold transition-all cursor-pointer animate-pulse disabled:opacity-50 backdrop-blur-xl shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                title="Switch to Sepolia Network"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">
                  {isSwitchingNetwork ? "Switching..." : "Switch to Sepolia"}
                </span>
              </button>
            )}

            {/* Real Web3 Wallet Button (Reown AppKit) */}
            {wallet.isConnected && wallet.address ? (
              <button
                onClick={handleOpenAccount}
                className="flex items-center space-x-2.5 px-3.5 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.1] hover:border-white/25 backdrop-blur-2xl transition-all cursor-pointer shadow-[inset_0_1px_0_0_rgba(255,255,255,0.15),0_4px_16px_rgba(0,0,0,0.3)]"
                title="Manage Web3 Wallet"
              >
                <div
                  className={`w-2 h-2 rounded-full ${
                    wallet.isCorrectNetwork
                      ? "bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)] animate-pulse"
                      : "bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.7)]"
                  }`}
                />
                <span className="font-mono font-bold text-slate-100 text-xs">
                  {effectiveBalance.toFixed(4)} ETH
                </span>
                <span className="w-px h-3 bg-white/20" />
                <span className="font-mono text-slate-400 text-xs tracking-tight">
                  {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                </span>
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={wallet.isConnecting}
                className="flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-slate-950 font-chakra font-bold text-xs uppercase tracking-wider transition-all duration-200 shadow-[0_0_20px_rgba(234,88,12,0.35),inset_0_1px_0_0_rgba(255,255,255,0.3)] border border-orange-400/40 hover:scale-[1.02] active:scale-[0.98] cursor-pointer disabled:opacity-50"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse" />
                <span>{wallet.isConnecting ? "Connecting..." : "Connect Wallet"}</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Navigation bar - Frosted Liquid Glass */}
        <div className="md:hidden flex items-center justify-around py-2.5 px-1.5 border-t border-white/[0.06] bg-[#06080F]/80 backdrop-blur-2xl text-xs overflow-x-auto no-scrollbar gap-1">
          {navLinks.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                target={item.external ? "_blank" : undefined}
                rel={item.external ? "noopener noreferrer" : undefined}
                onClick={() => sound.playClick()}
                className={`px-2.5 py-1 rounded-full transition-all text-xs font-chakra tracking-wide shrink-0 inline-flex items-center space-x-1 ${
                  isActive
                    ? "bg-white/[0.1] text-orange-400 font-bold border border-white/15 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.2)]"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                <span>{item.label}</span>
                {item.external && <ExternalLink className="w-2.5 h-2.5 opacity-60" />}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Real Web3 Wallet Management Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#080C14]/95 border border-white/10 rounded-2xl p-5 text-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.8),inset_0_1px_0_0_rgba(255,255,255,0.1)] backdrop-blur-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base font-chakra tracking-wide">Web3 Account Overview</h3>
              </div>
              <button
                onClick={() => setShowWalletModal(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer p-1 rounded-full hover:bg-white/[0.06] transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs">
              {wallet.isConnected && wallet.address ? (
                <>
                  <div className="p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] flex justify-between items-center shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">Connected Address:</span>
                      <span className="font-mono text-slate-200 font-bold text-xs break-all">
                        {wallet.address}
                      </span>
                    </div>
                    <a
                      href={getExplorerAddressUrl(wallet.address)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-cyan-400 hover:text-cyan-300 ml-2"
                      title="View on Explorer"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">ETH Balance</span>
                      <span className="font-mono font-bold text-sm text-emerald-400">
                        {effectiveBalance.toFixed(4)} ETH
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)]">
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">Network Status</span>
                      <span
                        className={`font-mono font-bold text-xs flex items-center space-x-1 ${
                          wallet.isCorrectNetwork ? "text-emerald-400" : "text-amber-400"
                        }`}
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{wallet.isCorrectNetwork ? "Sepolia (#11155111)" : "Wrong Network"}</span>
                      </span>
                    </div>
                  </div>

                  {!wallet.isCorrectNetwork && (
                    <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Please switch your wallet to Ethereum Sepolia.</span>
                      </div>
                      <button
                        onClick={handleSwitchNetwork}
                        disabled={isSwitchingNetwork}
                        className="px-2.5 py-1 rounded-full bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-[10px] uppercase cursor-pointer disabled:opacity-50"
                      >
                        {isSwitchingNetwork ? "Switching..." : "Switch Network"}
                      </button>
                    </div>
                  )}

                  <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-[11px] text-slate-400 space-y-1">
                    <div className="font-bold text-slate-300">Need Free Sepolia Testnet ETH?</div>
                    <div>Claim free Sepolia testnet ETH for gas & card packs:</div>
                    <div className="flex flex-wrap gap-2 pt-1 font-mono text-[10px]">
                      <a
                        href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 underline hover:text-cyan-300"
                      >
                        Google Cloud Faucet ↗
                      </a>
                      <a
                        href="https://sepoliafaucet.com"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 underline hover:text-cyan-300"
                      >
                        Alchemy Faucet ↗
                      </a>
                      <a
                        href="https://faucet.quicknode.com/ethereum/sepolia"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-cyan-400 underline hover:text-cyan-300"
                      >
                        QuickNode Faucet ↗
                      </a>
                    </div>
                  </div>

                  <div className="pt-2 flex justify-between">
                    <button
                      onClick={() => {
                        refetchWagmiBalance?.();
                        walletStore.refreshBalance();
                      }}
                      className="px-3 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-xs font-semibold text-slate-300 cursor-pointer transition-colors"
                    >
                      Refresh Balance
                    </button>
                    <button
                      onClick={() => {
                        walletStore.disconnect();
                        setShowWalletModal(false);
                      }}
                      className="px-3 py-1.5 rounded-full bg-red-950/60 hover:bg-red-900/80 border border-red-500/40 text-xs font-semibold text-red-300 cursor-pointer transition-colors"
                    >
                      Disconnect Wallet
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-4 text-center space-y-4">
                  <p className="text-xs text-slate-400">
                    Connect your Web3 browser wallet (MetaMask, Rabby, Coinbase Wallet) to buy booster packs, mint
                    verifiable cards on-chain, and participate in secondary trading.
                  </p>
                  <button
                    onClick={handleConnect}
                    disabled={wallet.isConnecting}
                    className="w-full py-3 rounded-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-slate-950 font-chakra font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(234,88,12,0.4)] cursor-pointer"
                  >
                    {wallet.isConnecting ? "Awaiting Signature..." : "Connect MetaMask / EVM Wallet"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
