// Keyboard and mouse input controller with edge-triggered press consumption and world-space aim tracking.

export function createInput(canvas, onFirstKey) {
  const down = new Set();
  const pressed = new Set();

  const state = {
    mouseDown: false,
    mouseX: 640,
    mouseY: 400,
    worldMouseX: null,
    worldMouseY: null,

    isDown(code) {
      return down.has(code);
    },

    consumePressed(code) {
      if (pressed.has(code)) {
        pressed.delete(code);
        return true;
      }
      return false;
    },

    clearFramePressed() {
      pressed.clear();
    },

    updateWorldMouse(camera) {
      this.worldMouseX = camera.x + (this.mouseX - camera.viewportW * 0.5);
      this.worldMouseY = camera.y + (this.mouseY - camera.viewportH * 0.5);
    },
  };

  window.addEventListener('keydown', (e) => {
    if (!down.has(e.code)) {
      pressed.add(e.code);
    }
    down.add(e.code);
    if (onFirstKey) onFirstKey(e.code);
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) {
      e.preventDefault();
    }
  });

  window.addEventListener('keyup', (e) => {
    down.delete(e.code);
  });

  window.addEventListener('blur', () => {
    down.clear();
    pressed.clear();
    state.mouseDown = false;
  });

  canvas.addEventListener('mousemove', (e) => {
    const rect = canvas.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      state.mouseX = ((e.clientX - rect.left) / rect.width) * canvas.width;
      state.mouseY = ((e.clientY - rect.top) / rect.height) * canvas.height;
    }
  });

  canvas.addEventListener('mousedown', (e) => {
    if (e.button === 0) {
      state.mouseDown = true;
    }
  });

  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) {
      state.mouseDown = false;
    }
  });

  return state;
}
