// Save/load system using localStorage. Never called on boot; loaded only on explicit user request.

const SAVE_KEY = 'neon_wake_save_v1';

export function hasSaveGame() {
  try {
    return Boolean(window.localStorage.getItem(SAVE_KEY));
  } catch {
    return false;
  }
}

export function saveGame(world) {
  try {
    const { player, wanted, missions } = world;
    const payload = {
      version: 1,
      x: Math.round(player.x),
      y: Math.round(player.y),
      hp: player.hp,
      armour: player.armour,
      cash: player.cash,
      weaponIndex: player.weaponIndex,
      stars: wanted.stars,
      missionIndex: missions.currentIndex,
      timestamp: Date.now(),
    };
    window.localStorage.setItem(SAVE_KEY, JSON.stringify(payload));
    if (world.toast) {
      world.toast.push('GAME SAVED TO LOCAL STORAGE', 2.2);
    }
    return true;
  } catch {
    return false;
  }
}

export function loadGame(world) {
  try {
    const raw = window.localStorage.getItem(SAVE_KEY);
    if (!raw) {
      if (world.toast) world.toast.push('NO SAVE DATA FOUND', 2.0);
      return false;
    }
    const data = JSON.parse(raw);
    if (!data || typeof data !== 'object') return false;

    const { player, wanted, missions } = world;
    if (player.car) {
      player.car.driver = null;
      player.car = null;
    }
    player.dead = false;
    player.x = Number(data.x) || 780;
    player.y = Number(data.y) || 700;
    player.hp = Math.max(10, Math.min(100, Number(data.hp) || 100));
    player.armour = Math.max(0, Math.min(100, Number(data.armour) || 50));
    player.cash = Math.max(0, Number(data.cash) || 2500);
    player.weaponIndex = Number(data.weaponIndex) || 0;

    wanted.setStars(world, Number(data.stars) || 0, true);
    missions.resyncFromSave(world, Number(data.missionIndex) || 0);

    if (world.toast) {
      world.toast.push(`SAVE LOADED · ${missions.objectiveText}`, 2.5);
    }
    return true;
  } catch {
    return false;
  }
}
