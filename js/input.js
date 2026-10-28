// Shardkin: Eight Realms — Button handling: every player action goes through doAction.
// Files share one global scope and load in the order listed in index.html.
"use strict";

  // ---------- Input ----------
  // Back to the camp area you came from: Trials, the Arena, or Levels.
  function backToCamp(text) {
    const tab = S.level && S.level.trial ? "trials" : S.battle && S.battle.arena ? "arena" : "levels";
    restoreAll(); S.level = null; S.battle = null; S.wheel = null; S.confirm = null; S.dieChoose = false; S.screen = "camp"; S.campTab = tab; return [text];
  }
  document.getElementById("screen").addEventListener("click", ev => {
    const b = ev.target.closest("button[data-a]");
    if (!b || autoOn()) return;
    doAction(b.dataset.a, b.dataset.arg, false);
  });
  function doAction(a, arg, quiet) {
    let msgs = null, beginAuto = false;
    if (S.wboss) { const t = []; wbTick(t); if (t.length && S.screen === "camp") msgs = t; }
    switch (a) {
      // Camp
      case "tab": S.campTab = arg; S.confirm = null; S.synth = null; S.swapIn = null; msgs = (msgs || []).concat([`${tabLabel(arg)}.`]); break;
      case "menu": S.campTab = null; S.confirm = null; S.synth = null; S.swapIn = null; msgs = (msgs || []).concat(["Main menu."]); break;
      case "level": { const [w, n] = arg.split("-").map(Number); if (S.team.length && worldOpen(w) && n <= prog(w).unlocked) msgs = startLevel(w, n); break; }
      case "world": { const w = Number(arg); if (worldOpen(w)) { S.worldView = w; msgs = [`World ${w}: the ${world(w).title}, home of ${world(w).name} Shardkin. ${prog(w).cleared.length} of ${world(w).levels} levels cleared.`]; } break; }
      case "claim": { const [k, i] = arg.split("-"); msgs = claimQuest(k, Number(i)); break; }
      // Trials
      case "trialworld": { const w = Number(arg); if (trialWorlds().includes(w)) { S.trials.world = w; msgs = [`World ${w}, the ${world(w).title}, will host your Trials. Its ${world(w).name} monsters fill the board.`]; } break; }
      case "trial": { const t = Number(arg); if (S.team.length && trialsOpen() && t >= 1 && t <= S.trials.best + 1) msgs = startTrial(trialWorld(), t); break; }
      case "autotrial": {
        const t = Number(arg), w = trialWorld();
        if (S.team.length && trialsOpen() && t >= 1 && t <= S.trials.best) { msgs = ["Auto-play started."].concat(startTrial(w, t)); S.auto = { on: true, w, n: world(w).levels, trial: t, runs: 1, coins0: S.coins, caps0: S.counts.caps || 0 }; beginAuto = true; }
        break;
      }
      // Collection and Bag
      case "colfilter": if (["missing", "caught", "all"].includes(arg)) { S.colFilter = arg; msgs = [`Showing ${{ missing: "missing monsters", caught: "caught monsters", all: "all 120 monsters" }[arg]}.`]; } break;
      case "choosecrest": msgs = chooseCrest(arg); break;
      // Heartcrystal fusion
      case "forgemythic": msgs = forgeMythic(arg); break;
      case "fuseeggs": msgs = fuseEggs(arg); break;
      case "fusecrest": msgs = fuseCrests(arg); break;
      // Hatchery
      case "fillincub": if (S.hatch) msgs = fillIncubators(); break;
      case "hatchall": if (S.hatch) msgs = hatchAllReady(); break;
      case "arenastart": { const f = Number(arg); if (S.player.level >= ARENA.unlock && (f === 1 || f <= S.arena.best + 1)) msgs = arenaFloor(f, true); break; }
      case "arenanext": if (S.battle && S.battle.over === "arenawin") msgs = arenaFloor(S.battle.floor + 1, false); break;
      case "builddock": if (!S.exped && S.player.level >= DOCK.unlock && S.coins >= DOCK.cost) { S.coins -= DOCK.cost; S.exped = { list: [] }; sfx("coin"); msgs = ["You built the Expedition Dock. Open the Expeditions tab to send monsters out."]; } break;
      case "buildhatch": if (!S.hatch && S.player.level >= HATCHERY.unlock && S.coins >= HATCHERY.cost) { S.coins -= HATCHERY.cost; S.hatch = { slots: 1, incub: [] }; sfx("coin"); msgs = ["You built the Hatchery. Open the Hatchery tab to incubate eggs."]; } break;
      case "upyard": { const yl = yardLvl(); if (yl >= 1 && yl < 3 && S.coins >= YARD.up[yl + 1]) { S.coins -= YARD.up[yl + 1]; S.yardLvl = yl + 1; sfx("coin"); msgs = [`Training Yard upgraded to level ${yl + 1}. Sessions now train ${yl + 1} levels' worth of experience in ${trainHours()} hours.`]; } break; }
      case "updock": if (S.exped && !S.exped.big && S.coins >= DOCK.upgrade) { S.coins -= DOCK.upgrade; S.exped.big = true; sfx("coin"); msgs = [`The Expedition Dock now has ${DOCK.bigSlots} slots.`]; } break;
      case "fasthatch": if (S.hatch && !S.hatch.fast && S.coins >= HATCHERY.fastCost) { S.coins -= HATCHERY.fastCost; S.hatch.fast = true; sfx("coin"); msgs = [`The incubators are warmer. Eggs now hatch in ${HATCHERY.fastHours} hours.`]; } break;
      case "hatch3": if (S.hatch && S.hatch.slots === 2 && S.coins >= HATCHERY.slot3) { S.coins -= HATCHERY.slot3; S.hatch.slots = 3; sfx("coin"); msgs = ["You added a third incubator."]; } break;
      case "crestx": {
        const c = arg, from = Object.keys(SP).find(id => SP[id].forms.length === 3 && crestName(id) === c);
        if (!from || !(S.items.crests[c] > 0) || S.coins < CREST_SWAP) break;
        const options = crestSpecies(SP[from].el).filter(id => id !== from);
        const to = crestName(pickFrom(options));
        S.coins -= CREST_SWAP; S.items.crests[c]--; addCrest(to); sfx("forge");
        msgs = [`You exchanged the ${c} for the ${to}.`];
        const fits = crestFits(to);
        if (fits) msgs.push(fits);
        break;
      }
      case "uphatch": if (S.hatch && S.hatch.slots < 2 && S.coins >= HATCHERY.upgrade) { S.coins -= HATCHERY.upgrade; S.hatch.slots = 2; sfx("coin"); msgs = ["You added a second incubator."]; } break;
      case "expdur": S.expDur = Number(arg); msgs = [`Expedition length set to ${arg} hour${arg === "1" ? "" : "s"}.`]; break;
      case "expsend": if (S.exped && S.exped.list.length < dockSlots() && S.mons[arg] && !S.team.includes(arg) && !onExped(arg) && !inTraining(arg)) { S.exped.list.push({ uid: arg, start: now(), hours: S.expDur }); if (S.synth) S.synth.picks = S.synth.picks.filter(x => x !== arg); msgs = [`${S.mons[arg].name} set out on a ${S.expDur}-hour expedition.`]; } break;
      case "expcollect": { const x = S.exped && S.exped.list[Number(arg)]; if (x && expLeft(x) <= 0) msgs = expCollect(Number(arg)); break; }
      case "incubate": if (String(arg).startsWith("mythic:")) { const el = arg.slice(7); if (S.hatch && S.hatch.incub.length < S.hatch.slots && S.items.mythic[el] > 0) { S.items.mythic[el]--; S.hatch.incub.push({ el, start: now(), mythic: true }); msgs = [`You placed a Mythic ${el} egg in an incubator. It hatches in ${hatchHours()} hours.`]; } break; }
        if (S.hatch && S.hatch.incub.length < S.hatch.slots && S.items.eggs[arg] > 0) { S.items.eggs[arg]--; S.hatch.incub.push({ el: arg, start: now() }); msgs = [`You placed a ${arg} egg in an incubator. It hatches in ${hatchHours()} hours.`]; } break;
      case "hatchnow": { const x = S.hatch && S.hatch.incub[Number(arg)]; if (x && hatchLeft(x) <= 0) msgs = hatchEgg(Number(arg)); break; }
      case "sndtest": {
        if (!S.sound) { msgs = ["Sound effects are off. Turn them on with the button at the top of the page."]; break; }
        if (ELEMENTS.includes(arg)) { const a = demoSkill(arg, false), b = demoSkill(arg, true); atkSfx(a, true, "hit"); atkSfx(b, true, "hit"); msgs = [`${arg}: ${a.name}, a light skill, then ${b.name}, a heavy one.`]; }
        else if (arg === "sides") { const a = { name: "Tackle", el: "Physical", power: 40 }; atkSfx(a, true, "hit"); atkSfx(a, false, "hit"); msgs = ["Your attack, from the right, then your opponent's, from the left."]; }
        else { atkSfx({ name: "Tackle", el: "Physical", power: 40 }, true, arg); msgs = [{ strong: "A strong hit.", weak: "A weak hit.", miss: "A missed attack." }[arg]]; }
        break;
      }
      case "autolevel": { const [w, n] = arg.split("-").map(Number); if (S.team.length && prog(w).cleared.includes(n)) { msgs = ["Auto-play started."].concat(startLevel(w, n)); S.auto = { on: true, w, n, runs: 1, coins0: S.coins, caps0: S.counts.caps || 0 }; beginAuto = true; } break; }
      case "autorepeat": if (S.auto) { S.auto.runs++; backToCamp(""); msgs = [`Run ${S.auto.runs} begins.`].concat(S.auto.trial ? startTrial(S.auto.w, S.auto.trial) : startLevel(S.auto.w, S.auto.n)); } break;
      case "autopref": msgs = [togglePref(arg)]; break;
      case "buildforge": if (!S.forge && S.player.level >= FORGE.unlock && S.coins >= FORGE.cost) { S.coins -= FORGE.cost; S.forge = true; sfx("forge"); msgs = ["You built the Shard Forge. Open it from the main menu to spend your elemental shards."]; } break;
      case "forgeel": S.forgeEl = arg; msgs = [`${arg} Shards: you have ${S.items.shards[arg] || 0}.`]; break;
      case "forge": {
        const r = FORGE_ITEMS.find(x => x.id === arg), el = S.forgeEl;
        if (r && el && (S.items.shards[el] || 0) >= r.cost) {
          S.items.shards[el] -= r.cost; bump("forged"); sfx("forge");
          msgs = [`You forged ${r.name} from ${r.cost} ${el} Shards. ${S.items.shards[el]} ${el} Shards left.`];
          if (r.id === "egg") addEgg(el, msgs, "It's"); else S.items[r.id]++;
        }
        break;
      }
      case "infuse": {
        const m = S.mons[arg];
        if (m && (m.infuse || 0) < 5 && (S.items.shards[m.el] || 0) >= infuseCost(m)) {
          const c = infuseCost(m), oldMax = m.maxHp;
          S.items.shards[m.el] -= c; m.infuse = (m.infuse || 0) + 1; calc(m); m.hp = Math.min(m.maxHp, m.hp + m.maxHp - oldMax);
          sfx("forge"); bump("forged");
          msgs = [`You infused ${m.name} with ${c} ${m.el} Shards. Infusion ${m.infuse} of 5: its health is now ${m.maxHp}, attack ${m.atk}, defense ${m.def} and speed ${m.spd}.`];
        }
        break;
      }
      case "buymythic": if (S.gems >= PREMIUM.mythic && openElements().includes(arg)) { S.gems -= PREMIUM.mythic; S.items.mythic[arg] = (S.items.mythic[arg] || 0) + 1; sfx("chest"); msgs = [`You bought a Mythic ${arg} egg. ${S.hatch ? "Incubate it in the Hatchery." : "Build the Hatchery to hatch it."} You have ${S.gems} Coins left.`]; } break;
      case "buylure": if (!S.lure && S.gems >= PREMIUM.lure) { S.gems -= PREMIUM.lure; S.lure = true; sfx("shardborn"); msgs = [`You bought a Shardborn Lure. Shardborn will be ten times more likely on the next level you start. You have ${S.gems} Coins left.`]; } break;
      case "buyprisms": if (S.gems >= PREMIUM.prisms) { S.gems -= PREMIUM.prisms; S.items.perfect += 3; sfx("coin"); msgs = [`You bought 3 Prism Shards. You have ${S.items.perfect} now and ${S.gems} Coins left.`]; } break;
      case "buycrest": if (S.gems >= PREMIUM.crest && SP[arg] && SP[arg].forms.length === 3) { S.gems -= PREMIUM.crest; const c = crestName(arg); addCrest(c); sfx("forge"); msgs = [`You bought the ${c}. You have ${S.gems} Coins left.`]; const f = crestFits(c); if (f) msgs.push(f); } break;
      case "hurry": {
        if (!(S.gems >= PREMIUM.hurry)) { msgs = [`Finishing a timer costs ${PREMIUM.hurry} Coins.`]; break; }
        const [kind, i] = String(arg).split(":");
        if (kind === "train" && S.training.session && !trainingStatus().done) { S.training.session.start = now() - trainHours() * HOUR; S.training.session.pxpAt = S.pxpLife - trainNeed(S.training.session); }
        else if (kind === "hatch" && S.hatch && S.hatch.incub[Number(i)] && hatchLeft(S.hatch.incub[Number(i)]) > 0) S.hatch.incub[Number(i)].start = now() - hatchHours() * HOUR;
        else if (kind === "exp" && S.exped && S.exped.list[Number(i)] && expLeft(S.exped.list[Number(i)]) > 0) { const x = S.exped.list[Number(i)]; x.start = now() - x.hours * HOUR; }
        else break;
        S.gems -= PREMIUM.hurry; sfx("coin");
        msgs = [`Done. That timer is finished. You have ${S.gems} Coins left.`];
        break;
      }
      case "makefirst": S.team = [arg, ...S.team.filter(id => id !== arg)]; msgs = [`${S.mons[arg].name} will lead your team.`]; break;
      case "remove": if (S.team.length > 1) { S.team = S.team.filter(id => id !== arg); msgs = [`${S.mons[arg].name} was sent to your base. Your team has ${S.team.length} of 4.`]; } break;
      case "add": if (S.team.length < 4 && !S.team.includes(arg) && !onExped(arg)) { S.team.push(arg); msgs = [`${S.mons[arg].name} joined your team. Your team has ${S.team.length} of 4.`]; } break;
      // Base management
      case "basesort": { const k = Object.keys(BASE_SORT); S.baseSort = k[(k.indexOf(baseSort()) + 1) % k.length]; msgs = [`Sorted: ${BASE_SORT[S.baseSort].toLowerCase()}.`]; break; }
      case "basefilter": { S.baseFilter = arg; const n = baseShown().length; msgs = [`Showing ${n} ${arg === "all" ? "" : arg === "dupes" ? "duplicate " : BASE_FILTER_NAME(arg) + " "}monster${n === 1 ? "" : "s"} from your base.`]; break; }
      case "swapin": if (S.mons[arg] && !S.team.includes(arg) && !onExped(arg)) { S.swapIn = arg; S.confirm = null; msgs = [`Who should ${S.mons[arg].name} replace? Choose a team monster to send to base, or cancel.`]; } break;
      case "swapyes": {
        const n = S.swapIn, i = S.team.indexOf(arg);
        if (!n || !S.mons[n] || i < 0 || S.team.includes(n) || onExped(n)) { S.swapIn = null; break; }
        S.team[i] = n; S.swapIn = null;
        msgs = [`${S.mons[n].name} joined your team${i === 0 ? " as the lead" : ""}, and ${S.mons[arg].name} went to your base.`];
        break;
      }
      case "release": if (canRelease(S.mons[arg])) { S.confirm = "release"; S.releaseId = arg; S.swapIn = null; msgs = [`Release ${S.mons[arg].name}? What you'd get is just below, then choose Yes or Keep.`]; } break;
      case "releaseyes": if (S.confirm === "release" && S.releaseId === arg) { S.confirm = null; S.releaseId = null; msgs = doRelease(arg); } break;
      case "crest": { const m = S.mons[arg], c = crestName(m.id); if (m.stage === 1 && S.items.crests[c] > 0) { S.items.crests[c]--; msgs = [`You used the ${c}.`]; evolve(m, msgs); m.hp = m.maxHp; } break; }
      case "buy": { const it = SHOP.find(x => x.id === arg); if (it && itemOpen(arg) && S.coins >= it.price) { S.coins -= it.price; S.items[arg]++; sfx("coin"); msgs = [`You bought a ${it.name} for ${it.price} Shard Dust. You have ${S.items[arg]} now and ${S.coins} Shard Dust left.`]; } break; }
      case "buyscroll": { const r = RECIPES[arg]; if (r && S.coins >= r.price && !S.items.scrolls.includes(arg)) { S.coins -= r.price; S.items.scrolls.push(arg); sfx("coin"); msgs = [`You bought the ${r.name}. Find it under Synthesis.`]; } break; }
      case "scroll": S.synth = S.synth && S.synth.recipe === arg ? null : { recipe: arg, picks: [] }; msgs = [S.synth ? `${RECIPES[arg].name} is open. ${RECIPES[arg].desc} Choose your ingredients.` : "Scroll closed."]; break;
      case "pick": { const R = RECIPES[S.synth.recipe], P = S.synth.picks, m = S.mons[arg]; if (P.includes(arg)) { S.synth.picks = P.filter(x => x !== arg); msgs = [`Removed ${m.name}. ${S.synth.picks.length} selected.`]; } else if (P.length < R.slots.length) { P.push(arg); msgs = [`Selected ${m.name}. ${P.length} of ${R.slots.length} selected.` + (slotsMatch(R, P.map(id => S.mons[id])) ? " Ready to synthesize." : "")]; } else msgs = ["You've already chosen enough ingredients. Unselect one first."]; break; }
      case "synth": msgs = doSynth(); break;
      case "buildyard": if (!S.yard && S.coins >= YARD.cost) { S.coins -= YARD.cost; S.yard = true; sfx("coin"); msgs = ["You built the Training Yard. Open the Training tab to train a monster."]; } break;
      case "buildmine": if (!S.mine && S.coins >= MINE.cost[0]) { S.coins -= MINE.cost[0]; S.mine = { lvl: 1, last: now() }; sfx("coin"); msgs = [`You built the Shard Mine. It earns ${MINE.rate[1]} Shard Dust per hour.`]; } break;
      case "upmine": { const lv = S.mine.lvl; if (lv < MINE.max && S.coins >= MINE.cost[lv]) { const p = minePending(); S.coins -= MINE.cost[lv]; S.coins += p; const sm = []; collectMineShards(sm); S.mine = { lvl: lv + 1, last: now() }; sfx("coin"); msgs = [`Shard Mine upgraded to level ${lv + 1}. It now earns ${MINE.rate[lv + 1]} Shard Dust per hour.` + (p ? ` ${p} waiting Shard Dust was collected.` : "")].concat(sm); } break; }
      case "collect": { const p = minePending(); S.coins += p; msgs = [p ? `You collected ${p} Shard Dust. You have ${S.coins} Shard Dust.` : "No Shard Dust ready yet. Check back later."]; collectMineShards(msgs); S.mine.last = now(); if (p) sfx("coin"); break; }
      case "refresh": msgs = (msgs || []).concat(["Updated."]); break;
      case "mode": if (!S.training.session) { S.training.mode = S.training.mode === "time" ? "xp" : "time"; msgs = [`Training mode is now ${S.training.mode === "time" ? "time-based" : "experience-based"}.`]; } break;
      case "train": if (!S.training.session && S.mons[arg]) { S.training.session = { uid: arg, start: now(), pxpAt: S.pxpLife, need: trainPxp() }; msgs = [`${S.mons[arg].name} started training. ${trainingStatus().text}`]; } break;
      case "trainclaim": { const s = S.training.session, st = trainingStatus(); if (s && st.done) { const m = S.mons[s.uid], amt = trainAmount(m); msgs = [`${m.name} finished training and gained ${fmt(amt)} experience.`]; S.training.session = null; S.stats.trained++; levelCheck(m, amt, msgs); givePxp(15, msgs); } break; }
      case "wbfight": if (S.wboss && S.wfights.count > 0 && S.screen === "camp") msgs = wbBattle(false); break;
      case "reset": S.confirm = "reset"; msgs = ["Are you sure? Choose Yes to erase your saved game, or Keep my game."]; break;
      case "resetyes": newGame(); msgs = [S.result]; break;
      case "cancel": S.confirm = null; S.swapIn = null; S.releaseId = null; pendingImport = null; msgs = ["Okay, nothing changed."]; break;
      case "copysave": {
        exportCode = encodeSave();
        msgs = [`Your save code is ready in the Your save code box below. It's ${exportCode.length.toLocaleString()} characters long.`];
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(exportCode).then(() => {
              const r = document.getElementById("result");
              r.textContent = "Your save code was copied. Paste it into Notes or an email to keep it safe. It's also shown in the Your save code box below."; r.focus();
            }, () => {});
          }
        } catch (e) { /* the code is still shown in the box */ }
        msgs.push("If it wasn't copied automatically, select all the text in that box and copy it.");
        break;
      }
      case "importcheck": {
        const box = document.getElementById("importbox"), text = box ? box.value : "";
        if (!String(text).trim()) { msgs = ["Paste a save code into the Paste a save code box first."]; break; }
        const d = decodeSave(text);
        if (!d) { msgs = ["That doesn't look like a complete Shardkin save code. Make sure you copied the whole code, which starts with SHARDKIN1 and a period."]; break; }
        pendingImport = d; S.confirm = "import";
        msgs = [`Found a save: ${saveSummary(d)}. Choose Yes, load this save, or Keep my game.`];
        break;
      }
      case "importyes": {
        if (!pendingImport) break;
        try { localStorage.setItem(BACKUP_KEY, JSON.stringify(Object.assign({}, S, { confirm: null }))); } catch (e) { /* backup is best-effort */ }
        clearTimeout(autoTimer); autoTimer = null;
        S = pendingImport; pendingImport = null; exportCode = "";
        ensureExtras();
        S.auto = null; S.confirm = null;
        if (S.screen === "camp") S.campTab = "save";
        msgs = [`Save loaded: ${saveSummary(S)}. Your previous game is kept as a backup in Settings.`];
        applyUpdates(msgs);
        updateAutobar();
        break;
      }
      case "undoimport": {
        let b = null;
        try { b = upgradeSave(JSON.parse(localStorage.getItem(BACKUP_KEY))); } catch (e) { b = null; }
        if (!b) { msgs = ["There's no backup to go back to."]; break; }
        try { localStorage.setItem(BACKUP_KEY, JSON.stringify(Object.assign({}, S, { confirm: null }))); } catch (e) { /* best-effort */ }
        clearTimeout(autoTimer); autoTimer = null;
        S = b; exportCode = "";
        ensureExtras();
        S.auto = null; S.confirm = null;
        if (S.screen === "camp") S.campTab = "save";
        msgs = [`Back to your earlier game: ${saveSummary(S)}. The game you just left is now the backup, so you can switch again.`];
        applyUpdates(msgs);
        updateAutobar();
        break;
      }
      // Board
      case "roll": msgs = roll(); break;
      case "die": if (itemsLeft() > 0) { S.dieChoose = true; msgs = ["Choose a roll from 1 to 6. Each choice says where you'd land."]; } break;
      case "diecancel": S.dieChoose = false; msgs = ["You kept your Loaded Die."]; break;
      case "dieroll": if (S.items.die > 0 && itemsLeft() > 0) { S.items.die--; S.dieChoose = false; const cap = []; spendCap(cap); msgs = roll(Number(arg)); msgs.splice(1, 0, ...cap); } break;
      case "merchleave": S.level.shopOpen = false; S.level.used[S.level.pos] = true; msgs = ["You wave goodbye to the merchant. Roll when ready."]; break;
      case "wbnow": if (S.level && S.level.encounter) { S.level.encounter = false; msgs = wbBattle(true); } break;
      case "wbignore": if (S.level && S.level.encounter) { S.level.encounter = false; msgs = [`You slip past ${S.wboss.name} for now. It will wait at camp for 24 hours. Roll when ready.`]; } break;
      case "lead": S.level.lead = arg; msgs = [`${S.mons[arg].name} is now your lead monster.`]; break;
      case "potionboard": { const m = []; if (usePotion(S.mons[arg], m)) msgs = m; break; }
      case "useboard": { const [id, t] = String(arg).split(":"); const m = []; if (useItem(id, t, m, false)) msgs = m; break; }
      case "use": msgs = act("use", arg); break;
      case "leave": S.confirm = "leave"; msgs = ["Leave the level? Choose Yes, leave, or Keep playing."]; break;
      case "leaveyes": msgs = backToCamp("You left the level and returned to camp. Your team is restored."); break;
      case "continue": S.battle = null; S.screen = "level"; fixLead(); msgs = [`Back on the board at space ${S.level.pos + 1} of ${BOARD_SIZE}. ${leadMon().name} leads. Roll when ready.`]; break;
      case "towheel": S.battle = null; S.wheel = { spun: false }; S.screen = "wheel"; msgs = ["Spin the reward wheel to claim your prize."]; break;
      case "spin": if (!S.wheel.spun) msgs = spin(); break;
      case "camp": msgs = backToCamp(S.battle && S.battle.wboss && S.battle.fromLevel ? "Back at camp. That level attempt has ended, and your team is fully restored." : "Back at camp. Your team is fully restored."); break;
      // Battle
      case "skill": msgs = act("skill", Number(arg)); break;
      case "switch": msgs = act("switch", arg); break;
      case "capture": msgs = act("capture", arg); break;
      case "potion": msgs = act("potion"); break;
      case "retreat": msgs = act("retreat"); break;
    }
    if (msgs && S.screen === "level" && S.level && S.level.shopOpen && a !== "buy") S.dieChoose = false;
    const len = finish(msgs, quiet);
    if (beginAuto) autoBegin();
    return len;
  }
