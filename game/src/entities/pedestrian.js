// Pedestrians, magenta-ringed ambush/mission enemies, and on-foot police officers.
import { ENEMY_ACCENT, NPC_COLORS, POLICE_BLUE } from '../config.js';
import { resolveWorldCollision } from '../world/collision.js';

let nextPedSeq = 1;

export function createPedestrian(opts = {}) {
  const role = opts.role || 'civilian';
  const color =
    role === 'enemy'
      ? ENEMY_ACCENT
      : role === 'police'
        ? POLICE_BLUE
        : opts.color || NPC_COLORS[nextPedSeq % NPC_COLORS.length];

  return {
    id: opts.id || `ped_${nextPedSeq++}`,
    x: opts.x ?? 700,
    y: opts.y ?? 700,
    vx: 0,
    vy: 0,
    radius: 11,
    angle: opts.angle ?? 0,
    role, // 'civilian' | 'enemy' | 'police'
    color,
    hp: opts.hp ?? (role === 'enemy' ? 75 : role === 'police' ? 85 : 40),
    maxHp: opts.maxHp ?? (role === 'enemy' ? 75 : role === 'police' ? 85 : 40),
    dead: false,
    fleeTimer: opts.fleeTimer ?? 0,
    fleeFromX: opts.fleeFromX ?? 0,
    fleeFromY: opts.fleeFromY ?? 0,
    fireCooldown: opts.fireCooldown ?? 0.6,
    walkPhase: (nextPedSeq * 0.7) % (Math.PI * 2),
    missionTag: opts.missionTag || null,
  };
}

export function alertPedestriansNear(world, x, y, radius = 420) {
  const r2 = radius * radius;
  for (const ped of world.pedestrians) {
    if (ped.dead || ped.role !== 'civilian') continue;
    const dx = ped.x - x;
    const dy = ped.y - y;
    if (dx * dx + dy * dy <= r2) {
      ped.fleeTimer = 5.5;
      ped.fleeFromX = x;
      ped.fleeFromY = y;
      ped.angle = Math.atan2(dy, dx);
    }
  }
}

export function updatePedestrians(world, dt) {
  const { player, city } = world;

  for (let i = world.pedestrians.length - 1; i >= 0; i--) {
    const ped = world.pedestrians[i];
    if (ped.dead) {
      world.pedestrians.splice(i, 1);
      continue;
    }

    ped.walkPhase += dt * (ped.fleeTimer > 0 ? 11 : 5.5);

    if (ped.role === 'civilian') {
      // Check if player car is speeding close by
      if (player.car && Math.abs(player.car.speed) > 170) {
        const dx = ped.x - player.car.x;
        const dy = ped.y - player.car.y;
        if (dx * dx + dy * dy < 170 * 170) {
          ped.fleeTimer = Math.max(ped.fleeTimer, 3.2);
          ped.fleeFromX = player.car.x;
          ped.fleeFromY = player.car.y;
          ped.angle = Math.atan2(dy, dx);
        }
      }

      let speed = 44;
      if (ped.fleeTimer > 0) {
        ped.fleeTimer -= dt;
        ped.angle = Math.atan2(ped.y - ped.fleeFromY, ped.x - ped.fleeFromX);
        speed = 112;
      }

      const nx = ped.x + Math.cos(ped.angle) * speed * dt;
      const ny = ped.y + Math.sin(ped.angle) * speed * dt;
      const res = resolveWorldCollision(city, nx, ny, ped.radius);
      if (res.collided) {
        ped.angle += Math.PI * 0.65;
      }
      ped.x = res.x;
      ped.y = res.y;
    } else if (ped.role === 'enemy') {
      const dx = player.x - ped.x;
      const dy = player.y - ped.y;
      const dist = Math.hypot(dx, dy);
      ped.angle = Math.atan2(dy, dx);

      if (dist > 140 && dist < 520) {
        const res = resolveWorldCollision(
          city,
          ped.x + (dx / dist) * 72 * dt,
          ped.y + (dy / dist) * 72 * dt,
          ped.radius,
        );
        ped.x = res.x;
        ped.y = res.y;
      }

      ped.fireCooldown -= dt;
      if (dist < 430 && ped.fireCooldown <= 0 && !player.dead) {
        ped.fireCooldown = 1.15;
        world.combat.fireProjectile(world, {
          x: ped.x + Math.cos(ped.angle) * 16,
          y: ped.y + Math.sin(ped.angle) * 16,
          angle: ped.angle + (world.rng.next() - 0.5) * 0.14,
          speed: 620,
          damage: 9,
          range: 460,
          owner: 'enemy',
        });
      }
    }
  }
}
