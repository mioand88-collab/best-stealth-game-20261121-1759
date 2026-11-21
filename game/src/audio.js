// Night Vault — every sound, synthesized in code.
// One clear job: WebAudio bleeps and thuds. No audio files, nothing fetched.
// Everything is guarded so the game still plays when audio is unavailable.

export class SoundEngine {
  constructor() {
    this.ctx = null;
    this.master = null;
    this.enabled = true;
    this.ambientStarted = false;
  }

  // Browsers only let audio start after a gesture; call this from one.
  unlock() {
    try {
      if (!this.ctx) {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        if (!Ctor) return;
        this.ctx = new Ctor();
        this.master = this.ctx.createGain();
        this.master.gain.value = 0.5;
        this.master.connect(this.ctx.destination);
      }
      if (this.ctx.state === 'suspended') void this.ctx.resume();
    } catch {
      this.ctx = null;
    }
  }

  // A short filtered-noise thud, the volume and pitch saying how close it is.
  thud(volume, pitch) {
    if (!this.ctx || !this.enabled) return;
    try {
      const t = this.ctx.currentTime;
      const dur = 0.09;
      const buffer = this.ctx.createBuffer(1, Math.floor(this.ctx.sampleRate * dur), this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = (Math.random() * 2 - 1) * (1 - i / data.length);
      }
      const src = this.ctx.createBufferSource();
      src.buffer = buffer;
      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = pitch;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      src.connect(filter);
      filter.connect(gain);
      gain.connect(this.master);
      src.start(t);
    } catch {
      // Silence is better than a crash.
    }
  }

  // A short sine blip at a frequency, for pickups and interface sounds.
  blip(freq, dur, volume, when = 0) {
    if (!this.ctx || !this.enabled) return;
    try {
      const t = this.ctx.currentTime + when;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const gain = this.ctx.createGain();
      gain.gain.setValueAtTime(volume, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    } catch {
      // Silence is better than a crash.
    }
  }

  // A soft two-note chime when the Opal is lifted.
  pickup() {
    this.blip(880, 0.16, 0.22);
    this.blip(1318, 0.28, 0.18, 0.09);
  }

  // A low warning sting when a guard starts the chase.
  alarm() {
    this.blip(196, 0.5, 0.3);
    this.blip(185, 0.5, 0.3, 0.14);
  }

  // A rising arpeggio for slipping out unseen.
  win() {
    [523, 659, 784, 1046].forEach((f, i) => this.blip(f, 0.3, 0.2, i * 0.11));
  }

  // A falling pair for being caught.
  lose() {
    this.blip(311, 0.4, 0.25);
    this.blip(233, 0.6, 0.25, 0.22);
  }

  // The pebble's clatter: three quick ticks.
  clatter() {
    this.thud(0.35, 2400);
    setTimeout(() => this.thud(0.25, 1800), 70);
    setTimeout(() => this.thud(0.18, 1400), 150);
  }

  // A barely-there room tone, started once, so the museum is not dead silent.
  startAmbient() {
    if (!this.ctx || this.ambientStarted) return;
    try {
      this.ambientStarted = true;
      const osc = this.ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = 55;
      const gain = this.ctx.createGain();
      gain.gain.value = 0.02;
      const lfo = this.ctx.createOscillator();
      lfo.frequency.value = 0.07;
      const lfoGain = this.ctx.createGain();
      lfoGain.gain.value = 0.008;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      osc.connect(gain);
      gain.connect(this.master);
      osc.start();
      lfo.start();
    } catch {
      // Silence is better than a crash.
    }
  }
}
