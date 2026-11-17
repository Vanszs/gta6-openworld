// Renders tyre skid marks, drift smoke, mission beacons, bullets, muzzle flashes, sparks, and rain.
import { MISSION_GOLD, TEXT_WHITE } from '../config.js';

export function renderGroundEffects(ctx, world) {
  const { effects, missions } = world;

  // 1. Tyre skid marks
  ctx.save();
  ctx.lineCap = 'round';
  for (const s of effects.skids) {
    const alpha = Math.max(0, (s.life / s.maxLife) * s.alpha);
    ctx.strokeStyle = `rgba(18, 22, 34, ${alpha.toFixed(2)})`;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(s.x1, s.y1);
    ctx.lineTo(s.x2, s.y2);
    ctx.stroke();
  }
  ctx.restore();

  // 2. Glowing gold (#ffd24a) mission beacon for reach/delivery missions
  const wp = missions.activeWaypoint;
  const isReachMission = missions.currentIndex === 0 || missions.currentIndex === 2;
  if (wp && isReachMission) {
    const pulse = (Math.sin(missions.beaconPulse) + 1) * 0.5;
    ctx.save();

    // Outer gold ground aura
    ctx.fillStyle = 'rgba(255, 210, 74, 0.24)';
    ctx.beginPath();
    ctx.arc(wp.x, wp.y, 44 + pulse * 10, 0, Math.PI * 2);
    ctx.fill();

    // Concentric gold rings
    ctx.strokeStyle = MISSION_GOLD;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(wp.x, wp.y, 32 + pulse * 6, 0, Math.PI * 2);
    ctx.stroke();

    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(wp.x, wp.y, 18, 0, Math.PI * 2);
    ctx.stroke();

    // Solid gold center diamond
    ctx.fillStyle = MISSION_GOLD;
    ctx.beginPath();
    ctx.arc(wp.x, wp.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

export function renderAirEffects(ctx, world) {
  const { effects, combat } = world;

  ctx.save();

  // 1. Drift tyre smoke puffs
  for (const p of effects.smoke) {
    const alpha = Math.max(0, (p.life / p.maxLife) * 0.58);
    ctx.fillStyle = `rgba(218, 228, 245, ${alpha.toFixed(2)})`;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.currentSize || p.size, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Bullet tracers
  for (const b of combat.bullets) {
    ctx.strokeStyle = TEXT_WHITE;
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(b.prevX, b.prevY);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  // 3. Muzzle flashes
  for (const f of effects.flashes) {
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.angle);

    ctx.fillStyle = 'rgba(255, 246, 210, 0.92)';
    ctx.beginPath();
    ctx.moveTo(0, -6);
    ctx.lineTo(f.size * 1.45, 0);
    ctx.lineTo(0, 6);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = TEXT_WHITE;
    ctx.beginPath();
    ctx.arc(3, 0, f.size * 0.36, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 4. Impact sparks
  ctx.strokeStyle = '#eef4ff';
  ctx.lineWidth = 2.5;
  for (const sp of effects.sparks) {
    ctx.beginPath();
    ctx.moveTo(sp.x, sp.y);
    ctx.lineTo(sp.x - sp.vx * 0.035, sp.y - sp.vy * 0.035);
    ctx.stroke();
  }

  ctx.restore();
}

export function renderScreenRain(ctx, world) {
  const { effects } = world;
  if (!effects.rainEnabled || effects.rain.length === 0) return;

  ctx.save();
  ctx.strokeStyle = 'rgba(210, 226, 255, 0.46)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  for (const drop of effects.rain) {
    ctx.moveTo(drop.x, drop.y);
    ctx.lineTo(drop.x - drop.len * 0.28, drop.y + drop.len);
  }
  ctx.stroke();
  ctx.restore();
}
