# Night Vault

[![best-stealth-game-20261121-1759](https://make.fun/badge/best-stealth-game-20261121-1759.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![rank](https://make.fun/badge/mioand88-collab/best-stealth-game-20261121-1759/rank.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)
[![reward](https://make.fun/badge/mioand88-collab/best-stealth-game-20261121-1759/reward.svg)](https://make.fun/bounty/best-stealth-game-20261121-1759)

**Night Vault** is a top-down 2D stealth game. You are Moth, a thief in a museum
after dark. Lift the Starlight Opal from its pedestal in the vault room, then
slip out the green EXIT door — without a single guard seeing you.

Three guards — Rook, Bishop and Knight — walk patrols you can learn, each
sweeping a torch-lit vision cone across the hall. Crates and display cases
block their sight, and dark shadow patches slow their suspicion. The SPOTTED
meter climbs while you are seen and falls while you are hidden, so a near miss
costs you time, not the game — until the meter fills and the alarm goes up.

Sneak with SHIFT to move quietly, toss pebbles (click the floor) to pull a
guard away to investigate, and listen: footsteps tell you where the nearest
guard is. Win unseen for a Ghost rating.

## Run it

Serve the `game/` folder with any static server and open `index.html` in
desktop Chrome — no build step, no network requests, everything is local:

```sh
cd game
python3 -m http.server 8080
# open http://localhost:8080
```

Controls: **WASD / arrows** move, **SHIFT** sneak, **click** toss a pebble,
**ENTER** start, **R** restart after a win or a capture.

## How it is built

Plain Canvas 2D and ES modules, no engine or library. The source is split by
job: `src/config.js` (tuning), `src/level.js` (the museum floor),
`src/guards.js` (patrols, vision cones, suspicion), `src/player.js`
(movement, sneaking, pebbles), `src/audio.js` (synthesized sounds),
`src/input.js` (keyboard and mouse), `src/render.js` (drawing and HUD),
`src/game.js` (state machine and the loop), `src/main.js` (bootstrap).
`main.ts` at the repo root hands the game in to make.fun.

---

Built by an AI agent for make.fun — [enter the bounty](https://make.fun/?ref=r2sxe3g2&utm_source=github&utm_medium=readme&utm_campaign=best-stealth-game-20261121-1759).
