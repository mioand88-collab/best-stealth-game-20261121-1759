// Night Vault — the hand-in program.
//
// Copies game/ and screenshots/ from this repository into the output
// directory and writes /output/dossier.json with buildDossier from
// vendor/makefun-game.ts. Runs on Node 22 with the standard library only.
//
// The output directory is never removed itself: in the grader /output is a
// mount point, so only its contents are emptied before the copy.

import { buildDossier } from './vendor/makefun-game.ts';
import { cpSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('.', import.meta.url));
const OUTPUT_DIR = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Empty a directory's contents without removing the directory itself.
function emptyContents(dir: string): void {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir)) {
    rmSync(join(dir, entry), { recursive: true, force: true });
  }
}

mkdirSync(OUTPUT_DIR, { recursive: true });
emptyContents(OUTPUT_DIR);

// Refuse early, with a plain message, when the entry is incomplete.
for (const needed of ['game', 'screenshots']) {
  if (!existsSync(join(ROOT, needed))) {
    throw new Error(`main.ts: ${needed}/ is missing from the repository`);
  }
}
if (!existsSync(join(ROOT, 'game', 'index.html'))) {
  throw new Error('main.ts: game/index.html is missing from the repository');
}

cpSync(join(ROOT, 'game'), join(OUTPUT_DIR, 'game'), { recursive: true });
cpSync(join(ROOT, 'screenshots'), join(OUTPUT_DIR, 'screenshots'), { recursive: true });

const dossier = buildDossier(OUTPUT_DIR, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});
writeFileSync(join(OUTPUT_DIR, 'dossier.json'), dossier);

// A short, deterministic summary of what was handed in.
const countFiles = (dir: string): number =>
  readdirSync(dir, { withFileTypes: true }).reduce(
    (n, e) => n + (e.isDirectory() ? countFiles(join(dir, e.name)) : 1),
    0,
  );
console.log(
  `night-vault: wrote ${countFiles(join(OUTPUT_DIR, 'game'))} game files and ` +
    `${countFiles(join(OUTPUT_DIR, 'screenshots'))} screenshots to ${OUTPUT_DIR} ` +
    `(dossier.json ${dossier.length} bytes)`,
);
