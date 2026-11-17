// Toast notification banner for mission briefings, completions, and shop purchases.
import { FONTS, PANEL_BG, TEXT_WHITE, UI_CYAN } from '../config.js';

export function createToastSystem() {
  return {
    items: [],
    push(text, duration = 2.6) {
      this.items = [{ text, life: duration, maxLife: duration }];
    },
    update(dt) {
      for (let i = this.items.length - 1; i >= 0; i--) {
        this.items[i].life -= dt;
        if (this.items[i].life <= 0) {
          this.items.splice(i, 1);
        }
      }
    },
  };
}

export function renderToasts(ctx, toast, vw) {
  if (!toast || toast.items.length === 0) return;
  const active = toast.items[0];

  ctx.save();
  ctx.font = FONTS.hudLabel;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const tw = ctx.measureText(active.text).width;
  const boxW = Math.max(360, Math.ceil(tw + 48));
  const boxH = 54;
  const boxX = Math.round((vw - boxW) * 0.5);
  const boxY = 96;

  ctx.fillStyle = PANEL_BG;
  ctx.fillRect(boxX, boxY, boxW, boxH);
  ctx.strokeStyle = UI_CYAN;
  ctx.lineWidth = 2;
  ctx.strokeRect(boxX, boxY, boxW, boxH);

  ctx.fillStyle = TEXT_WHITE;
  ctx.fillText(active.text, vw * 0.5, boxY + boxH * 0.5 + 1);
  ctx.restore();
}
