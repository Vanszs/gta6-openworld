// Combat system: pistol & SMG firing, projectiles, muzzle flashes, impact sparks, damage & crime triggers.
import { alertPedestriansNear } from '../entities/pedestrian.js';
import { damagePlayer, getActiveWeapon } from '../entities/player.js';
import { hitsBuildingOrContainer } from '../world/collision.js';
import { addMuzzleFlash, addSparks } from '../world/effects.js';

export function createCombatSystem() {
  return {
    bullets: [],

    fireProjectile(world, opts) {
      const angle = opts.angle ?? 0;
      const speed = opts.speed ?? 880;
      this.bullets.push({
        x: opts.x,
        y: opts.y,
        prevX: opts.x - Math.cos(angle) * 18,
        prevY: opts.y - Math.sin(angle) * 18,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        angle,
        damage: opts.damage ?? 28,
        traveled: 0,
        maxRange: opts.range ?? 560,
        owner: opts.owner || 'player',
      });
      addMuzzleFlash(world.effects, opts.x, opts.y, angle, opts.flashSize ?? 22);
    },

    tryPlayerFire(world, aimAngle) {
      const { player } = world;
      if (player.dead || player.fireCooldown > 0 || player.reloadTimer > 0) return false;

      const weapon = getActiveWeapon(player);
      const slot = player.ammo[weapon.id];
      if (!slot) return false;

      if (slot.mag <= 0) {
        if (slot.reserve > 0) {
          player.reloadTimer = 0.85;
        }
        return false;
      }

      slot.mag -= 1;
      player.fireCooldown = weapon.fireRate;
      player.muzzleTimer = 0.09;

      const spread = (world.rng.next() - 0.5) * weapon.spread;
      const shotAngle = aimAngle + spread;
      const muzzleDist = player.car ? 28 : 19;
      const mx = player.x + Math.cos(shotAngle) * muzzleDist;
      const my = player.y + Math.sin(shotAngle) * muzzleDist;

      this.fireProjectile(world, {
        x: mx,
        y: my,
        angle: shotAngle,
        speed: weapon.speed,
        damage: weapon.damage,
        range: weapon.range,
        owner: 'player',
        flashSize: 24,
      });

      alertPedestriansNear(world, player.x, player.y, 440);
      if (world.audio) {
        world.audio.playShot(weapon.id);
      }

      if (slot.mag === 0 && slot.reserve > 0) {
        player.reloadTimer = 0.85;
      }
      return true;
    },

    update(world, dt, input) {
      const { player, city, pedestrians, cars } = world;

      if (input && input.mouseDown && !player.dead) {
        const aimAngle =
          input.worldMouseX !== null
            ? Math.atan2(input.worldMouseY - player.y, input.worldMouseX - player.x)
            : player.angle;
        player.angle = aimAngle;
        this.tryPlayerFire(world, aimAngle);
      }

      for (let i = this.bullets.length - 1; i >= 0; i--) {
        const b = this.bullets[i];
        b.prevX = b.x;
        b.prevY = b.y;
        const stepX = b.vx * dt;
        const stepY = b.vy * dt;
        b.x += stepX;
        b.y += stepY;
        b.traveled += Math.hypot(stepX, stepY);

        if (b.traveled >= b.maxRange) {
          this.bullets.splice(i, 1);
          continue;
        }

        // World obstacle check
        if (hitsBuildingOrContainer(city, b.x, b.y, 3)) {
          addSparks(world.effects, b.x, b.y, 6, b.angle + Math.PI);
          this.bullets.splice(i, 1);
          continue;
        }

        // Player hit check for enemy/police bullets
        if (b.owner !== 'player' && !player.dead) {
          const dx = b.x - player.x;
          const dy = b.y - player.y;
          const hitR = player.car ? 24 : player.radius + 4;
          if (dx * dx + dy * dy <= hitR * hitR) {
            if (player.car) {
              player.car.hp = Math.max(20, player.car.hp - b.damage * 0.45);
            } else {
              damagePlayer(world, b.damage);
            }
            addSparks(world.effects, b.x, b.y, 6, b.angle + Math.PI);
            this.bullets.splice(i, 1);
            continue;
          }
        }

        // Pedestrians / Enemies / Officers hit check
        if (b.owner === 'player') {
          let hitPed = false;
          for (const ped of pedestrians) {
            if (ped.dead) continue;
            const dx = b.x - ped.x;
            const dy = b.y - ped.y;
            if (dx * dx + dy * dy <= (ped.radius + 5) * (ped.radius + 5)) {
              ped.hp -= b.damage;
              addSparks(world.effects, b.x, b.y, 8, b.angle + Math.PI);
              if (ped.hp <= 0) {
                ped.dead = true;
                player.cash += ped.role === 'enemy' ? 150 : 40;
                if (ped.role === 'civilian') {
                  world.wanted.reportCrime(world, 1, 'ASSAULT');
                } else if (ped.role === 'police') {
                  world.wanted.reportCrime(world, 2, 'OFFICER DOWN');
                }
              }
              hitPed = true;
              break;
            }
          }
          if (hitPed) {
            this.bullets.splice(i, 1);
            continue;
          }

          // Vehicle hit check
          let hitCar = false;
          for (const car of cars) {
            if (car === player.car || car.destroyed) continue;
            const dx = b.x - car.x;
            const dy = b.y - car.y;
            if (dx * dx + dy * dy <= 26 * 26) {
              car.hp = Math.max(0, car.hp - b.damage);
              addSparks(world.effects, b.x, b.y, 7, b.angle + Math.PI);
              if (car.isPolice) {
                world.wanted.reportCrime(world, 1, 'PATROL ATTACKED');
              }
              if (car.hp <= 0) {
                car.destroyed = true;
                addSparks(world.effects, car.x, car.y, 16, 0);
              }
              hitCar = true;
              break;
            }
          }
          if (hitCar) {
            this.bullets.splice(i, 1);
            continue;
          }
        }
      }
    },
  };
}
