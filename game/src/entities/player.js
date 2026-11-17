// Player entity: walk/run, 8-direction facing, car enter/exit/hijack, weapons, health, respawn.
import { UI_CYAN, WEAPONS } from '../config.js';
import { resolveWorldCollision } from '../world/collision.js';

export function snapAngle8(angle) {
  const step = Math.PI / 4;
  return Math.round(angle / step) * step;
}

export function createPlayer(x = 770, y = 700) {
  const ammo = {};
  for (const w of WEAPONS) {
    ammo[w.id] = {
      mag: w.magSize,
      magSize: w.magSize,
      reserve: w.reserveMax,
      reserveMax: w.reserveMax,
    };
  }

  return {
    x,
    y,
    vx: 0,
    vy: 0,
    radius: 13,
    angle: 0,
    facing8: 0,
    hp: 100,
    maxHp: 100,
    armour: 80,
    maxArmour: 100,
    cash: 4250,
    car: null,
    weaponIndex: 0,
    fireCooldown: 0,
    reloadTimer: 0,
    muzzleTimer: 0,
    ammo,
    dead: false,
    respawnTimer: 0,
    walkCycle: 0,
  };
}

export function getActiveWeapon(player) {
  return WEAPONS[player.weaponIndex] || WEAPONS[0];
}

export function cyclePlayerWeapon(player, delta = 1) {
  const count = WEAPONS.length;
  player.weaponIndex = (player.weaponIndex + delta + count) % count;
  player.reloadTimer = 0;
}

export function tryEnterOrExitCar(world) {
  const { player, cars } = world;
  if (player.dead) return false;

  // Exit current car
  if (player.car) {
    const car = player.car;
    const exitAngle = car.angle - Math.PI / 2;
    const exitX = car.x + Math.cos(exitAngle) * 34;
    const exitY = car.y + Math.sin(exitAngle) * 34;
    const resolved = resolveWorldCollision(world.city, exitX, exitY, player.radius);
    player.x = resolved.x;
    player.y = resolved.y;
    player.angle = snapAngle8(car.angle);
    player.facing8 = player.angle;
    car.driver = null;
    car.drifting = false;
    player.car = null;
    return true;
  }

  // Find closest car within hijack range
  let bestCar = null;
  let bestDistSq = 74 * 74;
  for (const car of cars) {
    if (car.destroyed) continue;
    const dx = car.x - player.x;
    const dy = car.y - player.y;
    const d2 = dx * dx + dy * dy;
    if (d2 < bestDistSq) {
      bestDistSq = d2;
      bestCar = car;
    }
  }

  if (!bestCar) return false;

  const wasOccupied = bestCar.isTraffic || bestCar.isPolice || bestCar.driver === 'npc';
  bestCar.isTraffic = false;
  bestCar.driver = 'player';
  bestCar.isPlayerOwned = true;
  bestCar.color = UI_CYAN; // Player car always renders in locked cyan #24f0ff
  player.car = bestCar;
  player.x = bestCar.x;
  player.y = bestCar.y;

  if (wasOccupied && !bestCar.isMissionTarget) {
    world.wanted.reportCrime(world, bestCar.isPolice ? 2 : 1, 'GRAND THEFT AUTO');
  }
  return true;
}

export function damagePlayer(world, amount) {
  const { player } = world;
  if (player.dead) return;

  let remaining = amount;
  if (player.armour > 0) {
    const absorbed = Math.min(player.armour, remaining * 0.65);
    player.armour = Math.max(0, Math.round(player.armour - absorbed));
    remaining -= absorbed;
  }
  player.hp = Math.max(0, Math.round(player.hp - remaining));

  if (player.hp <= 0) {
    player.dead = true;
    player.respawnTimer = 3.0;
    if (player.car) {
      player.car.driver = null;
      player.car = null;
    }
    if (world.toast) {
      world.toast.push('WASTED · EMERGENCY MEDEVAC', 2.8);
    }
  }
}

export function updatePlayer(world, dt, input) {
  const { player, city } = world;

  if (player.fireCooldown > 0) player.fireCooldown = Math.max(0, player.fireCooldown - dt);
  if (player.muzzleTimer > 0) player.muzzleTimer = Math.max(0, player.muzzleTimer - dt);

  if (player.reloadTimer > 0) {
    player.reloadTimer -= dt;
    if (player.reloadTimer <= 0) {
      const w = getActiveWeapon(player);
      const slot = player.ammo[w.id];
      const needed = slot.magSize - slot.mag;
      const take = Math.min(needed, slot.reserve);
      slot.mag += take;
      slot.reserve -= take;
    }
  }

  if (player.dead) {
    player.respawnTimer -= dt;
    if (player.respawnTimer <= 0) {
      player.dead = false;
      player.hp = 100;
      player.armour = 50;
      player.x = 780;
      player.y = 700;
      world.wanted.clearAll(world);
    }
    return;
  }

  if (input.consumePressed('KeyQ')) cyclePlayerWeapon(player, -1);
  if (input.consumePressed('KeyE')) cyclePlayerWeapon(player, 1);
  if (input.consumePressed('KeyF')) tryEnterOrExitCar(world);

  if (player.car) {
    player.x = player.car.x;
    player.y = player.car.y;
    player.angle = player.car.angle;
    player.facing8 = snapAngle8(player.car.angle);
    return;
  }

  let mx = 0;
  let my = 0;
  if (input.isDown('KeyW') || input.isDown('ArrowUp')) my -= 1;
  if (input.isDown('KeyS') || input.isDown('ArrowDown')) my += 1;
  if (input.isDown('KeyA') || input.isDown('ArrowLeft')) mx -= 1;
  if (input.isDown('KeyD') || input.isDown('ArrowRight')) mx += 1;

  const sprinting = input.isDown('ShiftLeft') || input.isDown('ShiftRight');
  const moveSpeed = sprinting ? 215 : 155;

  if (mx !== 0 || my !== 0) {
    const rawAngle = Math.atan2(my, mx);
    const snapped = snapAngle8(rawAngle);
    player.facing8 = snapped;
    player.angle = snapped;
    const len = Math.hypot(mx, my);
    player.vx = (mx / len) * moveSpeed;
    player.vy = (my / len) * moveSpeed;
    player.walkCycle += dt * (sprinting ? 11 : 7.5);
  } else {
    player.vx = 0;
    player.vy = 0;
  }

  if (input.mouseDown && input.worldMouseX !== null) {
    const aimAngle = Math.atan2(input.worldMouseY - player.y, input.worldMouseX - player.x);
    player.angle = aimAngle;
    player.facing8 = snapAngle8(aimAngle);
  }

  const nextX = player.x + player.vx * dt;
  const nextY = player.y + player.vy * dt;
  const resolved = resolveWorldCollision(city, nextX, nextY, player.radius);
  player.x = resolved.x;
  player.y = resolved.y;
}
