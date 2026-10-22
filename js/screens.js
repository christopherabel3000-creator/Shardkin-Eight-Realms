// Shardkin: Eight Realms — Rendering every screen and camp area.
// Files share one global scope and load in the order listed in index.html.
"use strict";

  // ---------- Rendering ----------
  function chip(el) { return `<span class="chip" style="color: var(--el-${el.toLowerCase()})">${el}</span>`; }
  function hpColor(f) { return f > 0.5 ? "var(--hp-good)" : f > 0.2 ? "var(--hp-mid)" : "var(--hp-low)"; }
  function hpBar(m) {
    const f = m.hp / m.maxHp;
    return `<div class="bar" aria-hidden="true"><i style="width:${(f * 100).toFixed(1)}%; background:${hpColor(f)}"></i></div>`;
  }
  function statusText(m) { return m.status ? ` · ${cap(STATUS_WORD[m.status.type])}` : ""; }
  function monCard(m, prefix, extra) {
    return `<div class="mon">
      <p class="name">${prefix}${m.name}</p>
      <p class="tags">${chip(m.el)}<span class="chip plain">${m.rarity}</span><span class="chip plain">Level ${m.level}</span>${m.shard ? `<span class="chip" style="color: var(--accent)">Shardborn</span>` : ""}${m.status ? `<span class="chip" style="color: var(--hp-mid)">${cap(STATUS_WORD[m.status.type])}</span>` : ""}</p>
      <p class="stat">Health ${m.hp} of ${m.maxHp}</p>
      ${hpBar(m)}
      ${extra || ""}
    </div>`;
  }
  function xpLine(m) {
    return `<p class="stat muted">Experience ${m.xp} of ${xpNeed(m.level)} to level ${m.level + 1}</p>
      <div class="bar xpbar" aria-hidden="true"><i style="width:${(m.xp / xpNeed(m.level) * 100).toFixed(1)}%"></i></div>`;
  }
  function btn(action, arg, label, sub, primary, pressed) {
    const ap = pressed === undefined ? "" : ` aria-pressed="${pressed}"`;
    return `<button type="button" class="${primary ? "primary" : ""}" data-a="${action}" data-arg="${arg}"${ap}><span class="bn">${label}</span>${sub ? `<span class="sub">${sub}</span>` : ""}</button>`;
  }
  function sec(id, title, inner) { return `<section aria-labelledby="${id}"><h2 id="${id}">${title}</h2>${inner}</section>`; }
  function sub3(text, top) { return `<h3 class="muted" style="margin:${top ? 16 : 0}px 0 8px;font-size:1rem">${text}</h3>`; }
  function nextForm(m) {
    const f = SP[m.id].forms;
    if (m.stage + 1 >= f.length) return "";
    return m.stage === 0 ? ` · Evolves into ${f[1]} at level ${EVOLVE_LEVEL}` : ` · Final form ${f[2]} needs the ${crestName(m.id)}`;
  }
  function monLine(m) { return `${m.el} · ${m.rarity}${m.shard ? " Shardborn" : ""} · Level ${m.level} · Health ${m.hp} of ${m.maxHp}${m.infuse ? ` · Infused ${m.infuse} of 5` : ""}${statusText(m)}`; }
  function itemsLine() {
    const pl = (n, one, many) => `${n} ${n === 1 ? one : many}`;
    const crests = Object.entries(S.items.crests).filter(([, n]) => n > 0).map(([c, n]) => pl(n, c, c + "s"));
    const items = ["potion", "superpotion", "revive", "tonic", "orb", "gorb", "grorb", "perfect", "fury", "ward", "die"]
      .filter(id => (S.items[id] || 0) > 0 || ["potion", "orb"].includes(id)).map(id => pl(S.items[id] || 0, ITEM_INFO[id].name, ITEM_INFO[id].plural));
    const myth = Object.values(S.items.mythic || {}).reduce((a, b) => a + b, 0);
    return [`${S.coins} Shard Dust`, `${S.gems || 0} Coin${S.gems === 1 ? "" : "s"}`, ...items, ...(myth ? [`${myth} Mythic egg${myth === 1 ? "" : "s"}`] : []), pl(eggCount(), "egg", "eggs"), pl(shardCount(), "elemental shard", "elemental shards"), ...crests].join(" · ");
  }

  const TABS = [
    ["levels", "Levels"], ["team", "Team and base"], ["quests", "Quests"], ["arena", "Arena"], ["shop", "Shop"], ["premium", "Coin Shop"], ["synth", "Synthesis"],
    ["build", "Buildings"], ["train", "Training"], ["exped", "Expeditions"], ["hatch", "Hatchery"], ["ach", "Achievements"], ["forge", "Shard Forge"], ["story", "Story"], ["save", "Settings"]
  ];
  function tabLocked(t) {
    if (t === "shop") return S.player.level < 2 ? "unlocks at Shardbinder level 2" : "";
    if (t === "synth") return S.items.scrolls.length ? "" : "needs a Scroll of Synthesis";
    if (t === "build") return S.player.level < YARD.unlock ? `unlocks at Shardbinder level ${YARD.unlock}` : "";
    if (t === "train") return S.yard ? "" : "needs the Training Yard";
    if (t === "quests") return S.player.level < 2 ? "unlocks at Shardbinder level 2" : "";
    if (t === "arena") return S.player.level < ARENA.unlock ? `unlocks at Shardbinder level ${ARENA.unlock}` : "";
    if (t === "exped") return S.exped ? "" : "needs the Expedition Dock";
    if (t === "hatch") return S.hatch ? "" : "needs the Hatchery";
    if (t === "forge") return S.forge ? "" : (S.player.level < FORGE.unlock ? `unlocks at Shardbinder level ${FORGE.unlock}` : "needs the Shard Forge building");
    return "";
  }
  // The main menu groups every camp area; opening one shows only that area, with a way back.
  const MENU = [
    ["Adventure", ["levels", "arena"]],
    ["Monsters", ["team", "synth", "train", "exped", "hatch"]],
    ["Camp", ["shop", "premium", "forge", "quests", "build", "ach", "story", "save"]]
  ];
  function tabLabel(id) { return TABS.find(t => t[0] === id)[1]; }
  // A short note on each menu button, so you can see what needs attention without opening it.
  function tabNote(id) {
    const lock = tabLocked(id);
    if (lock) return `Locked: ${lock}`;
    if (id === "levels") {
      const w = highestOpen(), notes = [`Up to World ${w}, the ${world(w).title}`];
      if (S.wboss) notes.push(`World boss active, ${S.wfights.count} fight${S.wfights.count === 1 ? "" : "s"} ready`);
      return notes.join(" · ");
    }
    if (id === "arena") return `Best floor ${S.arena.best}`;
    if (id === "team") { const rc = readyCrests(); return `${S.team.length} of 4 on your team · ${Object.keys(S.mons).length - S.team.length} in your base${rc.length ? ` · Crest ready for ${rc.map(m => m.name).join(", ")}` : ""}`; }
    if (id === "synth") return `${S.items.scrolls.length} scroll${S.items.scrolls.length === 1 ? "" : "s"}`;
    if (id === "train") { const st = trainingStatus(); return !st ? "Nothing training" : st.done ? "Training complete, ready to finish" : `${S.mons[S.training.session.uid].name} is training`; }
    if (id === "exped") { const back = S.exped.list.filter(x => expLeft(x) <= 0).length; return back ? `${back} back and waiting` : `${S.exped.list.length} of ${dockSlots()} away`; }
    if (id === "hatch") { const ready = S.hatch.incub.filter(x => hatchLeft(x) <= 0).length; return ready ? `${ready} egg${ready === 1 ? "" : "s"} ready to hatch` : `${S.hatch.incub.length} of ${S.hatch.slots} incubating · ${eggCount()} eggs waiting`; }
    if (id === "shop") return `${S.coins} Shard Dust`;
    if (id === "premium") return `${S.gems || 0} Coins${S.lure ? " · Shardborn Lure ready" : ""}`;
    if (id === "quests") { ensureQuests(); const ready = [...S.quests.daily, ...S.quests.weekly].filter(q => !q.claimed && questProgress(q) >= q.n).length; return ready ? `${ready} reward${ready === 1 ? "" : "s"} ready to claim` : "No rewards ready yet"; }
    if (id === "build") { const p = minePending(); return p > 0 ? `${p} Shard Dust ready at the Shard Mine` : ""; }
    if (id === "ach") return `${S.ach.length} of ${ACH.length} earned`;
    if (id === "save") return "Sound test, save codes and backups";
    if (id === "forge") return `${shardCount()} elemental shards`;
    if (id === "story") return "The tale of the Heartcrystal";
    return "";
  }
  function renderCamp() {
    const P = S.player;
    if (S.campTab && !TABS.some(t => t[0] === S.campTab)) S.campTab = null;
    if (!S.campTab) {
      let h = sec("h-camp", "Main menu", `<div class="actions">
        <p>Shardbinder level ${P.level}. ${P.xp} of ${pNeed(P.level)} experience to level ${P.level + 1}.</p>
        <div class="bar xpbar" aria-hidden="true"><i style="width:${(P.xp / pNeed(P.level) * 100).toFixed(1)}%"></i></div>
        <p class="muted">${itemsLine()}</p></div>`);
      for (const [group, ids] of MENU) {
        let nav = `<div class="pair">`;
        for (const id of ids) nav += btn("tab", id, tabLabel(id), tabNote(id), false);
        h += sec("h-menu-" + group.toLowerCase(), group, nav + `</div>`);
      }
      return h;
    }
    const lab = tabLabel(S.campTab), lock = tabLocked(S.campTab);
    const back = `<div class="actions">${btn("menu", "", "Back to main menu", "")}</div>`;
    const body = lock ? `<p class="muted">${lab} is locked: it ${lock}.</p>`
      : { levels: tabLevels, team: tabTeam, quests: tabQuests, arena: tabArena, shop: tabShop, premium: tabPremium, synth: tabSynth, build: tabBuild, train: tabTrain, exped: tabExped, hatch: tabHatch, ach: tabAch, forge: tabForge, story: tabStory, save: tabSave }[S.campTab]();
    return back + sec("h-tab", lab, body) + back;
  }
  function wbPanel() {
    if (!S.wboss) return "";
    const W = S.wboss, F = S.wfights;
    let t = `<div class="row"><p class="nm">World boss: ${W.name}</p>
      <p>${W.el} · Level ${W.level} · Health ${W.hp} of ${W.maxHp} · Leaves in ${dur(W.expires - now())}</p>
      ${hpBar(W)}
      <p class="muted">Fights available: ${F.count} of ${WB.maxFights}${F.count < WB.maxFights ? ` · Next fight in ${dur(F.last + WB.fightEvery - now())}` : ""}</p>`;
    t += F.count > 0 ? btn("wbfight", "", `Fight ${W.name}`, "Your team starts fully healed. Damage carries over.", true) : btn("refresh", "", "Check again", "Updates fights available");
    return t + `</div>`;
  }
  function tabLevels() {
    let lv = `<div class="actions">` + wbPanel();
    if (!S.worldView || !worldOpen(S.worldView)) S.worldView = highestOpen();
    lv += sub3("Choose a world", !!S.wboss) + `<div class="pair">`;
    let shownLocked = false;
    WORLDS.forEach((W, i) => {
      const w = i + 1, sel = S.worldView === w;
      if (worldOpen(w)) lv += btn("world", w, `World ${w}: The ${W.title}${sel ? " (open)" : ""}`, `${W.name} · ${prog(w).cleared.length} of ${W.levels} levels cleared${worldCleared(w) ? " · Complete" : ""}`, sel, sel);
      else if (!shownLocked) { shownLocked = true; lv += `<p class="muted">World ${w}: locked until you clear World ${w - 1}.</p>`; }
    });
    lv += `</div>`;
    const w = S.worldView, W = world(w), P = prog(w);
    lv += sub3(`World ${w}: The ${W.title}`, true) + `<p class="muted">${W.lore} Wild ${W.name} monsters live here.</p>`;
    for (let n = 1; n <= W.levels; n++) {
      const [lo, hi] = wildRange(w, n), done = P.cleared.includes(n);
      if (n <= P.unlocked) {
        lv += btn("level", `${w}-${n}`, `Play World ${w}, Level ${n}`, `Wild monsters level ${lo} to ${hi}${done ? " · Cleared" : ""}${n === W.levels && done ? " · Replays can win a final-form crest" : ""}`, n === P.unlocked && !done);
        if (done) lv += btn("autolevel", `${w}-${n}`, `Auto-play World ${w}, Level ${n}`, `Rolls and fights for you${prefs().repeat ? " · Repeats until stopped" : ""}`);
      }
      else { lv += `<p class="muted">Levels ${n} to ${W.levels}: locked. Clear Level ${n - 1} first.</p>`; break; }
    }
    if (P.cleared.length) {
      const A = prefs();
      lv += sub3("Auto-play settings", true) + `<p class="muted">Auto-play works on levels you've cleared. You can also change these while it runs.</p><div class="pair">`;
      lv += btn("autopref", "speed", `Speed: ${SPEED_NAME[A.speed]}`, "Slow, normal or fast");
      lv += btn("autopref", "repeat", `Repeat the level: ${A.repeat ? "on" : "off"}`, "Start the level again after each clear", false, A.repeat);
      lv += btn("autopref", "potions", `Use Potions: ${A.potions ? "on" : "off"}`, "When a monster drops below 30% health", false, A.potions);
      lv += btn("autopref", "capture", `Catch new monsters: ${A.capture ? "on" : "off"}`, "Throws Binding Shards at monsters you don't have yet, and at every Shardborn", false, A.capture);
      lv += `</div>`;
    }
    return lv + `</div>`;
  }
  function tabTeam() {
    let tm = sub3(`Your team (${S.team.length} of 4)`) + `<div class="actions">`;
    teamMons().forEach((m, i) => {
      tm += `<div class="row"><p class="nm">${i === 0 ? "Lead: " : ""}${m.name}${inTraining(m.uid) ? " (training)" : ""}</p><p class="muted">${monLine(m)} · Experience ${m.xp} of ${xpNeed(m.level)}${nextForm(m)}</p>`;
      const b = [];
      if (i > 0) b.push(btn("makefirst", m.uid, `Make ${m.name} the lead`));
      if (S.team.length > 1) b.push(btn("remove", m.uid, `Send ${m.name} to base`));
      b.push(...crestBtns(m));
      if (b.length) tm += `<div class="${b.length === 2 ? "pair" : "actions"}">${b.join("")}</div>`;
      tm += `</div>`;
    });
    tm += `</div>`;
    const base = Object.values(S.mons).filter(m => !S.team.includes(m.uid));
    tm += sub3(`Your base (${base.length})`, true);
    if (!base.length) tm += `<p class="muted">Nothing here yet. Monsters you capture are sent to your base.</p>`;
    else {
      tm += `<div class="actions">`;
      for (const m of base) {
        tm += `<div class="row"><p class="nm">${m.name}${inTraining(m.uid) ? " (training)" : ""}${onExped(m.uid) ? " (on expedition)" : ""}</p><p class="muted">${monLine(m)}${nextForm(m)}</p>`;
        const b = [];
        if (onExped(m.uid)) {} else if (S.team.length < 4) b.push(btn("add", m.uid, `Add ${m.name} to team`));
        else tm += `<p class="muted">Team is full.</p>`;
        b.push(...crestBtns(m));
        if (b.length) tm += `<div class="actions">${b.join("")}</div>`;
        tm += `</div>`;
      }
      tm += `</div>`;
    }
    const counts = ELEMENTS.map(el => `${poolIds(el).filter(id => S.dex.includes(id)).length} of 15 ${el}`).join(", ");
    return tm + `<p class="muted" style="margin-top:12px">Collection: ${S.dex.length} of 120 monsters. ${counts}. Shardborn caught: ${S.shardDex.length} of 120.</p>`;
  }
  function crestBtns(m) {
    if (m.stage !== 1 || SP[m.id].forms.length < 3) return [];
    const c = crestName(m.id);
    return (S.items.crests[c] || 0) > 0 ? [btn("crest", m.uid, `Use the ${c} on ${m.name}`, `Evolves it into ${SP[m.id].forms[2]}`, true)] : [];
  }
  function shopButtons(ids, showLocked) {
    let s = "";
    for (const it of SHOP.filter(x => !ids || ids.includes(x.id))) {
      const have = S.items[it.id] || 0;
      if (!itemOpen(it.id)) { if (showLocked) s += `<p class="muted">${it.name}: in stock once you reach World ${ITEM_INFO[it.id].w}. ${it.desc}.</p>`; continue; }
      s += S.coins >= it.price ? btn("buy", it.id, `Buy ${it.name} for ${it.price} Shard Dust`, `${it.desc} · You have ${have}`) : `<p class="muted">${it.name}: ${it.price} Shard Dust. ${it.desc}. You have ${have}. Not enough Shard Dust.</p>`;
    }
    return s;
  }
  function tabShop() {
    let s = `<div class="actions"><p>You have ${S.coins} Shard Dust.</p>` + shopButtons(null, true);
    const held = Object.entries(S.items.crests).filter(([, n]) => n > 0);
    if (held.length) {
      s += sub3("Crest Exchange", true) + `<p class="muted">Trade a crest for a random different crest of the same element, for ${CREST_SWAP} Shard Dust each.</p>`;
      for (const [c, n] of held) {
        const id = Object.keys(SP).find(x => SP[x].forms.length === 3 && crestName(x) === c);
        const owned = Object.values(S.mons).some(m => m.id === id);
        s += S.coins >= CREST_SWAP ? btn("crestx", c, `Exchange the ${c} for another ${SP[id].el} crest`, `You have ${n}${owned ? ` · You own a ${SP[id].forms[0]} line monster that can use it` : ""}`) : `<p class="muted">${c}: you have ${n}. Exchanging costs ${CREST_SWAP} Shard Dust.</p>`;
      }
      s += sub3("Scrolls", true);
    }
    for (const [rid, r] of Object.entries(RECIPES)) {
      if (!r.price || S.items.scrolls.includes(rid)) continue;
      if (!worldOpen(elementWorld(r.el))) continue;
      s += S.coins >= r.price ? btn("buyscroll", rid, `Buy ${r.name} for ${r.price} Shard Dust`, r.desc + " Scrolls are never used up.") : `<p class="muted">${r.name}: ${r.price} Shard Dust. ${r.desc} Not enough Shard Dust.</p>`;
    }
    return s + `</div>`;
  }
  function tabPremium() {
    const G = S.gems || 0;
    let s = `<div class="actions"><p>You have ${G} Coin${G === 1 ? "" : "s"}.</p><p class="muted">Coins are rare. You earn them only from milestones: ${GEM.achievement} per achievement, ${GEM.weeklyQuest} per weekly quest, ${GEM.worldBoss} per world boss, ${GEM.shardborn} per Shardborn caught, ${GEM.arena10} per tenth Arena floor, and more for clearing each world for the first time (${worldCoins(1)} for World 1, rising to ${worldCoins(8)} for World 8).</p>`;
    const can = n => G >= n;
    s += sub3("Mythic Egg", true) + `<p class="muted">Guaranteed to hatch an Epic (80%) or a Legendary (20%) of the element you choose. Costs ${PREMIUM.mythic} Coins. Hatch it in the Hatchery like any egg.</p>`;
    for (const el of openElements()) s += can(PREMIUM.mythic) ? btn("buymythic", el, `Buy a Mythic ${el} egg for ${PREMIUM.mythic} Coins`) : "";
    if (!can(PREMIUM.mythic)) s += `<p class="muted">You need ${PREMIUM.mythic - G} more Coins.</p>`;
    s += sub3("Shardborn Lure", true) + `<p class="muted">Makes Shardborn ten times more likely for your next level, including auto-play. Costs ${PREMIUM.lure} Coins.</p>`;
    s += S.lure ? `<p>A lure is ready. It will be used on the next level you start.</p>` : can(PREMIUM.lure) ? btn("buylure", "", `Buy a Shardborn Lure for ${PREMIUM.lure} Coins`) : `<p class="muted">You need ${PREMIUM.lure - G} more Coins.</p>`;
    s += sub3("Prism Shards", true) + (can(PREMIUM.prisms) ? btn("buyprisms", "", `Buy 3 Prism Shards for ${PREMIUM.prisms} Coins`, "100% capture chance each") : `<p class="muted">3 Prism Shards cost ${PREMIUM.prisms} Coins.</p>`);
    s += sub3("Hurry", true) + `<p class="muted">Finish a training session, an egg or an expedition right away for ${PREMIUM.hurry} Coins each. Look for Finish now buttons in Training, Hatchery and Expeditions.</p>`;
    s += sub3("Chosen Crest", true) + `<p class="muted">Pick the exact final-form crest you want for ${PREMIUM.crest} Coins. Crests for monsters you own are listed.</p>`;
    const owned = [...new Set(Object.values(S.mons).filter(m => SP[m.id].forms.length === 3).map(m => m.id))];
    if (!owned.length) s += `<p class="muted">You don't own any Epic or Legendary monsters yet.</p>`;
    for (const id of owned) {
      const c = crestName(id);
      s += can(PREMIUM.crest) ? btn("buycrest", id, `Buy the ${c} for ${PREMIUM.crest} Coins`, `For ${SP[id].forms[0]}'s line · You have ${S.items.crests[c] || 0}`) : `<p class="muted">${c}: ${PREMIUM.crest} Coins. You have ${S.items.crests[c] || 0}.</p>`;
    }
    return s + `</div>`;
  }
  function tabSynth() {
    let s = `<div class="actions"><p class="muted">Ingredient monsters are used up and merge into the new monster. Scrolls are never used up. The new monster's level matches the highest ingredient and it goes to your base.</p>`;
    for (const rid of S.items.scrolls) {
      const R = RECIPES[rid], open = S.synth && S.synth.recipe === rid;
      if (!R) continue;
      s += btn("scroll", rid, R.name + (open ? " (open)" : ""), R.desc, open, open);
      if (!open) continue;
      const picks = S.synth.picks.map(id => S.mons[id]).filter(Boolean);
      const elig = synthEligible(R);
      s += `<div class="row"><p class="nm">Choose ${R.slots.length} ingredients</p><p class="muted">Selected: ${picks.length ? picks.map(p => p.name).join(", ") : "none"}.</p>`;
      if (!elig.length) s += `<p class="muted">You don't have any monsters that fit this recipe yet.</p>`;
      for (const m of elig) {
        const sel = S.synth.picks.includes(m.uid);
        s += btn("pick", m.uid, `${sel ? "Selected: " : "Select "}${m.name}`, `${m.rarity} · Level ${m.level}${S.team.includes(m.uid) ? " · On your team" : ""}`, false, sel);
      }
      if (slotsMatch(R, picks)) s += btn("synth", rid, "Synthesize", `Combine ${picks.map(p => p.name).join(" and ")} into a ${R.result} ${R.el} monster`, true);
      s += `</div>`;
    }
    return s + `</div>`;
  }
  function tabBuild() {
    let s = `<div class="actions">`;
    s += `<div class="row"><p class="nm">Training Yard</p><p class="muted">Train one monster at a time, from your team or base, for a full level's worth of experience. It can still battle while training.</p>`;
    if (S.yard) {
      const yl = yardLvl();
      s += `<p>Level ${yl}: each session trains ${yl} level${yl === 1 ? "" : "s"}' worth of experience in ${trainHours()} hours.</p>`;
      if (yl < 3) s += S.coins >= YARD.up[yl + 1] ? btn("upyard", "", `Upgrade to level ${yl + 1} for ${YARD.up[yl + 1]} Shard Dust`, yl + 1 === 2 ? "Sessions train two levels' worth" : "Sessions train three levels' worth and take 2 hours") : `<p class="muted">Upgrade to level ${yl + 1}: ${YARD.up[yl + 1]} Shard Dust. You have ${S.coins}.</p>`;
    }
    else s += S.coins >= YARD.cost ? btn("buildyard", "", `Build for ${YARD.cost} Shard Dust`, "", true) : `<p class="muted">Costs ${YARD.cost} Shard Dust. You have ${S.coins}.</p>`;
    s += `</div><div class="row"><p class="nm">Shard Mine</p><p class="muted">Earns Shard Dust and some elemental shards over time, even while you're away. Holds up to ${MINE.capHours} hours of earnings.</p>`;
    if (S.player.level < MINE.unlock) s += `<p class="muted">Unlocks at Shardbinder level ${MINE.unlock}.</p>`;
    else if (!S.mine) s += S.coins >= MINE.cost[0] ? btn("buildmine", "", `Build for ${MINE.cost[0]} Shard Dust`, `Earns ${MINE.rate[1]} Shard Dust per hour`, true) : `<p class="muted">Costs ${MINE.cost[0]} Shard Dust. You have ${S.coins}.</p>`;
    else {
      const lv = S.mine.lvl, pend = minePending();
      s += `<p>Level ${lv}. Earns ${MINE.rate[lv]} Shard Dust per hour. ${pend} Shard Dust ready to collect.</p>`;
      s += btn("collect", "", `Collect ${pend} Shard Dust`, "", true);
      if (mineShardsPending()) s += `<p>${mineShardsPending()} elemental shard${mineShardsPending() === 1 ? "" : "s"} also waiting.</p>`;
      if (lv < MINE.max) s += S.coins >= MINE.cost[lv] ? btn("upmine", "", `Upgrade to level ${lv + 1} for ${MINE.cost[lv]} Shard Dust`, `Earns ${MINE.rate[lv + 1]} Shard Dust per hour`) : `<p class="muted">Upgrade to level ${lv + 1}: ${MINE.cost[lv]} Shard Dust.</p>`;
      s += btn("refresh", "", "Check again", "Updates Shard Dust ready to collect");
    }
    s += `</div><div class="row"><p class="nm">Shard Forge</p><p class="muted">Turns elemental shards into items and eggs, and infuses monsters to make them stronger.</p>`;
    if (S.player.level < FORGE.unlock) s += `<p class="muted">Unlocks at Shardbinder level ${FORGE.unlock}.</p>`;
    else if (!S.forge) s += S.coins >= FORGE.cost ? btn("buildforge", "", `Build for ${FORGE.cost} Shard Dust`, "", true) : `<p class="muted">Costs ${FORGE.cost} Shard Dust. You have ${S.coins}.</p>`;
    else s += `<p>Built. Open the Shard Forge from the main menu.</p>`;
    s += `</div><div class="row"><p class="nm">Expedition Dock</p><p class="muted">Send up to ${dockSlots()} base monsters on 1, 4 or 8 hour expeditions for Shard Dust, items, experience and sometimes eggs.</p>`;
    if (S.player.level < DOCK.unlock) s += `<p class="muted">Unlocks at Shardbinder level ${DOCK.unlock}.</p>`;
    else if (!S.exped) s += S.coins >= DOCK.cost ? btn("builddock", "", `Build for ${DOCK.cost} Shard Dust`, "", true) : `<p class="muted">Costs ${DOCK.cost} Shard Dust. You have ${S.coins}.</p>`;
    else {
      s += `<p>Built with ${dockSlots()} expedition slots. Open the Expeditions tab to use it.</p>`;
      if (!S.exped.big) s += S.coins >= DOCK.upgrade ? btn("updock", "", `Expand to ${DOCK.bigSlots} slots for ${DOCK.upgrade} Shard Dust`) : `<p class="muted">Expanding to ${DOCK.bigSlots} slots costs ${DOCK.upgrade} Shard Dust.</p>`;
    }
    s += `</div><div class="row"><p class="nm">Hatchery</p><p class="muted">Incubates eggs for ${hatchHours()} hours until they hatch into a random monster of their element.</p>`;
    if (S.player.level < HATCHERY.unlock) s += `<p class="muted">Unlocks at Shardbinder level ${HATCHERY.unlock}.</p>`;
    else if (!S.hatch) s += S.coins >= HATCHERY.cost ? btn("buildhatch", "", `Build for ${HATCHERY.cost} Shard Dust`, "One incubator", true) : `<p class="muted">Costs ${HATCHERY.cost} Shard Dust. You have ${S.coins}.</p>`;
    else if (S.hatch.slots < 2) s += S.coins >= HATCHERY.upgrade ? btn("uphatch", "", `Add a second incubator for ${HATCHERY.upgrade} Shard Dust`) : `<p class="muted">Built with 1 incubator. A second costs ${HATCHERY.upgrade} Shard Dust.</p>`;
    else {
      s += `<p>Built with ${S.hatch.slots} incubators. Eggs take ${hatchHours()} hours. Open the Hatchery tab to use it.</p>`;
      if (!S.hatch.fast) s += S.coins >= HATCHERY.fastCost ? btn("fasthatch", "", `Warm the incubators for ${HATCHERY.fastCost} Shard Dust`, `Eggs hatch in ${HATCHERY.fastHours} hours instead of ${HATCHERY.hours}`) : `<p class="muted">Warmer incubators (eggs hatch in ${HATCHERY.fastHours} hours): ${HATCHERY.fastCost} Shard Dust.</p>`;
      if (S.hatch.slots < 3) s += S.coins >= HATCHERY.slot3 ? btn("hatch3", "", `Add a third incubator for ${HATCHERY.slot3} Shard Dust`) : `<p class="muted">A third incubator costs ${HATCHERY.slot3} Shard Dust.</p>`;
    }
    return s + `</div></div>`;
  }
  function tabTrain() {
    const T = S.training, st = trainingStatus();
    let s = `<div class="actions">`;
    s += `<p>Training mode: ${T.mode === "time" ? `time-based, ${trainHours()} hours of real time` : `experience-based, finishes after you earn ${TRAIN.pxp} Shardbinder experience`}.</p>`;
    if (!T.session) s += btn("mode", "", `Switch to ${T.mode === "time" ? "experience-based" : "time-based"} training`, T.mode === "time" ? "Good for long play sessions" : "Good for a few minutes a day");
    else s += `<p class="muted">You can change modes once this session is finished.</p>`;
    if (T.session) {
      const m = S.mons[T.session.uid];
      s += `<div class="row"><p class="nm">${m.name} is training</p><p>${st.text}</p>`;
      s += st.done ? btn("trainclaim", "", `Finish training`, `${m.name} gains ${trainAmount(m)} experience`, true) : btn("refresh", "", "Check again", "Updates the time left") + btn("hurry", "train", `Finish now for ${PREMIUM.hurry} Coins`, `You have ${S.gems || 0} Coins`);
      s += `</div>`;
    } else {
      for (const m of [...teamMons(), ...Object.values(S.mons).filter(m => !S.team.includes(m.uid) && !onExped(m.uid))]) s += btn("train", m.uid, `Train ${m.name}`, `${S.team.includes(m.uid) ? "On your team" : "In your base"} · Level ${m.level} · Will gain ${trainAmount(m)} experience`);
    }
    return s + `</div>`;
  }
  function tabQuests() {
    ensureQuests();
    let s = `<div class="actions"><p class="muted">Daily quests reset at midnight and weekly quests on Monday. Progress counts from when a quest appears.</p>`;
    for (const [kind, title] of [["daily", "Daily quests"], ["weekly", "Weekly quests"]]) {
      s += sub3(title, kind === "weekly");
      S.quests[kind].forEach((q, i) => {
        const p = questProgress(q);
        s += `<div class="row"><p class="nm">${q.text}${q.claimed ? " (claimed)" : p >= q.n ? " (complete)" : ""}</p><p class="muted">Progress ${p} of ${q.n} · Reward: ${rewardText(q.reward)}</p>`;
        if (!q.claimed && p >= q.n) s += btn("claim", `${kind}-${i}`, "Claim reward", "", true);
        s += `</div>`;
      });
    }
    return s + `</div>`;
  }
  function tabArena() {
    let s = `<div class="actions"><p>Best floor: ${S.arena.best}.</p><p class="muted">Each floor is a rival's team, and every tenth floor is a champion with four monsters. Your team's health carries over between floors, so potions matter. Rewards: Shard Dust every floor, a Loaded Die every 5 floors, a Prism Shard and an egg every 10, and a crest every 25. Milestone rewards are paid the first time you reach them.</p>`;
    const cps = [1];
    for (let c = 11; c <= S.arena.best + 1; c += 10) cps.push(c);
    cps.reverse().forEach((c, i) => { s += btn("arenastart", c, `Start at floor ${c}`, `Rivals at level ${4 + 2 * c} · Your team starts fully healed`, i === 0); });
    return s + `</div>`;
  }
  function tabExped() {
    const E = S.exped;
    let s = `<div class="actions"><p class="muted">Send monsters from your base on expeditions. While away they can't battle, train or be used in synthesis. Up to ${dockSlots()} at a time.</p>`;
    s += sub3(`Away now (${E.list.length} of ${dockSlots()})`);
    if (!E.list.length) s += `<p class="muted">No one is away.</p>`;
    let pending = false;
    E.list.forEach((x, i) => {
      const m = S.mons[x.uid], left = expLeft(x);
      if (left > 0) pending = true;
      s += `<div class="row"><p class="nm">${m.name}</p><p class="muted">${x.hours}-hour expedition · ${left <= 0 ? "Back now" : dur(left) + " left"}</p>${left <= 0 ? btn("expcollect", i, `Welcome ${m.name} back`, "Collect what it found", true) : btn("hurry", `exp:${i}`, `Bring ${m.name} back now for ${PREMIUM.hurry} Coins`, `You have ${S.gems || 0} Coins`)}</div>`;
    });
    if (pending) s += btn("refresh", "", "Check again", "Updates the time left");
    if (E.list.length < dockSlots()) {
      s += sub3("Send a monster", true) + `<div class="pair">`;
      for (const h of DOCK.hours) s += btn("expdur", h, `${h} hour${h > 1 ? "s" : ""}${S.expDur === h ? " (chosen)" : ""}`, h === 8 ? "Chance of an egg" : "", S.expDur === h, S.expDur === h);
      s += `</div>`;
      const avail = Object.values(S.mons).filter(m => !S.team.includes(m.uid) && !onExped(m.uid) && !inTraining(m.uid));
      if (!avail.length) s += `<p class="muted">No monsters free in your base. Send a monster from your team to base first.</p>`;
      for (const m of avail) s += btn("expsend", m.uid, `Send ${m.name} for ${S.expDur} hour${S.expDur > 1 ? "s" : ""}`, `${m.rarity} · Level ${m.level} · About ${Math.round(S.expDur * (10 + m.level) * RARITY_COIN[m.rarity])} Shard Dust`);
    }
    return s + `</div>`;
  }
  function tabHatch() {
    const H = S.hatch;
    let s = `<div class="actions"><p class="muted">Eggs hatch after ${hatchHours()} hours into a random monster of their element, usually Common or Uncommon, sometimes rarer. Find eggs in treasure chests, from level bosses and world bosses, on 8-hour expeditions, in Arena milestones and from weekly quests.</p>`;
    s += sub3(`Incubators (${H.incub.length} of ${H.slots} in use)`);
    let pending = false;
    H.incub.forEach((x, i) => {
      const left = hatchLeft(x);
      if (left > 0) pending = true;
      const eggName = `${x.mythic ? "Mythic " : ""}${x.el} egg`;
      s += `<div class="row"><p class="nm">${eggName}</p><p class="muted">${left <= 0 ? "Ready to hatch" : dur(left) + " left"}</p>${left <= 0 ? btn("hatchnow", i, `Hatch the ${eggName}`, "", true) : btn("hurry", `hatch:${i}`, `Hatch it now for ${PREMIUM.hurry} Coins`, `You have ${S.gems || 0} Coins`)}</div>`;
    });
    if (pending) s += btn("refresh", "", "Check again", "Updates the time left");
    if (H.incub.length < H.slots) {
      const eggs = Object.entries(S.items.eggs).filter(([, n]) => n > 0);
      for (const [el, n] of Object.entries(S.items.mythic || {})) if (n > 0) s += btn("incubate", `mythic:${el}`, `Incubate a Mythic ${el} egg`, `You have ${n} · Hatches an Epic or Legendary`, true);
      s += sub3("Your eggs", true);
      if (!eggs.length && !Object.values(S.items.mythic || {}).some(n => n > 0)) s += `<p class="muted">No eggs yet.</p>`;
      for (const [el, n] of eggs) s += btn("incubate", el, `Incubate a ${el} egg`, `You have ${n}`);
    }
    return s + `</div>`;
  }
  function tabForge() {
    let s = `<div class="actions"><p class="muted">Spend elemental shards to forge items, or infuse a monster with shards of its own element to raise its stats by 3%, up to 5 times. Shards drop from wild monsters, level bosses, world bosses, treasure chests, shard storms, expeditions, the Arena and the Shard Mine.</p>`;
    const have = ELEMENTS.filter(el => (S.items.shards[el] || 0) > 0);
    if (!have.length) return s + `<p>You don't have any shards yet.</p></div>`;
    if (!S.forgeEl || !have.includes(S.forgeEl)) S.forgeEl = have[0];
    s += sub3("Choose an element") + `<div class="pair">`;
    for (const el of have) { const sel = S.forgeEl === el; s += btn("forgeel", el, `${el}: ${S.items.shards[el]} shards${sel ? " (open)" : ""}`, "", sel, sel); }
    s += `</div>`;
    const el = S.forgeEl, n = S.items.shards[el] || 0;
    s += sub3(`Forge with ${el} Shards (you have ${n})`, true);
    for (const r of FORGE_ITEMS.filter(r => itemOpen(r.id))) s += n >= r.cost ? btn("forge", r.id, `Forge ${r.name} from ${r.cost} ${el} Shards`, r.desc) : `<p class="muted">${cap(r.name)}: ${r.cost} ${el} Shards. ${r.desc}.</p>`;
    s += sub3(`Infuse ${el} monsters`, true);
    const mons = Object.values(S.mons).filter(m => m.el === el);
    if (!mons.length) s += `<p class="muted">You don't have any ${el} monsters.</p>`;
    for (const m of mons) {
      if ((m.infuse || 0) >= 5) { s += `<p class="muted">${m.name}, level ${m.level}: fully infused.</p>`; continue; }
      const c = infuseCost(m);
      s += n >= c ? btn("infuse", m.uid, `Infuse ${m.name} for ${c} ${el} Shards`, `Infusion ${m.infuse || 0} of 5 · Level ${m.level} · 3% stronger`) : `<p class="muted">${m.name}, level ${m.level}: infusion ${m.infuse || 0} of 5. The next costs ${c} ${el} Shards.</p>`;
    }
    return s + `</div>`;
  }
  function tabStory() {
    let s = `<div class="actions"><p>${PROLOGUE}</p>`;
    WORLDS.forEach((W, i) => { if (worldOpen(i + 1)) s += sub3(`World ${i + 1}: The ${W.title}`, true) + `<p>${W.lore}</p>`; });
    if (S.ach.includes("heart")) s += sub3("The Heartcrystal", true) + `<p>${EPILOGUE}</p>`;
    const locked = WORLDS.filter((W, i) => !worldOpen(i + 1)).length;
    if (locked) s += `<p class="muted">${locked} more chapter${locked === 1 ? "" : "s"} unlock as you open new worlds.</p>`;
    return s + `</div>`;
  }
  function tabAch() {
    let s = `<p class="muted" style="margin-bottom:8px">${S.ach.length} of ${ACH.length} earned.</p><ul class="clean">`;
    for (const a of ACH) s += `<li><strong>${a.name}</strong>: ${S.ach.includes(a.id) ? "earned" : "not yet"}. ${a.desc} Reward: ${a.reward}.</li>`;
    return s + `</ul>`;
  }
  function tabSave() {
    let sv = sub3("Sound test") + `<div class="actions"><p class="muted">Every element has its own attack sound, and stronger skills sound bigger. Words in a skill's name add layers: bites snap, beams and shots whistle in, slashes swish, slams thud, storms and waves swell, and roars or howls add a cry. A bright chime means a strong hit and a dull thud means a weak one. With headphones, your attacks come slightly from the right and your opponent's from the left.</p>`;
    if (!S.sound) sv += `<p>Sound effects are off. Turn them on with the button at the top of the page.</p>`;
    sv += `<div class="pair">`;
    for (const el of ELEMENTS) { const a = demoSkill(el, false), b = demoSkill(el, true); sv += btn("sndtest", el, `${el} attacks`, `${a.name}, then ${b.name}`); }
    sv += btn("sndtest", "strong", "Strong hit", "The chime for a strong matchup") + btn("sndtest", "weak", "Weak hit", "The thud for a weak matchup");
    sv += btn("sndtest", "miss", "Missed attack", "A whoosh that hits nothing") + btn("sndtest", "sides", "Left and right", "Your attack, then your opponent's");
    sv += `</div></div>` + sub3("Saved game", true);
    sv += `<div class="actions"><p class="muted">Progress saves automatically, but only in this browser on this device. To keep a backup or move your game to another device, copy your save code and keep it somewhere safe, like Notes or an email to yourself. On the other device, paste it into Load a save code.</p>`;
    sv += btn("copysave", "", "Copy save code", `Your current game: ${saveSummary(S)}`, true);
    if (exportCode) sv += `<label class="field" for="exportbox">Your save code</label><textarea id="exportbox" readonly>${exportCode}</textarea>`;
    sv += `</div>` + sub3("Load a save code", true) + `<div class="actions">`;
    if (S.confirm === "import" && pendingImport) {
      sv += `<p>This save code holds a game at ${saveSummary(pendingImport)}. Loading it replaces your current game at ${saveSummary(S)}. Your current game is kept as a backup you can go back to.</p>`;
      sv += `<div class="pair">${btn("importyes", "", "Yes, load this save")}${btn("cancel", "", "Keep my game", "", true)}</div>`;
    } else {
      sv += `<label class="field" for="importbox">Paste a save code</label><textarea id="importbox" autocomplete="off" autocapitalize="off" autocorrect="off" spellcheck="false"></textarea>`;
      sv += btn("importcheck", "", "Load this save code", "You'll be asked to confirm before anything changes");
    }
    if (hasBackup()) sv += btn("undoimport", "", "Go back to my game from before the last import", "Swaps the backup with your current game");
    sv += `</div>` + sub3("Start over", true);
    if (S.confirm === "reset") sv += `<div class="actions" style="margin-top:10px"><p>Start over? This erases your monsters, items and progress.</p><div class="pair">${btn("resetyes", "", "Yes, erase and start over")}${btn("cancel", "", "Keep my game", "", true)}</div></div>`;
    else sv += `<div class="actions" style="margin-top:10px">${btn("reset", "", "Start over", "Erase this saved game")}</div>`;
    return sv;
  }

  function renderLevel() {
    const L = S.level, lead = leadMon();
    let h = "";
    if (L.failed) return sec("h-board", `Level ${L.n} failed`, `<div class="actions">${btn("camp", "", "Return to camp", "Your team is restored. Captures and experience are kept.", true)}</div>`);
    if (L.encounter && autoOn()) return sec("h-wbfound", "World boss found", `<div class="actions">${monCard(S.wboss, "World boss ", "")}<p>Auto-play will slip past it. Fight it from camp within 24 hours.</p></div>`);
    if (L.encounter) {
      return sec("h-wbfound", "World boss found", `<div class="actions">${monCard(S.wboss, "World boss ", `<p class="muted">Fights available: ${S.wfights.count}. You earn one more every 2 hours, up to ${WB.maxFights}.</p>`)}
        ${btn("wbnow", "", "Fight it now", "Uses a fight and ends this level attempt", true)}
        ${btn("wbignore", "", "Ignore it for now", "Finish this level, then fight it from camp within 24 hours")}</div>`);
    }
    let track = `<div class="track" aria-hidden="true">`;
    for (let i = 0; i < BOARD_SIZE; i++) track += `<i class="${i === L.pos ? "here" : L.used[i] ? "done" : ""} ${i === BOARD_SIZE - 1 ? "boss" : ""}"></i>`;
    track += `</div>`;
    let rollBtns;
    if (L.shopOpen) {
      rollBtns = `<p>The wandering merchant is waiting. Buy below, then leave to keep rolling.</p>`;
    } else if (autoOn()) {
      rollBtns = `<p class="muted">Auto-play is rolling for you.</p>`;
    } else if (S.dieChoose) {
      rollBtns = `<p>Choose your roll.</p><div class="pair">`;
      for (let r = 1; r <= 6; r++) rollBtns += btn("dieroll", r, `Move ${r}`, `Land on space ${Math.min(BOARD_SIZE, L.pos + r + 1)}: ${spaceLabel(Math.min(BOARD_SIZE - 1, L.pos + r))}`);
      rollBtns += `</div>${btn("diecancel", "", "Cancel", "Keep your Loaded Die")}`;
    } else {
      rollBtns = btn("roll", "", "Roll the die", `${lead.name} leads · Health ${lead.hp} of ${lead.maxHp}`, true);
      if (S.items.die > 0) rollBtns += btn("die", "", "Use a Loaded Die", `${S.items.die} left · Choose your roll`);
    }
    h += sec("h-board", `World ${L.w}, Level ${L.n} board`, `<div class="actions">
      <p class="stat">Space ${L.pos + 1} of ${BOARD_SIZE}. The boss is ${BOARD_SIZE - 1 - L.pos} spaces away.</p>
      ${L.lure ? `<p>Your Shardborn Lure is active for this level.</p>` : ""}${L.storm ? `<p>A shard storm is raging. Shardborn are ten times more likely for the rest of this level.</p>` : ""}
      ${track}${rollBtns}</div>`);
    if (L.shopOpen && !autoOn()) h += sec("h-merchant", "Wandering merchant", `<div class="actions"><p>You have ${S.coins} Shard Dust.</p>${shopButtons(["potion", "superpotion", "revive", "orb", "gorb", "fury", "ward", "die"])}${btn("merchleave", "", "Leave the merchant", "Back to the board", true)}</div>`);
    let ahead = `<ol class="clean">`;
    for (let i = L.pos + 1; i <= Math.min(BOARD_SIZE - 1, L.pos + 6); i++) ahead += `<li>Space ${i + 1}: ${spaceLabel(i)}</li>`;
    h += sec("h-ahead", "Look ahead", ahead + `</ol>`);
    let tm = `<div class="actions">`;
    for (const m of teamMons()) {
      tm += `<div class="row"><p class="nm">${m.uid === L.lead ? "Lead: " : ""}${m.name}${m.hp <= 0 ? " (fainted)" : ""}</p><p class="muted">${monLine(m)}</p>${hpBar(m)}`;
      const b = [];
      if (autoOn()) { tm += `</div>`; continue; }
      if (m.hp > 0 && m.uid !== L.lead) b.push(btn("lead", m.uid, `Make ${m.name} the lead`));
      for (const id of ["potion", "superpotion"]) if (itemOpen(id) && m.hp > 0 && m.hp < m.maxHp && S.items[id] > 0) b.push(btn("useboard", `${id}:${m.uid}`, `Use ${an(iname(id, 1))} on ${m.name}`, `${S.items[id]} left`));
      if (itemOpen("revive") && m.hp <= 0 && S.items.revive > 0) b.push(btn("useboard", `revive:${m.uid}`, `Use a Revive Shard on ${m.name}`, `${S.items.revive} left · Back with half its health`));
      if (b.length) tm += `<div class="${b.length === 2 ? "pair" : "actions"}">${b.join("")}</div>`;
      tm += `</div>`;
    }
    h += sec("h-lteam", "Your team", tm + `</div>`);
    h += sec("h-bag", "Bag", `<div class="actions"><p>${itemsLine()}</p>${!autoOn() && itemOpen("tonic") && S.items.tonic > 0 && teamMons().some(m => m.hp > 0 && m.hp < m.maxHp) ? btn("useboard", "tonic", "Use a Team Tonic", `${S.items.tonic} left · Heals every standing team monster by half`) : ""}</div>`);
    if (autoOn()) return h;
    let lv;
    if (S.confirm === "leave") lv = `<div class="actions"><p>Leave the level? It counts as a failed attempt, but you keep captures and experience.</p><div class="pair">${btn("leaveyes", "", "Yes, leave")}${btn("cancel", "", "Keep playing", "", true)}</div></div>`;
    else lv = `<div class="actions">${btn("leave", "", "Leave level", "Return to camp without finishing")}</div>`;
    return h + sec("h-leave", "Leave level", lv);
  }

  function renderBattle() {
    const B = S.battle, e = foe(), p = you();
    const shownFoe = e || B.enemies[B.enemies.length - 1];
    const heading = B.wboss ? "World boss" : B.arena ? `Arena floor ${B.floor}: ${B.rival}` : B.boss ? "Level boss" : "Opponent";
    let h = sec("h-foe", heading, monCard(shownFoe, foeWord() + " ",
      B.boss && !B.arena ? "" : `<p class="muted">Opponent team: ${B.enemies.length} monsters, ${foesLeft()} still standing.${S.dex.includes(shownFoe.id) ? "" : " Not in your collection yet."}</p>`));
    h += sec("h-you", "Your monster", monCard(p, "", xpLine(p)));
    if (autoOn()) return h + sec("h-log", "Battle log", `<ol class="log">${B.log.map(l => `<li>${l}</li>`).join("")}</ol>`);
    if (B.over) {
      let o = `<div class="actions">`;
      if (B.over === "win" && B.boss) o += btn("towheel", "", "Go to the reward wheel", "", true);
      else if (B.over === "win") o += btn("continue", "", "Continue on the board", `Space ${S.level.pos + 1} of ${BOARD_SIZE}`, true);
      else if (B.over === "wbdone" || B.over === "wbwin") o += btn("camp", "", "Return to camp", "Your team is restored", true);
      else if (B.over === "arenawin") { const alive = teamMons().filter(m => m.hp > 0).length; o += btn("arenanext", "", `Climb to floor ${B.floor + 1}`, `${alive} of ${S.team.length} monsters standing · Health carries over`, true) + btn("camp", "", "Leave the arena", "Your team is restored"); }
      else if (B.over === "arenalose") o += btn("camp", "", "Return to camp", "Your team is restored", true);
      else o += btn("camp", "", "Return to camp", "Your team is restored. Captures and experience are kept.", true);
      return h + sec("h-over", B.wboss ? "Fight over" : "Battle over", o + `</div>`);
    }
    let sk = `<div class="actions">`;
    if (B.forced) sk += `<p>${p.name} has fainted. Choose a monster under Switch monster.</p>`;
    else {
      unlocked(p).forEach((s, i) => { sk += btn("skill", i, s.name, `${s.el} · Power ${s.power} · Accuracy ${s.acc}%${s.st ? ` · ${s.stc}% chance to ${s.st === "sleep" ? "put it to sleep" : s.st}` : ""} · ${effWord(mult(s.el, e.el))} against ${e.name}`); });
      const locked = skillsOf(p).filter(s => p.level < s.unlock);
      if (locked.length) sk += `<ul class="clean muted">${locked.map(s => `<li>Locked: ${s.name}, unlocks at level ${s.unlock}</li>`).join("")}</ul>`;
    }
    h += sec("h-skills", "Skills", sk + `</div>`);
    let sw = `<div class="actions">`, others = 0;
    for (const m of teamMons()) {
      if (m.uid === B.active) continue;
      others++;
      if (m.hp <= 0) { sw += `<p class="muted">${m.name} has fainted.</p>`; continue; }
      sw += btn("switch", m.uid, `Send out ${m.name}`, `${m.el} · Level ${m.level} · Health ${m.hp} of ${m.maxHp}${statusText(m)} · ${effWord(Math.max(...unlocked(m).map(s => mult(s.el, e.el))))} matchup`, B.forced);
    }
    if (!others) sw += `<p class="muted">No other monsters on your team.</p>`;
    h += sec("h-switch", "Switch monster (free)", sw + `</div>`);
    if (!B.forced) {
      let it = `<div class="actions">`;
      if (B.boss) it += `<p class="muted">${B.wboss ? "World bosses" : B.arena ? "Rival monsters" : "Level bosses"} can't be captured.</p>`;
      else {
        let any = false;
        for (const id of ["orb", "gorb", "grorb"]) {
          if (!itemOpen(id) || !(S.items[id] > 0)) continue;
          any = true;
          const pct = Math.round(captureChance(e, id) * 100);
          it += btn("capture", id, `Throw ${an(iname(id, 1))}`, `${S.items[id]} left · ${pct}% chance on ${e.name}${e.status ? ` (boosted, it's ${STATUS_WORD[e.status.type]})` : ""} · Uses your turn`);
        }
        if (S.items.perfect > 0) { any = true; it += btn("capture", "perfect", "Throw a Prism Shard", `${S.items.perfect} left · 100% chance`); }
        if (!any) it += `<p class="muted">No capture items left.</p>`;
      }
      for (const id of ["potion", "superpotion"]) if (itemOpen(id) && S.items[id] > 0 && (p.hp < p.maxHp || (id === "superpotion" && p.status))) it += btn("use", `${id}:${p.uid}`, `Use ${an(iname(id, 1))} on ${p.name}`, `${S.items[id]} left · ${id === "potion" ? "Heals half of its health" : "Fully heals it"} · Uses your turn`);
      if (itemOpen("tonic") && S.items.tonic > 0 && teamMons().some(m => m.hp > 0 && m.hp < m.maxHp)) it += btn("use", "tonic", "Use a Team Tonic", `${S.items.tonic} left · Heals every standing team monster by half · Uses your turn`);
      if (itemOpen("revive") && S.items.revive > 0) for (const m of teamMons()) if (m.hp <= 0) it += btn("use", `revive:${m.uid}`, `Use a Revive Shard on ${m.name}`, `${S.items.revive} left · Back with half its health · Uses your turn`);
      for (const id of ["fury", "ward"]) if (itemOpen(id) && S.items[id] > 0 && !B[id]) it += btn("use", id, `Crush ${an(iname(id, 1))}`, `${S.items[id]} left · ${id === "fury" ? "50% more damage" : "A third less damage taken"} for the rest of this battle · Uses your turn`);
      const active = ["fury", "ward"].filter(id => B[id]).map(id => iname(id, 1));
      if (active.length) it += `<p>Active this battle: ${active.join(" and ")}.</p>`;
      it += `<p class="muted">Healing: ${["potion", "superpotion", "revive", "tonic"].filter(itemOpen).map(id => `${S.items[id] || 0} ${iname(id, S.items[id] || 0)}`).join(", ")}.</p>`;
      if (B.wboss) it += btn("retreat", "", "Retreat", "End this fight now and keep the damage you've dealt");
      h += sec("h-items", B.boss ? "Items" : "Capture and items", it + `</div>`);
    }
    return h + sec("h-log", "Battle log", `<ol class="log">${B.log.map(l => `<li>${l}</li>`).join("")}</ol>`);
  }

  function renderWheel() {
    let w = `<div class="actions">`;
    if (!S.wheel.spun) {
      w += `<p>Possible prizes: ${prizes().map(p => p.label).join(", ")}.</p>`;
      if (!autoOn()) w += btn("spin", "", "Spin the wheel", "", true);
    } else {
      w += `<p>You won ${S.wheel.prize}.</p>`;
      if (!autoOn()) w += btn("camp", "", "Return to camp", "Your team is restored for the next level", true);
    }
    return sec("h-wheel", "Reward wheel", w + `</div>`);
  }

  function render() {
    document.getElementById("result").textContent = S.result;
    const L = S.level, B = S.battle;
    const where = L ? `World ${L.w}, ${world(L.w).title} · Level ${L.n}` : "";
    const sub = { camp: S.campTab ? `Camp · ${tabLabel(S.campTab)}` : "Camp · Main menu", level: where, battle: B && B.wboss ? "World boss fight" : B && B.arena ? `Arena · Floor ${B.floor}` : `${where} · Battle`, wheel: `${where} complete` };
    document.getElementById("subtitle").textContent = sub[S.screen];
    const r = { camp: renderCamp, level: renderLevel, battle: renderBattle, wheel: renderWheel };
    document.getElementById("screen").innerHTML = r[S.screen]();
    const sb = document.getElementById("soundBtn");
    sb.textContent = `Sound effects: ${S.sound ? "on" : "off"}`;
    sb.setAttribute("aria-pressed", String(S.sound));
    save();
  }
  function finish(msgs, quiet) {
    if (!msgs) return 0;
    wbTick(msgs);
    ensureQuests();
    checkAch(msgs);
    S.result = msgs.join(" ");
    if (S.screen === "battle" && S.battle && S.battle.log) S.battle.log.push(S.result);
    render();
    if (quiet) { const sm = autoSummary(msgs); if (sm) document.getElementById("autolive").textContent = sm; updateAutobar(); }
    else document.getElementById("result").focus();
    return flushSound(quiet && prefs().speed === "fast");
  }
