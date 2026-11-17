// Police AI: pursuing and ramming cruisers, officers on foot, and high-star roadblock behavior.
import { stepCarKinematics } from '../entities/car.js';
import { damagePlayer } from '../entities/player.js';
import { resolveWorldCollision } from '../world/collision.js';
import { addSparks } from '../world/effects.js';

export function updatePoliceAI(world, dt) {
  const { player, wanted, city } = world;
  if (wanted.stars <= 0 || player.dead) return;

  // Update dispatch-owned police cruisers
  for (const copCar of wanted.ownedCars) {
    if (copCar.driver === 'player' || copCar.destroyed) continue;
    copCar.sirenActive = true;

    if (copCar.isRoadblock) {
      copCar.sirenPhase = (copCar.sirenPhase + dt * 10) % (Math.PI * 2);
      continue;
    }

    const dx = player.x - copCar.x;
    const dy = player.y - copCar.y;
    const dist = Math.hypot(dx, dy);
    const desiredAngle = Math.atan2(dy, dx);

    let angleDiff = desiredAngle - copCar.angle;
    while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
    while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;

    const maxTurn = copCar.turnRate * dt;
    copCar.angle += Math.max(-maxTurn, Math.min(maxTurn, angleDiff));

    const targetSpd = dist > 75 ? copCar.maxSpeed * (0.76 + wanted.stars * 0.04) : 130;
    copCar.speed += (targetSpd - copCar.speed) * Math.min(1, dt * 3.5);
    copCar.vx = Math.cos(copCar.angle) * copCar.speed;
    copCar.vy = Math.sin(copCar.angle) * copCar.speed;

    stepCarKinematics(world, copCar, dt);

    // Ramming player car or player
    if (dist < 56) {
      wanted.markSeen();
      if (player.car) {
        player.car.hp = Math.max(20, player.car.hp - Math.round(14 * dt));
      } else {
        damagePlayer(world, 12 * dt);
      }
      addSparks(world.effects, (copCar.x + player.x) * 0.5, (copCar.y + player.y) * 0.5, 3, copCar.angle);
    }
    if (dist < 480) {
      wanted.markSeen();
    }
  }

  // Update dispatch-owned police officers on foot
  for (const officer of wanted.ownedOfficers) {
    if (officer.dead) continue;
    const dx = player.x - officer.x;
    const dy = player.y - officer.y;
    const dist = Math.hypot(dx, dy);
    officer.angle = Math.atan2(dy, dx);

    if (dist < 480) {
      wanted.markSeen();
    }

    if (dist > 125) {
      const stepX = officer.x + (dx / Math.max(1, dist)) * 96 * dt;
      const stepY = officer.y + (dy / Math.max(1, dist)) * 96 * dt;
      const res = resolveWorldCollision(city, stepX, stepY, officer.radius);
      officer.x = res.x;
      officer.y = res.y;
    }

    officer.fireCooldown -= dt;
    if (dist < 380 && officer.fireCooldown <= 0) {
      officer.fireCooldown = Math.max(0.55, 1.15 - wanted.stars * 0.1);
      world.combat.fireProjectile(world, {
        x: officer.x + Math.cos(officer.angle) * 15,
        y: officer.y + Math.sin(officer.angle) * 15,
        angle: officer.angle + (world.rng.next() - 0.5) * 0.12,
        speed: 680,
        damage: 8,
        range: 420,
        owner: 'police',
      });
    }
  }
}
