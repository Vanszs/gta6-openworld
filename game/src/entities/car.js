// Vehicle entity: acceleration, braking, reverse, speed-scaled steering, drift, smoke, headlights, damage.
import { NPC_COLORS, UI_CYAN, VEHICLE_ARCHETYPES } from '../config.js';
import { resolveWorldCollision } from '../world/collision.js';
import { addSkid, addSmoke, addSparks } from '../world/effects.js';

let nextCarSeq = 1;

export function createCar(opts = {}) {
  const arch = VEHICLE_ARCHETYPES[opts.archetype] || VEHICLE_ARCHETYPES.coupe;
  const isPlayerOwned = Boolean(opts.isPlayerOwned);
  const isPolice = Boolean(opts.isPolice || opts.archetype === 'police');
  const fallbackColor = NPC_COLORS[nextCarSeq % NPC_COLORS.length];

  return {
    id: opts.id || `car_${nextCarSeq++}`,
    archetype: arch.id,
    label: opts.label || arch.label,
    x: opts.x ?? 800,
    y: opts.y ?? 780,
    vx: 0,
    vy: 0,
    speed: opts.speed ?? 0,
    lateralSpeed: 0,
    angle: opts.angle ?? 0,
    driftAngle: opts.driftAngle ?? 0,
    drifting: Boolean(opts.drifting),
    width: arch.width,
    length: arch.length,
    maxSpeed: arch.maxSpeed,
    accel: arch.accel,
    brake: arch.brake,
    reverseMax: arch.reverseMax,
    turnRate: arch.turnRate,
    hp: opts.hp ?? arch.maxHp,
    maxHp: arch.maxHp,
    destroyed: false,
    color: isPlayerOwned ? UI_CYAN : opts.color || fallbackColor,
    driver: opts.driver || (opts.isTraffic ? 'npc' : isPolice ? 'police' : null),
    isPlayerOwned,
    isTraffic: Boolean(opts.isTraffic),
    isPolice,
    isMissionTarget: Boolean(opts.isMissionTarget),
    axis: opts.axis || 'h',
    dir: opts.dir || 1,
    laneOffset: opts.laneOffset || 26,
    headlightsOn: opts.headlightsOn !== false,
    sirenPhase: opts.sirenPhase ?? 0,
    sirenActive: Boolean(opts.sirenActive || isPolice),
    smokeTimer: 0,
    displayKmh: opts.displayKmh ?? null,
    prevRearLeft: null,
    prevRearRight: null,
  };
}

export function getCarKmh(car) {
  if (typeof car.displayKmh === 'number') return car.displayKmh;
  return Math.round(Math.abs(car.speed) * 0.36);
}

export function updatePlayerCar(world, car, dt, input) {
  const throttle = input.isDown('KeyW') || input.isDown('ArrowUp');
  const reverse = input.isDown('KeyS') || input.isDown('ArrowDown');
  const left = input.isDown('KeyA') || input.isDown('ArrowLeft');
  const right = input.isDown('KeyD') || input.isDown('ArrowRight');
  const driftHeld = input.isDown('Space');

  if (throttle) {
    car.speed = Math.min(car.maxSpeed, car.speed + car.accel * dt);
  } else if (reverse) {
    if (car.speed > 15) {
      car.speed = Math.max(0, car.speed - car.brake * dt);
    } else {
      car.speed = Math.max(-car.reverseMax, car.speed - car.accel * 0.75 * dt);
    }
  } else {
    const drag = 190 * dt;
    if (Math.abs(car.speed) <= drag) car.speed = 0;
    else car.speed -= Math.sign(car.speed) * drag;
  }

  const steerInput = (right ? 1 : 0) - (left ? 1 : 0);
  const absSpd = Math.abs(car.speed);
  if (absSpd > 8 && steerInput !== 0) {
    const speedFactor = Math.min(1, absSpd / 140) * (1 - Math.min(0.32, absSpd / 900));
    const driftBoost = driftHeld && absSpd > 120 ? 1.32 : 1.0;
    const dirSign = car.speed >= 0 ? 1 : -1;
    car.angle += steerInput * car.turnRate * speedFactor * driftBoost * dirSign * dt;
  }

  car.drifting = driftHeld && absSpd > 110 && steerInput !== 0;
  const targetSlip = car.drifting ? -steerInput * 0.34 : 0;
  car.driftAngle += (targetSlip - car.driftAngle) * Math.min(1, dt * 8);

  const moveAngle = car.angle - car.driftAngle * 0.55;
  car.vx = Math.cos(moveAngle) * car.speed;
  car.vy = Math.sin(moveAngle) * car.speed;

  stepCarKinematics(world, car, dt);
}

export function stepCarKinematics(world, car, dt) {
  if (car.isPolice && car.sirenActive) {
    car.sirenPhase = (car.sirenPhase + dt * 9.5) % (Math.PI * 2);
  }

  const nextX = car.x + car.vx * dt;
  const nextY = car.y + car.vy * dt;
  const colRadius = Math.max(car.width, car.length) * 0.42;
  const resolved = resolveWorldCollision(world.city, nextX, nextY, colRadius);

  if (resolved.collided && Math.abs(car.speed) > 90) {
    car.hp = Math.max(25, car.hp - Math.round(Math.abs(car.speed) * 0.04));
    car.speed *= 0.55;
    addSparks(world.effects, resolved.x, resolved.y, 5, Math.atan2(resolved.ny, resolved.nx));
  }

  car.x = resolved.x;
  car.y = resolved.y;

  // Rear wheel positions for drift skid marks & tyre smoke
  const cos = Math.cos(car.angle);
  const sin = Math.sin(car.angle);
  const rx = car.x - cos * (car.length * 0.36);
  const ry = car.y - sin * (car.length * 0.36);
  const wx = -sin * (car.width * 0.38);
  const wy = cos * (car.width * 0.38);

  const rl = { x: rx + wx, y: ry + wy };
  const rr = { x: rx - wx, y: ry - wy };

  if (car.drifting) {
    if (car.prevRearLeft && car.prevRearRight) {
      addSkid(world.effects, car.prevRearLeft.x, car.prevRearLeft.y, rl.x, rl.y, 0.62);
      addSkid(world.effects, car.prevRearRight.x, car.prevRearRight.y, rr.x, rr.y, 0.62);
    }
    car.smokeTimer -= dt;
    if (car.smokeTimer <= 0) {
      car.smokeTimer = 0.045;
      addSmoke(world.effects, rl.x, rl.y, -car.vx * 0.12, -car.vy * 0.12, 13);
      addSmoke(world.effects, rr.x, rr.y, -car.vx * 0.12, -car.vy * 0.12, 13);
    }
  }

  car.prevRearLeft = rl;
  car.prevRearRight = rr;
}
