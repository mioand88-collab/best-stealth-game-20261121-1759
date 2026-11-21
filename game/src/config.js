// Night Vault — shared tuning constants.
// One clear job: every magic number the game balances on lives here.

export const TILE = 48;
export const COLS = 24;
export const ROWS = 16;
export const HUD_HEIGHT = 48;
export const LEVEL_W = COLS * TILE; // 1152
export const LEVEL_H = ROWS * TILE; // 768
export const CANVAS_W = LEVEL_W;
export const CANVAS_H = HUD_HEIGHT + LEVEL_H;

// Movement (pixels per second).
export const PLAYER_WALK_SPEED = 150;
export const PLAYER_SNEAK_SPEED = 78;
export const GUARD_PATROL_SPEED = 62;
export const GUARD_SUSPICIOUS_SPEED = 88;
export const GUARD_CHASE_SPEED = 132;

// Vision: a guard sees inside this cone when nothing blocks the view.
export const GUARD_VIEW_RANGE = 225;
export const GUARD_VIEW_HALF_ANGLE = Math.PI / 5.2; // about 35 degrees each side
export const GUARD_VIEW_RANGE_SNEAK = 200; // sneaking shrinks the cone a little

// Detection: suspicion is per guard, 0..100. The HUD meter shows the highest.
export const SUSPICION_RISE_CLOSE = 62; // per second, player near and in the open
export const SUSPICION_RISE_FAR = 26; // per second, player at the cone's edge
export const SUSPICION_FALL = 20; // per second while unseen
export const SUSPICION_SHADOW_FACTOR = 0.45; // hiding in a shadow patch
export const SUSPICION_SNEAK_FACTOR = 0.55; // crouched and slow
export const SUSPICION_CHASE_AT = 70; // a guard this sure gives chase
export const SUSPICION_CAUGHT_AT = 100; // full meter: the alarm sounds, you are caught

// Noise: footsteps and pebbles. Guards inside the radius investigate.
export const NOISE_WALK_RADIUS = 78;
export const NOISE_SNEAK_RADIUS = 30;
export const PEBBLE_RANGE = 280;
export const PEBBLE_NOISE_RADIUS = 170;
export const PEBBLE_COUNT = 3;

// Colours.
export const COLORS = {
  floor: '#23262e',
  floorAlt: '#262a33',
  shadowFloor: '#151a26',
  wall: '#3d4252',
  wallTop: '#565d73',
  crate: '#7a5a34',
  crateTop: '#9c7648',
  displayCase: '#2e4a5e',
  displayGlass: '#7fc4d8',
  opal: '#bfe9ff',
  exit: '#39d98a',
  exitDark: '#1d7a4c',
  player: '#f2c94c',
  playerSneak: '#d8a93a',
  guard: '#e4572e',
  guardSuspicious: '#f08c1e',
  guardChase: '#e5383b',
  coneCalm: 'rgba(242, 201, 76, 0.16)',
  coneSuspicious: 'rgba(240, 140, 30, 0.28)',
  coneChase: 'rgba(229, 56, 59, 0.32)',
  hudBg: '#101218',
  hudText: '#e8e6df',
  hudDim: '#9a978c',
  danger: '#e5383b',
  safe: '#39d98a',
};
