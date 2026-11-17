// Procedural WebAudio synthesizer: strictly silent until first key press, supports mute key (M).

export function createAudioSystem() {
  return {
    ctx: null,
    unlocked: false,
    muted: false,
    engineOsc: null,
    engineGain: null,
    sirenPhase: 0,

    unlockOnKey() {
      if (this.unlocked) return;
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      try {
        this.ctx = new AudioCtx();
        if (this.ctx.state === 'suspended') {
          this.ctx.resume();
        }
        this.engineOsc = this.ctx.createOscillator();
        this.engineGain = this.ctx.createGain();
        this.engineOsc.type = 'sawtooth';
        this.engineOsc.frequency.value = 58;
        this.engineGain.gain.value = 0.0001;
        this.engineOsc.connect(this.engineGain);
        this.engineGain.connect(this.ctx.destination);
        this.engineOsc.start();
        this.unlocked = true;
      } catch {
        this.unlocked = false;
      }
    },

    toggleMute() {
      this.muted = !this.muted;
      if (this.muted && this.engineGain && this.ctx) {
        this.engineGain.gain.setTargetAtTime(0.0001, this.ctx.currentTime, 0.04);
      }
    },

    playShot(weaponId = 'pistol') {
      if (!this.unlocked || this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = weaponId === 'smg' ? 'square' : 'sawtooth';
        osc.frequency.setValueAtTime(weaponId === 'smg' ? 240 : 180, now);
        osc.frequency.exponentialRampToValueAtTime(42, now + 0.09);

        gain.gain.setValueAtTime(0.11, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.095);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
      } catch {
        // Ignore audio scheduling errors in headless mode
      }
    },

    playChime() {
      if (!this.unlocked || this.muted || !this.ctx) return;
      try {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(520, now);
        osc.frequency.setValueAtTime(780, now + 0.08);

        gain.gain.setValueAtTime(0.09, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.25);
      } catch {
        // Ignore
      }
    },

    update(world, dt) {
      if (!this.unlocked || !this.ctx || !this.engineGain || !this.engineOsc) return;
      const now = this.ctx.currentTime;
      if (this.muted) {
        this.engineGain.gain.setTargetAtTime(0.0001, now, 0.05);
        return;
      }

      const car = world.player && world.player.car;
      if (car) {
        const spd = Math.abs(car.speed);
        const freq = 55 + Math.min(180, spd * 0.35) + (car.drifting ? 28 : 0);
        this.engineOsc.frequency.setTargetAtTime(freq, now, 0.05);
        this.engineGain.gain.setTargetAtTime(0.045, now, 0.06);
      } else {
        this.engineGain.gain.setTargetAtTime(0.0001, now, 0.06);
      }
      this.sirenPhase += dt;
    },
  };
}
