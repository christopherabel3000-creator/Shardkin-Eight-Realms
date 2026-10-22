// Shardkin: Eight Realms — Experience, evolution, currencies, shards, expeditions, hatchery, quests and the Arena.
// Files share one global scope and load in the order listed in index.html.
"use strict";

  // ---------- Evolution and experience ----------
  function evolve(m, msgs) {
    const forms = SP[m.id].forms, old = m.name, oldMax = m.maxHp;
    m.stage++; m.name = formName(m); calc(m);
    if (m.hp > 0) m.hp += m.maxHp - oldMax;
    S.stats.evolved++;
    msgs.push(`${old} evolved into ${m.name}!`); sfx("evolve");
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
  function levelRef() { return S.level ? wildRange(S.level.w, S.level.n)[1] : 1; }
  function teamXp(amount, msgs, everyone, foeLevel) {
    const team = teamMons().filter(m => everyone || m.hp > 0);
    if (!team.length || amount <= 0) return;
    const parts = team.map(m => { const k = foeLevel ? outgrowMult(m.level, foeLevel) : 1; return [m, Math.max(1, Math.round(amount * k)), k < 1]; });
    const who = everyone ? "Each monster on your team" : "Each standing monster on your team";
    if (parts.every(x => x[1] === parts[0][1] && x[2] === parts[0][2])) {
      const note = parts[0][2] ? " (reduced: outgrown this level)" : "";
      msgs.push(team.length > 1 ? `${who} gained ${parts[0][1]} experience${note}.` : `${team[0].name} gained ${parts[0][1]} experience${note}.`);
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
    if (msgs) msgs.push(`${why || "You gained"} ${n} ${el} Shard${n === 1 ? "" : "s"}.`);
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
    msgs.push(`${why || "You found"} a ${el} egg!` + (S.hatch ? " Hatch it at the Hatchery." : " Build the Hatchery to hatch it."));
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
    sfx(floor % 10 === 0 ? "boss" : "ambush");
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
