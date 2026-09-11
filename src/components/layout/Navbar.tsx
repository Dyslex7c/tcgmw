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
      <header className="sticky top-0 z-40 w-full bg-[#070A10]/95 backdrop-blur-md border-b border-[#182030]">
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Logo & Brand */}
          <Link
            href="/"
            onClick={() => sound.playClick()}
            className="flex items-center space-x-3 group"
          >
            <div className="relative w-12 h-12 sm:w-13 sm:h-13 rounded-xl bg-[#090D15]/90 p-1 border border-orange-500/40 shadow-[0_0_20px_rgba(234,88,12,0.4)] group-hover:shadow-[0_0_30px_rgba(234,88,12,0.7)] group-hover:border-orange-400 transition-all duration-300 flex items-center justify-center overflow-hidden shrink-0">
              <Image
                src="/logo.png"
                alt="AVOX MarketWars"
                width={56}
                height={56}
                className="w-10 h-10 sm:w-11 sm:h-11 object-contain group-hover:scale-110 transition-transform duration-300 drop-shadow-[0_0_12px_rgba(249,115,22,0.75)]"
                priority
              />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-silkscreen font-bold text-xl sm:text-2xl tracking-wide text-slate-100 uppercase leading-none">
                  Market<span className="text-red-500">Wars</span>
                </span>
                <span className="text-[10px] font-chakra font-bold px-1.5 py-0.5 rounded bg-orange-950/80 text-orange-400 border border-orange-500/40 uppercase tracking-wider">
                  AVOX
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-chakra tracking-widest hidden sm:block mt-0.5">
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
                      ? "bg-[#141E33] text-orange-400 border border-orange-500/40 shadow-[0_0_12px_rgba(249,115,22,0.15)]"
                      : "text-slate-400 hover:text-slate-100 hover:bg-[#0D1322]"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? "text-orange-400" : "text-slate-400"}`} />
                  <span>{item.label}</span>
                  {item.badge && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-orange-950/80 text-orange-400 border border-orange-500/30">
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
              className="hidden sm:flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-[#0E1422] border border-orange-500/30 text-xs shadow-[0_0_10px_rgba(234,88,12,0.15)]"
              title="Your AVOX Game Reward Token Balance"
            >
              <Image
                src="/logo.png"
                alt="AVOX"
                width={16}
                height={16}
                className="w-4 h-4 object-contain"
              />
              <span className="font-mono font-bold text-orange-400 text-[11px]">
                {profile.avoxBalance ?? 100}
              </span>
              <span className="font-chakra text-[10px] text-slate-400 uppercase tracking-wider">
                AVOX
              </span>
            </div>

            {/* Audio Toggle */}
            <button
              onClick={toggleSound}
              className="p-2 rounded-lg bg-[#0F1420] border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors cursor-pointer"
              title={isMuted ? "Unmute Procedural Audio" : "Mute Sound"}
            >
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-orange-400" />}
            </button>

            {/* Wrong Network Indicator if connected but not Sepolia */}
            {wallet.isConnected && wallet.address && !wallet.isCorrectNetwork && (
              <button
                onClick={handleSwitchNetwork}
                disabled={isSwitchingNetwork}
                className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-amber-950/80 border border-amber-500/50 hover:border-amber-400 text-amber-300 font-mono text-[10px] uppercase font-bold transition-all cursor-pointer animate-pulse disabled:opacity-50"
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
                className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#121927] to-[#1A2438] border border-slate-700/80 hover:border-orange-500/60 transition-all text-xs cursor-pointer shadow-[0_0_12px_rgba(0,0,0,0.4)]"
                title="Manage Web3 Wallet (Ethereum Sepolia)"
              >
                <div className={`w-2 h-2 rounded-full ${wallet.isCorrectNetwork ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`}></div>
                <div className="flex flex-col text-left">
                  <span className="font-mono-nums font-bold text-slate-100 text-[11px]">
                    {effectiveBalance.toFixed(4)} SepoliaETH
                  </span>
                  <span className="text-[9px] font-mono text-slate-400 truncate max-w-[80px]">
                    {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
                  </span>
                </div>
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={wallet.isConnecting}
                className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-slate-950 font-chakra font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_15px_rgba(234,88,12,0.3)] cursor-pointer disabled:opacity-50"
              >
                <Wallet className="w-3.5 h-3.5 text-slate-950" />
                <span>{wallet.isConnecting ? "Connecting..." : "Connect Wallet"}</span>
              </button>
            )}
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

      {/* Real Web3 Wallet Management Modal */}
      {showWalletModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-md bg-[#0B0F18] border border-slate-800 rounded-xl p-5 text-slate-100 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <Wallet className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-base">Ethereum Sepolia Web3 Account</h3>
              </div>
              <button
                onClick={() => setShowWalletModal(false)}
                className="text-slate-400 hover:text-slate-200 cursor-pointer"
              >
                ✕
              </button>
            </div>

            <div className="my-4 space-y-3 text-xs">
              {wallet.isConnected && wallet.address ? (
                <>
                  <div className="p-3 rounded-lg bg-[#111724] border border-slate-800 flex justify-between items-center">
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
                      title="View on Sepolia Etherscan"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-lg bg-[#111724] border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">SepoliaETH Balance</span>
                      <span className="font-mono font-bold text-sm text-emerald-400">
                        {effectiveBalance.toFixed(4)} SepoliaETH
                      </span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-[#111724] border border-slate-800">
                      <span className="text-slate-400 block text-[10px] uppercase font-mono">Network Status</span>
                      <span className={`font-mono font-bold text-xs flex items-center space-x-1 ${wallet.isCorrectNetwork ? "text-emerald-400" : "text-amber-400"}`}>
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{wallet.isCorrectNetwork ? "Sepolia (#11155111)" : "Wrong Network"}</span>
                      </span>
                    </div>
                  </div>

                  {!wallet.isCorrectNetwork && (
                    <div className="p-2.5 rounded-lg bg-amber-950/60 border border-amber-500/50 text-amber-200 text-xs flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>Please switch your wallet to Ethereum Sepolia.</span>
                      </div>
                      <button
                        onClick={handleSwitchNetwork}
                        disabled={isSwitchingNetwork}
                        className="px-2.5 py-1 rounded bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-[10px] uppercase cursor-pointer disabled:opacity-50"
                      >
                        {isSwitchingNetwork ? "Switching..." : "Switch Network"}
                      </button>
                    </div>
                  )}

                  <div className="p-3 rounded-lg bg-[#0E1320] border border-slate-800/80 text-[11px] text-slate-400 space-y-1">
                    <div className="font-bold text-slate-300">Need Free Sepolia Testnet ETH?</div>
                    <div>
                      Claim free Sepolia testnet ETH for gas & card packs:
                    </div>
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
                      className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 cursor-pointer"
                    >
                      Refresh Balance
                    </button>
                    <button
                      onClick={() => {
                        walletStore.disconnect();
                        setShowWalletModal(false);
                      }}
                      className="px-3 py-1.5 rounded bg-red-950/80 hover:bg-red-900 border border-red-500/40 text-xs font-semibold text-red-300 cursor-pointer"
                    >
                      Disconnect Wallet
                    </button>
                  </div>
                </>
              ) : (
                <div className="py-4 text-center space-y-4">
                  <p className="text-xs text-slate-400">
                    Connect your Web3 browser wallet (MetaMask, Rabby, Coinbase Wallet) to buy booster packs, mint verifiable cards on-chain, and participate in secondary trading.
                  </p>
                  <button
                    onClick={handleConnect}
                    disabled={wallet.isConnecting}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 text-slate-950 font-chakra font-bold text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(234,88,12,0.4)] cursor-pointer"
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
