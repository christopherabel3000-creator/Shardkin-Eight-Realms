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
  function introLine(e) { return brief() ? `${e.name}, ${rarityName(e)} ${e.el}, level ${e.level}` : `${an(rarityName(e))} ${e.el} monster at level ${e.level}`; }
  function startBattle(boss, msgs) {
    const { w, n, trial } = S.level;
    const enemies = trial ? (boss ? [pickTrialBoss(w, trial)] : [pickTrialWild(w, trial), pickTrialWild(w, trial), pickTrialWild(w, trial)])
      : boss ? [pickBoss(w, n)] : gentleLevel() ? [pickWild(w, n)] : [pickWild(w, n), pickWild(w, n)];
    S.battle = { boss, enemies, active: S.level.lead, forced: false, over: null, log: [] };
    S.screen = "battle";
    teamMons().forEach(clearBattleState);
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
    crySfx(e, false);
    if (!brief()) msgs.push(`Your ${you().name} is ready.`);
  }
  function you() { return S.mons[S.battle.active]; }
  function foe() { return S.battle.enemies.find(e => e.hp > 0 && !e.caught); }
  function foesLeft() { return S.battle.enemies.filter(e => e.hp > 0 && !e.caught).length; }
  function an(word) { return (/^[AEIOU]/i.test(word) ? "an " : "a ") + word; }
  function cap(s) { return s.charAt(0).toUpperCase() + s.slice(1); }
  function foeWord() { const B = S.battle; return B.wboss ? "World boss" : B.arena || B.sable || B.friend ? "Rival" : B.mythic ? "Mythical" : B.boss ? "Boss" : "Wild"; }
  // In a live duel both players read the same messages, so monsters go by their player's name; isYou is the host's side.
  function label(m, isYou) {
    const B = S.battle;
    if (B && B.duel) return `${B.names[isYou ? 0 : 1]}'s ${m.name}`;
    return isYou ? `your ${m.name}` : `${foeWord().toLowerCase()} ${m.name}`;
  }
  const STATUS_WORD = { sleep: "asleep", stun: "stunned", poison: "poisoned" };

  // ---------- Battle core ----------
  // Shared by every kind of battle. Monsters carry battle-only state in m.bt (support skill buffs, uses, Quick Start,
  // Momentum and Sturdy); it's cleared when a battle starts and when the team is restored.
  function bst(m) { return m.bt || (m.bt = { pow: 0, guard: 0, bulk: 0, weak: 0, veil: 0, first: false, charged: false, uses: 0, acted: false, streak: 0, sturdy: false }); }
  function clearBattleState(m) { if (m) delete m.bt; }
  function supportLeft(m) { return SUPPORT_USES - ((m.bt && m.bt.uses) || 0); }
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
  // Who moves first: Overcharge or an unused Quick Start beats speed; otherwise the faster monster.
  function prio(m) { const A = bst(m); return A.first || (hasTrait(m, "quick") && !A.acted) ? 1 : 0; }
  function goesFirst(p, e) { const a = prio(p), b = prio(e); return a !== b ? a > b : p.spd > e.spd || (p.spd === e.spd && Math.random() < 0.5); }
  // Everything that scales a hit: element, own-element bonus, support skill buffs, traits, charms, Fury and Ward Shards,
  // and the week's Trial rule.
  function damageMult(att, def, sk, isYou) {
    const A = bst(att), D = bst(def), el = mult(sk.el, def.el), B = S.battle;
    let k = el * (sk.el === att.el ? (hasTrait(att, "pride") ? 1.4 : 1.2) : 1);
    k *= (1 + 0.3 * A.pow) * (1 + 0.2 * A.bulk) * (1 - 0.25 * A.weak) * (A.charged ? 1.5 : 1);
    if (hasTrait(att, "laststand") && att.hp < att.maxHp / 3) k *= 1.3;
    if (hasTrait(att, "momentum")) k *= 1 + 0.1 * Math.min(3, A.streak);
    if (CHARMS[att.charm] && CHARMS[att.charm].el === sk.el) k *= 1.15;
    k *= (1 - 0.25 * D.guard) * (1 - 0.15 * D.bulk) * (D.veil > 0 ? 0.5 : 1);
    if (hasTrait(def, "shell")) k *= 0.9;
    if (hasTrait(def, "weathered") && el > 1) k *= 0.75;
    if (def.charm === "guard") k *= 0.9;
    if (B && isYou && B.fury) k *= 1.5;
    if (B && !isYou && B.ward) k *= 0.67;
    const R = trialRuleNow();
    if (R && R.surge === sk.el) k *= 1.3;
    return { k, el };
  }
  // Sleep, stun or poison, unless a trait blocks it. short: a boss you put to sleep wakes after one turn.
  function applyStatus(m, type, isYou, msgs, short) {
    const who = cap(label(m, isYou));
    if (hasTrait(m, "prism")) { msgs.push(`${who}'s Prismatic Heart keeps it ${type === "sleep" ? "awake" : type === "stun" ? "steady" : "pure"}.`); return; }
    if ((type === "sleep" || type === "stun") && hasTrait(m, "ironwill")) { msgs.push(`${who}'s Iron Will keeps it ${type === "sleep" ? "awake" : "steady"}.`); return; }
    if (type === "poison" && hasTrait(m, "purity")) { msgs.push(`${who}'s Pure Spirit shrugs off the poison.`); return; }
    m.status = { type, turns: type === "sleep" ? (short ? 1 : rand(1, 3)) : 1 };
    msgs.push(`${who} is now ${STATUS_WORD[type]}!`); sfx("status");
  }
  function hurt(m, n, isYou) { const before = m.hp / m.maxHp; m.hp = Math.max(0, m.hp - n); hpSfx(m, isYou, before); }
  function mend(m, n, isYou) { const h = Math.min(m.maxHp - m.hp, n), before = m.hp / m.maxHp; m.hp += h; if (h) hpSfx(m, isYou, before); return h; }
  function attack(att, def, sk, isYou, msgs) {
    const A = bst(att), D = bst(def), who = cap(label(att, isYou)), target = label(def, !isYou);
    const { k, el: m } = damageMult(att, def, sk, isYou);
    A.acted = true; A.streak++;
    const acc = hasTrait(att, "keeneye") ? 101 : Math.min(100, sk.acc + (att.charm === "focus" ? 10 : 0));
    if (Math.random() * 100 >= acc) { msgs.push(brief() ? `${who}, ${sk.name}: missed.` : `${who} used ${sk.name}, but it missed.`); atkSfx(sk, isYou, "miss"); return; }
    if (hasTrait(def, "phase") && Math.random() < 1 / 7) { msgs.push(`${cap(target)} phases through ${sk.name}${brief() ? "" : ", taking no damage"}.`); atkSfx(sk, isYou, "miss"); return; }
    const base = ((2 * att.level / 5 + 2) * sk.power * att.atk / def.def) / 50 + 2;
    let dmg = Math.max(1, Math.round(base * k * (0.85 + Math.random() * 0.15)));
    A.charged = false;
    if (D.veil > 0) D.veil--;
    // Sturdy: once per battle, a knockout blow leaves 1 health.
    let endured = false;
    if (dmg >= def.hp && def.hp > 1 && hasTrait(def, "sturdy") && !D.sturdy) { dmg = def.hp - 1; D.sturdy = true; endured = true; }
    const before = def.hp / def.maxHp;
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
    hpSfx(def, !isYou, before);
    msgs.push(t);
    if (endured) msgs.push(`${cap(target)} holds on with Sturdy!`);
    if (hasTrait(att, "siphon") && att.hp > 0) { const h = mend(att, Math.max(1, Math.floor(dmg / 5)), isYou); if (h) msgs.push(`${who} siphons ${h} health.`); }
    if (def.hp > 0 && sk.st && !def.status && Math.random() * 100 < sk.stc * (hasTrait(att, "potent") ? 2 : 1)) applyStatus(def, sk.st, !isYou, msgs, isYou && S.battle.boss);
    // The defender's trait answers back.
    const t2 = traitOf(def);
    if (att.hp > 0 && (t2 === "thornhide" || t2 === "searing" || t2 === "jagged")) {
      const n = Math.max(1, Math.floor(dmg / 10)); hurt(att, n, isYou);
      msgs.push(brief() ? `${TRAITS[t2].name}: ${label(att, isYou)} takes ${n}.` : `${cap(target)}'s ${TRAITS[t2].name} hurts ${label(att, isYou)} for ${n}.`);
    }
    if (att.hp > 0 && !att.status && (t2 === "venomskin" || t2 === "staticcoat") && Math.random() < 0.2) applyStatus(att, t2 === "venomskin" ? "poison" : "stun", isYou, msgs, false);
    if (def.hp <= 0 && t2 === "grudge" && att.hp > 0) {
      const n = Math.ceil(att.maxHp / 4); hurt(att, n, isYou);
      msgs.push(`${cap(target)}'s Grudge drains ${label(att, isYou)} for ${n}.`);
    }
  }
  // Support skills: heals, shields and buffs. Each monster can use its support skill twice per battle.
  function support(att, def, sk, isYou, msgs) {
    const A = bst(att), who = cap(label(att, isYou)), b = brief(), them = label(def, !isYou);
    A.acted = true; A.streak = 0; A.uses++;
    sfx("heal");
    const twice = n => (n === 2 ? ", the most it can stack" : "");
    if (sk.support === "heal" || sk.support === "cleanse" || sk.support === "mend") {
      const cleared = sk.support !== "heal" && att.status ? att.status.type : null;
      if (sk.support !== "heal") att.status = null;
      const h = mend(att, Math.ceil(att.maxHp * { heal: 0.4, cleanse: 0.25, mend: 1 / 3 }[sk.support]), isYou);
      msgs.push(b ? `${who}, ${sk.name}: heals ${h}${cleared ? `, no longer ${STATUS_WORD[cleared]}` : ""}, ${att.hp} of ${att.maxHp}.`
        : `${who} used ${sk.name}${cleared ? `, is no longer ${STATUS_WORD[cleared]},` : ""} and recovered ${h} health. It has ${att.hp} of ${att.maxHp}.`);
    } else if (sk.support === "veil") { A.veil = 2; msgs.push(b ? `${who}, ${sk.name}: the next two hits are halved.` : `${who} used ${sk.name}. The next two hits against it deal half damage.`); }
    else if (sk.support === "power") { A.pow = Math.min(2, A.pow + 1); msgs.push(b ? `${who}, ${sk.name}: damage up ${30 * A.pow}%.` : `${who} used ${sk.name}. Its skills deal ${30 * A.pow}% more damage for the rest of this battle${twice(A.pow)}.`); }
    else if (sk.support === "guard") { A.guard = Math.min(2, A.guard + 1); msgs.push(b ? `${who}, ${sk.name}: damage taken down ${25 * A.guard}%.` : `${who} used ${sk.name}. It takes ${25 * A.guard}% less damage for the rest of this battle${twice(A.guard)}.`); }
    else if (sk.support === "bulk") { A.bulk = Math.min(2, A.bulk + 1); msgs.push(b ? `${who}, ${sk.name}: damage up ${20 * A.bulk}%, taken down ${15 * A.bulk}%.` : `${who} used ${sk.name}. It deals ${20 * A.bulk}% more and takes ${15 * A.bulk}% less damage for the rest of this battle${twice(A.bulk)}.`); }
    else if (sk.support === "charge") { A.first = true; A.charged = true; msgs.push(b ? `${who}, ${sk.name}: acts first, next attack 50% stronger.` : `${who} used ${sk.name}. It acts first for the rest of this battle, and its next attack deals 50% more.`); }
    else if (sk.support === "weaken") { const D = bst(def); D.weak = Math.min(2, D.weak + 1); msgs.push(b ? `${who}, ${sk.name}: ${them} deals ${25 * D.weak}% less.` : `${who} used ${sk.name}. ${cap(them)} deals ${25 * D.weak}% less damage for the rest of this battle${twice(D.weak)}.`); }
  }
  function useSkill(att, def, sk, isYou, msgs) { if (sk.support) support(att, def, sk, isYou, msgs); else attack(att, def, sk, isYou, msgs); }
  // The end of each round: poison, then Regrowth (much smaller for world bosses, like poison).
  function endOfRound(msgs, pairs) {
    for (const [m, isYou] of pairs || [[you(), true], [foe(), false]]) {
      if (!m || m.hp <= 0) continue;
      const giant = S.battle.wboss && !isYou;
      if (m.status && m.status.type === "poison") {
        const dmg = Math.max(1, Math.floor(m.maxHp / (giant ? 60 : 10)));
        hurt(m, dmg, isYou);
        msgs.push(brief() ? `Poison: ${label(m, isYou)} takes ${dmg}${m.hp > 0 ? `, ${m.hp} left` : ""}.` : `Poison hurts ${label(m, isYou)} for ${dmg} damage.` + (m.hp > 0 ? ` It has ${m.hp} of ${m.maxHp} left.` : ""));
      }
      if (m.hp > 0 && hasTrait(m, "regrowth") && m.hp < m.maxHp) {
        const h = mend(m, Math.max(1, Math.floor(m.maxHp / (giant ? 200 : 16))), isYou);
        msgs.push(`${cap(label(m, isYou))} regrows ${h}${brief() ? "" : " health"}.`);
      }
    }
  }
  // The opponent's choice: usually its best attack, sometimes its support skill (never for world bosses).
  function aiAttack(e, target) {
    let best = null, score = -1;
    for (const s of attacks(e)) {
      let v = s.power * mult(s.el, target.el) * (s.el === e.el ? 1.2 : 1) * (s.acc / 100) * (0.8 + Math.random() * 0.4);
      if (s.st && !target.status) v *= 1 + s.stc / 100;
      if (v > score) { score = v; best = s; }
    }
    return best;
  }
  function aiPick(e, target) {
    const B = S.battle, sup = unlocked(e).find(s => s.support);
    if (sup && !B.wboss && supportLeft(e) > 0) {
      const hp = e.hp / e.maxHp, r = Math.random(), heals = sup.support === "heal" || sup.support === "cleanse" || sup.support === "mend";
      if (heals && hp < 0.4 && r < 0.6) return sup;
      if (heals && sup.support !== "heal" && e.status && e.status.type === "poison" && hp < 0.7 && r < 0.5) return sup;
      if (!heals && !bst(e).acted && hp > 0.6 && r < (B.boss ? 0.5 : 0.25)) return sup;
    }
    return aiAttack(e, target);
  }
  function foeTurn(msgs) {
    const e = foe(), p = you();
    if (e && p.hp > 0) { if (canAct(e, false, msgs)) useSkill(e, p, aiPick(e, p), false, msgs); bst(e).acted = true; }
  }
  function settle(msgs) {
    const B = S.battle;
    if (B.over) return;
    const cur = B.enemies.find(e => e.hp <= 0 && !e.caught && !e.done);
    if (cur) {
      cur.done = true;
      if (B.wboss) { wbVictory(msgs); return; }
      msgs.push(`${foeWord()} ${cur.name} fainted.`); sfx("faint");
      if (!B.friend) teamXp(Math.round(cur.level * 10 * XP_MULT[cur.rarity] * (B.boss && !B.arena ? 2 : 1)), msgs, false, cur.level);
      if (!B.boss && !B.mythic && Math.random() < 0.5) addShards(cur.el, SHARD_DROP[cur.rarity] * (cur.shard ? 3 : 1), msgs, "It left behind");
    }
    const next = foe();
    if (!next) { endBattle("win", msgs); return; }
    if (cur) msgs.push(nextLine(next));
    if (you().hp <= 0) {
      msgs.push(`Your ${you().name} fainted.`); sfx("faint");
      if (teamMons().some(m => m.hp > 0)) { B.forced = true; msgs.push(brief() ? "Choose who goes next." : "Choose a monster to send out."); }
      else if (B.wboss) { msgs.push("Your whole team has fainted."); wbFinish(msgs, false); }
      else if (B.arena) { B.over = "arenalose"; for (const m of teamMons()) m.status = null; sfx("lose"); msgs.push(`Your whole team has fainted on Arena floor ${B.floor}. Your best is floor ${S.arena.best}. Return to camp to heal up and climb again.`); }
      else if (B.sable) sableLose(msgs);
      else if (B.friend) friendEnd(false, msgs);
      else if (B.mythic) kaleidraEnd(false, msgs);
      else endBattle("lose", msgs);
    }
  }
  // The next opponent stepping in, after one faints or is caught.
  function nextLine(next) {
    const B = S.battle, who = B.arena || B.sable || B.friend ? B.rival : null;
    crySfx(next, false);
    if (brief()) return `${who ? `${who}'s next` : "Next"}: ${introLine(next)}.`;
    return who ? `${who} sends out ${next.name}, ${introLine(next)}.` : `Wild ${next.name} steps forward, ${introLine(next)}.`;
  }
  function endBattle(kind, msgs) {
    const B = S.battle;
    B.over = kind;
    for (const m of teamMons()) m.status = null;
    if (kind === "win" && !B.friend) bump("wins");
    if (kind === "win" && B.arena) { arenaWin(msgs); return; }
    if (kind === "win" && B.friend) { friendEnd(true, msgs); return; }
    if (kind === "win" && B.sable) { sableWin(msgs); return; }
    if (kind === "win" && B.mythic) { kaleidraEnd(true, msgs); return; }
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
    const st = e.status ? STATUS_CAPTURE[e.status.type] : 1, binder = S.battle && you() && you().charm === "binder" ? 1.25 : 1;
    return Math.min(1, (1 - e.hp / e.maxHp) * (SP[e.id].mythic ? MYTHIC_CAPTURE : CAPTURE_MULT[e.rarity]) * st * (BIND_MULT[kind] || 1) * binder);
  }
  function act(type, arg) {
    const B = S.battle;
    if (!B || B.over) return null;
    if (B.forced && type !== "switch") return null;
    const msgs = [];
    if (type === "switch") {
      const m = S.mons[arg], out = you();
      if (!m || arg === B.active || m.hp <= 0) return null;
      // Leaving the field ends a Momentum streak, and Mending heals the one stepping back.
      if (out && out.hp > 0) {
        bst(out).streak = 0;
        if (hasTrait(out, "mender")) { const h = mend(out, Math.ceil(out.maxHp / 4), true); if (h) msgs.push(`${out.name} mends ${h} health as it steps back.`); }
      }
      B.active = arg; B.forced = false;
      msgs.push(brief() ? `${m.name} is out.` : `You sent out ${m.name}. Switching is free, so you can still act this turn.`); sfx("swap"); crySfx(m, true);
      return msgs;
    }
    if (type === "retreat") { if (!B.wboss) return null; wbFinish(msgs, true); return msgs; }
    if (type === "skill") {
      const p = you(), e = foe(), sk = unlocked(p)[arg];
      if (!sk || (sk.support && supportLeft(p) <= 0)) return null;
      const esk = aiPick(e, p);
      const yourMove = () => { if (canAct(p, true, msgs)) useSkill(p, e, sk, true, msgs); bst(p).acted = true; };
      const theirMove = () => { if (canAct(e, false, msgs)) useSkill(e, p, esk, false, msgs); bst(e).acted = true; };
      if (goesFirst(p, e)) { yourMove(); if (e.hp > 0 && p.hp > 0) theirMove(); }
      else { theirMove(); if (p.hp > 0 && e.hp > 0) yourMove(); }
    } else if (type === "capture") {
      const e = foe();
      // Prism Shards scatter in a mythical monster's light.
      if (B.boss || !(S.items[arg] > 0) || !(arg in BIND_MULT || arg === "perfect") || (B.mythic && arg === "perfect")) return null;
      S.items[arg]--;
      const orbName = iname(arg, 1);
      if (Math.random() < captureChance(e, arg)) {
        e.caught = true;
        const isNew = !S.dex.includes(e.id);
        addMon(makeMon(e.id, e.level, e.shard), false);
        S.stats.caught++; bump("caps"); S.counts.capEl[e.el] = (S.counts.capEl[e.el] || 0) + 1;
        msgs.push(brief() ? `Caught ${e.name}${isNew ? ", new to your collection" : ""}!` : `You threw a ${orbName}. Success! You captured ${B.mythic ? "" : "wild "}${e.name}${isNew ? ", a new monster for your collection" : ""}. It was sent to your base.`); sfx("catch");
        // The first catch of a new game says where catches go, once.
        if (S.stats.caught === 1 && S.team.length < 4) msgs.push("Catches wait in your base. Add them to your team from Team and base before your next level.");
        if (e.shard) { bump("shardcaps"); msgs.push(brief() ? "A Shardborn!" : "You caught a Shardborn! Its crystal body makes it stronger than others of its kind."); sfx("shardborn"); giveGems(GEM.shardborn, msgs, "You earned"); }
        teamXp(Math.round(e.level * 5 * XP_MULT[e.rarity]), msgs, false, e.level);
        givePxp(10, msgs);
        if (B.mythic) { kaleidraCaught(msgs); return msgs; }
        const next = foe();
        if (!next) endBattle("win", msgs);
        else msgs.push(nextLine(next));
        return msgs;
      }
      msgs.push(brief() ? `${e.name} broke free.` : `You threw a ${orbName}, but ${B.mythic ? "" : "wild "}${e.name} broke free.`); sfx("fail");
      foeTurn(msgs);
    } else if (type === "potion") {
      if (!usePotion(you(), msgs)) return null;
      foeTurn(msgs);
    } else if (type === "use") {
      const [id, target] = String(arg).split(":");
      if (!useItem(id, target, msgs, true)) return null;
      foeTurn(msgs);
    }
    if (you().hp > 0 && foe() && foe().hp > 0) endOfRound(msgs);
    settle(msgs);
    return msgs;
  }
  function usePotion(m, msgs) { return useItem("potion", m.uid, msgs, false); }
  // Trials, world boss fights and the story's battles allow a few items: ITEM_CAP per Trial run, or per fight.
  // Healing items, Fury and Ward Shards and Loaded Dice count; capture items don't.
  const ITEM_CAP = 5;
  function capFight() { const B = S.battle; return !!(B && (B.wboss || B.sable || B.mythic || B.friend)); }
  function capHolder() { return capFight() ? S.battle : S.level && S.level.trial ? S.level : null; }
  // Friendly battles use no items at all.
  function itemCap() { return S.battle && S.battle.friend ? 0 : S.battle && S.battle.wboss ? ITEM_CAP : ruleVal("cap", ITEM_CAP); }
  function itemsLeft() { const h = capHolder(); return h ? Math.max(0, itemCap() - (h.itemsUsed || 0)) : Infinity; }
  function spendCap(msgs) {
    const h = capHolder();
    if (!h) return;
    h.itemsUsed = (h.itemsUsed || 0) + 1;
    msgs.push(`${itemsLeft()} of ${itemCap()} items left for this ${capFight() ? "fight" : "Trial"}.`);
  }
  function capLine() {
    const h = capHolder(), B = S.battle;
    if (!h) return "";
    const who = B && B.wboss ? "World boss fights allow" : B && B.sable ? "Battles with Sable allow" : B && B.mythic ? "This battle allows" : "This Trial allows";
    return `${who} ${itemCap()} items, not counting capture items: ${itemsLeft()} left.`;
  }
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
      const heal = id === "superpotion" ? m.maxHp - m.hp : Math.min(m.maxHp - m.hp, Math.ceil(m.maxHp / 2)), before = m.hp / m.maxHp;
      m.hp += heal; if (id === "superpotion") m.status = null;
      S.items[id]--; sfx("heal"); hpSfx(m, true, before);
      msgs.push(`You used ${an(iname(id, 1))}. ${m.name} recovered ${heal} health and now has ${m.hp} of ${m.maxHp}.`);
      return true;
    }
    if (id === "revive") {
      const m = S.mons[target];
      if (!m || !S.team.includes(target) || m.hp > 0) return false;
      m.hp = Math.ceil(m.maxHp / 2); m.status = null;
      S.items.revive--; sfx("heal"); hpSfx(m, true, 0);
      msgs.push(`You used a Revive Shard. ${m.name} is back on its feet with ${m.hp} of ${m.maxHp} health.`);
      return true;
    }
    if (id === "tonic") {
      const hurt = teamMons().filter(m => m.hp > 0 && m.hp < m.maxHp);
      if (!hurt.length) return false;
      for (const m of hurt) { const before = m.hp / m.maxHp; m.hp = Math.min(m.maxHp, m.hp + Math.ceil(m.maxHp / 2)); hpSfx(m, true, before); }
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
    const parts = teamMons().map(m => [m, Math.max(1, Math.ceil(xpNeed(m.level) / 4 * outgrowMult(m.level, levelRef()) * (m.charm === "scholar" ? 1.3 : 1)))]);
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
