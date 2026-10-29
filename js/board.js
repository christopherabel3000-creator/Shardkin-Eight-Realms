// Shardkin: Eight Realms — Dice-board levels and world bosses.
// Files share one global scope and load in the order listed in index.html.
"use strict";

  // ---------- Board ----------
  const SPACE = { start: "Start", path: "Quiet path", heal: "Healing spring", trap: "Thorn trap", portal: "Portal", battle: "Wild battle",
    chest: "Treasure chest", merchant: "Wandering merchant", storm: "Shard storm", boss: "Level boss" };
  const BOARD_SIZE = 36;
  // Boards get busier and more dangerous as levels go up. Every board has one merchant mid-way,
  // a healing spring in the last stretch before the boss, and never more than three battles in a row.
  function genBoard(w, n) {
    const step = Math.min(10, n + (w - 1) * 2);
    const weights = [["battle", 34 + 2 * step], ["path", 28 - 2 * step], ["heal", 11], ["trap", 8 + step], ["portal", 7], ["chest", 7], ["storm", 2.5]];
    const b = ["start"];
    let streak = 0;
    for (let i = 1; i < BOARD_SIZE - 1; i++) {
      let t = pickWeighted(weights);
      if (t === "battle" && streak >= 3) t = "path";
      streak = t === "battle" ? streak + 1 : 0;
      b.push(t);
    }
    b[rand(14, 22)] = "merchant";
    b[rand(30, 34)] = "heal";
    b.push("boss");
    return b;
  }
  function spaceLabel(i) { return S.level.used[i] ? "Cleared" : SPACE[S.level.board[i]]; }
  function leadMon() { return S.mons[S.level.lead]; }
  function fixLead() {
    if (leadMon().hp > 0) return true;
    const next = teamMons().find(m => m.hp > 0);
    if (!next) return false;
    S.level.lead = next.uid;
    return true;
  }
  function startLevel(w, n) {
    restoreAll();
    S.level = { w, n, board: genBoard(w, n), pos: 0, used: Array(BOARD_SIZE).fill(false), lead: S.team[0], failed: false,
      replay: prog(w).cleared.includes(n), wb: null, shopOpen: false, encounter: false, lure: !!S.lure };
    const lureMsg = S.lure ? " Your Shardborn Lure glimmers: Shardborn are ten times more likely on this level." : "";
    S.lure = false;
    // A hidden world boss can lurk here if none is active. It moves every roll.
    if (!S.wboss && Math.random() < WB.chance) S.level.wb = rand(3, BOARD_SIZE - 3);
    S.battle = null; S.wheel = null; S.confirm = null; S.dieChoose = false; S.screen = "level";
    const [lo, hi] = wildRange(w, n);
    if (S.brief) return [`World ${w}, Level ${n}: wild level ${lo} to ${hi}. ${leadMon().name} leads.${lureMsg}`];
    return [`World ${w}, the ${world(w).title}, Level ${n} begins. You're on space 1 of ${BOARD_SIZE}, and the level boss waits on space ${BOARD_SIZE}. Wild ${world(w).name} monsters here are level ${lo} to ${hi}. ${leadMon().name} leads your team.${lureMsg}`];
  }
  // A Trial plays on the board of a cleared world, at the density of that world's last level, with no hidden world boss.
  function startTrial(w, t) {
    restoreAll();
    const n = world(w).levels;
    S.level = { w, n, trial: t, board: genBoard(w, n), pos: 0, used: Array(BOARD_SIZE).fill(false), lead: S.team[0], failed: false,
      replay: t <= S.trials.best, wb: null, shopOpen: false, encounter: false, lure: !!S.lure };
    const lureMsg = S.lure ? " Your Shardborn Lure glimmers: Shardborn are ten times more likely on this Trial." : "";
    S.lure = false;
    S.trials.world = w;
    S.battle = null; S.wheel = null; S.confirm = null; S.dieChoose = false; S.screen = "level";
    const [lo, hi] = trialRange(t), inf = trialInfuse(t);
    if (S.brief) return [`Trial tier ${t} in World ${w}: level ${lo} to ${hi}${inf ? `, infused ${inf}` : ""}. ${leadMon().name} leads.${lureMsg}`];
    return [`Trial tier ${t} begins in World ${w}, the ${world(w).title}. Trial monsters here are level ${lo} to ${hi}, three to a team${inf ? `, with ${inf} infusion${inf === 1 ? "" : "s"}` : ""}, and the boss on space ${BOARD_SIZE} is an infused final form. ${leadMon().name} leads your team.${lureMsg}`];
  }
  function levelName(L) { return L.trial ? `Trial tier ${L.trial}` : `World ${L.w}, Level ${L.n}`; }
  function roll(chosen) {
    const L = S.level, msgs = [];
    const r = chosen || rand(1, 6);
    sfx("roll");
    const target = L.pos + r;
    const pos = Math.min(BOARD_SIZE - 1, target);
    if (S.brief) msgs.push(chosen ? `Loaded Die: ${r}.` : `Rolled ${r}.`);
    else msgs.push(chosen ? `You used a Loaded Die and chose ${r}.` : `You rolled a ${r}.`);
    if (target > BOARD_SIZE - 1) msgs.push(S.brief ? "Past the end." : "You rolled past the end, so you land on the boss space.");
    L.pos = pos;
    if (L.wb !== null && pos === L.wb) { wbEncounter(msgs); return msgs; }
    landOn(pos, msgs, true);
    // The hidden boss slips away to a new spot ahead of you.
    if (L.wb !== null && S.screen === "level") L.wb = L.pos < BOARD_SIZE - 3 ? rand(L.pos + 1, BOARD_SIZE - 2) : null;
    else if (L.wb !== null && S.screen === "battle") L.wb = L.pos < BOARD_SIZE - 3 ? rand(L.pos + 1, BOARD_SIZE - 2) : null;
    return msgs;
  }
  function landOn(p, msgs, allowPortal) {
    const L = S.level, type = L.board[p], lead = leadMon(), b = S.brief;
    const place = L.used[p] ? "a cleared space" : SPACE[type].toLowerCase();
    msgs.push(b ? `Space ${p + 1}: ${place}.` : `You land on space ${p + 1}: ${place}.`);
    if (L.used[p] && type !== "boss") { if (!b) msgs.push("Nothing happens."); return; }
    if (type === "path") { if (!b) msgs.push("Nothing happens."); }
    else if (type === "heal") {
      L.used[p] = true;
      const heal = Math.min(lead.maxHp - lead.hp, Math.ceil(lead.maxHp * 0.4));
      lead.hp += heal; sfx("heal");
      if (b) msgs.push(heal > 0 ? `${lead.name} heals ${heal}, ${lead.hp} of ${lead.maxHp}.` : `${lead.name} is at full health.`);
      else msgs.push(heal > 0 ? `${lead.name} recovers ${heal} health and now has ${lead.hp} of ${lead.maxHp}.` : `${lead.name} is already at full health.`);
    } else if (type === "trap") {
      L.used[p] = true;
      const dmg = Math.max(1, Math.ceil(lead.maxHp * 0.2));
      lead.hp = Math.max(0, lead.hp - dmg); sfx("trap");
      if (b) msgs.push(`${lead.name} takes ${dmg}` + (lead.hp > 0 ? `, ${lead.hp} of ${lead.maxHp} left.` : "."));
      else msgs.push(`Thorns hit ${lead.name} for ${dmg} damage.` + (lead.hp > 0 ? ` It has ${lead.hp} of ${lead.maxHp} health left.` : ""));
      if (lead.hp <= 0) {
        msgs.push(`${lead.name} fainted.`); sfx("faint");
        if (fixLead()) msgs.push(`${leadMon().name} is now your lead monster.`);
        else failLevel(msgs);
      }
    } else if (type === "chest") {
      L.used[p] = true;
      sfx("chest");
      bump("chests");
      const w = L.w;
      let prize = pickWeighted([["coins", 30], ["potion", 22], ["orb", 20], ["shards", 15], ["die", 5], ["egg", 4], ["boost", w >= 2 ? 6 : 0], ["revive", w >= 4 ? 4 : 0]]);
      // Later worlds hold better tiers of the same kinds of items.
      const tier = (opts) => { for (const [id, chance] of opts) if (itemOpen(id) && Math.random() < chance) return id; return null; };
      let found = null;
      if (prize === "potion") found = tier([["tonic", w >= 6 ? 0.3 : 0], ["superpotion", w >= 3 ? 0.6 : 0], ["potion", 1]]);
      if (prize === "orb") found = tier([["grorb", w >= 5 ? 0.4 : 0], ["gorb", w >= 3 ? 0.6 : 0], ["orb", 1]]);
      if (prize === "boost") found = pickFrom(["fury", "ward"]);
      if (prize === "revive") found = "revive";
      const find = what => msgs.push(b ? `Inside: ${what}.` : `You open the chest and find ${what}.`);
      if (found && found !== "orb" && found !== "potion") { S.items[found]++; find(icount(found, 1)); prize = "done"; }
      else if (found === "potion") prize = "potion";
      else if (found === "orb") prize = "orb";
      if (prize === "shards") addShards(worldEl(L.w), rand(2, 4), msgs, "You open the chest and find");
      if (prize === "egg") addEgg(worldEl(L.w), msgs, "You open the chest and find");
      if (prize === "coins") { const c = Math.max(1, Math.round(rand(20, 40) * L.w * outgrowMult(teamTop(), levelRef()))); S.coins += c; find(`${c} Shard Dust`); }
      else if (prize === "potion") { S.items.potion++; find("a Potion"); }
      else if (prize === "orb") { const c = rand(1, 2); S.items.orb += c; find(`${c} Binding Shard${c > 1 ? "s" : ""}`); }
      else if (prize === "die") { S.items.die++; find("a Loaded Die"); }
    } else if (type === "storm") {
      L.used[p] = true;
      sfx("storm");
      const el = worldEl(L.w), n = rand(3, 6);
      addShards(el, n, null);
      L.storm = true;
      msgs.push(b ? `Plus ${n} ${el} Shards. Shardborn are ten times more likely for the rest of this level.` : `Crystals rain from the sky! You gather ${n} ${el} Shards. While the shard storm lasts, the rest of this level, Shardborn are ten times more likely to appear.`);
    } else if (type === "merchant") {
      L.shopOpen = true;
      msgs.push(b ? `You have ${fmt(S.coins)} Shard Dust.` : `A wandering merchant waves you over. You have ${S.coins} Shard Dust. Buy what you need, then leave the merchant to keep rolling.`);
    } else if (type === "portal") {
      if (!allowPortal) { msgs.push(b ? "It stays quiet." : "The portal flickers but stays quiet."); return; }
      let dest = p;
      while (dest === p) dest = rand(1, BOARD_SIZE - 2);
      sfx("portal");
      msgs.push(b ? `It pulls you ${dest > p ? "forward" : "back"}.` : `The portal pulls you ${dest > p ? "forward" : "back"} to space ${dest + 1}.`);
      L.pos = dest;
      landOn(dest, msgs, false);
    } else if (type === "battle") {
      L.used[p] = true;
      startBattle(false, msgs);
    } else if (type === "boss") {
      startBattle(true, msgs);
    }
  }
  function failLevel(msgs) {
    S.level.failed = true;
    msgs.push(`Your whole team has fainted. ${S.level.trial ? `Trial tier ${S.level.trial}` : `Level ${S.level.n}`} failed. You keep your captures and experience. Return to camp to restore your team and try again.`);
    sfx("lose");
  }

  // ---------- World bosses ----------
  function wbTick(msgs) {
    if (!S.wboss || (S.battle && S.battle.wboss && !S.battle.over)) return;
    if (now() >= S.wboss.expires) {
      msgs.push(`The world boss ${S.wboss.name} has left. It wasn't defeated in time.`);
      S.wboss = null; S.wfights = null;
      return;
    }
    const F = S.wfights;
    const gained = Math.floor((now() - F.last) / WB.fightEvery);
    if (gained > 0) {
      F.count = Math.min(WB.maxFights, F.count + gained);
      F.last = F.count >= WB.maxFights ? now() : F.last + gained * WB.fightEvery;
    }
  }
  function wbEncounter(msgs) {
    const L = S.level, el = worldEl(L.w);
    const id = pickFrom(POOLS[el].Epic);
    // At least 5 levels above the world's toughest wild monsters, and always above your strongest team monster.
    const team = teamMons(), top = Math.max(...team.map(x => x.level));
    const m = makeMon(id, Math.max(wildRange(L.w, world(L.w).levels)[1] + WB.levelBonus, top + WB.levelOverTeam));
    // It grows with your team: a final form once your team has one, infused as much as your team is on average.
    if (team.some(x => x.stage === 2)) m.stage = 2;
    m.infuse = Math.round(team.reduce((a, x) => a + (x.infuse || 0), 0) / team.length);
    m.name = formName(m); calc(m);
    const hp = wbHealth(m, team);
    S.wboss = { id, name: m.name, el: m.el, rarity: m.rarity, level: m.level, stage: m.stage, infuse: m.infuse, maxHp: hp, hp, expires: now() + WB.lifetime, world: L.w };
    S.wfights = { count: 1, last: now() };
    L.wb = null; L.encounter = true;
    sfx("giant");
    msgs.push(`Space ${L.pos + 1} looked ordinary, but a world boss was hiding here! ${m.name}, a towering level ${m.level} ${m.el} monster with ${S.wboss.maxHp} health. It stays for 24 hours. Fight it now, which ends this level attempt, or ignore it and fight it later from camp.`);
  }
  // Health for a world boss: enough that your team needs about WB.fights fights to bring it down, estimated from how hard
  // each team monster hits it and how long each one lasts against it. fightCal corrects the estimate, which runs a little high.
  function wbHealth(m, team) {
    const best = (a, d) => Math.max(1, ...unlocked(a).map(s => estDmg(a, d, s) * s.acc / 100));
    const perFight = team.reduce((sum, p) => sum + best(p, m) * Math.max(1, p.maxHp / best(m, p)), 0);
    return Math.round(Math.max(m.maxHp * WB.minHpMult, perFight * WB.fights * WB.fightCal));
  }
  function wbBattle(fromLevel) {
    const W = S.wboss;
    const e = makeMon(W.id, W.level);
    e.stage = W.stage || e.stage; e.infuse = W.infuse || 0; calc(e);
    e.maxHp = W.maxHp; e.hp = W.hp; e.name = W.name;
    S.wfights.count--; bump("wbfights");
    if (S.wfights.count === WB.maxFights - 1) S.wfights.last = now();
    S.battle = { boss: true, wboss: true, enemies: [e], active: fromLevel ? S.level.lead : S.team[0], forced: false, over: null, log: [], startHp: W.hp, fromLevel };
    if (!fromLevel) { restoreAll(); S.level = null; }
    S.screen = "battle";
    sfx("giant");
    if (S.brief) return [`World boss ${W.name}: ${fmt(W.hp)} of ${fmt(W.maxHp)} health.`];
    return [`You challenge the world boss ${W.name}. It has ${W.hp} of ${W.maxHp} health. Every point of damage you deal carries over to your next fight.`, `Your ${you().name} is ready.`];
  }
  function wbFinish(msgs, retreated) {
    const B = S.battle, e = B.enemies[0];
    S.wboss.hp = e.hp;
    const dealt = B.startHp - e.hp;
    if (retreated) msgs.push("You pulled your team back from the fight.");
    msgs.push(`You dealt ${dealt} damage this fight. The world boss has ${e.hp} of ${S.wboss.maxHp} health left.`);
    teamXp(Math.round(dealt / 8), msgs, true);
    B.over = "wbdone";
  }
  function wbVictory(msgs) {
    const W = S.wboss;
    msgs.push(`You defeated the world boss ${W.name}! Reward: 1000 Shard Dust, a Prism Shard and a ${W.el} final-form crest.`);
    S.coins += 1000; S.items.perfect++;
    giveCrest(W.el, msgs);
    addEgg(W.el, msgs, "It left behind");
    addShards(W.el, 20, msgs, "It shattered into");
    teamXp(Math.round(W.maxHp / 6), msgs, true);
    givePxp(150, msgs);
    S.stats.wbKills++;
    giveGems(GEM.worldBoss, msgs, "You also earned");
    S.wboss = null; S.wfights = null;
    S.battle.over = "wbwin";
    sfx("win");
  }
