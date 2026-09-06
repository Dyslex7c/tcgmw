"use client";

import { BattleArena } from "@/components/battle/BattleArena";

export default function BattlePage() {
  return (
    <div className="w-full h-full flex-1 flex flex-col overflow-hidden p-1.5 sm:p-3 max-w-[1600px] mx-auto min-h-0">
      <BattleArena />
    </div>
  );
}
