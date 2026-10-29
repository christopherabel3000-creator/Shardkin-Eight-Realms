// Shardkin: Eight Realms — Experience, evolution, currencies, shards, expeditions, hatchery, quests and the Arena.
// Files share one global scope and load in the order listed in index.html.
"use strict";

  // ---------- Evolution and experience ----------
  function evolve(m, msgs) {
    const forms = SP[m.id].forms, old = m.name, oldMax = m.maxHp;
    m.stage++; m.name = formName(m); calc(m);
    if (m.hp > 0) m.hp += m.maxHp - oldMax;
    S.stats.evolved++;
    msgs.push(`${old} evolved into ${speciesName(m)}!`); sfx("evolve");
  }
  function levelCheck(p, amount, msgs) {
    p.xp += amount;
    while (p.xp >= xpNeed(p.level)) {
      p.xp -= xpNeed(p.level);
      const oldMax = p.maxHp;
      p.level++; calc(p);
      if (p.hp > 0) p.hp += p.maxHp - oldMax;
      msgs.push(`${p.name} reached level ${p.level}!`); sfx("level");
      const learned = skillsOf(p).find(s => s.unlock === p.level);
      if (learned) msgs.push(`${p.name} learned ${learned.name}.`);
      if (p.stage === 0 && SP[p.id].forms.length > 1 && p.level >= EVOLVE_LEVEL) evolve(p, msgs);
    }
  }
  // Every standing monster on the team gets the experience, even ones that didn't fight.
  // everyone = true (reward wheel, world boss) includes fainted monsters too.
  // Rewards shrink once a monster has outgrown a level: full up to 3 levels above its monsters,
  // then 10% less for each extra level, never below 10%. Each monster is judged on its own level.
  function outgrowMult(myLevel, foeLevel) { const d = myLevel - foeLevel; return d <= 3 ? 1 : Math.max(0.1, 1 - 0.1 * (d - 3)); }
  function teamTop() { return Math.max(1, ...teamMons().map(m => m.level)); }
  // The monster levels on the current board: a world level's wild range, or a Trial tier's.
  function levelRange() { const L = S.level; return L.trial ? trialRange(L.trial) : wildRange(L.w, L.n); }
  function levelRef() { return S.level ? levelRange()[1] : 1; }
  function teamXp(amount, msgs, everyone, foeLevel) {
    const team = teamMons().filter(m => everyone || m.hp > 0);
    if (!team.length || amount <= 0) return;
    const parts = team.map(m => { const k = foeLevel ? outgrowMult(m.level, foeLevel) : 1; return [m, Math.max(1, Math.round(amount * k)), k < 1]; });
    const who = everyone ? "Each monster on your team" : "Each standing monster on your team";
    if (parts.every(x => x[1] === parts[0][1] && x[2] === parts[0][2])) {
      const note = parts[0][2] ? (S.brief ? ", outgrown" : " (reduced: outgrown this level)") : "";
      if (S.brief) msgs.push(`${team.length > 1 ? "Team" : team[0].name}: ${parts[0][1]} experience${note}.`);
      else msgs.push(team.length > 1 ? `${who} gained ${parts[0][1]} experience${note}.` : `${team[0].name} gained ${parts[0][1]} experience${note}.`);
    } else msgs.push("Experience: " + parts.map(([m, a, cut]) => `${m.name} ${a}${cut ? " (outgrown)" : ""}`).join(", ") + ".");
    for (const [m, a] of parts) levelCheck(m, a, msgs);
  }

  // ---------- Activity counters (quests read these) ----------
  function ensureExtras() {
    S.counts = S.counts || { wins: 0, caps: 0, capEl: {}, levels: 0, spins: 0, chests: 0, synths: 0, exps: 0, hatches: 0, floors: 0, wbfights: 0 };
    S.quests = S.quests || { day: "", week: "", daily: [], weekly: [] };
    S.arena = S.arena || { best: 0, claimed: [] };
    S.items.eggs = S.items.eggs || {};
    if (S.exped === undefined) S.exped = null;
    if (S.hatch === undefined) S.hatch = null;
    S.expDur = S.expDur || 1;
    S.items.shards = S.items.shards || {};
    S.shardDex = S.shardDex || [];
    if (S.forge === undefined) S.forge = false;
    if (S.gems === undefined) {
      // Saves from before Coins existed get credit for milestones already reached.
      let g = (S.ach || []).length * GEM.achievement + (S.stats && S.stats.wbKills || 0) * GEM.worldBoss + (S.shardDex || []).length * GEM.shardborn;
      for (let w = 1; w <= WORLDS.length; w++) if (S.prog && S.prog[w] && S.prog[w].cleared.includes(world(w).levels)) g += worldCoins(w);
      S.gems = g; S.gemsBackfill = g;
    }
    S.items.mythic = S.items.mythic || {};
    if (S.lure === undefined) S.lure = false;
    for (const id of Object.keys(ITEM_INFO)) if (typeof S.items[id] !== "number") S.items[id] = 0;
    if (S.yard && !S.yardLvl) S.yardLvl = 1;
    S.trials = S.trials || { best: 0, world: null };
    if (typeof S.items.crestChoice !== "number") S.items.crestChoice = 0;
    S.updates = S.updates || [];
    S.teams = S.teams || [null, null, null, null];
    if (S.brief === undefined) S.brief = false;
  }
  // One-time changes for saves made before an update. Runs on load and after importing a save code.
  const UPDATE_STEPS = {
    endgame1(msgs) {
      // Clearing the Ember Shard now always gives the Infernox Crest; saves that missed it get one.
      const ix = crestName("cindercub");
      if (S.ach.includes("world3") && !(S.items.crests[ix] > 0) && !Object.values(S.mons).some(m => m.id === "cindercub" && m.stage === 2)) {
        addCrest(ix);
        msgs.push(`Update: clearing the Ember Shard now always gives the ${ix}, so you've received one.`);
      }
      const open = [...(trialsOpen() ? ["Trials under Adventure"] : []), "Collection under Monsters", "a Bag under Camp"];
      msgs.push(`New at camp: ${joinAnd(open)}.${trialsOpen() ? " The Shard Forge can now fuse eggs and crests." : ""}`);
    },
    comfort1(msgs) {
      // Experienced players get the shorter messages straight away.
      if (S.player.level >= 10) S.brief = true;
      msgs.push(`New: ${S.brief ? "Brief messages are on, and you can turn them off" : "you can turn on Brief messages"} in Settings, where you can also install the game as an app. Team and base now has Manage buttons for nicknames and favorites, saved teams, Suggest a team and Release extras.`);
    },
    sound1(msgs) {
      msgs.push("New: every species has its own cry when it enters battle. In the Collection, caught monsters have descriptions and play their cry. Health tones are in Settings.");
    }
  };
  function applyUpdates(msgs) {
    for (const id of UPDATES) {
      if (S.updates.includes(id)) continue;
      S.updates.push(id);
      UPDATE_STEPS[id](msgs);
    }
  }
  // ---------- Premium Coins ----------
  // Coins are scarce: earned only from first-time milestones, never from battles or replays.
  const GEM = { achievement: 5, weeklyQuest: 5, worldBoss: 10, arena10: 10, shardborn: 5 };
  function worldCoins(w) { return w <= 8 ? 5 + 5 * w : 75; }
  function giveGems(n, msgs, why) { if (n <= 0) return; S.gems = (S.gems || 0) + n; if (msgs) msgs.push(`${why || "You earned"} ${n} Coin${n === 1 ? "" : "s"}.`); sfx("coin"); }
  const PREMIUM = { mythic: 100, lure: 25, hurry: 5, prisms: 40, crest: 200 };

  // ---------- Shards ----------
  const SHARDBORN = { chance: 1 / 500, stormMult: 10, hatch: 1 / 250, synth: 1 / 100 };
  function shardRoll(mult) { return Math.random() < SHARDBORN.chance * (mult || 1); }
  function addShards(el, n, msgs, why) {
    if (n <= 0) return;
    S.items.shards[el] = (S.items.shards[el] || 0) + n;
    if (msgs) msgs.push(S.brief ? `Plus ${n} ${el} Shard${n === 1 ? "" : "s"}.` : `${why || "You gained"} ${n} ${el} Shard${n === 1 ? "" : "s"}.`);
  }
  function shardCount() { return Object.values(S.items.shards).reduce((a, b) => a + b, 0); }
  const SHARD_DROP = { Common: 1, Uncommon: 1, Rare: 3, Epic: 5, Legendary: 8 };
  const FORGE = { unlock: 3, cost: 250 };
  const FORGE_ITEMS = [
    { id: "potion", name: "a Potion", cost: 2, desc: "Heals half of a monster's health" },
    { id: "superpotion", name: "a Super Potion", cost: 6, desc: "Fully heals one monster" },
    { id: "gorb", name: "a Greater Binding Shard", cost: 8, desc: "Capture item, 1.5 times the chance" },
    { id: "fury", name: "a Fury Shard", cost: 10, desc: "50% more damage for one battle" },
    { id: "ward", name: "a Ward Shard", cost: 10, desc: "A third less damage taken for one battle" },
    { id: "revive", name: "a Revive Shard", cost: 15, desc: "Revives a fainted team monster" },
    { id: "orb", name: "a Binding Shard", cost: 3, desc: "Capture item" },
    { id: "die", name: "a Loaded Die", cost: 8, desc: "Choose your roll on the board" },
    { id: "egg", name: "an egg", cost: 25, desc: "An egg of this element, ready for the Hatchery" },
    { id: "perfect", name: "a Prism Shard", cost: 120, desc: "100% capture chance" }
  ];
  function infuseCost(m) { return ((m.infuse || 0) + 1) * 10; }
  function bump(key, n) { S.counts[key] = (S.counts[key] || 0) + (n || 1); }
  function addEgg(el, msgs, why) {
    S.items.eggs[el] = (S.items.eggs[el] || 0) + 1;
    msgs.push(S.brief ? `Plus ${an(el)} egg!` : `${why || "You found"} ${an(el)} egg!` + (S.hatch ? " Hatch it at the Hatchery." : " Build the Hatchery to hatch it."));
    sfx("chest");
  }
  function openElements() { return ELEMENTS.filter(el => worldOpen(elementWorld(el))); }
  function eggCount() { return Object.values(S.items.eggs).reduce((a, b) => a + b, 0); }

  // ---------- Expeditions ----------
  const DOCK = { unlock: 5, cost: 400, slots: 3, bigSlots: 5, upgrade: 4000, hours: [1, 4, 8] };
  function dockSlots() { return S.exped && S.exped.big ? DOCK.bigSlots : DOCK.slots; }
  const RARITY_COIN = { Common: 1, Uncommon: 1.2, Rare: 1.5, Epic: 2, Legendary: 2.5 };
  function onExped(uid) { return !!(S.exped && S.exped.list.some(x => x.uid === uid)); }
  function expLeft(x) { return x.start + x.hours * HOUR - now(); }
  function expCollect(i) {
    const x = S.exped.list[i], m = S.mons[x.uid], msgs = [];
    S.exped.list.splice(i, 1);
    const coins = Math.round(x.hours * (10 + m.level) * RARITY_COIN[m.rarity]);
    S.coins += coins; sfx("coin");
    msgs.push(`${m.name} returned from a ${x.hours}-hour expedition with ${coins} Shard Dust.`);
    let pot = 0, orb = 0, die = 0;
    for (let h = 0; h < x.hours; h++) { if (Math.random() < 0.1) pot++; if (Math.random() < 0.08) orb++; if (Math.random() < 0.03) die++; }
    if (pot) { S.items.potion += pot; msgs.push(`It also brought back ${pot} Potion${pot > 1 ? "s" : ""}.`); }
    if (orb) { S.items.orb += orb; msgs.push(`It found ${orb} Binding Shard${orb > 1 ? "s" : ""}.`); }
    if (die) { S.items.die += die; msgs.push(`It found ${die} Loaded Di${die > 1 ? "ce" : "e"}!`); }
    if (x.hours >= 8 && Math.random() < 0.15) addEgg(m.el, msgs, `${m.name} also found`);
    let sh = 0; for (let h = 0; h < x.hours; h++) if (Math.random() < 0.5) sh++;
    addShards(m.el, sh, msgs, "It dug up");
    const amt = Math.ceil(xpNeed(m.level) * 0.05 * x.hours);
    msgs.push(`${m.name} gained ${amt} experience.`);
    levelCheck(m, amt, msgs);
    bump("exps");
    return msgs;
  }

  // ---------- Hatchery ----------
  const HATCHERY = { unlock: 6, cost: 500, upgrade: 1000, hours: 6, fastHours: 4, fastCost: 3000, slot3: 6000 };
  function hatchHours() { return S.hatch && S.hatch.fast ? HATCHERY.fastHours : HATCHERY.hours; }
  const HATCH_WEIGHT = [["Common", 50], ["Uncommon", 35], ["Rare", 12], ["Epic", 2.5], ["Legendary", 0.5]];
  function hatchLeft(x) { return x.start + hatchHours() * HOUR - now(); }
  // Fills every free incubator: Mythic eggs first, then your most plentiful eggs.
  function fillPlan() {
    const myth = { ...S.items.mythic }, eggs = { ...S.items.eggs }, plan = [];
    const most = pile => Object.keys(pile).filter(e => pile[e] > 0).sort((a, b) => pile[b] - pile[a] || ELEMENTS.indexOf(a) - ELEMENTS.indexOf(b))[0];
    for (let i = S.hatch.incub.length; i < S.hatch.slots; i++) {
      const m = most(myth), e = m ? null : most(eggs);
      if (m) { myth[m]--; plan.push({ el: m, mythic: true }); }
      else if (e) { eggs[e]--; plan.push({ el: e, mythic: false }); }
      else break;
    }
    return plan;
  }
  function eggListText(list) {
    const c = {};
    for (const p of list) { const k = `${p.mythic ? "Mythic " : ""}${p.el}`; c[k] = (c[k] || 0) + 1; }
    return joinAnd(Object.entries(c).map(([k, n]) => `${n === 1 ? an(k) : `${n} ${k}`} egg${n === 1 ? "" : "s"}`));
  }
  function fillIncubators() {
    const plan = fillPlan();
    if (!plan.length) return null;
    for (const p of plan) {
      if (p.mythic) S.items.mythic[p.el]--; else S.items.eggs[p.el]--;
      S.hatch.incub.push({ el: p.el, start: now(), mythic: p.mythic || undefined });
    }
    return [`You placed ${eggListText(plan)} in the incubators. They hatch in ${hatchHours()} hours.`];
  }
  function hatchAllReady() {
    const msgs = [];
    for (let i = S.hatch.incub.length - 1; i >= 0; i--) if (hatchLeft(S.hatch.incub[i]) <= 0) msgs.unshift(...hatchEgg(i));
    return msgs.length ? msgs : null;
  }
  function hatchEgg(i) {
    const x = S.hatch.incub[i];
    S.hatch.incub.splice(i, 1);
    const tier = x.mythic ? (Math.random() < 0.2 ? "Legendary" : "Epic") : pickWeighted(HATCH_WEIGHT), id = pickFrom(POOLS[x.el][tier]);
    const fresh = !S.dex.includes(id);
    // Eggs hatch near your team's level so they stay useful: Mythic eggs at your team's average level, others 10 below it,
    // and never below the starting level of that element's world.
    const avg = Math.round(teamMons().reduce((t, m) => t + m.level, 0) / Math.max(1, S.team.length));
    const lvl = Math.max(wildRange(elementWorld(x.el), 1)[0], x.mythic ? avg : avg - 10);
    const m = addMon(makeMon(id, lvl, Math.random() < SHARDBORN.hatch), false);
    if (m.shard) sfx("shardborn");
    bump("hatches"); sfx("evolve");
    return [`The ${x.mythic ? "Mythic " : ""}${x.el} egg hatched into ${m.name}, ${an(m.rarity)} ${m.el} monster at level ${m.level}${fresh ? ", new to your collection" : ""}! It's in your base.`];
  }

  // ---------- Quests ----------
  function dayKey(d) { return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; }
  function weekKey() { const d = new Date(now()); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return dayKey(d); }
  function counterVal(q) { return q.key === "capEl" ? (S.counts.capEl[q.el] || 0) : (S.counts[q.key] || 0); }
  function questTemplates(weekly) {
    const els = openElements(), el = pickFrom(els);
    const k = weekly ? 1 : 0;
    const t = [
      { key: "wins", n: [5, 40][k], text: n => `Win ${n} battles` },
      { key: "caps", n: [3, 15][k], text: n => `Capture ${n} monsters` },
      { key: "capEl", el, n: [2, 8][k], text: n => `Capture ${n} ${el} monsters` },
      { key: "levels", n: [2, 12][k], text: n => `Clear ${n} levels` },
      { key: "chests", n: [3, 15][k], text: n => `Open ${n} treasure chests` },
      { key: "spins", n: [2, 10][k], text: n => `Spin the reward wheel ${n} times` }
    ];
    if (S.exped) t.push({ key: "exps", n: [1, 6][k], text: n => `Finish ${n} expedition${n > 1 ? "s" : ""}` });
    if (S.hatch) t.push({ key: "hatches", n: [1, 3][k], text: n => `Hatch ${n} egg${n > 1 ? "s" : ""}` });
    if (S.player.level >= ARENA.unlock) t.push({ key: "floors", n: [3, 20][k], text: n => `Clear ${n} Arena floors` });
    if (S.synth !== undefined && S.items.scrolls.length) t.push({ key: "synths", n: [1, 3][k], text: n => `Synthesize ${n} monster${n > 1 ? "s" : ""}` });
    return t;
  }
  function makeQuests(weekly) {
    const pool = questTemplates(weekly).sort(() => Math.random() - 0.5).slice(0, 3);
    return pool.map(q => ({ key: q.key, el: q.el, n: q.n, text: q.text(q.n), base: 0, done: false, claimed: false, reward: questReward(weekly) })).map(q => { q.base = counterVal(q); return q; });
  }
  function questReward(weekly) {
    const L = S.player.level;
    if (!weekly) return pickFrom([{ coins: 100 + 20 * L, potion: 2 }, { coins: 100 + 20 * L, orb: 3 }]);
    return pickFrom([{ coins: 500 + 50 * L, perfect: 1 }, { coins: 500 + 50 * L, die: 2 }, { coins: 500 + 50 * L, egg: 1 }]);
  }
  function rewardText(r) {
    const p = [`${r.coins} Shard Dust`];
    if (r.potion) p.push(`${r.potion} Potions`); if (r.orb) p.push(`${r.orb} Binding Shards`); if (r.perfect) p.push("a Prism Shard");
    if (r.die) p.push(`${r.die} Loaded Dice`); if (r.egg) p.push("a random egg");
    return p.join(", ");
  }
  function ensureQuests() {
    if (S.player.level < 2) return;
    const d = dayKey(new Date(now())), w = weekKey();
    if (S.quests.day !== d) { S.quests.day = d; S.quests.daily = makeQuests(false); }
    if (S.quests.week !== w) { S.quests.week = w; S.quests.weekly = makeQuests(true); }
  }
  function questProgress(q) { return Math.min(q.n, counterVal(q) - q.base); }
  function claimQuest(kind, i) {
    const q = S.quests[kind][i];
    if (!q || q.claimed || questProgress(q) < q.n) return null;
    q.claimed = true;
    const r = q.reward, msgs = [`Quest complete: ${q.text}. You received ${rewardText(r)}.`];
    S.coins += r.coins; S.items.potion += r.potion || 0; S.items.orb += r.orb || 0; S.items.perfect += r.perfect || 0; S.items.die += r.die || 0;
    if (r.egg) addEgg(pickFrom(openElements()), msgs, "And");
    givePxp(kind === "weekly" ? 60 : 15, msgs);
    if (kind === "weekly") giveGems(GEM.weeklyQuest, msgs, "You also earned");
    sfx("win");
    return msgs;
  }

  // ---------- Arena tower ----------
  const ARENA = { unlock: 7 };
  const RIVALS = ["Rival Tamsin", "Rival Corvo", "Rival Juniper", "Rival Hale", "Rival Ondine", "Rival Bastian", "Rival Wren", "Rival Kito", "Rival Marisol", "Rival Ezra"];
  function arenaTeam(floor) {
    const size = floor % 10 === 0 ? 4 : floor >= 10 ? 3 : 2;
    const tiers = floor >= 30 ? [["Uncommon", 40], ["Rare", 40], ["Epic", 20]] : floor >= 10 ? [["Common", 30], ["Uncommon", 50], ["Rare", 20]] : [["Common", 60], ["Uncommon", 40]];
    const out = [];
    for (let i = 0; i < size; i++) out.push(makeMon(pickFrom(POOLS[pickFrom(ELEMENTS)][pickWeighted(tiers)]), 4 + 2 * floor));
    return out;
  }
  function arenaFloor(floor, fresh) {
    if (fresh) { restoreAll(); S.level = null; }
    for (const m of teamMons()) m.status = null;
    const alive = teamMons().find(m => m.hp > 0);
    S.battle = { boss: true, arena: true, floor, rival: pickFrom(RIVALS), enemies: arenaTeam(floor), active: alive.uid, forced: false, over: null, log: [] };
    S.screen = "battle";
    const B = S.battle, e = foe();
    sfx(floor % 10 === 0 ? "boss" : "ambush"); crySfx(e, false);
    if (S.brief) return [`Arena floor ${floor}${floor % 10 === 0 ? ", champion" : ""}: ${B.rival}, ${B.enemies.length} monsters. First: ${e.name}, ${e.rarity} ${e.el}, level ${e.level}.`];
    return [`Arena floor ${floor}${floor % 10 === 0 ? ", a champion floor" : ""}. ${B.rival} sends out ${e.name}, ${an(e.rarity)} ${e.el} monster at level ${e.level}. They have ${B.enemies.length} monsters.`, `Your ${you().name} is ready.`];
  }
  function arenaWin(msgs) {
    const B = S.battle, f = B.floor;
    const coins = 15 * f;
    S.coins += coins; bump("floors"); sfx("win");
    addShards(pickFrom(ELEMENTS), 1 + Math.floor(f / 10), msgs, "You picked up");
    msgs.push(`You beat ${B.rival} and cleared Arena floor ${f}! You earned ${coins} Shard Dust.`);
    if (f > S.arena.best) { S.arena.best = f; msgs.push(`New best floor: ${f}.`); }
    if (!S.arena.claimed.includes(f) && f % 5 === 0) {
      S.arena.claimed.push(f);
      if (f % 25 === 0) { msgs.push("Milestone reward:"); giveCrest(pickFrom(ELEMENTS), msgs); }
      if (f % 10 === 0) { S.items.perfect++; msgs.push(`Milestone reward for floor ${f}: a Prism Shard.`); addEgg(pickFrom(openElements()), msgs, "And"); giveGems(GEM.arena10, msgs, "Plus"); }
      else { S.items.die++; msgs.push(`Milestone reward for floor ${f}: a Loaded Die.`); }
    }
    B.over = "arenawin";
  }

  // ---------- Base management ----------
  // Sorting and filtering the base list, and releasing monsters you don't need.
  // Released monsters stay counted in the collection, which tracks species caught, not monsters kept.
  const BASE_SORT = { newest: "Newest first", level: "Highest level first", rarity: "Rarest first", element: "By element", name: "By name" };
  const RARITY_RANK = { Common: 0, Uncommon: 1, Rare: 2, Epic: 3, Legendary: 4 };
  function baseSort() { return BASE_SORT[S.baseSort] ? S.baseSort : "newest"; }
  function baseFilter() { return S.baseFilter || "all"; }
  function BASE_FILTER_NAME(f) { return f === "all" ? "All" : f === "dupes" ? "Duplicates" : f === "shardborn" ? "Shardborn" : f === "favs" ? "Favorites" : f; }
  function baseMons() { return Object.values(S.mons).filter(m => !S.team.includes(m.uid)); }
  function uidNum(m) { return Number(String(m.uid).slice(1)) || 0; }
  function baseMatching(f) {
    const base = baseMons();
    if (f === "all") return base;
    if (f === "shardborn") return base.filter(m => m.shard);
    if (f === "favs") return base.filter(m => m.fav);
    if (f === "dupes") {
      const n = {};
      for (const m of Object.values(S.mons)) n[m.id] = (n[m.id] || 0) + 1;
      return base.filter(m => n[m.id] > 1);
    }
    return base.filter(m => m.el === f);
  }
  // All, then each element you have in your base, then Favorites, Duplicates and Shardborn when you have any.
  function baseFilters() {
    const f = ["all", ...ELEMENTS.filter(el => baseMatching(el).length), ...["favs", "dupes", "shardborn"].filter(x => baseMatching(x).length)];
    if (!f.includes(baseFilter())) f.push(baseFilter());
    return f;
  }
  function baseShown() {
    const by = {
      newest: (a, b) => uidNum(b) - uidNum(a),
      level: (a, b) => b.level - a.level || a.name.localeCompare(b.name),
      rarity: (a, b) => RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity] || b.level - a.level,
      element: (a, b) => ELEMENTS.indexOf(a.el) - ELEMENTS.indexOf(b.el) || RARITY_RANK[b.rarity] - RARITY_RANK[a.rarity] || b.level - a.level,
      name: (a, b) => a.name.localeCompare(b.name) || b.level - a.level
    }[baseSort()];
    return baseMatching(baseFilter()).sort(by);
  }
  // Releasing gives back elemental shards like a defeat would, plus a little Shard Dust.
  function releaseValue(m) {
    return { dust: Math.round(2 * m.level * RARITY_COIN[m.rarity]), shards: SHARD_DROP[m.rarity] * (m.shard ? 3 : 1) };
  }
  function releaseText(m) { const v = releaseValue(m); return `Gives ${v.dust} Shard Dust and ${v.shards} ${m.el} Shard${v.shards === 1 ? "" : "s"}`; }
  function releaseWarn(m) {
    const v = releaseValue(m), same = Object.values(S.mons).filter(x => x.id === m.id).length, w = [];
    w.push(`You'll get ${v.dust} Shard Dust and ${v.shards} ${m.el} Shard${v.shards === 1 ? "" : "s"}. It stays counted in your collection.`);
    if (same === 1) w.push("It's the only one of its kind you own.");
    if (m.shard) w.push("It's Shardborn.");
    if (["Epic", "Legendary"].includes(m.rarity)) w.push(`It's ${an(m.rarity)} monster.`);
    if (m.infuse) w.push(`Its ${m.infuse} infusion${m.infuse === 1 ? "" : "s"} will be lost.`);
    w.push("This can't be undone.");
    return w.join(" ");
  }
  // Favorites are protected: they can't be released, sent away or used up in synthesis until you unfavorite them.
  function canRelease(m) { return !!m && !m.fav && !S.team.includes(m.uid) && !inTraining(m.uid) && !onExped(m.uid); }
  // Removes a monster from the game and from everything that points at it.
  function dropMon(uid) {
    delete S.mons[uid];
    S.team = S.team.filter(x => x !== uid);
    if (S.synth) S.synth.picks = S.synth.picks.filter(x => x !== uid);
    S.teams = S.teams.map(t => (t ? t.filter(x => x !== uid) : t)).map(t => (t && t.length ? t : null));
    if (S.manageId === uid) S.manageId = null;
  }
  function doRelease(uid) {
    const m = S.mons[uid];
    if (!canRelease(m)) return [`That monster can't be released right now.`];
    const v = releaseValue(m);
    dropMon(uid);
    S.coins += v.dust; addShards(m.el, v.shards); bump("released");
    return [`You released ${m.name}. You got ${v.dust} Shard Dust and ${v.shards} ${m.el} Shard${v.shards === 1 ? "" : "s"}. ${baseMons().length} monster${baseMons().length === 1 ? "" : "s"} left in your base.`];
  }
  // Release extras: spare Commons and Uncommons. Keeps your best of each species, and anything you've
  // favorited, named, infused or charmed, Shardborn, and monsters on your team, training or away.
  // Rares and rarer are never included, since they're synthesis ingredients for the monsters you're missing.
  function extrasPlan() {
    const spare = m => canRelease(m) && !m.nick && !m.shard && !m.infuse && !m.charm && (m.rarity === "Common" || m.rarity === "Uncommon");
    const by = {};
    for (const m of Object.values(S.mons)) (by[m.id] = by[m.id] || []).push(m);
    const out = [];
    for (const list of Object.values(by)) {
      list.sort((a, b) => b.level - a.level || b.xp - a.xp);
      for (const m of list.slice(1)) if (spare(m)) out.push(m);
    }
    return out.sort((a, b) => ELEMENTS.indexOf(a.el) - ELEMENTS.indexOf(b.el) || a.name.localeCompare(b.name) || b.level - a.level);
  }
  function extrasValue(list) {
    const dust = list.reduce((a, m) => a + releaseValue(m).dust, 0), shards = list.reduce((a, m) => a + releaseValue(m).shards, 0);
    return { dust, shards };
  }
  function releaseExtras() {
    const list = extrasPlan();
    if (!list.length) return ["You have no extras to release."];
    const v = extrasValue(list), byEl = {};
    for (const m of list) { const r = releaseValue(m); dropMon(m.uid); S.coins += r.dust; addShards(m.el, r.shards); byEl[m.el] = (byEl[m.el] || 0) + r.shards; bump("released"); }
    return [`You released ${list.length} extra monster${list.length === 1 ? "" : "s"} and got ${fmt(v.dust)} Shard Dust and ${joinAnd(Object.entries(byEl).map(([el, n]) => `${n} ${el} Shard${n === 1 ? "" : "s"}`))}. ${baseMons().length} monsters left in your base.`];
  }

  // ---------- Saved teams ----------
  // Four slots. Monsters that are away on an expedition, or no longer yours, are skipped when a team is used.
  function savedTeam(i) { return (S.teams[i] || []).filter(uid => S.mons[uid]); }
  // Names, with levels added when two share a name so they can be told apart.
  function teamNames(uids) {
    const names = uids.map(uid => S.mons[uid].name);
    return joinAnd(uids.map((uid, i) => (names.indexOf(names[i]) !== names.lastIndexOf(names[i]) ? `${names[i]} (level ${S.mons[uid].level})` : names[i])));
  }
  function useTeam(uids, msgs) {
    const ok = uids.filter(uid => S.mons[uid] && !onExped(uid)).slice(0, 4), away = uids.filter(uid => S.mons[uid] && onExped(uid));
    if (!ok.length) return false;
    S.team = ok;
    msgs.push(`Your team is now ${teamNames(ok)}, with ${S.mons[ok[0]].name} leading.${away.length ? ` ${teamNames(away)} ${away.length === 1 ? "is" : "are"} away on an expedition.` : ""}`);
    return true;
  }

  // ---------- Suggest a team ----------
  // Pits every monster you could use against the world's Uncommon and Rare monsters at the level you'd meet them:
  // how many of their hits it can take, divided by how many of its hits they can take. The best four make the team.
  function avgOf(list) { return list.reduce((a, b) => a + b, 0) / Math.max(1, list.length); }
  function bestHit(a, d) { return Math.max(1, ...unlocked(a).map(s => estDmg(a, d, s) * s.acc / 100)); }
  function suggestScore(m, foes) {
    return avgOf(foes.map(f => (m.maxHp / bestHit(f, m)) / (f.maxHp / bestHit(m, f))));
  }
  function suggestTeam(els, level) {
    const foes = els.flatMap(el => [...POOLS[el].Uncommon, ...POOLS[el].Rare]).map(id => makeMon(id, level));
    return Object.values(S.mons).filter(m => !onExped(m.uid)).map(m => [m, suggestScore(m, foes)]).sort((a, b) => b[1] - a[1]).slice(0, 4).map(x => x[0].uid);
  }
  // Which skill elements hit a world's monsters hard, as a short sentence.
  function matchupHint(els) {
    const parts = els.map(el => {
      const beats = ELEMENTS.filter(x => STRONG[x].includes(el));
      return beats.length ? `${joinAnd(beats)} skills against ${el} monsters` : "";
    }).filter(Boolean);
    return parts.length ? `Strong here: ${parts.join("; ")}.` : "No element has an edge here.";
  }

  // ---------- Trials ----------
  // An opt-in hard mode that opens with the Heartcrystal. Tiers climb by level, and every Trial has
  // three-monster wild teams, more Rares, Epics and Legendaries, infused foes and an infused final-form boss.
  // You choose which cleared world hosts it, so you choose its elements. Clearing a tier opens the next.
  const TRIAL = { base: 96, perTier: 5, shardMult: 3, mythicEvery: 3, choiceEvery: 5, coins: 5,
    weights: [["Common", 25], ["Uncommon", 40], ["Rare", 29], ["Epic", 2.5], ["Legendary", 0.5]] };
  function trialsOpen() { return S.ach.includes("heart"); }
  function trialRange(t) { const lo = TRIAL.base + TRIAL.perTier * t; return [lo, lo + 2]; }
  function trialInfuse(t) { return Math.min(5, Math.floor(t / 2)); }
  function trialWorlds() { return WORLDS.map((W, i) => i + 1).filter(worldCleared); }
  function trialWorld() { const list = trialWorlds(); return list.includes(S.trials.world) ? S.trials.world : list[list.length - 1]; }
  function trialPrep(m, infuse, final) {
    if (final && SP[m.id].forms.length === 3) m.stage = 2;
    m.infuse = infuse; m.name = formName(m); calc(m); m.hp = m.maxHp;
    return m;
  }
  function pickTrialWild(w, t) {
    const L = S.level, [lo, hi] = trialRange(t);
    const mult = TRIAL.shardMult * (L && L.storm ? SHARDBORN.stormMult : 1) * (L && L.lure ? 10 : 1);
    return trialPrep(makeMon(pickFrom(worldPool(w, pickWeighted(TRIAL.weights))), rand(lo, hi), shardRoll(mult)), trialInfuse(t), false);
  }
  function pickTrialBoss(w, t) {
    const tier = Math.random() < 0.25 ? "Legendary" : "Epic";
    return trialPrep(makeMon(pickFrom(worldPool(w, tier)), trialRange(t)[1] + 3), Math.min(5, t), true);
  }
  function addMythic(el) { S.items.mythic[el] = (S.items.mythic[el] || 0) + 1; }
  // The element a Trial's prizes come in. Rifts pick one of their two elements once per run.
  function trialEl() { const L = S.level; return L.prizeEl || (L.prizeEl = worldEl(L.w)); }
  function trialClear(msgs) {
    const L = S.level, t = L.trial, el = trialEl(), first = t > S.trials.best;
    if (first) S.trials.best = t;
    const dust = (first ? 2 : 1) * (1000 + 250 * t);
    S.coins += dust;
    addShards(el, (first ? 2 : 1) * (8 + t), msgs, "The boss shattered into");
    msgs.push(`You cleared Trial tier ${t}${first ? ` for the first time! Tier ${t + 1} is now open` : ""}. You earned ${fmt(dust)} Shard Dust.`);
    if (first) {
      giveGems(TRIAL.coins, msgs, "You also earned");
      if (t % TRIAL.mythicEvery === 0) { addMythic(el); sfx("chest"); msgs.push(`Tier ${t} reward: a Mythic ${el} egg.`); }
      if (t % TRIAL.choiceEvery === 0) { S.items.crestChoice++; msgs.push(`Tier ${t} reward: a Crest Choice, to take the crest you want from the Bag.`); }
    }
    givePxp((600 + 20 * t) * (first ? 2 : 1), msgs);
    bump("levels"); bump("trials");
    if (Math.random() < 0.08) addEgg(el, msgs, "The boss dropped");
    msgs.push("Spin the reward wheel.");
  }
  function trialPrizes() {
    const t = S.level.trial, el = trialEl(), dust = 500 + 200 * t, n = 10 + t;
    return [
      { w: 20, label: `${fmt(dust)} Shard Dust`, give: () => { S.coins += dust; } },
      { w: 18, label: `${n} ${el} Shards`, give: () => addShards(el, n) },
      { w: 16, label: icount("grorb", 2), give: () => { S.items.grorb += 2; } },
      { w: 14, label: "a Team Tonic and a Revive Shard", give: () => { S.items.tonic++; S.items.revive++; } },
      { w: 12, label: "a quarter of a level's experience for each team monster", give: quarterXp },
      { w: 8, label: "a Prism Shard", give: () => { S.items.perfect++; } },
      { w: 6, label: `${an(el)} egg`, give: () => { S.items.eggs[el] = (S.items.eggs[el] || 0) + 1; } },
      { w: 4, label: `a Mythic ${el} egg`, give: () => addMythic(el) },
      { w: 2, label: "a Crest Choice", give: () => { S.items.crestChoice++; } }
    ];
  }

  // ---------- Heartcrystal fusion ----------
  // Opens with the Heartcrystal, at the Shard Forge. Turns stockpiles into what the collection needs.
  const FUSE = { mythicShards: 250, mythicDust: 15000, eggs: 10, eggDust: 15000, crests: 3, crestDust: 5000 };
  function fusionOpen() { return trialsOpen(); }
  // Ten eggs, a few at a time from whichever element you have most of, so the piles even out.
  function eggFusePlan() {
    const left = { ...S.items.eggs }, plan = {};
    for (let i = 0; i < FUSE.eggs; i++) {
      const el = Object.keys(left).filter(e => left[e] > 0).sort((a, b) => left[b] - left[a] || ELEMENTS.indexOf(a) - ELEMENTS.indexOf(b))[0];
      if (!el) return null;
      left[el]--; plan[el] = (plan[el] || 0) + 1;
    }
    return plan;
  }
  function eggPlanText(plan) { return joinAnd(Object.entries(plan).map(([el, n]) => `${n === 1 ? an(el) : `${n} ${el}`} egg${n === 1 ? "" : "s"}`)); }
  function fuseEggs(el) {
    const plan = eggFusePlan();
    if (!fusionOpen() || !plan || S.coins < FUSE.eggDust || !openElements().includes(el)) return null;
    for (const [k, n] of Object.entries(plan)) S.items.eggs[k] -= n;
    S.coins -= FUSE.eggDust; addMythic(el); bump("fusions"); sfx("forge");
    return [`You fused ${eggPlanText(plan)} into a Mythic ${el} egg for ${fmt(FUSE.eggDust)} Shard Dust. You have ${S.items.mythic[el]} Mythic ${el} egg${S.items.mythic[el] === 1 ? "" : "s"}.`];
  }
  function forgeMythic(el) {
    if (!fusionOpen() || (S.items.shards[el] || 0) < FUSE.mythicShards || S.coins < FUSE.mythicDust || !openElements().includes(el)) return null;
    S.items.shards[el] -= FUSE.mythicShards; S.coins -= FUSE.mythicDust; addMythic(el);
    bump("fusions"); bump("forged"); sfx("forge");
    return [`You forged a Mythic ${el} egg from ${FUSE.mythicShards} ${el} Shards and ${fmt(FUSE.mythicDust)} Shard Dust. ${S.items.shards[el]} ${el} Shards left.`];
  }
  // Lines you own that could still use their crest: some monster not yet in its final form.
  function crestWanted() { return [...new Set(Object.values(S.mons).filter(m => SP[m.id].forms.length === 3 && m.stage < 2).map(m => m.id))]; }
  // How many more of a line's crest you'd need for every monster of that line you own.
  function crestShort(id) { return Math.max(0, Object.values(S.mons).filter(m => m.id === id && m.stage < 2).length - (S.items.crests[crestName(id)] || 0)); }
  function crestFuseTargets() { return crestWanted().filter(id => crestShort(id) > 0); }
  // Three other crests of the target's element. Crests that fit a monster you own are never used.
  function crestFusePlan(id) {
    const target = crestName(id), keep = new Set(crestWanted().map(crestName));
    const left = {}, plan = {};
    for (const c of crestSpecies(SP[id].el).map(crestName)) if (c !== target && !keep.has(c) && S.items.crests[c] > 0) left[c] = S.items.crests[c];
    for (let i = 0; i < FUSE.crests; i++) {
      const c = Object.keys(left).filter(x => left[x] > 0).sort((a, b) => left[b] - left[a])[0];
      if (!c) return null;
      left[c]--; plan[c] = (plan[c] || 0) + 1;
    }
    return plan;
  }
  function crestPlanText(plan) { return joinAnd(Object.entries(plan).map(([c, n]) => (n === 1 ? `the ${c}` : `${n} ${c}s`))); }
  function fuseCrests(id) {
    const plan = SP[id] && SP[id].forms.length === 3 ? crestFusePlan(id) : null;
    if (!fusionOpen() || !plan || S.coins < FUSE.crestDust) return null;
    for (const [c, n] of Object.entries(plan)) S.items.crests[c] -= n;
    S.coins -= FUSE.crestDust; bump("fusions"); sfx("forge");
    const msgs = [];
    msgs.push(`You fused ${crestPlanText(plan)} for ${fmt(FUSE.crestDust)} Shard Dust.`);
    giveCrestOf(id, msgs);
    return msgs;
  }
  // Crest Choices come from Trials. They're offered for lines that still need a crest; otherwise they keep.
  function choiceTargets() { return crestFuseTargets(); }
  function chooseCrest(id) {
    if (!(S.items.crestChoice > 0) || !choiceTargets().includes(id)) return null;
    S.items.crestChoice--; sfx("forge");
    const msgs = [];
    giveCrestOf(id, msgs);
    msgs.push(`You have ${S.items.crestChoice} Crest Choice${S.items.crestChoice === 1 ? "" : "s"} left.`);
    return msgs;
  }
