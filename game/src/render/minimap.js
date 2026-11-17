// 160x160 radar with external RADAR label (25px bold), 6px inset clamping,
// four semantic blip types, and gold route polyline (lineWidth >= 3) drawn above blips.
import {
  FONTS,
  MISSION_GOLD,
  PANEL_BG,
  POLICE_BLUE,
  POLICE_RED,
  SHOP_ACCENT,
  TEXT_WHITE,
  UI_CYAN,
} from '../config.js';

export const RADAR_RECT = Object.freeze({
  x: 1096,
  y: 66,
  w: 160,
  h: 160,
});

export function renderMinimap(ctx, world) {
  const { x: rx, y: ry, w: rw, h: rh } = RADAR_RECT;
  const cx = rx + rw * 0.5;
  const cy = ry + rh * 0.5;
  const scale = 0.072; // Maps ~1100 world units across the 80px half-width
  const { player, city, cars, pedestrians, missions } = world;

  ctx.save();

  // 1. External RADAR header pill (strictly outside the 160x160 radar rectangle!)
  const headerH = 42;
  const headerY = ry - headerH - 4;
  ctx.fillStyle = PANEL_BG;
  ctx.fillRect(rx, headerY, rw, headerH);
  ctx.strokeStyle = UI_CYAN;
  ctx.lineWidth = 2;
  ctx.strokeRect(rx, headerY, rw, headerH);

  ctx.font = FONTS.hudLabel;
  ctx.fillStyle = UI_CYAN;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('RADAR', cx, headerY + headerH * 0.5 + 1);

  // 2. 160x160 Radar viewport backing
  ctx.fillStyle = 'rgba(8, 11, 20, 0.94)';
  ctx.fillRect(rx, ry, rw, rh);

  // Clip road grid to radar interior
  ctx.save();
  ctx.beginPath();
  ctx.rect(rx + 2, ry + 2, rw - 4, rh - 4);
  ctx.clip();

  // Subtle road network inside radar
  ctx.strokeStyle = '#2d374f';
  ctx.lineWidth = 5;
  for (const rhRoad of city.roadsH) {
    const my = cy + (rhRoad.y - player.y) * scale;
    const mx1 = cx + (rhRoad.xMin - player.x) * scale;
    const mx2 = cx + (rhRoad.xMax - player.x) * scale;
    ctx.beginPath();
    ctx.moveTo(mx1, my);
    ctx.lineTo(mx2, my);
    ctx.stroke();
  }
  for (const rvRoad of city.roadsV) {
    const mx = cx + (rvRoad.x - player.x) * scale;
    const my1 = cy + (rvRoad.yMin - player.y) * scale;
    const my2 = cy + (rvRoad.yMax - player.y) * scale;
    ctx.beginPath();
    ctx.moveTo(mx, my1);
    ctx.lineTo(mx, my2);
    ctx.stroke();
  }
  ctx.restore();

  // Helper: clamp every blip center at least 12px inside the 160x160 radar viewport
  // so with blip half-size <= 6px, every blip pixel stays >= 6px inside the radar border.
  const minX = rx + 12;
  const maxX = rx + rw - 12;
  const minY = ry + 12;
  const maxY = ry + rh - 12;
  const clampBlip = (wx, wy) => ({
    x: Math.max(minX, Math.min(maxX, cx + (wx - player.x) * scale)),
    y: Math.max(minY, Math.min(maxY, cy + (wy - player.y) * scale)),
  });

  // 3. Blip Type 1: Magenta shop squares with a dot
  for (const shop of city.shops) {
    const pos = clampBlip(shop.padX, shop.padY);
    ctx.fillStyle = SHOP_ACCENT;
    ctx.fillRect(pos.x - 5, pos.y - 5, 10, 10);
    ctx.fillStyle = TEXT_WHITE;
    ctx.fillRect(pos.x - 1.5, pos.y - 1.5, 3, 3);
  }

  // 4. Blip Type 2: Split red/blue police squares (cruisers + officers on foot)
  for (const car of cars) {
    if (!car.isPolice || car.destroyed || car === player.car) continue;
    const pos = clampBlip(car.x, car.y);
    ctx.fillStyle = POLICE_RED;
    ctx.fillRect(pos.x - 5, pos.y - 5, 5, 10);
    ctx.fillStyle = POLICE_BLUE;
    ctx.fillRect(pos.x, pos.y - 5, 5, 10);
    ctx.strokeStyle = TEXT_WHITE;
    ctx.lineWidth = 1;
    ctx.strokeRect(pos.x - 5, pos.y - 5, 10, 10);
  }
  for (const ped of pedestrians) {
    if (ped.dead || ped.role !== 'police') continue;
    const pos = clampBlip(ped.x, ped.y);
    ctx.fillStyle = POLICE_RED;
    ctx.fillRect(pos.x - 4, pos.y - 4, 4, 8);
    ctx.fillStyle = POLICE_BLUE;
    ctx.fillRect(pos.x, pos.y - 4, 4, 8);
  }

  // 5. Blip Type 3: Gold objective circle
  let waypointBlip = null;
  if (missions.activeWaypoint) {
    waypointBlip = clampBlip(missions.activeWaypoint.x, missions.activeWaypoint.y);
    ctx.fillStyle = MISSION_GOLD;
    ctx.beginPath();
    ctx.arc(waypointBlip.x, waypointBlip.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#080b14';
    ctx.lineWidth = 1.5;
    ctx.stroke();
  }

  // 6. Blip Type 4: Cyan player chevron at radar center
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(player.angle);
  ctx.fillStyle = UI_CYAN;
  ctx.beginPath();
  ctx.moveTo(8, 0);
  ctx.lineTo(-6, -6);
  ctx.lineTo(-3, 0);
  ctx.lineTo(-6, 6);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // 7. Gold route polyline from player to active waypoint (lineWidth >= 3, drawn ABOVE the blips!)
  if (waypointBlip) {
    const midX = waypointBlip.x;
    const midY = cy;
    ctx.strokeStyle = MISSION_GOLD;
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(midX, midY);
    ctx.lineTo(waypointBlip.x, waypointBlip.y);
    ctx.stroke();

    // Re-stroke objective ring cap so endpoint is crisp
    ctx.fillStyle = MISSION_GOLD;
    ctx.beginPath();
    ctx.arc(waypointBlip.x, waypointBlip.y, 4.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // 8. Cyan radar frame border
  ctx.strokeStyle = UI_CYAN;
  ctx.lineWidth = 2.5;
  ctx.strokeRect(rx, ry, rw, rh);

  ctx.restore();
}
