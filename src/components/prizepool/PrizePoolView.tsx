"use client";

import { useState, useEffect } from "react";
import { prizePoolStore, PrizePoolOnChainState } from "@/lib/storage/prizePoolStore";
import { marketService } from "@/lib/market/priceFeed";
import { walletStore, WalletState } from "@/lib/web3/walletStore";
import { sound } from "@/lib/audio/soundEngine";
import {
  Trophy,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  ExternalLink,
  Coins,
  CheckCircle,
  Award,
  HeartHandshake,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { CONTRACT_CONFIG, getExplorerAddressUrl, getExplorerTxUrl } from "@/lib/constants/contracts";

export function PrizePoolView() {
  const [state, setState] = useState<PrizePoolOnChainState>(() => prizePoolStore.getState());
  const [wallet, setWallet] = useState<WalletState>(() => walletStore.getState());
  const [prices, setPrices] = useState(() => marketService.getPrices());
  const [donationInput, setDonationInput] = useState("0.01");
  const [isDonating, setIsDonating] = useState(false);
  const [txNotice, setTxNotice] = useState<{ message: string; txHash?: string } | null>(null);

  const [timeLeft, setTimeLeft] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
    days: 30,
    hours: 0,
    minutes: 0,
    seconds: 0
  });

  useEffect(() => {
    const unsubPool = prizePoolStore.subscribe(setState);
    const unsubWallet = walletStore.subscribe(setWallet);
    const unsubPrices = marketService.subscribe(setPrices);
    return () => {
      unsubPool();
      unsubWallet();
      unsubPrices();
    };
  }, []);

  // Countdown timer calculation from on-chain seasonEndTime
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

  const ethPrice = prices.ETH?.price || 3480;
  const poolUsd = Math.round(state.currentSeasonPool * ethPrice);

  const handleDonate = async () => {
    const amount = parseFloat(donationInput);
    if (isNaN(amount) || amount <= 0) {
      alert("Please enter a valid ETH amount to contribute.");
      return;
    }

    if (!wallet.isConnected || !wallet.address) {
      await walletStore.connect();
      return;
    }

    const currentAddr = wallet.address;

    sound.playClick();
    setIsDonating(true);
    setTxNotice({ message: "Confirming contribution in Web3 wallet..." });

    try {
      const txHash = await prizePoolStore.donateToPrizePool(amount, currentAddr as `0x${string}`);
      setTxNotice({
        message: `Successfully contributed ${amount} ETH to the on-chain prize pool!`,
        txHash
      });
      sound.playShield();
      walletStore.refreshBalance();
    } catch (err: any) {
      console.error("Donation failed:", err);
      setTxNotice({ message: err?.message || "Failed to submit donation transaction." });
    } finally {
      setIsDonating(false);
    }
  };

  const leaderboardStandings = [
    { rank: 1, address: "0x39Bc...71E9", mmr: 2340, tier: "Crypto Whale", payoutEth: (state.currentSeasonPool * 0.40).toFixed(4), share: "40%" },
    { rank: 2, address: "0x882F...99A1", mmr: 2190, tier: "Crypto Whale", payoutEth: (state.currentSeasonPool * 0.25).toFixed(4), share: "25%" },
    { rank: 3, address: "0x12Fa...990B", mmr: 2040, tier: "Crypto Whale", payoutEth: (state.currentSeasonPool * 0.15).toFixed(4), share: "15%" },
    { rank: 4, address: wallet.address ? `${wallet.address.slice(0, 6)}...${wallet.address.slice(-4)} (You)` : "Connect Wallet", mmr: 1680, tier: "Diamond", payoutEth: (state.currentSeasonPool * 0.05).toFixed(4), share: "5.0%" },
    { rank: 5, address: "0x5501...44D2", mmr: 1620, tier: "Diamond", payoutEth: (state.currentSeasonPool * 0.03).toFixed(4), share: "3.0%" }
  ];

  return (
    <div className="w-full max-w-[1400px] mx-auto space-y-8">
      {/* Transaction Notice */}
      {txNotice && (
        <div className="p-4 rounded-xl bg-[#0F1626] border border-cyan-500/50 text-cyan-200 text-xs flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Coins className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>{txNotice.message}</span>
            {txNotice.txHash && (
              <a
                href={getExplorerTxUrl(txNotice.txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-orange-400 hover:text-orange-300 font-mono ml-2 inline-flex items-center"
              >
                View on Etherscan <ExternalLink className="w-3 h-3 ml-1" />
              </a>
            )}
          </div>
          <button onClick={() => setTxNotice(null)} className="text-slate-400 hover:text-slate-200 font-bold">
            ✕
          </button>
        </div>
      )}

      {/* Top Hero Banner */}
      <div className="relative rounded-3xl bg-gradient-to-b from-[#111A2E] via-[#0D1322] to-[#070A10] p-8 border border-amber-500/30 shadow-[0_0_50px_rgba(251,191,36,0.1)] overflow-hidden">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 relative z-10">
          <div className="space-y-2 text-center md:text-left">
            <div className="flex items-center space-x-2 text-xs font-chakra font-bold tracking-wider text-orange-400">
              <Trophy className="w-4 h-4 text-orange-400" />
              <span>SEASON {state.currentSeason} ON-CHAIN PRIZE POOL</span>
              <button
                onClick={() => prizePoolStore.refreshFromContract()}
                className="ml-2 text-slate-400 hover:text-slate-200"
                title="Refresh from Robinhood"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-silkscreen font-bold text-slate-100 uppercase tracking-wide">
              ${poolUsd.toLocaleString()} USD
            </h1>
            <div className="text-emerald-400 font-mono font-bold text-xl">
              {state.currentSeasonPool.toFixed(4)} ETH Inflow Vault
            </div>
            <p className="text-xs text-slate-400 max-w-xl">
              Funded transparently on-chain from 20% of all pack sales and 2.5% of secondary marketplace volume on Robinhood Chain.
            </p>
          </div>

          {/* Countdown Clock */}
          <div className="bg-[#090D15]/90 border border-slate-800 rounded-2xl p-4 text-center">
            <div className="flex items-center justify-center space-x-1.5 text-xs text-slate-400 font-mono uppercase mb-3">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Season Final Settlement In:</span>
            </div>
            <div className="grid grid-cols-4 gap-2 text-center font-mono">
              <div className="bg-[#101624] px-3 py-2 rounded-lg border border-slate-800">
                <span className="text-xl font-bold text-slate-100">{timeLeft.days}</span>
                <span className="text-[10px] text-slate-500 block uppercase">Days</span>
              </div>
              <div className="bg-[#101624] px-3 py-2 rounded-lg border border-slate-800">
                <span className="text-xl font-bold text-slate-100">{timeLeft.hours}</span>
                <span className="text-[10px] text-slate-500 block uppercase">Hours</span>
              </div>
              <div className="bg-[#101624] px-3 py-2 rounded-lg border border-slate-800">
                <span className="text-xl font-bold text-slate-100">{timeLeft.minutes}</span>
                <span className="text-[10px] text-slate-500 block uppercase">Mins</span>
              </div>
              <div className="bg-[#101624] px-3 py-2 rounded-lg border border-slate-800">
                <span className="text-xl font-bold text-emerald-400">{timeLeft.seconds}</span>
                <span className="text-[10px] text-slate-500 block uppercase">Secs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Direct Donation Widget */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-xs text-slate-300 font-mono">
            <HeartHandshake className="w-4 h-4 text-rose-400" />
            <span>Direct Community Contribution:</span>
          </div>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              step="0.005"
              min="0.001"
              value={donationInput}
              onChange={(e) => setDonationInput(e.target.value)}
              className="w-24 bg-[#090D15] border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-orange-500"
            />
            <span className="text-xs text-slate-400 font-mono">ETH</span>
            <button
              onClick={handleDonate}
              disabled={isDonating}
              className="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 text-xs font-bold font-chakra uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
            >
              {isDonating ? "Contributing..." : "Contribute to Pool"}
            </button>
          </div>
        </div>
      </div>

      {/* Contract Verification Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#0A0F19] rounded-2xl border border-slate-800 p-5 space-y-3">
          <h3 className="font-silkscreen font-bold text-slate-100 text-sm uppercase flex items-center space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Smart Contract Verification</span>
          </h3>
          <div className="space-y-2 text-xs font-mono">
            <div className="p-2.5 rounded-lg bg-[#0E1320] border border-slate-800 flex justify-between items-center">
              <span className="text-slate-400">Robinhood Prize Pool Contract:</span>
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

        {/* Projected Season Payout Schedule */}
        <div className="bg-[#0A0F19] rounded-2xl border border-slate-800 p-5 space-y-3">
          <h3 className="font-silkscreen font-bold text-slate-100 text-sm uppercase flex items-center space-x-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Leaderboard Payout Schedule</span>
          </h3>
          <div className="space-y-1.5 text-xs font-mono">
            {leaderboardStandings.map((tier) => (
              <div
                key={tier.rank}
                className="flex items-center justify-between p-2 rounded-lg bg-[#0E1320] border border-slate-800/80"
              >
                <div className="flex items-center space-x-2">
                  <span className="text-amber-400 font-bold">#{tier.rank}</span>
                  <span className="text-slate-300 truncate max-w-[120px]">{tier.address}</span>
                  <span className="text-[10px] text-slate-500 font-chakra uppercase">({tier.tier})</span>
                </div>
                <div className="flex items-center space-x-3">
                  <span className="text-slate-400 text-[11px]">{tier.share}</span>
                  <span className="text-emerald-400 font-bold">~{tier.payoutEth} ETH</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Real-time Inflow Ledger Table */}
      <div className="bg-[#0A0E17] rounded-2xl border border-slate-800 p-5 space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center space-x-2">
            <Coins className="w-5 h-5 text-emerald-400" />
            <h2 className="text-base sm:text-lg font-silkscreen font-bold text-slate-100 uppercase tracking-wider">
              On-Chain Inflow Ledger ({state.inflows.length} Transactions)
            </h2>
          </div>
          <span className="text-xs text-slate-400 font-mono">ROBINHOOD CHAIN HISTORY</span>
        </div>

        {state.inflows.length === 0 ? (
          <div className="py-12 text-center text-slate-500 text-xs font-mono">
            No on-chain inflows recorded in this season yet. Open a pack or trade a card to register the first inflow!
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 uppercase text-[10px]">
                  <th className="py-2.5 px-3">Transaction</th>
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
                      {inflow.hash}
                    </td>
                    <td className="py-3 px-3 text-slate-200 font-semibold">{inflow.source}</td>
                    <td className="py-3 px-3 text-slate-400">#{inflow.blockNumber}</td>
                    <td className="py-3 px-3 text-slate-400">
                      <a
                        href={getExplorerAddressUrl(inflow.contributor)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="underline hover:text-slate-200"
                      >
                        {inflow.contributor.slice(0, 8)}...{inflow.contributor.slice(-6)}
                      </a>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-400">
                      +{inflow.amountEth.toFixed(4)} ETH
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
