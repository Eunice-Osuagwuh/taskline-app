import { GAME_CONFIG } from "./config.js";
import { applyPowerUp, isShieldActive, pickPowerUpType } from "./powerups.js";

const rr = (a, b) => Math.random() * (b - a) + a;
const spawnX = (state, radius, avoidPlayer = false) => {
  const playerCenter = state.player.x + state.player.width / 2;
  for (let attempt = 0; attempt < 8; attempt += 1) {
    const x = rr(radius, GAME_CONFIG.width - radius);
    const tooCloseToPlayer = avoidPlayer && Math.abs(x - playerCenter) < state.player.width * 1.15;
    const tooCloseToBomb = state.bombs.some((bomb) => bomb.y < 80 && Math.abs(bomb.x - x) < radius + bomb.radius + 26);
    const tooCloseToStar = state.stars.some((star) => star.y < 80 && Math.abs(star.x - x) < radius + star.radius + 18);
    if (!tooCloseToPlayer && !tooCloseToBomb && !tooCloseToStar) return x;
  }
  return rr(radius, GAME_CONFIG.width - radius);
};
const mk = (s, r, avoidPlayer = false) => ({ x: spawnX(s, r, avoidPlayer), y: -r, radius: r, speed: rr(GAME_CONFIG.fallSpeedMin, GAME_CONFIG.fallSpeedMax) * (s.difficulty || 1) });
const ov = (c, p) => { const nx = Math.max(p.x, Math.min(c.x, p.x + p.width)); const ny = Math.max(p.y, Math.min(c.y, p.y + p.height)); const dx = c.x - nx, dy = c.y - ny; return dx * dx + dy * dy <= c.radius * c.radius; };
const mv = (list, dt) => { for (const i of list) i.y += i.speed * dt; };

export const spawnStar = (s) => s.stars.push({ ...mk(s, GAME_CONFIG.starRadius), kind: Math.random() < 0.14 ? "gold" : "normal" });
export const spawnBomb = (s) => s.bombs.push(mk(s, GAME_CONFIG.bombRadius, true));
export const spawnPowerUp = (s) => s.powerUps.push({ ...mk(s, GAME_CONFIG.powerUpRadius), type: pickPowerUpType() });
export const spawnBossTarget = (s) => { s.boss.target = { x: rr(30, GAME_CONFIG.width - 30), y: -22, radius: 20, speed: 140 }; };

export function updateEntities(state, dt) {
  let starHits = 0, goldHits = 0, bombHits = 0, powerHits = 0, bossHits = 0;
  const pickups = [], hits = [];
  mv(state.stars, dt); mv(state.bombs, dt); mv(state.powerUps, dt);
  state.stars = state.stars.filter((v) => { if (ov(v, state.player)) { if (v.kind === "gold") { state.metrics.goldStars += 1; goldHits += 1; pickups.push({ x: v.x, y: v.y, text: "+25", tone: "gold" }); } else { state.metrics.stars += 1; starHits += 1; pickups.push({ x: v.x, y: v.y, text: "+10", tone: "star" }); } return false; } return v.y - v.radius <= GAME_CONFIG.height; });
  state.bombs = state.bombs.filter((v) => { if (ov(v, state.player)) { if (!isShieldActive(state) && state.effects.hitGraceSecondsLeft <= 0) { state.lives -= 1; state.metrics.bombsHit += 1; bombHits += 1; hits.push({ x: v.x, y: v.y, tone: "bomb" }); state.effects.hitGraceSecondsLeft = 1.2; } return false; } return v.y - v.radius <= GAME_CONFIG.height; });
  state.powerUps = state.powerUps.filter((v) => { if (ov(v, state.player)) { applyPowerUp(state, v.type); state.metrics.powerUps += 1; powerHits += 1; pickups.push({ x: v.x, y: v.y, text: v.type === "shield" ? "Shield" : v.type === "freeze" ? "Freeze" : "Rush", tone: v.type }); return false; } return v.y - v.radius <= GAME_CONFIG.height; });
  if (state.boss.target) {
    state.boss.target.y += state.boss.target.speed * dt;
    if (ov(state.boss.target, state.player)) { bossHits += 1; pickups.push({ x: state.boss.target.x, y: state.boss.target.y, text: "+55", tone: "boss" }); state.boss.target = null; }
    else if (state.boss.target.y - state.boss.target.radius > GAME_CONFIG.height) state.boss.target = null;
  }
  return { starHits, goldHits, bombHits, powerHits, bossHits, pickups, hits };
}
