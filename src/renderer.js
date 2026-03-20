import { GAME_CONFIG } from "./config.js";
import { getPowerUpColor, isShieldActive } from "./powerups.js";

export function createRenderer(canvas) {
  const ctx = canvas.getContext("2d");
  const PALETTE = {
    boardTop: "#f9fcff",
    boardBottom: "#e7eef5",
    grid: "rgba(127, 145, 167, 0.07)",
    gridStrong: "rgba(127, 145, 167, 0.11)",
    playerBase: "#d38f43",
    playerEdge: "#b6752f",
    playerHighlight: "#ffe6c6",
    shield: "#4fd1a5",
    star: "#46b8ef",
    goldStar: "#f0b342",
    bomb: "#f15f56",
    boss: "#9d6bff",
    feverWash: "rgba(240, 179, 66, 0.08)",
    freezeWash: "rgba(70, 184, 239, 0.07)",
    bossWash: "rgba(183, 121, 255, 0.08)",
    overlay: "rgba(15, 23, 42, 0.22)",
    overlayPanel: "rgba(15, 23, 42, 0.18)",
    overlayText: "#f8fafc",
    overlaySubtle: "rgba(248, 250, 252, 0.82)",
    popup: {
      star: "#0f6fa8",
      gold: "#9a6612",
      shield: "#147d63",
      freeze: "#12639b",
      rush: "#a05e12",
      boss: "#6d3fe0",
    },
  };

  function clear() {
    ctx.clearRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
  }

  function drawBoard() {
    const gradient = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.height);
    gradient.addColorStop(0, PALETTE.boardTop);
    gradient.addColorStop(1, PALETTE.boardBottom);
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);

    ctx.strokeStyle = PALETTE.grid;
    ctx.lineWidth = 1;
    for (let x = 24; x < GAME_CONFIG.width; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GAME_CONFIG.height);
      ctx.stroke();
    }
    for (let y = 24; y < GAME_CONFIG.height; y += 24) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GAME_CONFIG.width, y);
      ctx.stroke();
    }

    ctx.strokeStyle = PALETTE.gridStrong;
    for (let x = 96; x < GAME_CONFIG.width; x += 96) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, GAME_CONFIG.height);
      ctx.stroke();
    }
    for (let y = 96; y < GAME_CONFIG.height; y += 96) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(GAME_CONFIG.width, y);
      ctx.stroke();
    }

    const glow = ctx.createRadialGradient(
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height * 0.24,
      10,
      GAME_CONFIG.width / 2,
      GAME_CONFIG.height * 0.24,
      GAME_CONFIG.width * 0.54,
    );
    glow.addColorStop(0, "rgba(255,255,255,0.72)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
  }

  function drawPlayer(player, shieldActive) {
    ctx.fillStyle = PALETTE.playerBase;
    ctx.beginPath();
    ctx.roundRect(player.x, player.y, player.width, player.height, 8);
    ctx.fill();
    ctx.strokeStyle = PALETTE.playerEdge;
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = PALETTE.playerHighlight;
    ctx.fillRect(player.x + 8, player.y + 3, player.width - 16, 3);

    if (shieldActive) {
      ctx.strokeStyle = PALETTE.shield;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.roundRect(player.x - 4, player.y - 4, player.width + 8, player.height + 8, 10);
      ctx.stroke();
    }
  }

  function drawCircle(entity, color) {
    const glow = ctx.createRadialGradient(entity.x, entity.y, entity.radius * 0.3, entity.x, entity.y, entity.radius * 1.9);
    glow.addColorStop(0, "rgba(255,255,255,0.18)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(entity.x, entity.y, entity.radius * 1.9, 0, Math.PI * 2);
    ctx.fill();

    ctx.beginPath();
    ctx.fillStyle = color;
    ctx.arc(entity.x, entity.y, entity.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.18)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.35)";
    ctx.beginPath();
    ctx.arc(entity.x - entity.radius * 0.28, entity.y - entity.radius * 0.28, entity.radius * 0.36, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawCenteredOverlay(title, subtitle, width, height, titleSize, subtitleSize) {
    const x = GAME_CONFIG.width / 2 - width / 2;
    const y = GAME_CONFIG.height / 2 - height / 2;
    ctx.fillStyle = PALETTE.overlayPanel;
    ctx.beginPath();
    ctx.roundRect(x, y, width, height, 24);
    ctx.fill();
    ctx.fillStyle = PALETTE.overlayText;
    ctx.textAlign = "center";
    ctx.font = `600 ${titleSize}px Inter, Segoe UI, sans-serif`;
    ctx.fillText(title, GAME_CONFIG.width / 2, GAME_CONFIG.height / 2 - 18);
    if (subtitle) {
      ctx.fillStyle = PALETTE.overlaySubtle;
      ctx.font = `500 ${subtitleSize}px Inter, Segoe UI, sans-serif`;
      ctx.fillText(subtitle, GAME_CONFIG.width / 2, GAME_CONFIG.height / 2 + 20);
    }
  }

  function drawGameOver(state) {
    ctx.fillStyle = PALETTE.overlay;
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    const title = state.result === "victory" ? "Victory" : state.result === "won" ? "Session Complete" : state.result === "aborted" ? "Run Aborted" : "Game Over";
    drawCenteredOverlay(title, `Final Score: ${state.score}`, 340, 138, 34, 18);
  }

  function drawPause() {
    ctx.fillStyle = "rgba(15, 23, 42, 0.16)";
    ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    drawCenteredOverlay("Paused", "", 236, 84, 30, 16);
  }

  function drawFeedback(state) {
    if (state.feedback.pulse > 0) {
      ctx.fillStyle = `rgba(255,255,255,${0.08 * state.feedback.pulse})`;
      ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    }
    if (state.feedback.hitFlash > 0) {
      ctx.fillStyle = `rgba(239,107,99,${0.14 * state.feedback.hitFlash})`;
      ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
    }
    ctx.textAlign = "center";
    state.feedback.popups.forEach((popup) => {
      const alpha = Math.max(0, popup.ttl / 0.7);
      ctx.fillStyle = `${PALETTE.popup[popup.tone] || "#334155"}${""}`;
      ctx.globalAlpha = alpha;
      ctx.font = "700 15px Inter, Segoe UI, sans-serif";
      ctx.fillText(popup.text, popup.x, popup.y);
      ctx.globalAlpha = 1;
    });
  }

  return {
    render(state) {
      clear();
      drawBoard();
      drawPlayer(state.player, isShieldActive(state));
      state.stars.forEach((star) => drawCircle(star, star.kind === "gold" ? PALETTE.goldStar : PALETTE.star));
      state.bombs.forEach((bomb) => drawCircle(bomb, PALETTE.bomb));
      state.powerUps.forEach((powerUp) => drawCircle(powerUp, getPowerUpColor(powerUp.type)));
      if (state.boss.target) drawCircle(state.boss.target, PALETTE.boss);
      if (state.effects.feverSecondsLeft > 0) {
        ctx.fillStyle = PALETTE.feverWash;
        ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
      }
      if (state.effects.freezeSecondsLeft > 0) {
        ctx.fillStyle = PALETTE.freezeWash;
        ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
      }
      if (state.boss.active) {
        ctx.fillStyle = PALETTE.bossWash;
        ctx.fillRect(0, 0, GAME_CONFIG.width, GAME_CONFIG.height);
      }
      drawFeedback(state);

      if (state.isGameOver) {
        drawGameOver(state);
      }
      if (state.isPaused && !state.isGameOver) {
        drawPause();
      }
    },
  };
}
