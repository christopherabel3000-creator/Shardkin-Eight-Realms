// Shardkin balance simulator. Plays a saved game forward with the game's own code and auto-play choices,
// so balance changes can be checked against a real save before they ship. The game itself never loads this file.
//
// Run with Node, from the repository folder:
//   node tools/sim.js <file containing a save code> <mode> [runs]
// Modes:
//   campaign  plays every remaining campaign level in order, retrying failures
//   trials    plays Trial tiers 1 to 15 from the save, each as a first attempt
//   wboss     finds a world boss on the furthest world and counts the fights to defeat it
//   arena     climbs the Arena from the highest checkpoint
// Set NOPOTIONS=1 to play without healing items, or CATCH=1 to turn on auto-play's catch mode.
"use strict";
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const FILES = ["data", "state", "sound", "progress", "board", "battle", "screens", "input", "autoplay"];
const JS = path.join(__dirname, "..", "js");

// Loads the game into a sandbox with a stand-in page and clock, with the save already in browser storage.
function boot(saveJson) {
  const els = {};
  const el = () => ({ textContent: "", hidden: false, innerHTML: "", value: "", dataset: {}, setAttribute() {}, focus() {}, addEventListener() {} });
  const store = { "shardkin-save-v1": JSON.stringify(saveJson) };
  let clock = Date.now();
  const FakeDate = class extends Date {
    constructor(...a) { if (a.length) super(...a); else super(clock); }
    static now() { return clock; }
  };
  const ctx = {
    document: { getElementById: id => els[id] || (els[id] = el()) },
    localStorage: { getItem: k => (k in store ? store[k] : null), setItem: (k, v) => { store[k] = String(v); } },
    console, TextEncoder, TextDecoder, atob, btoa, navigator: {}, setTimeout: () => 0, clearTimeout() {}, Date: FakeDate
  };
  vm.createContext(ctx);
  const code = FILES.map(f => fs.readFileSync(path.join(JS, f + ".js"), "utf8")).join("\n;\n") + "\n;globalThis.SIM = { get S() { return S; }, prefs, autoChoose, WORLDS };";
  vm.runInContext(code, ctx, { filename: "shardkin.js" });
  const P = ctx.SIM.prefs();
  P.potions = !process.env.NOPOTIONS; P.capture = !!process.env.CATCH; P.repeat = false;
  return {
    ctx, get S() { return ctx.SIM.S; },
    act(a, arg = "") { ctx.doAction(a, String(arg), true); },
    // Lets auto-play choose until it has nothing left to do. Returns the number of actions.
    drive(max = 8000) { let n = 0; for (; n < max; n++) { const c = ctx.SIM.autoChoose(); if (!c) break; ctx.doAction(c[0], String(c[1]), true); clock += 1500; } return n; },
    advance(ms) { clock += ms; }
  };
}

function readSave(file) {
  const m = fs.readFileSync(file, "utf8").replace(/\s+/g, "").match(/SHARDKIN1\.([A-Za-z0-9+/=]+)/);
  if (!m) throw new Error("No save code (starting with SHARDKIN1.) found in " + file);
  return JSON.parse(Buffer.from(m[1], "base64").toString("utf8"));
}
const copy = o => JSON.parse(JSON.stringify(o));
const cleared = G => G.S.screen === "wheel" && G.S.wheel && G.S.wheel.spun;

function campaign(save, runs) {
  for (let r = 0; r < runs; r++) {
    const G = boot(copy(save)), log = [];
    for (let w = 1; w <= G.ctx.SIM.WORLDS.length; w++) {
      for (let n = 1; n <= G.ctx.world(w).levels; n++) {
        if (G.ctx.prog(w).cleared.includes(n)) continue;
        let fails = 0;
        for (;;) {
          G.act("tab", "levels"); G.act("level", `${w}-${n}`);
          if (G.S.screen !== "level") { log.push(`World ${w} Level ${n} could not start`); break; }
          G.drive();
          const ok = cleared(G);
          G.act("camp");
          if (ok) break;
          if (++fails >= 10) { log.push(`World ${w} Level ${n}: failed 10 times in a row`); break; }
        }
        if (fails) log.push(`World ${w} Level ${n}: ${fails} failure${fails === 1 ? "" : "s"} before clearing`);
      }
    }
    console.log(`Run ${r + 1}: ${log.length ? log.join("; ") : "every remaining level cleared on the first try"}. Team at the end: ${G.ctx.teamMons().map(m => `${m.name} ${m.level}`).join(", ")}.`);
  }
}

function trials(save, runs) {
  for (let t = 1; t <= 15; t++) {
    let wins = 0, actions = 0;
    for (let r = 0; r < runs; r++) {
      const G = boot(copy(save));
      if (!G.ctx.trialsOpen()) { console.log("Trials aren't open on this save yet."); return; }
      G.S.trials.best = t - 1;
      G.act("tab", "trials"); G.act("trial", t);
      actions += G.drive();
      if (cleared(G)) wins++;
    }
    console.log(`Trial tier ${t}: cleared ${wins} of ${runs} on the first try, ${Math.round(actions / runs)} actions per run.`);
  }
}

function wboss(save, runs) {
  const fights = [];
  for (let r = 0; r < runs; r++) {
    const G = boot(copy(save));
    let w = 1;
    for (let x = 1; x <= G.ctx.SIM.WORLDS.length; x++) if (G.ctx.worldOpen(x)) w = x;
    G.S.wboss = null;
    G.act("tab", "levels"); G.act("level", `${w}-1`);
    G.S.level.wb = G.S.level.pos + 1;
    G.ctx.wbEncounter([]);
    G.act("wbignore"); G.act("leave"); G.act("leaveyes");
    let n = 0;
    while (G.S.wboss && n < 50) { G.S.wfights.count = 5; G.act("tab", "levels"); G.act("wbfight"); G.drive(); G.act("camp"); n++; }
    fights.push(n);
  }
  fights.sort((a, b) => a - b);
  console.log(`World boss: ${fights.join(", ")} fights to defeat (median ${fights[Math.floor(fights.length / 2)]}).`);
}

function arena(save, runs) {
  const floors = [];
  for (let r = 0; r < runs; r++) {
    const G = boot(copy(save));
    let f = 1;
    for (let c = 11; c <= G.S.arena.best + 1; c += 10) f = c;
    G.act("tab", "arena"); G.act("arenastart", f);
    for (;;) { G.drive(); if (G.S.battle && G.S.battle.over === "arenawin") { G.act("arenanext"); f++; } else break; }
    floors.push(f);
  }
  floors.sort((a, b) => a - b);
  console.log(`Arena: runs ended on floors ${floors.join(", ")}.`);
}

const [file, mode, runsArg] = process.argv.slice(2);
const MODES = { campaign, trials, wboss, arena };
if (!file || !MODES[mode]) { console.log("Usage: node tools/sim.js <file with save code> <campaign|trials|wboss|arena> [runs]"); process.exit(1); }
MODES[mode](readSave(file), Number(runsArg) || 10);
