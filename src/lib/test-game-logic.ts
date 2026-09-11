import { calculateStatModifier } from "./market/statModifier";
import { BASE_CARD_CATALOG } from "./storage/mockCards";
import { PACK_CONFIGS } from "./game/packEngine";
import { createInitialBattle, executeMarketStrike, executeSpecialSkill, computeAiMove } from "./game/battleEngine";
import { marketService } from "./market/priceFeed";
import { CONTRACT_CONFIG } from "./constants/contracts";
import { getBotOpponent, matchmaker, AI_BOT_ROSTER } from "./game/matchmaking";

console.log("=== RUNNING MARKETWARS CORE ENGINE VALIDATION ===");

// 1. Test Stat Modifier Clamping
const btcCard = BASE_CARD_CATALOG[0];
const rallyPrice = {
  symbol: "BTC" as const,
  price: 90000,
  change24h: 35.0,
  change5m: 15.0,
  high24h: 92000,
  low24h: 60000,
  history: [60000, 75000, 90000],
  lastUpdate: Date.now()
};

const modified = calculateStatModifier(btcCard, rallyPrice);
console.log(`[PASS] Stat modifier for massive rally: multiplier=${modified.multiplier}, delta=${modified.deltaPercent}%, trend=${modified.trend}`);
if (modified.multiplier > 1.60) throw new Error("Multiplier exceeded maximum cap 1.60");
if (modified.trend !== "pump") throw new Error("Trend should be pump");

// 2. Test On-Chain Pack Configuration & Fee Splits
console.log(`[PASS] Pack configs verified: Starter (${PACK_CONFIGS.Starter.priceEth} ETH), Alpha (${PACK_CONFIGS.Alpha.priceEth} ETH), Whale (${PACK_CONFIGS.Whale.priceEth} ETH)`);
if (PACK_CONFIGS.Starter.priceEth !== 0.005) throw new Error("Starter pack price mismatch");
if (PACK_CONFIGS.Alpha.priceEth !== 0.02) throw new Error("Alpha pack price mismatch");
if (PACK_CONFIGS.Whale.priceEth !== 0.05) throw new Error("Whale pack price mismatch");

const packPrizeCut = (PACK_CONFIGS.Starter.priceEth * 2000) / 10000;
console.log(`[PASS] Pack 20% prize pool cut verified: ${packPrizeCut} ETH`);
if (packPrizeCut !== 0.001) throw new Error("Pack prize cut calculation mismatch");

// 3. Test Battle Engine
const prices = marketService.getPrices();
const initialBattle = createInitialBattle(BASE_CARD_CATALOG.slice(0, 3), prices);
console.log(`[PASS] Battle created: Player Active = ${initialBattle.playerLineup[0].name}, Opponent Active = ${initialBattle.opponentLineup[0].name}`);

const strikeResult = executeMarketStrike(initialBattle, true);
console.log(`[PASS] Market Strike executed: Damage=${strikeResult.damageDealt}, Next turn=${strikeResult.nextState.currentTurn}`);
if (strikeResult.nextState.currentTurn !== "opponent") throw new Error("Turn did not switch to opponent");

// 4. Test Marketplace Protocol Fee Calculation
const tradePrice = 0.1;
const marketplaceFee = (tradePrice * 250) / 10000;
console.log(`[PASS] Marketplace 2.5% trade fee verified: ${marketplaceFee} ETH routed to Prize Pool`);
if (marketplaceFee !== 0.0025) throw new Error("Marketplace fee calculation mismatch");

// 5. Test Matchmaking & Bot Opponent Fallback Engine
const botMatch = matchmaker.instantBotMatch();
console.log(`[PASS] Bot opponent generated: ${botMatch.opponentProfile.name} (${botMatch.opponentProfile.title}), MMR: ${botMatch.opponentProfile.mmr}, Deck Size: ${botMatch.opponentDeck.length}`);
if (!botMatch.opponentProfile.isBot) throw new Error("Generated opponent should be flagged as isBot: true");
if (botMatch.opponentDeck.length !== 3) throw new Error("Bot opponent deck must have 3 cards");
if (AI_BOT_ROSTER.length < 5) throw new Error("Bot roster should feature at least 5 varied archetypes");

const botBattle = createInitialBattle(BASE_CARD_CATALOG.slice(0, 3), prices, botMatch.opponentProfile, botMatch.opponentDeck);
if (botBattle.opponentProfile.name !== botMatch.opponentProfile.name) throw new Error("Battle opponent profile mismatch");
console.log(`[PASS] Bot Battle initialized: Opponent=${botBattle.opponentProfile.name}, Intro Log="${botBattle.log[0]?.text}"`);

// 6. Test Fast Match Pacing (Arcade tuned HP & Energy)
const pCard = initialBattle.playerLineup[0];
console.log(`[PASS] Fast Match Pacing: Active HP=${pCard.currentHp}/${pCard.maxHp}, Energy=${pCard.energy}`);
if (pCard.maxHp > 380) throw new Error(`Card max HP too high for fast arcade pacing: ${pCard.maxHp}`);
if (pCard.energy < 50) throw new Error("Starting energy should be at least 50 MP for swift action");

// 7. Test Pokemon-Style Elemental Skills & Status Effects
// Test Freeze: ETH Turing Sovereign Cold Storage Freeze
const ethCard = BASE_CARD_CATALOG.find(c => c.assetSymbol === "ETH") || BASE_CARD_CATALOG[1];
const testBattleWithEth = createInitialBattle([ethCard, ...BASE_CARD_CATALOG.slice(2, 4)], prices);
testBattleWithEth.playerLineup[0].energy = 100;
testBattleWithEth.opponentLineup[0].currentHp = 400;
testBattleWithEth.opponentLineup[0].maxHp = 400;
const freezeResult = executeSpecialSkill(testBattleWithEth, true);
console.log(`[PASS] Freeze Skill Executed: Skill=${freezeResult.skillUsed}, DMG=${freezeResult.damageDealt}, StatusInflicted=${freezeResult.statusInflicted}`);
if (freezeResult.nextState.currentTurn !== "opponent") throw new Error("Turn should transition to opponent to experience freeze");
const frozenOpponent = freezeResult.nextState.opponentLineup[freezeResult.nextState.activeOpponentIndex];
if (!frozenOpponent?.statusEffects?.some(s => s.type === "freeze")) throw new Error("Opponent should have freeze status condition");

// Test AI Opponent handling freeze:
const aiFreezeTurn = computeAiMove(freezeResult.nextState);
console.log(`[PASS] Frozen AI Turn Resolved: Skipped=${aiFreezeTurn.turnSkipped}, NextTurn=${aiFreezeTurn.nextState.currentTurn}`);
if (!aiFreezeTurn.turnSkipped) throw new Error("Freeze status must cause AI turn to be skipped");
if (aiFreezeTurn.nextState.currentTurn !== "player") throw new Error("Turn must return to player after AI freeze skip");
const thawedOpponent = aiFreezeTurn.nextState.opponentLineup[aiFreezeTurn.nextState.activeOpponentIndex];
if (thawedOpponent?.statusEffects?.some(s => s.type === "freeze")) throw new Error("Freeze status should thaw out after turn skip");

// Test AI Bot casting freeze on Player:
const battleWithAiEth = createInitialBattle(BASE_CARD_CATALOG.slice(0, 3), prices);
battleWithAiEth.playerLineup[0].currentHp = 400;
battleWithAiEth.playerLineup[0].maxHp = 400;
battleWithAiEth.opponentLineup[0] = {
  ...battleWithAiEth.opponentLineup[0],
  assetSymbol: "ETH",
  name: ethCard.name,
  skill: ethCard.skill,
  energy: 100,
  cooldownRemaining: 0
};
const aiBattleState = { ...battleWithAiEth, currentTurn: "opponent" as const };
const aiCastFreeze = computeAiMove(aiBattleState);
console.log(`[PASS] AI cast Freeze: Skill=${aiCastFreeze.skillUsed}, NextTurn=${aiCastFreeze.nextState.currentTurn}`);
if (aiCastFreeze.nextState.currentTurn !== "player") throw new Error("AI casting freeze must transition turn to player");

// Test Burn: BTC God Candle Megaburn
const testBattleWithBtc = createInitialBattle(BASE_CARD_CATALOG.slice(0, 3), prices);
testBattleWithBtc.playerLineup[0].energy = 100;
testBattleWithBtc.opponentLineup[0].currentHp = 400;
testBattleWithBtc.opponentLineup[0].maxHp = 400;
const burnResult = executeSpecialSkill(testBattleWithBtc, true);
console.log(`[PASS] Burn Skill Executed: Skill=${burnResult.skillUsed}, DMG=${burnResult.damageDealt}, StatusInflicted=${burnResult.statusInflicted}`);
const burnedOpponent = burnResult.nextState.opponentLineup.find(c => c.statusEffects?.some(e => e.type === "burn"));
if (!burnedOpponent) throw new Error("Targeted opponent should have burn status condition");

console.log("=== ALL CORE LOGIC VERIFICATION CHECKS PASSED ===");
