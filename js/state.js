// Shardkin: Eight Realms — Items, shop, buildings, saving, save codes, new games and achievements.
// Files share one global scope and load in the order listed in index.html.
"use strict";

  // ---------- Player, shop, recipes, buildings, world bosses ----------
  function pNeed(L) { return 60 * L; }
  const UNLOCK_TEXT = { 2: "The Shop and Quests are now open at camp.", 3: "You can now build the Training Yard.", 4: "You can now build the Shard Mine for passive income.",
    5: "You can now build the Expedition Dock.", 6: "You can now build the Hatchery.", 7: "The Arena is now open at camp." };
  // ---------- Item tiers ----------
  // Better items unlock as new worlds open; w is the world that must be open.
  const ITEM_INFO = {
    potion: { name: "Potion", plural: "Potions", w: 1 },
    superpotion: { name: "Super Potion", plural: "Super Potions", w: 3 },
    revive: { name: "Revive Shard", plural: "Revive Shards", w: 4 },
    tonic: { name: "Team Tonic", plural: "Team Tonics", w: 6 },
    orb: { name: "Binding Shard", plural: "Binding Shards", w: 1 },
    gorb: { name: "Greater Binding Shard", plural: "Greater Binding Shards", w: 3 },
    grorb: { name: "Grand Binding Shard", plural: "Grand Binding Shards", w: 5 },
    perfect: { name: "Prism Shard", plural: "Prism Shards", w: 1 },
    fury: { name: "Fury Shard", plural: "Fury Shards", w: 2 },
    ward: { name: "Ward Shard", plural: "Ward Shards", w: 2 },
    die: { name: "Loaded Die", plural: "Loaded Dice", w: 1 }
  };
  function itemOpen(id) { return !ITEM_INFO[id] || worldOpen(ITEM_INFO[id].w); }
  function iname(id, n) { return n === 1 ? ITEM_INFO[id].name : ITEM_INFO[id].plural; }
  function icount(id, n) { return n === 1 ? an(ITEM_INFO[id].name) : `${n} ${ITEM_INFO[id].plural}`; }
  const BIND_MULT = { orb: 1, gorb: 1.5, grorb: 2.25 };
  const SHOP = [
    { id: "potion", price: 40, desc: "Heals half of a monster's health" },
    { id: "superpotion", price: 180, desc: "Fully heals one monster and clears its status" },
    { id: "revive", price: 600, desc: "Brings a fainted team monster back with half its health, even mid-level" },
    { id: "tonic", price: 900, desc: "Heals half the health of every standing monster on your team" },
    { id: "orb", price: 60, desc: "Capture item" },
    { id: "gorb", price: 250, desc: "Capture item with 1.5 times a Binding Shard's chance" },
    { id: "grorb", price: 700, desc: "Capture item with 2.25 times a Binding Shard's chance" },
    { id: "fury", price: 300, desc: "Your monsters deal 50% more damage for the rest of one battle" },
    { id: "ward", price: 300, desc: "Your monsters take a third less damage for the rest of one battle" },
    { id: "die", price: 150, desc: "Choose your roll on the board" },
    { id: "perfect", price: 3000, desc: "100% capture chance" }
  ];
  SHOP.forEach(it => { it.name = ITEM_INFO[it.id].name; });
  const RECIPES = {};
  for (const el of ELEMENTS) {
    RECIPES[el + "Rare"] = { el, name: `Scroll of Synthesis: Rare ${el}`, desc: `Combine two Common or Uncommon ${el} monsters into a random Rare ${el} monster.`, slots: [["Common", "Uncommon"], ["Common", "Uncommon"]], result: "Rare", price: 0 };
    RECIPES[el + "Epic"] = { el, name: `Scroll of Synthesis: Epic ${el}`, desc: `Combine two Rare ${el} monsters into a random Epic ${el} monster.`, slots: [["Rare"], ["Rare"]], result: "Epic", price: 2500 };
    const leg = SP[POOLS[el].Legendary[0]].forms[0];
    RECIPES[el + "Legendary"] = { el, name: `Scroll of Synthesis: Legendary ${el}`, desc: `Combine two Epic ${el} monsters and one Rare ${el} monster into ${leg}, the Legendary ${el} monster.`, slots: [["Epic"], ["Epic"], ["Rare"]], result: "Legendary", price: 6000 };
  }
  const YARD = { unlock: 3, cost: 150, up: [0, 0, 2000, 6000] };
  const MINE = { unlock: 4, cost: [300, 600, 1200, 4000, 10000], rate: [0, 15, 30, 50, 80, 120], capHours: 12, max: 5 };
  const CREST_SWAP = 2000;
  // Training Yard level 1 trains one level per session, level 2 two levels, level 3 three levels in 2 hours.
  function yardLvl() { return S.yard ? (S.yardLvl || 1) : 0; }
  function trainHours() { return yardLvl() >= 3 ? 2 : TRAIN.hours; }
  function trainAmount(m) { let a = 0; for (let i = 0; i < Math.max(1, yardLvl()); i++) a += xpNeed(m.level + i); return a; }
  const TRAIN = { hours: 3, pxp: 150, pxpPerLevel: 30 };
  // Experience-based training grows with the Shardbinder level, since later levels pay far more experience.
  // Each session keeps the requirement it started with.
  function trainPxp() { return Math.max(TRAIN.pxp, TRAIN.pxpPerLevel * S.player.level); }
  function trainNeed(s) { return s.need || TRAIN.pxp; }
  const HOUR = 3600000;
  // World boss health aims for about `fights` fights from your current team (see wbHealth in board.js), never under minHpMult times normal health.
  const WB = { chance: 0.12, minHpMult: 4, levelBonus: 5, levelOverTeam: 3, maxFights: 5, fightEvery: 2 * HOUR, lifetime: 24 * HOUR, fights: 5, fightCal: 1.1 };

  // ---------- Save ----------
  const SAVE_KEY = "shardkin-save-v1";
  // Saves remember which one-time updates they've had (see applyUpdates in progress.js); new games start with all of them.
  const UPDATES = ["endgame1", "comfort1", "sound1", "battle1", "story1"];
  // A copy of the game as it was when you first opened it today, so a bad day can be undone from Settings.
  const DAILY_KEY = "shardkin-daily-backup";
  let S;
  function save() { try { localStorage.setItem(SAVE_KEY, JSON.stringify(S)); } catch (e) { /* saving is optional */ } }
  function load() {
    try {
      const t = localStorage.getItem(SAVE_KEY);
      return t ? upgradeSave(JSON.parse(t)) : null;
    } catch (e) { return null; }
  }
  // Brings any older save up to the current format, or returns null if it isn't a save.
  function upgradeSave(d) {
    if (!d || typeof d !== "object" || !d.mons || !d.items) return null;
    if (d.v === 1) migrate1(d);
    if (d.v === 2) migrate2(d);
    return d.v === 3 ? d : null;
  }

  // ---------- Save codes ----------
  // A save code is the whole game as text: SHARDKIN1. followed by base64 of the saved JSON.
  // Spaces and line breaks are ignored when pasting, so codes survive Notes and email.
  const BACKUP_KEY = "shardkin-before-import";
  let exportCode = "", pendingImport = null;
  function encodeSave() {
    const bytes = new TextEncoder().encode(JSON.stringify(S));
    let bin = "";
    for (let i = 0; i < bytes.length; i += 8192) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
    return "SHARDKIN1." + btoa(bin);
  }
  function decodeSave(text) {
    try {
      const m = String(text || "").replace(/\s+/g, "").match(/SHARDKIN1\.([A-Za-z0-9+/=]+)/);
      if (!m) return null;
      const bin = atob(m[1]);
      const bytes = new Uint8Array(bin.length);
      for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
      return upgradeSave(JSON.parse(new TextDecoder().decode(bytes)));
    } catch (e) { return null; }
  }
  function saveSummary(d) {
    const mons = Object.keys(d.mons).length, lvl = d.player ? d.player.level : 1;
    let far = 1;
    for (let w = WORLDS.length; w >= 1; w--) if (d.prog && d.prog[w] && (d.prog[w].cleared.length || w === 1)) { far = w; break; }
    return `Shardbinder level ${lvl}, ${mons} monster${mons === 1 ? "" : "s"}, ${d.coins} Shard Dust, furthest world ${far}`;
  }
  function hasBackup() { try { return !!localStorage.getItem(BACKUP_KEY); } catch (e) { return false; } }
  // Keeps the game as it was at the first load of each day.
  function dailyBackup() {
    try {
      const today = dayKey(new Date(now())), b = JSON.parse(localStorage.getItem(DAILY_KEY) || "null");
      if (!b || b.day !== today) localStorage.setItem(DAILY_KEY, JSON.stringify({ day: today, at: now(), save: S }));
    } catch (e) { /* backups are best-effort */ }
  }
  // ---------- Installed app and storage ----------
  // An installed (Home Screen) copy of the game isn't cleared by Safari for going unused, and browsers are
  // more willing to keep its storage permanently. storeKept is true, false, or null when the browser can't say.
  let storeKept = null;
  function isStandalone() {
    try { return !!(navigator.standalone || (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches)); } catch (e) { return false; }
  }
  function checkStorage() {
    try { if (navigator.storage && navigator.storage.persisted) navigator.storage.persisted().then(v => { storeKept = !!v; }, () => {}); } catch (e) { /* not supported */ }
  }
  // Asks quietly when installed; from Settings, asks because you chose to (some browsers show a prompt then).
  function requestPersist(userAsked) {
    try {
      if (!navigator.storage || !navigator.storage.persist) { if (userAsked) storeKept = false; return; }
      navigator.storage.persist().then(v => {
        storeKept = !!v;
        if (userAsked && S.screen === "camp" && S.campTab === "save") {
          S.result = v ? "Your browser will keep the game's storage permanently." : "Your browser said no for now. Installing the game as an app usually changes that.";
          render(); document.getElementById("result").focus();
        }
      }, () => {});
    } catch (e) { /* not supported */ }
  }
  function dailySave() {
    try { const b = JSON.parse(localStorage.getItem(DAILY_KEY) || "null"); return b && b.save ? { at: b.at, save: upgradeSave(b.save) } : null; } catch (e) { return null; }
  }
  function migrate1(d) {
    d.v = 2;
    for (const id in d.mons) { const m = d.mons[id]; m.stage = 0; if (SP[m.id].forms.length > 1 && m.level >= EVOLVE_LEVEL) { m.stage = 1; m.name = SP[m.id].forms[1]; } calc(m); m.hp = Math.min(m.hp, m.maxHp); }
    Object.assign(d, { player: { level: 1, xp: 0 }, pxpLife: 0, stats: { caught: Object.keys(d.mons).length - 1, evolved: 0, synth: 0, trained: 0 }, ach: [],
      yard: false, mine: null, training: { mode: "time", session: null }, campTab: "levels", dieChoose: false, synth: null });
    d.items.die = 0; d.items.crests = {}; d.items.scrolls = [];
    d.dex = [...new Set(Object.values(d.mons).map(m => m.id))];
    let px = 0; for (const n of d.cleared) px += (40 + 10 * n) * 2;
    d._pendingPxp = px;
  }
  function migrate2(d) {
    d.v = 3;
    d.prog = { 1: { unlocked: d.unlocked || 1, cleared: d.cleared || [] }, 2: { unlocked: 1, cleared: [] } };
    delete d.unlocked; delete d.cleared;
    d.items.scrolls = d.items.scrolls.map(s => ({ plantRare: "PlantRare", plantEpic: "PlantEpic", plantLegend: "PlantLegendary" }[s] || s));
    for (const id in d.mons) { const m = d.mons[id]; m.status = null; calc(m); m.hp = Math.min(m.hp, m.maxHp); }
    if (d.level) { d.level.w = 1; d.level.wb = null; d.level.shopOpen = false; d.level.encounter = false; }
    if (d.battle) d.battle.enemies.forEach(e => { e.status = null; });
    d.stats.wbKills = 0;
    d.wboss = null; d.wfights = null; d.notices = [];
  }
  function newGame() {
    S = { v: 3, uid: 1, mons: {}, team: [], items: { orb: 5, perfect: 1, potion: 3, die: 0, crests: {}, scrolls: [] }, coins: 0,
      prog: { 1: { unlocked: 1, cleared: [] }, 2: { unlocked: 1, cleared: [] } },
      screen: "camp", level: null, battle: null, wheel: null, confirm: null, sound: true, result: "",
      player: { level: 1, xp: 0 }, pxpLife: 0, dex: [], stats: { caught: 0, evolved: 0, synth: 0, trained: 0, wbKills: 0 }, ach: [],
      yard: false, mine: null, training: { mode: "time", session: null }, campTab: null, dieChoose: false, synth: null,
      wboss: null, wfights: null, notices: [], updates: UPDATES.slice() };
    ensureExtras();
    addMon(makeMon("cindercub", 5), true);
    S.result = PROLOGUE + " Your first companion is Cindercub, a level 5 Epic Fire Shardkin, strong against the Verdant Shard's Plant monsters. Open Levels and choose Level 1 to begin.";
  }
  function addMon(m, toTeam) {
    m.uid = "m" + (S.uid++);
    m.status = null;
    S.mons[m.uid] = m;
    if (!S.dex.includes(m.id)) S.dex.push(m.id);
    if (m.shard && S.shardDex && !S.shardDex.includes(m.id)) S.shardDex.push(m.id);
    if (toTeam && S.team.length < 4) S.team.push(m.uid);
    return m;
  }
  function restoreAll() { for (const id in S.mons) { const m = S.mons[id]; m.hp = m.maxHp; m.status = null; delete m.bt; } }
  function teamMons() { return S.team.map(id => S.mons[id]); }
  function inTraining(uid) { return S.training.session && S.training.session.uid === uid; }
  function prog(w) { if (!S.prog[w]) S.prog[w] = { unlocked: 1, cleared: [] }; return S.prog[w]; }
  function worldCleared(w) { return prog(w).cleared.includes(world(w).levels); }
  function highestOpen() { let h = 1; for (let w = 1; w <= WORLDS.length; w++) if (worldOpen(w)) h = w; return h; }
  function worldOpen(w) { return w === 1 || worldCleared(w - 1); }

  function givePxp(n, msgs) {
    const P = S.player;
    P.xp += n; S.pxpLife += n;
    msgs.push(S.brief ? `Plus ${n} Shardbinder experience.` : `You earned ${n} Shardbinder experience.`);
    while (P.xp >= pNeed(P.level)) {
      P.xp -= pNeed(P.level); P.level++;
      msgs.push(`You reached Shardbinder level ${P.level}!` + (UNLOCK_TEXT[P.level] ? " " + UNLOCK_TEXT[P.level] : "")); sfx("level");
    }
  }

  // ---------- Achievements ----------
  function addCrest(c) { S.items.crests[c] = (S.items.crests[c] || 0) + 1; }
  function giveCrestOf(id, msgs) { const c = crestName(id); addCrest(c); msgs.push(`You received the ${c}.`); const f = crestFits(c); if (f) msgs.push(f); }
  function giveCrest(el, msgs) { giveCrestOf(pickFrom(crestSpecies(el)), msgs); }
  function joinAnd(list) { return list.length < 2 ? list.join("") : `${list.slice(0, -1).join(", ")} and ${list[list.length - 1]}`; }
  // Says which of your monsters a crest fits, if any.
  function crestFits(c) {
    const ready = Object.values(S.mons).filter(m => m.stage === 1 && SP[m.id].forms.length === 3 && crestName(m.id) === c);
    if (ready.length) return `You can use it on ${ready[0].name} right now in Team and base.`;
    const later = Object.values(S.mons).find(m => m.stage === 0 && SP[m.id].forms.length === 3 && crestName(m.id) === c);
    return later ? `It fits ${later.name} once it evolves at level ${EVOLVE_LEVEL}.` : "";
  }
  function readyCrests() { return Object.values(S.mons).filter(m => m.stage === 1 && SP[m.id].forms.length === 3 && (S.items.crests[crestName(m.id)] || 0) > 0); }
  const ACH = [
    { id: "catch1", name: "First Catch", desc: "Capture your first monster.", test: () => S.stats.caught >= 1, reward: "3 Binding Shards", give: () => { S.items.orb += 3; } },
    { id: "clear1", name: "First Steps", desc: "Clear Level 1.", test: () => prog(1).cleared.includes(1), reward: "2 Potions", give: () => { S.items.potion += 2; } },
    { id: "dex5", name: "Growing Collection", desc: "Collect 5 different monsters.", test: () => S.dex.length >= 5, reward: "100 Shard Dust", give: () => { S.coins += 100; } },
    { id: "evolve1", name: "New Form", desc: "Evolve a monster for the first time.", test: () => S.stats.evolved >= 1, reward: "150 Shard Dust", give: () => { S.coins += 150; } },
    { id: "plv5", name: "Rising Shardbinder", desc: "Reach Shardbinder level 5.", test: () => S.player.level >= 5, reward: "2 Loaded Dice", give: () => { S.items.die += 2; } },
    { id: "dex10", name: "Collector", desc: "Collect 10 different monsters.", test: () => S.dex.length >= 10, reward: "300 Shard Dust", give: () => { S.coins += 300; } },
    { id: "world1", name: "Plant World Cleared", desc: "Complete World 1 by clearing its Level 5.", test: () => worldCleared(1),
      reward: "Scroll of Synthesis: Rare Plant, plus a random Plant final-form crest", give: msgs => { if (!S.items.scrolls.includes("PlantRare")) S.items.scrolls.push("PlantRare"); giveCrest("Plant", msgs); } },
    { id: "world2", name: "Water World Cleared", desc: "Complete World 2 by clearing its Level 5.", test: () => worldCleared(2),
      reward: "Scroll of Synthesis: Rare Water, plus a random Water final-form crest", give: msgs => { if (!S.items.scrolls.includes("WaterRare")) S.items.scrolls.push("WaterRare"); giveCrest("Water", msgs); } },
    { id: "synth1", name: "Synthesist", desc: "Synthesize a monster for the first time.", test: () => S.stats.synth >= 1, reward: "200 Shard Dust", give: () => { S.coins += 200; } },
    { id: "train1", name: "Hard Work", desc: "Finish your first training session.", test: () => S.stats.trained >= 1, reward: "100 Shard Dust", give: () => { S.coins += 100; } },
    { id: "wb1", name: "Giant Slayer", desc: "Defeat a world boss.", test: () => S.stats.wbKills >= 1, reward: "2 Loaded Dice and 300 Shard Dust", give: () => { S.items.die += 2; S.coins += 300; } },
    { id: "allplant", name: "Plant Master", desc: "Collect all 15 Plant monsters.", test: () => poolIds("Plant").every(id => S.dex.includes(id)), reward: "a Prism Shard and 500 Shard Dust", give: () => { S.items.perfect += 1; S.coins += 500; } },
    { id: "allwater", name: "Water Master", desc: "Collect all 15 Water monsters.", test: () => poolIds("Water").every(id => S.dex.includes(id)), reward: "a Prism Shard and 500 Shard Dust", give: () => { S.items.perfect += 1; S.coins += 500; } }
  ];
  for (let w = 3; w <= WORLDS.length; w++) {
    const W = WORLDS[w - 1];
    if (W.els.length === 1) {
      const el = W.els[0];
      // The Ember Shard always awakens the starter: World 3 gives the Infernox Crest rather than a random Fire crest.
      const starter = el === "Fire";
      ACH.push({ id: "world" + w, name: `${el} World Cleared`, desc: `Complete World ${w} by clearing its Level ${W.levels}.`, test: () => worldCleared(w),
        reward: `Scroll of Synthesis: Rare ${el}, plus ${starter ? `the ${crestName("cindercub")} for your starter's line` : `a random ${el} final-form crest`}`,
        give: msgs => { if (!S.items.scrolls.includes(el + "Rare")) S.items.scrolls.push(el + "Rare"); if (starter) giveCrestOf("cindercub", msgs); else giveCrest(el, msgs); } });
    } else {
      ACH.push({ id: "world" + w, name: `${W.title} Conquered`, desc: `Complete World ${w} by clearing its Level ${W.levels}.`, test: () => worldCleared(w),
        reward: "2000 Shard Dust, a Prism Shard and a random final-form crest from either element", give: msgs => { S.coins += 2000; S.items.perfect++; giveCrest(worldEl(w), msgs); } });
    }
  }
  for (const el of ELEMENTS.slice(2)) {
    ACH.push({ id: "all" + el.toLowerCase(), name: `${el} Master`, desc: `Collect all 15 ${el} monsters.`, test: () => poolIds(el).every(id => S.dex.includes(id)), reward: "a Prism Shard and 500 Shard Dust", give: () => { S.items.perfect += 1; S.coins += 500; } });
  }
  ACH.push({ id: "hatch1", name: "New Life", desc: "Hatch your first egg.", test: () => (S.counts.hatches || 0) >= 1, reward: "300 Shard Dust", give: () => { S.coins += 300; } });
  ACH.push({ id: "exp10", name: "Explorer", desc: "Finish 10 expeditions.", test: () => (S.counts.exps || 0) >= 10, reward: "500 Shard Dust", give: () => { S.coins += 500; } });
  ACH.push({ id: "arena10", name: "Arena Contender", desc: "Reach Arena floor 10.", test: () => S.arena.best >= 10, reward: "2 Loaded Dice", give: () => { S.items.die += 2; } });
  ACH.push({ id: "arena50", name: "Arena Legend", desc: "Reach Arena floor 50.", test: () => S.arena.best >= 50, reward: "3 Prism Shards", give: () => { S.items.perfect += 3; } });
  ACH.push({ id: "shard1", name: "Glimmer", desc: "Catch a Shardborn monster.", test: () => S.shardDex.length >= 1, reward: "a Prism Shard and 1000 Shard Dust", give: () => { S.items.perfect++; S.coins += 1000; } });
  ACH.push({ id: "shard10", name: "Crystal Collector", desc: "Catch 10 different Shardborn monsters.", test: () => S.shardDex.length >= 10, reward: "5 Prism Shards", give: () => { S.items.perfect += 5; } });
  ACH.push({ id: "forge10", name: "Shardsmith", desc: "Forge or infuse 10 times at the Shard Forge.", test: () => (S.counts.forged || 0) >= 10, reward: "300 Shard Dust and 2 Loaded Dice", give: () => { S.coins += 300; S.items.die += 2; } });
  ACH.push({ id: "heart", name: "Heartcrystal Restored", desc: "Clear all eight element worlds.", test: () => [1, 2, 3, 4, 5, 6, 7, 8].every(worldCleared), reward: "5000 Shard Dust and 3 Prism Shards", give: msgs => { S.coins += 5000; S.items.perfect += 3; msgs.push(EPILOGUE); } });
  ACH.push({ id: "all120", name: "Shardkin Master", desc: "Collect all 120 monsters.", test: () => ELEMENTS.every(el => poolIds(el).every(id => S.dex.includes(id))), reward: "5 Prism Shards and 10000 Shard Dust", give: () => { S.items.perfect += 5; S.coins += 10000; } });
  const trialBest = () => (S.trials && S.trials.best) || 0;
  ACH.push({ id: "trial1", name: "Trial Initiate", desc: "Clear Trial tier 1.", test: () => trialBest() >= 1, reward: "3 Prism Shards", give: () => { S.items.perfect += 3; } });
  ACH.push({ id: "trial10", name: "Trial Champion", desc: "Clear Trial tier 10.", test: () => trialBest() >= 10, reward: "a Crest Choice and 10000 Shard Dust", give: () => { S.items.crestChoice++; S.coins += 10000; } });
  ACH.push({ id: "trial25", name: "Trial Legend", desc: "Clear Trial tier 25.", test: () => trialBest() >= 25, reward: "2 Crest Choices and 25000 Shard Dust", give: () => { S.items.crestChoice += 2; S.coins += 25000; } });
  function checkAch(msgs) {
    for (let pass = 0; pass < 3; pass++) {
      let got = false;
      for (const a of ACH) {
        if (S.ach.includes(a.id) || !a.test()) continue;
        S.ach.push(a.id); got = true;
        giveGems(GEM.achievement, msgs, "You also earned");
        msgs.push(`Achievement unlocked: ${a.name}. Reward: ${a.reward}.`); sfx("win");
        a.give(msgs);
        givePxp(20, msgs);
      }
      if (!got) break;
    }
  }
