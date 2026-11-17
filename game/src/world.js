// Master World state container and frame update pipeline.
import { updatePoliceAI } from './ai/police.js';
import { updateTraffic } from './ai/traffic.js';
import { updatePlayerCar } from './entities/car.js';
import { updatePedestrians } from './entities/pedestrian.js';
import { createPlayer, updatePlayer } from './entities/player.js';
import { createCombatSystem } from './systems/combat.js';
import { createMissionSystem } from './systems/missions.js';
import { createWantedSystem } from './systems/wanted.js';
import { createToastSystem } from './ui/toast.js';
import { createCity } from './world/city.js';
import { createEffects, updateEffects } from './world/effects.js';
import { RNG } from './world/rng.js';
import { updateShops } from './world/shops.js';
import { createSignals, updateSignals } from './world/signals.js';
import { populateInitialWorld } from './world/spawner.js';

export function createWorld(seed = 101, audio = null) {
  const rng = new RNG(seed);
  const city = createCity(seed);
  const signals = createSignals(city);
  const effects = createEffects();
  const player = createPlayer(785, 700);
  const combat = createCombatSystem();
  const wanted = createWantedSystem();
  const missions = createMissionSystem();
  const toast = createToastSystem();

  const world = {
    seed,
    rng,
    time: 0,
    city,
    signals,
    effects,
    player,
    cars: [],
    pedestrians: [],
    combat,
    wanted,
    missions,
    toast,
    audio,
    shopCooldown: 0,
    shotMode: null,
  };

  populateInitialWorld(world);
  missions.startJob(world, 0, true);
  return world;
}

export function updateWorld(world, dt, input, isTitleMode = false) {
  world.time += dt;
  updateSignals(world.signals, dt);
  updateEffects(world.effects, dt);

  if (isTitleMode) {
    updateTraffic(world, dt);
    return;
  }

  updatePlayer(world, dt, input);
  if (world.player.car) {
    updatePlayerCar(world, world.player.car, dt, input);
  }

  updateTraffic(world, dt);
  updatePedestrians(world, dt);
  updatePoliceAI(world, dt);
  world.combat.update(world, dt, input);
  world.wanted.update(world, dt);
  world.missions.update(world, dt);
  updateShops(world, dt);
  world.toast.update(dt);

  if (world.audio) {
    world.audio.update(world, dt);
  }
}
