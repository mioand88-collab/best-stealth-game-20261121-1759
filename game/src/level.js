// Night Vault — the museum floor.
// One clear job: the level layout and every question about it
// (what tile is here, does it block movement or sight, where things start).

import { COLS, ROWS, TILE } from './config.js';

// Legend:
//   # wall            C crate (cover: blocks movement and sight)
//   D display case    s shadow patch (dark floor: harder to be seen)
//     (cover: blocks movement and sight)
//   . open floor      E exit door (the service door you slip out of)
//   O the Starlight Opal pedestal   P where Moth the thief starts
const MAP_ROWS = [
  '########################',
  '#P....s......C.....D...#',
  '#......................#',
  '#..C.....####......C...#',
  '#........#..#..........#',
  '#..s.....#..#....s.....#',
  '#........#..#..........#',
  '#..D.....####.....C....#',
  '#......................#',
  '#....C.....s.......D...#',
  '#......................#',
  '#..s....###.###........#',
  '#.......#....#.....C...#',
  '#..C....#..O..#....s...#',
  '#.......#....#.........#',
  '##########EE############',
];

if (MAP_ROWS.length !== ROWS) throw new Error(`level: expected ${ROWS} rows, got ${MAP_ROWS.length}`);
for (const row of MAP_ROWS) {
  if (row.length !== COLS) throw new Error(`level: row ${JSON.stringify(row)} is ${row.length} tiles, expected ${COLS}`);
}

export const BLOCKS_MOVEMENT = new Set(['#', 'C', 'D']);
export const BLOCKS_SIGHT = new Set(['#', 'C', 'D']);

export function tileAt(col, row) {
  if (col < 0 || col >= COLS || row < 0 || row >= ROWS) return '#';
  return MAP_ROWS[row][col];
}

export function isShadow(col, row) {
  return tileAt(col, row) === 's';
}

export function blocksMovement(col, row) {
  return BLOCKS_MOVEMENT.has(tileAt(col, row));
}

export function blocksSight(col, row) {
  return BLOCKS_SIGHT.has(tileAt(col, row));
}

export function tileCenter(col, row) {
  return { x: (col + 0.5) * TILE, y: (row + 0.5) * TILE };
}

function findAll(ch) {
  const out = [];
  for (let row = 0; row < ROWS; row++) {
    for (let col = 0; col < COLS; col++) {
      if (MAP_ROWS[row][col] === ch) out.push({ col, row });
    }
  }
  return out;
}

export const PLAYER_START = tileCenter(...Object.values(findAll('P')[0]));
export const OPAL_TILE = findAll('O')[0];
export const OPAL_POS = tileCenter(OPAL_TILE.col, OPAL_TILE.row);
export const EXIT_TILES = findAll('E');

// Guard patrol routes: named guards, each looping a rectangle of waypoints
// the player can learn. Every leg is a straight walkable line.
export const GUARD_ROUTES = [
  {
    name: 'Rook',
    waypoints: [
      { col: 2, row: 2 },
      { col: 21, row: 2 },
      { col: 21, row: 8 },
      { col: 2, row: 8 },
    ],
  },
  {
    name: 'Bishop',
    waypoints: [
      { col: 8, row: 9 },
      { col: 17, row: 9 },
      { col: 17, row: 10 },
      { col: 8, row: 10 },
    ],
  },
  {
    name: 'Knight',
    waypoints: [
      { col: 2, row: 10 },
      { col: 7, row: 10 },
      { col: 7, row: 14 },
      { col: 2, row: 14 },
    ],
  },
];

// Can a circle of the given radius stand at (x, y) without overlapping a
// movement-blocking tile? Used by the player and the guards.
export function circleFits(x, y, radius) {
  const minCol = Math.floor((x - radius) / TILE);
  const maxCol = Math.floor((x + radius) / TILE);
  const minRow = Math.floor((y - radius) / TILE);
  const maxRow = Math.floor((y + radius) / TILE);
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      if (!blocksMovement(col, row)) continue;
      const tileLeft = col * TILE;
      const tileTop = row * TILE;
      const nearestX = Math.max(tileLeft, Math.min(x, tileLeft + TILE));
      const nearestY = Math.max(tileTop, Math.min(y, tileTop + TILE));
      const dx = x - nearestX;
      const dy = y - nearestY;
      if (dx * dx + dy * dy < radius * radius) return false;
    }
  }
  return true;
}

// Is there a clear line of sight between two points? Sampled along the
// segment; walls, crates and display cases block it.
export function hasLineOfSight(x0, y0, x1, y1) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const col = Math.floor((x0 + dx * t) / TILE);
    const row = Math.floor((y0 + dy * t) / TILE);
    if (blocksSight(col, row)) return false;
  }
  return true;
}

// Is a point inside a shadow patch (dark floor where the eye slides off)?
export function inShadow(x, y) {
  return isShadow(Math.floor(x / TILE), Math.floor(y / TILE));
}

// Is a point on the exit door?
export function onExit(x, y) {
  const col = Math.floor(x / TILE);
  const row = Math.floor(y / TILE);
  return tileAt(col, row) === 'E';
}

// Breadth-first walkable distance check, used by the game's own self-test.
export function reachable(fromCol, fromRow, toCol, toRow) {
  const seen = new Set([`${fromCol},${fromRow}`]);
  const queue = [[fromCol, fromRow]];
  while (queue.length > 0) {
    const [c, r] = queue.shift();
    if (c === toCol && r === toRow) return true;
    for (const [dc, dr] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nc = c + dc;
      const nr = r + dr;
      if (nc < 0 || nc >= COLS || nr < 0 || nr >= ROWS) continue;
      if (blocksMovement(nc, nr)) continue;
      const key = `${nc},${nr}`;
      if (seen.has(key)) continue;
      seen.add(key);
      queue.push([nc, nr]);
    }
  }
  return false;
}
