// HUD rendering: cash, wanted stars, HP, armour, weapon/ammo, objective, speedometer, radar, and state-aware prompt.
import {
  CONTROL_PROMPT_CAR,
  CONTROL_PROMPT_FOOT,
  FONTS,
  MISSION_GOLD,
  PANEL_BG,
  TEXT_WHITE,
  UI_CYAN,
} from '../config.js';
import { getCarKmh } from '../entities/car.js';
import { getActiveWeapon } from '../entities/player.js';
import { renderMinimap } from '../render/minimap.js';

function drawStar(ctx, cx, cy, outerR, innerR, filled) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const r = i % 2 === 0 ? outerR : innerR;
    const ang = -Math.PI / 2 + (i * Math.PI) / 5;
    const x = cx + Math.cos(ang) * r;
    const y = cy + Math.sin(ang) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = filled ? MISSION_GOLD : '#232c42';
  ctx.fill();
  ctx.strokeStyle = filled ? MISSION_GOLD : '#5b6480';
  ctx.lineWidth = 1.8;
  ctx.stroke();
}

function drawPanelBox(ctx, x, y, w, h) {
  ctx.fillStyle = PANEL_BG;
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = UI_CYAN;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(x, y, w, h);
}

export function renderHUD(ctx, world, vw, vh) {
  const { player, wanted } = world;
  const weapon = getActiveWeapon(player);
  const ammoSlot = player.ammo[weapon.id] || { mag: 12, reserve: 96 };

  ctx.save();
  ctx.textBaseline = 'middle';

  // 1. Top-Left Status Panel (Cash, Wanted Stars, Mute 'M', HP, Armour, Weapon & Ammo)
  const tlX = 20;
  const tlY = 18;
  const tlW = 468;
  const tlH = 168;
  drawPanelBox(ctx, tlX, tlY, tlW, tlH);

  // Row 1: Cash numeral + 5 Wanted Stars + Mute 'M' badge
  const row1Y = tlY + 32;
  ctx.font = FONTS.hudNumeral;
  ctx.fillStyle = UI_CYAN;
  ctx.textAlign = 'left';
  ctx.fillText(`$${player.cash.toLocaleString('en-US')}`, tlX + 20, row1Y);

  for (let s = 0; s < 5; s++) {
    drawStar(ctx, tlX + 216 + s * 32, row1Y - 1, 11.5, 5.2, s < wanted.stars);
  }

  ctx.font = FONTS.hudLabel;
  ctx.fillStyle = world.audio && world.audio.muted ? '#79849c' : UI_CYAN;
  ctx.textAlign = 'center';
  ctx.fillText('M', tlX + tlW - 30, row1Y);

  // Row 2: HP & ARM labels, cyan bars, and numerals
  const row2Y = tlY + 84;
  ctx.font = FONTS.hudLabel;
  ctx.fillStyle = TEXT_WHITE;
  ctx.textAlign = 'left';
  ctx.fillText('HP', tlX + 20, row2Y);

  const hpBarX = tlX + 68;
  const hpBarY = row2Y - 11;
  const hpBarW = 102;
  const hpBarH = 22;
  ctx.fillStyle = '#182236';
  ctx.fillRect(hpBarX, hpBarY, hpBarW, hpBarH);
  ctx.fillStyle = UI_CYAN;
  ctx.fillRect(hpBarX, hpBarY, Math.round(hpBarW * Math.max(0, Math.min(1, player.hp / 100))), hpBarH);
  ctx.strokeStyle = UI_CYAN;
  ctx.lineWidth = 2;
  ctx.strokeRect(hpBarX, hpBarY, hpBarW, hpBarH);

  ctx.font = FONTS.hudNumeral;
  ctx.fillStyle = TEXT_WHITE;
  ctx.fillText(String(player.hp), hpBarX + hpBarW + 10, row2Y);

  ctx.font = FONTS.hudLabel;
  ctx.fillStyle = TEXT_WHITE;
  ctx.fillText('ARM', tlX + 236, row2Y);

  const armBarX = tlX + 306;
  const armBarY = row2Y - 11;
  const armBarW = 86;
  const armBarH = 22;
  ctx.fillStyle = '#182236';
  ctx.fillRect(armBarX, armBarY, armBarW, armBarH);
  ctx.fillStyle = UI_CYAN;
  ctx.fillRect(armBarX, armBarY, Math.round(armBarW * Math.max(0, Math.min(1, player.armour / 100))), armBarH);
  ctx.strokeStyle = UI_CYAN;
  ctx.lineWidth = 2;
  ctx.strokeRect(armBarX, armBarY, armBarW, armBarH);

  ctx.font = FONTS.hudNumeral;
  ctx.fillStyle = TEXT_WHITE;
  ctx.fillText(String(player.armour), armBarX + armBarW + 10, row2Y);

  // Row 3: Weapon Name & Ammo Numeral
  const row3Y = tlY + 136;
  ctx.font = FONTS.hudLabel;
  ctx.fillStyle = UI_CYAN;
  ctx.textAlign = 'left';
  ctx.fillText(weapon.name, tlX + 20, row3Y);

  ctx.font = FONTS.hudNumeral;
  ctx.fillStyle = TEXT_WHITE;
  ctx.fillText(`${ammoSlot.mag}/${ammoSlot.reserve}`, tlX + 216, row3Y);

  // 2. Top-Center Objective Banner (single authoritative objective string, >=25px bold)
  const objX = 506;
  const objY = 18;
  const objW = 570;
  const objH = 64;
  drawPanelBox(ctx, objX, objY, objW, objH);

  ctx.fillStyle = MISSION_GOLD;
  ctx.beginPath();
  ctx.arc(objX + 28, objY + objH * 0.5, 8, 0, Math.PI * 2);
  ctx.fill();

  ctx.font = FONTS.hudLabel;
  ctx.fillStyle = TEXT_WHITE;
  ctx.textAlign = 'left';
  ctx.fillText(world.missions.objectiveText, objX + 48, objY + objH * 0.5 + 1);

  // 3. Top-Right 160x160 Radar + External RADAR header
  renderMinimap(ctx, world);

  // 4. Bottom-Left Vehicle Speedometer & Chassis Panel (when driving)
  if (player.car) {
    const car = player.car;
    const spX = 20;
    const spY = vh - 190;
    const spW = 342;
    const spH = 170;
    drawPanelBox(ctx, spX, spY, spW, spH);

    // Row 1: Vehicle model label (e.g. TURBO COUPE)
    ctx.font = FONTS.hudLabel;
    ctx.fillStyle = UI_CYAN;
    ctx.textAlign = 'left';
    ctx.fillText(car.label || 'TURBO COUPE', spX + 20, spY + 34);

    // Row 2: Speed numeral + DRIFT · KM/H label
    const kmh = getCarKmh(car);
    ctx.font = FONTS.hudNumeral;
    ctx.fillStyle = TEXT_WHITE;
    ctx.fillText(String(kmh), spX + 20, spY + 86);

    ctx.font = FONTS.hudLabel;
    ctx.fillStyle = UI_CYAN;
    ctx.fillText('DRIFT · KM/H', spX + 96, spY + 86);

    // Row 3: CHASSIS label + cyan health bar
    const chY = spY + 136;
    ctx.font = FONTS.hudLabel;
    ctx.fillStyle = TEXT_WHITE;
    ctx.fillText('CHASSIS', spX + 20, chY);

    const chBarX = spX + 150;
    const chBarW = 170;
    const chBarH = 22;
    ctx.fillStyle = '#182236';
    ctx.fillRect(chBarX, chY - 11, chBarW, chBarH);
    ctx.fillStyle = UI_CYAN;
    const chRatio = Math.max(0, Math.min(1, car.hp / car.maxHp));
    ctx.fillRect(chBarX, chY - 11, Math.round(chBarW * chRatio), chBarH);
    ctx.strokeStyle = UI_CYAN;
    ctx.lineWidth = 2;
    ctx.strokeRect(chBarX, chY - 11, chBarW, chBarH);
  }

  // 5. State-Aware Control Prompt Panel at bottom
  const promptText = player.car ? CONTROL_PROMPT_CAR : CONTROL_PROMPT_FOOT;
  ctx.font = FONTS.hudLabel;
  const measuredW = ctx.measureText(promptText).width;
  const prW = Math.min(vw - (player.car ? 400 : 60), Math.max(780, Math.ceil(measuredW + 48)));
  const prH = 64;
  const prX = player.car ? vw - prW - 20 : Math.round((vw - prW) * 0.5);
  const prY = vh - prH - 18;

  drawPanelBox(ctx, prX, prY, prW, prH);
  ctx.fillStyle = TEXT_WHITE;
  ctx.textAlign = 'center';
  ctx.fillText(promptText, prX + prW * 0.5, prY + prH * 0.5 + 1);

  ctx.restore();
}
