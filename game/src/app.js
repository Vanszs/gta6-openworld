// GameApp: manages the main loop, title/play/pause state machine, resize clamping, save/load, and shot mode.
import { createAudioSystem } from './audio/audio.js';
import { VIEWPORT_HEIGHT, VIEWPORT_WIDTH } from './config.js';
import { createInput } from './input.js';
import { clampCameraToCity, createCamera, updateCamera } from './render/camera.js';
import { renderFrame } from './render/renderer.js';
import { applyShotScene } from './shot-mode.js';
import { loadGame, saveGame } from './systems/save.js';
import { createWorld, updateWorld } from './world.js';

export function startApp(canvas, statusEl) {
  const ctx = canvas.getContext('2d');
  const params = new URLSearchParams(window.location.search);
  const seedParam = Number(params.get('seed')) || 101;
  const shotParam = params.get('shot');

  const audio = createAudioSystem();
  const world = createWorld(seedParam, audio);
  const camera = createCamera(1540, 1520);

  const appState = {
    mode: 'title', // 'title' | 'playing' | 'paused'
    shotMeta: null,
  };

  const syncViewportSize = () => {
    if (shotParam) {
      canvas.width = VIEWPORT_WIDTH;
      canvas.height = VIEWPORT_HEIGHT;
    } else {
      canvas.width = Math.max(VIEWPORT_WIDTH, window.innerWidth || VIEWPORT_WIDTH);
      canvas.height = Math.max(VIEWPORT_HEIGHT, window.innerHeight || VIEWPORT_HEIGHT);
    }
    camera.viewportW = canvas.width;
    camera.viewportH = canvas.height;
    clampCameraToCity(camera, camera.x, camera.y);
  };

  syncViewportSize();
  window.addEventListener('resize', syncViewportSize);

  const input = createInput(canvas, (keyCode) => {
    audio.unlockOnKey();
    if (keyCode === 'KeyM') {
      audio.toggleMute();
    }
  });

  if (shotParam) {
    appState.shotMeta = applyShotScene(world, camera, appState, shotParam);
    renderFrame(ctx, world, camera, appState);
    if (statusEl) {
      statusEl.textContent = `NEON WAKE shot ${appState.shotMeta ? appState.shotMeta.shotId : shotParam}`;
    }
  } else {
    // Position title screen backdrop at the lit Midtown Commercial Intersection
    clampCameraToCity(camera, 1540, 1520);
  }

  let lastTime = performance.now();

  const tick = (now) => {
    const dt = Math.min(0.05, Math.max(0.001, (now - lastTime) / 1000));
    lastTime = now;

    if (!shotParam) {
      input.updateWorldMouse(camera);

      if (appState.mode === 'title') {
        if (input.consumePressed('Enter') || input.consumePressed('Space')) {
          appState.mode = 'playing';
          clampCameraToCity(camera, world.player.x, world.player.y);
          world.toast.push('JOB 1/5: BOOST DOCK COUPE & DELIVER TO PIER', 3.0);
        }
        updateWorld(world, dt, input, true);
      } else if (appState.mode === 'playing') {
        if (input.consumePressed('Escape') || input.consumePressed('KeyP')) {
          appState.mode = 'paused';
        } else {
          updateWorld(world, dt, input, false);
          updateCamera(camera, world, dt, canvas.width, canvas.height);
        }
      } else if (appState.mode === 'paused') {
        if (
          input.consumePressed('Escape') ||
          input.consumePressed('KeyP') ||
          input.consumePressed('Enter')
        ) {
          appState.mode = 'playing';
        } else if (input.consumePressed('KeyK')) {
          saveGame(world);
        } else if (input.consumePressed('KeyL')) {
          if (loadGame(world)) {
            clampCameraToCity(camera, world.player.x, world.player.y);
            appState.mode = 'playing';
          }
        }
      }

      input.clearFramePressed();
    }

    renderFrame(ctx, world, camera, appState);

    if (statusEl && !shotParam) {
      statusEl.textContent = `Mode: ${appState.mode} | Cash: $${world.player.cash} | Wanted: ${world.wanted.stars} | ${world.missions.objectiveText}`;
    }

    window.requestAnimationFrame(tick);
  };

  window.requestAnimationFrame(tick);
  window.__NEON_WAKE_APP__ = { world, camera, appState, input };
  return { world, camera, appState };
}
