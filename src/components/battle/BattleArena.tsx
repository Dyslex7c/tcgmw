"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { BattleState, BattleCard, Card, AssetSymbol, LivePriceData, OpponentProfile, StatusEffect, BattleLogEntry } from "@/types";
import {
  createInitialBattle,
  executeMarketStrike,
  executeSpecialSkill,
  computeAiMove,
  syncBattleWithLivePrices
} from "@/lib/game/battleEngine";
import { matchmaker, AI_BOT_ROSTER, getBotOpponent } from "@/lib/game/matchmaking";
import { userStore } from "@/lib/storage/userStore";
import { marketService } from "@/lib/market/priceFeed";
import { sound } from "@/lib/audio/soundEngine";

function getStatusAuraClass(statusEffects?: StatusEffect[]) {
  if (!statusEffects || statusEffects.length === 0) return "";
  if (statusEffects.some((e) => e.type === "freeze")) return "status-aura-freeze";
  if (statusEffects.some((e) => e.type === "burn")) return "status-aura-burn";
  if (statusEffects.some((e) => e.type === "shock")) return "status-aura-shock";
  if (statusEffects.some((e) => e.type === "poison")) return "status-aura-poison";
  return "";
}
import { CONTRACT_CONFIG, getExplorerAddressUrl } from "@/lib/constants/contracts";
import { CardComponent } from "@/components/cards/CardComponent";
import {
  Swords,
  Shield,
  Zap,
  RotateCcw,
  Sparkles,
  Trophy,
  Skull,
  TrendingUp,
  TrendingDown,
  Activity,
  ChevronRight,
  Gauge,
  Volume2,
  VolumeX,
  Flame,
  ExternalLink,
  Keyboard,
  Bot,
  Cpu,
  User,
  Radio,
  ArrowLeft,
  CheckCircle2,
  Target
} from "lucide-react";
import confetti from "canvas-confetti";

interface BattleArenaProps {
  onOpenSimulator?: () => void;
}

interface FloatingDamage {
  id: number;
  text: string;
  isCrit: boolean;
  isPlayerTarget: boolean;
}

interface HitEffect {
  target: "player" | "opponent";
  isCrit: boolean;
  key: number;
}

export function BattleArena({ onOpenSimulator }: BattleArenaProps) {
  const profile = userStore.getProfile();
  const [battleState, setBattleState] = useState<BattleState>(() => {
    const deck = profile.collection.filter((c) => profile.deckCardIds.includes(c.id));
    const fallbackDeck = deck.length >= 3 ? deck : profile.collection.slice(0, 3);
    return createInitialBattle(fallbackDeck, marketService.getPrices());
  });

  // Matchmaking State Machine
  const [matchPhase, setMatchPhase] = useState<"lobby" | "searching" | "found" | "battle">("lobby");
  const [searchStatus, setSearchStatus] = useState<{
    elapsedSeconds: number;
    message: string;
    peersScanned: number;
    stage: "scanning" | "pinging" | "expanding" | "fallback_bot" | "matched";
  }>({
    elapsedSeconds: 0,
    message: "Initializing mempool radar scanner...",
    peersScanned: 1,
    stage: "scanning"
  });
  const [foundOpponent, setFoundOpponent] = useState<OpponentProfile | null>(null);
  const [selectedBotId, setSelectedBotId] = useState<string>(AI_BOT_ROSTER[0].id);

  const [floatingDamage, setFloatingDamage] = useState<FloatingDamage[]>([]);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [battleSpeed, setBattleSpeed] = useState<1 | 2>(2);
  const [comboCount, setComboCount] = useState(0);
  const [combatBanner, setCombatBanner] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(sound.getMuted());

  // Combat animations & visual impact FX
  const [attacker, setAttacker] = useState<"none" | "player" | "opponent">("none");
  const [hitTarget, setHitTarget] = useState<"none" | "player" | "opponent">("none");
  const [screenShake, setScreenShake] = useState<"none" | "sm" | "crit">("none");
  const [hitEffect, setHitEffect] = useState<HitEffect | null>(null);
  const [skillWaveActive, setSkillWaveActive] = useState(false);
  const [hoveredAction, setHoveredAction] = useState<"strike" | "skill" | null>(null);
  const [projectileActive, setProjectileActive] = useState<"player" | "opponent" | null>(null);

  const logContainerRef = useRef<HTMLDivElement>(null);
  const aiProcessingRef = useRef(false);
  const battleStateRef = useRef(battleState);
  battleStateRef.current = battleState;

  // Sync battle cards continuously as live market prices tick
  useEffect(() => {
    const unsub = marketService.subscribe((prices) => {
      setBattleState((prev) => syncBattleWithLivePrices(prev, prices));
    });
    return () => unsub();
  }, []);

  // Auto-scroll combat log
  useEffect(() => {
    if (logContainerRef.current) {
      logContainerRef.current.scrollTop = 0;
    }
  }, [battleState.log]);

  // Floating damage numbers animation helper
  const triggerFloatingDamage = useCallback((text: string, isCrit: boolean, isPlayerTarget: boolean) => {
    const id = Date.now() + Math.random();
    setFloatingDamage((prev) => [...prev, { id, text, isCrit, isPlayerTarget }]);
    setTimeout(() => {
      setFloatingDamage((prev) => prev.filter((d) => d.id !== id));
    }, 1200);
  }, []);

  // Screen shake and slash VFX helper
  const triggerImpact = useCallback((target: "player" | "opponent", isCrit: boolean) => {
    setHitTarget(target);
    setScreenShake(isCrit ? "crit" : "sm");
    setHitEffect({ target, isCrit, key: Date.now() });

    setTimeout(() => {
      setHitTarget("none");
      setScreenShake("none");
    }, isCrit ? 400 : 250);

    setTimeout(() => {
      setHitEffect(null);
    }, 450);
  }, []);

  // Show banner alert temporarily
  const showBanner = useCallback((text: string) => {
    setCombatBanner(text);
    setTimeout(() => {
      setCombatBanner((prev) => (prev === text ? null : prev));
    }, 1200);
  }, []);

  // Handle AI turn resolution
  useEffect(() => {
    // If it's not the opponent's turn or not in action phase, reset thinking state
    if (battleState.currentTurn !== "opponent" || battleState.phase !== "action") {
      aiProcessingRef.current = false;
      setIsAiThinking(false);
      return;
    }

    // Prevent duplicate AI trigger if already processing
    if (aiProcessingRef.current) return;
    aiProcessingRef.current = true;
    setIsAiThinking(true);

    const aiDelay = battleSpeed === 2 ? 180 : 380;

    const timer = setTimeout(() => {
      const currentState = battleStateRef.current;
      if (currentState.currentTurn !== "opponent" || currentState.phase !== "action") {
        aiProcessingRef.current = false;
        setIsAiThinking(false);
        return;
      }

      const oppCard = currentState.opponentLineup[currentState.activeOpponentIndex];
      const isOpponentFrozen = oppCard?.statusEffects?.some((s) => s.type === "freeze");

      if (isOpponentFrozen) {
        sound.playFreeze();
        showBanner("❄️ OPPONENT IS FROZEN SOLID! Turn skipped!");
        const result = computeAiMove(currentState);

        setTimeout(() => {
          setAttacker("none");
          setProjectileActive(null);
          setBattleState(result.nextState);
          setIsAiThinking(false);
          aiProcessingRef.current = false;
        }, battleSpeed === 2 ? 160 : 280);
        return;
      }

      setAttacker("opponent");
      setProjectileActive("opponent");

      setTimeout(() => {
        setProjectileActive(null);
        const latestState = battleStateRef.current;
        const result = computeAiMove(latestState);
        const currentOppCard = latestState.opponentLineup[latestState.activeOpponentIndex];

        if (result.turnSkipped) {
          sound.playFreeze();
          showBanner("❄️ OPPONENT IS FROZEN SOLID! Turn skipped!");
          setAttacker("none");
          setBattleState(result.nextState);
          setIsAiThinking(false);
          aiProcessingRef.current = false;
          return;
        }

        if (result.actionUsed === "skill") {
          const skillType = currentOppCard?.skill?.type;
          if (skillType === "freeze") sound.playFreeze();
          else if (skillType === "burn") sound.playBurn();
          else if (skillType === "shock") sound.playShock();
          else if (skillType === "poison") sound.playPoison();
          else sound.playSpecialSkill();
        } else {
          if (result.isCrit) {
            sound.playCriticalSlash();
          } else {
            sound.playAttackHit(false);
          }
        }

        triggerImpact("player", result.isCrit);

        if (result.damageDealt > 0) {
          triggerFloatingDamage(`-${result.damageDealt}`, result.isCrit, true);
          if (result.isCrit) {
            showBanner(`💥 OPPONENT CRIT! -${result.damageDealt} DMG`);
          }
        }

        if (result.statusInflicted) {
          showBanner(result.statusInflicted);
        }

        setTimeout(() => {
          setAttacker("none");
          setBattleState(result.nextState);
          setIsAiThinking(false);
          aiProcessingRef.current = false;

          if (result.nextState.phase === "game_over" && result.nextState.winner === "opponent") {
            sound.playDefeat();
            userStore.recordMatchResult(false);
          }
        }, battleSpeed === 2 ? 120 : 180);
      }, battleSpeed === 2 ? 90 : 140);
    }, aiDelay);

    return () => {
      clearTimeout(timer);
    };
  }, [battleState.currentTurn, battleState.phase, battleSpeed, triggerImpact, triggerFloatingDamage, showBanner]);

  // Handle Player turn resolution when frozen solid
  useEffect(() => {
    if (battleState.currentTurn !== "player" || battleState.phase !== "action") return;

    const activeCard = battleState.playerLineup[battleState.activePlayerIndex];
    const isFrozen = activeCard?.statusEffects?.some((s) => s.type === "freeze");
    if (!isFrozen) return;

    sound.playFreeze();
    showBanner("❄️ YOU ARE FROZEN SOLID! Turn skipped!");

    const timer = setTimeout(() => {
      const currentState = battleStateRef.current;
      if (currentState.currentTurn !== "player" || currentState.phase !== "action") return;

      const playerCard = currentState.playerLineup[currentState.activePlayerIndex];
      if (!playerCard) return;

      const thawed = (playerCard.statusEffects || []).filter((s) => s.type !== "freeze");
      const updatedPlayer = { ...playerCard, statusEffects: thawed };
      const updatedLineup = [...currentState.playerLineup];
      updatedLineup[currentState.activePlayerIndex] = updatedPlayer;

      const logEntry: BattleLogEntry = {
        id: `log-player-freeze-${Date.now()}`,
        round: currentState.round,
        sender: "player",
        actorName: playerCard.name,
        actionName: "Frozen Solid",
        damage: 0,
        text: `❄️ ${playerCard.name} is FROZEN SOLID in cold storage! Turn skipped as frost thaws out!`,
        timestamp: Date.now()
      };

      setBattleState({
        ...currentState,
        playerLineup: updatedLineup,
        currentTurn: "opponent",
        log: [logEntry, ...currentState.log]
      });
    }, battleSpeed === 2 ? 450 : 700);

    return () => clearTimeout(timer);
  }, [battleState.currentTurn, battleState.phase, battleState.activePlayerIndex, battleSpeed, showBanner]);

  // Player action: Market Strike
  const handlePlayerStrike = useCallback(() => {
    const currentState = battleStateRef.current;
    if (currentState.currentTurn !== "player" || currentState.phase !== "action" || isAiThinking || attacker !== "none") return;

    const activePlayerCard = currentState.playerLineup[currentState.activePlayerIndex];
    if (activePlayerCard?.statusEffects?.some((s) => s.type === "freeze")) {
      showBanner("❄️ You are frozen solid in cold storage!");
      return;
    }

    sound.playClick();
    setAttacker("player");
    setProjectileActive("player");

    setTimeout(() => {
      setProjectileActive(null);
      const result = executeMarketStrike(battleStateRef.current, true);

      if (result.isCrit) {
        sound.playCriticalSlash();
        showBanner(`🔥 CRITICAL STRIKE! -${result.damageDealt} DMG`);
        setComboCount((c) => c + 1);
      } else {
        sound.playAttackHit(false);
        setComboCount((c) => c + 1);
      }

      triggerImpact("opponent", result.isCrit);

      if (result.damageDealt > 0) {
        triggerFloatingDamage(`-${result.damageDealt}`, result.isCrit, false);
      }

      if (result.statusInflicted) {
        showBanner(result.statusInflicted);
      }

      setTimeout(() => {
        setAttacker("none");
        setBattleState(result.nextState);

        if (result.turnSkipped) {
          showBanner("❄️ FROZEN SOLID! Turn skipped!");
        }

        if (result.nextState.phase === "game_over" && result.nextState.winner === "player") {
          sound.playVictory();
          confetti({ particleCount: 120, spread: 80, origin: { y: 0.5 } });
          userStore.recordMatchResult(true);
        }
      }, battleSpeed === 2 ? 120 : 180);
    }, battleSpeed === 2 ? 90 : 140);
  }, [isAiThinking, attacker, battleSpeed, triggerImpact, triggerFloatingDamage, showBanner]);

  // Player action: Activate Special Skill
  const handlePlayerSkill = useCallback(() => {
    const currentState = battleStateRef.current;
    if (currentState.currentTurn !== "player" || currentState.phase !== "action" || isAiThinking || attacker !== "none") return;

    const activePlayerCard = currentState.playerLineup[currentState.activePlayerIndex];
    if (activePlayerCard?.statusEffects?.some((s) => s.type === "freeze")) {
      showBanner("❄️ You are frozen solid in cold storage!");
      return;
    }

    if (activePlayerCard.energy < activePlayerCard.skill.manaCost) {
      showBanner("⚠️ Not enough Energy for Special Skill!");
      return;
    }

    const skill = activePlayerCard.skill;
    if (skill.type === "freeze") {
      sound.playFreeze();
      showBanner(`❄️ ${skill.name.toUpperCase()}! FREEZING TARGET!`);
    } else if (skill.type === "burn") {
      sound.playBurn();
      showBanner(`🔥 ${skill.name.toUpperCase()}! TARGET ABLAZE!`);
    } else if (skill.type === "shock") {
      sound.playShock();
      showBanner(`⚡ ${skill.name.toUpperCase()}! DISCHARGING SHOCK!`);
    } else if (skill.type === "poison") {
      sound.playPoison();
      showBanner(`☠️ ${skill.name.toUpperCase()}! TOXIC POISON INJECTED!`);
    } else {
      sound.playSpecialSkill();
      showBanner(`🌟 ${skill.name.toUpperCase()} ACTIVATED!`);
    }

    setSkillWaveActive(true);
    setAttacker("player");
    setProjectileActive("player");

    setTimeout(() => {
      setProjectileActive(null);
      setSkillWaveActive(false);
      const result = executeSpecialSkill(battleStateRef.current, true);

      if (result.damageDealt > 0) {
        sound.playAttackHit(result.isCrit);
        triggerImpact("opponent", result.isCrit);
        triggerFloatingDamage(`-${result.damageDealt}`, result.isCrit, false);
      } else {
        sound.playShield();
        showBanner("🛡️ SHIELD DEPLOYED!");
      }

      if (result.statusInflicted) {
        showBanner(result.statusInflicted);
      }

      setTimeout(() => {
        setAttacker("none");
        setBattleState(result.nextState);

        if (result.turnSkipped) {
          showBanner("❄️ FROZEN SOLID! Turn skipped!");
        }

        if (result.nextState.phase === "game_over" && result.nextState.winner === "player") {
          sound.playVictory();
          confetti({ particleCount: 150, spread: 100, origin: { y: 0.5 } });
          userStore.recordMatchResult(true);
        }
      }, battleSpeed === 2 ? 120 : 180);
    }, battleSpeed === 2 ? 120 : 180);
  }, [isAiThinking, attacker, battleSpeed, showBanner, triggerImpact, triggerFloatingDamage]);

  // Switch Active Card
  const handleSwitchCard = useCallback((index: number) => {
    const currentState = battleStateRef.current;
    if (currentState.currentTurn !== "player" || currentState.phase !== "action" || isAiThinking || attacker !== "none") return;
    if (currentState.playerLineup[index].currentHp <= 0) return;

    const activePlayerCard = currentState.playerLineup[currentState.activePlayerIndex];
    if (activePlayerCard?.statusEffects?.some((s) => s.type === "freeze")) {
      showBanner("❄️ You are frozen solid in cold storage!");
      return;
    }

    sound.playCardFlip();
    setBattleState((prev) => ({
      ...prev,
      activePlayerIndex: index
    }));
  }, [isAiThinking, attacker, showBanner]);

  // Matchmaking action handlers
  const startSearch = useCallback(() => {
    sound.playClick();
    setMatchPhase("searching");

    const deck = profile.collection.filter((c) => profile.deckCardIds.includes(c.id));
    const playerDeck = deck.length >= 3 ? deck : profile.collection.slice(0, 3);

    matchmaker.searchMatch(
      { name: profile.address, mmr: profile.ratingMMR },
      playerDeck,
      (status) => {
        setSearchStatus(status);
      },
      (result) => {
        aiProcessingRef.current = false;
        setIsAiThinking(false);
        setAttacker("none");
        setProjectileActive(null);
        setFoundOpponent(result.opponentProfile);
        setBattleState(
          createInitialBattle(
            playerDeck,
            marketService.getPrices(),
            result.opponentProfile,
            result.opponentDeck
          )
        );
        setMatchPhase("found");
        sound.playVictory();

        setTimeout(() => {
          setMatchPhase("battle");
          setComboCount(0);
          setCombatBanner(
            result.matchedAsBot
              ? `🤖 AI Bot Engaged: ${result.opponentProfile.name}`
              : `⚔️ Live Peer Connected: ${result.opponentProfile.name}`
          );
        }, 1800);
      }
    );
  }, [profile]);

  const cancelSearch = useCallback(() => {
    sound.playClick();
    matchmaker.cancelSearch();
    setMatchPhase("lobby");
  }, []);

  const startInstantBot = useCallback(
    (botId?: string) => {
      sound.playClick();
      aiProcessingRef.current = false;
      setIsAiThinking(false);
      setAttacker("none");
      setProjectileActive(null);
      const deck = profile.collection.filter((c) => profile.deckCardIds.includes(c.id));
      const playerDeck = deck.length >= 3 ? deck : profile.collection.slice(0, 3);

      const result = matchmaker.instantBotMatch(botId || selectedBotId);
      setFoundOpponent(result.opponentProfile);
      setBattleState(
        createInitialBattle(
          playerDeck,
          marketService.getPrices(),
          result.opponentProfile,
          result.opponentDeck
        )
      );
      setMatchPhase("found");
      sound.playCardFlip();

      setTimeout(() => {
        setMatchPhase("battle");
        setComboCount(0);
        setCombatBanner(`🤖 AI Bot Engaged: ${result.opponentProfile.name}`);
      }, 1200);
    },
    [profile, selectedBotId]
  );

  const handleReturnToLobby = useCallback(() => {
    sound.playClick();
    matchmaker.cancelSearch();
    aiProcessingRef.current = false;
    setIsAiThinking(false);
    setAttacker("none");
    setProjectileActive(null);
    setMatchPhase("lobby");
  }, []);

  // Restart match with same opponent
  const handleRestart = useCallback(() => {
    sound.playClick();
    aiProcessingRef.current = false;
    setIsAiThinking(false);
    setAttacker("none");
    setProjectileActive(null);
    const deck = profile.collection.filter((c) => profile.deckCardIds.includes(c.id));
    const fallbackDeck = deck.length >= 3 ? deck : profile.collection.slice(0, 3);
    const opp = battleState.opponentProfile;
    const oppDeck = opp.isBot ? getBotOpponent(opp.id).deck : battleState.opponentLineup;
    setBattleState(createInitialBattle(fallbackDeck, marketService.getPrices(), opp, oppDeck));
    setComboCount(0);
    setCombatBanner(null);
  }, [profile, battleState.opponentProfile, battleState.opponentLineup]);

  useEffect(() => {
    return () => {
      matchmaker.cancelSearch();
    };
  }, []);

  // Keyboard hotkey support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName)) return;

      if (matchPhase !== "battle") {
        if (e.key === "Enter" && matchPhase === "lobby") {
          startSearch();
        } else if (e.key === "Escape" && matchPhase === "searching") {
          cancelSearch();
        }
        return;
      }

      if (e.key === "1") {
        handlePlayerStrike();
      } else if (e.key === "2") {
        handlePlayerSkill();
      } else if (e.key === "q" || e.key === "Q") {
        handleSwitchCard(0);
      } else if (e.key === "w" || e.key === "W") {
        handleSwitchCard(1);
      } else if (e.key === "e" || e.key === "E") {
        handleSwitchCard(2);
      } else if (e.key === "s" || e.key === "S") {
        if (onOpenSimulator) onOpenSimulator();
      } else if (e.key === "r" || e.key === "R") {
        handleRestart();
      } else if (e.key === "t" || e.key === "T") {
        setBattleSpeed((s) => (s === 1 ? 2 : 1));
        sound.playClick();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    matchPhase,
    startSearch,
    cancelSearch,
    handlePlayerStrike,
    handlePlayerSkill,
    handleSwitchCard,
    onOpenSimulator,
    handleRestart
  ]);

  const activePlayerCard = battleState.playerLineup[battleState.activePlayerIndex];
  const activeOpponentCard = battleState.opponentLineup[battleState.activeOpponentIndex];
  const isSkillReady = activePlayerCard && activePlayerCard.energy >= activePlayerCard.skill.manaCost;
  const skillElement = activePlayerCard ? (activePlayerCard.skill.element || 
    (activePlayerCard.skill.type === "freeze" ? "ice" :
     activePlayerCard.skill.type === "burn" ? "fire" :
     activePlayerCard.skill.type === "shock" ? "electric" :
     activePlayerCard.skill.type === "poison" ? "poison" : "neutral")) : "neutral";

  const elementIcon = 
    skillElement === "ice" ? "❄️" :
    skillElement === "fire" ? "🔥" :
    skillElement === "electric" ? "⚡" :
    skillElement === "poison" ? "☠️" : "✨";

  const estStrikeDamage = activePlayerCard && activeOpponentCard
    ? Math.max(35, Math.round(activePlayerCard.currentAtk * 1.35 - activeOpponentCard.currentDef * 0.35))
    : 0;

  return (
    <div
      className={`w-full max-w-[1600px] mx-auto flex flex-col transition-transform duration-75 ${
        matchPhase === "battle"
          ? "h-full flex-1 overflow-hidden min-h-0 justify-between gap-2"
          : "space-y-6"
      } ${
        screenShake === "crit" ? "shake-screen-crit" : screenShake === "sm" ? "shake-screen-sm" : ""
      }`}
    >
      {/* 1. LOBBY VIEW */}
      {matchPhase === "lobby" && (
        <div className="space-y-8 animate-in fade-in duration-300">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#0A0F19] p-6 rounded-2xl border border-slate-800 shadow-[0_0_30px_rgba(0,0,0,0.6)]">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 via-red-600 to-rose-700 p-[1px] flex items-center justify-center shadow-[0_0_20px_rgba(234,88,12,0.4)]">
                <div className="w-full h-full bg-[#0B0F18] rounded-xl flex items-center justify-center">
                  <Swords className="w-6 h-6 text-orange-400" />
                </div>
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-silkscreen font-bold text-slate-100 uppercase tracking-wide">
                    Matchmaking War Room
                  </h1>
                  <span className="text-xs font-chakra font-bold text-emerald-400 px-2.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/40 flex items-center space-x-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>ORACLES ONLINE</span>
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-hanken">
                  Deploy your deck into live high-volatility combat. Match with live traders or challenge autonomous trading bots.
                </p>
              </div>
            </div>

            {/* Player Stats Pills & Sound Toggle */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-3 bg-[#060912] p-2.5 rounded-xl border border-slate-800 text-xs font-mono">
                <div className="text-right pr-3 border-r border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">AVOX Vault</div>
                  <div className="font-bold text-orange-400 flex items-center justify-end space-x-1">
                    <Image src="/logo.png" alt="AVOX" width={13} height={13} className="w-3.5 h-3.5 object-contain" />
                    <span>{profile.avoxBalance ?? 100} AVOX</span>
                  </div>
                </div>
                <div className="text-right pr-3 border-r border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Rating</div>
                  <div className="font-bold text-slate-200">{profile.ratingMMR} MMR</div>
                </div>
                <div className="text-right pr-3 border-r border-slate-800">
                  <div className="text-[10px] text-slate-500 uppercase">Rank</div>
                  <div className="font-bold text-slate-300">{profile.rankTier}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 uppercase">Record</div>
                  <div className="font-bold text-slate-300">{profile.wins}W / {profile.losses}L</div>
                </div>
              </div>

              <button
                onClick={() => {
                  const next = sound.toggleMute();
                  setIsMuted(next);
                }}
                className="p-2.5 rounded-xl bg-[#0F1420] border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                title={isMuted ? "Unmute Sound" : "Mute Sound"}
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4 text-orange-400" />}
              </button>
            </div>
          </div>

          {/* Mode Select Dual Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* CARD 1: P2P Live Matchmaking */}
            <div className="p-6 sm:p-7 rounded-2xl bg-[#0B0F19] border border-slate-800 hover:border-orange-500/50 transition-all flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center space-x-2 text-xs font-chakra font-bold text-orange-400 uppercase tracking-wider px-2.5 py-1 rounded bg-orange-950/40 border border-orange-500/30">
                    <Radio className="w-3.5 h-3.5 text-orange-400" />
                    <span>PROTOCOL: RANKED QUEUE</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    5s Auto-Bot Fallback
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-silkscreen font-bold text-slate-100 uppercase tracking-wide">
                  Find Live Trader
                </h2>
                <p className="text-xs text-slate-400 font-hanken leading-relaxed">
                  Broadcast your challenge across on-chain peer channels. If no human trader accepts within 5 seconds, an adaptive market AI bot seamlessly connects so you never wait.
                </p>

                <div className="p-3.5 rounded-xl bg-[#070A12] border border-slate-800/80 text-xs font-mono space-y-1.5 text-slate-400">
                  <div className="flex items-center justify-between">
                    <span>• Matchmaking Window:</span>
                    <span className="text-slate-300">5.5s timeout</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>• Multi-Tab P2P Discovery:</span>
                    <span className="text-slate-300 font-semibold">READY</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>• Fallback Opponents:</span>
                    <span className="text-orange-400 font-semibold">5 High-IQ Trading Bots</span>
                  </div>
                </div>
              </div>

              <button
                onClick={startSearch}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500 text-white font-chakra font-bold text-sm uppercase tracking-wider shadow-[0_0_20px_rgba(234,88,12,0.3)] border border-orange-500/40 transition-all flex items-center justify-center space-x-2"
              >
                <Radio className="w-4 h-4" />
                <span>Enter Matchmaking Radar</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>

            {/* CARD 2: Instant Bot Combat */}
            <div className="p-6 sm:p-7 rounded-2xl bg-[#0B0F19] border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between space-y-5">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center space-x-2 text-xs font-chakra font-bold text-slate-300 uppercase tracking-wider px-2.5 py-1 rounded bg-slate-900 border border-slate-700">
                    <Bot className="w-3.5 h-3.5 text-slate-400" />
                    <span>PROTOCOL: DIRECT TRAINING</span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                    Zero Wait Time
                  </span>
                </div>

                <h2 className="text-xl sm:text-2xl font-silkscreen font-bold text-slate-100 uppercase tracking-wide">
                  Battle Market AI Bot
                </h2>
                <p className="text-xs text-slate-400 font-hanken leading-relaxed">
                  Select your automated adversary. 5 specialized algorithmic bots running distinct crypto deck archetypes, from high-volatility meme strikes to ironclad institutional defense.
                </p>

                {/* Bot Selector Pills */}
                <div className="space-y-2 pt-1">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">Select Target Algorithm:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {AI_BOT_ROSTER.map((bot) => (
                      <button
                        key={bot.id}
                        onClick={() => {
                          sound.playClick();
                          setSelectedBotId(bot.id);
                        }}
                        className={`p-2.5 rounded-xl border text-left transition-all flex items-center space-x-2.5 ${
                          selectedBotId === bot.id
                            ? "bg-[#131B2B] border-slate-600 shadow-[0_0_10px_rgba(0,0,0,0.5)] ring-1 ring-slate-500"
                            : "bg-[#080C16] border-slate-800/90 hover:border-slate-700 text-slate-400"
                        }`}
                      >
                        <span className="text-xl">{bot.avatar}</span>
                        <div className="truncate">
                          <div className="text-xs font-chakra font-bold text-slate-200 truncate">
                            {bot.name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-400 truncate">
                            MMR {bot.mmr} • {bot.archetype}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                onClick={() => startInstantBot(selectedBotId)}
                className="w-full py-3.5 rounded-xl bg-[#141C2B] hover:bg-[#1A2438] border border-slate-700 text-slate-200 font-chakra font-bold text-sm uppercase tracking-wider transition-all flex items-center justify-center space-x-2"
              >
                <Bot className="w-4 h-4 text-slate-400" />
                <span>Launch Instant Bot Match</span>
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>

          {/* Active Deck Section Preview */}
          <div className="p-6 rounded-2xl bg-[#090D18] border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-chakra font-bold text-orange-400 uppercase tracking-wider">
                <Shield className="w-4 h-4" />
                <span>YOUR ACTIVE BATTLE SQUAD (3 CARDS)</span>
              </div>
              <span className="text-xs text-slate-400 font-mono">
                Live Pyth prices actively scale cards in combat
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {battleState.playerLineup.slice(0, 3).map((card, idx) => (
                <div
                  key={card.id || idx}
                  className="p-3.5 rounded-xl bg-[#050811] border border-slate-800 flex items-center space-x-3"
                >
                  <div className="w-12 h-14 rounded-lg bg-slate-900 border border-slate-700 flex flex-col items-center justify-center shrink-0">
                    <span className="text-xs font-bold font-mono text-orange-400">{card.assetSymbol}</span>
                    <span className="text-[9px] text-slate-500">#{idx + 1}</span>
                  </div>
                  <div className="truncate flex-1">
                    <div className="text-xs font-chakra font-bold text-slate-200 truncate">{card.name}</div>
                    <div className="text-[10px] text-slate-400 font-hanken truncate">{card.skill.name}</div>
                    <div className="flex items-center space-x-2 text-[10px] font-mono text-slate-400 mt-1">
                      <span className="text-rose-400">ATK {card.currentAtk}</span>
                      <span className="text-blue-400">DEF {card.currentDef}</span>
                      <span className="text-amber-400">SPD {card.currentSpd}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 2. SEARCHING RADAR VIEW */}
      {matchPhase === "searching" && (
        <div className="w-full max-w-2xl mx-auto py-8 space-y-8 animate-in zoom-in-95 duration-200">
          <div className="p-8 rounded-3xl bg-[#080C16]/95 border border-slate-800 shadow-[0_0_30px_rgba(0,0,0,0.8)] text-center space-y-6 relative overflow-hidden backdrop-blur-xl">
            {/* Corner Accents */}
            <div className="absolute top-0 left-0 w-6 h-6 border-t border-l border-slate-600" />
            <div className="absolute top-0 right-0 w-6 h-6 border-t border-r border-slate-600" />
            <div className="absolute bottom-0 left-0 w-6 h-6 border-b border-l border-slate-600" />
            <div className="absolute bottom-0 right-0 w-6 h-6 border-b border-r border-slate-600" />

            {/* Radar Circle */}
            <div className="relative w-52 h-52 mx-auto flex items-center justify-center my-4">
              {/* Outer Ring */}
              <div className="absolute inset-0 rounded-full border border-slate-800 bg-[#04060C]" />
              {/* Middle Ring */}
              <div className="absolute inset-6 rounded-full border border-slate-800/70" />
              {/* Inner Ring */}
              <div className="absolute inset-16 rounded-full border border-slate-800/50" />
              {/* Crosshair Horizontal */}
              <div className="absolute w-full h-[1px] bg-slate-800" />
              {/* Crosshair Vertical */}
              <div className="absolute h-full w-[1px] bg-slate-800" />

              {/* Sonar Ping Waves */}
              <div className="absolute w-32 h-32 rounded-full border border-orange-500/30 bg-orange-500/5 animate-radar-sonar pointer-events-none" />

              {/* Rotating Radar Sweep */}
              <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none animate-radar-sweep">
                <div className="w-1/2 h-1/2 bg-gradient-to-br from-orange-500/20 via-orange-500/5 to-transparent transform origin-bottom-right" />
              </div>

              {/* Center Beacon */}
              <div className="relative z-10 w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_10px_rgba(234,88,12,0.8)] animate-ping" />
              <div className="absolute z-10 w-2.5 h-2.5 rounded-full bg-slate-100" />
            </div>

            {/* Radar Telemetry & Status Text */}
            <div className="space-y-2">
              <div className="inline-flex items-center space-x-2 text-xs font-chakra font-bold text-orange-400 uppercase tracking-widest px-3 py-1 rounded-full bg-orange-950/40 border border-orange-500/30">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                <span>SEARCHING MEMPOOL: 00:0{searchStatus.elapsedSeconds}s</span>
              </div>

              <h2 className="text-2xl sm:text-3xl font-silkscreen font-bold text-slate-100 uppercase tracking-wide">
                Scanning for Challenger
              </h2>

              <p className="text-xs sm:text-sm text-slate-400 font-mono">
                {searchStatus.message}
              </p>
            </div>

            {/* Telemetry Status Bar */}
            <div className="bg-[#05070D] p-3 rounded-xl border border-slate-800/80 text-[11px] font-mono flex items-center justify-between text-slate-400 max-w-md mx-auto">
              <span>Peers Scanned: <strong className="text-slate-200">{searchStatus.peersScanned}</strong></span>
              <span>•</span>
              <span>Protocol: <strong className="text-slate-300">P2P Mesh + AI Fallback</strong></span>
            </div>

            {/* Instant Bot Bypass & Cancel Buttons */}
            <div className="space-y-3 pt-2 max-w-md mx-auto">
              <button
                onClick={() => startInstantBot()}
                className="w-full py-3.5 rounded-xl bg-[#141C2B] hover:bg-[#1A2438] text-slate-200 font-chakra font-bold text-xs uppercase tracking-wider border border-slate-700 transition-all flex items-center justify-center space-x-2"
              >
                <Zap className="w-4 h-4 text-orange-400" />
                <span>Skip Wait: Fight AI Bot Immediately</span>
              </button>

              <button
                onClick={cancelSearch}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-400 hover:text-slate-200 transition-colors"
              >
                Cancel Matchmaking Search
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MATCH SECURED ANNOUNCEMENT CARD */}
      {matchPhase === "found" && foundOpponent && (
        <div className="w-full max-w-2xl mx-auto py-10 space-y-6 animate-in zoom-in-95 duration-200">
          <div className="p-8 rounded-3xl bg-[#090E1A] border-2 border-emerald-500/60 shadow-[0_0_50px_rgba(16,185,129,0.3)] text-center space-y-6">
            <div className="inline-flex items-center space-x-2 text-xs font-chakra font-extrabold text-emerald-400 uppercase tracking-widest px-3.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.4)]">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>MATCH SECURED // COMMENCING IN 2s</span>
            </div>

            {/* VS SPLIT SCREEN */}
            <div className="grid grid-cols-11 items-center gap-2 py-4">
              {/* Left: Player */}
              <div className="col-span-5 p-4 rounded-2xl bg-[#060912] border border-slate-800 space-y-2">
                <div className="text-3xl">⚔️</div>
                <div className="text-sm font-chakra font-bold text-slate-100 uppercase truncate">
                  {profile.address}
                </div>
                <div className="text-xs font-mono text-cyan-400">
                  {profile.ratingMMR} MMR
                </div>
                <div className="text-[10px] font-chakra font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                  YOU
                </div>
              </div>

              {/* Center: VS Emblem */}
              <div className="col-span-1 flex items-center justify-center">
                <span className="text-2xl sm:text-3xl font-silkscreen font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-rose-500 animate-pulse">
                  VS
                </span>
              </div>

              {/* Right: Opponent */}
              <div className="col-span-5 p-4 rounded-2xl bg-[#060912] border border-rose-950/80 space-y-2">
                <div className="text-3xl">{foundOpponent.avatar}</div>
                <div className="text-sm font-chakra font-bold text-slate-100 uppercase truncate">
                  {foundOpponent.name}
                </div>
                <div className="text-xs font-mono text-rose-400">
                  {foundOpponent.mmr} MMR
                </div>
                <div className="text-[10px] font-chakra font-bold text-rose-400 bg-rose-950/60 border border-rose-500/30 px-2 py-0.5 rounded truncate">
                  {foundOpponent.isBot ? `AI BOT // ${foundOpponent.botArchetype}` : "LIVE P2P TRADER"}
                </div>
              </div>
            </div>

            {/* Intro Quote */}
            {foundOpponent.introQuote && (
              <div className="p-3.5 rounded-xl bg-[#05070D] border border-slate-800 text-xs font-mono text-slate-300 italic max-w-md mx-auto">
                &ldquo;{foundOpponent.introQuote}&rdquo;
              </div>
            )}

            {/* Loading countdown bar */}
            <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full w-full animate-pulse" />
            </div>
          </div>
        </div>
      )}

      {/* 4. ACTIVE BATTLE ARENA */}
      {matchPhase === "battle" && (
        <div className="flex-1 flex flex-col justify-between overflow-hidden min-h-0 gap-2 animate-in fade-in duration-200">
          {/* Top Banner: Arena Match Header, Speed Toggle & Controls */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 bg-[#0A0F19] px-3 py-1.5 rounded-xl border border-slate-800 shadow-[0_0_20px_rgba(0,0,0,0.5)] shrink-0">
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-lg bg-[#0E1422] border border-orange-500/30 flex items-center justify-center shrink-0">
                <Image src="/logo.png" alt="AVOX" width={20} height={20} className="w-5 h-5 object-contain" />
              </div>
              <div className="flex items-center space-x-2 flex-wrap">
                <h1 className="text-base sm:text-lg font-silkscreen font-bold text-slate-100 uppercase tracking-wide">
                  Live Tactical Arena
                </h1>
                <span className="text-[10px] font-chakra font-bold text-orange-400 px-2 py-0.5 rounded bg-orange-950/40 border border-orange-500/30">
                  ROUND {battleState.round}
                </span>
                <div className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[#0D1322] border border-orange-500/30 text-[10px] font-mono font-bold text-orange-400">
                  <Image src="/logo.png" alt="AVOX" width={12} height={12} className="w-3 h-3 object-contain" />
                  <span>+50 AVOX Reward</span>
                </div>
                {comboCount > 1 && (
                  <span className="text-[10px] font-mono font-bold text-slate-200 px-2 py-0.5 rounded bg-slate-900 border border-slate-700 flex items-center space-x-1">
                    <Flame className="w-3 h-3 text-orange-400" />
                    <span>{comboCount}x COMBO</span>
                  </span>
                )}
                <span className="text-slate-600 text-xs hidden md:inline">•</span>
                <span className="text-[11px] text-slate-400 hidden md:inline">Pyth Feeds Active</span>
              </div>
            </div>

            {/* Right Controls: Speed, Simulator, Sound & Rematch */}
            <div className="flex items-center space-x-1.5 shrink-0">
              {/* Turbo Speed Toggle */}
              <button
                onClick={() => {
                  sound.playClick();
                  setBattleSpeed((s) => (s === 1 ? 2 : 1));
                }}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold transition-all ${
                  battleSpeed === 2
                    ? "bg-amber-500/20 border-amber-400 text-amber-300 shadow-[0_0_10px_rgba(245,158,11,0.3)]"
                    : "bg-[#0E1320] border-slate-700 text-slate-300 hover:border-slate-500"
                }`}
                title="Toggle Battle Animation Speed (Hotkey: T)"
              >
                <Gauge className="w-3 h-3" />
                <span>{battleSpeed === 2 ? "2X" : "1X"}</span>
                <span className="text-[9px] text-slate-500 font-mono">[T]</span>
              </button>

              {/* Shock Market Simulator Trigger */}
              {onOpenSimulator && (
                <button
                  onClick={() => {
                    sound.playClick();
                    onOpenSimulator();
                  }}
                  className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-chakra font-bold uppercase tracking-wider transition-colors shadow-[0_0_12px_rgba(220,38,38,0.4)]"
                  title="Shock Market Simulator (Hotkey: S)"
                >
                  <Zap className="w-3 h-3 text-white" />
                  <span>Shock</span>
                  <span className="text-[9px] text-red-200 font-mono">[S]</span>
                </button>
              )}

              {/* Sound Toggle */}
              <button
                onClick={() => {
                  const next = sound.toggleMute();
                  setIsMuted(next);
                }}
                className="p-1.5 rounded-lg bg-[#0F1420] border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
                title={isMuted ? "Unmute Sound" : "Mute Sound"}
              >
                {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-orange-400" />}
              </button>

              {/* Rematch */}
              <button
                onClick={handleRestart}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-[11px] font-semibold text-slate-300 transition-colors"
                title="Restart Match (Hotkey: R)"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Rematch</span>
                <span className="text-[9px] text-slate-500 font-mono">[R]</span>
              </button>

              {/* Return to Lobby */}
              <button
                onClick={handleReturnToLobby}
                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-[11px] font-chakra font-semibold text-slate-300 transition-colors"
                title="Return to Matchmaking War Room"
              >
                <ArrowLeft className="w-3 h-3 text-slate-400" />
                <span>Lobby</span>
              </button>
            </div>
          </div>

          {/* Floating Combat Event Banner */}
          {combatBanner && (
            <div className="w-full flex justify-center -my-1 z-30 pointer-events-none shrink-0">
              <div className="py-1 px-4 rounded-full bg-[#131A29]/95 text-orange-400 font-chakra font-bold text-xs uppercase tracking-wider shadow-[0_0_15px_rgba(0,0,0,0.8)] border border-orange-500/40">
                {combatBanner}
              </div>
            </div>
          )}

      {/* Main Arena Board */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 flex-1 min-h-0 overflow-hidden">
        {/* Opponent & Player Colosseum Arena Stage (col 8) */}
        <div className="lg:col-span-8 bg-gradient-to-b from-[#090D18]/90 via-[#070A12]/95 to-[#081116]/90 border border-slate-800/80 rounded-2xl p-2.5 flex flex-col justify-between h-full min-h-0 relative overflow-hidden shadow-[0_0_30px_rgba(0,0,0,0.5)]">
          {/* Top Status Bar: Opponent Profile & Combat Phase */}
          <div className="flex items-center justify-between pb-1.5 border-b border-slate-800/80 text-xs shrink-0">
            {/* Opponent Info */}
            <div className="flex items-center space-x-2">
              <span className="text-xl">{battleState.opponentProfile.avatar}</span>
              <div>
                <div className="flex items-center space-x-1.5">
                  <span className="text-xs font-mono font-bold text-rose-400 uppercase tracking-wider">
                    {battleState.opponentProfile.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-400">
                    (MMR {battleState.opponentProfile.mmr})
                  </span>
                  {battleState.opponentProfile.isBot ? (
                    <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/50 text-[9px] font-chakra font-bold text-cyan-300 flex items-center space-x-1 shadow-[0_0_8px_rgba(6,182,212,0.3)]">
                      <Bot className="w-2.5 h-2.5 text-cyan-400" />
                      <span>AI // {battleState.opponentProfile.botArchetype || "ADAPTIVE"}</span>
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/50 text-[9px] font-chakra font-bold text-emerald-300 flex items-center space-x-1 shadow-[0_0_8px_rgba(16,185,129,0.3)]">
                      <User className="w-2.5 h-2.5 text-emerald-400" />
                      <span>LIVE P2P</span>
                    </span>
                  )}
                </div>
              </div>

              {isAiThinking && (
                <span className="text-[9px] font-mono text-amber-400 animate-pulse flex items-center space-x-1 ml-1.5">
                  <Activity className="w-2.5 h-2.5 animate-spin" />
                  <span>Thinking...</span>
                </span>
              )}
            </div>

            {/* Combat Turn Phase Pill */}
            <div className="flex items-center space-x-2">
              <span className="flex items-center space-x-1 text-[11px] font-mono">
                <span className="text-slate-400 font-normal">Turn:</span>
                <strong
                  className={`${
                    battleState.phase === "game_over"
                      ? "text-amber-400"
                      : battleState.currentTurn === "player"
                      ? "text-emerald-400 font-bold animate-pulse"
                      : "text-rose-400 font-bold"
                  }`}
                >
                  {battleState.phase === "game_over"
                    ? "GAME OVER"
                    : battleState.currentTurn === "player"
                    ? "YOUR TURN"
                    : "OPPONENT TURN"}
                </strong>
              </span>
            </div>
          </div>

          {/* Tactical Faceoff Arena Stage */}
          <div className="flex-1 min-h-0 flex items-center justify-around relative py-1 px-2">
            {/* PLAYER COMBATANT (Left) */}
            <div className="relative flex flex-col items-center">
              {activePlayerCard && (
                <div
                  className={`relative transition-all duration-200 ${
                    attacker === "player" ? "animate-lunge-right z-20" : ""
                  } ${hitTarget === "player" ? "animate-hit-shake" : ""} ${
                    isSkillReady ? "ring-2 ring-emerald-400/80 rounded-2xl shadow-[0_0_20px_rgba(16,185,129,0.3)]" : ""
                  } ${getStatusAuraClass(activePlayerCard.statusEffects)}`}
                >
                  {/* Status Badges Overlay */}
                  {activePlayerCard.statusEffects && activePlayerCard.statusEffects.length > 0 && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 pointer-events-none">
                      {activePlayerCard.statusEffects.map((eff, i) => (
                        <div
                          key={i}
                          className="px-2 py-0.5 rounded-full text-[9px] font-chakra font-bold tracking-wider uppercase flex items-center space-x-1 shadow-md border border-slate-700/80 bg-[#0B0F18]/95 text-slate-300 whitespace-nowrap"
                        >
                          <span>{eff.type === "freeze" ? "❄️" : eff.type === "burn" ? "🔥" : eff.type === "shock" ? "⚡" : "☠️"}</span>
                          <span>{eff.type} ({eff.duration}t)</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <CardComponent
                    card={activePlayerCard}
                    size="sm"
                    isBattleCard={true}
                    hpCurrent={activePlayerCard.currentHp}
                    hpMax={activePlayerCard.maxHp}
                    shield={activePlayerCard.shield}
                    energyCurrent={activePlayerCard.energy}
                    energyMax={activePlayerCard.maxEnergy}
                  />

                  {/* Hit Impact Overlay on Player */}
                  {hitEffect && hitEffect.target === "player" && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                      <div
                        className={`w-28 h-28 rounded-full border-4 ${
                          hitEffect.isCrit ? "border-amber-400 bg-amber-500/20" : "border-red-500 bg-red-600/20"
                        } animate-slash`}
                      />
                    </div>
                  )}

                  {/* Floating Damage Text on Player */}
                  {floatingDamage
                    .filter((d) => d.isPlayerTarget)
                    .map((d) => (
                      <div
                        key={d.id}
                        className={`absolute -top-6 left-1/2 font-black font-chakra animate-damage-float z-40 whitespace-nowrap drop-shadow-[0_0_15px_rgba(239,68,68,1)] ${
                          d.isCrit
                            ? "text-amber-300 text-2xl font-extrabold tracking-wider"
                            : "text-rose-400 text-xl font-bold"
                        }`}
                      >
                        {d.text} {d.isCrit && "💥 CRIT!"}
                      </div>
                    ))}
                </div>
              )}
            </div>

            {/* CENTER CLASH ZONE */}
            <div className="flex flex-col items-center justify-center relative px-2 shrink-0">
              {/* Tactical Arena Duel Ring */}
              <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
                <div className="absolute inset-0 rounded-full border border-slate-800 pointer-events-none" />
                <div className="absolute inset-2 rounded-full border border-slate-800/60 pointer-events-none" />
                <div className="absolute inset-6 rounded-full bg-slate-950/60 pointer-events-none" />

                {/* Projectile Beams */}
                {projectileActive === "player" && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                    <div className="w-28 sm:w-36 h-1.5 bg-gradient-to-r from-emerald-500 via-teal-400 to-transparent rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)] animate-beam-horizontal-player" />
                  </div>
                )}

                {projectileActive === "opponent" && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                    <div className="w-28 sm:w-36 h-1.5 bg-gradient-to-r from-red-500 via-rose-400 to-transparent rounded-full shadow-[0_0_8px_rgba(244,63,94,0.4)] animate-beam-horizontal-opponent" />
                  </div>
                )}

                {/* Center VS Clash Icon */}
                <div className="w-9 h-9 rounded-xl bg-[#0B0F19] border border-slate-800 flex items-center justify-center shadow-md relative z-10">
                  <span className="font-silkscreen font-bold text-xs text-orange-400">
                    VS
                  </span>
                </div>
              </div>

              {/* Live Multiplier Clash Bar */}
              <div className="mt-1 text-center font-mono text-[10px]">
                <div className="flex items-center space-x-1.5 justify-center">
                  <span className="text-emerald-400 font-bold">{activePlayerCard.statMultiplier.toFixed(2)}x</span>
                  <span className="text-slate-600 font-bold">:</span>
                  <span className="text-rose-400 font-bold">{activeOpponentCard.statMultiplier.toFixed(2)}x</span>
                </div>
                <div className="text-[8px] text-slate-500 uppercase tracking-wider">Oracle Clash</div>
              </div>
            </div>

            {/* OPPONENT COMBATANT (Right) */}
            <div className="relative flex flex-col items-center">
              {activeOpponentCard && (
                <div
                  className={`relative transition-all duration-200 ${
                    attacker === "opponent" ? "animate-lunge-left z-20" : ""
                  } ${hitTarget === "opponent" ? "animate-hit-shake" : ""} ${getStatusAuraClass(activeOpponentCard.statusEffects)}`}
                >
                  {/* Status Badges Overlay */}
                  {activeOpponentCard.statusEffects && activeOpponentCard.statusEffects.length > 0 && (
                    <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1 pointer-events-none">
                      {activeOpponentCard.statusEffects.map((eff, i) => (
                        <div
                          key={i}
                          className="px-2 py-0.5 rounded-full text-[9px] font-chakra font-bold tracking-wider uppercase flex items-center space-x-1 shadow-md border border-slate-700/80 bg-[#0B0F18]/95 text-slate-300 whitespace-nowrap"
                        >
                          <span>{eff.type === "freeze" ? "❄️" : eff.type === "burn" ? "🔥" : eff.type === "shock" ? "⚡" : "☠️"}</span>
                          <span>{eff.type} ({eff.duration}t)</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <CardComponent
                    card={activeOpponentCard}
                    size="sm"
                    isBattleCard={true}
                    hpCurrent={activeOpponentCard.currentHp}
                    hpMax={activeOpponentCard.maxHp}
                    shield={activeOpponentCard.shield}
                    energyCurrent={activeOpponentCard.energy}
                    energyMax={activeOpponentCard.maxEnergy}
                  />

                  {/* Dynamic Target Locking Reticle Overlay on Hover */}
                  {hoveredAction && (
                    <div className="absolute inset-0 z-30 pointer-events-none flex items-center justify-center">
                      <div className="relative w-32 h-32 border-2 border-red-500/80 rounded-full animate-target-reticle flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.7)]">
                        <Target className="w-10 h-10 text-red-400 animate-pulse" />
                        <div className="absolute top-1 left-1 w-2.5 h-2.5 border-t-2 border-l-2 border-amber-400" />
                        <div className="absolute top-1 right-1 w-2.5 h-2.5 border-t-2 border-r-2 border-amber-400" />
                        <div className="absolute bottom-1 left-1 w-2.5 h-2.5 border-b-2 border-l-2 border-amber-400" />
                        <div className="absolute bottom-1 right-1 w-2.5 h-2.5 border-b-2 border-r-2 border-amber-400" />
                      </div>
                    </div>
                  )}

                  {/* Projected Damage HUD Badge */}
                  {hoveredAction && (
                    <div className="absolute -top-7 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
                      <div className="px-2.5 py-0.5 rounded-full bg-red-600/90 border border-amber-400/80 text-white font-chakra font-black text-[10px] uppercase tracking-wider flex items-center space-x-1 shadow-[0_0_15px_rgba(239,68,68,0.8)] animate-pulse whitespace-nowrap">
                        <Target className="w-3 h-3 text-amber-300" />
                        <span>
                          TARGET LOCKED: ~{hoveredAction === "strike" ? estStrikeDamage : Math.round(estStrikeDamage * 1.5)} DMG
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Slash / Hit Impact Overlay on Opponent */}
                  {hitEffect && hitEffect.target === "opponent" && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                      <div
                        className={`w-28 h-28 rounded-full border-4 ${
                          hitEffect.isCrit ? "border-amber-400 bg-amber-500/20" : "border-red-500 bg-red-600/20"
                        } animate-slash`}
                      />
                    </div>
                  )}

                  {/* Skill Energy Shockwave Overlay on Opponent */}
                  {skillWaveActive && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-30">
                      <div className="w-36 h-36 rounded-full border-4 border-cyan-400 bg-cyan-500/20 animate-skill-burst" />
                    </div>
                  )}

                  {/* Floating Damage Text on Opponent */}
                  {floatingDamage
                    .filter((d) => !d.isPlayerTarget)
                    .map((d) => (
                      <div
                        key={d.id}
                        className={`absolute -top-6 left-1/2 font-black font-chakra animate-damage-float z-40 whitespace-nowrap drop-shadow-[0_0_15px_rgba(239,68,68,1)] ${
                          d.isCrit
                            ? "text-amber-300 text-2xl font-extrabold tracking-wider"
                            : "text-rose-400 text-xl font-bold"
                        }`}
                      >
                        {d.text} {d.isCrit && "💥 CRIT!"}
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>

          {/* Bottom Command Deck */}
          <div className="pt-2 border-t border-slate-800/80 shrink-0 space-y-2">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-2">
              {/* Player Quick Bench Switcher */}
              <div className="flex items-center space-x-1.5">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Your Bench:</span>
                {battleState.playerLineup.map((card, idx) => {
                  const isDead = card.currentHp <= 0;
                  const isActive = idx === battleState.activePlayerIndex;
                  const hotkeys = ["Q", "W", "E"];

                  return (
                    <button
                      key={card.id}
                      onClick={() => handleSwitchCard(idx)}
                      disabled={isDead || isActive || battleState.currentTurn !== "player" || attacker !== "none"}
                      className={`px-2 py-1 rounded-md border text-[10px] font-mono flex items-center space-x-1 transition-all ${
                        isActive
                          ? "border-emerald-400 bg-emerald-950/60 text-emerald-200 font-bold ring-1 ring-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.3)]"
                          : isDead
                          ? "border-slate-800 bg-black text-slate-600 cursor-not-allowed opacity-30"
                          : "border-slate-800 bg-black/60 text-slate-300 hover:border-slate-600 hover:text-white"
                      }`}
                      title={`Switch to ${card.name} (Hotkey: ${hotkeys[idx]})`}
                    >
                      <span className="text-[8px] text-slate-500 font-bold">[{hotkeys[idx]}]</span>
                      <span className="font-bold">{card.assetSymbol}</span>
                      {card.statusEffects && card.statusEffects.length > 0 && (
                        <span className="text-[9px]">
                          {card.statusEffects.some((e) => e.type === "freeze") && "❄️"}
                          {card.statusEffects.some((e) => e.type === "burn") && "🔥"}
                          {card.statusEffects.some((e) => e.type === "shock") && "⚡"}
                          {card.statusEffects.some((e) => e.type === "poison") && "☠️"}
                        </span>
                      )}
                      <span className="text-[9px] text-slate-400">
                        ({Math.round((card.currentHp / card.maxHp) * 100)}%)
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Opponent Reserve Lineup */}
              <div className="flex items-center space-x-1.5">
                <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">Enemy Lineup:</span>
                {battleState.opponentLineup.map((card, idx) => {
                  const hpPercent = Math.max(0, (card.currentHp / card.maxHp) * 100);
                  const isDead = card.currentHp <= 0;
                  const isActive = idx === battleState.activeOpponentIndex;

                  return (
                    <div
                      key={card.id}
                      className={`px-2 py-1 rounded-md border text-[10px] font-mono flex items-center space-x-1.5 transition-all ${
                        isActive
                          ? "border-rose-400 bg-rose-950/60 text-rose-200 font-bold ring-1 ring-rose-500/50 shadow-[0_0_8px_rgba(244,63,94,0.3)]"
                          : isDead
                          ? "border-slate-800 bg-black text-slate-600 opacity-30"
                          : "border-slate-800 bg-black/60 text-slate-300"
                      }`}
                    >
                      <span className="font-bold">{card.assetSymbol}</span>
                      {card.statusEffects && card.statusEffects.length > 0 && (
                        <span className="text-[9px]">
                          {card.statusEffects.some((e) => e.type === "freeze") && "❄️"}
                          {card.statusEffects.some((e) => e.type === "burn") && "🔥"}
                          {card.statusEffects.some((e) => e.type === "shock") && "⚡"}
                          {card.statusEffects.some((e) => e.type === "poison") && "☠️"}
                        </span>
                      )}
                      <div className="w-7 bg-slate-900 h-1.5 rounded overflow-hidden">
                        <div
                          className="bg-rose-500 h-full transition-all duration-300"
                          style={{ width: `${hpPercent}%` }}
                        />
                      </div>
                      <span className="text-[9px] text-slate-400">{Math.round(hpPercent)}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* High-Impact Primary Action Buttons */}
            {battleState.phase === "action" && (() => {
              const isPlayerFrozen = activePlayerCard?.statusEffects?.some((s) => s.type === "freeze");
              return (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {/* Standard Market Strike */}
                <button
                  onClick={handlePlayerStrike}
                  onMouseEnter={() => setHoveredAction("strike")}
                  onMouseLeave={() => setHoveredAction(null)}
                  disabled={battleState.currentTurn !== "player" || isAiThinking || attacker !== "none" || isPlayerFrozen}
                  className={`py-2.5 px-3 rounded-xl ${
                    isPlayerFrozen
                      ? "bg-slate-900 border border-slate-800 text-slate-500"
                      : "bg-[#131926] hover:bg-[#1B2436] border border-orange-500/40 hover:border-orange-500/70 text-slate-100 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                  } disabled:opacity-40 disabled:cursor-not-allowed font-bold text-xs uppercase tracking-wider flex items-center justify-between transition-all active:scale-[0.98]`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded bg-black/50 border border-slate-700 flex items-center justify-center font-mono text-[10px] font-bold text-slate-300 shrink-0">
                      1
                    </span>
                    <Swords className="w-4 h-4 text-orange-400 shrink-0" />
                    <div className="text-left leading-tight">
                      <div className="font-bold text-xs font-chakra text-slate-100">
                        {isPlayerFrozen ? "❄️ Frozen Solid" : "Market Strike"}
                      </div>
                      <div className="text-[9px] text-slate-400 normal-case">
                        {isPlayerFrozen ? "Turn skipped as frost thaws..." : `Est. ~${estStrikeDamage} DMG`}
                      </div>
                    </div>
                  </div>
                  <span className="font-mono text-[10px] font-bold text-orange-400 bg-black/40 px-1.5 py-0.5 rounded border border-orange-500/20 shrink-0">
                    +25 MP
                  </span>
                </button>

                {/* Card Specific Skill */}
                <button
                  onClick={handlePlayerSkill}
                  onMouseEnter={() => setHoveredAction("skill")}
                  onMouseLeave={() => setHoveredAction(null)}
                  disabled={
                    battleState.currentTurn !== "player" ||
                    isAiThinking ||
                    attacker !== "none" ||
                    isPlayerFrozen ||
                    activePlayerCard.energy < activePlayerCard.skill.manaCost
                  }
                  className={`py-2.5 px-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-between transition-all active:scale-[0.98] ${
                    isPlayerFrozen || !isSkillReady
                      ? "bg-[#0A0E17] border border-slate-800 text-slate-500 disabled:opacity-40 disabled:cursor-not-allowed"
                      : "bg-[#131926] hover:bg-[#1B2436] border border-slate-700 hover:border-slate-500 text-slate-100 shadow-[0_0_15px_rgba(0,0,0,0.5)]"
                  }`}
                >
                  <div className="flex items-center space-x-2">
                    <span className="w-5 h-5 rounded bg-black/50 border border-slate-700 flex items-center justify-center font-mono text-[10px] font-bold text-slate-300 shrink-0">
                      2
                    </span>
                    <span className="text-base shrink-0">{elementIcon}</span>
                    <div className="text-left leading-tight">
                      <div className="font-bold text-xs font-chakra truncate max-w-[130px] text-slate-100">
                        {activePlayerCard.skill.name}
                      </div>
                      <div className="text-[9px] text-slate-400 normal-case truncate max-w-[140px]">
                        {activePlayerCard.skill.description}
                      </div>
                    </div>
                  </div>
                  <span className={`font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-black/40 shrink-0 ${
                    isSkillReady ? "text-emerald-400 border border-emerald-500/30" : "text-slate-500 border border-slate-800"
                  }`}>
                    {activePlayerCard.skill.manaCost} MP
                  </span>
                </button>
              </div>
              );
            })()}
          </div>
        </div>

        {/* COMBAT TELEMETRY & EVENT LOG (col 4) */}
        <div className="lg:col-span-4 bg-[#0A0E18] rounded-2xl border border-slate-800 p-3 flex flex-col h-full min-h-0 shadow-[0_0_20px_rgba(0,0,0,0.4)] overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2 shrink-0">
            <div className="flex items-center space-x-1.5">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <h3 className="font-bold text-xs text-slate-200 uppercase tracking-wider font-mono">
                Combat Telemetry
              </h3>
            </div>
            <span className="text-[9px] font-mono text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/40">
              PYTH REALTIME
            </span>
          </div>

          {/* Active Card Market Momentum Summary */}
          <div className="p-2 border border-slate-800/80 mb-2 text-xs space-y-1 bg-[#0C1220] rounded-xl shrink-0">
            <div className="text-slate-400 font-bold text-[9px] uppercase font-mono flex items-center justify-between">
              <span>Oracle Multipliers</span>
              <span className="text-cyan-400 font-normal text-[9px]">Live 1s Feed</span>
            </div>
            <div className="flex justify-between items-center text-[11px]">
              <span className="font-bold text-slate-200 flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span>You ({activePlayerCard.assetSymbol}):</span>
              </span>
              <span className="font-mono font-bold text-emerald-400">
                {activePlayerCard.statMultiplier.toFixed(2)}x ({activePlayerCard.deltaPercent >= 0 ? "+" : ""}{activePlayerCard.deltaPercent}%)
              </span>
            </div>
            <div className="flex justify-between items-center text-[11px] text-slate-400">
              <span className="flex items-center space-x-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                <span>Opponent ({activeOpponentCard.assetSymbol}):</span>
              </span>
              <span className="font-mono font-bold text-rose-400">
                {activeOpponentCard.statMultiplier.toFixed(2)}x ({activeOpponentCard.deltaPercent >= 0 ? "+" : ""}{activeOpponentCard.deltaPercent}%)
              </span>
            </div>
          </div>

          {/* Scrollable Combat Log Entries */}
          <div
            ref={logContainerRef}
            className="flex-1 overflow-y-auto space-y-1.5 pr-1 text-xs font-mono scrollbar-none min-h-0"
          >
            {battleState.log.map((entry) => {
              const isMarket = entry.sender === "market";
              const isPlayer = entry.sender === "player";
              const isOpponent = entry.sender === "opponent";

              return (
                <div
                  key={entry.id}
                  className={`p-2 rounded-lg border leading-snug text-[10px] ${
                    isMarket
                      ? "bg-amber-950/40 border-amber-500/40 text-amber-300"
                      : isPlayer
                      ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-200"
                      : isOpponent
                      ? "bg-rose-950/30 border-rose-500/30 text-rose-200"
                      : "bg-slate-900 border-slate-800 text-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between text-[8px] text-slate-400 mb-0.5">
                    <span className="font-bold uppercase tracking-wider">{entry.actorName}</span>
                    <span>R{entry.round}</span>
                  </div>
                  <p>{entry.text}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* GAME OVER VICTORY / DEFEAT MODAL */}
      {battleState.phase === "game_over" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="w-full max-w-md bg-[#0C111C] border border-slate-800 rounded-2xl shadow-2xl p-6 text-center text-slate-100 animate-in zoom-in-95 duration-300">
            {battleState.winner === "player" ? (
              <>
                <div className="w-14 h-14 rounded-full bg-orange-500/10 border border-orange-500/40 flex items-center justify-center mx-auto mb-4 text-orange-400">
                  <Trophy className="w-7 h-7" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold font-silkscreen text-slate-100 uppercase tracking-wide">
                  VICTORY ACHIEVED!
                </h2>
                <p className="text-xs text-slate-400 mt-1 mb-6">
                  You successfully capitalized on crypto market momentum and overpowered the opposing portfolio!
                </p>

                <div className="bg-[#0E1422] rounded-xl p-4 border border-slate-800 text-xs font-mono space-y-2 mb-6">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800/80">
                    <span className="text-slate-400">Match Victory Reward:</span>
                    <span className="text-orange-400 font-bold font-chakra flex items-center space-x-1.5 text-sm">
                      <Image src="/logo.png" alt="AVOX" width={16} height={16} className="w-4 h-4 object-contain" />
                      <span>+50 AVOX</span>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Total AVOX Vault:</span>
                    <span className="text-slate-200 font-bold font-mono">
                      {profile.avoxBalance} AVOX
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Rating Change:</span>
                    <span className="text-slate-200 font-bold">+25 MMR ({profile.ratingMMR})</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Rank Standing:</span>
                    <span className="text-slate-300 font-bold">{profile.rankTier}</span>
                  </div>
                </div>
              </>
            ) : (
              <>
                <div className="w-14 h-14 rounded-full bg-red-500/10 border border-red-500/40 flex items-center justify-center mx-auto mb-4 text-red-400">
                  <Skull className="w-7 h-7" />
                </div>
                <h2 className="text-3xl sm:text-4xl font-bold font-silkscreen text-slate-100 uppercase tracking-wide">
                  DEFEAT
                </h2>
                <p className="text-xs text-slate-400 mt-1 mb-6">
                  Adverse price volatility wiped out your active card reserves.
                </p>

                <div className="bg-[#0E1422] rounded-xl p-4 border border-slate-800 text-xs font-mono space-y-2 mb-6">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Rating Change:</span>
                    <span className="text-slate-300 font-bold">-18 MMR</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">AVOX Vault:</span>
                    <span className="text-orange-400 font-bold">{profile.avoxBalance} AVOX</span>
                  </div>
                </div>
              </>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <button
                onClick={startSearch}
                className="py-3 rounded-xl bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-400 hover:to-red-500 font-bold text-white text-xs uppercase tracking-wider transition-all shadow-[0_0_20px_rgba(234,88,12,0.4)] font-chakra flex items-center justify-center space-x-1.5"
              >
                <Radio className="w-4 h-4" />
                <span>Find Next Match</span>
              </button>

              <button
                onClick={handleRestart}
                className="py-3 rounded-xl bg-[#131B2E] hover:bg-[#1A243B] border border-slate-700 font-bold text-slate-200 text-xs uppercase tracking-wider transition-all font-chakra flex items-center justify-center space-x-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Rematch {battleState.opponentProfile.isBot ? "Bot" : "Player"}</span>
              </button>
            </div>

            <button
              onClick={handleReturnToLobby}
              className="w-full mt-3 py-2 text-slate-400 hover:text-slate-200 text-xs font-mono transition-colors"
            >
              ← Return to Matchmaking War Room
            </button>
          </div>
        </div>
      )}
    </div>
  )}
</div>
  );
}
