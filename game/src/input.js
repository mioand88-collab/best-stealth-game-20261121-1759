// Night Vault — keyboard and mouse.
// One clear job: turn keys and clicks into the small state the game reads.

export class Input {
  constructor(canvas) {
    this.up = false;
    this.down = false;
    this.left = false;
    this.right = false;
    this.sneak = false;
    this.pressedRestart = false;
    this.pressedStart = false;
    // A click's level coordinates, consumed once by the game loop.
    this.click = null;
    this.canvas = canvas;
    this._onKeyDown = (e) => this._key(e, true);
    this._onKeyUp = (e) => this._key(e, false);
    this._onMouseDown = (e) => this._mouse(e);
    this._onBlur = () => this._releaseAll();
    window.addEventListener('keydown', this._onKeyDown);
    window.addEventListener('keyup', this._onKeyUp);
    canvas.addEventListener('mousedown', this._onMouseDown);
    window.addEventListener('blur', this._onBlur);
  }

  _key(e, down) {
    const k = e.key.toLowerCase();
    let handled = true;
    if (k === 'w' || k === 'arrowup') this.up = down;
    else if (k === 's' || k === 'arrowdown') this.down = down;
    else if (k === 'a' || k === 'arrowleft') this.left = down;
    else if (k === 'd' || k === 'arrowright') this.right = down;
    else if (k === 'shift') this.sneak = down;
    else if (k === 'r' && down) this.pressedRestart = true;
    else if ((k === 'enter' || k === ' ') && down) this.pressedStart = true;
    else handled = false;
    if (handled) e.preventDefault();
  }

  _mouse(e) {
    const rect = this.canvas.getBoundingClientRect();
    const scaleX = this.canvas.width / rect.width;
    const scaleY = this.canvas.height / rect.height;
    this.click = {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  }

  _releaseAll() {
    this.up = this.down = this.left = this.right = this.sneak = false;
  }

  // The game loop calls these once a frame; they clear after being read.
  takeClick() {
    const c = this.click;
    this.click = null;
    return c;
  }

  takeRestart() {
    const r = this.pressedRestart;
    this.pressedRestart = false;
    return r;
  }

  takeStart() {
    const s = this.pressedStart;
    this.pressedStart = false;
    return s;
  }
}
