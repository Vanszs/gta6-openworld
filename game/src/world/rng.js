// Deterministic Mulberry32 PRNG for reproducible city generation and shot-mode scenes.

export class RNG {
  constructor(seed = 1337) {
    this.seed = (Number(seed) || 1337) >>> 0;
  }

  next() {
    let t = (this.seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  range(min, max) {
    return min + (max - min) * this.next();
  }

  int(min, maxInclusive) {
    return Math.floor(this.range(min, maxInclusive + 0.999999));
  }

  pick(array) {
    if (!array || array.length === 0) return undefined;
    return array[Math.floor(this.next() * array.length)];
  }
}
