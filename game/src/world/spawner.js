// Spawner for ambient traffic cars, parked cars, and civilian pedestrians using NPC_COLORS.
import { NPC_COLORS, UI_CYAN } from '../config.js';
import { createCar } from '../entities/car.js';
import { createPedestrian } from '../entities/pedestrian.js';

export function populateInitialWorld(world) {
  const { rng, city } = world;
  world.cars = [];
  world.pedestrians = [];

  // Player's starter cyan TURBO COUPE parked near initial spawn
  const playerCar = createCar({
    id: 'car_player_init',
    archetype: 'coupe',
    x: 825,
    y: 745,
    angle: 0,
    color: UI_CYAN,
    isPlayerOwned: true,
  });
  world.cars.push(playerCar);

  // Spawn lane-aligned traffic cars across horizontal and vertical roads
  const hPlacements = [
    { roadIdx: 0, x: 640, dir: 1, arch: 'sedan' },
    { roadIdx: 0, x: 1820, dir: -1, arch: 'coupe' },
    { roadIdx: 1, x: 520, dir: 1, arch: 'sedan' },
    { roadIdx: 1, x: 1120, dir: -1, arch: 'hauler' },
    { roadIdx: 1, x: 1960, dir: 1, arch: 'sedan' },
    { roadIdx: 2, x: 680, dir: 1, arch: 'coupe' },
    { roadIdx: 2, x: 1350, dir: 1, arch: 'sedan' },
    { roadIdx: 2, x: 1760, dir: -1, arch: 'hauler' },
    { roadIdx: 3, x: 1180, dir: 1, arch: 'sedan' },
  ];

  hPlacements.forEach((p, idx) => {
    const road = city.roadsH[p.roadIdx];
    if (!road) return;
    const laneOffset = p.dir > 0 ? 26 : -26;
    const color = NPC_COLORS[idx % NPC_COLORS.length];
    const car = createCar({
      id: `traffic_h_${idx}`,
      archetype: p.arch,
      x: p.x,
      y: road.y + laneOffset,
      angle: p.dir > 0 ? 0 : Math.PI,
      color,
      isTraffic: true,
      axis: 'h',
      dir: p.dir,
      laneOffset,
    });
    car.speed = 155;
    world.cars.push(car);
  });

  const vPlacements = [
    { roadIdx: 1, y: 520, dir: 1, arch: 'sedan' },
    { roadIdx: 1, y: 1220, dir: -1, arch: 'coupe' },
    { roadIdx: 2, y: 620, dir: 1, arch: 'sedan' },
    { roadIdx: 2, y: 1280, dir: 1, arch: 'sedan' },
    { roadIdx: 2, y: 1760, dir: -1, arch: 'coupe' },
    { roadIdx: 3, y: 1100, dir: 1, arch: 'hauler' },
    { roadIdx: 3, y: 1740, dir: 1, arch: 'sedan' },
    { roadIdx: 3, y: 2140, dir: -1, arch: 'hauler' },
  ];

  vPlacements.forEach((p, idx) => {
    const road = city.roadsV[p.roadIdx];
    if (!road) return;
    const laneOffset = p.dir > 0 ? -26 : 26;
    const color = NPC_COLORS[(idx + 3) % NPC_COLORS.length];
    const car = createCar({
      id: `traffic_v_${idx}`,
      archetype: p.arch,
      x: road.x + laneOffset,
      y: p.y,
      angle: p.dir > 0 ? Math.PI / 2 : -Math.PI / 2,
      color,
      isTraffic: true,
      axis: 'v',
      dir: p.dir,
      laneOffset,
    });
    car.speed = 150;
    world.cars.push(car);
  });

  // Spawn civilian pedestrians along sidewalks and plazas
  const pedSpots = [
    { x: 540, y: 682 },
    { x: 710, y: 682 },
    { x: 990, y: 682 },
    { x: 640, y: 878 },
    { x: 1050, y: 878 },
    { x: 1880, y: 675 },
    { x: 2080, y: 690 },
    { x: 2360, y: 685 },
    { x: 2540, y: 675 },
    { x: 1220, y: 1425 },
    { x: 1410, y: 1425 },
    { x: 1690, y: 1425 },
    { x: 1860, y: 1425 },
    { x: 1260, y: 1615 },
    { x: 1780, y: 1615 },
    { x: 2135, y: 1760 },
    { x: 2135, y: 1980 },
    { x: 2510, y: 1780 },
    { x: 2510, y: 2060 },
  ];

  pedSpots.forEach((spot, i) => {
    const color = NPC_COLORS[i % NPC_COLORS.length];
    const angle = rng.range(0, Math.PI * 2);
    world.pedestrians.push(
      createPedestrian({
        id: `ped_${i}`,
        x: spot.x,
        y: spot.y,
        angle,
        color,
        role: 'civilian',
      }),
    );
  });
}
