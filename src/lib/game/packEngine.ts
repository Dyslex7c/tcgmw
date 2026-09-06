import { Card, PackTier, PackInfo, VRFProofData, CardRarity, FoilType, AssetSymbol } from "@/types";
import { BASE_CARD_CATALOG } from "@/lib/storage/mockCards";
import { prizePoolStore } from "@/lib/storage/prizePoolStore";

export const PACK_CONFIGS: Record<PackTier, PackInfo> = {
  Starter: {
    tier: "Starter",
    name: "Starter Booster",
    priceEth: 0.005,
    cardCount: 3,
    description: "3 random crypto battle cards. Perfect for newcomers entering the trading floor.",
    badge: "Most Popular",
    odds: {
      common: 60,
      rare: 25,
      epic: 12,
      legendary: 3,
      foilMultiplier: 8
    }
  },
  Alpha: {
    tier: "Alpha",
    name: "Alpha Syndicate Pack",
    priceEth: 0.02,
    cardCount: 5,
    description: "5 high-yield cards with boosted odds for Epics and Legendaries. Guaranteed Holo.",
    badge: "High EV",
    odds: {
      common: 20,
      rare: 45,
      epic: 25,
      legendary: 10,
      foilMultiplier: 25
    }
  },
  Whale: {
    tier: "Whale",
    name: "Whale Citadel Cache",
    priceEth: 0.05,
    cardCount: 5,
    description: "5 elite cards with guaranteed Legendary card and high Gold Foil probability.",
    badge: "Whale Tier",
    odds: {
      common: 0,
      rare: 30,
      epic: 45,
      legendary: 25,
      foilMultiplier: 50
    }
  }
};

const ASSETS: AssetSymbol[] = ["BTC", "ETH", "SOL", "DOGE", "AVAX", "LINK", "BNB", "PEPE", "NEAR", "SUI"];

/**
 * Deterministic pseudo-random generation mimicking on-chain Keccak256 VRF expansion.
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

export function openPackWithVRF(
  tier: PackTier,
  buyerAddress: string = "0x71C...Demo"
): { cards: Card[]; proof: VRFProofData } {
  const config = PACK_CONFIGS[tier];
  const requestId = "VRF-" + Math.floor(100000 + Math.random() * 900000);
  const blockNumber = 19482100 + Math.floor(Math.random() * 500);
  const timestamp = Date.now();

  // 256-bit simulated seed
  const rawSeed = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
  const randomSeedHex = "0x" + rawSeed;
  const commitHash = "0x" + Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join("");

  const generatedCards: Card[] = [];
  const rolls: VRFProofData["rolls"] = [];
  const tokenIds: number[] = [];

  for (let i = 0; i < config.cardCount; i++) {
    const subSeedHex = "0x" + hashString(randomSeedHex + i + requestId).toString(16).padStart(16, "0");
    const seedInt = hashString(subSeedHex);

    // Roll Rarity
    const rarityRoll = seedInt % 100;
    let rarity: CardRarity = "Common";
    if (rarityRoll < config.odds.legendary) {
      rarity = "Legendary";
    } else if (rarityRoll < config.odds.legendary + config.odds.epic) {
      rarity = "Epic";
    } else if (rarityRoll < config.odds.legendary + config.odds.epic + config.odds.rare) {
      rarity = "Rare";
    }

    // Whale guarantee check: first card is guaranteed Legendary if tier is Whale
    if (tier === "Whale" && i === 0) {
      rarity = "Legendary";
    }

    // Roll Foil
    const foilRoll = Math.floor(seedInt / 100) % 100;
    let foilType: FoilType = "Standard";
    if (foilRoll < Math.floor(config.odds.foilMultiplier / 3)) {
      foilType = "GoldFoil";
    } else if (foilRoll < config.odds.foilMultiplier) {
      foilType = "Holo";
    }

    // Roll Asset
    const assetRoll = Math.floor(seedInt / 10000) % ASSETS.length;
    const assetSymbol = ASSETS[assetRoll];

    // Find base card template or synthesize
    const template = BASE_CARD_CATALOG.find((c) => c.assetSymbol === assetSymbol) || BASE_CARD_CATALOG[0];

    // Stat generation scaled to rarity
    let atkMultiplier = 1.0;
    let defMultiplier = 1.0;
    let spdMultiplier = 1.0;

    if (rarity === "Legendary") {
      atkMultiplier = 1.45;
      defMultiplier = 1.4;
      spdMultiplier = 1.2;
    } else if (rarity === "Epic") {
      atkMultiplier = 1.25;
      defMultiplier = 1.2;
      spdMultiplier = 1.15;
    } else if (rarity === "Rare") {
      atkMultiplier = 1.05;
      defMultiplier = 1.05;
      spdMultiplier = 1.0;
    } else {
      atkMultiplier = 0.85;
      defMultiplier = 0.85;
      spdMultiplier = 0.9;
    }

    // Foil stat bonus
    if (foilType === "GoldFoil") {
      atkMultiplier += 0.1;
      defMultiplier += 0.1;
    } else if (foilType === "Holo") {
      atkMultiplier += 0.05;
      defMultiplier += 0.05;
    }

    const tokenId = Math.floor(1000 + Math.random() * 90000);
    tokenIds.push(tokenId);

    const newCard: Card = {
      ...template,
      id: `pull-${requestId}-${i}`,
      tokenId,
      rarity,
      foilType,
      baseAtk: Math.round(template.baseAtk * atkMultiplier),
      baseDef: Math.round(template.baseDef * defMultiplier),
      baseSpd: Math.round(template.baseSpd * spdMultiplier),
      currentAtk: Math.round(template.baseAtk * atkMultiplier),
      currentDef: Math.round(template.baseDef * defMultiplier),
      currentSpd: Math.round(template.baseSpd * spdMultiplier),
      mintedAt: timestamp,
      owner: buyerAddress
    };

    generatedCards.push(newCard);
    rolls.push({
      cardIndex: i + 1,
      rawSubSeedHex: subSeedHex,
      rarityRoll,
      determinedRarity: rarity,
      foilRoll,
      determinedFoil: foilType,
      assetRoll,
      determinedAsset: assetSymbol
    });
  }

  // Automatically record 20% cut to the prize pool transparent ledger!
  const prizePoolCut = Number((config.priceEth * 0.20).toFixed(5));
  prizePoolStore.recordInflow(
    prizePoolCut,
    `${config.name} Purchase (20% Revenue Split)`,
    buyerAddress
  );

  return {
    cards: generatedCards,
    proof: {
      requestId,
      buyer: buyerAddress,
      blockNumber,
      timestamp,
      randomSeedHex,
      commitHash,
      generatedTokenIds: tokenIds,
      rolls
    }
  };
}
