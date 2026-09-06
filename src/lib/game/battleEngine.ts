import { Card, BattleCard, BattleState, BattleLogEntry, LivePriceData, AssetSymbol, OpponentProfile } from "@/types";
import { BASE_CARD_CATALOG } from "@/lib/storage/mockCards";
import { applyLiveStatsToCard } from "@/lib/market/statModifier";
import { getBotOpponent } from "@/lib/game/matchmaking";

export function initializeBattleCard(card: Card, marketPrices?: Record<AssetSymbol, LivePriceData>): BattleCard {
  const liveCard = marketPrices ? applyLiveStatsToCard(card, marketPrices[card.assetSymbol]) : card;
  // Fast arcade blitz HP: 130 base + 0.45 * DEF (approx 170 - 215 HP per card for swift 3-5 round matches)
  const maxHp = 130 + Math.round(liveCard.baseDef * 0.45);

  return {
    ...liveCard,
    currentHp: maxHp,
    maxHp: maxHp,
    energy: 70, // Ready to unleash special elemental skills immediately on turn 1
    maxEnergy: 100,
    shield: 0,
    cooldownRemaining: 0,
    isDefending: false,
    statusEffects: []
  };
}

export function createInitialBattle(
  playerDeck: Card[],
  marketPrices: Record<AssetSymbol, LivePriceData>,
  customOpponentProfile?: OpponentProfile,
  customOpponentDeck?: Card[]
): BattleState {
  let oppProfile: OpponentProfile;
  let oppCards: Card[];

  if (customOpponentProfile && customOpponentDeck && customOpponentDeck.length > 0) {
    oppProfile = customOpponentProfile;
    oppCards = customOpponentDeck;
  } else {
    const defaultBot = getBotOpponent();
    oppProfile = defaultBot.profile;
    oppCards = defaultBot.deck;
  }

  const playerLineup = playerDeck.slice(0, 3).map((c) => initializeBattleCard(c, marketPrices));
  const opponentLineup = oppCards.slice(0, 3).map((c) =>
    initializeBattleCard(
      {
        ...c,
        owner: oppProfile.isBot ? `0xAI...${oppProfile.name.replace(/\s+/g, "")}` : c.owner
      },
      marketPrices
    )
  );

  const initialLog: BattleLogEntry = {
    id: `log-${Date.now()}-0`,
    round: 1,
    sender: "system",
    actorName: "MarketWars Referee",
    actionName: "Match Initiated",
    text: `Battle commenced vs ${oppProfile.name}! Live crypto price feeds are now driving in-match stats.`,
    timestamp: Date.now()
  };

  const initialLogs: BattleLogEntry[] = [initialLog];

  if (oppProfile.introQuote) {
    initialLogs.unshift({
      id: `log-${Date.now()}-intro`,
      round: 1,
      sender: "opponent",
      actorName: oppProfile.name,
      actionName: oppProfile.isBot ? "Bot Strategy Initialized" : "Challenger Signal",
      text: `"${oppProfile.introQuote}"`,
      timestamp: Date.now() + 1
    });
  }

  return {
    id: `battle-${Date.now()}`,
    opponentProfile: oppProfile,
    playerLineup,
    opponentLineup,
    activePlayerIndex: 0,
    activeOpponentIndex: 0,
    currentTurn: "player",
    round: 1,
    phase: "action",
    log: initialLogs
  };
}

export interface ActionResult {
  nextState: BattleState;
  logEntry: BattleLogEntry;
  isCrit: boolean;
  damageDealt: number;
  actionUsed?: "strike" | "skill";
  skillUsed?: string;
  statusInflicted?: string;
  turnSkipped?: boolean;
}

/**
 * Apply turn-start status effects (Burn, Poison, Freeze) on the incoming combatant
 */
export function applyTurnStartStatusEffects(
  lineup: BattleCard[],
  activeIdx: number,
  isPlayerTurn: boolean,
  currentRound: number
): {
  updatedLineup: BattleCard[];
  activeIdx: number;
  logs: BattleLogEntry[];
  turnSkipped: boolean;
  isGameOver: boolean;
  winner?: "player" | "opponent";
} {
  const updatedLineup = lineup.map((c) => ({
    ...c,
    statusEffects: [...(c.statusEffects || [])]
  }));

  const activeCard = { ...updatedLineup[activeIdx] };
  const logs: BattleLogEntry[] = [];
  let turnSkipped = false;
  let totalStatusDamage = 0;

  const nextStatusEffects: typeof activeCard.statusEffects = [];

  for (const effect of activeCard.statusEffects) {
    if (effect.type === "freeze") {
      turnSkipped = true;
      logs.push({
        id: `log-freeze-${Date.now()}-${Math.random()}`,
        round: currentRound,
        sender: "system",
        actorName: activeCard.name,
        actionName: "Frozen Solid",
        text: `❄️ ${activeCard.name} is FROZEN SOLID in cold storage! Turn skipped as frost thaws out!`,
        timestamp: Date.now()
      });
      if (effect.duration > 1) {
        nextStatusEffects.push({ ...effect, duration: effect.duration - 1 });
      }
    } else if (effect.type === "burn") {
      const burnDmg = effect.value || 40;
      totalStatusDamage += burnDmg;
      logs.push({
        id: `log-burn-${Date.now()}-${Math.random()}`,
        round: currentRound,
        sender: "system",
        actorName: activeCard.name,
        actionName: "Burn Damage",
        damage: burnDmg,
        text: `🔥 ${activeCard.name} suffered ${burnDmg} Burn damage from residual fire!`,
        timestamp: Date.now()
      });
      if (effect.duration > 1) {
        nextStatusEffects.push({ ...effect, duration: effect.duration - 1 });
      }
    } else if (effect.type === "poison") {
      const toxicDmg = effect.duration === 1 ? 60 : 35;
      totalStatusDamage += toxicDmg;
      logs.push({
        id: `log-poison-${Date.now()}-${Math.random()}`,
        round: currentRound,
        sender: "system",
        actorName: activeCard.name,
        actionName: "Poison Damage",
        damage: toxicDmg,
        text: `☠️ ${activeCard.name} suffered ${toxicDmg} Toxic damage from poison!`,
        timestamp: Date.now()
      });
      if (effect.duration > 1) {
        nextStatusEffects.push({ ...effect, duration: effect.duration - 1 });
      }
    } else if (effect.type === "shock") {
      if (effect.duration > 1) {
        nextStatusEffects.push({ ...effect, duration: effect.duration - 1 });
      }
    } else {
      if (effect.duration > 1) {
        nextStatusEffects.push({ ...effect, duration: effect.duration - 1 });
      }
    }
  }

  activeCard.statusEffects = nextStatusEffects;

  if (totalStatusDamage > 0) {
    activeCard.currentHp = Math.max(0, activeCard.currentHp - totalStatusDamage);
  }

  updatedLineup[activeIdx] = activeCard;

  let newActiveIdx = activeIdx;
  if (activeCard.currentHp <= 0) {
    const nextAlive = updatedLineup.findIndex((c) => c.currentHp > 0);
    if (nextAlive !== -1) {
      newActiveIdx = nextAlive;
    }
  }

  const allDead = updatedLineup.every((c) => c.currentHp <= 0);
  const isGameOver = allDead;
  const winner = allDead ? (isPlayerTurn ? "opponent" : "player") : undefined;

  return {
    updatedLineup,
    activeIdx: newActiveIdx,
    logs,
    turnSkipped,
    isGameOver,
    winner
  };
}

/**
 * Execute standard Market Strike with fast arcade damage scaling
 */
export function executeMarketStrike(
  state: BattleState,
  isPlayerTurn: boolean
): ActionResult {
  const currentLineup = isPlayerTurn ? state.playerLineup : state.opponentLineup;
  const enemyLineup = isPlayerTurn ? state.opponentLineup : state.playerLineup;
  const activeIdx = isPlayerTurn ? state.activePlayerIndex : state.activeOpponentIndex;
  const enemyIdx = isPlayerTurn ? state.activeOpponentIndex : state.activePlayerIndex;

  const attacker = { ...currentLineup[activeIdx], statusEffects: [...(currentLineup[activeIdx].statusEffects || [])] };
  const defender = { ...enemyLineup[enemyIdx], statusEffects: [...(enemyLineup[enemyIdx].statusEffects || [])] };

  // 1. Check if attacker is Paralyzed / Shocked
  const hasShock = attacker.statusEffects.some((s) => s.type === "shock");
  if (hasShock && Math.random() < 0.35) {
    const recoil = 25;
    attacker.currentHp = Math.max(0, attacker.currentHp - recoil);
    const updatedLineup = [...currentLineup];
    updatedLineup[activeIdx] = attacker;

    const logEntry: BattleLogEntry = {
      id: `log-shock-fail-${Date.now()}`,
      round: state.round,
      sender: isPlayerTurn ? "player" : "opponent",
      actorName: attacker.name,
      targetName: defender.name,
      actionName: "Paralysis Disruption",
      damage: recoil,
      text: `⚡ ${attacker.name} is PARALYZED! Voltage backfired for ${recoil} recoil damage and the Market Strike fizzled!`,
      timestamp: Date.now()
    };

    // Transition turn to other combatant
    const nextPlayerLineup = isPlayerTurn ? updatedLineup : enemyLineup;
    const nextOpponentLineup = isPlayerTurn ? enemyLineup : updatedLineup;
    const nextTurn = isPlayerTurn ? "opponent" : "player";

    return {
      nextState: {
        ...state,
        playerLineup: nextPlayerLineup,
        opponentLineup: nextOpponentLineup,
        currentTurn: nextTurn,
        round: state.round + (isPlayerTurn ? 0 : 1),
        phase: attacker.currentHp <= 0 ? (isPlayerTurn ? "game_over" : "action") : "action",
        winner: attacker.currentHp <= 0 && isPlayerTurn ? "opponent" : undefined,
        log: [logEntry, ...state.log]
      },
      logEntry,
      isCrit: false,
      damageDealt: 0,
      actionUsed: "strike",
      turnSkipped: false
    };
  }

  // 2. High-impact arcade damage calculation
  const isCrit = Math.random() < 0.22;
  const critMultiplier = isCrit ? 1.6 : 1.0;

  // Check burn on attacker
  const isBurned = attacker.statusEffects?.some((s) => s.type === "burn");
  const atkPenalty = isBurned ? 0.8 : 1.0;

  // Check poison on defender
  const isDefenderPoisoned = defender.statusEffects?.some((s) => s.type === "poison");
  const defPenalty = isDefenderPoisoned ? 0.8 : 1.0;

  const effectiveAtk = attacker.currentAtk * (attacker.statMultiplier || 1.0) * atkPenalty;
  const effectiveDef = defender.currentDef * (defender.statMultiplier || 1.0) * defPenalty;

  // Crisp, fast scaling: strikes hit hard (~135-200 dmg for swift match resolution)
  const baseStrike = Math.round(effectiveAtk * 1.45 - effectiveDef * 0.25);
  const rawDamage = Math.max(50, Math.round(baseStrike * critMultiplier));

  let finalDamage = rawDamage;

  // Shield absorption logic
  if (defender.shield > 0) {
    if (defender.shield >= finalDamage) {
      defender.shield -= finalDamage;
      finalDamage = 0;
    } else {
      finalDamage -= defender.shield;
      defender.shield = 0;
    }
  }

  // Deduct remaining HP
  defender.currentHp = Math.max(0, defender.currentHp - finalDamage);

  // Gain +35 MP per strike for swift skill accessibility
  attacker.energy = Math.min(attacker.maxEnergy, attacker.energy + 35);

  const strikeText = isCrit
    ? `💥 CRITICAL STRIKE! ${attacker.name} smashed ${defender.name} for ${finalDamage} damage!`
    : `⚔️ ${attacker.name} struck ${defender.name} for ${finalDamage} damage! (+35 MP)`;

  const logEntry: BattleLogEntry = {
    id: `log-${Date.now()}-${Math.random()}`,
    round: state.round,
    sender: isPlayerTurn ? "player" : "opponent",
    actorName: attacker.name,
    actionName: "Market Strike",
    damage: finalDamage,
    isCrit,
    text: strikeText,
    timestamp: Date.now()
  };

  const updatedCurrentLineup = [...currentLineup];
  updatedCurrentLineup[activeIdx] = attacker;

  const updatedEnemyLineup = [...enemyLineup];
  updatedEnemyLineup[enemyIdx] = defender;

  // Check faints & next alive index
  let newEnemyActiveIdx = enemyIdx;
  if (defender.currentHp <= 0) {
    const nextAlive = updatedEnemyLineup.findIndex((c) => c.currentHp > 0);
    newEnemyActiveIdx = nextAlive !== -1 ? nextAlive : enemyIdx;
  }

  const allEnemiesDefeated = updatedEnemyLineup.every((c) => c.currentHp <= 0);

  if (allEnemiesDefeated) {
    const nextPlayerLineup = isPlayerTurn ? updatedCurrentLineup : updatedEnemyLineup;
    const nextOpponentLineup = isPlayerTurn ? updatedEnemyLineup : updatedCurrentLineup;
    return {
      nextState: {
        ...state,
        playerLineup: nextPlayerLineup,
        opponentLineup: nextOpponentLineup,
        phase: "game_over",
        winner: isPlayerTurn ? "player" : "opponent",
        log: [logEntry, ...state.log]
      },
      logEntry,
      isCrit,
      damageDealt: finalDamage,
      actionUsed: "strike",
      turnSkipped: false
    };
  }

  // Transition turn cleanly to other combatant
  const nextPlayerLineup = isPlayerTurn ? updatedCurrentLineup : updatedEnemyLineup;
  const nextOpponentLineup = isPlayerTurn ? updatedEnemyLineup : updatedCurrentLineup;
  const nextPlayerActiveIdx = isPlayerTurn ? activeIdx : newEnemyActiveIdx;
  const nextOpponentActiveIdx = isPlayerTurn ? newEnemyActiveIdx : activeIdx;
  const nextTurn = isPlayerTurn ? "opponent" : "player";

  return {
    nextState: {
      ...state,
      playerLineup: nextPlayerLineup,
      opponentLineup: nextOpponentLineup,
      activePlayerIndex: nextPlayerActiveIdx,
      activeOpponentIndex: nextOpponentActiveIdx,
      currentTurn: nextTurn,
      round: isPlayerTurn ? state.round : state.round + 1,
      phase: "action",
      log: [logEntry, ...state.log]
    },
    logEntry,
    isCrit,
    damageDealt: finalDamage,
    actionUsed: "strike",
    turnSkipped: false
  };
}

/**
 * Execute Special Card Skill with Pokémon-Style Elemental Moves
 */
export function executeSpecialSkill(
  state: BattleState,
  isPlayerTurn: boolean
): ActionResult {
  const currentLineup = isPlayerTurn ? state.playerLineup : state.opponentLineup;
  const enemyLineup = isPlayerTurn ? state.opponentLineup : state.playerLineup;
  const activeIdx = isPlayerTurn ? state.activePlayerIndex : state.activeOpponentIndex;
  const enemyIdx = isPlayerTurn ? state.activeOpponentIndex : state.activePlayerIndex;

  const attacker = { ...currentLineup[activeIdx], statusEffects: [...(currentLineup[activeIdx].statusEffects || [])] };
  const defender = { ...enemyLineup[enemyIdx], statusEffects: [...(enemyLineup[enemyIdx].statusEffects || [])] };

  const skill = attacker.skill;
  attacker.energy = Math.max(0, attacker.energy - skill.manaCost);
  attacker.cooldownRemaining = skill.cooldownTurns;

  let damageDealt = 0;
  let healAmount = 0;
  let shieldAmount = 0;
  let isCrit = false;
  let text = "";

  // 1. ❄️ ICE / FREEZE
  if (skill.type === "freeze") {
    isCrit = Math.random() < 0.25;
    damageDealt = Math.round(attacker.currentAtk * 1.5 - defender.currentDef * 0.25);
    damageDealt = Math.max(50, damageDealt);

    if (defender.shield > 0) {
      if (defender.shield >= damageDealt) {
        defender.shield -= damageDealt;
        damageDealt = 0;
      } else {
        damageDealt -= defender.shield;
        defender.shield = 0;
      }
    }
    defender.currentHp = Math.max(0, defender.currentHp - damageDealt);
    defender.statusEffects = [
      ...defender.statusEffects.filter((s) => s.type !== "freeze"),
      { type: "freeze", duration: 1, value: 0, name: "Frozen" }
    ];
    text = `❄️ ${attacker.name} unleashed [${skill.name}]! ${defender.name} took ${damageDealt} Frost damage and was FROZEN SOLID in cold storage! (Next turn skipped)`;
  }
  // 2. 🔥 FIRE / BURN
  else if (skill.type === "burn") {
    isCrit = Math.random() < 0.35;
    damageDealt = Math.round(attacker.currentAtk * 1.7 - defender.currentDef * 0.2);
    damageDealt = Math.max(60, damageDealt);

    if (defender.shield > 0) {
      if (defender.shield >= damageDealt) {
        defender.shield -= damageDealt;
        damageDealt = 0;
      } else {
        damageDealt -= defender.shield;
        defender.shield = 0;
      }
    }
    defender.currentHp = Math.max(0, defender.currentHp - damageDealt);
    defender.statusEffects = [
      ...defender.statusEffects.filter((s) => s.type !== "burn"),
      { type: "burn", duration: 2, value: 40, name: "Burn" }
    ];
    text = `🔥 ${attacker.name} unleashed [${skill.name}]! ${defender.name} took ${damageDealt} Fire damage and was IGNITED IN FLAMES! (Takes 40 Burn DMG & -20% ATK)`;
  }
  // 3. ⚡ ELECTRIC / SHOCK
  else if (skill.type === "shock") {
    isCrit = Math.random() < 0.3;
    damageDealt = Math.round(attacker.currentAtk * 1.65 - defender.currentDef * 0.2);
    damageDealt = Math.max(55, damageDealt);

    if (defender.shield > 0) {
      if (defender.shield >= damageDealt) {
        defender.shield -= damageDealt;
        damageDealt = 0;
      } else {
        damageDealt -= defender.shield;
        defender.shield = 0;
      }
    }
    defender.currentHp = Math.max(0, defender.currentHp - damageDealt);
    defender.statusEffects = [
      ...defender.statusEffects.filter((s) => s.type !== "shock"),
      { type: "shock", duration: 2, value: 30, name: "Paralyzed" }
    ];
    text = `⚡ ${attacker.name} unleashed [${skill.name}]! ${defender.name} took ${damageDealt} Lightning damage and was PARALYZED! (-50% SPD, moves may fizzle)`;
  }
  // 4. ☠️ POISON / TOXIC
  else if (skill.type === "poison") {
    damageDealt = Math.round(attacker.currentAtk * 1.4 - defender.currentDef * 0.15);
    damageDealt = Math.max(45, damageDealt);

    if (defender.shield > 0) {
      if (defender.shield >= damageDealt) {
        defender.shield -= damageDealt;
        damageDealt = 0;
      } else {
        damageDealt -= defender.shield;
        defender.shield = 0;
      }
    }
    defender.currentHp = Math.max(0, defender.currentHp - damageDealt);
    defender.statusEffects = [
      ...defender.statusEffects.filter((s) => s.type !== "poison"),
      { type: "poison", duration: 2, value: 35, name: "Poisoned" }
    ];
    text = `☠️ ${attacker.name} released [${skill.name}]! ${defender.name} took ${damageDealt} Acid damage and was INFECTED WITH TOXIN! (Escalating damage & -20% DEF)`;
  }
  // 5. HEAVY ATTACK
  else if (skill.type === "attack") {
    isCrit = Math.random() < 0.35;
    const mult = (isCrit ? 2.3 : 1.8) * (attacker.statMultiplier || 1.0);
    const raw = Math.round(attacker.currentAtk * mult - defender.currentDef * 0.25);
    damageDealt = Math.max(65, raw);

    if (defender.shield > 0) {
      if (defender.shield >= damageDealt) {
        defender.shield -= damageDealt;
        damageDealt = 0;
      } else {
        damageDealt -= defender.shield;
        defender.shield = 0;
      }
    }
    defender.currentHp = Math.max(0, defender.currentHp - damageDealt);
    text = `💥 ${attacker.name} activated [${skill.name}], dealing massive ${damageDealt} damage to ${defender.name}!`;
  }
  // 6. SHIELD / REFLECT
  else if (skill.type === "shield") {
    shieldAmount = Math.round(attacker.currentDef * 1.4);
    healAmount = 50;
    attacker.shield += shieldAmount;
    attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + healAmount);
    text = `🛡️ ${attacker.name} activated [${skill.name}], deploying a +${shieldAmount} shield and healing +${healAmount} HP!`;
  }
  // 7. BUFF
  else if (skill.type === "buff") {
    attacker.currentAtk = Math.round(attacker.currentAtk * 1.4);
    attacker.currentSpd = Math.round(attacker.currentSpd * 1.3);
    text = `✨ ${attacker.name} unleashed [${skill.name}], surging ATK and SPD by +40%!`;
  }
  // 8. DRAIN / SIPHON
  else if (skill.type === "drain") {
    damageDealt = 75;
    healAmount = 50;
    defender.currentHp = Math.max(0, defender.currentHp - damageDealt);
    attacker.currentHp = Math.min(attacker.maxHp, attacker.currentHp + healAmount);
    const drainedEnergy = Math.min(defender.energy, 25);
    defender.energy -= drainedEnergy;
    attacker.energy = Math.min(attacker.maxEnergy, attacker.energy + drainedEnergy);
    text = `🩸 ${attacker.name} used [${skill.name}], siphoning ${damageDealt} HP and 25 Energy from ${defender.name}!`;
  }

  const updatedCurrentLineup = [...currentLineup];
  updatedCurrentLineup[activeIdx] = attacker;

  const updatedEnemyLineup = [...enemyLineup];
  updatedEnemyLineup[enemyIdx] = defender;

  let newEnemyActiveIdx = enemyIdx;
  if (defender.currentHp <= 0) {
    const nextAlive = updatedEnemyLineup.findIndex((c) => c.currentHp > 0);
    if (nextAlive !== -1) {
      newEnemyActiveIdx = nextAlive;
    }
  }

  const allEnemiesDefeated = updatedEnemyLineup.every((c) => c.currentHp <= 0);
  const logEntry: BattleLogEntry = {
    id: `log-${Date.now()}-${Math.random()}`,
    round: state.round,
    sender: isPlayerTurn ? "player" : "opponent",
    actorName: attacker.name,
    targetName: defender.name,
    actionName: skill.name,
    damage: damageDealt,
    heal: healAmount,
    shield: shieldAmount,
    isCrit,
    text,
    timestamp: Date.now()
  };

  let statusInflicted: string | undefined;
  if (skill.type === "freeze") statusInflicted = "❄️ Target FROZEN SOLID in cold storage!";
  else if (skill.type === "burn") statusInflicted = "🔥 Target IGNITED! Burn inflicted!";
  else if (skill.type === "shock") statusInflicted = "⚡ Target SHOCKED! Paralyzed for 2 turns!";
  else if (skill.type === "poison") statusInflicted = "☠️ Target POISONED! Toxic damage applied!";

  if (allEnemiesDefeated) {
    const nextPlayerLineup = isPlayerTurn ? updatedCurrentLineup : updatedEnemyLineup;
    const nextOpponentLineup = isPlayerTurn ? updatedEnemyLineup : updatedCurrentLineup;
    return {
      nextState: {
        ...state,
        playerLineup: nextPlayerLineup,
        opponentLineup: nextOpponentLineup,
        phase: "game_over",
        winner: isPlayerTurn ? "player" : "opponent",
        log: [logEntry, ...state.log]
      },
      logEntry,
      isCrit,
      damageDealt,
      actionUsed: "skill",
      skillUsed: skill.name,
      statusInflicted,
      turnSkipped: false
    };
  }

  // Turn transitions cleanly to the other combatant so status effects are experienced on their turn
  const nextPlayerLineup = isPlayerTurn ? updatedCurrentLineup : updatedEnemyLineup;
  const nextOpponentLineup = isPlayerTurn ? updatedEnemyLineup : updatedCurrentLineup;
  const nextPlayerActiveIdx = isPlayerTurn ? activeIdx : newEnemyActiveIdx;
  const nextOpponentActiveIdx = isPlayerTurn ? newEnemyActiveIdx : activeIdx;
  const nextTurn = isPlayerTurn ? "opponent" : "player";

  return {
    nextState: {
      ...state,
      playerLineup: nextPlayerLineup,
      opponentLineup: nextOpponentLineup,
      activePlayerIndex: nextPlayerActiveIdx,
      activeOpponentIndex: nextOpponentActiveIdx,
      currentTurn: nextTurn,
      round: isPlayerTurn ? state.round : state.round + 1,
      phase: "action",
      log: [logEntry, ...state.log]
    },
    logEntry,
    isCrit,
    damageDealt,
    actionUsed: "skill",
    skillUsed: skill.name,
    statusInflicted,
    turnSkipped: false
  };
}

/**
 * Intelligent AI Opponent Action
 */
export function computeAiMove(state: BattleState): ActionResult {
  let activeAiIdx = state.activeOpponentIndex;
  let activeAi = state.opponentLineup[activeAiIdx];

  // Defensive fallback: if active card is missing or dead, find first alive card
  if (!activeAi || activeAi.currentHp <= 0) {
    const aliveIdx = state.opponentLineup.findIndex((c) => c.currentHp > 0);
    if (aliveIdx !== -1) {
      activeAiIdx = aliveIdx;
      activeAi = state.opponentLineup[aliveIdx];
      state = { ...state, activeOpponentIndex: aliveIdx };
    }
  }

  if (!activeAi) {
    return executeMarketStrike(state, false);
  }

  // 1. Process Turn-Start Status Effects for AI (Burn, Poison, Freeze)
  const statusRes = applyTurnStartStatusEffects(
    state.opponentLineup,
    activeAiIdx,
    false,
    state.round
  );

  // If AI was frozen, its turn is skipped and frost thaws out!
  if (statusRes.turnSkipped) {
    const freezeLog = statusRes.logs.find((l) => l.actionName === "Frozen Solid") || statusRes.logs[0] || {
      id: `log-ai-freeze-${Date.now()}`,
      round: state.round,
      sender: "opponent",
      actorName: activeAi.name,
      actionName: "Frozen Solid",
      damage: 0,
      text: `❄️ ${activeAi.name} is FROZEN SOLID in cold storage! Turn skipped as frost thaws out!`,
      timestamp: Date.now()
    };

    return {
      nextState: {
        ...state,
        opponentLineup: statusRes.updatedLineup,
        activeOpponentIndex: statusRes.activeIdx,
        currentTurn: "player",
        round: state.round + 1,
        phase: statusRes.isGameOver ? "game_over" : "action",
        winner: statusRes.winner,
        log: [...statusRes.logs, ...state.log]
      },
      logEntry: freezeLog,
      isCrit: false,
      damageDealt: 0,
      actionUsed: "strike",
      statusInflicted: "❄️ OPPONENT WAS FROZEN! Turn skipped!",
      turnSkipped: true
    };
  }

  // If AI was defeated by status damage (e.g. burn / poison)
  if (statusRes.isGameOver) {
    return {
      nextState: {
        ...state,
        opponentLineup: statusRes.updatedLineup,
        activeOpponentIndex: statusRes.activeIdx,
        currentTurn: "player",
        phase: "game_over",
        winner: statusRes.winner || "player",
        log: [...statusRes.logs, ...state.log]
      },
      logEntry: statusRes.logs[0] || {
        id: `log-ai-faint-${Date.now()}`,
        round: state.round,
        sender: "opponent",
        actorName: activeAi.name,
        actionName: "Defeated by Status Damage",
        damage: 0,
        text: `💀 ${activeAi.name} collapsed from lingering status effects!`,
        timestamp: Date.now()
      },
      isCrit: false,
      damageDealt: 0,
      actionUsed: "strike",
      turnSkipped: false
    };
  }

  // AI is alive and active: continue turn with updated status lineup
  const stateAfterStatus: BattleState = {
    ...state,
    opponentLineup: statusRes.updatedLineup,
    activeOpponentIndex: statusRes.activeIdx,
    log: [...statusRes.logs, ...state.log]
  };

  const updatedAi = stateAfterStatus.opponentLineup[stateAfterStatus.activeOpponentIndex];
  if (!updatedAi) {
    return executeMarketStrike(stateAfterStatus, false);
  }

  // 2. Check player status
  const activePlayer = stateAfterStatus.playerLineup[stateAfterStatus.activePlayerIndex];
  const playerFrozen = activePlayer?.statusEffects?.some((s) => s.type === "freeze");
  const playerBurned = activePlayer?.statusEffects?.some((s) => s.type === "burn");

  // If AI has enough energy and skill is ready, use it!
  if (updatedAi.energy >= updatedAi.skill.manaCost && (updatedAi.cooldownRemaining || 0) <= 0) {
    // Intelligent priority: freeze if not frozen, burn if not burned
    if (updatedAi.skill.type === "freeze" && !playerFrozen) {
      return executeSpecialSkill(stateAfterStatus, false);
    }
    if (updatedAi.skill.type === "burn" && !playerBurned) {
      return executeSpecialSkill(stateAfterStatus, false);
    }
    return executeSpecialSkill(stateAfterStatus, false);
  }

  return executeMarketStrike(stateAfterStatus, false);
}

/**
 * Update active battle cards with latest real-time prices
 */
export function syncBattleWithLivePrices(
  state: BattleState,
  marketPrices: Record<AssetSymbol, LivePriceData>
): BattleState {
  let hasPricePulse = false;
  let pulseNotice = "";

  const updatedPlayer = state.playerLineup.map((c) => {
    const p = marketPrices[c.assetSymbol];
    const live = applyLiveStatsToCard(c, p);
    if (live.deltaPercent !== c.deltaPercent) {
      hasPricePulse = true;
      if (Math.abs(live.deltaPercent) > 2) {
        pulseNotice = `⚡ ${c.assetSymbol} ticked: now ${live.deltaPercent >= 0 ? "+" : ""}${live.deltaPercent}% ATK modifier!`;
      }
    }
    return {
      ...c,
      currentAtk: live.currentAtk,
      currentDef: live.currentDef,
      currentSpd: live.currentSpd,
      deltaPercent: live.deltaPercent,
      statMultiplier: live.statMultiplier,
      trend: live.trend
    };
  });

  const updatedOpponent = state.opponentLineup.map((c) => {
    const p = marketPrices[c.assetSymbol];
    const live = applyLiveStatsToCard(c, p);
    return {
      ...c,
      currentAtk: live.currentAtk,
      currentDef: live.currentDef,
      currentSpd: live.currentSpd,
      deltaPercent: live.deltaPercent,
      statMultiplier: live.statMultiplier,
      trend: live.trend
    };
  });

  const newLog = [...state.log];
  if (hasPricePulse && pulseNotice && state.phase !== "game_over") {
    newLog.unshift({
      id: `log-market-${Date.now()}`,
      round: state.round,
      sender: "market",
      actorName: "Pyth Oracle",
      actionName: "Price Tick",
      marketEventNotice: pulseNotice,
      text: pulseNotice,
      timestamp: Date.now()
    });
  }

  return {
    ...state,
    playerLineup: updatedPlayer,
    opponentLineup: updatedOpponent,
    log: newLog
  };
}
