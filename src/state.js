import { GAME_CONFIG } from "./config.js";

export function createInitialState() {
  return {
    score: 0,
    combo: 0,
    level: 1,
    difficulty: 1,
    lives: GAME_CONFIG.maxLives,
    timeLeft: GAME_CONFIG.totalTimeSeconds,
    isGameOver: false,
    isPaused: false,
    result: "playing",
    player: {
      x: GAME_CONFIG.width / 2 - GAME_CONFIG.playerWidth / 2,
      y: GAME_CONFIG.height - GAME_CONFIG.playerHeight - 12,
      width: GAME_CONFIG.playerWidth,
      height: GAME_CONFIG.playerHeight,
      velocityX: 0,
      targetX: GAME_CONFIG.width / 2 - GAME_CONFIG.playerWidth / 2,
    },
    stars: [],
    bombs: [],
    powerUps: [],
    effects: {
      shieldSecondsLeft: 0,
      freezeSecondsLeft: 0,
      feverSecondsLeft: 0,
      specialCooldownLeft: 0,
      hitGraceSecondsLeft: 2.5,
    },
    metrics: {
      stars: 0,
      goldStars: 0,
      bombsHit: 0,
      powerUps: 0,
    },
    comboTimer: 0,
    boss: {
      active: false,
      hp: 0,
      timeLeft: 0,
      nextLevel: GAME_CONFIG.bossLevelStep,
      target: null,
    },
    spawn: {
      starTimer: 0,
      bombTimer: 0,
      powerUpTimer: 0,
      secondTimer: 0,
    },
    feedback: {
      popups: [],
      hitFlash: 0,
      pulse: 0,
    },
  };
}
