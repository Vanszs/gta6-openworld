// A working gta6-01 entry (Node 22, standard library only): the game is this directory's
// game/ folder, plain static files a desktop browser loads offline (game/index.html and its ES
// modules, no library and no network request), and the program hands it in. It copies game/ and
// screenshots/ from beside this file to /output and writes /output/dossier.json, the summary the
// judge reads, with the vendored make.fun library. Only the plumbing, not an open world: Block
// Dodger, a plain 2D canvas game where a paddle dodges falling blocks and catches coins, with a
// title screen, score, lives and levels, game over and restart, flat colours and no sound. Build
// your own open-world crime game in its place (three.js or any library you vendor under game/),
// put your 3 or 4 PNG or JPEG screenshots in screenshots/ (the first by name is the cover) and run it.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { extname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const shotsDir = join(here, 'screenshots');

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.webp']);
const shotFiles = existsSync(shotsDir)
  ? readdirSync(shotsDir)
      .filter((name) => IMAGE_EXTS.has(extname(name).toLowerCase()))
      .sort()
  : [];

if (shotFiles.length < 3 || shotFiles.length > 4) {
  console.error(
    `[gta6-01] Expected 3 or 4 screenshots in screenshots/, found ${shotFiles.length}: ${shotFiles.join(', ') || 'none'}`,
  );
  process.exit(1);
}

for (const file of shotFiles) {
  const bytes = statSync(join(shotsDir, file)).size;
  if (bytes <= 0 || bytes > 262144) {
    console.error(`[gta6-01] Screenshot ${file} size ${bytes} bytes is outside 1..262144 range`);
    process.exit(1);
  }
}

mkdirSync(out, { recursive: true });
rmSync(join(out, 'game'), { recursive: true, force: true });
rmSync(join(out, 'screenshots'), { recursive: true, force: true });
cpSync(join(here, 'game'), join(out, 'game'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
for (const file of shotFiles) {
  cpSync(join(shotsDir, file), join(out, 'screenshots', file));
}

const shotsMetaPath = join(here, 'shots.json');
if (existsSync(shotsMetaPath)) {
  cpSync(shotsMetaPath, join(out, 'shots.json'));
}

const dossierText = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
});
const dossierPath = join(out, 'dossier.json');
writeFileSync(dossierPath, dossierText);

function walkStats(dir: string): { files: number; bytes: number } {
  let files = 0;
  let bytes = 0;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = walkStats(full);
      files += sub.files;
      bytes += sub.bytes;
    } else if (entry.isFile()) {
      files += 1;
      bytes += statSync(full).size;
    }
  }
  return { files, bytes };
}

const gameStats = walkStats(join(out, 'game'));
const shotStats = walkStats(join(out, 'screenshots'));
const dossierBytes = Buffer.byteLength(dossierText, 'utf8');
console.log(
  `[gta6-01] wrote ${gameStats.files} game files (${gameStats.bytes} B), ${shotStats.files} screenshots (${shotStats.bytes} B), dossier.json (${dossierBytes} B) -> ${out}`,
);

