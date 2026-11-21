// Night Vault — the game itself.
// One clear job: own the state (menu / playing / won / lost), run the loop,
// fold guard suspicion into one detection meter, and stage screenshot scenes.

import {
  HUD_HEIGHT,
  SUSPICION_CAUGHT_AT,
  PEBBLE_NOISE_RADIUS,
} from './config.js';
import {
  PLAYER_START,
  OPAL_POS,
  GUARD_ROUTES,
  onExit,
  tileCenter,
} from './level.js';
import { Guard, GUARD_STATE } from './guards.js';
import { Player } from './player.js';
import { Renderer } from './render.js';
import { SoundEngine } from './audio.js';
import { Input } from './input.js';

export const PHASE = { MENU: 'menu', PLAYING: 'playing', WON: 'won', LOST: 'lost' };

export class Game {
  constructor(canvas) {
    this.canvas = canvas;
    this.renderer = new Renderer(canvas);
    this.sound = new SoundEngine();
    this.input = new Input(canvas);
    this.reset();
    this.phase = PHASE.MENU;
    this.lastTimestamp = 0;
    this._onFrame = (t) => this.frame(t);
    this._onCanvasClick = () => {
      this.sound.unlock();
      if (this.phase === PHASE.MENU) this.start();
    };
    canvas.addEventListener('mousedown', this._onCanvasClick);
  }

  reset() {
    this.player = new Player(PLAYER_START);
    this.guards = GUARD_ROUTES.map((route, i) => new Guard(route, i));
    this.hasOpal = false;
    this.elapsed = 0;
    this.maxDetection = 0;
    this.detection = 0;
    this.toast = null;
    this.toastTimer = 0;
    this.pebbles = [];
    this.rating = '';
    this.time = 0; // wall-clock seconds since load, for pulsing and staging
  }

  start() {
    this.reset();
    this.input.takeClick(); // a menu click must not become a pebble
    this.phase = PHASE.PLAYING;
    this.sound.unlock();
    this.sound.startAmbient();
  }

  get state() {
    return {
      phase: this.phase,
      player: this.player,
      guards: this.guards,
      hasOpal: this.hasOpal,
      elapsed: this.elapsed,
      detection: this.detection,
      maxDetection: this.maxDetection,
      toast: this.toast,
      pebbles: this.pebbles,
      rating: this.rating,
      time: this.time,
    };
  }

  // ---- screenshot staging -------------------------------------------
  // ?shot=cover|patrol|hiding|exit drops the game straight into a played
  // moment, so each screenshot shows a different readable scene.
  stageShot(name) {
    this.start();
    if (name === 'cover') {
      // Moth crouched behind a crate while Rook's cone sweeps past.
      this.player.x = tileCenter(6, 9).x;
      this.player.y = tileCenter(6, 9).y;
      this.player.sneaking = true;
      const rook = this.guards[0];
      rook.x = tileCenter(12, 8).x;
      rook.y = tileCenter(12, 8).y;
      rook.facing = Math.PI;
      rook.state = GUARD_STATE.PATROL;
      rook.pauseTimer = 2;
      const bishop = this.guards[1];
      bishop.x = tileCenter(15, 9).x;
      bishop.y = tileCenter(15, 9).y;
      bishop.facing = Math.PI;
    } else if (name === 'patrol') {
      // The opening view: Moth at the door, all three guards on their rounds.
      this.guards[0].x = tileCenter(11, 2).x;
      this.guards[0].y = tileCenter(11, 2).y;
      this.guards[0].facing = Math.PI / 2;
      this.guards[1].x = tileCenter(12, 9).x;
      this.guards[1].y = tileCenter(12, 9).y;
      this.guards[1].facing = 0;
      this.guards[2].x = tileCenter(5, 12).x;
      this.guards[2].y = tileCenter(5, 12).y;
      this.guards[2].facing = -Math.PI / 2;
    } else if (name === 'hiding') {
      // Moth flat in a shadow patch; Bishop is suspicious and closing in,
      // but has not reached the hiding spot yet.
      this.player.x = tileCenter(3, 5).x;
      this.player.y = tileCenter(3, 5).y;
      this.player.sneaking = true;
      const bishop = this.guards[1];
      bishop.x = tileCenter(7, 5).x;
      bishop.y = tileCenter(7, 5).y;
      bishop.facing = Math.PI;
      bishop.state = GUARD_STATE.SUSPICIOUS;
      bishop.suspicion = 35;
      bishop.investigateX = tileCenter(5, 5).x;
      bishop.investigateY = tileCenter(5, 5).y;
      this.detection = 35;
      this.maxDetection = 35;
    } else if (name === 'exit') {
      // Opal in hand, Moth one step from the green door.
      this.hasOpal = true;
      this.player.hasOpal = true;
      this.player.x = tileCenter(10, 13).x;
      this.player.y = tileCenter(10, 13).y;
      this.guards[0].x = tileCenter(18, 2).x;
      this.guards[0].y = tileCenter(18, 2).y;
      this.guards[0].facing = 0;
      this.guards[2].x = tileCenter(4, 12).x;
      this.guards[2].y = tileCenter(4, 12).y;
      this.guards[2].facing = Math.PI / 2;
    }
  }

  // ---- the loop ------------------------------------------------------

  frame(timestamp) {
    const dt = Math.min(0.05, this.lastTimestamp ? (timestamp - this.lastTimestamp) / 1000 : 0.016);
    this.lastTimestamp = timestamp;
    this.time += dt;
    this.update(dt);
    this.renderer.draw(this.state);
    requestAnimationFrame(this._onFrame);
  }

  run() {
    requestAnimationFrame(this._onFrame);
  }

  update(dt) {
    if (this.phase === PHASE.MENU) {
      if (this.input.takeStart()) this.start();
      return;
    }
    if (this.phase === PHASE.WON || this.phase === PHASE.LOST) {
      if (this.input.takeRestart()) {
        this.phase = PHASE.MENU;
        this.reset();
      }
      return;
    }

    this.elapsed += dt;
    if (this.toastTimer > 0) {
      this.toastTimer -= dt;
      if (this.toastTimer <= 0) this.toast = null;
    }

    const onNoise = (x, y, radius) => {
      for (const guard of this.guards) guard.hearNoise(x, y, radius);
    };
    const onPlayerStep = () => {
      this.sound.thud(this.player.sneaking ? 0.05 : 0.13, this.player.sneaking ? 300 : 500);
    };
    const onGuardStep = (guard) => {
      const dist = Math.hypot(guard.x - this.player.x, guard.y - this.player.y);
      if (dist > 340) return; // footsteps only tell you where a guard is when near
      const volume = 0.16 * (1 - dist / 340);
      this.sound.thud(volume, 220);
    };

    this.player.update(dt, this.input, onPlayerStep, onNoise);

    // A click tosses a pebble; the clatter pulls guards over to look.
    const click = this.input.takeClick();
    if (click && click.y > HUD_HEIGHT) {
      const landing = this.player.tossPebble(click.x, click.y - HUD_HEIGHT);
      if (landing) {
        this.pebbles.push({ x: landing.x, y: landing.y, at: this.time });
        this.sound.clatter();
        onNoise(landing.x, landing.y, PEBBLE_NOISE_RADIUS);
      }
    }

    let chasing = false;
    for (const guard of this.guards) {
      guard.update(dt, this.player, onGuardStep);
      if (guard.caughtPlayer) {
        this.lose();
        return;
      }
      if (guard.state === GUARD_STATE.CHASE && guard.suspicion >= 70) chasing = true;
    }
    if (chasing && !this._alarmPlayed) {
      this._alarmPlayed = true;
      this.sound.alarm();
    } else if (!chasing) {
      this._alarmPlayed = false;
    }

    // One detection meter: the most suspicious guard's suspicion.
    this.detection = Math.max(0, ...this.guards.map((g) => g.suspicion));
    this.maxDetection = Math.max(this.maxDetection, this.detection);
    if (this.detection >= SUSPICION_CAUGHT_AT) {
      this.lose();
      return;
    }

    // The Opal, lifted by walking over its pedestal.
    if (!this.hasOpal && Math.hypot(this.player.x - OPAL_POS.x, this.player.y - OPAL_POS.y) < 26) {
      this.hasOpal = true;
      this.player.hasOpal = true;
      this.sound.pickup();
      this.showToast('The Starlight Opal is yours — now reach the EXIT!');
    }

    // The exit only counts with the Opal in hand.
    if (onExit(this.player.x, this.player.y)) {
      if (this.hasOpal) this.win();
      else this.showToast('The Opal first — it sits in the vault room below.');
    }
  }

  showToast(text) {
    this.toast = text;
    this.toastTimer = 3.2;
  }

  win() {
    this.phase = PHASE.WON;
    this.rating = this.maxDetection < 30 ? 'Ghost — never truly seen' : this.maxDetection < 70 ? 'Shadow — a few close calls' : 'Lucky — the alarm nearly went up';
    this.sound.win();
  }

  lose() {
    this.phase = PHASE.LOST;
    this.sound.lose();
  }
}
