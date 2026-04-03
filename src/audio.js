export class AudioManager {
  constructor() {
    this.ctx = null;
    this.enabled = true;
    this.volume01 = 0.35;
  }

  setEnabled(on) { this.enabled = !!on; }
  setVolume01(v) { this.volume01 = Math.max(0, Math.min(1, v)); }

  unlock() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === "suspended") this.ctx.resume();
  }

  _toneAt({ freq = 440, dur = 0.08, type = "triangle", gain = 0.10, detune = 0, at = 0, attack = 0.004, release = 0.08 } = {}) {
    if (!this.enabled) return;
    this.unlock();
    const ctx = this.ctx;

    const o = ctx.createOscillator();
    const g = ctx.createGain();

    const t0 = ctx.currentTime + at;
    const vol = Math.max(0.0002, gain * this.volume01);

    o.type = type;
    o.frequency.setValueAtTime(freq, t0);
    o.detune.setValueAtTime(detune, t0);

    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + Math.max(attack + 0.01, dur * release));

    o.connect(g);
    g.connect(ctx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.03);
  }

  _pitchSweepAt({ from = 1200, to = 900, dur = 0.035, type = "square", gain = 0.09, at = 0 } = {}) {
    if (!this.enabled) return;
    this.unlock();
    const ctx = this.ctx;

    const o = ctx.createOscillator();
    const g = ctx.createGain();
    const t0 = ctx.currentTime + at;
    const vol = Math.max(0.0002, gain * this.volume01);

    o.type = type;
    o.frequency.setValueAtTime(from, t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(30, to), t0 + dur);

    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.002);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);

    o.connect(g);
    g.connect(ctx.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  }

  _lockTone(strength = 1.0) {
    const s = Math.max(0.25, Math.min(2.0, strength));

    // 콤보음과 계열은 비슷하지만 더 짧고 낮은 설치음
    this._pitchSweepAt({ from: 1380, to: 980, dur: 0.022, type: "square", gain: 0.075 * s, at: 0.000 });
    this._toneAt({ freq: 720, dur: 0.050, type: "triangle", gain: 0.095 * s, at: 0.004, attack: 0.002, release: 0.42 });
    this._toneAt({ freq: 360, dur: 0.038, type: "square", gain: 0.040 * s, at: 0.006, attack: 0.0018, release: 0.32 });
    this._toneAt({ freq: 180, dur: 0.060, type: "sine", gain: 0.028 * s, at: 0.008, attack: 0.003, release: 0.55 });
  }

  _comboTone(combo = 0) {
    const c = Math.max(0, combo);
    const capped = Math.min(30, c);

    // 10 / 20 / 30에서 단계적으로 더 날카롭고 더 커지게
    const tier = capped >= 30 ? 3 : (capped >= 20 ? 2 : (capped >= 10 ? 1 : 0));

    const base = tier === 3 ? 980 : tier === 2 ? 860 : tier === 1 ? 760 : 660;
    const steps = tier === 3 ? 6 : tier === 2 ? 5 : tier === 1 ? 4 : 3;
    const dt = tier === 3 ? 0.032 : tier === 2 ? 0.036 : tier === 1 ? 0.040 : 0.044;
    const gainScale = tier === 3 ? 1.90 : tier === 2 ? 1.55 : tier === 1 ? 1.25 : 1.0;

    const ratios = tier === 3
      ? [1.0, 1.18, 1.42, 1.70, 2.0, 2.36]
      : tier === 2
      ? [1.0, 1.22, 1.5, 1.82, 2.18]
      : tier === 1
      ? [1.0, 1.26, 1.58, 2.0]
      : [1.0, 1.4, 1.9];

    // 설치음과 비슷한 계열이지만 더 높고 더 화려하게
    this._pitchSweepAt({
      from: base * (tier === 3 ? 1.8 : 1.6),
      to: base * 1.08,
      dur: tier === 3 ? 0.024 : 0.028,
      type: "square",
      gain: (0.065 + tier * 0.02) * gainScale,
      at: 0.000
    });

    // 콤보가 높을수록 시작 임팩트도 커짐
    this._toneAt({
      freq: 200 + tier * 20,
      dur: 0.080,
      type: "sine",
      gain: 0.020 * gainScale,
      at: 0.004,
      attack: 0.003,
      release: 0.50
    });

    for (let i = 0; i < steps; i++) {
      const t = 0.018 + i * dt;
      const f = base * ratios[i];

      this._toneAt({
        freq: f,
        dur: tier >= 2 ? 0.078 : 0.072,
        type: "triangle",
        gain: (0.090 + tier * 0.025) * gainScale,
        at: t,
        attack: 0.0018,
        release: 0.42
      });

      this._toneAt({
        freq: f * 2,
        dur: tier >= 2 ? 0.050 : 0.044,
        type: "square",
        gain: (0.028 + tier * 0.010) * gainScale,
        at: t + 0.003,
        attack: 0.0013,
        release: 0.30
      });

      if (tier >= 1) {
        this._pitchSweepAt({
          from: f * (tier >= 3 ? 1.16 : 1.10),
          to: f * 0.98,
          dur: tier >= 2 ? 0.018 : 0.020,
          type: "square",
          gain: (0.018 + tier * 0.010) * gainScale,
          at: t
        });
      }
    }
  }

  play(event, data = {}) {
    if (!this.enabled) return;

    if (event === "lock") {
      this._lockTone(1.10);
      return;
    }

    if (event === "clear") {
      const lines = data.lines || 1;
      const freq = lines === 4 ? 820 : (lines === 3 ? 720 : (lines === 2 ? 620 : 540));
      this._toneAt({ freq, dur: 0.09, type: "triangle", gain: 0.10, at: 0.0 });
      if (lines >= 3) this._pitchSweepAt({ from: freq * 1.6, to: freq * 1.2, dur: 0.05, type: "square", gain: 0.04, at: 0.01 });
      return;
    }

    if (event === "combo") {
      this._comboTone(data.combo || 0);
      return;
    }

    if (event === "attack") {
      const atk = data.attack || 0;
      const base = 340 + Math.min(10, atk) * 26;
      this._pitchSweepAt({ from: base * 1.4, to: base, dur: 0.035, type: "square", gain: 0.055, at: 0.0 });
      this._toneAt({ freq: base * 0.5, dur: 0.08, type: "sine", gain: 0.045, at: 0.008 });
      return;
    }
  }
}
