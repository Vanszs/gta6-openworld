// Six rooftop shops with solid dark pills, SHOP_ACCENT borders, and interactive service pads.
import { SHOP_ACCENT } from '../config.js';

export const SHOPS = Object.freeze([
  {
    id: 'garage',
    name: 'GARAGE',
    buildingId: 'b_nw_top',
    signX: 1105,
    signY: 555,
    padX: 1105,
    padY: 678,
    cost: 200,
    action: 'repair',
    description: 'FULL CHASSIS REPAIR ($200)',
  },
  {
    id: 'ammo',
    name: 'AMMO',
    buildingId: 'b_plaza_sw',
    signX: 1930,
    signY: 1015,
    padX: 1930,
    padY: 892,
    cost: 150,
    action: 'ammo',
    description: 'FULL AMMO REFILL ($150)',
  },
  {
    id: 'synth_club',
    name: 'SYNTH CLUB',
    buildingId: 'b_plaza_synth',
    signX: 2495,
    signY: 545,
    padX: 2495,
    padY: 668,
    cost: 180,
    action: 'armour',
    description: 'BODY ARMOUR VEST ($180)',
  },
  {
    id: 'signal_cafe',
    name: 'SIGNAL CAFE',
    buildingId: 'b_mid_signal',
    signX: 1085,
    signY: 1295,
    padX: 1240,
    padY: 1426,
    cost: 100,
    action: 'heal',
    description: 'STIM ESPRESSO +HP ($100)',
  },
  {
    id: 'pulse_tech',
    name: 'PULSE TECH',
    buildingId: 'b_mid_pulse',
    signX: 1995,
    signY: 1295,
    padX: 1840,
    padY: 1426,
    cost: 250,
    action: 'clear_heat',
    description: 'SCRAMBLE POLICE DISPATCH ($250)',
  },
  {
    id: 'cyber_pawn',
    name: 'CYBER PAWN',
    buildingId: 'b_dock_pawn',
    signX: 1995,
    signY: 2065,
    padX: 2145,
    padY: 2065,
    cost: 150,
    action: 'ammo',
    description: 'SURPLUS MUNITIONS ($150)',
  },
]);

export function getShopAccent() {
  return SHOP_ACCENT;
}

export function updateShops(world, dt) {
  const player = world.player;
  if (!player || player.dead) return;
  if (world.shopCooldown > 0) {
    world.shopCooldown = Math.max(0, world.shopCooldown - dt);
    return;
  }

  for (const shop of SHOPS) {
    const dx = player.x - shop.padX;
    const dy = player.y - shop.padY;
    if (dx * dx + dy * dy > 42 * 42) continue;

    if (player.cash < shop.cost) continue;

    let used = false;
    if (shop.action === 'repair' && player.car && player.car.hp < player.car.maxHp) {
      player.car.hp = player.car.maxHp;
      used = true;
    } else if (shop.action === 'ammo') {
      for (const w of Object.values(player.ammo)) {
        if (w.reserve < w.reserveMax || w.mag < w.magSize) {
          w.mag = w.magSize;
          w.reserve = w.reserveMax;
          used = true;
        }
      }
    } else if (shop.action === 'armour' && player.armour < 100) {
      player.armour = 100;
      used = true;
    } else if (shop.action === 'heal' && player.hp < 100) {
      player.hp = 100;
      used = true;
    } else if (shop.action === 'clear_heat' && world.wanted.stars > 0) {
      world.wanted.clearAll(world);
      used = true;
    }

    if (used) {
      player.cash -= shop.cost;
      world.shopCooldown = 4.0;
      if (world.toast) {
        world.toast.push(`${shop.name} · -$${shop.cost}`, 2.4);
      }
      if (world.audio) {
        world.audio.playChime();
      }
      break;
    }
  }
}
