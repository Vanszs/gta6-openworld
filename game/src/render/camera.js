// Viewport-adaptive camera that strictly clamps to city bounds so no frame ever shows void.
import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH, WORLD_HEIGHT, WORLD_WIDTH } from '../config.js';

export function createCamera(x = 860, y = 780) {
  return {
    x,
    y,
    viewportW: VIEWPORT_WIDTH,
    viewportH: VIEWPORT_HEIGHT,
    shakeTimer: 0,
    shakeMagnitude: 0,
  };
}

export function clampCameraToCity(camera, targetX, targetY) {
  const halfW = Math.min(camera.viewportW * 0.5, WORLD_WIDTH * 0.5);
  const halfH = Math.min(camera.viewportH * 0.5, WORLD_HEIGHT * 0.5);
  camera.x = Math.max(halfW, Math.min(WORLD_WIDTH - halfW, targetX));
  camera.y = Math.max(halfH, Math.min(WORLD_HEIGHT - halfH, targetY));
}

export function updateCamera(camera, world, dt, viewportW = VIEWPORT_WIDTH, viewportH = VIEWPORT_HEIGHT) {
  camera.viewportW = viewportW;
  camera.viewportH = viewportH;

  const { player } = world;
  let lookX = player.x;
  let lookY = player.y;

  if (player.car) {
    lookX += Math.cos(player.car.angle) * Math.min(95, Math.abs(player.car.speed) * 0.22);
    lookY += Math.sin(player.car.angle) * Math.min(95, Math.abs(player.car.speed) * 0.22);
  }

  const followRate = Math.min(1, dt * 7.5);
  const nextX = camera.x + (lookX - camera.x) * followRate;
  const nextY = camera.y + (lookY - camera.y) * followRate;

  clampCameraToCity(camera, nextX, nextY);
}
