import { GAME_CONFIG } from "./config.js";
import { createInitialState } from "./state.js";
import { spawnBomb, spawnBossTarget, spawnPowerUp, spawnStar, updateEntities } from "./entities.js";
import { getPowerUpLabel, tickPowerUpEffects } from "./powerups.js";
import { intervalFor, tickProgression } from "./progression.js";

export function createGame({ input, renderer, onHUDUpdate, onSessionEnd }) {
  let s = createInitialState(), running = false, paused = false, last = 0, raf = 0, sent = false;
  const mode = () => s.boss.active ? `Boss (${s.boss.hp})` : s.effects.freezeSecondsLeft > 0 ? "Freeze" : s.effects.feverSecondsLeft > 0 ? "Fever" : "Normal";
  const hud = () => onHUDUpdate({ score: s.score, level: s.level, lives: Math.max(0, s.lives), time: Math.max(0, Math.ceil(s.timeLeft)), powerUp: getPowerUpLabel(s), combo: s.combo, mode: mode(), special: Math.ceil(s.effects.specialCooldownLeft) });
  const end = () => { if (sent || !s.isGameOver) return; sent = true; onSessionEnd?.({ score: s.score, level: s.level, lives: Math.max(0, s.lives), won: s.result === "won" || s.result === "victory", stars: s.metrics.stars + s.metrics.goldStars, bombsHit: s.metrics.bombsHit, powerUps: s.metrics.powerUps }); };
  const boss = (d) => {
    if (!s.boss.active && s.level >= s.boss.nextLevel) { s.boss.active = true; s.boss.hp = GAME_CONFIG.bossHitsToClear; s.boss.timeLeft = GAME_CONFIG.bossWaveDurationSeconds; s.boss.target = null; }
    if (!s.boss.active) return;
    s.boss.timeLeft -= d; if (!s.boss.target) spawnBossTarget(s);
    if (s.boss.timeLeft <= 0 && s.boss.hp > 0) { s.lives -= 1; s.boss.active = false; s.boss.nextLevel += GAME_CONFIG.bossLevelStep; s.boss.target = null; }
  };
  const pulse = () => {
    if (s.effects.specialCooldownLeft > 0 || s.isGameOver) return false;
    s.effects.specialCooldownLeft = GAME_CONFIG.specialCooldownSeconds;
    const low = GAME_CONFIG.height * 0.56;
    const clearBombs = s.bombs.filter((b) => b.y > low).length;
    const collectStars = s.stars.filter((v) => v.y > low).length;
    s.bombs = s.bombs.filter((b) => b.y <= low); s.stars = s.stars.filter((v) => v.y <= low);
    s.score += clearBombs * 6 + collectStars * 12; s.combo = Math.min(16, s.combo + collectStars); s.comboTimer = collectStars > 0 ? 1.2 : s.comboTimer;
    return true;
  };
  const pushPopup = (x, y, text, tone) => {
    s.feedback.popups.push({ x, y, text, tone, ttl: 0.7, age: 0 });
    if (s.feedback.popups.length > 8) s.feedback.popups.shift();
  };
  const updateFeedback = (d) => {
    s.feedback.hitFlash = Math.max(0, s.feedback.hitFlash - d * 2.4);
    s.feedback.pulse = Math.max(0, s.feedback.pulse - d * 2.1);
    s.feedback.popups = s.feedback.popups
      .map((popup) => ({ ...popup, age: popup.age + d, ttl: popup.ttl - d, y: popup.y - 26 * d }))
      .filter((popup) => popup.ttl > 0);
  };
  const step = (d) => {
    const px = input.getPointerX();
    if (typeof px === "number") {
      s.player.targetX = px - s.player.width / 2;
      const distance = s.player.targetX - s.player.x;
      s.player.x += distance * Math.min(1, GAME_CONFIG.pointerFollow * d);
      s.player.velocityX = distance / Math.max(d, 0.001);
    } else {
      const a = input.getHorizontalAxis();
      if (a !== 0) {
        s.player.velocityX += a * GAME_CONFIG.playerAcceleration * d;
      } else if (s.player.velocityX !== 0) {
        const drag = GAME_CONFIG.playerDrag * d;
        if (Math.abs(s.player.velocityX) <= drag) s.player.velocityX = 0;
        else s.player.velocityX -= Math.sign(s.player.velocityX) * drag;
      }
      s.player.velocityX = Math.max(-GAME_CONFIG.playerSpeed, Math.min(GAME_CONFIG.playerSpeed, s.player.velocityX));
      s.player.x += s.player.velocityX * d;
      s.player.targetX = s.player.x;
    }
    s.player.x = Math.max(0, Math.min(GAME_CONFIG.width - s.player.width, s.player.x)); tickProgression(s); boss(d);
    const slow = s.effects.freezeSecondsLeft > 0 ? 0.65 : 1, bossRate = s.boss.active ? 1.35 : 1;
    s.spawn.starTimer += d * 1000 * slow; s.spawn.bombTimer += d * 1000 * slow; s.spawn.powerUpTimer += d * 1000 * slow; s.spawn.secondTimer += d;
    if (s.spawn.starTimer >= intervalFor(GAME_CONFIG.starSpawnInterval, (s.effects.feverSecondsLeft > 0 ? s.difficulty * 1.2 : s.difficulty))) { s.spawn.starTimer = 0; spawnStar(s); }
    if (s.spawn.bombTimer >= intervalFor(GAME_CONFIG.bombSpawnInterval, s.difficulty * bossRate)) { s.spawn.bombTimer = 0; spawnBomb(s); }
    if (s.spawn.powerUpTimer >= intervalFor(GAME_CONFIG.powerUpSpawnInterval, s.difficulty)) { s.spawn.powerUpTimer = 0; spawnPowerUp(s); }
    if (s.spawn.secondTimer >= 1) { s.spawn.secondTimer -= 1; s.timeLeft -= 1; }
    const h = updateEntities(s, d * slow); tickPowerUpEffects(s, d); s.effects.feverSecondsLeft = Math.max(0, s.effects.feverSecondsLeft - d); s.effects.specialCooldownLeft = Math.max(0, s.effects.specialCooldownLeft - d); s.effects.hitGraceSecondsLeft = Math.max(0, s.effects.hitGraceSecondsLeft - d); s.comboTimer = Math.max(0, s.comboTimer - d);
    const picked = h.starHits + h.goldHits; if (picked > 0) { s.combo = Math.min(16, s.combo + picked); s.comboTimer = 1.4; if (s.combo >= 9) s.effects.feverSecondsLeft = 5; const m = 1 + Math.floor(s.combo / 3) + (s.effects.feverSecondsLeft > 0 ? 1 : 0); s.score += h.starHits * 10 * m + h.goldHits * 25 * m; }
    if (h.bossHits > 0 && s.boss.active) { s.boss.hp -= h.bossHits; s.score += 55 * h.bossHits; if (s.boss.hp <= 0) { s.boss.active = false; s.boss.nextLevel += GAME_CONFIG.bossLevelStep; s.score += 140; s.effects.feverSecondsLeft = Math.max(6, s.effects.feverSecondsLeft); } }
    if (h.bombHits > 0 || s.comboTimer <= 0) s.combo = 0; if (h.powerHits > 0) s.score += 8 * h.powerHits;
    h.pickups.forEach((pickup) => pushPopup(pickup.x, pickup.y, pickup.text, pickup.tone));
    if (h.pickups.length > 0) s.feedback.pulse = Math.min(1, s.feedback.pulse + 0.45);
    if (h.hits.length > 0) s.feedback.hitFlash = 1;
    updateFeedback(d);
    if (s.level >= GAME_CONFIG.maxLevel && !s.boss.active) { s.isGameOver = true; s.result = "victory"; }
    if (s.lives <= 0) { s.isGameOver = true; s.result = "lost"; } else if (s.timeLeft <= 0) { s.isGameOver = true; s.result = "won"; }
  };
  const tick = (now) => { if (!running || paused) return; if (!last) last = now; const d = Math.min((now - last) / 1000, 0.05); last = now; if (!s.isGameOver) step(d); hud(); renderer.render(s); end(); raf = requestAnimationFrame(tick); };
  return {
    start() { if (running) return; running = true; paused = false; s.isPaused = false; last = 0; sent = false; hud(); renderer.render(s); raf = requestAnimationFrame(tick); },
    pause() { if (!running || paused || s.isGameOver) return false; paused = true; s.isPaused = true; cancelAnimationFrame(raf); hud(); renderer.render(s); return true; },
    resume() { if (!running || !paused || s.isGameOver) return false; paused = false; s.isPaused = false; last = 0; raf = requestAnimationFrame(tick); return true; },
    abort() {
      if (!running || s.isGameOver) return false;
      s.isGameOver = true; s.result = "aborted"; paused = true; cancelAnimationFrame(raf);
      hud(); renderer.render(s); end(); return true;
    },
    triggerSpecial: pulse,
    restart() { paused = false; s = createInitialState(); s.isPaused = false; sent = false; hud(); renderer.render(s); if (running) { cancelAnimationFrame(raf); last = 0; raf = requestAnimationFrame(tick); } },
    stop() { running = false; paused = false; s.isPaused = false; cancelAnimationFrame(raf); input.cleanup(); },
  };
}
