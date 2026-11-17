// Deterministic scene builder for the 4 required frames from URL query string (?shot=...).
import { ENEMY_ACCENT, NPC_COLORS, POLICE_BLUE, UI_CYAN } from './config.js';
import { createCar } from './entities/car.js';
import { createPedestrian } from './entities/pedestrian.js';
import { clampCameraToCity } from './render/camera.js';
import { addMuzzleFlash, addSkid, addSmoke, addSparks, seedRain } from './world/effects.js';

export const SHOT_SPECS = Object.freeze([
  {
    name: '1-cover.jpg',
    shotId: '1-cover',
    aliases: ['1-cover', 'cover', 'start'],
    district: 'boulevard',
    cameraX: 860,
    cameraY: 780,
    query: '?shot=1-cover&seed=101',
  },
  {
    name: '2-ambush.jpg',
    shotId: '2-ambush',
    aliases: ['2-ambush', 'ambush', 'play'],
    district: 'plaza',
    cameraX: 2220,
    cameraY: 760,
    query: '?shot=2-ambush&seed=202',
  },
  {
    name: '3-mission.jpg',
    shotId: '3-mission',
    aliases: ['3-mission', 'mission', 'end'],
    district: 'docks',
    cameraX: 2500,
    cameraY: 1980,
    query: '?shot=3-mission&seed=303',
  },
  {
    name: '4-title.jpg',
    shotId: '4-title',
    aliases: ['4-title', 'title'],
    district: 'midtown',
    cameraX: 1540,
    cameraY: 1520,
    query: '?shot=4-title&seed=404',
  },
]);

export function resolveShotSpec(rawShotParam) {
  if (!rawShotParam) return null;
  const clean = String(rawShotParam).trim().toLowerCase();
  return SHOT_SPECS.find((s) => s.aliases.includes(clean)) || null;
}

export function applyShotScene(world, camera, appState, rawShotParam) {
  const spec = resolveShotSpec(rawShotParam);
  if (!spec) return null;

  world.shotMode = spec.shotId;
  world.toast.items = [];
  world.combat.bullets = [];
  world.effects.skids = [];
  world.effects.smoke = [];
  world.effects.sparks = [];
  world.effects.flashes = [];
  world.effects.rainEnabled = false;
  world.wanted.clearAll(world);
  world.cars = [];
  world.pedestrians = [];

  clampCameraToCity(camera, spec.cameraX, spec.cameraY);

  if (spec.shotId === '1-cover') {
    // Frame 1: Wide multi-lane boulevard: player car drifting, 4 wanted stars,
    // police car behind with lights, traffic and pedestrians, HUD, rain.
    appState.mode = 'playing';
    world.time = 4.2;
    world.effects.rainEnabled = true;
    seedRain(world.effects, 115);

    const playerCar = createCar({
      id: 'cover_player_car',
      archetype: 'coupe',
      label: 'TURBO COUPE',
      x: 895,
      y: 804,
      angle: -0.32,
      driftAngle: 0.28,
      drifting: true,
      speed: 410,
      displayKmh: 148,
      hp: 210,
      color: UI_CYAN,
      isPlayerOwned: true,
      driver: 'player',
    });
    world.cars.push(playerCar);

    world.player.car = playerCar;
    world.player.x = playerCar.x;
    world.player.y = playerCar.y;
    world.player.angle = playerCar.angle;
    world.player.hp = 92;
    world.player.armour = 75;
    world.player.cash = 14850;
    world.player.weaponIndex = 1; // PULSE SMG

    // Dual drift skid marks and tyre smoke behind player car
    addSkid(world.effects, 775, 842, 868, 818, 0.72);
    addSkid(world.effects, 785, 862, 876, 834, 0.72);
    addSmoke(world.effects, 856, 816, -20, 8, 18);
    addSmoke(world.effects, 836, 828, -24, 10, 22);
    addSmoke(world.effects, 866, 834, -18, 6, 16);

    // 4 wanted stars with pursuing police cruisers & high-star roadblock
    world.wanted.stars = 4;
    const cop1 = world.wanted.spawnPoliceCar(world, 738, 822, -0.14, false);
    cop1.sirenPhase = 0.6;
    const cop2 = world.wanted.spawnPoliceCar(world, 765, 742, 0.12, false);
    cop2.sirenPhase = 3.8;
    const cop3 = world.wanted.spawnPoliceCar(world, 1095, 762, Math.PI * 0.55, true);
    cop3.sirenPhase = 1.2;
    world.wanted.spawnOfficer(world, 1055, 692, Math.PI * 0.85);

    // Boulevard civilian traffic cars with headlights
    world.cars.push(
      createCar({
        id: 'cover_traf_1',
        archetype: 'sedan',
        x: 615,
        y: 744,
        angle: 0,
        color: NPC_COLORS[0],
        isTraffic: true,
      }),
      createCar({
        id: 'cover_traf_2',
        archetype: 'hauler',
        x: 1125,
        y: 822,
        angle: Math.PI,
        color: NPC_COLORS[2],
        isTraffic: true,
      }),
      createCar({
        id: 'cover_traf_3',
        archetype: 'sedan',
        x: 834,
        y: 590,
        angle: Math.PI * 0.5,
        color: NPC_COLORS[5],
        isTraffic: true,
      }),
    );

    // Pedestrians along the boulevard sidewalks
    const coverPeds = [
      { x: 660, y: 682, angle: 0.2, c: 0 },
      { x: 755, y: 682, angle: 2.9, c: 3 },
      { x: 990, y: 682, angle: 0.1, c: 6 },
      { x: 690, y: 882, angle: -0.4, c: 7 },
      { x: 985, y: 882, angle: 3.1, c: 1 },
    ];
    coverPeds.forEach((p, idx) => {
      world.pedestrians.push(
        createPedestrian({
          id: `cover_ped_${idx}`,
          x: p.x,
          y: p.y,
          angle: p.angle,
          color: NPC_COLORS[p.c],
          role: 'civilian',
        }),
      );
    });

    // Active kill mission so radar shows gold route line + all 4 blip types
    world.missions.startJob(world, 1, true);
    world.missions.overrideDistanceM = 18;
    world.missions.recomputeObjective(world);
  } else if (spec.shotId === '2-ambush') {
    // Frame 2: Neon alley/plaza with two lit shopfronts (AMMO & SYNTH CLUB):
    // on foot, muzzle flash, three ringed enemies close, two fleeing pedestrians, 2 stars.
    appState.mode = 'playing';
    world.time = 6.5;

    world.player.car = null;
    world.player.x = 2090;
    world.player.y = 768;
    world.player.angle = 0.05;
    world.player.facing8 = 0;
    world.player.hp = 88;
    world.player.armour = 65;
    world.player.cash = 9600;
    world.player.weaponIndex = 1; // PULSE SMG
    world.player.ammo.smg.mag = 24;

    // Three magenta-ringed enemies close in the plaza (started via Job 2/5)
    world.missions.startJob(world, 1, true);
    const enemies = world.missions.getLiveMissionEnemies(world);
    if (enemies.length >= 3) {
      enemies[0].x = 2258;
      enemies[0].y = 736;
      enemies[0].angle = Math.PI + 0.15;
      enemies[1].x = 2305;
      enemies[1].y = 786;
      enemies[1].angle = Math.PI - 0.05;
      enemies[2].x = 2242;
      enemies[2].y = 828;
      enemies[2].angle = -Math.PI * 0.85;
    }
    world.missions.overrideDistanceM = 18;
    world.missions.recomputeObjective(world);

    // Muzzle flash on player's weapon + tracer bullets + impact sparks
    addMuzzleFlash(world.effects, 2112, 770, 0.05, 28);
    world.combat.bullets.push(
      {
        x: 2188,
        y: 754,
        prevX: 2150,
        prevY: 762,
        vx: 900,
        vy: -120,
        angle: -0.13,
        damage: 24,
        traveled: 80,
        maxRange: 560,
        owner: 'player',
      },
      {
        x: 2232,
        y: 780,
        prevX: 2194,
        prevY: 776,
        vx: 900,
        vy: 60,
        angle: 0.06,
        damage: 24,
        traveled: 110,
        maxRange: 560,
        owner: 'player',
      },
    );
    addSparks(world.effects, 2248, 740, 9, Math.PI);

    // Two fleeing pedestrians in the plaza
    world.pedestrians.push(
      createPedestrian({
        id: 'ambush_flee_1',
        x: 1965,
        y: 726,
        angle: Math.PI * 0.88,
        color: NPC_COLORS[0],
        role: 'civilian',
        fleeTimer: 4.5,
      }),
      createPedestrian({
        id: 'ambush_flee_2',
        x: 1985,
        y: 832,
        angle: Math.PI * 0.75,
        color: NPC_COLORS[5],
        role: 'civilian',
        fleeTimer: 4.5,
      }),
    );

    // 2 wanted stars with police cruiser & officer at plaza edge
    world.wanted.stars = 2;
    const cop = world.wanted.spawnPoliceCar(world, 1825, 804, 0.04, false);
    cop.sirenPhase = 0.5;
    world.wanted.spawnOfficer(world, 1885, 845, -0.15);

    // Parked civilian car near alley edge
    world.cars.push(
      createCar({
        id: 'ambush_car_1',
        archetype: 'sedan',
        x: 2560,
        y: 810,
        angle: Math.PI,
        color: NPC_COLORS[7],
        isTraffic: true,
      }),
    );
  } else if (spec.shotId === '3-mission') {
    // Frame 3: The docks: pier and containers, a glowing delivery beacon ahead,
    // the player beside the hotwire target car (on foot approaching it, not driving onto the pier),
    // traffic on the quay road, 1 star.
    appState.mode = 'playing';
    world.time = 8.4;
    world.missions.beaconPulse = 0.9;

    world.missions.startJob(world, 0, true); // Job 1/5: PIER
    world.missions.overrideDistanceM = 30;

    // Hotwire target car parked on the dock apron beside the main pier entrance
    const hotwireCar = world.cars.find((c) => c.isMissionTarget);
    if (hotwireCar) {
      hotwireCar.x = 2418;
      hotwireCar.y = 1955;
      hotwireCar.angle = -0.08;
    }

    // Player on foot approaching the hotwire target car (strictly NOT inside it and NOT driving onto the pier)
    world.player.car = null;
    world.player.x = 2328;
    world.player.y = 1978;
    world.player.angle = -0.24;
    world.player.facing8 = 0;
    world.player.hp = 100;
    world.player.armour = 80;
    world.player.cash = 12450;
    world.player.weaponIndex = 0; // PISTOL
    world.missions.recomputeObjective(world);

    // Traffic on the quay road (x = 2220)
    world.cars.push(
      createCar({
        id: 'dock_traf_1',
        archetype: 'hauler',
        x: 2194,
        y: 1790,
        angle: Math.PI * 0.5,
        color: NPC_COLORS[1],
        isTraffic: true,
      }),
      createCar({
        id: 'dock_traf_2',
        archetype: 'sedan',
        x: 2246,
        y: 1945,
        angle: -Math.PI * 0.5,
        color: NPC_COLORS[4],
        isTraffic: true,
      }),
      createCar({
        id: 'dock_traf_3',
        archetype: 'coupe',
        x: 2194,
        y: 2105,
        angle: Math.PI * 0.5,
        color: NPC_COLORS[8],
        isTraffic: true,
      }),
    );

    // 1 wanted star with patrol cruiser on the lower quay road
    world.wanted.stars = 1;
    const dockCop = world.wanted.spawnPoliceCar(world, 2246, 2225, -Math.PI * 0.5, false);
    dockCop.sirenPhase = 0.8;

    // Dock workers / pedestrians on boardwalk and quay sidewalk
    world.pedestrians.push(
      createPedestrian({
        id: 'dock_ped_1',
        x: 2512,
        y: 1825,
        angle: Math.PI * 0.5,
        color: NPC_COLORS[2],
        role: 'civilian',
      }),
      createPedestrian({
        id: 'dock_ped_2',
        x: 2512,
        y: 2065,
        angle: -Math.PI * 0.5,
        color: NPC_COLORS[6],
        role: 'civilian',
      }),
      createPedestrian({
        id: 'dock_ped_3',
        x: 2132,
        y: 1920,
        angle: Math.PI * 0.5,
        color: NPC_COLORS[0],
        role: 'civilian',
      }),
    );
  } else if (spec.shotId === '4-title') {
    // Frame 4: Lit commercial intersection with window grids, glowing signage,
    // signal gantries, cross traffic and headlights behind the NEON WAKE logo card and control legend.
    appState.mode = 'title';
    world.time = 3.2;

    world.player.car = null;
    world.player.x = 1540;
    world.player.y = 1520;

    // Cross traffic cars with bright headlights in the Midtown intersection
    world.cars.push(
      createCar({
        id: 'title_car_1',
        archetype: 'coupe',
        x: 1360,
        y: 1548,
        angle: 0,
        color: UI_CYAN,
        isPlayerOwned: true,
        headlightsOn: true,
      }),
      createCar({
        id: 'title_car_2',
        archetype: 'sedan',
        x: 1720,
        y: 1492,
        angle: Math.PI,
        color: NPC_COLORS[5],
        isTraffic: true,
        headlightsOn: true,
      }),
      createCar({
        id: 'title_car_3',
        archetype: 'sedan',
        x: 1512,
        y: 1375,
        angle: Math.PI * 0.5,
        color: NPC_COLORS[0],
        isTraffic: true,
        headlightsOn: true,
      }),
      createCar({
        id: 'title_car_4',
        archetype: 'hauler',
        x: 1568,
        y: 1685,
        angle: -Math.PI * 0.5,
        color: NPC_COLORS[7],
        isTraffic: true,
        headlightsOn: true,
      }),
      createCar({
        id: 'title_car_5',
        archetype: 'police',
        x: 1180,
        y: 1492,
        angle: 0,
        color: POLICE_BLUE,
        isPolice: true,
        sirenActive: true,
        sirenPhase: 0.7,
        headlightsOn: true,
      }),
    );

    // Sidewalk pedestrians at the Midtown intersection
    const titlePeds = [
      { x: 1390, y: 1424, a: 0, c: 1 },
      { x: 1690, y: 1424, a: Math.PI, c: 4 },
      { x: 1390, y: 1618, a: 0, c: 6 },
      { x: 1690, y: 1618, a: Math.PI, c: 8 },
    ];
    titlePeds.forEach((p, idx) => {
      world.pedestrians.push(
        createPedestrian({
          id: `title_ped_${idx}`,
          x: p.x,
          y: p.y,
          angle: p.a,
          color: NPC_COLORS[p.c],
          role: 'civilian',
        }),
      );
    });
  }

  const meta = {
    name: spec.name,
    shotId: spec.shotId,
    district: spec.district,
    cameraX: Math.round(camera.x),
    cameraY: Math.round(camera.y),
  };
  if (typeof window !== 'undefined') {
    window.__NEON_WAKE_SHOT__ = meta;
  }
  return meta;
}
