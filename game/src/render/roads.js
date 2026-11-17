// Renders city blocks, sidewalks, plazas, park, multi-lane roads, signal gantries, and the harbor waterfront.
import { getSignalState } from '../world/signals.js';

export function renderRoadsAndWaterfront(ctx, world, camera) {
  const { city, signals, time } = world;

  // 1. Base urban sidewalk / block pavement (luminance ~85 so black% stays low and city reads clearly)
  ctx.fillStyle = '#4c5772';
  ctx.fillRect(0, 0, city.width, city.height);

  // Sidewalk paver grid lines across visible viewport
  const vx0 = Math.max(0, Math.floor((camera.x - camera.viewportW * 0.5) / 64) * 64);
  const vx1 = Math.min(city.width, camera.x + camera.viewportW * 0.5 + 64);
  const vy0 = Math.max(0, Math.floor((camera.y - camera.viewportH * 0.5) / 64) * 64);
  const vy1 = Math.min(city.height, camera.y + camera.viewportH * 0.5 + 64);

  ctx.strokeStyle = '#5a6684';
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = vx0; x <= vx1; x += 64) {
    ctx.moveTo(x, vy0);
    ctx.lineTo(x, vy1);
  }
  for (let y = vy0; y <= vy1; y += 64) {
    ctx.moveTo(vx0, y);
    ctx.lineTo(vx1, y);
  }
  ctx.stroke();

  // 2. Plazas with bright architectural tiles
  for (const plaza of city.plazas) {
    ctx.fillStyle = '#566382';
    ctx.fillRect(plaza.x, plaza.y, plaza.w, plaza.h);
    ctx.strokeStyle = '#6c7b9e';
    ctx.lineWidth = 2;
    ctx.strokeRect(plaza.x + 4, plaza.y + 4, plaza.w - 8, plaza.h - 8);

    ctx.strokeStyle = '#647394';
    ctx.lineWidth = 1;
    for (let px = plaza.x + 48; px < plaza.x + plaza.w; px += 48) {
      ctx.beginPath();
      ctx.moveTo(px, plaza.y);
      ctx.lineTo(px, plaza.y + plaza.h);
      ctx.stroke();
    }
    for (let py = plaza.y + 48; py < plaza.y + plaza.h; py += 48) {
      ctx.beginPath();
      ctx.moveTo(plaza.x, py);
      ctx.lineTo(plaza.x + plaza.w, py);
      ctx.stroke();
    }
  }

  // 3. Central Park (lawn, footpaths, pond, trees)
  const { park } = city;
  ctx.fillStyle = '#385e48';
  ctx.fillRect(park.x, park.y, park.w, park.h);
  ctx.strokeStyle = '#6c7892';
  ctx.lineWidth = 6;
  ctx.strokeRect(park.x, park.y, park.w, park.h);

  // Park stone footpaths
  ctx.strokeStyle = '#7c879e';
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(park.x + 12, park.y + park.h * 0.5);
  ctx.lineTo(park.x + park.w - 12, park.y + park.h * 0.5);
  ctx.moveTo(park.x + park.w * 0.5, park.y + 12);
  ctx.lineTo(park.x + park.w * 0.5, park.y + park.h - 12);
  ctx.stroke();

  // Park pond
  ctx.fillStyle = '#2e5077';
  ctx.beginPath();
  ctx.ellipse(park.pond.x, park.pond.y, park.pond.rx, park.pond.ry, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = '#8d99b2';
  ctx.lineWidth = 4;
  ctx.stroke();

  for (const tree of park.trees) {
    ctx.fillStyle = '#284736';
    ctx.beginPath();
    ctx.arc(tree.x + 3, tree.y + 4, tree.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4c7c5d';
    ctx.beginPath();
    ctx.arc(tree.x, tree.y, tree.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#689c78';
    ctx.beginPath();
    ctx.arc(tree.x - 5, tree.y - 5, tree.r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }

  // 4. Harbor Waterfront: Concrete Apron, Timber Boardwalk, Water Plane with Moving Highlights, Piers, Bollards
  const wf = city.waterfront;

  // Concrete apron
  ctx.fillStyle = '#525d76';
  ctx.fillRect(wf.apron.x, wf.apron.y, wf.apron.w, wf.apron.h);
  ctx.strokeStyle = '#667390';
  ctx.lineWidth = 2;
  for (let y = wf.apron.y; y < wf.apron.y + wf.apron.h; y += 56) {
    ctx.beginPath();
    ctx.moveTo(wf.apron.x, y);
    ctx.lineTo(wf.apron.x + wf.apron.w, y);
    ctx.stroke();
  }

  // Crane rails along the apron
  ctx.strokeStyle = '#7f8ca8';
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(wf.crane.railX1, wf.crane.railY1);
  ctx.lineTo(wf.crane.railX1, wf.crane.railY2);
  ctx.moveTo(wf.crane.railX2, wf.crane.railY1);
  ctx.lineTo(wf.crane.railX2, wf.crane.railY2);
  ctx.stroke();

  // Timber boardwalk along seawall
  ctx.fillStyle = '#6e5d53';
  ctx.fillRect(wf.boardwalk.x, wf.boardwalk.y, wf.boardwalk.w, wf.boardwalk.h);
  ctx.fillRect(wf.boardwalkNorth.x, wf.boardwalkNorth.y, wf.boardwalkNorth.w, wf.boardwalkNorth.h);

  ctx.strokeStyle = '#52453d';
  ctx.lineWidth = 2;
  for (let y = wf.boardwalk.y; y < wf.boardwalk.y + wf.boardwalk.h; y += 12) {
    ctx.beginPath();
    ctx.moveTo(wf.boardwalk.x, y);
    ctx.lineTo(wf.boardwalk.x + wf.boardwalk.w, y);
    ctx.stroke();
  }

  // Seawall stone coping edge
  ctx.fillStyle = '#9aa6c0';
  ctx.fillRect(wf.boardwalk.x + wf.boardwalk.w - 8, wf.boardwalk.y, 8, wf.boardwalk.h);

  // Harbor Water Plane (southeast & north bay)
  for (const wRect of [wf.waterMain, wf.waterNorthBay]) {
    ctx.fillStyle = '#244064';
    ctx.fillRect(wRect.x, wRect.y, wRect.w, wRect.h);

    // Foam & shallow shelf near seawall
    ctx.fillStyle = '#385c88';
    ctx.fillRect(wRect.x, wRect.y, 26, wRect.h);

    // Moving wave highlights (strictly soft harbor blue/periwinkle/silver, never cyan #24f0ff)
    const waveShift = (time * 38) % 64;
    for (let wy = wRect.y + 18; wy < wRect.y + wRect.h - 12; wy += 28) {
      const rowOffset = ((wy * 17) % 52) + waveShift;
      for (let wx = wRect.x + 24 + (rowOffset % 64); wx < wRect.x + wRect.w - 40; wx += 82) {
        ctx.fillStyle = '#5882b4';
        ctx.fillRect(wx, wy, 38, 5);
        ctx.fillStyle = '#8ab0dc';
        ctx.fillRect(wx + 8, wy + 1, 18, 3);
      }
    }
  }

  // Wooden Piers with transverse planks extending over the water
  for (const pier of wf.piers) {
    // Shadow in water
    ctx.fillStyle = 'rgba(10, 18, 32, 0.45)';
    ctx.fillRect(pier.x + 6, pier.y + 10, pier.w, pier.h);

    // Base timber deck
    ctx.fillStyle = '#736157';
    ctx.fillRect(pier.x, pier.y, pier.w, pier.h);

    // Alternating pier planks
    for (let px = pier.x; px < pier.x + pier.w; px += pier.plankStep) {
      ctx.fillStyle = ((px / pier.plankStep) | 0) % 2 === 0 ? '#7d6a5f' : '#63534a';
      ctx.fillRect(px, pier.y + 6, pier.plankStep - 2, pier.h - 12);
    }

    // Side guard beams
    ctx.fillStyle = '#8c786c';
    ctx.fillRect(pier.x, pier.y, pier.w, 7);
    ctx.fillRect(pier.x, pier.y + pier.h - 7, pier.w, 7);
  }

  // Harbor cast-iron bollards along boardwalk and piers
  for (const bol of wf.bollards) {
    ctx.fillStyle = '#252b3b';
    ctx.beginPath();
    ctx.arc(bol.x, bol.y, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#9aa6c0';
    ctx.beginPath();
    ctx.arc(bol.x - 1, bol.y - 1, 3.2, 0, Math.PI * 2);
    ctx.fill();
  }

  // 5. Horizontal & Vertical Asphalt Roads
  for (const rh of city.roadsH) {
    const top = rh.y - rh.width * 0.5;
    // Curbs
    ctx.fillStyle = '#7b87a2';
    ctx.fillRect(rh.xMin, top - 8, rh.xMax - rh.xMin, rh.width + 16);
    // Asphalt
    ctx.fillStyle = '#2a3246';
    ctx.fillRect(rh.xMin, top, rh.xMax - rh.xMin, rh.width);

    // Lighter worn wheel tracks for high road readability & luminance
    ctx.fillStyle = '#364058';
    ctx.fillRect(rh.xMin, rh.y - rh.width * 0.34, rh.xMax - rh.xMin, 22);
    ctx.fillRect(rh.xMin, rh.y + rh.width * 0.14, rh.xMax - rh.xMin, 22);

    // Center divider & multi-lane dashes
    ctx.strokeStyle = rh.isBoulevard ? '#9eb0d4' : '#7f90b4';
    ctx.lineWidth = rh.isBoulevard ? 4 : 2;
    ctx.beginPath();
    ctx.moveTo(rh.xMin, rh.y);
    ctx.lineTo(rh.xMax, rh.y);
    ctx.stroke();

    if (rh.lanes >= 4) {
      ctx.save();
      ctx.strokeStyle = '#8fa0c4';
      ctx.lineWidth = 2;
      ctx.setLineDash([22, 18]);
      ctx.beginPath();
      ctx.moveTo(rh.xMin, rh.y - rh.width * 0.25);
      ctx.lineTo(rh.xMax, rh.y - rh.width * 0.25);
      ctx.moveTo(rh.xMin, rh.y + rh.width * 0.25);
      ctx.lineTo(rh.xMax, rh.y + rh.width * 0.25);
      ctx.stroke();
      ctx.restore();
    }
  }

  for (const rv of city.roadsV) {
    const left = rv.x - rv.width * 0.5;
    ctx.fillStyle = '#7b87a2';
    ctx.fillRect(left - 8, rv.yMin, rv.width + 16, rv.yMax - rv.yMin);
    ctx.fillStyle = '#2a3246';
    ctx.fillRect(left, rv.yMin, rv.width, rv.yMax - rv.yMin);

    ctx.fillStyle = '#364058';
    ctx.fillRect(rv.x - rv.width * 0.34, rv.yMin, 22, rv.yMax - rv.yMin);
    ctx.fillRect(rv.x + rv.width * 0.14, rv.yMin, 22, rv.yMax - rv.yMin);

    ctx.strokeStyle = rv.isBoulevard ? '#9eb0d4' : '#7f90b4';
    ctx.lineWidth = rv.isBoulevard ? 4 : 2;
    ctx.beginPath();
    ctx.moveTo(rv.x, rv.yMin);
    ctx.lineTo(rv.x, rv.yMax);
    ctx.stroke();

    if (rv.lanes >= 4) {
      ctx.save();
      ctx.strokeStyle = '#8fa0c4';
      ctx.lineWidth = 2;
      ctx.setLineDash([22, 18]);
      ctx.beginPath();
      ctx.moveTo(rv.x - rv.width * 0.25, rv.yMin);
      ctx.lineTo(rv.x - rv.width * 0.25, rv.yMax);
      ctx.moveTo(rv.x + rv.width * 0.25, rv.yMin);
      ctx.lineTo(rv.x + rv.width * 0.25, rv.yMax);
      ctx.stroke();
      ctx.restore();
    }
  }

  // 6. Intersection boxes, crosswalk zebra stripes, and signal gantries
  for (const inter of signals.intersections) {
    const left = inter.x - inter.w * 0.5;
    const top = inter.y - inter.h * 0.5;
    ctx.fillStyle = '#2f384e';
    ctx.fillRect(left, top, inter.w, inter.h);

    // Zebra crosswalks on all 4 sides
    ctx.fillStyle = '#b4c2de';
    for (let offset = -inter.w * 0.4; offset <= inter.w * 0.4 - 8; offset += 16) {
      ctx.fillRect(inter.x + offset, top - 16, 9, 14);
      ctx.fillRect(inter.x + offset, top + inter.h + 2, 9, 14);
    }
    for (let offset = -inter.h * 0.4; offset <= inter.h * 0.4 - 8; offset += 16) {
      ctx.fillRect(left - 16, inter.y + offset, 14, 9);
      ctx.fillRect(left + inter.w + 2, inter.y + offset, 14, 9);
    }

    if (inter.hasGantry) {
      const hState = getSignalState(signals, inter, 'h');
      const vState = getSignalState(signals, inter, 'v');
      const hColor = hState === 'green' ? '#58e884' : hState === 'yellow' ? '#e8c458' : '#ff4258';
      const vColor = vState === 'green' ? '#58e884' : vState === 'yellow' ? '#e8c458' : '#ff4258';

      // North & South signal gantry trusses spanning across vertical road
      for (const gy of [top - 22, top + inter.h + 16]) {
        ctx.fillStyle = '#5b6480';
        ctx.fillRect(left - 10, gy, inter.w + 20, 7);
        for (const lx of [inter.x - 28, inter.x, inter.x + 28]) {
          ctx.fillStyle = '#181e2c';
          ctx.fillRect(lx - 7, gy - 3, 14, 13);
          ctx.fillStyle = vColor;
          ctx.beginPath();
          ctx.arc(lx, gy + 3.5, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // West & East signal gantry trusses
      for (const gx of [left - 22, left + inter.w + 16]) {
        ctx.fillStyle = '#5b6480';
        ctx.fillRect(gx, top - 10, 7, inter.h + 20);
        for (const ly of [inter.y - 28, inter.y, inter.y + 28]) {
          ctx.fillStyle = '#181e2c';
          ctx.fillRect(gx - 3, ly - 7, 13, 14);
          ctx.fillStyle = hColor;
          ctx.beginPath();
          ctx.arc(gx + 3.5, ly, 4.5, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }
}
