"use client";

import { useState, useEffect } from "react";
import { prizePoolStore } from "@/lib/storage/prizePoolStore";
import { PrizeInflowRecord } from "@/types";
import { sound } from "@/lib/audio/soundEngine";
import { Trophy, ShieldCheck, Clock, ArrowUpRight, ExternalLink, Coins, CheckCircle, Award } from "lucide-react";
import { CONTRACT_CONFIG, getExplorerAddressUrl } from "@/lib/constants/contracts";

export function PrizePoolView() {
  const [state, setState] = useState(() => prizePoolStore.getState());
  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 17,
    hours: 14,
    minutes: 32,
    seconds: 10
  });

  useEffect(() => {
    const unsub = prizePoolStore.subscribe((pool, inflows) => {
      setState({
        currentSeasonPool: pool,
        currentSeason: state.currentSeason,
        seasonEndTime: state.seasonEndTime,
        inflows
      });
    });
    return () => unsub();
  }, [state.currentSeason, state.seasonEndTime]);

  // Countdown timer simulation
  useEffect(() => {
    const interval = setInterval(() => {
      const diff = Math.max(0, state.seasonEndTime - Date.now());
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setTimeLeft({ days, hours, minutes, seconds });
    }, 1000);
    return () => clearInterval(interval);
  }, [state.seasonEndTime]);

  const ethPriceUsd = 3480;
  const poolUsd = Math.round(state.currentSeasonPool * ethPriceUsd);

  const leaderboardStandings = [
    { rank: 1, address: "0x39Bc...71E9", mmr: 2340, tier: "Crypto Whale", payoutEth: (state.currentSeasonPool * 0.40).toFixed(3), share: "40%" },
    { rank: 2, address: "0x882F...99A1", mmr: 2190, tier: "Crypto Whale", payoutEth: (state.currentSeasonPool * 0.25).toFixed(3), share: "25%" },
    { rank: 3, address: "0x12Fa...990B", mmr: 2040, tier: "Crypto Whale", payoutEth: (state.currentSeasonPool * 0.15).toFixed(3), share: "15%" },
    { rank: 4, address: "0x71C8...39e1 (You)", mmr: 1680, tier: "Diamond", payoutEth: (state.currentSeasonPool * 0.028).toFixed(3), share: "2.8%" },
    { rank: 5, address: "0x5501...44D2", mmr: 1620, tier: "Diamond", payoutEth: (state.currentSeasonPool * 0.028).toFixed(3), share: "2.8%" }
  ];

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-8">
      {/* Top Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#111A2E] via-[#0D1322] to-[#070A10] p-8 border border-amber-500/30 shadow-[0_0_50px_rgba(251,191,36,0.1)] overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center space-x-2 text-xs font-chakra font-bold tracking-wider text-orange-400">
              <Trophy className="w-4 h-4 text-orange-400" />
              <span>SEASON {state.currentSeason} RANKED PRIZE POOL</span>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-silkscreen font-bold text-slate-100 uppercase tracking-wide">
              ${poolUsd.toLocaleString()} USD
            </h1>
            <div className="text-emerald-400 font-mono font-bold text-xl">
              {state.currentSeasonPool.toFixed(4)} ETH Inflow Vault
            </div>
            <p className="text-xs text-slate-400 max-w-xl">
              Funded transparently on-chain from 20% of all pack sales and 2.5% of secondary marketplace volume.
            </p>
          </div>

          {/* Countdown Clock */}
          <div className="bg-[#090D15]/90 border border-slate-800 rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-400 font-mono uppercase mb-3">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Season Final Settlement In:</span>
            </div>
            <div className="grid grid-cols-4 gap-2 font-mono-nums">
              <div className="bg-[#121824] rounded-lg p-2 min-w-[55px]">
                <span className="text-xl font-black text-slate-100 block">{timeLeft.days}</span>
                <span className="text-[9px] text-slate-500 uppercase">Days</span>
              </div>
              <div className="bg-[#121824] rounded-lg p-2 min-w-[55px]">
                <span className="text-xl font-black text-slate-100 block">{timeLeft.hours}</span>
                <span className="text-[9px] text-slate-500 uppercase">Hours</span>
              </div>
              <div className="bg-[#121824] rounded-lg p-2 min-w-[55px]">
                <span className="text-xl font-black text-slate-100 block">{timeLeft.minutes}</span>
                <span className="text-[9px] text-slate-500 uppercase">Mins</span>
              </div>
              <div className="bg-[#121824] rounded-lg p-2 min-w-[55px]">
                <span className="text-xl font-black text-emerald-400 block">{timeLeft.seconds}</span>
                <span className="text-[9px] text-slate-500 uppercase">Secs</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Prize Distribution & Current Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Ranked Leaderboard (Col 7) */}
        <div className="lg:col-span-7 bg-[#0A0E17] rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center space-x-2">
              <Award className="w-5 h-5 text-amber-400" />
              <h2 className="text-base sm:text-lg font-silkscreen font-bold text-slate-100 uppercase tracking-wider">
                Season Ranked Leaderboard
              </h2>
            </div>
            <span className="text-xs text-slate-400 font-mono">TOP 5 PROJECTED PAYOUTS</span>
          </div>

          <div className="space-y-2">
            {leaderboardStandings.map((user) => (
              <div
                key={user.rank}
                className={`p-3 rounded-xl border flex items-center justify-between text-xs font-mono transition-all ${
                  user.address.includes("You")
                    ? "bg-emerald-950/40 border-emerald-500/40 text-emerald-300 ring-1 ring-emerald-500/30"
                    : "bg-[#0E1320] border-slate-800/80 text-slate-300"
                }`}
              >
                <div className="flex items-center space-x-3">
                  <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
                    user.rank === 1 ? "bg-amber-400 text-slate-950" : user.rank === 2 ? "bg-slate-300 text-slate-950" : user.rank === 3 ? "bg-amber-700 text-slate-100" : "bg-slate-800 text-slate-400"
                  }`}>
                    {user.rank}
                  </span>
                  <div>
                    <span className="font-bold block">{user.address}</span>
                    <span className="text-[10px] text-slate-400">{user.tier} • {user.mmr} MMR</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-bold text-emerald-400 text-sm block">
                    {user.payoutEth} ETH
                  </span>
                  <span className="text-[10px] text-slate-400">{user.share} of Pool</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Contract Transparency & Inflow Rules (Col 5) */}
        <div className="lg:col-span-5 bg-[#0A0E17] rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-800">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base sm:text-lg font-silkscreen font-bold text-slate-100 uppercase tracking-wider">
              On-Chain Transparency
            </h2>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            MarketWars is built on verifiable non-custodial smart contracts. 100% of prize pool funds are programmatically held in the <code className="text-emerald-400">MarketWarsPrizePool.sol</code> contract and automatically settled to player wallets at season rollover.
          </p>

          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-[#0E1320] border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Pack Revenue Split:</span>
              <span className="text-emerald-400 font-bold">20.00% Immutable</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#0E1320] border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Marketplace Trade Fee:</span>
              <span className="text-emerald-400 font-bold">2.50% Immutable</span>
            </div>
            <div className="p-2.5 rounded-lg bg-[#0E1320] border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Sepolia Prize Pool Contract:</span>
              <a
                href={getExplorerAddressUrl(CONTRACT_CONFIG.prizePoolContract)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:text-emerald-300 flex items-center space-x-1 underline"
              >
                <span>{CONTRACT_CONFIG.prizePoolContract.slice(0, 10)}...{CONTRACT_CONFIG.prizePoolContract.slice(-8)}</span>
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
            <div className="p-2.5 rounded-lg bg-[#0E1320] border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">VRF Pack Vault Contract:</span>
              <a
                href={getExplorerAddressUrl(CONTRACT_CONFIG.packContract)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-cyan-400 hover:text-cyan-300 flex items-center space-x-1 underline"
              >
                <span>{CONTRACT_CONFIG.packContract.slice(0, 10)}...{CONTRACT_CONFIG.packContract.slice(-8)}</span>
                <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Inflow Ledger Table */}
      <div className="bg-[#0A0E17] rounded-2xl border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Coins className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base sm:text-lg font-silkscreen font-bold text-slate-100 uppercase tracking-wider">
              Transparent Inflow Ledger ({state.inflows.length} Transactions)
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">PUBLIC ON-CHAIN HISTORY</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-500 uppercase text-[10px]">
                <th className="py-2.5 px-3">Transaction Hash</th>
                <th className="py-2.5 px-3">Source Description</th>
                <th className="py-2.5 px-3">Block #</th>
                <th className="py-2.5 px-3">Contributor</th>
                <th className="py-2.5 px-3 text-right">Inflow Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {state.inflows.map((inflow) => (
                <tr key={inflow.hash} className="hover:bg-slate-900/40 transition-colors">
                  <td className="py-3 px-3 text-cyan-400 truncate max-w-[150px]">
                    {inflow.hash.slice(0, 14)}...{inflow.hash.slice(-6)}
                  </td>
                  <td className="py-3 px-3 text-slate-200 font-semibold">{inflow.source}</td>
                  <td className="py-3 px-3 text-slate-400">#{inflow.blockNumber}</td>
                  <td className="py-3 px-3 text-slate-400">{inflow.contributor}</td>
                  <td className="py-3 px-3 text-right font-bold text-emerald-400">
                    +{inflow.amountEth.toFixed(4)} ETH
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
