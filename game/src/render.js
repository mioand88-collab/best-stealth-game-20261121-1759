// Night Vault — everything you see.
// One clear job: draw the museum, the cones, the people and the HUD on one
// canvas, plus the start, win and lose screens.

import { COLORS, TILE, COLS, ROWS, HUD_HEIGHT, LEVEL_W, LEVEL_H } from './config.js';
import { tileAt, OPAL_POS, EXIT_TILES } from './level.js';
import { conePolygon, GUARD_STATE } from './guards.js';

function coneColor(guard) {
  if (guard.state === GUARD_STATE.CHASE) return COLORS.coneChase;
  if (guard.state === GUARD_STATE.SUSPICIOUS || guard.suspicion > 25) return COLORS.coneSuspicious;
  return COLORS.coneCalm;
}

function guardColor(guard) {
  if (guard.state === GUARD_STATE.CHASE) return COLORS.guardChase;
  if (guard.state === GUARD_STATE.SUSPICIOUS || guard.suspicion > 25) return COLORS.guardSuspicious;
  return COLORS.guard;
}

export class Renderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
  }

  draw(state) {
    const ctx = this.ctx;
    ctx.save();
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.drawHud(state);
    ctx.translate(0, HUD_HEIGHT);
    this.drawFloor(ctx);
    this.drawExit(ctx, state);
    this.drawOpal(ctx, state);
    this.drawCover(ctx);
    this.drawCones(ctx, state);
    this.drawGuards(ctx, state);
    this.drawPlayer(ctx, state);
    this.drawPebbles(ctx, state);
    ctx.restore();
    if (state.phase === 'menu') this.drawMenu(state);
    else if (state.phase === 'won') this.drawEnd(state, true);
    else if (state.phase === 'lost') this.drawEnd(state, false);
    else if (state.toast) this.drawToast(state);
  }

  drawFloor(ctx) {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const tile = tileAt(col, row);
        const x = col * TILE;
        const y = row * TILE;
        if (tile === '#') {
          ctx.fillStyle = COLORS.wall;
          ctx.fillRect(x, y, TILE, TILE);
          ctx.fillStyle = COLORS.wallTop;
          ctx.fillRect(x, y, TILE, 5);
        } else if (tile === 's') {
          ctx.fillStyle = COLORS.shadowFloor;
          ctx.fillRect(x, y, TILE, TILE);
          ctx.fillStyle = 'rgba(120, 140, 200, 0.10)';
          ctx.fillRect(x + 6, y + 6, TILE - 12, TILE - 12);
        } else {
          ctx.fillStyle = (col + row) % 2 === 0 ? COLORS.floor : COLORS.floorAlt;
          ctx.fillRect(x, y, TILE, TILE);
        }
      }
    }
    // Faint tile seams so the floor reads as flagstones.
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let col = 1; col < COLS; col++) {
      ctx.moveTo(col * TILE, 0);
      ctx.lineTo(col * TILE, LEVEL_H);
    }
    for (let row = 1; row < ROWS; row++) {
      ctx.moveTo(0, row * TILE);
      ctx.lineTo(LEVEL_W, row * TILE);
    }
    ctx.stroke();
  }

  drawExit(ctx, state) {
    for (const t of EXIT_TILES) {
      const x = t.col * TILE;
      const y = t.row * TILE;
      ctx.fillStyle = state.hasOpal ? COLORS.exit : COLORS.exitDark;
      ctx.fillRect(x + 2, y + 2, TILE - 4, TILE - 4);
      ctx.fillStyle = '#0c2b1c';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('EXIT', x + TILE / 2, y + TILE / 2 + 4);
    }
  }

  drawOpal(ctx, state) {
    if (state.hasOpal) return;
    const pulse = 0.6 + 0.4 * Math.sin(state.time * 3);
    ctx.save();
    ctx.translate(OPAL_POS.x, OPAL_POS.y);
    // Pedestal.
    ctx.fillStyle = '#4a4f5e';
    ctx.fillRect(-14, -8, 28, 22);
    ctx.fillStyle = '#5d6274';
    ctx.fillRect(-14, -8, 28, 5);
    // The Starlight Opal itself, glowing.
    ctx.globalAlpha = 0.35 + 0.3 * pulse;
    ctx.fillStyle = COLORS.opal;
    ctx.beginPath();
    ctx.arc(0, -12, 14 + 4 * pulse, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#eaf7ff';
    ctx.beginPath();
    ctx.moveTo(0, -22);
    ctx.lineTo(7, -12);
    ctx.lineTo(0, -2);
    ctx.lineTo(-7, -12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  drawCover(ctx) {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        const tile = tileAt(col, row);
        const x = col * TILE;
        const y = row * TILE;
        if (tile === 'C') {
          ctx.fillStyle = COLORS.crate;
          ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
          ctx.fillStyle = COLORS.crateTop;
          ctx.fillRect(x + 3, y + 3, TILE - 6, 8);
          ctx.strokeStyle = '#5d4326';
          ctx.lineWidth = 2;
          ctx.strokeRect(x + 3, y + 3, TILE - 6, TILE - 6);
          ctx.beginPath();
          ctx.moveTo(x + 3, y + 3);
          ctx.lineTo(x + TILE - 3, y + TILE - 3);
          ctx.moveTo(x + TILE - 3, y + 3);
          ctx.lineTo(x + 3, y + TILE - 3);
          ctx.stroke();
        } else if (tile === 'D') {
          ctx.fillStyle = COLORS.displayCase;
          ctx.fillRect(x + 3, y + 3, TILE - 6, TILE - 6);
          ctx.fillStyle = COLORS.displayGlass;
          ctx.globalAlpha = 0.55;
          ctx.fillRect(x + 8, y + 8, TILE - 16, TILE - 16);
          ctx.globalAlpha = 1;
          ctx.fillStyle = '#cfe8ef';
          ctx.beginPath();
          ctx.arc(x + TILE / 2, y + TILE / 2, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    }
  }

  drawCones(ctx, state) {
    for (const guard of state.guards) {
      const poly = conePolygon(guard);
      ctx.fillStyle = coneColor(guard);
      ctx.beginPath();
      ctx.moveTo(poly[0].x, poly[0].y);
      for (let i = 1; i < poly.length; i++) ctx.lineTo(poly[i].x, poly[i].y);
      ctx.closePath();
      ctx.fill();
      // A bright rim on the cone's edge so its reach reads at a glance.
      ctx.strokeStyle = coneColor(guard).replace(/[\d.]+\)$/, '0.55)');
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }

  drawGuards(ctx, state) {
    for (const guard of state.guards) {
      ctx.save();
      ctx.translate(guard.x, guard.y);
      // Body.
      ctx.fillStyle = guardColor(guard);
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
      ctx.beginPath();
      ctx.arc(0, 0, 15, 0, Math.PI);
      ctx.fill();
      // Facing nose and torch.
      ctx.rotate(guard.facing);
      ctx.fillStyle = '#ffe9a8';
      ctx.beginPath();
      ctx.moveTo(15, 0);
      ctx.lineTo(6, -6);
      ctx.lineTo(6, 6);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
      // Name and alert mark.
      ctx.fillStyle = '#f5f2ea';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(guard.name, guard.x, guard.y - 22);
      if (guard.state !== GUARD_STATE.PATROL || guard.suspicion > 25) {
        ctx.fillStyle = guard.state === GUARD_STATE.CHASE ? COLORS.guardChase : COLORS.guardSuspicious;
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(guard.state === GUARD_STATE.CHASE ? '!' : '?', guard.x, guard.y - 34);
      }
      // Suspicion arc over a guard that has noticed something.
      if (guard.suspicion > 4) {
        ctx.strokeStyle = guard.suspicion > 70 ? COLORS.danger : COLORS.guardSuspicious;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(guard.x, guard.y, 20, -Math.PI / 2, -Math.PI / 2 + (Math.PI * 2 * guard.suspicion) / 100);
        ctx.stroke();
      }
    }
  }

  drawPlayer(ctx, state) {
    const p = state.player;
    ctx.save();
    ctx.translate(p.x, p.y);
    if (p.inShadowNow) {
      ctx.strokeStyle = 'rgba(140, 170, 255, 0.7)';
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.beginPath();
      ctx.arc(0, 0, 20, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
    }
    ctx.fillStyle = p.sneaking ? COLORS.playerSneak : COLORS.player;
    ctx.beginPath();
    ctx.arc(0, 0, p.sneaking ? 12 : 14, 0, Math.PI * 2);
    ctx.fill();
    // Hood point showing which way Moth faces.
    ctx.rotate(p.facing);
    ctx.fillStyle = '#8a6d1f';
    ctx.beginPath();
    ctx.moveTo(14, 0);
    ctx.lineTo(4, -7);
    ctx.lineTo(4, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#f5f2ea';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Moth', p.x, p.y - 22);
    if (p.inShadowNow) {
      ctx.fillStyle = '#9db8ff';
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('hidden in shadow', p.x, p.y + 30);
    }
  }

  drawPebbles(ctx, state) {
    for (const pebble of state.pebbles) {
      const age = state.time - pebble.at;
      if (age > 1.2) continue;
      ctx.save();
      ctx.globalAlpha = 1 - age / 1.2;
      ctx.strokeStyle = '#ffd76a';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pebble.x, pebble.y, 10 + age * 60, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#cfc8b8';
      ctx.beginPath();
      ctx.arc(pebble.x, pebble.y, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawHud(state) {
    const ctx = this.ctx;
    ctx.fillStyle = COLORS.hudBg;
    ctx.fillRect(0, 0, this.canvas.width, HUD_HEIGHT);
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'left';
    const objective = state.hasOpal ? 'Slip out the EXIT — unseen' : 'Steal the Starlight Opal, then slip out the EXIT';
    ctx.fillText(objective, 14, 20);
    // Detection meter.
    const meterX = 560;
    const meterW = 260;
    ctx.fillStyle = COLORS.hudDim;
    ctx.font = '12px sans-serif';
    ctx.fillText('SPOTTED', meterX, 14);
    ctx.fillStyle = '#2a2e38';
    ctx.fillRect(meterX, 20, meterW, 14);
    const detection = state.detection;
    ctx.fillStyle = detection > 70 ? COLORS.danger : detection > 30 ? COLORS.guardSuspicious : COLORS.safe;
    ctx.fillRect(meterX, 20, (meterW * detection) / 100, 14);
    ctx.strokeStyle = '#555a68';
    ctx.lineWidth = 1;
    ctx.strokeRect(meterX, 20, meterW, 14);
    // Timer, pebbles, guards.
    ctx.fillStyle = COLORS.hudText;
    ctx.font = 'bold 15px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(this.formatTime(state.elapsed), this.canvas.width - 14, 20);
    ctx.font = '12px sans-serif';
    ctx.fillStyle = COLORS.hudDim;
    ctx.textAlign = 'left';
    ctx.fillText(`pebbles: ${'●'.repeat(state.player.pebbles)}${'○'.repeat(3 - state.player.pebbles)}`, 14, 38);
    const chasing = state.guards.filter((g) => g.state === GUARD_STATE.CHASE).length;
    const suspicious = state.guards.filter((g) => g.state === GUARD_STATE.SUSPICIOUS).length;
    ctx.fillText(
      chasing > 0 ? `ALARM — ${chasing} guard${chasing > 1 ? 's' : ''} chasing you!` : suspicious > 0 ? `${suspicious} guard${suspicious > 1 ? 's' : ''} suspicious…` : 'the hall is quiet',
      560,
      38,
    );
  }

  formatTime(seconds) {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  drawToast(state) {
    const ctx = this.ctx;
    ctx.save();
    ctx.font = 'bold 17px sans-serif';
    ctx.textAlign = 'center';
    const w = ctx.measureText(state.toast).width + 36;
    const x = (this.canvas.width - w) / 2;
    const y = HUD_HEIGHT + 18;
    ctx.fillStyle = 'rgba(16, 18, 24, 0.88)';
    ctx.fillRect(x, y, w, 32);
    ctx.strokeStyle = COLORS.guardSuspicious;
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, 32);
    ctx.fillStyle = '#ffe9a8';
    ctx.fillText(state.toast, this.canvas.width / 2, y + 21);
    ctx.restore();
  }

  panel(title, lines, accent) {
    const ctx = this.ctx;
    const w = 640;
    const h = 120 + lines.length * 30;
    const x = (this.canvas.width - w) / 2;
    const y = (this.canvas.height - h) / 2;
    ctx.save();
    ctx.fillStyle = 'rgba(10, 12, 18, 0.88)';
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.fillStyle = '#171a22';
    ctx.fillRect(x, y, w, h);
    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.textAlign = 'center';
    ctx.fillStyle = accent;
    ctx.font = 'bold 34px sans-serif';
    ctx.fillText(title, this.canvas.width / 2, y + 52);
    ctx.fillStyle = COLORS.hudText;
    ctx.font = '16px sans-serif';
    lines.forEach((line, i) => ctx.fillText(line, this.canvas.width / 2, y + 92 + i * 30));
    ctx.restore();
  }

  drawMenu(state) {
    this.panel('NIGHT VAULT', [
      'Moth is in the museum after dark. Lift the Starlight Opal,',
      'then slip out the green EXIT — without a single guard seeing you.',
      '',
      'WASD / arrows — move      SHIFT — sneak (slow, quiet, harder to see)',
      'Click the floor — toss a pebble to pull a guard away (3 pebbles)',
      'Hide behind crates and cases. Shadows slow a guard’s suspicion.',
      'A full SPOTTED meter means the alarm — and the game.',
      '',
      'Press ENTER or click to begin.',
    ], COLORS.player);
  }

  drawEnd(state, won) {
    if (won) {
      this.panel('CLEAN GETAWAY', [
        `Out the door with the Opal in ${this.formatTime(state.elapsed)} — ${state.rating}.`,
        state.maxDetection < 30
          ? 'No guard ever truly saw you. A ghost story for the morning papers.'
          : 'You were nearly spotted more than once. The morning papers will wonder.',
        '',
        'Press R to steal it again.',
      ], COLORS.exit);
    } else {
      this.panel('CAUGHT!', [
        'A guard’s torch found you and the alarm went up.',
        `You lasted ${this.formatTime(state.elapsed)} in the hall.`,
        '',
        'Press R to try again — slower this time, and mind the cones.',
      ], COLORS.danger);
    }
  }
}
