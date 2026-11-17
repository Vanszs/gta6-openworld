// City layout: road grid, boulevards, sidewalks, detailed buildings, park, and harbor waterfront.
import {
  CONTAINER_COLORS,
  TRIM_SLATE,
  TRIM_VIOLET,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from '../config.js';
import { RNG } from './rng.js';
import { SHOPS } from './shops.js';

export function createCity(seed = 101) {
  const rng = new RNG(seed);

  // Horizontal roads (y center, width, lanes)
  const roadsH = [
    { id: 'rh_north', y: 260, width: 116, lanes: 2, isBoulevard: false, xMin: 0, xMax: 2940 },
    { id: 'rh_blvd', y: 780, width: 160, lanes: 4, isBoulevard: true, xMin: 0, xMax: 2940 },
    { id: 'rh_mid', y: 1520, width: 152, lanes: 4, isBoulevard: true, xMin: 0, xMax: 2560 },
    { id: 'rh_south', y: 2360, width: 120, lanes: 2, isBoulevard: false, xMin: 0, xMax: 2480 },
  ];

  // Vertical roads (x center, width, lanes)
  const roadsV = [
    { id: 'rv_west', x: 260, width: 116, lanes: 2, isBoulevard: false, yMin: 0, yMax: WORLD_HEIGHT },
    { id: 'rv_blvd', x: 860, width: 152, lanes: 4, isBoulevard: true, yMin: 0, yMax: WORLD_HEIGHT },
    { id: 'rv_mid', x: 1540, width: 152, lanes: 4, isBoulevard: true, yMin: 0, yMax: WORLD_HEIGHT },
    { id: 'rv_quay', x: 2220, width: 132, lanes: 2, isBoulevard: false, yMin: 0, yMax: WORLD_HEIGHT },
    { id: 'rv_east', x: 2820, width: 116, lanes: 2, isBoulevard: false, yMin: 0, yMax: 1480 },
  ];

  // Neon commercial plaza open courtyard around (2220, 760) for the 2-ambush scene
  const plazas = [
    { id: 'plaza_neon', x: 1720, y: 635, w: 1000, h: 310 },
    { id: 'plaza_midtown', x: 1040, y: 1150, w: 1000, h: 290 },
  ];

  // Central Park in West-Central block
  const park = {
    x: 965,
    y: 890,
    w: 470,
    h: 245,
    trees: [
      { x: 1015, y: 935, r: 24 },
      { x: 1080, y: 925, r: 20 },
      { x: 1365, y: 935, r: 25 },
      { x: 1390, y: 1005, r: 21 },
      { x: 1020, y: 1085, r: 23 },
      { x: 1105, y: 1095, r: 19 },
      { x: 1355, y: 1085, r: 24 },
      { x: 1265, y: 935, r: 20 },
    ],
    pond: { x: 1195, y: 1012, rx: 64, ry: 38 },
  };

  // Unmistakable Harbor Waterfront (southeast & east edge)
  const waterfront = {
    waterMain: { x: 2565, y: 1460, w: WORLD_WIDTH - 2565, h: WORLD_HEIGHT - 1460 },
    waterNorthBay: { x: 2930, y: 0, w: WORLD_WIDTH - 2930, h: 1460 },
    apron: { x: 2286, y: 1460, w: 198, h: WORLD_HEIGHT - 1460 },
    boardwalk: { x: 2484, y: 1460, w: 81, h: WORLD_HEIGHT - 1460 },
    boardwalkNorth: { x: 2878, y: 0, w: 52, h: 1460 },
    piers: [
      { id: 'pier_north', x: 2565, y: 1620, w: 430, h: 104, plankStep: 14 },
      { id: 'pier_main', x: 2565, y: 1865, w: 495, h: 124, plankStep: 14 },
      { id: 'pier_south', x: 2565, y: 2140, w: 410, h: 104, plankStep: 14 },
    ],
    crane: {
      x: 2335,
      y: 1685,
      w: 420,
      h: 118,
      railX1: 2348,
      railX2: 2462,
      railY1: 1580,
      railY2: 2290,
      cabX: 2520,
      cabY: 1726,
    },
    containers: [
      // Upper dock stacks near crane
      { x: 2316, y: 1605, w: 68, h: 32, color: CONTAINER_COLORS[0], tier: 1 },
      { x: 2322, y: 1601, w: 68, h: 32, color: CONTAINER_COLORS[2], tier: 2 },
      { x: 2394, y: 1605, w: 68, h: 32, color: CONTAINER_COLORS[1], tier: 1 },
      { x: 2316, y: 1646, w: 68, h: 32, color: CONTAINER_COLORS[3], tier: 1 },
      { x: 2394, y: 1646, w: 68, h: 32, color: CONTAINER_COLORS[4], tier: 1 },
      // Mid dock stacks right beside hotwire car & main pier
      { x: 2316, y: 1820, w: 72, h: 34, color: CONTAINER_COLORS[0], tier: 1 },
      { x: 2322, y: 1815, w: 72, h: 34, color: CONTAINER_COLORS[4], tier: 2 },
      { x: 2398, y: 1820, w: 72, h: 34, color: CONTAINER_COLORS[1], tier: 1 },
      { x: 2316, y: 1864, w: 72, h: 34, color: CONTAINER_COLORS[2], tier: 1 },
      // Lower dock stacks below hotwire car
      { x: 2316, y: 2105, w: 72, h: 34, color: CONTAINER_COLORS[3], tier: 1 },
      { x: 2322, y: 2100, w: 72, h: 34, color: CONTAINER_COLORS[0], tier: 2 },
      { x: 2398, y: 2105, w: 72, h: 34, color: CONTAINER_COLORS[2], tier: 1 },
      { x: 2316, y: 2150, w: 72, h: 34, color: CONTAINER_COLORS[1], tier: 1 },
      { x: 2398, y: 2150, w: 72, h: 34, color: CONTAINER_COLORS[4], tier: 1 },
      { x: 2404, y: 2145, w: 72, h: 34, color: CONTAINER_COLORS[3], tier: 2 },
      // Containers on north & south piers
      { x: 2680, y: 1638, w: 66, h: 30, color: CONTAINER_COLORS[0], tier: 1 },
      { x: 2758, y: 1638, w: 66, h: 30, color: CONTAINER_COLORS[2], tier: 1 },
      { x: 2690, y: 2158, w: 66, h: 30, color: CONTAINER_COLORS[1], tier: 1 },
      { x: 2768, y: 2158, w: 66, h: 30, color: CONTAINER_COLORS[3], tier: 1 },
    ],
    bollards: [],
  };

  // Populate harbor bollards along seawall and piers
  for (let y = 1490; y <= 2740; y += 64) {
    waterfront.bollards.push({ x: 2552, y });
  }
  for (const pier of waterfront.piers) {
    for (let x = pier.x + 36; x <= pier.x + pier.w - 24; x += 68) {
      waterfront.bollards.push({ x, y: pier.y + 10 });
      waterfront.bollards.push({ x, y: pier.y + pier.h - 10 });
    }
  }

  // Hand-crafted & procedural city buildings with window grids and slate/violet roof trims
  const rawBuildings = [
    // --- Northwest / Boulevard District (around 1-cover camera 860, 780) ---
    { id: 'b_nw_1', x: 350, y: 355, w: 120, h: 295, trim: TRIM_SLATE, roofType: 'vents' },
    { id: 'b_nw_garage', x: 485, y: 420, w: 255, h: 235, trim: TRIM_VIOLET, roofType: 'skylight' },
    { id: 'b_nw_top', x: 965, y: 380, w: 280, h: 270, trim: TRIM_SLATE, roofType: 'skylight', shopId: 'garage' },
    { id: 'b_nw_top2', x: 1265, y: 380, w: 175, h: 270, trim: TRIM_VIOLET, roofType: 'vents' },
    { id: 'b_sw_blvd1', x: 360, y: 895, w: 195, h: 245, trim: TRIM_VIOLET, roofType: 'skylight' },
    { id: 'b_sw_blvd2', x: 575, y: 895, w: 175, h: 245, trim: TRIM_SLATE, roofType: 'vents' },
    { id: 'b_sw_blvd3', x: 360, y: 1170, w: 390, h: 220, trim: TRIM_SLATE, roofType: 'helipad' },

    // --- Northeast / Neon Plaza District (around 2-ambush camera 2220, 760) ---
    { id: 'b_plaza_ammo', x: 1750, y: 425, w: 370, h: 215, trim: TRIM_VIOLET, roofType: 'vents' },
    { id: 'b_plaza_synth', x: 2310, y: 425, w: 370, h: 215, trim: TRIM_SLATE, roofType: 'skylight', shopId: 'synth_club' },
    { id: 'b_plaza_sw', x: 1750, y: 915, w: 360, h: 220, trim: TRIM_SLATE, roofType: 'skylight', shopId: 'ammo' },
    { id: 'b_plaza_se', x: 2320, y: 915, w: 360, h: 220, trim: TRIM_VIOLET, roofType: 'vents' },

    // --- Midtown Commercial Intersection (around 4-title camera 1540, 1520) ---
    { id: 'b_mid_signal', x: 945, y: 1175, w: 485, h: 230, trim: TRIM_VIOLET, roofType: 'skylight', shopId: 'signal_cafe' },
    { id: 'b_mid_pulse', x: 1650, y: 1175, w: 485, h: 230, trim: TRIM_SLATE, roofType: 'helipad', shopId: 'pulse_tech' },
    { id: 'b_mid_sw', x: 945, y: 1635, w: 485, h: 250, trim: TRIM_SLATE, roofType: 'vents' },
    { id: 'b_mid_se', x: 1650, y: 1635, w: 470, h: 250, trim: TRIM_VIOLET, roofType: 'skylight' },

    // --- Dockside / Quay West Buildings (around 3-mission camera 2500, 1980) ---
    { id: 'b_dock_pawn', x: 1870, y: 1945, w: 255, h: 235, trim: TRIM_VIOLET, roofType: 'vents', shopId: 'cyber_pawn' },
    { id: 'b_dock_ware2', x: 1870, y: 2205, w: 255, h: 120, trim: TRIM_SLATE, roofType: 'skylight' },

    // --- Outer Perimeter Blocks (so clamped camera never sees empty ground) ---
    { id: 'b_perim_nw1', x: 40, y: 40, w: 135, h: 135, trim: TRIM_SLATE, roofType: 'vents' },
    { id: 'b_perim_nw2', x: 350, y: 40, w: 400, h: 135, trim: TRIM_VIOLET, roofType: 'skylight' },
    { id: 'b_perim_n1', x: 965, y: 40, w: 465, h: 135, trim: TRIM_SLATE, roofType: 'vents' },
    { id: 'b_perim_n2', x: 1655, y: 40, w: 465, h: 135, trim: TRIM_VIOLET, roofType: 'skylight' },
    { id: 'b_perim_ne', x: 2315, y: 40, w: 415, h: 135, trim: TRIM_SLATE, roofType: 'vents' },
    { id: 'b_perim_w1', x: 40, y: 355, w: 135, h: 300, trim: TRIM_VIOLET, roofType: 'vents' },
    { id: 'b_perim_w2', x: 40, y: 895, w: 135, h: 495, trim: TRIM_SLATE, roofType: 'skylight' },
    { id: 'b_perim_w3', x: 40, y: 1635, w: 135, h: 635, trim: TRIM_VIOLET, roofType: 'vents' },
    { id: 'b_perim_sw1', x: 360, y: 1635, w: 390, h: 290, trim: TRIM_VIOLET, roofType: 'skylight' },
    { id: 'b_perim_sw2', x: 360, y: 1960, w: 390, h: 310, trim: TRIM_SLATE, roofType: 'vents' },
    { id: 'b_perim_s1', x: 965, y: 1920, w: 460, h: 350, trim: TRIM_VIOLET, roofType: 'helipad' },
    { id: 'b_perim_s2', x: 1655, y: 1920, w: 190, h: 350, trim: TRIM_SLATE, roofType: 'vents' },
    { id: 'b_perim_s3', x: 360, y: 2450, w: 390, h: 290, trim: TRIM_SLATE, roofType: 'skylight' },
    { id: 'b_perim_s4', x: 965, y: 2450, w: 460, h: 290, trim: TRIM_VIOLET, roofType: 'vents' },
    { id: 'b_perim_s5', x: 1655, y: 2450, w: 460, h: 290, trim: TRIM_SLATE, roofType: 'skylight' },
    { id: 'b_perim_e1', x: 2310, y: 1180, w: 420, h: 230, trim: TRIM_SLATE, roofType: 'vents' },
  ];

  const shopsByBuilding = new Map(SHOPS.map((s) => [s.buildingId, s]));

  const buildings = rawBuildings.map((b, idx) => {
    const shop = shopsByBuilding.get(b.id) || null;
    const cols = Math.max(4, Math.floor((b.w - 28) / 22));
    const rows = Math.max(3, Math.floor((b.h - 28) / 22));
    const windows = [];
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const wx = b.x + 16 + c * ((b.w - 32) / cols);
        const wy = b.y + 16 + r * ((b.h - 32) / rows);
        const lit = rng.next() > 0.16;
        const toneIdx = (r + c + idx) % 3;
        // Warm ivory, soft periwinkle, or soft violet window light (no cyan!)
        const color =
          toneIdx === 0 ? '#e6d8a8' : toneIdx === 1 ? '#a8bce8' : '#c6aee8';
        windows.push({ x: wx, y: wy, w: 12, h: 10, lit, color });
      }
    }
    return {
      ...b,
      baseColor: idx % 2 === 0 ? '#2f384e' : '#353e56',
      roofColor: idx % 2 === 0 ? '#39445e' : '#404b66',
      shop,
      windows,
    };
  });

  // Generate streetlamps along all roads
  const streetlamps = [];
  for (const rh of roadsH) {
    const half = rh.width / 2 + 16;
    for (let x = 140; x < rh.xMax - 60; x += 180) {
      streetlamps.push({ x, y: rh.y - half });
      streetlamps.push({ x, y: rh.y + half });
    }
  }
  for (const rv of roadsV) {
    const half = rv.width / 2 + 16;
    for (let y = 140; y < rv.yMax - 60; y += 180) {
      streetlamps.push({ x: rv.x - half, y });
      streetlamps.push({ x: rv.x + half, y });
    }
  }

  return {
    width: WORLD_WIDTH,
    height: WORLD_HEIGHT,
    roadsH,
    roadsV,
    plazas,
    park,
    waterfront,
    buildings,
    streetlamps,
    shops: SHOPS,
  };
}
