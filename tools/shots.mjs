// Deterministic screenshot capture, camera table printer, and pairwise distance/district verifier for NEON WAKE.
import { spawn } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createCamera } from '../game/src/render/camera.js';
import { applyShotScene, SHOT_SPECS } from '../game/src/shot-mode.js';
import { createWorld } from '../game/src/world.js';

const here = fileURLToPath(new URL('..', import.meta.url));
const gameRoot = resolve(join(here, 'game'));
const shotsDir = resolve(join(here, 'screenshots'));

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
};

function startLocalServer() {
  return new Promise((resolveServer) => {
    const server = createServer((req, res) => {
      const url = new URL(req.url ?? '/', 'http://127.0.0.1');
      let pathname = decodeURIComponent(url.pathname);
      if (pathname.endsWith('/')) pathname += 'index.html';
      const file = resolve(join(gameRoot, normalize(pathname)));
      if (file !== gameRoot && !file.startsWith(gameRoot + sep)) {
        res.writeHead(403).end('forbidden');
        return;
      }
      try {
        const st = statSync(file);
        if (!st.isFile()) throw new Error('not file');
        res.writeHead(200, {
          'content-type': MIME[extname(file).toLowerCase()] ?? 'application/octet-stream',
          'content-length': st.size,
          'cache-control': 'no-store',
        });
        createReadStream(file).pipe(res);
      } catch {
        res.writeHead(404).end('not found');
      }
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolveServer({ server, port: addr.port });
    });
  });
}

function findChromeBinary() {
  const candidates = [
    process.env.CHROME_BIN,
    '/opt/google/chrome/chrome',
    '/home/vanszs/.hermes/tools/chromium-1208/chrome-linux64/chrome',
    '/home/vanszs/.chromium-browser-snapshots/chromium/linux-1527399/chrome-linux/chrome',
    '/usr/bin/google-chrome',
    '/usr/bin/chromium',
  ].filter(Boolean);
  return candidates.find((p) => existsSync(p)) || null;
}

async function captureWithHeadlessChrome() {
  const chromeBin = findChromeBinary();
  if (!chromeBin) return false;

  mkdirSync(shotsDir, { recursive: true });
  const { server, port } = await startLocalServer();
  const debugPort = 9330 + Math.floor(Math.random() * 400);

  const proc = spawn(
    chromeBin,
    [
      '--headless=new',
      '--no-sandbox',
      '--disable-gpu',
      '--disable-dev-shm-usage',
      '--hide-scrollbars',
      '--mute-audio',
      '--window-size=1280,800',
      `--remote-debugging-port=${debugPort}`,
      'about:blank',
    ],
    { stdio: 'ignore' },
  );

  try {
    let targets = null;
    for (let attempt = 0; attempt < 40; attempt++) {
      try {
        const res = await fetch(`http://127.0.0.1:${debugPort}/json/list`);
        if (res.ok) {
          targets = await res.json();
          if (Array.isArray(targets) && targets.length > 0) break;
        }
      } catch {
        // wait for DevTools endpoint
      }
      await new Promise((r) => setTimeout(r, 100));
    }

    const pageTarget = targets && targets.find((t) => t.type === 'page');
    if (!pageTarget || !pageTarget.webSocketDebuggerUrl) {
      throw new Error('Could not connect to headless Chrome page target');
    }

    const ws = new WebSocket(pageTarget.webSocketDebuggerUrl);
    await new Promise((res, rej) => {
      ws.addEventListener('open', res, { once: true });
      ws.addEventListener('error', rej, { once: true });
    });

    let msgId = 1;
    const pending = new Map();
    ws.addEventListener('message', (ev) => {
      const data = JSON.parse(String(ev.data));
      if (data.id && pending.has(data.id)) {
        const { resolve: r, reject: j } = pending.get(data.id);
        pending.delete(data.id);
        if (data.error) j(new Error(data.error.message));
        else r(data.result);
      }
    });

    const sendCdp = (method, params = {}) =>
      new Promise((r, j) => {
        const id = msgId++;
        pending.set(id, { resolve: r, reject: j });
        ws.send(JSON.stringify({ id, method, params }));
      });

    await sendCdp('Page.enable');
    await sendCdp('Runtime.enable');
    await sendCdp('Emulation.setDeviceMetricsOverride', {
      width: 1280,
      height: 800,
      deviceScaleFactor: 1,
      mobile: false,
    });

    for (const spec of SHOT_SPECS) {
      const url = `http://127.0.0.1:${port}/${spec.query}`;
      await sendCdp('Page.navigate', { url });
      await new Promise((r) => setTimeout(r, 320));

      const evalRes = await sendCdp('Runtime.evaluate', {
        expression: `(() => {
          const c = document.getElementById('game');
          if (!c || !window.__NEON_WAKE_SHOT__) return null;
          return {
            dataUrl: c.toDataURL('image/jpeg', 0.88),
            meta: window.__NEON_WAKE_SHOT__,
          };
        })()`,
        returnByValue: true,
      });

      const val = evalRes?.result?.value;
      if (!val || !val.dataUrl) {
        throw new Error(`Failed to render canvas for ${spec.shotId}`);
      }
      const base64 = val.dataUrl.replace(/^data:image\/jpeg;base64,/, '');
      const buf = Buffer.from(base64, 'base64');
      writeFileSync(join(shotsDir, spec.name), buf);
    }

    ws.close();
  } finally {
    proc.kill('SIGKILL');
    server.close();
  }
  return true;
}

const shouldCapture =
  process.argv.includes('--capture') ||
  SHOT_SPECS.some((s) => !existsSync(join(shotsDir, s.name)));

if (shouldCapture) {
  await captureWithHeadlessChrome();
}

const rows = [];
for (const spec of SHOT_SPECS) {
  const world = createWorld(101, null);
  const camera = createCamera(spec.cameraX, spec.cameraY);
  const appState = { mode: 'playing' };
  const meta = applyShotScene(world, camera, appState, spec.shotId);
  const filePath = join(shotsDir, spec.name);
  const bytes = existsSync(filePath) ? statSync(filePath).size : 0;
  rows.push({
    shot: meta.shotId,
    file: spec.name,
    district: meta.district,
    cameraX: meta.cameraX,
    cameraY: meta.cameraY,
    bytes,
  });
}

console.log('=== NEON WAKE CAMERA TABLE ===');
console.log('shot       | file          | district   | camera (x, y) | bytes');
console.log('-----------+---------------+------------+---------------+--------');
for (const r of rows) {
  console.log(
    `${r.shot.padEnd(10)} | ${r.file.padEnd(13)} | ${r.district.padEnd(10)} | (${String(r.cameraX).padStart(4)}, ${String(r.cameraY).padStart(4)}) | ${r.bytes}`,
  );
}

let minPairDist = Infinity;
let minPairLabel = '';
for (let i = 0; i < rows.length; i++) {
  for (let j = i + 1; j < rows.length; j++) {
    const a = rows[i];
    const b = rows[j];
    const d = Math.hypot(a.cameraX - b.cameraX, a.cameraY - b.cameraY);
    if (d < minPairDist) {
      minPairDist = d;
      minPairLabel = `${a.shot} <-> ${b.shot}`;
    }
    if (d < 600) {
      console.error(`FAIL: camera pair ${a.shot} <-> ${b.shot} is ${d.toFixed(1)}px apart (< 600px)`);
      process.exit(1);
    }
  }
}
console.log(`camera pairwise distance check (min ${minPairDist.toFixed(1)}px on ${minPairLabel} >= 600px): ok`);

const districts = new Set(rows.map((r) => r.district));
if (districts.size !== rows.length) {
  console.error('FAIL: duplicate district tags found across shots');
  process.exit(1);
}
console.log(`district uniqueness check (${[...districts].join(', ')}): ok`);
