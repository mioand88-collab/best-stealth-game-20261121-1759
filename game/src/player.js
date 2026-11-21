// Night Vault — the thief, Moth.
// One clear job: how the player moves, sneaks, makes noise and tosses pebbles.

import {
  PLAYER_WALK_SPEED,
  PLAYER_SNEAK_SPEED,
  NOISE_WALK_RADIUS,
  NOISE_SNEAK_RADIUS,
  PEBBLE_RANGE,
  PEBBLE_COUNT,
  TILE,
} from './config.js';
import { circleFits, inShadow } from './level.js';

export const PLAYER_RADIUS = 14;

export class Player {
  constructor(start) {
    this.x = start.x;
    this.y = start.y;
    this.sneaking = false;
    this.moving = false;
    this.facing = -Math.PI / 2; // start looking up the hall
    this.pebbles = PEBBLE_COUNT;
    this.footstepTimer = 0;
    this.stepPhase = 0;
    this.hasOpal = false;
  }

  get noiseRadius() {
    return this.sneaking ? NOISE_SNEAK_RADIUS : NOISE_WALK_RADIUS;
  }

  get inShadowNow() {
    return inShadow(this.x, this.y);
  }

  // Move with the keys held this frame. Returns the distance actually moved.
  update(dt, input, onFootstep, onNoise) {
    let dx = 0;
    let dy = 0;
    if (input.left) dx -= 1;
    if (input.right) dx += 1;
    if (input.up) dy -= 1;
    if (input.down) dy += 1;
    this.sneaking = input.sneak;
    this.moving = dx !== 0 || dy !== 0;
    if (!this.moving) return 0;
    const len = Math.hypot(dx, dy);
    dx /= len;
    dy /= len;
    const speed = this.sneaking ? PLAYER_SNEAK_SPEED : PLAYER_WALK_SPEED;
    const step = speed * dt;
    const nx = this.x + dx * step;
    const ny = this.y + dy * step;
    let moved = 0;
    if (circleFits(nx, this.y, PLAYER_RADIUS)) {
      moved += Math.abs(nx - this.x);
      this.x = nx;
    }
    if (circleFits(this.x, ny, PLAYER_RADIUS)) {
      moved += Math.abs(ny - this.y);
      this.y = ny;
    }
    if (moved > 0) {
      this.facing = Math.atan2(dy, dx);
      this.stepPhase += moved;
      // A footstep every stride, louder and more often when walking upright.
      const stride = this.sneaking ? 34 : 44;
      if (this.stepPhase >= stride) {
        this.stepPhase -= stride;
        onFootstep(this);
        onNoise(this.x, this.y, this.noiseRadius);
      }
    }
    return moved;
  }

  // Toss a pebble toward a point on the floor (a mouse click). The clatter
  // pulls the nearest guards over to look. Returns the landing point, or
  // null when there is nothing left to throw or the point is out of reach.
  tossPebble(tx, ty) {
    if (this.pebbles <= 0) return null;
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist > PEBBLE_RANGE || dist < 20) return null;
    this.pebbles -= 1;
    return { x: tx, y: ty };
  }

  tile() {
    return { col: Math.floor(this.x / TILE), row: Math.floor(this.y / TILE) };
  }
}
