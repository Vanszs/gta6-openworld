// Title screen (NEON WAKE logo card, white 38px bold PRESS ENTER TO START, 33px bold control legend)
// and Pause / Save / Load overlay.
import {
  CONTROL_LEGEND_ITEMS,
  FONTS,
  PANEL_BG,
  TEXT_WHITE,
  UI_CYAN,
} from '../config.js';
import { hasSaveGame } from '../systems/save.js';

export function renderTitleScreen(ctx, vw, vh) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 1. Upper-Center NEON WAKE Logo Card (dark backing >= 0.88 alpha, cyan border)
  const cardW = 600;
  const cardH = 212;
  const cardX = Math.round((vw - cardW) * 0.5);
  const cardY = 78;

  ctx.fillStyle = PANEL_BG;
  ctx.fillRect(cardX, cardY, cardW, cardH);
  ctx.strokeStyle = UI_CYAN;
  ctx.lineWidth = 3;
  ctx.strokeRect(cardX, cardY, cardW, cardH);

  // Inner accent line
  ctx.strokeStyle = 'rgba(36, 240, 255, 0.35)';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(cardX + 8, cardY + 8, cardW - 16, cardH - 16);

  // Title: NEON WAKE
  ctx.font = FONTS.titleLogo;
  ctx.fillStyle = UI_CYAN;
  ctx.fillText('NEON WAKE', vw * 0.5, cardY + 62);

  // Subtitle
  ctx.font = FONTS.titleSub;
  ctx.fillStyle = '#d6e4ff';
  ctx.fillText('HARBOR SYNDICATE · OPEN WORLD CRIME', vw * 0.5, cardY + 116);

  // Prompt: PRESS ENTER TO START (strictly white #ffffff, 38px bold -> cap >= 27px)
  ctx.font = FONTS.titleStart;
  ctx.fillStyle = TEXT_WHITE;
  ctx.fillText('PRESS ENTER TO START', vw * 0.5, cardY + 172);

  // 2. Lower-Center Four-Item Control Legend Card (33px bold -> cap >= 24px)
  const legW = 820;
  const legH = 166;
  const legX = Math.round((vw - legW) * 0.5);
  const legY = vh - legH - 46;

  ctx.fillStyle = PANEL_BG;
  ctx.fillRect(legX, legY, legW, legH);
  ctx.strokeStyle = UI_CYAN;
  ctx.lineWidth = 3;
  ctx.strokeRect(legX, legY, legW, legH);

  ctx.font = FONTS.controlLegend;
  ctx.fillStyle = TEXT_WHITE;

  const col1X = legX + legW * 0.27;
  const col2X = legX + legW * 0.73;
  const row1Y = legY + 52;
  const row2Y = legY + 116;

  ctx.fillText(CONTROL_LEGEND_ITEMS[0], col1X, row1Y); // [WASD] DRIVE
  ctx.fillText(CONTROL_LEGEND_ITEMS[1], col2X, row1Y); // [SPACE] DRIFT
  ctx.fillText(CONTROL_LEGEND_ITEMS[2], col1X, row2Y); // [LMB] FIRE
  ctx.fillText(CONTROL_LEGEND_ITEMS[3], col2X, row2Y); // [F] HIJACK

  ctx.restore();
}

export function renderPauseOverlay(ctx, world, vw, vh) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const boxW = 580;
  const boxH = 310;
  const boxX = Math.round((vw - boxW) * 0.5);
  const boxY = Math.round((vh - boxH) * 0.5);

  ctx.fillStyle = PANEL_BG;
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = UI_CYAN;
  ctx.lineWidth = 3;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  ctx.font = FONTS.titleStart;
  ctx.fillStyle = UI_CYAN;
  ctx.fillText('PAUSED', vw * 0.5, boxY + 52);

  ctx.font = FONTS.hudLabel;
  ctx.fillStyle = TEXT_WHITE;
  ctx.fillText('[ENTER / ESC] RESUME GAME', vw * 0.5, boxY + 122);
  ctx.fillText('[K] SAVE PROGRESS TO STORAGE', vw * 0.5, boxY + 172);
  ctx.fillStyle = hasSaveGame() ? TEXT_WHITE : '#79849c';
  ctx.fillText('[L] LOAD SAVED GAME', vw * 0.5, boxY + 222);
  ctx.fillStyle = UI_CYAN;
  ctx.fillText(`[M] AUDIO: ${world.audio && world.audio.muted ? 'MUTED' : 'ACTIVE'}`, vw * 0.5, boxY + 270);

  ctx.restore();
}
