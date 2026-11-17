// Renders streetlamp pools, vehicle headlight cones, police siren flashers, and shopfront neon glow.
import { POLICE_BLUE, POLICE_RED, SHOP_ACCENT } from '../config.js';

export function renderLighting(ctx, world, camera) {
  const { city, cars } = world;
  const viewLeft = camera.x - camera.viewportW * 0.5 - 220;
  const viewRight = camera.x + camera.viewportW * 0.5 + 220;
  const viewTop = camera.y - camera.viewportH * 0.5 - 220;
  const viewBottom = camera.y + camera.viewportH * 0.5 + 220;

  ctx.save();

  // 1. Warm-white streetlamp pools along sidewalks and intersections
  for (const lamp of city.streetlamps) {
    if (lamp.x < viewLeft || lamp.x > viewRight || lamp.y < viewTop || lamp.y > viewBottom) {
      continue;
    }
    ctx.fillStyle = 'rgba(226, 234, 255, 0.14)';
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 68, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#eef4ff';
    ctx.beginPath();
    ctx.arc(lamp.x, lamp.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // 2. Magenta storefront awning glow in front of each shop
  for (const shop of city.shops) {
    if (shop.padX < viewLeft || shop.padX > viewRight || shop.padY < viewTop || shop.padY > viewBottom) {
      continue;
    }
    ctx.fillStyle = 'rgba(255, 43, 143, 0.16)';
    ctx.beginPath();
    ctx.ellipse(shop.padX, shop.padY - 12, 88, 38, 0, 0, Math.PI * 2);
    ctx.fill();

    // Neon strip bar along building front
    ctx.fillStyle = SHOP_ACCENT;
    ctx.fillRect(shop.padX - 58, shop.padY - 34, 116, 5);
  }

  // 3. Vehicle headlight cones & police cruiser red/blue lightbar halos
  for (const car of cars) {
    if (car.destroyed) continue;
    if (car.x < viewLeft || car.x > viewRight || car.y < viewTop || car.y > viewBottom) {
      continue;
    }

    if (car.headlightsOn) {
      ctx.save();
      ctx.translate(car.x, car.y);
      ctx.rotate(car.angle);

      const frontX = car.length * 0.48;
      ctx.fillStyle = 'rgba(236, 244, 255, 0.23)';
      ctx.beginPath();
      ctx.moveTo(frontX, -car.width * 0.32);
      ctx.lineTo(frontX + 165, -72);
      ctx.lineTo(frontX + 165, 72);
      ctx.lineTo(frontX, car.width * 0.32);
      ctx.closePath();
      ctx.fill();

      ctx.fillStyle = 'rgba(248, 252, 255, 0.32)';
      ctx.beginPath();
      ctx.moveTo(frontX, -car.width * 0.24);
      ctx.lineTo(frontX + 95, -36);
      ctx.lineTo(frontX + 95, 36);
      ctx.lineTo(frontX, car.width * 0.24);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    if (car.isPolice && car.sirenActive) {
      const redStrong = Math.sin(car.sirenPhase) >= 0;
      ctx.fillStyle = redStrong ? 'rgba(255, 51, 75, 0.26)' : 'rgba(47, 123, 255, 0.26)';
      ctx.beginPath();
      ctx.arc(car.x, car.y, 64, 0, Math.PI * 2);
      ctx.fill();

      // Secondary opposite pulse
      ctx.fillStyle = redStrong ? POLICE_RED : POLICE_BLUE;
      ctx.globalAlpha = 0.35;
      ctx.beginPath();
      ctx.arc(car.x, car.y, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }
  }

  ctx.restore();
}
