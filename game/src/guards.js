// Night Vault — the museum guards.
// One clear job: patrol routes, vision cones, suspicion, and what a guard
// does when it hears something or thinks it saw you.

import {
  GUARD_PATROL_SPEED,
  GUARD_SUSPICIOUS_SPEED,
  GUARD_CHASE_SPEED,
  GUARD_VIEW_RANGE,
  GUARD_VIEW_HALF_ANGLE,
  SUSPICION_RISE_CLOSE,
  SUSPICION_RISE_FAR,
  SUSPICION_FALL,
  SUSPICION_SHADOW_FACTOR,
  SUSPICION_SNEAK_FACTOR,
  SUSPICION_CHASE_AT,
  SUSPICION_CAUGHT_AT,
  TILE,
} from './config.js';
import { circleFits, hasLineOfSight, inShadow, tileCenter } from './level.js';

export const GUARD_RADIUS = 15;

// A guard's state of mind. Patrol is the calm loop; suspicious means it is
// walking over to check something; chase means it is coming for you.
export const GUARD_STATE = { PATROL: 'patrol', SUSPICIOUS: 'suspicious', CHASE: 'chase' };

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

function turnToward(current, target, maxStep) {
  const d = angleDiff(target, current);
  if (Math.abs(d) <= maxStep) return target;
  return current + Math.sign(d) * maxStep;
}

export class Guard {
  constructor(route, index) {
    this.name = route.name;
    const start = route.waypoints[0];
    const pos = tileCenter(start.col, start.row);
    this.x = pos.x;
    this.y = pos.y;
    this.waypoints = route.waypoints.map((w) => tileCenter(w.col, w.row));
    this.waypointIndex = 1 % this.waypoints.length;
    this.pauseTimer = 0;
    this.facing = 0; // radians; 0 is east
    this.state = GUARD_STATE.PATROL;
    this.suspicion = 0;
    this.investigateX = 0;
    this.investigateY = 0;
    this.lookTimer = 0;
    this.footstepTimer = 0;
    this.index = index;
    this.seenPlayer = false; // true this frame when the player is in the cone
    this.caughtPlayer = false;
  }

  // Does this guard currently see the player? Cone + range + line of sight.
  canSee(player) {
    const dx = player.x - this.x;
    const dy = player.y - this.y;
    const dist = Math.hypot(dx, dy);
    const range = GUARD_VIEW_RANGE - (player.sneaking ? 25 : 0);
    if (dist > range) return false;
    const angleTo = Math.atan2(dy, dx);
    if (Math.abs(angleDiff(angleTo, this.facing)) > GUARD_VIEW_HALF_ANGLE) return false;
    return hasLineOfSight(this.x, this.y, player.x, player.y);
  }

  // How fast suspicion climbs while the player is visible: nearer is worse,
  // and shadows and sneaking buy time. Returns 0 when the player is unseen.
  suspicionRate(player) {
    if (!this.canSee(player)) return 0;
    const dist = Math.hypot(player.x - this.x, player.y - this.y);
    const closeness = 1 - dist / GUARD_VIEW_RANGE; // 0 at the edge, 1 on top of you
    let rate = SUSPICION_RISE_FAR + (SUSPICION_RISE_CLOSE - SUSPICION_RISE_FAR) * closeness;
    if (inShadow(player.x, player.y)) rate *= SUSPICION_SHADOW_FACTOR;
    if (player.sneaking) rate *= SUSPICION_SNEAK_FACTOR;
    return rate;
  }

  // A noise at (x, y): walk over and look, if it is close enough to matter.
  hearNoise(x, y, radius) {
    const dist = Math.hypot(x - this.x, y - this.y);
    if (dist > radius + 40) return;
    if (this.state === GUARD_STATE.CHASE) return;
    this.investigateX = x;
    this.investigateY = y;
    this.state = GUARD_STATE.SUSPICIOUS;
    this.suspicion = Math.max(this.suspicion, 35);
    this.lookTimer = 0;
  }

  // Walk toward a point, sliding along walls. Returns true on arrival.
  moveToward(tx, ty, speed, dt) {
    const dx = tx - this.x;
    const dy = ty - this.y;
    const dist = Math.hypot(dx, dy);
    if (dist < 2) return true;
    const step = Math.min(dist, speed * dt);
    const nx = this.x + (dx / dist) * step;
    const ny = this.y + (dy / dist) * step;
    if (circleFits(nx, this.y, GUARD_RADIUS)) this.x = nx;
    if (circleFits(this.x, ny, GUARD_RADIUS)) this.y = ny;
    this.facing = turnToward(this.facing, Math.atan2(dy, dx), 6 * dt);
    if (Math.hypot(tx - this.x, ty - this.y) < 6) return true;
    return false;
  }

  update(dt, player, onFootstep) {
    this.seenPlayer = this.canSee(player);
    const rate = this.suspicionRate(player);
    if (rate > 0) {
      this.suspicion = Math.min(SUSPICION_CAUGHT_AT, this.suspicion + rate * dt);
    } else {
      this.suspicion = Math.max(0, this.suspicion - SUSPICION_FALL * dt);
    }

    if (this.suspicion >= SUSPICION_CAUGHT_AT) {
      this.caughtPlayer = true;
      this.state = GUARD_STATE.CHASE;
      return;
    }
    if (this.suspicion >= SUSPICION_CHASE_AT && this.seenPlayer) {
      this.state = GUARD_STATE.CHASE;
    } else if (this.state === GUARD_STATE.CHASE && !this.seenPlayer && this.suspicion < 40) {
      // Lost you: go and check where you were last seen.
      this.state = GUARD_STATE.SUSPICIOUS;
      this.investigateX = player.x;
      this.investigateY = player.y;
      this.lookTimer = 0;
    } else if (this.state === GUARD_STATE.SUSPICIOUS && this.suspicion < 12) {
      this.state = GUARD_STATE.PATROL;
    }

    let moving = false;
    let speed = GUARD_PATROL_SPEED;
    if (this.state === GUARD_STATE.PATROL) {
      if (this.pauseTimer > 0) {
        this.pauseTimer -= dt;
        // Look around while pausing at a waypoint: the patrol can be learned.
        this.facing += Math.sin(performance.now() / 900 + this.index * 2) * 0.4 * dt;
      } else {
        const target = this.waypoints[this.waypointIndex];
        moving = true;
        if (this.moveToward(target.x, target.y, GUARD_PATROL_SPEED, dt)) {
          this.waypointIndex = (this.waypointIndex + 1) % this.waypoints.length;
          this.pauseTimer = 1.1;
        }
      }
    } else if (this.state === GUARD_STATE.SUSPICIOUS) {
      speed = GUARD_SUSPICIOUS_SPEED;
      const arrived = this.moveToward(this.investigateX, this.investigateY, speed, dt);
      moving = !arrived;
      if (arrived) {
        this.lookTimer += dt;
        this.facing += 1.6 * dt; // scan the room
        if (this.lookTimer > 2.6) {
          this.state = GUARD_STATE.PATROL;
          this.suspicion = Math.max(0, this.suspicion - 10);
        }
      }
    } else {
      // Chase: head straight for the player, as fast as a guard runs.
      speed = GUARD_CHASE_SPEED;
      moving = true;
      this.moveToward(player.x, player.y, speed, dt);
    }

    if (moving) {
      this.footstepTimer -= dt;
      if (this.footstepTimer <= 0) {
        this.footstepTimer = 0.42;
        onFootstep(this);
      }
    }
  }
}

// The cone's polygon, clipped by walls: cast rays across the cone and stop
// each one where sight is blocked, so the cone hugs the furniture.
export function conePolygon(guard) {
  const points = [{ x: guard.x, y: guard.y }];
  const rays = 26;
  for (let i = 0; i <= rays; i++) {
    const a = guard.facing - GUARD_VIEW_HALF_ANGLE + (2 * GUARD_VIEW_HALF_ANGLE * i) / rays;
    let end = GUARD_VIEW_RANGE;
    for (let d = 12; d <= GUARD_VIEW_RANGE; d += 12) {
      const x = guard.x + Math.cos(a) * d;
      const y = guard.y + Math.sin(a) * d;
      const col = Math.floor(x / TILE);
      const row = Math.floor(y / TILE);
      if (!hasLineOfSight(guard.x, guard.y, x, y)) break;
      end = d;
    }
    points.push({ x: guard.x + Math.cos(a) * end, y: guard.y + Math.sin(a) * end });
  }
  return points;
}
