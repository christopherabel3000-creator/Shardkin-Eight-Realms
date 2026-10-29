// Shardkin: Eight Realms — Battles, the reward wheel, synthesis and training timers.
// Files share one global scope and load in the order listed in index.html.
"use strict";

  // ---------- Battle ----------
  function pickWild(w, n) {
    const tier = pickWeighted(RARITY_WEIGHT);
    const [lo, hi] = wildRange(w, n);
    return makeMon(pickFrom(worldPool(w, tier)), tier === "Common" || tier === "Uncommon" ? rand(lo, hi) : hi + 1, shardRoll((S.level && S.level.storm ? SHARDBORN.stormMult : 1) * (S.level && S.level.lure ? 10 : 1)));
  }
  // World 1, Level 1 is gentler for new players: single wild monsters, and an Uncommon boss one level lower.
  function gentleLevel() { return !!(S.level && !S.level.trial && S.level.w === 1 && S.level.n === 1); }
  function pickBoss(w, n) {
    const tier = gentleLevel() ? "Uncommon" : Math.random() < 0.2 ? "Rare" : "Uncommon";
    return makeMon(pickFrom(worldPool(w, tier)), wildRange(w, n)[1] + (gentleLevel() ? 1 : 2));
  }
  // Brief messages: shorter battle lines without the tips you've long since learned (Settings).
  function brief() { return !!S.brief; }
  const TEAM_WORD = { 2: "two", 3: "three", 4: "four" };
  function introLine(e) { return brief() ? `${e.name}, ${e.rarity} ${e.el}, level ${e.level}` : `${an(e.rarity)} ${e.el} monster at level ${e.level}`; }
  function startBattle(boss, msgs) {
    const { w, n, trial } = S.level;
    const enemies = trial ? (boss ? [pickTrialBoss(w, trial)] : [pickTrialWild(w, trial), pickTrialWild(w, trial), pickTrialWild(w, trial)])
      : boss ? [pickBoss(w, n)] : gentleLevel() ? [pickWild(w, n)] : [pickWild(w, n), pickWild(w, n)];
    S.battle = { boss, enemies, active: S.level.lead, forced: false, over: null, log: [] };
    S.screen = "battle";
    const e = foe();
    if (boss) {
      sfx("boss");
      msgs.push(brief() ? `Boss: ${introLine(e)}${e.infuse ? `, infused ${e.infuse}` : ""}.`
        : `The ${trial ? "Trial" : "level"} boss appears: ${e.name}, ${introLine(e)}${e.infuse ? `, infused ${e.infuse} of 5` : ""}. Bosses must be defeated, not captured.`);
    } else {
      sfx("ambush");
      if (enemies.length === 1) msgs.push(brief() ? `Wild ${introLine(e)}.` : `Wild ${e.name} appears, ${introLine(e)}.`);
      else msgs.push(brief() ? `Wild team of ${TEAM_WORD[enemies.length]}. First: ${introLine(e)}.` : `A wild team of ${TEAM_WORD[enemies.length]} ambushes you. Wild ${e.name} steps forward, ${introLine(e)}.`);
      const rare = S.battle.enemies.find(x => ["Rare", "Epic", "Legendary"].includes(x.rarity));
      if (rare) msgs.push(brief() ? `${rare.rarity} on this team: ${rare.name}.` : `Something rare is on this team: ${rare.name}, ${an(rare.rarity)} monster!`);
      const sb = S.battle.enemies.find(x => x.shard);
      if (sb) { sfx("shardborn"); msgs.push(brief() ? `Shardborn on this team: ${sb.name}!` : `${sb.name} glitters on this team! Shardborn are rare crystal variants with 10% stronger stats.`); }
    }
    if (!brief()) msgs.push(`Your ${you().name} is ready.`);
  }
  function you() { return S.mons[S.battle.active]; }
  function foe() { return S.battle.enemies.find(e => e.hp > 0 && !e.caught); }
  function foesLeft() { return S.battle.enemies.filter(e => e.hp > 0 && !e.caught).length; }
  function an(word) { return (/^[AEIOU]/i.test(word) ? "an " : "a ") + word; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function foeWord() { return S.battle.wboss ? "World boss" : S.battle.arena ? "Rival" : S.battle.boss ? "Boss" : "Wild"; }
  function label(m, isYou) { return isYou ? `your ${m.name}` : `${foeWord().toLowerCase()} ${m.name}`; }
  const STATUS_WORD = { sleep: "asleep", stun: "stunned", poison: "poisoned" };

  // Returns false if the monster loses its turn to sleep or stun.
  function canAct(m, isYou, msgs) {
    const st = m.status;
    if (!st || st.type === "poison") return true;
    st.turns--;
    if (st.type === "sleep") msgs.push(`${cap(label(m, isYou))} is fast asleep.`);
    else msgs.push(`${cap(label(m, isYou))} is stunned and can't move.`);
    if (st.turns <= 0) { m.status = null; msgs.push(st.type === "sleep" ? `${cap(label(m, isYou))} woke up.` : `${cap(label(m, isYou))} shook off the stun.`); }
    return false;
  }
  function attack(att, def, sk, isYou, msgs) {
    const who = cap(label(att, isYou)), target = label(def, !isYou);
    if (Math.random() * 100 >= sk.acc) { msgs.push(brief() ? `${who}, ${sk.name}: missed.` : `${who} used ${sk.name}, but it missed.`); atkSfx(sk, isYou, "miss"); return; }
    const m = mult(sk.el, def.el);
    const stab = sk.el === att.el ? 1.2 : 1;
    const base = ((2 * att.level / 5 + 2) * sk.power * att.atk / def.def) / 50 + 2;
    let dmg = Math.max(1, Math.round(base * stab * m * (0.85 + Math.random() * 0.15)));
    if (isYou && S.battle.fury) dmg = Math.round(dmg * 1.5);
    if (!isYou && S.battle.ward) dmg = Math.max(1, Math.round(dmg * 0.67));
    def.hp = Math.max(0, def.hp - dmg);
    let t;
    if (brief()) t = `${who}, ${sk.name}: ${dmg}${m > 1 ? ", strong" : m < 1 ? ", weak" : ""}.` + (def.hp > 0 ? ` ${cap(target)} ${def.hp} left.` : "");
    else {
      t = `${who} used ${sk.name} on ${target} for ${dmg} damage.`;
      if (m > 1) t += " It's strong against it.";
      else if (m < 1) t += " It's weak against it.";
      if (def.hp > 0) t += ` ${cap(target)} has ${def.hp} of ${def.maxHp} health left.`;
    }
    atkSfx(sk, isYou, m > 1 ? "strong" : m < 1 ? "weak" : "hit");
    msgs.push(t);
    if (def.hp > 0 && sk.st && !def.status && Math.random() * 100 < sk.stc) {
      const bossy = !isYou ? false : S.battle.boss;
      const turns = sk.st === "sleep" ? (bossy ? 1 : rand(1, 3)) : 1;
      def.status = { type: sk.st, turns };
      msgs.push(`${cap(target)} is now ${STATUS_WORD[sk.st]}!`); sfx("status");
    }
  }
  function poisonTick(msgs) {
    for (const [m, isYou] of [[you(), true], [foe(), false]]) {
      if (!m || m.hp <= 0 || !m.status || m.status.type !== "poison") continue;
      const dmg = Math.max(1, Math.floor(m.maxHp / (S.battle.wboss && !isYou ? 60 : 10)));
      m.hp = Math.max(0, m.hp - dmg);
      msgs.push(brief() ? `Poison: ${label(m, isYou)} takes ${dmg}${m.hp > 0 ? `, ${m.hp} left` : ""}.` : `Poison hurts ${label(m, isYou)} for ${dmg} damage.` + (m.hp > 0 ? ` It has ${m.hp} of ${m.maxHp} left.` : ""));
    }
  }
  function aiSkill(e, target) {
    let best = null, score = -1;
    for (const s of unlocked(e)) {
      let v = s.power * mult(s.el, target.el) * (s.el === e.el ? 1.2 : 1) * (s.acc / 100) * (0.8 + Math.random() * 0.4);
      if (s.st && !target.status) v *= 1 + s.stc / 100;
      if (v > score) { score = v; best = s; }
    }
    return best;
  }
  function foeTurn(msgs) {
    const e = foe(), p = you();
    if (e && p.hp > 0 && canAct(e, false, msgs)) attack(e, p, aiSkill(e, p), false, msgs);
  }
  function settle(msgs) {
    const B = S.battle;
    if (B.over) return;
    const cur = B.enemies.find(e => e.hp <= 0 && !e.caught && !e.done);
    if (cur) {
      cur.done = true;
      if (B.wboss) { wbVictory(msgs); return; }
      msgs.push(`${foeWord()} ${cur.name} fainted.`); sfx("faint");
      teamXp(Math.round(cur.level * 10 * XP_MULT[cur.rarity] * (B.boss && !B.arena ? 2 : 1)), msgs, false, cur.level);
      if (!B.boss && Math.random() < 0.5) addShards(cur.el, SHARD_DROP[cur.rarity] * (cur.shard ? 3 : 1), msgs, "It left behind");
    }
    const next = foe();
    if (!next) { endBattle("win", msgs); return; }
    if (cur) msgs.push(nextLine(next));
    if (you().hp <= 0) {
      msgs.push(`Your ${you().name} fainted.`); sfx("faint");
      if (teamMons().some(m => m.hp > 0)) { B.forced = true; msgs.push(brief() ? "Choose who goes next." : "Choose a monster to send out."); }
      else if (B.wboss) { msgs.push("Your whole team has fainted."); wbFinish(msgs, false); }
      else if (B.arena) { B.over = "arenalose"; for (const m of teamMons()) m.status = null; sfx("lose"); msgs.push(`Your whole team has fainted on Arena floor ${B.floor}. Your best is floor ${S.arena.best}. Return to camp to heal up and climb again.`); }
      else endBattle("lose", msgs);
    }
  }
  // The next opponent stepping in, after one faints or is caught.
  function nextLine(next) {
    const B = S.battle, who = B.arena ? B.rival : null;
    if (brief()) return `${who ? `${who}'s next` : "Next"}: ${introLine(next)}.`;
    return who ? `${who} sends out ${next.name}, ${introLine(next)}.` : `Wild ${next.name} steps forward, ${introLine(next)}.`;
  }
  function endBattle(kind, msgs) {
    const B = S.battle;
    B.over = kind;
    for (const m of teamMons()) m.status = null;
    if (kind === "win") bump("wins");
    if (kind === "win" && B.arena) { arenaWin(msgs); return; }
    if (kind === "win") {
      sfx("win");
      if (B.boss && S.level && S.level.trial) trialClear(msgs);
      else if (B.boss) {
        const { w, n } = S.level, P = prog(w), first = !P.cleared.includes(n);
        if (first) P.cleared.push(n);
        P.unlocked = Math.max(P.unlocked, Math.min(world(w).levels, n + 1));
        const coins = Math.max(1, Math.round((30 + 20 * n + 40 * (w - 1)) * outgrowMult(teamTop(), levelRef() + 2)));
        S.coins += coins;
        addShards(worldEl(w), 3 + w, msgs, "The boss shattered into");
        let t = brief() ? `Level ${n} complete.` : `You defeated the level boss! World ${w}, Level ${n} complete.`;
        if (first && n < world(w).levels) t += brief() ? ` Level ${n + 1} unlocked.` : ` Level ${n + 1} is unlocked.`;
        if (first && n === world(w).levels) giveGems(worldCoins(w), msgs, `For clearing World ${w} you earned`);
        if (first && n === world(w).levels && WORLDS[w]) { t += ` World ${w + 1}, the ${WORLDS[w].title}, is now open! ${WORLDS[w].lore}`; S.worldView = w + 1; }
        msgs.push(t + (brief() ? ` ${coins} Shard Dust.` : ` You earned ${coins} Shard Dust.`));
        givePxp((40 + 10 * n + 50 * (w - 1)) * (first ? 2 : 1), msgs);
        bump("levels");
        if (Math.random() < 0.08) addEgg(worldEl(w), msgs, "The boss dropped");
        if (!brief()) msgs.push("Spin the reward wheel.");
      } else {
        const k = outgrowMult(teamTop(), Math.max(...B.enemies.map(e => e.level)));
        const coins = Math.max(1, Math.round(B.enemies.reduce((s, e) => s + e.level * 2, 0) * k));
        S.coins += coins; sfx("coin");
        msgs.push(brief() ? `Won: ${coins} Shard Dust${k < 1 ? ", reduced" : ""}.` : `You won the battle and earned ${coins} Shard Dust${k < 1 ? " (reduced: your team has outgrown this level)" : ""}! Continue on the board when ready.`);
      }
    } else failLevel(msgs);
  }
  function captureChance(e, kind) {
    if (kind === "perfect") return 1;
    const st = e.status ? STATUS_CAPTURE[e.status.type] : 1;
    return Math.min(1, (1 - e.hp / e.maxHp) * CAPTURE_MULT[e.rarity] * st * (BIND_MULT[kind] || 1));
  }
  function act(type, arg) {
    const B = S.battle;
    if (!B || B.over) return null;
    if (B.forced && type !== "switch") return null;
    const msgs = [];
    if (type === "switch") {
      const m = S.mons[arg];
      if (!m || arg === B.active || m.hp <= 0) return null;
      B.active = arg; B.forced = false;
      msgs.push(brief() ? `${m.name} is out.` : `You sent out ${m.name}. Switching is free, so you can still act this turn.`); sfx("swap");
      return msgs;
    }
    if (type === "retreat") { if (!B.wboss) return null; wbFinish(msgs, true); return msgs; }
    if (type === "skill") {
      const p = you(), e = foe();
      const sk = unlocked(p)[arg], esk = aiSkill(e, p);
      const youFirst = p.spd > e.spd || (p.spd === e.spd && Math.random() < 0.5);
      const yourMove = () => { if (canAct(p, true, msgs)) attack(p, e, sk, true, msgs); };
      const theirMove = () => { if (canAct(e, false, msgs)) attack(e, p, esk, false, msgs); };
      if (youFirst) { yourMove(); if (e.hp > 0 && p.hp > 0) theirMove(); }
      else { theirMove(); if (p.hp > 0 && e.hp > 0) yourMove(); }
    } else if (type === "capture") {
      const e = foe();
      if (B.boss || !(S.items[arg] > 0) || !(arg in BIND_MULT || arg === "perfect")) return null;
      S.items[arg]--;
      const orbName = iname(arg, 1);
      if (Math.random() < captureChance(e, arg)) {
        e.caught = true;
        const isNew = !S.dex.includes(e.id);
        addMon(makeMon(e.id, e.level, e.shard), false);
        S.stats.caught++; bump("caps"); S.counts.capEl[e.el] = (S.counts.capEl[e.el] || 0) + 1;
        msgs.push(brief() ? `Caught ${e.name}${isNew ? ", new to your collection" : ""}!` : `You threw a ${orbName}. Success! You captured wild ${e.name}${isNew ? ", a new monster for your collection" : ""}. It was sent to your base.`); sfx("catch");
        // The first catch of a new game says where catches go, once.
        if (S.stats.caught === 1 && S.team.length < 4) msgs.push("Catches wait in your base. Add them to your team from Team and base before your next level.");
        if (e.shard) { bump("shardcaps"); msgs.push(brief() ? "A Shardborn!" : "You caught a Shardborn! Its crystal body makes it stronger than others of its kind."); sfx("shardborn"); giveGems(GEM.shardborn, msgs, "You earned"); }
        teamXp(Math.round(e.level * 5 * XP_MULT[e.rarity]), msgs, false, e.level);
        givePxp(10, msgs);
        const next = foe();
        if (!next) endBattle("win", msgs);
        else msgs.push(nextLine(next));
        return msgs;
      }
      msgs.push(brief() ? `${e.name} broke free.` : `You threw a ${orbName}, but wild ${e.name} broke free.`); sfx("fail");
      foeTurn(msgs);
    } else if (type === "potion") {
      if (!usePotion(you(), msgs)) return null;
      foeTurn(msgs);
    } else if (type === "use") {
      const [id, target] = String(arg).split(":");
      if (!useItem(id, target, msgs, true)) return null;
      foeTurn(msgs);
    }
    if (you().hp > 0 && foe() && foe().hp > 0) poisonTick(msgs);
    settle(msgs);
    return msgs;
  }
  function usePotion(m, msgs) { return useItem("potion", m.uid, msgs, false); }
  // Trials and world boss fights allow a few items: ITEM_CAP per Trial run, or per world boss fight.
  // Healing items, Fury and Ward Shards and Loaded Dice count; capture items don't.
  const ITEM_CAP = 5;
  function capHolder() { return S.battle && S.battle.wboss ? S.battle : S.level && S.level.trial ? S.level : null; }
  function itemsLeft() { const h = capHolder(); return h ? Math.max(0, ITEM_CAP - (h.itemsUsed || 0)) : Infinity; }
  function spendCap(msgs) {
    const h = capHolder();
    if (!h) return;
    h.itemsUsed = (h.itemsUsed || 0) + 1;
    msgs.push(`${itemsLeft()} of ${ITEM_CAP} items left for this ${S.battle && S.battle.wboss ? "fight" : "Trial"}.`);
  }
  function capLine() { const h = capHolder(); return h ? `${S.battle && S.battle.wboss ? "World boss fights" : "Trials"} allow ${ITEM_CAP} items, not counting capture items: ${itemsLeft()} left.` : ""; }
  // Healing, reviving and battle boosts. Returns false (and changes nothing) if the item can't be used.
  function useItem(id, target, msgs, inBattle) {
    if (itemsLeft() <= 0 || !applyItem(id, target, msgs, inBattle)) return false;
    spendCap(msgs);
    return true;
  }
  function applyItem(id, target, msgs, inBattle) {
    if (!(S.items[id] > 0) || !itemOpen(id)) return false;
    if (id === "potion" || id === "superpotion") {
      const m = S.mons[target];
      if (!m || m.hp <= 0 || (m.hp >= m.maxHp && !(id === "superpotion" && m.status))) return false;
      const heal = id === "superpotion" ? m.maxHp - m.hp : Math.min(m.maxHp - m.hp, Math.ceil(m.maxHp / 2));
      m.hp += heal; if (id === "superpotion") m.status = null;
      S.items[id]--; sfx("heal");
      msgs.push(`You used ${an(iname(id, 1))}. ${m.name} recovered ${heal} health and now has ${m.hp} of ${m.maxHp}.`);
      return true;
    }
    if (id === "revive") {
      const m = S.mons[target];
      if (!m || !S.team.includes(target) || m.hp > 0) return false;
      m.hp = Math.ceil(m.maxHp / 2); m.status = null;
      S.items.revive--; sfx("heal");
      msgs.push(`You used a Revive Shard. ${m.name} is back on its feet with ${m.hp} of ${m.maxHp} health.`);
      return true;
    }
    if (id === "tonic") {
      const hurt = teamMons().filter(m => m.hp > 0 && m.hp < m.maxHp);
      if (!hurt.length) return false;
      for (const m of hurt) m.hp = Math.min(m.maxHp, m.hp + Math.ceil(m.maxHp / 2));
      S.items.tonic--; sfx("heal");
      msgs.push(`You used a Team Tonic. ${hurt.map(m => `${m.name} now has ${m.hp} of ${m.maxHp}`).join(", ")}.`);
      return true;
    }
    if (id === "fury" || id === "ward") {
      if (!inBattle || !S.battle || S.battle[id]) return false;
      S.items[id]--; S.battle[id] = true; sfx("status");
      msgs.push(id === "fury" ? "You crushed a Fury Shard. Your monsters deal 50% more damage for the rest of this battle." : "You crushed a Ward Shard. Your monsters take a third less damage for the rest of this battle.");
      return true;
    }
    return false;
  }

  // ---------- Reward wheel ----------
  // 25% of what each monster needs for its next level, reduced if it has outgrown this board.
  function quarterXp(msgs) {
    const parts = teamMons().map(m => [m, Math.max(1, Math.ceil(xpNeed(m.level) / 4 * outgrowMult(m.level, levelRef())))]);
    msgs.push(parts.map(([m, amt]) => `${m.name} gained ${amt} experience`).join(", ") + ".");
    for (const [m, amt] of parts) levelCheck(m, amt, msgs);
  }
  // Expected damage, matching the attack formula without the random spread.
  function estDmg(att, def, sk) {
    const base = ((2 * att.level / 5 + 2) * sk.power * att.atk / def.def) / 50 + 2;
    return base * (sk.el === att.el ? 1.2 : 1) * mult(sk.el, def.el) * 0.93;
  }
  function prizes() {
    if (S.level && S.level.trial) return trialPrizes();
    const L = S.level, w = L.w, k = outgrowMult(teamTop(), levelRef());
    const coins = Math.max(1, Math.round(150 * w * k));
    const heal = itemOpen("tonic") && w >= 6 ? ["tonic", 1] : itemOpen("superpotion") && w >= 3 ? ["superpotion", 2] : ["potion", 2];
    const bind = itemOpen("grorb") && w >= 5 ? ["grorb", 2] : itemOpen("gorb") && w >= 3 ? ["gorb", 3] : ["orb", 3];
    const list = [
      { w: 22, label: icount(heal[0], heal[1]), give: () => { S.items[heal[0]] += heal[1]; } },
      { w: 22, label: icount(bind[0], bind[1]), give: () => { S.items[bind[0]] += bind[1]; } },
      { w: 22, label: `${coins} Shard Dust${k < 1 ? " (reduced: outgrown)" : ""}`, give: () => { S.coins += coins; } },
      { w: 18, label: "a quarter of a level's experience for each team monster", give: quarterXp },
      { w: w >= 2 ? 8 : 0, label: "a Fury Shard and a Ward Shard", give: () => { S.items.fury++; S.items.ward++; } },
      { w: w >= 4 ? 6 : 0, label: "a Revive Shard", give: () => { S.items.revive++; } },
      { w: 3, label: "a Prism Shard", give: () => { S.items.perfect += 1; } }
    ].filter(x => x.w > 0);
    // Replaying the last level of a completed world adds a chance at a final-form crest.
    if (L.n === world(L.w).levels && L.replay) list.push({ w: 8, label: `a random ${world(L.w).name} final-form crest`, give: msgs => giveCrest(worldEl(L.w), msgs) });
    return list;
  }
  function spin() {
    const prize = pickWeighted(prizes().map(p => [p, p.w]));
    const msgs = [];
    for (let i = 0; i < 8; i++) sfx("tick");
    msgs.push(`The wheel spins, slows, and stops on ${prize.label}!`);
    prize.give(msgs);
    sfx("win");
    S.wheel = { spun: true, prize: prize.label };
    bump("spins");
    return msgs;
  }

  // ---------- Synthesis ----------
  function slotsMatch(R, mons) {
    if (mons.length !== R.slots.length) return false;
    const perms = a => a.length <= 1 ? [a] : a.flatMap((x, i) => perms([...a.slice(0, i), ...a.slice(i + 1)]).map(p => [x, ...p]));
    return perms(mons).some(order => order.every((m, i) => m.el === R.el && R.slots[i].includes(m.rarity)));
  }
  function synthEligible(R) {
    const rar = new Set(R.slots.flat());
    return Object.values(S.mons).filter(m => m.el === R.el && rar.has(m.rarity) && !m.fav && !inTraining(m.uid) && !onExped(m.uid));
  }
  function doSynth() {
    const R = RECIPES[S.synth.recipe], picks = S.synth.picks.map(id => S.mons[id]);
    if (!slotsMatch(R, picks)) return ["Those monsters don't match the recipe yet."];
    if (S.team.every(id => S.synth.picks.includes(id))) return ["Keep at least one monster on your team. Add another monster to your team first, or choose different ingredients."];
    if (picks.some(m => m.fav)) return ["Favorites can't be used in synthesis. Unfavorite it first in Team and base."];
    const level = Math.max(...picks.map(m => m.level));
    for (const m of picks) dropMon(m.uid);
    const id = pickFrom(POOLS[R.el][R.result]);
    const fresh = !S.dex.includes(id);
    const m = addMon(makeMon(id, level, Math.random() < SHARDBORN.synth), false);
    if (m.shard) sfx("shardborn");
    S.stats.synth++; S.synth.picks = []; bump("synths");
    sfx("evolve");
    const msgs = [`${picks.map(p => p.name).join(" and ")} combined into ${m.name}, ${an(m.rarity)} ${m.el} monster at level ${m.level}${fresh ? ", new to your collection" : ""}! It was sent to your base.`];
    givePxp(25, msgs);
    return msgs;
  }

  // ---------- Buildings and training ----------
  function now() { return Date.now(); }
  function dur(ms) {
    const mins = Math.max(0, Math.ceil(ms / 60000)), h = Math.floor(mins / 60), m = mins % 60;
    return [h ? `${h} hour${h === 1 ? "" : "s"}` : "", m || !h ? `${m} minute${m === 1 ? "" : "s"}` : ""].filter(Boolean).join(" ");
  }
  // The mine also turns up elemental shards: one per 2 hours per mine level, from realms you've opened.
  function mineShardsPending() {
    if (!S.mine) return 0;
    return Math.floor(Math.min(MINE.capHours, (now() - S.mine.last) / HOUR) / 2) * S.mine.lvl;
  }
  function collectMineShards(msgs) {
    const n = mineShardsPending(), got = {};
    for (let i = 0; i < n; i++) { const el = pickFrom(openElements()); got[el] = (got[el] || 0) + 1; }
    for (const [el, c] of Object.entries(got)) addShards(el, c, null);
    if (n) msgs.push(`The mine also turned up ${Object.entries(got).map(([el, c]) => `${c} ${el} Shard${c === 1 ? "" : "s"}`).join(", ")}.`);
  }
  function minePending() {
    if (!S.mine) return 0;
    const hrs = Math.min(MINE.capHours, (now() - S.mine.last) / HOUR);
    return Math.floor(hrs * MINE.rate[S.mine.lvl]);
  }
  function trainingStatus() {
    const s = S.training.session;
    if (!s) return null;
    if (S.training.mode === "time") {
      const left = s.start + trainHours() * HOUR - now();
      return { done: left <= 0, text: left <= 0 ? "Training is complete." : `${dur(left)} left.` };
    }
    const left = s.pxpAt + trainNeed(s) - S.pxpLife;
    return { done: left <= 0, text: left <= 0 ? "Training is complete." : `Earn ${fmt(left)} more Shardbinder experience to finish.` };
  }
