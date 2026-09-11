export type AssetSymbol =
  | "ROBINHOOD"
  | "ETH"
  | "ARBITRUM"
  | "OPTIMISM"
  | "BASE"
  | "AVAX"
  | "POLYGON"
  | "BNB"
  | "ZKSYNC"
  | "MONAD"
  | "COSMOS"
  | "APECHAIN"
  | "GNOSIS"
  | "LINEA"
  | "TON"
  | "WORLDCHAIN"
  | "HEDERA"
  | "BTC"
  | "SOL"
  | "DOGE"
  | "LINK"
  | "PEPE"
  | "NEAR"
  | "SUI"
  | "CARDANO"
  | "POLKADOT"
  | "APTOS"
  | "TRON"
  | "RIPPLE"
  | "FANTOM";

export type CardRarity = "Common" | "Rare" | "Epic" | "Legendary";
export type FoilType = "Standard" | "Holo" | "GoldFoil";
export type AssetCategory = "L1" | "DeFi" | "Meme" | "Infrastructure" | "AI";

export type SkillType = "attack" | "buff" | "shield" | "drain" | "freeze" | "burn" | "shock" | "poison";

export interface CardSkill {
  name: string;
  description: string;
  manaCost: number;
  type: SkillType;
  cooldownTurns: number;
  element?: "fire" | "ice" | "electric" | "poison" | "neutral";
}

export interface Card {
  id: string;
  tokenId: number;
  assetSymbol: AssetSymbol;
  name: string;
  subtitle: string;
  category: AssetCategory;
  rarity: CardRarity;
  foilType: FoilType;
  baseAtk: number;
  baseDef: number;
  baseSpd: number;
  currentAtk: number;
  currentDef: number;
  currentSpd: number;
  statMultiplier: number; // e.g. 1.15 (+15%)
  deltaPercent: number;    // e.g. +10.2%
  trend: "pump" | "dump" | "neutral";
  flavorText: string;
  skill: CardSkill;
  mintedAt: number;
  owner: string;
  sparkline: number[];
  isMinted?: boolean;
}

export type PackTier = "Starter" | "Alpha" | "Whale";

export interface PackInfo {
  tier: PackTier;
  name: string;
  priceEth: number;
  cardCount: number;
  description: string;
  badge: string;
  odds: {
    common: number;
    rare: number;
    epic: number;
    legendary: number;
    foilMultiplier: number;
  };
}

export interface VRFProofData {
  requestId: string;
  buyer: string;
  blockNumber: number;
  timestamp: number;
  randomSeedHex: string;
  commitHash: string;
  generatedTokenIds: number[];
  rolls: Array<{
    cardIndex: number;
    rawSubSeedHex: string;
    rarityRoll: number;
    determinedRarity: CardRarity;
    foilRoll: number;
    determinedFoil: FoilType;
    assetRoll: number;
    determinedAsset: AssetSymbol;
  }>;
}

export interface BattleCard extends Card {
  currentHp: number;
  maxHp: number;
  energy: number;
  maxEnergy: number;
  shield: number;
  isDefending?: boolean;
  cooldownRemaining: number;
  statusEffects: StatusEffect[];
}

export type StatusEffectType = "freeze" | "burn" | "shock" | "poison" | "shield" | "bull_buff" | "bear_debuff";

export interface StatusEffect {
  type: StatusEffectType;
  duration: number;
  value: number;
  name: string;
}

export interface BattleLogEntry {
  id: string;
  round: number;
  sender: "player" | "opponent" | "system" | "market";
  actorName: string;
  targetName?: string;
  actionName: string;
  damage?: number;
  heal?: number;
  shield?: number;
  isCrit?: boolean;
  marketEventNotice?: string;
  text: string;
  timestamp: number;
}

export interface OpponentProfile {
  id: string;
  name: string;
  title: string;
  avatar: string;
  mmr: number;
  isBot: boolean;
  botArchetype?: string;
  introQuote?: string;
}

export interface BattleState {
  id: string;
  opponentProfile: OpponentProfile;
  playerLineup: BattleCard[];
  opponentLineup: BattleCard[];
  activePlayerIndex: number;
  activeOpponentIndex: number;
  currentTurn: "player" | "opponent";
  round: number;
  phase: "action" | "resolving" | "game_over";
  winner?: "player" | "opponent";
  log: BattleLogEntry[];
}

export interface MarketplaceListing {
  id: string;
  card: Card;
  seller: string;
  priceEth: number;
  listedAt: number;
  isActive: boolean;
}

export interface PrizeInflowRecord {
  hash: string;
  amountEth: number;
  timestamp: number;
  source: string;
  contributor: string;
  blockNumber: number;
}

export interface LivePriceData {
  symbol: AssetSymbol;
  price: number;
  change24h: number;
  change5m: number;
  high24h: number;
  low24h: number;
  history: number[];
  lastUpdate: number;
}
