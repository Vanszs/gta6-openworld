// Intersection traffic signals and overhead signal gantries.

export function createSignals(city) {
  const intersections = [];

  for (const rh of city.roadsH) {
    for (const rv of city.roadsV) {
      if (rv.x < rh.xMin || rv.x > rh.xMax) continue;
      if (rh.y < rv.yMin || rh.y > rv.yMax) continue;

      intersections.push({
        id: `int_${rh.id}_${rv.id}`,
        x: rv.x,
        y: rh.y,
        w: rv.width,
        h: rh.width,
        hasGantry: rh.isBoulevard || rv.isBoulevard,
        phaseOffset: ((rv.x + rh.y) % 7) * 1.1,
      });
    }
  }

  return {
    timer: 0,
    cycleDuration: 12.0,
    intersections,
  };
}

export function updateSignals(signals, dt) {
  signals.timer = (signals.timer + dt) % (signals.cycleDuration * 100);
}

/**
 * Returns 'green' | 'yellow' | 'red' for a given travel axis ('h' or 'v') at an intersection.
 */
export function getSignalState(signals, intersection, axis = 'h') {
  const t = (signals.timer + intersection.phaseOffset) % signals.cycleDuration;
  const half = signals.cycleDuration * 0.5;
  const inFirstHalf = t < half;
  const localT = inFirstHalf ? t : t - half;

  const axisIsGreenPhase = (axis === 'h' && inFirstHalf) || (axis === 'v' && !inFirstHalf);
  if (!axisIsGreenPhase) return 'red';
  if (localT > half - 1.4) return 'yellow';
  return 'green';
}
