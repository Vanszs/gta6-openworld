// Master canvas renderer: orchestrates world layers, entities, lighting, effects, HUD, and screens.
import {
  ENEMY_ACCENT,
  MISSION_GOLD,
  POLICE_BLUE,
  POLICE_RED,
  POLICE_WHITE,
  TEXT_WHITE,
  UI_CYAN,
} from '../config.js';
import { renderHUD } from '../ui/hud.js';
import { renderPauseOverlay, renderTitleScreen } from '../ui/screens.js';
import { renderToasts } from '../ui/toast.js';
import { renderCityscape } from './cityscape.js';
import { renderAirEffects, renderGroundEffects, renderScreenRain } from './effects.js';
import { renderLighting } from './lighting.js';
import { renderRoadsAndWaterfront } from './roads.js';

function drawCar(ctx, car, isPlayerCar) {
  ctx.save();
  ctx.translate(car.x, car.y);
  ctx.rotate(car.angle);

  const w = car.length;
  const h = car.width;
  const hw = w * 0.5;
  const hh = h * 0.5;

  // Drop shadow
  ctx.fillStyle = 'rgba(10, 14, 24, 0.48)';
  ctx.beginPath();
  ctx.roundRect(-hw + 3, -hh + 4, w, h, 7);
  ctx.fill();

  // Body color: player car is strictly cyan #24f0ff, police is split red/blue/white, traffic uses NPC_COLORS
  const bodyColor = isPlayerCar ? UI_CYAN : car.isPolice ? POLICE_BLUE : car.color;
  ctx.fillStyle = bodyColor;
  ctx.beginPath();
  ctx.roundRect(-hw, -hh, w, h, 7);
  ctx.fill();

  ctx.strokeStyle = isPlayerCar ? TEXT_WHITE : '#181e2c';
  ctx.lineWidth = isPlayerCar ? 2 : 1.5;
  ctx.stroke();

  if (car.isPolice) {
    // White doors/roof panel
    ctx.fillStyle = POLICE_WHITE;
    ctx.fillRect(-hw * 0.42, -hh + 2, w * 0.44, h - 4);

    // Split red/blue roof lightbar
    ctx.fillStyle = POLICE_RED;
    ctx.fillRect(-4, -hh + 4, 8, h * 0.42);
    ctx.fillStyle = POLICE_BLUE;
    ctx.fillRect(-4, 1, 8, h * 0.42);
  } else {
    // Cabin roof & dark glass windshields
    ctx.fillStyle = '#182032';
    ctx.beginPath();
    ctx.roundRect(-hw * 0.48, -hh + 4, w * 0.52, h - 8, 4);
    ctx.fill();

    ctx.fillStyle = isPlayerCar ? UI_CYAN : bodyColor;
    ctx.fillRect(-hw * 0.22, -hh + 6, w * 0.24, h - 12);
  }

  // Headlight lenses
  ctx.fillStyle = '#f5f9ff';
  ctx.fillRect(hw - 4, -hh + 3, 4, 6);
  ctx.fillRect(hw - 4, hh - 9, 4, 6);

  // Tail lights
  ctx.fillStyle = car.isPolice ? POLICE_RED : '#d84b6a';
  ctx.fillRect(-hw, -hh + 3, 3, 6);
  ctx.fillRect(-hw, hh - 9, 3, 6);

  ctx.restore();
}

function drawPedestrian(ctx, ped) {
  ctx.save();
  ctx.translate(ped.x, ped.y);

  // Enemies MUST have a thick 3px magenta (#ff2b8f) ring
  if (ped.role === 'enemy') {
    ctx.fillStyle = 'rgba(255, 43, 143, 0.18)';
    ctx.beginPath();
    ctx.arc(0, 0, 21, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = ENEMY_ACCENT;
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, Math.PI * 2);
    ctx.stroke();
  } else if (ped.role === 'police') {
    ctx.strokeStyle = POLICE_BLUE;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(0, 0, 17, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.rotate(ped.angle);

  // Shadow
  ctx.fillStyle = 'rgba(10, 14, 24, 0.45)';
  ctx.beginPath();
  ctx.arc(2, 3, ped.radius + 1, 0, Math.PI * 2);
  ctx.fill();

  // Shoulders / torso
  ctx.fillStyle = ped.role === 'enemy' ? ENEMY_ACCENT : ped.role === 'police' ? POLICE_BLUE : ped.color;
  ctx.beginPath();
  ctx.roundRect(-8, -11, 16, 22, 6);
  ctx.fill();
  ctx.strokeStyle = '#141926';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  if (ped.role === 'police') {
    ctx.fillStyle = POLICE_RED;
    ctx.fillRect(-6, -10, 12, 5);
  }

  // Gun barrel for enemies and police
  if (ped.role === 'enemy' || ped.role === 'police') {
    ctx.fillStyle = '#d4deef';
    ctx.fillRect(4, 3, 12, 3.5);
  }

  // Head
  ctx.fillStyle = '#e8d2c4';
  ctx.beginPath();
  ctx.arc(0, 0, 6.2, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

function drawPlayerOnFoot(ctx, player) {
  if (player.car || player.dead) return;

  ctx.save();
  ctx.translate(player.x, player.y);

  // Locked cyan (#24f0ff) on-foot ring
  ctx.fillStyle = 'rgba(36, 240, 255, 0.18)';
  ctx.beginPath();
  ctx.arc(0, 0, 22, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = UI_CYAN;
  ctx.lineWidth = 3.5;
  ctx.beginPath();
  ctx.arc(0, 0, 21, 0, Math.PI * 2);
  ctx.stroke();

  ctx.rotate(player.angle);

  // Shoulders
  ctx.fillStyle = UI_CYAN;
  ctx.beginPath();
  ctx.roundRect(-9, -12, 18, 24, 7);
  ctx.fill();
  ctx.strokeStyle = '#0c1220';
  ctx.lineWidth = 2;
  ctx.stroke();

  // Weapon barrel
  ctx.fillStyle = TEXT_WHITE;
  ctx.fillRect(5, 3, 14, 4);

  // Head
  ctx.fillStyle = '#f2e4dc';
  ctx.beginPath();
  ctx.arc(0, 0, 6.5, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
}

export function renderFrame(ctx, world, camera, appState) {
  const vw = camera.viewportW;
  const vh = camera.viewportH;

  ctx.clearRect(0, 0, vw, vh);

  ctx.save();
  ctx.translate(Math.round(vw * 0.5 - camera.x), Math.round(vh * 0.5 - camera.y));

  // Layer 1: Roads, sidewalks, park, signal gantries, and waterfront
  renderRoadsAndWaterfront(ctx, world, camera);

  // Layer 2: Skid marks and mission beacon
  renderGroundEffects(ctx, world);

  // Layer 3: Streetlamp glow, headlight cones, police siren flashers, storefront neon
  renderLighting(ctx, world, camera);

  // Layer 4: Pedestrians, enemies, and police officers
  for (const ped of world.pedestrians) {
    if (!ped.dead) drawPedestrian(ctx, ped);
  }

  // Layer 5: Player on foot (hidden during title screen backdrop)
  if (appState.mode !== 'title') {
    drawPlayerOnFoot(ctx, world.player);
  }

  // Layer 6: Vehicles
  for (const car of world.cars) {
    if (!car.destroyed) {
      drawCar(ctx, car, car === world.player.car || car.isPlayerOwned);
    }
  }

  // Layer 7: Smoke, bullets, muzzle flashes, sparks
  renderAirEffects(ctx, world);

  // Layer 8: Buildings, containers, harbor crane, and rooftop shop signs (33px bold)
  renderCityscape(ctx, world, camera);

  ctx.restore();

  // Layer 9: Screen-space rain
  renderScreenRain(ctx, world);

  // Layer 10: UI (Title screen OR HUD + Pause overlay)
  if (appState.mode === 'title') {
    renderTitleScreen(ctx, vw, vh);
  } else {
    renderHUD(ctx, world, vw, vh);
    renderToasts(ctx, world.toast, vw);
    if (appState.mode === 'paused') {
      renderPauseOverlay(ctx, world, vw, vh);
    }
  }
}
