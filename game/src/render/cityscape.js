// Renders buildings (slate/violet trims, lit window grids dimmed behind shop signs),
// harbor containers, gantry crane, and rooftop shop signs in solid dark pills (33px bold).
import { FONTS, PANEL_BG_SOLID, SHOP_ACCENT, TEXT_WHITE, TRIM_SLATE } from '../config.js';

export function renderCityscape(ctx, world, camera) {
  const { city } = world;
  const viewLeft = camera.x - camera.viewportW * 0.5 - 120;
  const viewRight = camera.x + camera.viewportW * 0.5 + 120;
  const viewTop = camera.y - camera.viewportH * 0.5 - 120;
  const viewBottom = camera.y + camera.viewportH * 0.5 + 120;

  // 1. Render shop service pads on sidewalks/plazas
  for (const shop of city.shops) {
    if (shop.padX < viewLeft || shop.padX > viewRight || shop.padY < viewTop || shop.padY > viewBottom) {
      continue;
    }
    ctx.save();
    ctx.fillStyle = 'rgba(255, 43, 143, 0.22)';
    ctx.beginPath();
    ctx.arc(shop.padX, shop.padY, 24, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = SHOP_ACCENT;
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.restore();
  }

  // 2. Render buildings, roof trims (strictly #5b6480 slate or #6d5b8e violet), and window grids
  for (const b of city.buildings) {
    if (b.x + b.w < viewLeft || b.x > viewRight || b.y + b.h < viewTop || b.y > viewBottom) {
      continue;
    }

    // Drop shadow
    ctx.fillStyle = 'rgba(14, 18, 30, 0.42)';
    ctx.fillRect(b.x + 8, b.y + 10, b.w, b.h);

    // Outer building body
    ctx.fillStyle = b.baseColor;
    ctx.fillRect(b.x, b.y, b.w, b.h);

    // Inner roof deck
    ctx.fillStyle = b.roofColor;
    ctx.fillRect(b.x + 8, b.y + 8, b.w - 16, b.h - 16);

    // Locked palette trim: slate #5b6480 or violet #6d5b8e
    ctx.strokeStyle = b.trim || TRIM_SLATE;
    ctx.lineWidth = 3;
    ctx.strokeRect(b.x + 1.5, b.y + 1.5, b.w - 3, b.h - 3);
    ctx.lineWidth = 1.5;
    ctx.strokeRect(b.x + 9, b.y + 9, b.w - 18, b.h - 18);

    // Window grid (automatically dimmed behind rooftop shop sign pill!)
    const sign = b.shop;
    for (const win of b.windows) {
      const behindSign =
        sign &&
        Math.abs(win.x + win.w * 0.5 - sign.signX) < 155 &&
        Math.abs(win.y + win.h * 0.5 - sign.signY) < 46;

      if (behindSign) {
        ctx.fillStyle = '#252c3e';
      } else if (win.lit) {
        ctx.fillStyle = win.color;
      } else {
        ctx.fillStyle = '#2b3347';
      }
      ctx.fillRect(win.x, win.y, win.w, win.h);
    }

    // Rooftop architectural details (away from shop sign)
    const cx = b.x + b.w * 0.5;
    const cy = b.y + (sign ? b.h * 0.3 : b.h * 0.5);
    if (b.roofType === 'helipad' && b.w >= 220 && !sign) {
      ctx.strokeStyle = b.trim;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(cx, cy, 34, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#9aa8c8';
      ctx.fillRect(cx - 12, cy - 14, 5, 28);
      ctx.fillRect(cx + 7, cy - 14, 5, 28);
      ctx.fillRect(cx - 12, cy - 2, 24, 5);
    } else if (b.roofType === 'skylight') {
      ctx.fillStyle = '#4e5d7e';
      ctx.fillRect(b.x + 24, b.y + 22, Math.min(72, b.w - 48), 24);
      ctx.strokeStyle = b.trim;
      ctx.lineWidth = 2;
      ctx.strokeRect(b.x + 24, b.y + 22, Math.min(72, b.w - 48), 24);
    } else {
      ctx.fillStyle = '#48526c';
      ctx.fillRect(b.x + 22, b.y + 20, 28, 22);
      ctx.fillRect(b.x + 58, b.y + 20, 28, 22);
    }
  }

  // 3. Render stacked shipping containers at the docks
  const { containers, crane } = city.waterfront;
  for (const tier of [1, 2]) {
    for (const c of containers) {
      if (c.tier !== tier) continue;
      ctx.fillStyle = 'rgba(12, 16, 28, 0.45)';
      ctx.fillRect(c.x + 4, c.y + 5, c.w, c.h);

      ctx.fillStyle = c.color;
      ctx.fillRect(c.x, c.y, c.w, c.h);

      ctx.strokeStyle = '#252c3d';
      ctx.lineWidth = 2;
      ctx.strokeRect(c.x, c.y, c.w, c.h);

      // Corrugation ribs
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.22)';
      ctx.lineWidth = 1.5;
      for (let rx = c.x + 8; rx < c.x + c.w - 6; rx += 8) {
        ctx.beginPath();
        ctx.moveTo(rx, c.y + 3);
        ctx.lineTo(rx, c.y + c.h - 3);
        ctx.stroke();
      }
    }
  }

  // 4. Render Harbor Gantry Crane
  if (crane.x + crane.w >= viewLeft && crane.x <= viewRight) {
    ctx.save();
    // Portal legs on rails
    ctx.fillStyle = '#5b6480';
    ctx.fillRect(crane.railX1 - 6, crane.y, 14, crane.h);
    ctx.fillRect(crane.railX2 - 6, crane.y, 14, crane.h);

    // Twin overhead boom girders spanning over containers and water
    ctx.fillStyle = '#6d5b8e';
    ctx.fillRect(crane.x, crane.y + 12, crane.w, 16);
    ctx.fillRect(crane.x, crane.y + crane.h - 28, crane.w, 16);

    // Cross bracing trusses
    ctx.strokeStyle = '#9aa8c6';
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let gx = crane.x + 16; gx < crane.x + crane.w - 24; gx += 36) {
      ctx.moveTo(gx, crane.y + 20);
      ctx.lineTo(gx + 24, crane.y + crane.h - 20);
      ctx.moveTo(gx + 24, crane.y + 20);
      ctx.lineTo(gx, crane.y + crane.h - 20);
    }
    ctx.stroke();

    // Trolley & operator cabin
    ctx.fillStyle = '#3d4760';
    ctx.fillRect(crane.cabX, crane.y + 24, 52, crane.h - 48);
    ctx.strokeStyle = '#b4c2de';
    ctx.lineWidth = 2;
    ctx.strokeRect(crane.cabX, crane.y + 24, 52, crane.h - 48);
    ctx.restore();
  }

  // 5. Render Rooftop Shop Signs (33px bold inside solid dark pills with SHOP_ACCENT border)
  ctx.save();
  ctx.font = FONTS.shopSign;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  for (const b of city.buildings) {
    if (!b.shop) continue;
    const shop = b.shop;
    if (shop.signX < viewLeft || shop.signX > viewRight || shop.signY < viewTop || shop.signY > viewBottom) {
      continue;
    }

    const label = shop.name;
    const textW = ctx.measureText(label).width;
    const pillW = Math.max(150, Math.ceil(textW + 44));
    const pillH = 56;
    const px = Math.round(shop.signX - pillW * 0.5);
    const py = Math.round(shop.signY - pillH * 0.5);

    // Dimmed backing recess around sign so window grid behind never bleeds into pill
    ctx.fillStyle = 'rgba(14, 18, 28, 0.85)';
    ctx.fillRect(px - 8, py - 6, pillW + 16, pillH + 12);

    // Solid dark pill (alpha >= 0.88)
    ctx.fillStyle = PANEL_BG_SOLID;
    ctx.beginPath();
    ctx.roundRect(px, py, pillW, pillH, 12);
    ctx.fill();

    // Locked SHOP_ACCENT (#ff2b8f) border
    ctx.strokeStyle = SHOP_ACCENT;
    ctx.lineWidth = 3;
    ctx.stroke();

    // 33px bold white shop title
    ctx.fillStyle = TEXT_WHITE;
    ctx.fillText(label, shop.signX, shop.signY + 1);
  }
  ctx.restore();
}
