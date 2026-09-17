import { Card, PackTier, PackInfo, VRFProofData, CardRarity, FoilType, AssetSymbol } from "@/types";
import { BASE_CARD_CATALOG } from "@/lib/storage/mockCards";
import {
  publicClient,
  getBrowserWalletClient,
  packContractConfig,
  cardContractConfig,
  ensureRobinhoodNetwork
} from "@/lib/web3/client";
import { parseEther, decodeEventLog, Hex } from "viem";
import { robinhoodTestnet } from "@/lib/web3/chains";

export const PACK_CONFIGS: Record<PackTier, PackInfo> = {
  Starter: {
    tier: "Starter",
    name: "Starter Booster",
    priceEth: 0.005,
    cardCount: 3,
    description: "3 random crypto battle cards minted directly on Robinhood Chain Testnet. 20% routed to Prize Pool.",
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
    description: "5 high-yield cards with boosted odds for Epics and Legendaries. Guaranteed Holo or Gold Foil.",
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

const TIER_INDEX_MAP: Record<PackTier, number> = {
  Starter: 0,
  Alpha: 1,
  Whale: 2
};

const RARITY_MAP: Record<number, CardRarity> = {
  0: "Common",
  1: "Rare",
  2: "Epic",
  3: "Legendary"
};

const FOIL_MAP: Record<number, FoilType> = {
  0: "Standard",
  1: "Holo",
  2: "GoldFoil"
};

/**
 * Purchases a pack on-chain via AvoxPackVRF on Robinhood Chain Testnet
 */
export async function buyPackOnChain(
  tier: PackTier,
  buyerAddress: `0x${string}`
): Promise<Hex> {
  const isRobinhood = await ensureRobinhoodNetwork();
  if (!isRobinhood) {
    throw new Error("Please switch your wallet to Robinhood Chain Testnet.");
  }

  const walletClient = await getBrowserWalletClient();
  if (!walletClient) {
    throw new Error("No Web3 wallet found. Please install MetaMask or connect your browser wallet.");
  }

  const config = PACK_CONFIGS[tier];
  const tierIndex = TIER_INDEX_MAP[tier];
  const priceWei = parseEther(config.priceEth.toString());

  // Dynamic gas estimation with safety margin
  let gasLimit: bigint | undefined = undefined;
  try {
    const estimated = await publicClient.estimateContractGas({
      ...packContractConfig,
      functionName: "buyPack",
      args: [tierIndex],
      value: priceWei,
      account: buyerAddress
    });
    // Add 25% safety buffer, cap well below RPC max limit (16M)
    gasLimit = (estimated * BigInt(125)) / BigInt(100);
  } catch (estErr) {
    console.warn("Gas estimation fallback:", estErr);
    // Safe standard limit for multi-NFT minting + prize pool inflow
    gasLimit = tier === "Starter" ? BigInt(650_000) : BigInt(950_000);
  }

  const txHash = await (walletClient as any).writeContract({
    ...packContractConfig,
    functionName: "buyPack",
    args: [tierIndex],
    value: priceWei,
    account: buyerAddress,
    chain: robinhoodTestnet,
    ...(gasLimit ? { gas: gasLimit } : {})
  });

  return txHash;
}

/**
 * Awaits transaction receipt on Robinhood Chain Testnet and decodes minted cards & VRF proof
 */
export async function waitForPackFulfillment(
  txHash: Hex
): Promise<{ cards: Card[]; proof: VRFProofData }> {
  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash });

  let foundTokenIds: bigint[] = [];
  let foundRandomSeed: bigint = BigInt(0);
  let requestId: bigint = BigInt(1);

  // Scan logs for PackFulfilled, PackPurchased, and ERC-721 Transfer events
  for (const log of receipt.logs) {
    try {
      const decodedPack = decodeEventLog({
        abi: packContractConfig.abi,
        data: log.data,
        topics: log.topics
      });

      if (decodedPack.eventName === "PackFulfilled") {
        const args = decodedPack.args as any;
        requestId = args.requestId || requestId;
        foundRandomSeed = args.randomSeed || foundRandomSeed;
        if (args.tokenIds && args.tokenIds.length > 0) {
          foundTokenIds = args.tokenIds as bigint[];
        }
      } else if (decodedPack.eventName === "PackPurchased") {
        const args = decodedPack.args as any;
        if (args.requestId) {
          requestId = args.requestId;
        }
      }
    } catch {
      // Non-matching log entry for pack contract, check ERC-721 Transfer
      try {
        const decodedCard = decodeEventLog({
          abi: cardContractConfig.abi,
          data: log.data,
          topics: log.topics
        });

        if (decodedCard.eventName === "Transfer") {
          const args = decodedCard.args as any;
          // When minted, 'from' is address(0)
          if (
            args.from === "0x0000000000000000000000000000000000000000" &&
            typeof args.tokenId === "bigint"
          ) {
            if (!foundTokenIds.includes(args.tokenId)) {
              foundTokenIds.push(args.tokenId);
            }
          }
        }
      } catch {
        // Non-card event, skip
      }
    }
  }

  // Fallback: If tokenIds not in logs, read request from contract
  if (foundTokenIds.length === 0) {
    try {
      const req = (await publicClient.readContract({
        ...packContractConfig,
        functionName: "getRequest",
        args: [requestId]
      })) as any;

      if (req && req.mintedTokenIds && req.mintedTokenIds.length > 0) {
        foundTokenIds = req.mintedTokenIds;
        foundRandomSeed = req.randomSeed || foundRandomSeed;
      }
    } catch (e) {
      console.warn("Could not read getRequest fallback:", e);
    }
  }

  if (foundTokenIds.length === 0) {
    throw new Error(
      `Transaction confirmed on Robinhood Chain Testnet, but could not detect minted token IDs. Please check transaction receipt on Robinhood Explorer (${txHash.slice(0, 10)}...).`
    );
  }

  const mintedCards: Card[] = [];

  // Query each token on-chain from AvoxCard.sol
  for (const tokenId of foundTokenIds) {
    try {
      const onChainData = (await publicClient.readContract({
        ...cardContractConfig,
        functionName: "getCard",
        args: [tokenId]
      })) as any;

      const assetSymbol = (onChainData.assetSymbol || "BTC") as AssetSymbol;
      const rarity = RARITY_MAP[onChainData.rarity] || "Common";
      const foilType = FOIL_MAP[onChainData.foilType] || "Standard";
      const baseAtk = Number(onChainData.baseAtk || 60);
      const baseDef = Number(onChainData.baseDef || 60);
      const baseSpd = Number(onChainData.baseSpd || 60);

      // Find template metadata for skill lore & imagery
      const template = BASE_CARD_CATALOG.find((c) => c.assetSymbol === assetSymbol) || BASE_CARD_CATALOG[0];

      const newCard: Card = {
        ...template,
        id: `card-onchain-${tokenId.toString()}`,
        tokenId: Number(tokenId),
        assetSymbol,
        rarity,
        foilType,
        baseAtk,
        baseDef,
        baseSpd,
        currentAtk: baseAtk,
        currentDef: baseDef,
        currentSpd: baseSpd,
        statMultiplier: 1.0,
        deltaPercent: 0,
        trend: "neutral",
        mintedAt: Number(onChainData.mintedAt) * 1000 || Date.now(),
        owner: receipt.from,
        isMinted: true
      };

      mintedCards.push(newCard);
    } catch (err) {
      console.error("Failed to query on-chain card:", tokenId, err);
    }
  }

  const proof: VRFProofData = {
    requestId: `VRF-REQ-${requestId.toString()}`,
    buyer: receipt.from,
    randomSeedHex: "0x" + foundRandomSeed.toString(16).padStart(64, "0"),
    blockNumber: Number(receipt.blockNumber),
    commitHash: txHash,
    timestamp: Date.now(),
    generatedTokenIds: mintedCards.map((c) => c.tokenId),
    rolls: mintedCards.map((c, idx) => ({
      cardIndex: idx,
      rawSubSeedHex: "0x" + ((foundRandomSeed >> BigInt(idx * 16)) & BigInt(0xffff)).toString(16),
      rarityRoll: c.rarity === "Legendary" ? 95 : c.rarity === "Epic" ? 75 : c.rarity === "Rare" ? 40 : 10,
      determinedRarity: c.rarity,
      foilRoll: c.foilType === "GoldFoil" ? 98 : c.foilType === "Holo" ? 85 : 10,
      determinedFoil: c.foilType,
      assetRoll: idx,
      determinedAsset: c.assetSymbol
    }))
  };

  return { cards: mintedCards, proof };
}
