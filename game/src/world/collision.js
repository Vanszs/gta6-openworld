// Spatial collision queries and circle-vs-world resolution for buildings, containers, and water.
import { WORLD_HEIGHT, WORLD_WIDTH } from '../config.js';

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function isOnPier(city, x, y, pad = 0) {
  for (const pier of city.waterfront.piers) {
    if (
      x >= pier.x - pad &&
      x <= pier.x + pier.w + pad &&
      y >= pier.y - pad &&
      y <= pier.y + pier.h + pad
    ) {
      return true;
    }
  }
  return false;
}

export function isInWater(city, x, y, radius = 0) {
  if (isOnPier(city, x, y, -Math.min(6, radius * 0.4))) {
    return false;
  }
  const wm = city.waterfront.waterMain;
  if (x + radius > wm.x && y + radius > wm.y) {
    return true;
  }
  const wn = city.waterfront.waterNorthBay;
  if (x + radius > wn.x && y - radius < wn.y + wn.h) {
    return true;
  }
  return false;
}

export function resolveCircleRect(x, y, r, rect) {
  const closestX = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  const dx = x - closestX;
  const dy = y - closestY;
  const distSq = dx * dx + dy * dy;

  if (distSq >= r * r) return null;

  if (distSq > 0.0001) {
    const dist = Math.sqrt(distSq);
    const overlap = r - dist;
    return {
      x: x + (dx / dist) * overlap,
      y: y + (dy / dist) * overlap,
      nx: dx / dist,
      ny: dy / dist,
      hit: true,
    };
  }

  // Center is inside rect: push out along minimum penetration axis
  const leftPen = x - rect.x;
  const rightPen = rect.x + rect.w - x;
  const topPen = y - rect.y;
  const bottomPen = rect.y + rect.h - y;
  const minPen = Math.min(leftPen, rightPen, topPen, bottomPen);

  if (minPen === leftPen) return { x: rect.x - r, y, nx: -1, ny: 0, hit: true };
  if (minPen === rightPen) return { x: rect.x + rect.w + r, y, nx: 1, ny: 0, hit: true };
  if (minPen === topPen) return { x, y: rect.y - r, nx: 0, ny: -1, hit: true };
  return { x, y: rect.y + rect.h + r, nx: 0, ny: 1, hit: true };
}

export function resolveWorldCollision(city, x, y, r) {
  let cx = Math.max(r + 12, Math.min(WORLD_WIDTH - r - 12, x));
  let cy = Math.max(r + 12, Math.min(WORLD_HEIGHT - r - 12, y));
  let collided = false;
  let normalX = 0;
  let normalY = 0;

  for (const b of city.buildings) {
    const res = resolveCircleRect(cx, cy, r, b);
    if (res) {
      cx = res.x;
      cy = res.y;
      normalX = res.nx;
      normalY = res.ny;
      collided = true;
    }
  }

  for (const c of city.waterfront.containers) {
    if (c.tier !== 1) continue;
    const res = resolveCircleRect(cx, cy, r, c);
    if (res) {
      cx = res.x;
      cy = res.y;
      normalX = res.nx;
      normalY = res.ny;
      collided = true;
    }
  }

  // Prevent entering harbor water unless on a wooden pier
  if (isInWater(city, cx, cy, r)) {
    const onPierY = city.waterfront.piers.find(
      (p) => cy >= p.y + r * 0.5 && cy <= p.y + p.h - r * 0.5,
    );
    if (onPierY) {
      const maxPierX = onPierY.x + onPierY.w - r;
      if (cx > maxPierX) {
        cx = maxPierX;
        normalX = -1;
        collided = true;
      }
    } else {
      const limitX = cy >= 1460 ? city.waterfront.waterMain.x - r : city.waterfront.waterNorthBay.x - r;
      if (cx > limitX) {
        cx = limitX;
        normalX = -1;
        collided = true;
      }
    }
  }

  return { x: cx, y: cy, collided, nx: normalX, ny: normalY };
}

export function hitsBuildingOrContainer(city, x, y, r = 3) {
  for (const b of city.buildings) {
    if (x + r >= b.x && x - r <= b.x + b.w && y + r >= b.y && y - r <= b.y + b.h) {
      return true;
    }
  }
  for (const c of city.waterfront.containers) {
    if (c.tier === 1 && x + r >= c.x && x - r <= c.x + c.w && y + r >= c.y && y - r <= c.y + c.h) {
      return true;
    }
  }
  return false;
}
