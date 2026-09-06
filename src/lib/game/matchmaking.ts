import { Card, OpponentProfile } from "@/types";
import { BASE_CARD_CATALOG } from "@/lib/storage/mockCards";

export interface BotDefinition {
  id: string;
  name: string;
  title: string;
  avatar: string;
  mmr: number;
  archetype: string;
  introQuote: string;
  cardIndices: number[];
}

export const AI_BOT_ROSTER: BotDefinition[] = [
  {
    id: "bot-deepalpha",
    name: "DeepAlpha WhaleBot",
    title: "Institutional Liquidity Provider",
    avatar: "🐋",
    mmr: 1740,
    archetype: "Ironclad Fortress",
    introQuote: "DeepAlpha WhaleBot deployed. Ingesting order book depth... Your deck will be liquidated.",
    cardIndices: [0, 1, 3] // BTC, ETH, LINK
  },
  {
    id: "bot-gcr-liquidator",
    name: "GCR Liquidation Bot",
    title: "Hyper-Volatility Degen",
    avatar: "⚡",
    mmr: 1890,
    archetype: "High-Volatility Glass Cannon",
    introQuote: "I've weathered -90% flash crashes. Let's see your cards survive true volatility.",
    cardIndices: [7, 2, 4] // PEPE, SOL, DOGE
  },
  {
    id: "bot-citadel-arb",
    name: "Citadel HFT Arb",
    title: "Sub-Millisecond Execution Engine",
    avatar: "🤖",
    mmr: 1620,
    archetype: "Ultra-Speed Burst",
    introQuote: "Routing execution through private dark pools. Zero latency, maximum extraction.",
    cardIndices: [5, 6, 8] // AVAX, BNB, NEAR
  },
  {
    id: "bot-mev-sandwicher",
    name: "MevHunter Sandwicher",
    title: "Mempool Frontrun Specialist",
    avatar: "🥪",
    mmr: 1580,
    archetype: "Tactical Energy Drainer",
    introQuote: "MevHunter locked onto your transaction sequence. Slippage tolerance set to 99%.",
    cardIndices: [1, 5, 7] // ETH, AVAX, PEPE
  },
  {
    id: "bot-satoshi-sentinel",
    name: "Satoshi Sentinel AI",
    title: "Genesis Sovereign AI",
    avatar: "👑",
    mmr: 2050,
    archetype: "Legendary Apex Boss",
    introQuote: "Decentralized cryptographic consensus is unbreakable. Let the market decide your fate.",
    cardIndices: [0, 3, 6] // BTC, LINK, BNB
  }
];

export function getBotOpponent(botId?: string): { profile: OpponentProfile; deck: Card[] } {
  let bot: BotDefinition;
  if (botId) {
    bot = AI_BOT_ROSTER.find((b) => b.id === botId) || AI_BOT_ROSTER[0];
  } else {
    bot = AI_BOT_ROSTER[Math.floor(Math.random() * AI_BOT_ROSTER.length)];
  }

  const deck = bot.cardIndices.map((idx, i) => {
    const template = BASE_CARD_CATALOG[idx] || BASE_CARD_CATALOG[i];
    return {
      ...template,
      id: `bot-card-${bot.id}-${idx}-${Date.now()}-${i}`,
      owner: `0xAI...${bot.name.replace(/\s+/g, "")}`
    };
  });

  const profile: OpponentProfile = {
    id: bot.id,
    name: bot.name,
    title: bot.title,
    avatar: bot.avatar,
    mmr: bot.mmr,
    isBot: true,
    botArchetype: bot.archetype,
    introQuote: bot.introQuote
  };

  return { profile, deck };
}

export interface MatchmakingResult {
  opponentProfile: OpponentProfile;
  opponentDeck: Card[];
  matchedAsBot: boolean;
}

export type MatchmakingStatusCallback = (status: {
  elapsedSeconds: number;
  message: string;
  peersScanned: number;
  stage: "scanning" | "pinging" | "expanding" | "fallback_bot" | "matched";
}) => void;

class MatchmakerService {
  private channel: BroadcastChannel | null = null;
  private currentSessionId: string | null = null;
  private queueTimer: NodeJS.Timeout | null = null;
  private tickerInterval: NodeJS.Timeout | null = null;
  private isSearching = false;

  constructor() {
    if (typeof window !== "undefined" && "BroadcastChannel" in window) {
      try {
        this.channel = new BroadcastChannel("marketwars_matchmaking_v1");
      } catch (err) {
        console.warn("BroadcastChannel not available:", err);
      }
    }
  }

  /**
   * Start searching for a live human opponent.
   * If none is found within timeoutSeconds (default 5.5s), falls back to an AI Bot.
   */
  public searchMatch(
    playerProfile: { name: string; mmr?: number },
    playerDeck: Card[],
    onStatus: MatchmakingStatusCallback,
    onMatchFound: (result: MatchmakingResult) => void,
    timeoutSeconds = 5.5
  ): () => void {
    this.cancelSearch();

    this.isSearching = true;
    const sessionId = `trader-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    this.currentSessionId = sessionId;

    let elapsed = 0;
    let peersCount = 1;

    // Initial status
    onStatus({
      elapsedSeconds: 0,
      message: "Scanning on-chain mempool for peer traders...",
      peersScanned: peersCount,
      stage: "scanning"
    });

    // Broadcast search message to other open tabs
    if (this.channel) {
      const handleMessage = (event: MessageEvent) => {
        if (!this.isSearching || this.currentSessionId !== sessionId) return;

        const data = event.data;
        if (!data || typeof data !== "object") return;

        // Another tab is looking for a match!
        if (data.type === "MW_P2P_SEARCH" && data.sessionId !== sessionId) {
          peersCount++;
          // Accept the peer match
          this.channel?.postMessage({
            type: "MW_P2P_ACCEPT",
            targetSessionId: data.sessionId,
            senderSessionId: sessionId,
            name: playerProfile.name,
            mmr: playerProfile.mmr || 1500,
            deck: playerDeck
          });

          this.finishMatch(
            {
              id: data.sessionId,
              name: data.name || "Anon Trader",
              title: "Peer Challenger",
              avatar: "⚔️",
              mmr: data.mmr || 1500,
              isBot: false,
              introQuote: "P2P connection established. May the green candles favor you."
            },
            data.deck || BASE_CARD_CATALOG.slice(0, 3),
            false,
            onStatus,
            onMatchFound
          );
        } else if (data.type === "MW_P2P_ACCEPT" && data.targetSessionId === sessionId) {
          // A peer accepted our search
          this.finishMatch(
            {
              id: data.senderSessionId,
              name: data.name || "Anon Trader",
              title: "Peer Challenger",
              avatar: "⚔️",
              mmr: data.mmr || 1500,
              isBot: false,
              introQuote: "P2P connection established. May the green candles favor you."
            },
            data.deck || BASE_CARD_CATALOG.slice(0, 3),
            false,
            onStatus,
            onMatchFound
          );
        }
      };

      this.channel.addEventListener("message", handleMessage);

      // Announce our presence
      this.channel.postMessage({
        type: "MW_P2P_SEARCH",
        sessionId,
        name: playerProfile.name,
        mmr: playerProfile.mmr || 1500,
        deck: playerDeck
      });
    }

    // Interval ticker updating queue radar
    this.tickerInterval = setInterval(() => {
      elapsed += 0.5;
      peersCount += Math.floor(Math.random() * 2);

      let message = "Scanning on-chain mempool for peer traders...";
      let stage: "scanning" | "pinging" | "expanding" | "fallback_bot" | "matched" = "scanning";

      if (elapsed >= 4.0) {
        stage = "fallback_bot";
        message = "No human player in queue — Connecting to Market AI Bot...";
      } else if (elapsed >= 2.5) {
        stage = "expanding";
        message = "Expanding matchmaking bracket (±250 MMR)...";
      } else if (elapsed >= 1.0) {
        stage = "pinging";
        message = "Querying L2 order books & validator nodes...";
      }

      onStatus({
        elapsedSeconds: Math.round(elapsed),
        message,
        peersScanned: peersCount,
        stage
      });
    }, 500);

    // Timeout: Automatically fallback to an intelligent AI Bot opponent
    this.queueTimer = setTimeout(() => {
      if (!this.isSearching || this.currentSessionId !== sessionId) return;

      const bot = getBotOpponent();
      this.finishMatch(bot.profile, bot.deck, true, onStatus, onMatchFound);
    }, timeoutSeconds * 1000);

    return () => this.cancelSearch();
  }

  /**
   * Immediately bypass queue and match with an AI Bot
   */
  public instantBotMatch(botId?: string): MatchmakingResult {
    this.cancelSearch();
    const bot = getBotOpponent(botId);
    return {
      opponentProfile: bot.profile,
      opponentDeck: bot.deck,
      matchedAsBot: true
    };
  }

  private finishMatch(
    opponentProfile: OpponentProfile,
    opponentDeck: Card[],
    matchedAsBot: boolean,
    onStatus: MatchmakingStatusCallback,
    onMatchFound: (result: MatchmakingResult) => void
  ) {
    this.cleanupTimers();
    this.isSearching = false;

    onStatus({
      elapsedSeconds: 5,
      message: matchedAsBot
        ? `Opponent Secured: ${opponentProfile.name} [AI BOT]`
        : `Opponent Secured: ${opponentProfile.name} [LIVE P2P]`,
      peersScanned: 12,
      stage: "matched"
    });

    onMatchFound({
      opponentProfile,
      opponentDeck,
      matchedAsBot
    });
  }

  public cancelSearch() {
    this.isSearching = false;
    this.currentSessionId = null;
    this.cleanupTimers();
  }

  private cleanupTimers() {
    if (this.queueTimer) {
      clearTimeout(this.queueTimer);
      this.queueTimer = null;
    }
    if (this.tickerInterval) {
      clearInterval(this.tickerInterval);
      this.tickerInterval = null;
    }
  }
}

export const matchmaker = new MatchmakerService();
