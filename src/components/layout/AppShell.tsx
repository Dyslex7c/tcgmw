"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { LiveMarketTicker } from "./LiveMarketTicker";
import { Navbar } from "./Navbar";
import { MarketSimulatorModal } from "./MarketSimulatorModal";
import { Footer } from "./Footer";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [isSimulatorOpen, setIsSimulatorOpen] = useState(false);
  const pathname = usePathname();
  const isBattle = pathname === "/battle";

  return (
    <div className={isBattle ? "h-screen flex flex-col bg-[#07090E] text-slate-100 overflow-hidden" : "min-h-screen flex flex-col bg-[#07090E] text-slate-100 overflow-x-hidden"}>
      {/* Live Persistent Market Ticker Strip */}
      <LiveMarketTicker onOpenSimulator={() => setIsSimulatorOpen(true)} />

      {/* Main Top Navigation */}
      <Navbar onOpenSimulator={() => setIsSimulatorOpen(true)} />

      {/* Main Content Area - Full Width */}
      <main className={isBattle ? "flex-1 w-full overflow-hidden flex flex-col min-h-0" : "flex-1 w-full"}>
        {children}
      </main>

      {/* Global Interactive Market Volatility Simulator */}
      <MarketSimulatorModal
        isOpen={isSimulatorOpen}
        onClose={() => setIsSimulatorOpen(false)}
      />

      {/* Tactical Cyberpunk Footer (Hidden on Battle Arena for zero-scroll laptop fit) */}
      {!isBattle && <Footer onOpenSimulator={() => setIsSimulatorOpen(true)} />}
    </div>
  );
}
