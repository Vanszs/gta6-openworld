// Locked semantic palette, typography, and world constants for NEON WAKE.

export const VIEWPORT_WIDTH = 1280;
export const VIEWPORT_HEIGHT = 800;

export const WORLD_WIDTH = 3600;
export const WORLD_HEIGHT = 2800;

// Semantic locked palette:
// - cyan #24f0ff: player car, on-foot ring, and every UI element only
// - gold #ffd24a: mission beacons, mission markers, radar route line only
// - red/blue: police cruisers, officers, and split red/blue radar blips only
// - magenta #ff2b8f: shops and enemies only
// - civilians: warm brown, olive, slate, silver, violet (no cyan, no amber)
export const UI_CYAN = '#24f0ff';
export const MISSION_GOLD = '#ffd24a';
export const SHOP_ACCENT = '#ff2b8f';
export const ENEMY_ACCENT = '#ff2b8f';
export const POLICE_RED = '#ff334b';
export const POLICE_BLUE = '#2f7bff';
export const POLICE_WHITE = '#eef3ff';

export const TRIM_SLATE = '#5b6480';
export const TRIM_VIOLET = '#6d5b8e';

export const PANEL_BG = 'rgba(8, 11, 20, 0.92)';
export const PANEL_BG_SOLID = 'rgba(8, 10, 18, 0.95)';
export const TEXT_WHITE = '#ffffff';
export const TEXT_LIGHT = '#e4ecff';
export const TEXT_MUTED = '#a6b4d0';

// Civilian palette used by both pedestrians and non-player/non-police traffic cars.
// Strictly warm brown, olive, slate, silver, violet — no cyan, no amber.
export const NPC_COLORS = Object.freeze([
  '#78544c', // warm brown
  '#696c4e', // olive
  '#5d7252', // moss olive
  '#626d86', // slate
  '#79849c', // light slate
  '#a4aec2', // silver
  '#8b93a6', // brushed silver
  '#786298', // violet
  '#685684', // deep violet
  '#6e4f49', // chestnut brown
]);

export const CONTAINER_COLORS = Object.freeze([
  '#75524a', // warm brown container
  '#5c6e4e', // olive container
  '#5b6480', // slate container
  '#6d5b8e', // violet container
  '#8c94a8', // silver container
]);

export const FONTS = Object.freeze({
  hudNumeral: 'bold 26px "Inter", "Segoe UI", Roboto, Arial, sans-serif',
  hudLabel: 'bold 25px "Inter", "Segoe UI", Roboto, Arial, sans-serif',
  shopSign: 'bold 33px "Inter", "Segoe UI", Roboto, Arial, sans-serif',
  controlLegend: 'bold 33px "Inter", "Segoe UI", Roboto, Arial, sans-serif',
  titleStart: 'bold 38px "Inter", "Segoe UI", Roboto, Arial, sans-serif',
  titleLogo: 'bold 64px "Inter", "Segoe UI", Roboto, Arial, sans-serif',
  titleSub: 'bold 25px "Inter", "Segoe UI", Roboto, Arial, sans-serif',
});

export const WEAPONS = Object.freeze([
  {
    id: 'pistol',
    name: 'PISTOL',
    fireRate: 0.24,
    damage: 34,
    speed: 920,
    spread: 0.03,
    range: 620,
    magSize: 12,
    reserveMax: 96,
    infinite: false,
  },
  {
    id: 'smg',
    name: 'PULSE SMG',
    fireRate: 0.095,
    damage: 24,
    speed: 980,
    spread: 0.075,
    range: 560,
    magSize: 32,
    reserveMax: 192,
    infinite: false,
  },
]);

export const VEHICLE_ARCHETYPES = Object.freeze({
  coupe: {
    id: 'coupe',
    label: 'TURBO COUPE',
    width: 34,
    length: 66,
    maxSpeed: 460,
    accel: 390,
    brake: 520,
    reverseMax: 160,
    turnRate: 2.9,
    driftGrip: 0.86,
    maxHp: 240,
  },
  sedan: {
    id: 'sedan',
    label: 'METRO SEDAN',
    width: 34,
    length: 64,
    maxSpeed: 340,
    accel: 260,
    brake: 430,
    reverseMax: 130,
    turnRate: 2.5,
    driftGrip: 0.9,
    maxHp: 190,
  },
  hauler: {
    id: 'hauler',
    label: 'DOCK RUNNER',
    width: 38,
    length: 72,
    maxSpeed: 310,
    accel: 230,
    brake: 400,
    reverseMax: 120,
    turnRate: 2.2,
    driftGrip: 0.92,
    maxHp: 280,
  },
  police: {
    id: 'police',
    label: 'INTERCEPTOR',
    width: 35,
    length: 68,
    maxSpeed: 430,
    accel: 360,
    brake: 500,
    reverseMax: 150,
    turnRate: 2.8,
    driftGrip: 0.88,
    maxHp: 230,
  },
});

export const CONTROL_PROMPT_FOOT = '[WASD] MOVE · [LMB] FIRE · [Q/E] WEAPON · [F] HIJACK';
export const CONTROL_PROMPT_CAR = '[WASD] DRIVE · [SPACE] DRIFT · [LMB] FIRE · [F] EXIT';

export const CONTROL_LEGEND_ITEMS = Object.freeze([
  '[WASD] DRIVE',
  '[SPACE] DRIFT',
  '[LMB] FIRE',
  '[F] HIJACK',
]);
