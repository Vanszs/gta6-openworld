// Visual effects state: tyre skid marks, drift smoke, muzzle flashes, sparks, and rain.

export function createEffects() {
  return {
    skids: [],
    smoke: [],
    sparks: [],
    flashes: [],
    rain: [],
    rainEnabled: false,
  };
}

export function seedRain(effects, count = 110) {
  effects.rain = [];
  for (let i = 0; i < count; i++) {
    effects.rain.push({
      x: (i * 97) % 1280,
      y: (i * 53) % 800,
      len: 18 + (i % 14),
      speed: 520 + (i % 5) * 45,
    });
  }
}

export function addSkid(effects, x1, y1, x2, y2, alpha = 0.55) {
  effects.skids.push({ x1, y1, x2, y2, alpha, life: 7.5, maxLife: 7.5 });
  if (effects.skids.length > 260) {
    effects.skids.shift();
  }
}

export function addSmoke(effects, x, y, vx = 0, vy = 0, size = 14) {
  effects.smoke.push({
    x,
    y,
    vx,
    vy,
    size,
    maxSize: size * 2.1,
    life: 0.75,
    maxLife: 0.75,
  });
  if (effects.smoke.length > 160) {
    effects.smoke.shift();
  }
}

export function addMuzzleFlash(effects, x, y, angle, size = 22) {
  effects.flashes.push({
    x,
    y,
    angle,
    size,
    life: 0.11,
    maxLife: 0.11,
  });
}

export function addSparks(effects, x, y, count = 8, baseAngle = 0) {
  for (let i = 0; i < count; i++) {
    const spread = (i / Math.max(1, count - 1) - 0.5) * 1.8;
    const ang = baseAngle + spread;
    const spd = 95 + (i % 4) * 45;
    effects.sparks.push({
      x,
      y,
      vx: Math.cos(ang) * spd,
      vy: Math.sin(ang) * spd,
      life: 0.28,
      maxLife: 0.28,
    });
  }
}

export function updateEffects(effects, dt) {
  for (let i = effects.skids.length - 1; i >= 0; i--) {
    const s = effects.skids[i];
    s.life -= dt;
    if (s.life <= 0) effects.skids.splice(i, 1);
  }

  for (let i = effects.smoke.length - 1; i >= 0; i--) {
    const p = effects.smoke[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.life -= dt;
    const t = 1 - Math.max(0, p.life / p.maxLife);
    p.currentSize = p.size + (p.maxSize - p.size) * t;
    if (p.life <= 0) effects.smoke.splice(i, 1);
  }

  for (let i = effects.flashes.length - 1; i >= 0; i--) {
    const f = effects.flashes[i];
    f.life -= dt;
    if (f.life <= 0) effects.flashes.splice(i, 1);
  }

  for (let i = effects.sparks.length - 1; i >= 0; i--) {
    const sp = effects.sparks[i];
    sp.x += sp.vx * dt;
    sp.y += sp.vy * dt;
    sp.life -= dt;
    if (sp.life <= 0) effects.sparks.splice(i, 1);
  }

  if (effects.rainEnabled && effects.rain.length > 0) {
    for (const drop of effects.rain) {
      drop.x = (drop.x - drop.speed * 0.24 * dt + 1280) % 1280;
      drop.y = (drop.y + drop.speed * dt) % 800;
    }
  }
}
