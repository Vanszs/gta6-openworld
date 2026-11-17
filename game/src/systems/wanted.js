// Wanted level 1-5 dispatch system: owns every police car and officer it spawns, removes them on death or decay.
import { POLICE_BLUE } from '../config.js';
import { createCar } from '../entities/car.js';
import { createPedestrian } from '../entities/pedestrian.js';
import { resolveWorldCollision } from '../world/collision.js';

export function createWantedSystem() {
  return {
    stars: 0,
    heatPoints: 0,
    unseenTimer: 0,
    spawnTimer: 0,
    roadblockSpawned: false,
    ownedCars: [],
    ownedOfficers: [],

    markSeen() {
      this.unseenTimer = 0;
    },

    reportCrime(world, severity = 1, reason = 'CRIME REPORTED') {
      this.unseenTimer = 0;
      this.heatPoints += severity * 10;
      const newStars = Math.min(5, Math.max(this.stars, Math.ceil(this.heatPoints / 12)));
      if (newStars > this.stars) {
        this.stars = newStars;
        if (world.toast && !world.shotMode) {
          world.toast.push(`WANTED ★${this.stars} · ${reason}`, 2.1);
        }
      }
      this.ensureDispatchUnits(world);
    },

    setStars(world, level, spawnImmediate = true) {
      this.stars = Math.max(0, Math.min(5, level));
      this.heatPoints = this.stars * 12;
      this.unseenTimer = 0;
      if (this.stars === 0) {
        this.clearAll(world);
      } else if (spawnImmediate) {
        this.ensureDispatchUnits(world);
      }
    },

    spawnPoliceCar(world, x, y, angle = 0, isRoadblock = false) {
      const resolved = resolveWorldCollision(world.city, x, y, 24);
      const car = createCar({
        id: `police_car_${Date.now()}_${this.ownedCars.length}`,
        archetype: 'police',
        x: resolved.x,
        y: resolved.y,
        angle,
        color: POLICE_BLUE,
        isPolice: true,
        sirenActive: true,
      });
      car.isRoadblock = isRoadblock;
      car.ownedByDispatch = true;
      this.ownedCars.push(car);
      world.cars.push(car);
      return car;
    },

    spawnOfficer(world, x, y, angle = 0) {
      const resolved = resolveWorldCollision(world.city, x, y, 12);
      const officer = createPedestrian({
        id: `police_off_${Date.now()}_${this.ownedOfficers.length}`,
        x: resolved.x,
        y: resolved.y,
        angle,
        role: 'police',
        color: POLICE_BLUE,
      });
      officer.ownedByDispatch = true;
      this.ownedOfficers.push(officer);
      world.pedestrians.push(officer);
      return officer;
    },

    ensureDispatchUnits(world) {
      if (this.stars <= 0) return;
      const { player } = world;
      const desiredCars = Math.min(4, this.stars);
      const desiredOfficers = Math.min(4, Math.max(1, this.stars));

      while (this.ownedCars.length < desiredCars) {
        const idx = this.ownedCars.length;
        const ang = player.angle + Math.PI + (idx - 0.5) * 0.55;
        const dist = 280 + idx * 75;
        this.spawnPoliceCar(
          world,
          player.x + Math.cos(ang) * dist,
          player.y + Math.sin(ang) * dist,
          ang + Math.PI,
          false,
        );
      }

      while (this.ownedOfficers.length < desiredOfficers) {
        const idx = this.ownedOfficers.length;
        const ang = (idx * Math.PI * 0.5) + 0.4;
        const dist = 240 + idx * 45;
        this.spawnOfficer(
          world,
          player.x + Math.cos(ang) * dist,
          player.y + Math.sin(ang) * dist,
          ang + Math.PI,
        );
      }

      // High-star roadblock (stars >= 4)
      if (this.stars >= 4 && !this.roadblockSpawned) {
        this.roadblockSpawned = true;
        const fwdAngle = player.angle || 0;
        const bx = player.x + Math.cos(fwdAngle) * 380;
        const by = player.y + Math.sin(fwdAngle) * 380;
        const perp = fwdAngle + Math.PI / 2;
        this.spawnPoliceCar(world, bx + Math.cos(perp) * 36, by + Math.sin(perp) * 36, perp, true);
        this.spawnPoliceCar(world, bx - Math.cos(perp) * 36, by - Math.sin(perp) * 36, perp, true);
        this.spawnOfficer(world, bx, by + 26, fwdAngle + Math.PI);
      }
    },

    pruneDeadUnits(world) {
      for (let i = this.ownedCars.length - 1; i >= 0; i--) {
        const c = this.ownedCars[i];
        if (c.destroyed || c.hp <= 0) {
          this.ownedCars.splice(i, 1);
          const wIdx = world.cars.indexOf(c);
          if (wIdx !== -1) world.cars.splice(wIdx, 1);
        }
      }

      for (let i = this.ownedOfficers.length - 1; i >= 0; i--) {
        const o = this.ownedOfficers[i];
        if (o.dead || o.hp <= 0) {
          this.ownedOfficers.splice(i, 1);
          const wIdx = world.pedestrians.indexOf(o);
          if (wIdx !== -1) world.pedestrians.splice(wIdx, 1);
        }
      }
    },

    clearAll(world) {
      this.stars = 0;
      this.heatPoints = 0;
      this.unseenTimer = 0;
      this.roadblockSpawned = false;

      for (const car of this.ownedCars) {
        if (world.player && world.player.car === car) continue;
        const idx = world.cars.indexOf(car);
        if (idx !== -1) world.cars.splice(idx, 1);
      }
      this.ownedCars = [];

      for (const officer of this.ownedOfficers) {
        const idx = world.pedestrians.indexOf(officer);
        if (idx !== -1) world.pedestrians.splice(idx, 1);
      }
      this.ownedOfficers = [];
    },

    update(world, dt) {
      this.pruneDeadUnits(world);
      if (this.stars <= 0) return;

      this.unseenTimer += dt;
      this.spawnTimer += dt;

      if (this.spawnTimer > 3.5) {
        this.spawnTimer = 0;
        this.ensureDispatchUnits(world);
      }

      // Decay out of sight
      if (this.unseenTimer > 10.5) {
        this.unseenTimer = 5.0;
        this.stars = Math.max(0, this.stars - 1);
        this.heatPoints = this.stars * 12;
        if (this.stars === 0) {
          this.clearAll(world);
          if (world.toast) world.toast.push('HEAT CLEARED · DISPATCH STANDING DOWN', 2.0);
        } else {
          // Trim excess dispatch units on partial star decay
          while (this.ownedCars.length > this.stars) {
            const c = this.ownedCars.pop();
            const idx = world.cars.indexOf(c);
            if (idx !== -1 && (!world.player || world.player.car !== c)) {
              world.cars.splice(idx, 1);
            }
          }
          while (this.ownedOfficers.length > this.stars) {
            const o = this.ownedOfficers.pop();
            const idx = world.pedestrians.indexOf(o);
            if (idx !== -1) world.pedestrians.splice(idx, 1);
          }
        }
      }
    },
  };
}
