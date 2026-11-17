// Traffic AI: lane driving, intersection turns, stopping for red lights and for the player/vehicles.
import { WORLD_HEIGHT, WORLD_WIDTH } from '../config.js';
import { stepCarKinematics } from '../entities/car.js';
import { getSignalState } from '../world/signals.js';

export function updateTraffic(world, dt) {
  const { cars, city, signals, player } = world;

  for (const car of cars) {
    if (!car.isTraffic || car.driver === 'player' || car.destroyed) continue;

    const cruiseSpeed = car.archetype === 'hauler' ? 135 : 165;
    let targetSpeed = cruiseSpeed;

    const fwdX = Math.cos(car.angle);
    const fwdY = Math.sin(car.angle);

    // 1. Stop for player on foot or player's car ahead
    const px = player.x - car.x;
    const py = player.y - car.y;
    const pDist = Math.hypot(px, py);
    if (pDist < 135) {
      const dot = (px * fwdX + py * fwdY) / Math.max(1, pDist);
      if (dot > 0.65) {
        targetSpeed = 0;
      }
    }

    // 2. Stop for other cars ahead in same lane
    for (const other of cars) {
      if (other === car) continue;
      const ox = other.x - car.x;
      const oy = other.y - car.y;
      const oDist = Math.hypot(ox, oy);
      if (oDist < 115) {
        const dot = (ox * fwdX + oy * fwdY) / Math.max(1, oDist);
        if (dot > 0.72) {
          targetSpeed = 0;
          break;
        }
      }
    }

    // 3. Check approaching intersection signal light & occasional turns
    for (const inter of signals.intersections) {
      const ix = inter.x - car.x;
      const iy = inter.y - car.y;
      const dist = Math.hypot(ix, iy);
      if (dist < 140 && dist > 38) {
        const dot = (ix * fwdX + iy * fwdY) / dist;
        if (dot > 0.75) {
          const light = getSignalState(signals, inter, car.axis);
          if (light !== 'green') {
            targetSpeed = 0;
          }
        }
      } else if (dist <= 22 && (!car.lastTurnInt || car.lastTurnInt !== inter.id)) {
        car.lastTurnInt = inter.id;
        // Deterministic 25% turn chance at green intersections
        if (world.rng.next() < 0.25) {
          if (car.axis === 'h') {
            car.axis = 'v';
            car.dir = car.y < WORLD_HEIGHT * 0.5 ? 1 : -1;
            car.angle = car.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
            car.x = inter.x + (car.dir > 0 ? -26 : 26);
          } else {
            car.axis = 'h';
            car.dir = car.x < 1800 ? 1 : -1;
            car.angle = car.dir > 0 ? 0 : Math.PI;
            car.y = inter.y + (car.dir > 0 ? 26 : -26);
          }
        }
      }
    }

    if (car.speed < targetSpeed) {
      car.speed = Math.min(targetSpeed, car.speed + car.accel * 0.7 * dt);
    } else {
      car.speed = Math.max(targetSpeed, car.speed - car.brake * 0.85 * dt);
    }

    car.vx = Math.cos(car.angle) * car.speed;
    car.vy = Math.sin(car.angle) * car.speed;
    stepCarKinematics(world, car, dt);

    // Wrap or reverse at road ends
    if (car.axis === 'h') {
      if (car.x > 2460 && car.dir > 0) {
        car.dir = -1;
        car.angle = Math.PI;
        car.y -= 52;
      } else if (car.x < 180 && car.dir < 0) {
        car.dir = 1;
        car.angle = 0;
        car.y += 52;
      }
    } else {
      if (car.y > WORLD_HEIGHT - 180 && car.dir > 0) {
        car.dir = -1;
        car.angle = -Math.PI / 2;
        car.x += 52;
      } else if (car.y < 180 && car.dir < 0) {
        car.dir = 1;
        car.angle = Math.PI / 2;
        car.x -= 52;
      }
    }

    // Keep aligned with nearest road centerline if not turning
    if (car.axis === 'h') {
      let nearestRoad = city.roadsH[0];
      for (const r of city.roadsH) {
        if (Math.abs(r.y - car.y) < Math.abs(nearestRoad.y - car.y)) nearestRoad = r;
      }
      const desiredY = nearestRoad.y + (car.dir > 0 ? 26 : -26);
      car.y += (desiredY - car.y) * Math.min(1, dt * 4);
      car.angle = car.dir > 0 ? 0 : Math.PI;
    } else {
      let nearestRoad = city.roadsV[0];
      for (const r of city.roadsV) {
        if (Math.abs(r.x - car.x) < Math.abs(nearestRoad.x - car.x)) nearestRoad = r;
      }
      const desiredX = nearestRoad.x + (car.dir > 0 ? -26 : 26);
      car.x += (desiredX - car.x) * Math.min(1, dt * 4);
      car.angle = car.dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    }
  }
}
