// Shardkin: Eight Realms — Sound effects and the synthesized attack sounds.
// Files share one global scope and load in the order listed in index.html.
"use strict";

  // ---------- Sound ----------
  let ctx = null, queue = [];
  function sfx(n) { queue.push(n); }
  const TONES = {
    hit: [[330, 0.08, "square"]], strong: [[440, 0.08, "square"], [660, 0.12, "square"]],
    weak: [[200, 0.14, "triangle"]], miss: [[150, 0.18, "sine"]],
    faint: [[392, 0.12, "triangle"], [294, 0.12, "triangle"], [196, 0.22, "triangle"]],
    catch: [[523, 0.1, "sine"], [659, 0.1, "sine"], [784, 0.2, "sine"]],
    fail: [[180, 0.1, "sawtooth"], [150, 0.16, "sawtooth"]],
    level: [[523, 0.08, "square"], [784, 0.16, "square"]],
    evolve: [[392, 0.1, "sine"], [523, 0.1, "sine"], [659, 0.1, "sine"], [784, 0.1, "sine"], [1046, 0.3, "sine"]],
    heal: [[600, 0.08, "sine"], [800, 0.12, "sine"]], swap: [[500, 0.06, "sine"]],
    win: [[523, 0.1, "square"], [659, 0.1, "square"], [784, 0.1, "square"], [1046, 0.25, "square"]],
    lose: [[300, 0.2, "sawtooth"], [200, 0.35, "sawtooth"]],
    roll: [[700, 0.03, "square"], [900, 0.03, "square"], [700, 0.03, "square"], [1000, 0.05, "square"]],
    trap: [[240, 0.08, "sawtooth"], [180, 0.12, "sawtooth"]],
    portal: [[300, 0.06, "sine"], [450, 0.06, "sine"], [675, 0.06, "sine"], [1000, 0.12, "sine"]],
    ambush: [[260, 0.07, "square"], [260, 0.07, "square"], [390, 0.14, "square"]],
    boss: [[196, 0.15, "sawtooth"], [185, 0.15, "sawtooth"], [175, 0.3, "sawtooth"]],
    giant: [[110, 0.25, "sawtooth"], [98, 0.25, "sawtooth"], [82, 0.5, "sawtooth"]],
    status: [[880, 0.05, "triangle"], [660, 0.05, "triangle"], [880, 0.08, "triangle"]],
    coin: [[988, 0.05, "square"], [1319, 0.12, "square"]],
    chest: [[659, 0.06, "sine"], [880, 0.06, "sine"], [1175, 0.16, "sine"]],
    tick: [[1200, 0.02, "square"]],
    shardborn: [[1568, 0.07, "sine"], [2093, 0.07, "sine"], [2637, 0.07, "sine"], [3136, 0.25, "sine"]],
    storm: [[2349, 0.04, "triangle"], [1760, 0.04, "triangle"], [2794, 0.04, "triangle"], [1976, 0.04, "triangle"], [3136, 0.05, "triangle"], [2217, 0.12, "triangle"]],
    forge: [[196, 0.07, "square"], [1175, 0.05, "triangle"], [1568, 0.15, "triangle"]]
  };
  // ---------- Attack sound engine ----------
  // Every attack is synthesized from its element, its power and words in the skill's name.
  // Your attacks lean slightly right and your opponent's slightly left, for headphone listeners.
  function atkSfx(sk, isYou, result) { queue.push({ atk: true, el: sk.el, name: sk.name, power: sk.power, you: isYou, result }); }
  const SND = (function () {
    function noiseBuf(c) {
      if (!c._nb) {
        const b = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = b.getChannelData(0);
        for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        c._nb = b;
      }
      return c._nb;
    }
    function envGain(c, t, a, peak, d) {
      const g = c.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
      g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
      return g;
    }
    // A pitched voice: o = { type, f0, f1, dur, peak, a, vib, depth }
    function tone(c, out, t, o) {
      const a = o.a || 0.005, s = c.createOscillator();
      s.type = o.type || "sine";
      s.frequency.setValueAtTime(o.f0, t);
      if (o.f1 && o.f1 !== o.f0) s.frequency.exponentialRampToValueAtTime(Math.max(20, o.f1), t + a + o.dur);
      if (o.vib) {
        const l = c.createOscillator(), lg = c.createGain();
        l.frequency.value = o.vib; lg.gain.value = o.depth || 10;
        l.connect(lg).connect(s.frequency); l.start(t); l.stop(t + a + o.dur + 0.05);
      }
      s.connect(envGain(c, t, a, o.peak, o.dur)).connect(out);
      s.start(t); s.stop(t + a + o.dur + 0.05);
    }
    // Filtered noise: o = { ft, f0, f1, q, dur, peak, a }
    function hiss(c, out, t, o) {
      const a = o.a || 0.005, s = c.createBufferSource(), f = c.createBiquadFilter();
      s.buffer = noiseBuf(c); s.loop = true;
      f.type = o.ft || "bandpass";
      f.frequency.setValueAtTime(o.f0, t);
      if (o.f1) f.frequency.exponentialRampToValueAtTime(o.f1, t + a + o.dur);
      f.Q.value = o.q || 1;
      s.connect(f).connect(envGain(c, t, a, o.peak, o.dur)).connect(out);
      s.start(t, Math.random() * 1.5); s.stop(t + a + o.dur + 0.05);
    }
    // A buzzing voice that jumps between random pitches, for electricity.
    function jitter(c, out, t, dur, peak, lo, hi) {
      const s = c.createOscillator();
      s.type = "square";
      for (let x = 0; x < dur; x += 0.018) s.frequency.setValueAtTime(lo + Math.random() * (hi - lo), t + x);
      s.connect(envGain(c, t, 0.004, peak, dur)).connect(out);
      s.start(t); s.stop(t + dur + 0.05);
    }
    function thump(c, out, t, k, v, f0) {
      tone(c, out, t, { f0: f0 || 160, f1: 45, dur: 0.2 * k, peak: 0.9 * v });
      hiss(c, out, t, { ft: "lowpass", f0: 900, dur: 0.07, peak: 0.5 * v });
      return 0.2 * k;
    }
    const R = Math.random;
    // Each returns how long its main body lasts. k stretches time, v sets loudness, h is 1 for heavy skills.
    const EL = {
      Fire(c, o, t, k, v, h) {
        hiss(c, o, t, { f0: 300, f1: 2800, q: 0.8, dur: 0.28 * k, peak: 0.55 * v, a: 0.03 });
        for (let i = 0; i < 5 + 6 * h; i++) hiss(c, o, t + 0.03 + R() * 0.32 * k, { ft: "highpass", f0: 2500 + R() * 3000, dur: 0.012, peak: 0.4 * v });
        if (h) {
          tone(c, o, t, { type: "sawtooth", f0: 95, f1: 55, dur: 0.5 * k, peak: 0.16 * v, a: 0.05 });
          hiss(c, o, t + 0.05, { ft: "lowpass", f0: 700, f1: 220, dur: 0.5 * k, peak: 0.45 * v, a: 0.08 });
        }
        return (0.34 + 0.2 * h) * k;
      },
      Water(c, o, t, k, v, h) {
        const n = 2 + 2 * h;
        for (let i = 0; i < n; i++) tone(c, o, t + i * 0.055, { f0: 700 + R() * 500, f1: 220 + R() * 80, dur: 0.07, peak: 0.45 * v });
        hiss(c, o, t + n * 0.05, { ft: "highpass", f0: 1800, dur: 0.28 * k, peak: 0.4 * v, a: 0.01 });
        if (h) hiss(c, o, t, { ft: "lowpass", f0: 300, f1: 900, q: 0.7, dur: 0.6 * k, peak: 0.5 * v, a: 0.2 });
        return n * 0.05 + (0.28 + 0.2 * h) * k;
      },
      Earth(c, o, t, k, v, h) {
        const n = 1 + 2 * h;
        for (let i = 0; i < n; i++) thump(c, o, t + i * 0.13, k, v * (1 - i * 0.15), 140 - i * 15);
        hiss(c, o, t, { ft: "lowpass", f0: 320, f1: 120, dur: (0.35 + 0.3 * h) * k, peak: 0.55 * v, a: 0.02 });
        for (let i = 0; i < 3 + 4 * h; i++) hiss(c, o, t + 0.05 + R() * 0.3 * k, { f0: 600 + R() * 600, q: 3, dur: 0.03, peak: 0.25 * v });
        return (n - 1) * 0.13 + (0.35 + 0.15 * h) * k;
      },
      Electric(c, o, t, k, v, h) {
        const reps = 1 + h;
        for (let i = 0; i < reps; i++) {
          const s = t + i * 0.16 * k;
          tone(c, o, s, { type: "sawtooth", f0: 2000, f1: 160, dur: 0.16 * k, peak: 0.22 * v });
          jitter(c, o, s, 0.18 * k, 0.12 * v, 200, 2200);
          hiss(c, o, s, { ft: "highpass", f0: 3500, dur: 0.18 * k, peak: 0.3 * v });
        }
        return (0.18 + 0.16 * h) * k;
      },
      Plant(c, o, t, k, v, h) {
        hiss(c, o, t, { ft: "highpass", f0: 700, f1: 6000, dur: 0.1, peak: 0.45 * v });
        for (let x = 0.08; x < (0.32 + 0.25 * h) * k; x += 0.03) hiss(c, o, t + x, { f0: 2000 + R() * 1800, q: 1.2, dur: 0.035, peak: 0.28 * v * (1 - x) });
        tone(c, o, t + 0.08, { type: "triangle", f0: 260, f1: 140, dur: 0.1 * k, peak: 0.35 * v });
        if (h) tone(c, o, t + 0.2, { type: "triangle", f0: 200, f1: 90, dur: 0.22 * k, peak: 0.4 * v });
        return (0.34 + 0.25 * h) * k;
      },
      Physical(c, o, t, k, v, h) {
        hiss(c, o, t, { f0: 500, f1: 1600, q: 1.5, dur: 0.09, peak: 0.35 * v, a: 0.03 });
        thump(c, o, t + 0.1, k, v, 190);
        if (h) { hiss(c, o, t + 0.24, { f0: 500, f1: 1600, q: 1.5, dur: 0.08, peak: 0.3 * v, a: 0.02 }); thump(c, o, t + 0.33, k * 1.3, v, 150); }
        return (0.3 + 0.25 * h) * k;
      },
      Psychic(c, o, t, k, v, h) {
        const d = (0.4 + 0.25 * h) * k;
        tone(c, o, t, { f0: 440, f1: 660, dur: d, peak: 0.22 * v, a: 0.06, vib: 7, depth: 14 });
        tone(c, o, t, { f0: 660, f1: 990, dur: d, peak: 0.16 * v, a: 0.06, vib: 6, depth: 18 });
        tone(c, o, t + 0.05, { type: "triangle", f0: 1600, f1: 2600, dur: d * 0.8, peak: 0.08 * v, a: 0.05 });
        if (h) tone(c, o, t + 0.1, { f0: 330, f1: 880, dur: d, peak: 0.18 * v, a: 0.08, vib: 9, depth: 30 });
        return d;
      },
      Ghost(c, o, t, k, v, h) {
        const d = (0.5 + 0.3 * h) * k;
        tone(c, o, t, { type: "triangle", f0: 760, f1: 240, dur: d, peak: 0.28 * v, a: 0.08, vib: 5, depth: 25 });
        tone(c, o, t, { f0: 110, dur: d, peak: 0.18 * v, a: 0.1 });
        hiss(c, o, t, { f0: 900, f1: 500, q: 4, dur: d, peak: 0.25 * v, a: 0.2 });
        if (h) tone(c, o, t + 0.12, { type: "triangle", f0: 1100, f1: 300, dur: d * 0.9, peak: 0.16 * v, a: 0.08, vib: 4, depth: 35 });
        return d;
      }
    };
    const WORDS = {
      bite: /bite|fang|nip|chomp|gnaw|snap|jaw/i,
      shot: /beam|ray|bolt|shot|dart|needle|toss|spit|volley|barrage|arc|lance|shard|pop|spray|squirt|zap|glint|flash|ball/i,
      heavy: /slam|crash|smash|stomp|quake|hammer|punch|fist|bash|ram|charge|tackle|headbutt|crush|drop|fall|breaker|thump|bump|flop|suplex|piledriver|knockout|hug|grapple|gore|maul/i,
      sweep: /wave|storm|gale|gust|tempest|swarm|cloud|rain|flood|surge|tide|torrent|wind|blizzard|undertow|riptide|deep|bloom|forest/i,
      cry: /roar|howl|screech|wail|song|lullaby|caw|hoot|boo|fright|lament|requiem|grunt/i,
      slash: /slash|swipe|claw|scratch|cutter|razor|talon|lash|whip|slap/i
    };
    function attack(c, out, t, it) {
      const size = it.power <= 45 ? 0 : it.power <= 75 ? 1 : 2;
      // Per-element loudness balance, measured so every element sounds about equally loud.
      const ELGAIN = { Plant: 1.5, Water: 1.1, Fire: 1.6, Earth: 0.7, Electric: 1.25, Psychic: 1.4, Ghost: 1.3, Physical: 0.6 };
      const k = [0.75, 1, 1.4][size], v = [0.55, 0.75, 0.95][size] * (ELGAIN[it.el] || 1), h = size === 2 ? 1 : 0;
      const pitch = 0.95 + R() * 0.1;
      let s = t;
      if (it.result === "miss") {
        hiss(c, out, s, { f0: 3000, f1: 400, q: 1.2, dur: 0.22, peak: 0.35, a: 0.03 });
        tone(c, out, s + 0.12, { f0: 420, f1: 180, dur: 0.22, peak: 0.18 });
        return 0.4;
      }
      if (WORDS.shot.test(it.name)) { tone(c, out, s, { f0: 600 * pitch, f1: 1900 * pitch, dur: 0.11, peak: 0.16 * v }); s += 0.11; }
      if (WORDS.cry.test(it.name)) {
        const low = /roar|howl|grunt|boo/i.test(it.name);
        tone(c, out, s, { type: "sawtooth", f0: (low ? 140 : 900) * pitch, f1: (low ? 90 : 600) * pitch, dur: 0.35 * k, peak: 0.12 * v, a: 0.05, vib: 6, depth: low ? 8 : 40 });
        s += 0.2 * k;
      }
      if (WORDS.slash.test(it.name)) hiss(c, out, s, { ft: "highpass", f0: 1200, f1: 7000, dur: 0.08, peak: 0.4 * v, a: 0.01 });
      if (WORDS.bite.test(it.name)) {
        for (const x of [0, 0.07]) { tone(c, out, s + x, { type: "square", f0: 1800, f1: 900, dur: 0.02, peak: 0.25 * v }); hiss(c, out, s + x, { ft: "highpass", f0: 2000, dur: 0.03, peak: 0.3 * v }); }
        s += 0.08;
      }
      s += EL[it.el](c, out, s, k, v, h);
      if (WORDS.sweep.test(it.name)) { hiss(c, out, s - 0.15, { ft: "lowpass", f0: 400, f1: 1400, q: 0.8, dur: 0.45 * k, peak: 0.4 * v, a: 0.18 }); s += 0.25 * k; }
      if (WORDS.heavy.test(it.name) && it.el !== "Physical" && it.el !== "Earth") s += thump(c, out, s - 0.05, k, v, 170) - 0.05;
      if (it.result === "strong") {
        tone(c, out, s, { type: "triangle", f0: 1320, dur: 0.07, peak: 0.25 });
        tone(c, out, s + 0.07, { type: "triangle", f0: 1980, dur: 0.12, peak: 0.25 });
        s += 0.19;
      } else if (it.result === "weak") {
        tone(c, out, s, { type: "triangle", f0: 150, f1: 110, dur: 0.15, peak: 0.25 });
        s += 0.15;
      }
      return s - t;
    }
    return { attack };
  })();
  function playTones(c, out, t, n) {
    for (const [f, d, type] of TONES[n]) {
      const o = c.createOscillator(), g = c.createGain();
      o.type = type; o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + d);
      o.connect(g).connect(out); o.start(t); o.stop(t + d + 0.02);
      t += d;
    }
    return TONES[n].reduce((a, x) => a + x[1], 0);
  }
  let master = null;
  // Plays a list of sounds back to back on any audio context; returns the total length.
  function playQueue(c, dest, q, t0) {
    let t = t0;
    for (const n of q.slice(0, 24)) {
      if (n && n.atk) {
        let out = dest;
        if (c.createStereoPanner) { const p = c.createStereoPanner(); p.pan.value = n.you ? 0.35 : -0.35; p.connect(dest); out = p; }
        t += SND.attack(c, out, t, n) + 0.12;
      } else if (TONES[n]) {
        t += playTones(c, dest, t, n) + (n === "tick" ? 0.05 : 0.12);
      }
    }
    return t - t0;
  }
  function flushSound(skipAttacks) {
    let q = queue; queue = [];
    if (skipAttacks) q = q.filter(n => !(n && n.atk));
    if (!S.sound || !q.length) return 0;
    try {
      if (!ctx) {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        const comp = ctx.createDynamicsCompressor();
        master = ctx.createGain(); master.gain.value = 0.8;
        master.connect(comp).connect(ctx.destination);
      }
      if (ctx.state === "suspended") ctx.resume();
      return playQueue(ctx, master, q, ctx.currentTime + 0.05);
    } catch (e) { return 0; /* sound is optional */ }
  }
  function demoSkill(el, heavy) {
    const sp = SP[heavy ? POOLS[el].Legendary[0] : POOLS[el].Common[0]];
    const s = sp.skills[heavy ? 3 : 0];
    return { name: s[0], el, power: s[2] };
  }
