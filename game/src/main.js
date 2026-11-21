// Night Vault — the entry point.
// One clear job: wire the canvas to the game and honour ?shot= for screenshots.

import { CANVAS_W, CANVAS_H } from './config.js';
import { Game } from './game.js';

const canvas = document.getElementById('game');
canvas.width = CANVAS_W;
canvas.height = CANVAS_H;

const game = new Game(canvas);

const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  // A staged moment, ready for its screenshot: no menu, no waiting.
  game.stageShot(shot);
} else {
  // The game opens on its start screen; the player begins it.
  game.phase = 'menu';
}

game.run();

// Exposed for play-testing in the browser console and in headless runs.
window.__nightVault = game;
