// Missions system: four jobs with briefing, waypoint, payout, completion.
// For kill missions, distance and radar route target the nearest live enemy recomputed each frame;
// when none are left the route clears. Loading a save resyncs waypoint and objective text.
import { ENEMY_ACCENT, UI_CYAN } from '../config.js';
import { createCar } from '../entities/car.js';
import { createPedestrian } from '../entities/pedestrian.js';

export const MISSION_DEFS = Object.freeze([
  {
    index: 0,
    jobCode: 'JOB 1/5',
    shortTag: 'PIER',
    title: 'HARBOR HOTWIRE',
    briefing: 'BOOST THE DOCK COUPE & REACH PIER BEACON',
    type: 'reach',
    waypoint: { x: 2820, y: 1925 },
    hotwireCarSpot: { x: 2385, y: 2020, angle: 0 },
    payout: 1500,
  },
  {
    index: 1,
    jobCode: 'JOB 2/5',
    shortTag: 'KILL',
    title: 'NEON PLAZA AMBUSH',
    briefing: 'ELIMINATE THE SYNDICATE CREW IN NEON PLAZA',
    type: 'kill',
    enemySpots: [
      { x: 2305, y: 745, angle: Math.PI },
      { x: 2355, y: 805, angle: Math.PI * 0.92 },
      { x: 2265, y: 838, angle: -Math.PI * 0.78 },
    ],
    payout: 2200,
  },
  {
    index: 2,
    jobCode: 'JOB 3/5',
    shortTag: 'DROP',
    title: 'MIDTOWN SIGNAL DROP',
    briefing: 'DELIVER THE COURIER PACK TO MIDTOWN INTERSECTION',
    type: 'reach',
    waypoint: { x: 1540, y: 1390 },
    payout: 2800,
  },
  {
    index: 3,
    jobCode: 'JOB 4/5',
    shortTag: 'KILL',
    title: 'QUAYHOUSE CLEAROUT',
    briefing: 'WIPE OUT THE DOCKSIDE ENFORCERS',
    type: 'kill',
    enemySpots: [
      { x: 2180, y: 1740, angle: Math.PI * 0.5 },
      { x: 2245, y: 1795, angle: Math.PI * 0.6 },
      { x: 2190, y: 1870, angle: 0 },
      { x: 2260, y: 1910, angle: -Math.PI * 0.5 },
    ],
    payout: 3500,
  },
]);

export function createMissionSystem() {
  return {
    currentIndex: 0,
    completedAll: false,
    activeWaypoint: null,
    objectiveText: 'JOB 1/5 · PIER · 30m',
    beaconPulse: 0,
    overrideDistanceM: null,

    startJob(world, index, silent = false) {
      this.currentIndex = Math.max(0, Math.min(MISSION_DEFS.length, index));
      this.overrideDistanceM = null;

      // Remove any leftover mission enemies from previous job
      for (let i = world.pedestrians.length - 1; i >= 0; i--) {
        if (world.pedestrians[i].missionTag) {
          world.pedestrians.splice(i, 1);
        }
      }

      if (this.currentIndex >= MISSION_DEFS.length) {
        this.completedAll = true;
        this.activeWaypoint = null;
        this.objectiveText = 'JOB 5/5 · ALL CLEAR';
        return;
      }

      this.completedAll = false;
      const def = MISSION_DEFS[this.currentIndex];

      if (def.type === 'reach') {
        this.activeWaypoint = { x: def.waypoint.x, y: def.waypoint.y };
        if (def.hotwireCarSpot && !world.cars.some((c) => c.isMissionTarget)) {
          const targetCar = createCar({
            id: 'car_mission_hotwire',
            archetype: 'coupe',
            x: def.hotwireCarSpot.x,
            y: def.hotwireCarSpot.y,
            angle: def.hotwireCarSpot.angle,
            color: UI_CYAN,
            isMissionTarget: true,
          });
          world.cars.push(targetCar);
        }
      } else if (def.type === 'kill') {
        def.enemySpots.forEach((spot, i) => {
          const enemy = createPedestrian({
            id: `mission_enemy_${def.index}_${i}`,
            x: spot.x,
            y: spot.y,
            angle: spot.angle,
            role: 'enemy',
            color: ENEMY_ACCENT,
            missionTag: `job_${def.index}`,
          });
          world.pedestrians.push(enemy);
        });
      }

      this.recomputeObjective(world);

      if (!silent && world.toast && !world.shotMode) {
        world.toast.push(`${def.jobCode}: ${def.briefing}`, 3.0);
      }
    },

    getLiveMissionEnemies(world) {
      const tag = `job_${this.currentIndex}`;
      return world.pedestrians.filter((p) => !p.dead && p.role === 'enemy' && (p.missionTag === tag || p.role === 'enemy'));
    },

    recomputeObjective(world) {
      if (this.currentIndex >= MISSION_DEFS.length) {
        this.completedAll = true;
        this.activeWaypoint = null;
        this.objectiveText = 'JOB 5/5 · ALL CLEAR';
        return;
      }

      const def = MISSION_DEFS[this.currentIndex];
      const { player } = world;

      if (def.type === 'kill') {
        const enemies = this.getLiveMissionEnemies(world);
        if (enemies.length === 0) {
          // When none are left, route clears immediately
          this.activeWaypoint = null;
          this.objectiveText = `${def.jobCode} · CLEAR`;
          return;
        }

        // Target nearest live enemy, recomputed each frame
        let nearest = enemies[0];
        let bestDist = Math.hypot(nearest.x - player.x, nearest.y - player.y);
        for (let i = 1; i < enemies.length; i++) {
          const e = enemies[i];
          const d = Math.hypot(e.x - player.x, e.y - player.y);
          if (d < bestDist) {
            bestDist = d;
            nearest = e;
          }
        }

        this.activeWaypoint = { x: nearest.x, y: nearest.y };
        const distM =
          typeof this.overrideDistanceM === 'number'
            ? this.overrideDistanceM
            : Math.max(1, Math.round(bestDist / 14));
        this.objectiveText = `${def.jobCode} · KILL ${enemies.length} · ${distM}m`;
      } else {
        this.activeWaypoint = { x: def.waypoint.x, y: def.waypoint.y };
        const rawDist = Math.hypot(def.waypoint.x - player.x, def.waypoint.y - player.y);
        const distM =
          typeof this.overrideDistanceM === 'number'
            ? this.overrideDistanceM
            : Math.max(1, Math.round(rawDist / 14));
        this.objectiveText = `${def.jobCode} · ${def.shortTag} · ${distM}m`;
      }
    },

    resyncFromSave(world, savedJobIndex) {
      this.startJob(world, savedJobIndex, true);
      this.recomputeObjective(world);
    },

    update(world, dt) {
      this.beaconPulse = (this.beaconPulse + dt * 4.2) % (Math.PI * 2);
      if (this.completedAll || this.currentIndex >= MISSION_DEFS.length) return;

      const def = MISSION_DEFS[this.currentIndex];
      this.recomputeObjective(world);

      if (world.shotMode) return;

      if (def.type === 'kill') {
        const enemies = this.getLiveMissionEnemies(world);
        if (enemies.length === 0) {
          this.activeWaypoint = null;
          this.completeCurrentJob(world, def);
        }
      } else if (def.type === 'reach' && this.activeWaypoint) {
        const d = Math.hypot(this.activeWaypoint.x - world.player.x, this.activeWaypoint.y - world.player.y);
        if (d < 56) {
          this.completeCurrentJob(world, def);
        }
      }
    },

    completeCurrentJob(world, def) {
      world.player.cash += def.payout;
      if (world.toast) {
        world.toast.push(`${def.jobCode} COMPLETE · +$${def.payout}`, 3.0);
      }
      if (world.audio) {
        world.audio.playChime();
      }
      this.startJob(world, this.currentIndex + 1, false);
    },
  };
}
