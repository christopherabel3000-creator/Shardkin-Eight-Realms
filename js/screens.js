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
      <p class="tags">${chip(m.el)}<span class="chip plain">${rarityName(m)}</span><span class="chip plain">Level ${m.level}</span>${m.shard ? `<span class="chip" style="color: var(--accent)">Shardborn</span>` : ""}${m.status ? `<span class="chip" style="color: var(--hp-mid)">${cap(STATUS_WORD[m.status.type])}</span>` : ""}</p>
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
  function sub4(text) { return `<h4 class="group">${text}</h4>`; }
  function nextForm(m) {
    const f = SP[m.id].forms;
    if (m.stage + 1 >= f.length) return "";
    return m.stage === 0 ? ` · Evolves into ${f[1]} at level ${EVOLVE_LEVEL}` : ` · Final form ${f[2]} needs the ${crestName(m.id)}`;
  }
  function monLine(m) { return `${m.nick ? `${speciesName(m)} · ` : ""}${m.el} · ${rarityName(m)}${m.shard && !m.nick ? " Shardborn" : ""} · Level ${m.level} · Health ${m.hp} of ${m.maxHp}${m.infuse ? ` · Infused ${m.infuse} of 5` : ""}${m.charm ? ` · ${charmName(m.charm)}` : ""}${m.fav ? " · Favorite" : ""}${statusText(m)}`; }
  // The items you can use on the board. Everything else (eggs, shards, crests, scrolls) is in the Bag area at camp.
  function itemsLine() {
    const items = ["potion", "superpotion", "revive", "tonic", "orb", "gorb", "grorb", "perfect", "fury", "ward", "die"]
      .filter(id => (S.items[id] || 0) > 0 || ["potion", "orb"].includes(id)).map(id => `${fmt(S.items[id] || 0)} ${iname(id, S.items[id] || 0)}`);
    return [`${fmt(S.coins)} Shard Dust`, ...items].join(" · ");
  }
  function menuLine() { return `${fmt(S.coins)} Shard Dust · ${fmt(S.gems || 0)} Coin${S.gems === 1 ? "" : "s"}`; }
  const sumOf = obj => Object.values(obj || {}).reduce((a, b) => a + b, 0);
  // Species caught out of the 120; Kaleidra, the mythical 121st, is counted on its own.
  function dexCount() { return S.dex.filter(id => SP[id] && !SP[id].mythic).length; }

  const TABS = [
    ["levels", "Levels"], ["trials", "Trials"], ["team", "Team and base"], ["collection", "Collection"], ["quests", "Quests"], ["arena", "Arena"], ["bag", "Bag"],
    ["shop", "Shop"], ["premium", "Coin Shop"], ["synth", "Synthesis"], ["build", "Buildings"], ["train", "Training"], ["exped", "Expeditions"], ["hatch", "Hatchery"],
    ["ach", "Achievements"], ["forge", "Shard Forge"], ["story", "Story"], ["save", "Settings"]
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
    if (t === "trials") return trialsOpen() ? "" : "opens when the Heartcrystal is restored, after all eight element worlds";
    return "";
  }
  // The main menu groups every camp area; opening one shows only that area, with a way back.
  const MENU = [
    ["Adventure", ["levels", "trials", "arena"]],
    ["Monsters", ["team", "collection", "synth", "train", "exped", "hatch"]],
    ["Camp", ["bag", "shop", "premium", "forge", "quests", "build", "ach", "story", "save"]]
  ];
  function tabLabel(id) { return TABS.find(t => t[0] === id)[1]; }
  // A short note on each menu button, so you can see what needs attention without opening it.
  function tabNote(id) {
    const lock = tabLocked(id);
    if (lock) return `Locked: ${lock}`;
    if (id === "levels") {
      const w = highestOpen(), notes = [`Up to World ${w}, the ${world(w).title}`];
      if (sableNext()) notes.push(`Sable waits at World ${sableNext()}`);
      if (kaleidraOpen()) notes.push("Kaleidra waits at the Heartcrystal");
      if (S.wboss) notes.push(`World boss active, ${S.wfights.count} fight${S.wfights.count === 1 ? "" : "s"} ready`);
      return notes.join(" · ");
    }
    if (id === "arena") return `Best floor ${S.arena.best}`;
    if (id === "trials") return `Best tier ${S.trials.best} · Tier ${S.trials.best + 1} open`;
    if (id === "collection") return `${dexCount()} of 120 caught${S.dex.includes("kaleidra") ? " and Kaleidra" : ""} · ${S.shardDex.length} Shardborn`;
    if (id === "bag") {
      const c = S.items.crestChoice;
      return [c ? `${c} Crest Choice${c === 1 ? "" : "s"} to use` : "", `${eggCount() + sumOf(S.items.mythic)} eggs`, `${fmt(shardCount())} elemental shards`, `${sumOf(S.items.crests)} crests`].filter(Boolean).join(" · ");
    }
    if (id === "team") { const rc = readyCrests(); return `${S.team.length} of 4 on your team · ${Object.keys(S.mons).length - S.team.length} in your base${rc.length ? ` · Crest ready for ${rc.map(m => m.name).join(", ")}` : ""}`; }
    if (id === "synth") return `${S.items.scrolls.length} scroll${S.items.scrolls.length === 1 ? "" : "s"}`;
    if (id === "train") { const st = trainingStatus(); return !st ? "Nothing training" : st.done ? "Training complete, ready to finish" : `${S.mons[S.training.session.uid].name} is training`; }
    if (id === "exped") { const back = S.exped.list.filter(x => expLeft(x) <= 0).length; return back ? `${back} back and waiting` : `${S.exped.list.length} of ${dockSlots()} away`; }
    if (id === "hatch") { const ready = S.hatch.incub.filter(x => hatchLeft(x) <= 0).length; return ready ? `${ready} egg${ready === 1 ? "" : "s"} ready to hatch` : `${S.hatch.incub.length} of ${S.hatch.slots} incubating · ${eggCount()} eggs waiting`; }
    if (id === "shop") return `${fmt(S.coins)} Shard Dust`;
    if (id === "premium") return `${fmt(S.gems || 0)} Coins${S.lure ? " · Shardborn Lure ready" : ""}`;
    if (id === "quests") { ensureQuests(); const ready = [...S.quests.daily, ...S.quests.weekly].filter(q => !q.claimed && questProgress(q) >= q.n).length; return ready ? `${ready} reward${ready === 1 ? "" : "s"} ready to claim` : "No rewards ready yet"; }
    if (id === "build") { const p = minePending(); return p > 0 ? `${p} Shard Dust ready at the Shard Mine` : ""; }
    if (id === "ach") return `${S.ach.length} of ${ACH.length} earned`;
    if (id === "save") return `Brief messages ${S.brief ? "on" : "off"} · Install, sound test and backups`;
    if (id === "forge") return `${fmt(shardCount())} elemental shards${fusionOpen() ? " · Heartcrystal fusion open" : ""}`;
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
        <p class="muted">${menuLine()}</p></div>`);
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
      : { levels: tabLevels, trials: tabTrials, team: tabTeam, collection: tabCollection, quests: tabQuests, arena: tabArena, bag: tabBag, shop: tabShop, premium: tabPremium,
        synth: tabSynth, build: tabBuild, train: tabTrain, exped: tabExped, hatch: tabHatch, ach: tabAch, forge: tabForge, story: tabStory, save: tabSave }[S.campTab]();
    return back + sec("h-tab", lab, body) + back;
  }
  function wbPanel() {
    if (!S.wboss) return "";
    const W = S.wboss, F = S.wfights;
    let t = `<div class="row"><p class="nm">World boss: ${W.name}</p>
      <p>${W.el} · Level ${W.level} · Health ${W.hp} of ${W.maxHp} · Leaves in ${dur(W.expires - now())}</p>
      ${hpBar(W)}
      <p class="muted">Fights available: ${F.count} of ${WB.maxFights}${F.count < WB.maxFights ? ` · Next fight in ${dur(F.last + WB.fightEvery - now())}` : ""}</p>`;
    t += F.count > 0 ? btn("wbfight", "", `Fight ${W.name}`, `Your team starts fully healed. Damage carries over. Up to ${ITEM_CAP} items per fight.`, true) : btn("refresh", "", "Check again", "Updates fights available");
    return t + `</div>`;
  }
  // A suggested team waits at the top of Levels or Trials until you use it or keep your own.
  function suggestPanel() {
    const G = S.suggest;
    if (!G || !G.uids.every(uid => S.mons[uid])) return "";
    return `<div class="row"><p class="nm">Suggested team for World ${G.w}, the ${world(G.w).title}</p><p>${teamNames(G.uids)}, with ${S.mons[G.uids[0]].name} leading.</p><p class="muted">${matchupHint(world(G.w).els)}</p>
      <div class="pair">${btn("suggestyes", "", "Use this team", "", true)}${btn("suggestno", "", "Keep my team")}</div></div>`;
  }
  function suggestBtn(w) { return btn("suggest", w, `Suggest a team for World ${w}`, `Picks your best four against ${world(w).name} monsters`); }
  // Sable, and after the final battle Kaleidra, wait at the top of Levels when it's their turn in the story.
  function storyPanel() {
    let t = "";
    const w = sableNext();
    if (w) {
      const [lo, hi] = sableLevels(w), n = SABLE.teams[w - 1].length + 1;
      t += `<div class="row"><p class="nm">${sableFinal(w) ? "The final battle" : "Rival Sable"}</p><p>Sable is waiting at the end of World ${w}, the ${world(w).title}.</p>`
        + btn("sable", "", "Battle Sable", `A team of ${n}, level ${lo} to ${hi} · Your team starts fully healed · Up to ${ITEM_CAP} items · First win: ${sableCoins(w)} Coins and ${fmt(sableDust(w))} Shard Dust`, true) + `</div>`;
    }
    if (kaleidraOpen()) {
      t += `<div class="row"><p class="nm">Kaleidra</p><p>A ninth light waits above the Heartcrystal.</p>`
        + btn("kaleidra", "", "Approach Kaleidra", `Mythical Heart Shardkin, level ${kaleidraLevel()} · Catch it with Binding Shards; Prism Shards don't work · Your team starts fully healed · Up to ${ITEM_CAP} other items`, true) + `</div>`;
    }
    return t;
  }
  function tabLevels() {
    const top = storyPanel() + wbPanel();
    let lv = `<div class="actions">` + suggestPanel() + top;
    if (!S.worldView || !worldOpen(S.worldView)) S.worldView = highestOpen();
    lv += sub3("Choose a world", !!top) + `<div class="pair">`;
    let shownLocked = false;
    WORLDS.forEach((W, i) => {
      const w = i + 1, sel = S.worldView === w;
      if (worldOpen(w)) lv += btn("world", w, `World ${w}: The ${W.title}${sel ? " (open)" : ""}`, `${W.name} · ${prog(w).cleared.length} of ${W.levels} levels cleared${worldCleared(w) ? " · Complete" : ""}`, sel, sel);
      else if (!shownLocked) { shownLocked = true; lv += `<p class="muted">World ${w}: locked until you clear World ${w - 1}.</p>`; }
    });
    lv += `</div>`;
    const w = S.worldView, W = world(w), P = prog(w);
    lv += sub3(`World ${w}: The ${W.title}`, true) + `<p class="muted">${W.lore} Wild ${W.name} monsters live here.</p>` + suggestBtn(w);
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
  // A pending swap, release or Manage panel shows first, right after What happened, so it's the next thing read.
  function teamPrompt() {
    if (S.swapIn && S.mons[S.swapIn] && !S.team.includes(S.swapIn)) {
      const n = S.mons[S.swapIn];
      let p = `<div class="row"><p class="nm">Swap ${n.name} onto your team</p><p class="muted">${monLine(n)}</p><p>Choose who goes to your base in exchange.</p><div class="actions">`;
      teamMons().forEach((m, i) => { p += btn("swapyes", m.uid, `Send ${m.name} to base`, `${i === 0 ? "Your lead · " : ""}${m.el} · Level ${m.level}${i === 0 ? ` · ${n.name} becomes the lead` : ""}`); });
      return p + btn("cancel", "", "Cancel the swap", "", true) + `</div></div>`;
    }
    if (S.confirm === "release" && S.mons[S.releaseId]) {
      const m = S.mons[S.releaseId];
      return `<div class="row"><p class="nm">Release ${m.name}?</p><p class="muted">${monLine(m)}</p><p>${releaseWarn(m)}</p>
        <div class="pair">${btn("releaseyes", m.uid, `Yes, release ${m.name}`)}${btn("cancel", "", `Keep ${m.name}`, "", true)}</div></div>`;
    }
    if (S.confirm === "extras") {
      const list = extrasPlan(), v = extrasValue(list), c = list.filter(m => m.rarity === "Common").length;
      if (!list.length) return "";
      return `<div class="row"><p class="nm">Release ${list.length} extra${list.length === 1 ? "" : "s"}?</p>
        <p>${c} Common${c === 1 ? "" : "s"} and ${list.length - c} Uncommon${list.length - c === 1 ? "" : "s"}. You'd get ${fmt(v.dust)} Shard Dust and ${v.shards} elemental shards. They stay counted in your collection.</p>
        <p class="muted">Kept: your best of each species, every Rare and rarer, and anything favorited, named, infused, charmed or Shardborn, on your team, training or away.</p>
        <details><summary>See the ${list.length} monsters</summary><ul class="clean">${list.map(m => `<li>${m.name}, ${m.el}, level ${m.level}</li>`).join("")}</ul></details>
        <div class="pair">${btn("extrasyes", "", `Yes, release ${list.length}`)}${btn("cancel", "", "Keep them", "", true)}</div></div>`;
    }
    if (S.manageId && S.mons[S.manageId]) return managePanel(S.mons[S.manageId]);
    return "";
  }
  // Everything you can do with one monster, gathered in one place so each row in the list stays short.
  function managePanel(m) {
    let p = `<div class="row"><p class="nm">Manage ${m.name}</p><p class="muted">${monLine(m)} · Experience ${m.xp} of ${xpNeed(m.level)}${nextForm(m)}</p>${DESC[m.id] ? `<p>${DESC[m.id]}</p>` : ""}<p class="muted">Trait: ${traitText(m)}</p>`;
    if (S.charmPick) {
      const owned = Object.entries(S.items.charms).filter(([, n]) => n > 0);
      p += `<p>${m.charm ? `${m.name} wears the ${charmName(m.charm)}. Choose another to swap it, or cancel.` : `Choose a charm for ${m.name}.`}</p><div class="actions">`;
      for (const [id, n] of owned) p += btn("wearcharm", `${m.uid}:${id}`, `Give ${m.name} the ${charmName(id)}`, `${CHARMS[id].desc} · You have ${n}`);
      return p + btn("charmcancel", "", "Cancel", "", true) + `</div></div>`;
    }
    if (S.renaming) {
      p += `<label class="field" for="namebox">New name for ${m.name}</label><input id="namebox" type="text" maxlength="16" autocomplete="off" autocapitalize="words" spellcheck="false" value="${m.nick || ""}">`;
      p += `<div class="pair">${btn("namesave", m.uid, "Save name", "", true)}${m.nick ? btn("nameclear", m.uid, "Remove nickname", `Goes back to ${speciesName(m)}`) : btn("cancel", "", "Cancel")}</div>`;
      if (m.nick) p += btn("cancel", "", "Cancel");
      return p + `</div>`;
    }
    const b = [btn("cry", `${m.id}:${m.stage || 0}:${m.shard ? 1 : 0}`, `Hear ${m.name}'s cry`, ""),
      btn("rename", m.uid, m.nick ? `Rename ${m.name}` : `Give ${m.name} a nickname`, m.nick ? `Its species is ${speciesName(m)}` : "Up to 16 letters"),
      btn("fav", m.uid, `Favorite: ${m.fav ? "on" : "off"}`, "Favorites can't be released or used up in synthesis", false, !!m.fav), ...crestBtns(m)];
    if (charmCount()) b.push(btn("charmpick", m.uid, m.charm ? `Swap ${m.name}'s charm` : `Give ${m.name} a charm`, m.charm ? `Wearing the ${charmName(m.charm)}` : `${charmCount()} in your Bag`));
    if (m.charm) b.push(btn("charmoff", m.uid, `Take off the ${charmName(m.charm)}`, "It goes back to your Bag"));
    if (canRelease(m)) b.push(btn("release", m.uid, `Release ${m.name}`, releaseText(m)));
    b.push(btn("managedone", "", "Done", "", true));
    return p + `<div class="actions">${b.join("")}</div></div>`;
  }
  function savedTeamsSection() {
    let s = sub3("Saved teams", true) + `<div class="actions">`;
    for (let i = 0; i < 4; i++) {
      const t = savedTeam(i);
      if (t.length) s += `<div class="row"><p class="nm">Team ${i + 1}</p><p class="muted">${teamNames(t)}</p><div class="pair">${btn("useteam", i, `Use team ${i + 1}`)}${btn("saveteam", i, `Save current team as team ${i + 1}`, "Replaces it")}</div></div>`;
      else s += btn("saveteam", i, `Save current team as team ${i + 1}`, "An empty slot");
    }
    return s + `</div>`;
  }
  function tabTeam() {
    const prompt = teamPrompt();
    let tm = prompt + sub3(`Your team (${S.team.length} of 4)`, !!prompt) + `<div class="actions">`;
    teamMons().forEach((m, i) => {
      tm += `<div class="row"><p class="nm">${i === 0 ? "Lead: " : ""}${m.name}${inTraining(m.uid) ? " (training)" : ""}</p><p class="muted">${monLine(m)} · Experience ${m.xp} of ${xpNeed(m.level)}${nextForm(m)}</p>`;
      const b = [];
      if (i > 0) b.push(btn("makefirst", m.uid, `Make ${m.name} the lead`));
      if (S.team.length > 1) b.push(btn("remove", m.uid, `Send ${m.name} to base`));
      b.push(...crestBtns(m), btn("manage", m.uid, `Manage ${m.name}`, "Nickname, favorite and more"));
      tm += `<div class="${b.length === 2 ? "pair" : "actions"}">${b.join("")}</div></div>`;
    });
    tm += `</div>` + savedTeamsSection();
    const base = baseMons();
    tm += sub3(`Your base (${base.length})`, true);
    if (!base.length) tm += `<p class="muted">Nothing here yet. Monsters you capture are sent to your base.</p>`;
    else {
      const shown = baseShown(), extras = extrasPlan().length;
      tm += `<div class="pair">${btn("basesort", "", `Sort: ${BASE_SORT[baseSort()]}`, "Newest, highest level, rarest, element or name")}${extras ? btn("extras", "", `Release extras (${extras})`, "Spare Commons and Uncommons, keeping your best of each") : ""}</div>`;
      tm += `<p class="muted" style="margin-top:10px">Show:</p><div class="pair" style="margin-top:6px">`;
      for (const f of baseFilters()) tm += btn("basefilter", f, BASE_FILTER_NAME(f), `${baseMatching(f).length} monster${baseMatching(f).length === 1 ? "" : "s"}`, false, baseFilter() === f);
      tm += `</div>`;
      if (S.team.length >= 4) tm += `<p class="muted" style="margin-top:10px">Your team is full. Choose Swap onto team to trade a base monster for a team monster.</p>`;
      tm += sub3(`Showing ${shown.length} of ${base.length}: ${BASE_FILTER_NAME(baseFilter())}, ${BASE_SORT[baseSort()].toLowerCase()}`, true);
      if (!shown.length) tm += `<p class="muted">No monsters match. Choose All to see your whole base.</p>`;
      // Sorted by element or rarity, each group gets its own heading, so a screen reader can jump between them.
      const groupOf = { element: m => m.el, rarity: m => rarityName(m) }[baseSort()];
      let group = null;
      tm += `<div class="actions">`;
      for (const m of shown) {
        if (groupOf && groupOf(m) !== group) {
          group = groupOf(m);
          const n = shown.filter(x => groupOf(x) === group).length;
          tm += `</div>${sub4(`${group} (${n})`)}<div class="actions">`;
        }
        const busy = inTraining(m.uid) ? " (training)" : onExped(m.uid) ? " (on expedition)" : "";
        tm += `<div class="row"><p class="nm">${m.name}${busy}</p><p class="muted">${monLine(m)}${nextForm(m)}</p>`;
        const b = [];
        if (!onExped(m.uid)) b.push(S.team.length < 4 ? btn("add", m.uid, `Add ${m.name} to team`) : btn("swapin", m.uid, `Swap ${m.name} onto team`, "Choose who goes to base"));
        b.push(...crestBtns(m), btn("manage", m.uid, `Manage ${m.name}`, m.fav ? "Favorite · Nickname, release and more" : "Nickname, favorite, release and more"));
        tm += `<div class="${b.length === 2 ? "pair" : "actions"}">${b.join("")}</div></div>`;
      }
      tm += `</div>`;
    }
    const counts = ELEMENTS.map(el => `${poolIds(el).filter(id => S.dex.includes(id)).length} of 15 ${el}`).join(", ");
    return tm + `<p class="muted" style="margin-top:12px">Collection: ${dexCount()} of 120 monsters. ${counts}. Shardborn caught: ${S.shardDex.length} of 120.</p>`;
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
    s += `<p>Training mode: ${T.mode === "time" ? `time-based, ${trainHours()} hours of real time` : `experience-based, finishes after you earn ${fmt(T.session ? trainNeed(T.session) : trainPxp())} Shardbinder experience`}.</p>`;
    if (!T.session) s += btn("mode", "", `Switch to ${T.mode === "time" ? "experience-based" : "time-based"} training`, T.mode === "time" ? "Good for long play sessions" : "Good for a few minutes a day");
    else s += `<p class="muted">You can change modes once this session is finished.</p>`;
    if (T.session) {
      const m = S.mons[T.session.uid];
      s += `<div class="row"><p class="nm">${m.name} is training</p><p>${st.text}</p>`;
      s += st.done ? btn("trainclaim", "", `Finish training`, `${m.name} gains ${fmt(trainAmount(m))} experience`, true) : btn("refresh", "", "Check again", "Updates the time left") + btn("hurry", "train", `Finish now for ${PREMIUM.hurry} Coins`, `You have ${S.gems || 0} Coins`);
      s += `</div>`;
    } else {
      for (const m of [...teamMons(), ...Object.values(S.mons).filter(m => !S.team.includes(m.uid) && !onExped(m.uid))]) s += btn("train", m.uid, `Train ${m.name}`, `${S.team.includes(m.uid) ? "On your team" : "In your base"} · Level ${m.level} · Will gain ${fmt(trainAmount(m))} experience`);
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
  function tabTrials() {
    const best = S.trials.best, next = best + 1, w = trialWorld(), [lo, hi] = trialRange(next), inf = trialInfuse(next);
    let s = `<div class="actions">${suggestPanel()}<p>${best ? `Highest tier cleared: ${best}.` : "No tiers cleared yet."} Tier ${next} is open, with monsters at level ${lo} to ${hi}${inf ? `, infused ${inf} of 5` : ""}.</p>`;
    const R = weekRule();
    s += `<p>This week's rule: ${R.name}. ${R.desc} A new rule comes each Monday.</p>`;
    s += `<p class="muted">Trials have three-monster wild teams with more Rares, Epics and Legendaries, and an infused final-form boss. Each run allows ${R.cap || ITEM_CAP} items, not counting capture items. Shardborn are three times as likely, and you can catch Trial monsters as usual. First clears pay Coins, plus a Mythic egg every ${TRIAL.mythicEvery} tiers and a Crest Choice every ${TRIAL.choiceEvery}. Prizes come in the host world's element.</p>`;
    s += sub3("Host world", true) + `<div class="pair">`;
    for (const x of trialWorlds()) s += btn("trialworld", x, `World ${x}: The ${world(x).title}${x === w ? " (chosen)" : ""}`, `${world(x).name} monsters`, x === w, x === w);
    s += `</div>` + suggestBtn(w) + sub3("Play", true);
    s += btn("trial", next, `Play Trial tier ${next}`, `In World ${w}, the ${world(w).title} · Level ${lo} to ${hi}`, true);
    if (best) {
      const [blo, bhi] = trialRange(best);
      s += btn("trial", best, `Replay tier ${best}`, `Level ${blo} to ${bhi} · Smaller rewards`);
      s += btn("autotrial", best, `Auto-play tier ${best}`, `Rolls and fights for you${prefs().repeat ? " · Repeats until stopped" : ""}`);
    }
    return s + `</div>`;
  }

  // ---------- Collection ----------
  const RARITIES = ["Common", "Uncommon", "Rare", "Epic", "Legendary"];
  function colFilter() { return ["missing", "caught", "all"].includes(S.colFilter) ? S.colFilter : (dexCount() < 120 ? "missing" : "all"); }
  function worldsText(el) { return joinAnd(elementWorlds(el).map(w => `World ${w}${worldOpen(w) ? "" : " (not open yet)"}`)); }
  // How to get each rarity, said once at the top of the Collection rather than for every monster.
  function colRules() {
    const t = trialsOpen();
    return `Commons and Uncommons live in the wild and hatch from eggs. Rares come from Rare synthesis (two Common or Uncommon monsters make a random Rare), from eggs 12% of the time, and rarely from the wild.`
      + ` Epics come from Epic synthesis (two Rares make a random Epic) and from Mythic eggs 80% of the time. Legendaries come from Legendary synthesis (two Epics and a Rare always make that element's Legendary) and from Mythic eggs 20% of the time.`
      + ` Mythic eggs ${t ? "can be forged or fused at the Shard Forge, or bought" : "can be bought"} in the Coin Shop${t ? ", and Trials bring wild Rares, Epics and Legendaries" : ""}.`;
  }
  // Where to look for one element's missing monsters: its worlds and the scrolls that matter.
  function colWhere(el, missing) {
    const scrolls = ["Rare", "Epic", "Legendary"].filter(r => missing.includes(r)).map(r => {
      const rid = el + r;
      return `${r}, ${S.items.scrolls.includes(rid) ? "you have it" : RECIPES[rid].price ? `${fmt(RECIPES[rid].price)} Shard Dust in the Shop` : `from clearing World ${elementWorld(el)}`}`;
    });
    return `${scrolls.length ? `${el} scrolls: ${scrolls.join("; ")}. ` : ""}${el} monsters live in ${worldsText(el)}.`;
  }
  function colLine(id) {
    const s = SP[id], own = Object.values(S.mons).filter(m => m.id === id);
    let t = `${s.forms[0]}${s.forms.length > 1 ? ` (later ${s.forms.slice(1).join(" and ")})` : ""}, ${s.rarity}`;
    if (!S.dex.includes(id)) return t + ": not caught";
    t += `: caught${S.shardDex.includes(id) ? ", Shardborn too" : ""}${own.length ? `, you own ${own.length}` : ", none kept"}`;
    if (s.forms.length === 3 && own.length && own.every(m => m.stage < 2)) t += `. Its final form needs the ${crestName(id)}, and you have ${S.items.crests[crestName(id)] || 0}`;
    return t;
  }
  // The cry to play for a species: the most evolved form you own, Shardborn if you own one.
  function cryArg(id) {
    const own = Object.values(S.mons).filter(m => m.id === id);
    const stage = Math.max(0, ...own.map(m => m.stage || 0));
    return `${id}:${stage}:${own.some(m => m.shard) ? 1 : 0}`;
  }
  // Kaleidra, the mythical 121st, gets its own heading after the eight elements once the Heartcrystal is whole.
  function mythicSection(f) {
    const have = S.dex.includes("kaleidra");
    if ((!have && !S.ach.includes("heart")) || (f === "caught" && !have) || (f === "missing" && have)) return "";
    const s = sub3(`Mythical: ${have ? 1 : 0} of 1`, true);
    if (have) return s + `<div class="actions">${btn("cry", cryArg("kaleidra"), "Kaleidra, Mythical: caught.", `${DESC.kaleidra} Trait: ${TRAITS.prism.name}. Plays its cry.`)}</div>`;
    return s + `<p class="muted">${kaleidraOpen() ? "Kaleidra: not caught. It waits above the Heartcrystal; approach it from Levels." : "A ninth Shardkin is said to sleep inside the Heartcrystal. Finish the story to find it."}</p>`;
  }
  function tabCollection() {
    const f = colFilter(), caught = dexCount();
    let s = `<div class="actions"><p>${caught} of 120 monsters caught. Shardborn caught: ${S.shardDex.length} of 120.</p>`;
    s += `<p class="muted">${ELEMENTS.map(el => `${el} ${poolIds(el).filter(id => S.dex.includes(id)).length}`).join(", ")}, out of 15 each.</p><div class="pair">`;
    for (const [k, label, n] of [["missing", "Missing", 120 - caught], ["caught", "Caught", caught], ["all", "All", 120]]) s += btn("colfilter", k, label, `${n} monster${n === 1 ? "" : "s"}`, false, f === k);
    s += `</div>`;
    if (f === "missing" && caught === 120) return s + `<p>You've caught all 120 Shardkin.</p></div>` + mythicSection(f);
    if (f !== "caught" && caught < 120) s += `<p class="muted">${colRules()}</p>`;
    s += `</div>`;
    for (const el of ELEMENTS) {
      const ids = RARITIES.flatMap(r => POOLS[el][r]), have = ids.filter(id => S.dex.includes(id)).length;
      const shown = ids.filter(id => f === "all" || (f === "missing") !== S.dex.includes(id));
      if (!shown.length) continue;
      s += sub3(`${el}: ${have} of 15${have === 15 ? ", complete" : ""}`, true);
      // Caught species are buttons that play their cry; their description is the button's second line.
      if (f === "missing") s += `<ul class="clean">${shown.map(id => `<li>${colLine(id)}.</li>`).join("")}</ul>`;
      else s += `<div class="actions">${shown.map(id => S.dex.includes(id) ? btn("cry", cryArg(id), `${colLine(id)}.`, `${DESC[id] || ""} Trait: ${TRAITS[SPECIES_TRAIT[id]].name}. Plays its cry.`) : `<p class="muted">${colLine(id)}.</p>`).join("")}</div>`;
      const missing = RARITIES.filter(r => POOLS[el][r].some(id => !S.dex.includes(id)));
      if (f !== "caught" && missing.length) s += `<p class="muted" style="margin-top:6px">${colWhere(el, missing)}</p>`;
    }
    return s + mythicSection(f);
  }

  // ---------- Bag ----------
  function crestNote(c) {
    const id = Object.keys(SP).find(x => SP[x].forms.length === 3 && crestName(x) === c);
    const own = Object.values(S.mons).filter(m => m.id === id), ready = own.find(m => m.stage === 1), later = own.find(m => m.stage === 0);
    if (ready) return `fits your ${ready.name} now, in Team and base`;
    if (later) return `fits your ${later.name} once it evolves at level ${EVOLVE_LEVEL}`;
    if (own.length) return `your ${own[0].name} is already in its final form`;
    return `for the ${SP[id].forms[0]} line, which you don't own`;
  }
  function lineOwners(id) { return joinAnd([...new Set(Object.values(S.mons).filter(m => m.id === id).map(m => m.name))]); }
  function tabBag() {
    const li = arr => `<ul class="clean">${arr.map(x => `<li>${x}</li>`).join("")}</ul>`;
    const it = id => `${fmt(S.items[id] || 0)} ${iname(id, S.items[id] || 0)}`;
    const none = what => `<p class="muted">No ${what}.</p>`;
    let s = `<div class="actions">` + sub3("Currencies") + li([`${fmt(S.coins)} Shard Dust`, `${fmt(S.gems || 0)} Coin${S.gems === 1 ? "" : "s"}`]);
    s += sub3("Healing", true) + li(["potion", "superpotion", "revive", "tonic"].filter(itemOpen).map(it));
    s += sub3("Capture", true) + li(["orb", "gorb", "grorb", "perfect"].filter(itemOpen).map(it));
    s += sub3("Battle and board", true) + li(["fury", "ward", "die"].filter(itemOpen).map(it));
    const myth = Object.entries(S.items.mythic || {}).filter(([, n]) => n > 0), eggs = Object.entries(S.items.eggs).filter(([, n]) => n > 0);
    s += sub3(`Eggs: ${eggCount() + sumOf(S.items.mythic)}`, true);
    s += myth.length || eggs.length ? li([...myth.map(([el, n]) => `${n} Mythic ${el} egg${n === 1 ? "" : "s"}`), ...eggs.map(([el, n]) => `${n} ${el} egg${n === 1 ? "" : "s"}`)]) : none("eggs");
    const sh = ELEMENTS.filter(el => (S.items.shards[el] || 0) > 0);
    s += sub3(`Elemental shards: ${fmt(shardCount())}`, true) + (sh.length ? li(sh.map(el => `${fmt(S.items.shards[el])} ${el}`)) : none("shards"));
    const crests = Object.entries(S.items.crests).filter(([, n]) => n > 0);
    s += sub3(`Crests: ${sumOf(S.items.crests)}`, true) + (crests.length ? li(crests.map(([c, n]) => `${n === 1 ? c : `${n} ${c}s`}: ${crestNote(c)}`)) : none("crests"));
    if (S.items.crestChoice > 0) {
      const opts = choiceTargets();
      s += sub3(`Crest Choices: ${S.items.crestChoice}`, true);
      if (!opts.length) s += `<p class="muted">None of your monsters is waiting on a crest right now, so your Crest Choice will keep until one is.</p>`;
      for (const id of opts) s += btn("choosecrest", id, `Take the ${crestName(id)}`, `For your ${lineOwners(id)} · You have ${S.items.crests[crestName(id)] || 0}`);
    }
    const charms = Object.entries(S.items.charms || {}).filter(([, n]) => n > 0), worn = Object.values(S.mons).filter(m => m.charm);
    s += sub3(`Charms: ${charmCount()} in the Bag, ${worn.length} worn`, true);
    s += charms.length ? li(charms.map(([id, n]) => `${n === 1 ? charmName(id) : `${n} ${charmName(id)}s`}: ${CHARMS[id].desc}`)) : none("charms in the Bag");
    if (worn.length) s += `<p class="muted">Worn: ${joinAnd(worn.map(m => `${m.name} has the ${charmName(m.charm)}`))}.</p>`;
    s += sub3("Scrolls of Synthesis", true) + (S.items.scrolls.length ? li(S.items.scrolls.filter(r => RECIPES[r]).map(r => RECIPES[r].name.replace("Scroll of Synthesis: ", ""))) : none("scrolls"));
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
      for (const m of avail) s += btn("expsend", m.uid, `Send ${m.name} for ${S.expDur} hour${S.expDur > 1 ? "s" : ""}`, `${rarityName(m)} · Level ${m.level} · About ${Math.round(S.expDur * (10 + m.level) * RARITY_COIN[m.rarity])} Shard Dust`);
    }
    return s + `</div>`;
  }
  function tabHatch() {
    const H = S.hatch;
    let s = `<div class="actions"><p class="muted">Eggs hatch after ${hatchHours()} hours into a random monster of their element, usually Common or Uncommon, sometimes rarer. Find eggs in treasure chests, from level bosses and world bosses, on 8-hour expeditions, in Arena milestones and from weekly quests.</p>`;
    s += sub3(`Incubators (${H.incub.length} of ${H.slots} in use)`);
    const ready = H.incub.filter(x => hatchLeft(x) <= 0).length;
    if (ready >= 2) s += btn("hatchall", "", `Hatch all ${ready} ready eggs`, "", true);
    let pending = false;
    H.incub.forEach((x, i) => {
      const left = hatchLeft(x);
      if (left > 0) pending = true;
      const eggName = `${x.mythic ? "Mythic " : ""}${x.el} egg`;
      s += `<div class="row"><p class="nm">${eggName}</p><p class="muted">${left <= 0 ? "Ready to hatch" : dur(left) + " left"}</p>${left <= 0 ? btn("hatchnow", i, `Hatch the ${eggName}`, "", true) : btn("hurry", `hatch:${i}`, `Hatch it now for ${PREMIUM.hurry} Coins`, `You have ${S.gems || 0} Coins`)}</div>`;
    });
    if (pending) s += btn("refresh", "", "Check again", "Updates the time left");
    if (H.incub.length < H.slots) {
      const eggs = Object.entries(S.items.eggs).filter(([, n]) => n > 0), free = H.slots - H.incub.length, plan = fillPlan();
      s += sub3("Your eggs", true);
      if (free >= 2 && plan.length >= 2) s += btn("fillincub", "", plan.length === free ? "Fill every free incubator" : `Fill ${plan.length} incubators`, `With ${eggListText(plan)}`, true);
      for (const [el, n] of Object.entries(S.items.mythic || {})) if (n > 0) s += btn("incubate", `mythic:${el}`, `Incubate a Mythic ${el} egg`, `You have ${n} · Hatches an Epic or Legendary`);
      if (!eggs.length && !Object.values(S.items.mythic || {}).some(n => n > 0)) s += `<p class="muted">No eggs yet.</p>`;
      for (const [el, n] of eggs) s += btn("incubate", el, `Incubate ${an(el)} egg`, `You have ${n}`);
    }
    return s + `</div>`;
  }
  function tabForge() {
    let s = `<div class="actions"><p class="muted">Spend elemental shards to forge items, or infuse a monster with shards of its own element to raise its stats by 3%, up to 5 times. Shards drop from wild monsters, level bosses, world bosses, treasure chests, shard storms, expeditions, the Arena and the Shard Mine.</p>`;
    // Once fusion is open, every opened element can be chosen, so eggs can be fused into any of them.
    const have = ELEMENTS.filter(el => (S.items.shards[el] || 0) > 0 || (fusionOpen() && openElements().includes(el)));
    if (!have.length) return s + `<p>You don't have any shards yet.</p></div>`;
    if (!S.forgeEl || !have.includes(S.forgeEl)) S.forgeEl = have[0];
    s += sub3("Choose an element") + `<div class="pair">`;
    for (const el of have) { const sel = S.forgeEl === el; s += btn("forgeel", el, `${el}: ${fmt(S.items.shards[el] || 0)} shards${sel ? " (open)" : ""}`, "", sel, sel); }
    s += `</div>`;
    const el = S.forgeEl, n = S.items.shards[el] || 0;
    s += sub3(`Forge with ${el} Shards (you have ${fmt(n)})`, true);
    for (const r of FORGE_ITEMS.filter(r => itemOpen(r.id))) s += n >= r.cost ? btn("forge", r.id, `Forge ${r.name} from ${r.cost} ${el} Shards`, r.desc) : `<p class="muted">${cap(r.name)}: ${r.cost} ${el} Shards. ${r.desc}.</p>`;
    if (fusionOpen()) {
      const cost = `${FUSE.mythicShards} ${el} Shards and ${fmt(FUSE.mythicDust)} Shard Dust`;
      s += n >= FUSE.mythicShards && S.coins >= FUSE.mythicDust ? btn("forgemythic", el, `Forge a Mythic ${el} egg`, `${cost} · Hatches an Epic or Legendary`) : `<p class="muted">A Mythic ${el} egg: ${cost}. Hatches an Epic or Legendary.</p>`;
    }
    s += sub3(`Infuse ${el} monsters`, true);
    const mons = Object.values(S.mons).filter(m => m.el === el || SP[m.id].mythic);
    if (!mons.length) s += `<p class="muted">You don't have any ${el} monsters.</p>`;
    for (const m of mons) {
      if ((m.infuse || 0) >= 5) { s += `<p class="muted">${m.name}, level ${m.level}: fully infused.</p>`; continue; }
      const c = infuseCost(m);
      s += n >= c ? btn("infuse", m.uid, `Infuse ${m.name} for ${c} ${el} Shards`, `Infusion ${m.infuse || 0} of 5 · Level ${m.level} · 3% stronger`) : `<p class="muted">${m.name}, level ${m.level}: infusion ${m.infuse || 0} of 5. The next costs ${c} ${el} Shards.</p>`;
    }
    return s + charmSection(el) + fusionSection(el) + `</div>`;
  }
  function charmSection(el) {
    let s = sub3("Charms", true) + `<p class="muted">A monster wears one charm at a time; give charms from Manage in Team and base. Each costs ${fmt(CHARM_COST.dust)} Shard Dust plus shards: ${CHARM_COST.el} of an element for its own charm, or ${CHARM_COST.other} of any element for the rest.</p>`;
    const n = S.items.shards[el] || 0;
    for (const id of [el, ...Object.keys(CHARMS).filter(x => !CHARMS[x].el)]) {
      const c = CHARMS[id], cost = charmShards(id), have = S.items.charms[id] || 0;
      const sub = `${c.desc} · ${cost} ${el} Shards and ${fmt(CHARM_COST.dust)} Shard Dust${have ? ` · You have ${have}` : ""}`;
      s += n >= cost && S.coins >= CHARM_COST.dust ? btn("forgecharm", `${id}:${el}`, `Forge ${an(c.name)}`, sub) : `<p class="muted">${c.name}: ${sub}. You don't have enough.</p>`;
    }
    return s;
  }
  // Heartcrystal fusion: eggs into a Mythic egg of the chosen element, and spare crests into one a monster needs.
  function fusionSection(el) {
    let s = sub3("Heartcrystal fusion", true);
    if (!fusionOpen()) return s + `<p class="muted">Opens when the Heartcrystal is restored, after all eight element worlds.</p>`;
    const plan = eggFusePlan(), eggs = eggCount();
    s += plan && S.coins >= FUSE.eggDust ? btn("fuseeggs", el, `Fuse ${FUSE.eggs} eggs into a Mythic ${el} egg`, `Uses ${eggPlanText(plan)} · ${fmt(FUSE.eggDust)} Shard Dust`)
      : `<p class="muted">Fuse ${FUSE.eggs} eggs of any element and ${fmt(FUSE.eggDust)} Shard Dust into a Mythic ${el} egg. You have ${eggs} egg${eggs === 1 ? "" : "s"}.</p>`;
    const targets = crestFuseTargets();
    if (!targets.length) return s + `<p class="muted">Crest fusion: none of your monsters is waiting on a crest right now.</p>`;
    for (const id of targets) {
      const p = crestFusePlan(id), c = crestName(id);
      s += p && S.coins >= FUSE.crestDust ? btn("fusecrest", id, `Fuse ${FUSE.crests} ${SP[id].el} crests into the ${c}`, `Uses ${crestPlanText(p)} · ${fmt(FUSE.crestDust)} Shard Dust · For your ${lineOwners(id)}`)
        : `<p class="muted">The ${c}, for your ${lineOwners(id)}: fusing it takes ${FUSE.crests} other ${SP[id].el} crests that no monster of yours needs, and ${fmt(FUSE.crestDust)} Shard Dust.</p>`;
    }
    return s;
  }
  // Each world's chapter, with Sable's part once you've beaten Sable there; the Heartcrystal after World 8;
  // and the last two chapters after the final battle and after Kaleidra is caught.
  function tabStory() {
    let s = `<div class="actions"><p>${PROLOGUE}</p>`;
    WORLDS.forEach((W, i) => {
      const w = i + 1;
      if (!worldOpen(w)) return;
      s += sub3(`World ${w}: The ${W.title}`, true) + `<p>${W.lore}</p>`;
      if (w === 8 && S.ach.includes("heart")) s += sub3("The Heartcrystal", true) + `<p>${EPILOGUE}</p>`;
      if (sableBeaten(w)) s += `<p>${SABLE.lines[i].before} ${SABLE.lines[i].after}</p>`;
    });
    if (sableBeaten(WORLDS.length)) s += sub3("The Ninth Light", true) + `<p>${FINALE}</p>`;
    if (S.dex.includes("kaleidra")) s += sub3("Kaleidra", true) + `<p>${KALEIDRA_END}</p>`;
    const locked = WORLDS.filter((W, i) => !worldOpen(i + 1)).length, next = sableNext();
    if (next) s += `<p class="muted">Sable is waiting at the end of World ${next}. Battle Sable from Levels to continue the story.</p>`;
    if (locked) s += `<p class="muted">${locked} more chapter${locked === 1 ? "" : "s"} unlock as you open new worlds.</p>`;
    return s + `</div>`;
  }
  function tabAch() {
    let s = `<p class="muted" style="margin-bottom:8px">${S.ach.length} of ${ACH.length} earned.</p><ul class="clean">`;
    for (const a of ACH) s += `<li><strong>${a.name}</strong>: ${S.ach.includes(a.id) ? "earned" : "not yet"}. ${a.desc} Reward: ${a.reward}.</li>`;
    return s + `</ul>`;
  }
  function appSection() {
    let s = sub3("Install as an app", true) + `<div class="actions">`;
    if (isStandalone()) s += `<p>You're playing the installed app. Safari doesn't clear an installed app's storage for going unused, and it works offline.</p>`;
    else s += `<p class="muted">On iPhone, open this page in Safari, choose Share, then Add to Home Screen. On a computer, Chrome and Edge offer Install in the address bar. The installed app opens full screen, works offline, and isn't cleared by Safari when you take a break. It has its own storage, so copy your save code first, then load it in the app.</p>`;
    if (storeKept === true) s += `<p>Storage: kept permanently.</p>`;
    else if (storeKept === false) s += `<p>Storage: your browser may clear it if the game goes unused for a while.</p>` + btn("persist", "", "Ask to keep storage permanently", "Some browsers ask you to confirm");
    return s + `</div>`;
  }
  function tabSave() {
    let sv = sub3("Messages") + `<div class="actions">` + btn("brief", "", `Brief messages: ${S.brief ? "on" : "off"}`, "Shorter battle lines, without the tips you already know", false, !!S.brief) + `</div>`;
    sv += appSection();
    sv += sub3("Sound", true) + `<div class="actions">` + btn("cries", "", `Monster cries: ${S.cries !== false ? "on" : "off"}`, "Each species has its own cry when it enters battle", false, S.cries !== false)
      + btn("hptones", "", `Health tones: ${S.hpTones ? "on" : "off"}`, "After each hit, a tone for the target's health: high is healthy, low is nearly out. Yours on the right, your opponent's on the left, and a warning when yours drops below a quarter", false, !!S.hpTones) + `</div>`;
    sv += sub3("Sound test", true) + `<div class="actions"><p class="muted">Every element has its own attack sound, and stronger skills sound bigger. Words in a skill's name add layers: bites snap, beams and shots whistle in, slashes swish, slams thud, storms and waves swell, and roars or howls add a cry. A bright chime means a strong hit and a dull thud means a weak one. With headphones, your attacks come slightly from the right and your opponent's from the left.</p>`;
    if (!S.sound) sv += `<p>Sound effects are off. Turn them on with the button at the top of the page.</p>`;
    sv += `<div class="pair">`;
    for (const el of ELEMENTS) { const a = demoSkill(el, false), b = demoSkill(el, true); sv += btn("sndtest", el, `${el} attacks`, `${a.name}, then ${b.name}`); }
    sv += btn("sndtest", "strong", "Strong hit", "The chime for a strong matchup") + btn("sndtest", "weak", "Weak hit", "The thud for a weak matchup");
    sv += btn("sndtest", "miss", "Missed attack", "A whoosh that hits nothing") + btn("sndtest", "sides", "Left and right", "Your attack, then your opponent's");
    sv += btn("sndtest", "hp", "Health tones", "Full, half, low, then the warning") + (S.team.length ? (L => btn("cry", `${L.id}:${L.stage || 0}:${L.shard ? 1 : 0}`, `${L.name}'s cry`, "Your lead's cry. Hear any caught species in the Collection"))(S.mons[S.team[0]]) : "");
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
    sv += `</div>` + sub3("Today's backup", true) + `<div class="actions">`;
    const d = dailySave();
    if (S.confirm === "daily" && d) sv += `<p>Go back to your game from the start of today? It holds ${saveSummary(d.save)}. Your current game is kept as a backup you can go back to.</p><div class="pair">${btn("dailyyes", "", "Yes, go back")}${btn("cancel", "", "Keep my game", "", true)}</div>`;
    else if (d) sv += btn("dailyrestore", "", "Go back to the start of today", `Your game as it was when you first opened it today: ${saveSummary(d.save)}`);
    else sv += `<p class="muted">The game keeps a copy from when you first open it each day.</p>`;
    sv += `</div>` + sub3("Start over", true);
    if (S.confirm === "reset") sv += `<div class="actions" style="margin-top:10px"><p>Start over? This erases your monsters, items and progress.</p><div class="pair">${btn("resetyes", "", "Yes, erase and start over")}${btn("cancel", "", "Keep my game", "", true)}</div></div>`;
    else sv += `<div class="actions" style="margin-top:10px">${btn("reset", "", "Start over", "Erase this saved game")}</div>`;
    return sv;
  }

  function renderLevel() {
    const L = S.level, lead = leadMon();
    let h = "";
    if (L.failed) return sec("h-board", `${L.trial ? `Trial tier ${L.trial}` : `Level ${L.n}`} failed`, `<div class="actions">${btn("camp", "", "Return to camp", "Your team is restored. Captures and experience are kept.", true)}</div>`);
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
      if (S.items.die > 0 && itemsLeft() > 0) rollBtns += btn("die", "", "Use a Loaded Die", `${S.items.die} left · Choose your roll`);
    }
    h += sec("h-board", `${L.trial ? `Trial tier ${L.trial}, World ${L.w}` : `World ${L.w}, Level ${L.n}`} board`, `<div class="actions">
      <p class="stat">Space ${L.pos + 1} of ${BOARD_SIZE}. The boss is ${BOARD_SIZE - 1 - L.pos} spaces away.</p>${L.trial ? `<p>${capLine()}</p>` : ""}
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
      const can = itemsLeft() > 0;
      for (const id of ["potion", "superpotion"]) if (can && itemOpen(id) && m.hp > 0 && m.hp < m.maxHp && S.items[id] > 0) b.push(btn("useboard", `${id}:${m.uid}`, `Use ${an(iname(id, 1))} on ${m.name}`, `${S.items[id]} left`));
      if (can && itemOpen("revive") && m.hp <= 0 && S.items.revive > 0) b.push(btn("useboard", `revive:${m.uid}`, `Use a Revive Shard on ${m.name}`, `${S.items.revive} left · Back with half its health`));
      if (b.length) tm += `<div class="${b.length === 2 ? "pair" : "actions"}">${b.join("")}</div>`;
      tm += `</div>`;
    }
    h += sec("h-lteam", "Your team", tm + `</div>`);
    h += sec("h-bag", "Bag", `<div class="actions"><p>${itemsLine()}</p>${!autoOn() && itemsLeft() > 0 && itemOpen("tonic") && S.items.tonic > 0 && teamMons().some(m => m.hp > 0 && m.hp < m.maxHp) ? btn("useboard", "tonic", "Use a Team Tonic", `${S.items.tonic} left · Heals every standing team monster by half`) : ""}</div>`);
    if (autoOn()) return h;
    let lv;
    if (S.confirm === "leave") lv = `<div class="actions"><p>Leave the level? It counts as a failed attempt, but you keep captures and experience.</p><div class="pair">${btn("leaveyes", "", "Yes, leave")}${btn("cancel", "", "Keep playing", "", true)}</div></div>`;
    else lv = `<div class="actions">${btn("leave", "", "Leave level", "Return to camp without finishing")}</div>`;
    return h + sec("h-leave", "Leave level", lv);
  }

  // A monster's trait, charm and support skill effects, under its card in battle.
  function effectsText(m) {
    const A = m.bt, out = [];
    if (!A) return "";
    if (A.pow) out.push(`skills deal ${30 * A.pow}% more`);
    if (A.bulk) out.push(`deals ${20 * A.bulk}% more and takes ${15 * A.bulk}% less`);
    if (A.guard) out.push(`takes ${25 * A.guard}% less`);
    if (A.weak) out.push(`deals ${25 * A.weak}% less, hexed`);
    if (A.veil) out.push(`next ${A.veil === 1 ? "hit" : "two hits"} halved`);
    if (A.first) out.push("acts first");
    if (A.charged) out.push("next attack 50% stronger");
    return out.length ? `Effects: ${out.join(", ")}.` : "";
  }
  function battleNotes(m) {
    const t = TRAITS[traitOf(m)], fx = effectsText(m);
    return `${t ? `<p class="muted">Trait: ${t.name}. ${t.desc}</p>` : ""}${m.charm ? `<p class="muted">Charm: ${charmName(m.charm)}, ${CHARMS[m.charm].desc}.</p>` : ""}${fx ? `<p>${fx}</p>` : ""}`;
  }
  function renderBattle() {
    const B = S.battle, e = foe(), p = you();
    const shownFoe = e || B.enemies[B.enemies.length - 1];
    const heading = B.wboss ? "World boss" : B.arena ? `Arena floor ${B.floor}: ${B.rival}` : B.sable ? (B.finale ? "The final battle: Sable" : "Rival Sable")
      : B.mythic ? "Kaleidra" : B.boss ? (S.level && S.level.trial ? "Trial boss" : "Level boss") : "Opponent";
    const teamLine = B.mythic || (B.boss && !B.arena && !B.sable) ? "" : `<p class="muted">Opponent team: ${B.enemies.length} monsters, ${foesLeft()} still standing.${S.dex.includes(shownFoe.id) ? "" : " Not in your collection yet."}</p>`;
    let h = sec("h-foe", heading, monCard(shownFoe, foeWord() + " ", teamLine + battleNotes(shownFoe)));
    h += sec("h-you", "Your monster", monCard(p, "", xpLine(p) + battleNotes(p)));
    if (autoOn()) return h + sec("h-log", "Battle log", `<ol class="log">${B.log.map(l => `<li>${l}</li>`).join("")}</ol>`);
    if (B.over) {
      let o = `<div class="actions">`;
      if (B.over === "win" && B.boss) o += btn("towheel", "", "Go to the reward wheel", "", true);
      else if (B.over === "win") o += btn("continue", "", "Continue on the board", `Space ${S.level.pos + 1} of ${BOARD_SIZE}`, true);
      else if (B.over === "wbdone" || B.over === "wbwin") o += btn("camp", "", "Return to camp", "Your team is restored", true);
      else if (B.over === "arenawin") { const alive = teamMons().filter(m => m.hp > 0).length; o += btn("arenanext", "", `Climb to floor ${B.floor + 1}`, `${alive} of ${S.team.length} monsters standing · Health carries over`, true) + btn("camp", "", "Leave the arena", "Your team is restored"); }
      else if (B.over === "arenalose") o += btn("camp", "", "Return to camp", "Your team is restored", true);
      else if (["sablewin", "sablelose", "mythicend", "mythiccaught"].includes(B.over)) o += btn("camp", "", "Return to camp", "Your team is restored", true);
      else o += btn("camp", "", "Return to camp", "Your team is restored. Captures and experience are kept.", true);
      return h + sec("h-over", B.wboss ? "Fight over" : "Battle over", o + `</div>`);
    }
    let sk = `<div class="actions">`;
    if (B.forced) sk += `<p>${p.name} has fainted. Choose a monster under Switch monster.</p>`;
    else {
      unlocked(p).forEach((s, i) => {
        if (s.support) { sk += supportLeft(p) > 0 ? btn("skill", i, s.name, `${s.el} support · ${s.desc} · ${supportLeft(p)} of ${SUPPORT_USES} uses left this battle`) : `<p class="muted">${s.name}: used twice this battle.</p>`; return; }
        sk += btn("skill", i, s.name, `${s.el} · Power ${s.power} · Accuracy ${hasTrait(p, "keeneye") ? "never misses" : `${Math.min(100, s.acc + (p.charm === "focus" ? 10 : 0))}%`}${s.st ? ` · ${s.stc * (hasTrait(p, "potent") ? 2 : 1)}% chance to ${s.st === "sleep" ? "put it to sleep" : s.st}` : ""} · ${effWord(mult(s.el, e.el))} against ${e.name}`);
      });
      const locked = skillsOf(p).filter(s => p.level < s.unlock);
      if (locked.length) sk += `<ul class="clean muted">${locked.map(s => `<li>Locked: ${s.name}, unlocks at level ${s.unlock}</li>`).join("")}</ul>`;
    }
    h += sec("h-skills", "Skills", sk + `</div>`);
    let sw = `<div class="actions">`, others = 0;
    for (const m of teamMons()) {
      if (m.uid === B.active) continue;
      others++;
      if (m.hp <= 0) { sw += `<p class="muted">${m.name} has fainted.</p>`; continue; }
      sw += btn("switch", m.uid, `Send out ${m.name}`, `${m.el} · Level ${m.level} · Health ${m.hp} of ${m.maxHp}${statusText(m)} · ${effWord(Math.max(...attacks(m).map(s => mult(s.el, e.el))))} matchup`, B.forced);
    }
    if (!others) sw += `<p class="muted">No other monsters on your team.</p>`;
    h += sec("h-switch", "Switch monster (free)", sw + `</div>`);
    if (!B.forced) {
      let it = `<div class="actions">`;
      if (B.boss) it += `<p class="muted">${B.wboss ? "World bosses" : B.arena || B.sable ? "Rival monsters" : S.level && S.level.trial ? "Trial bosses" : "Level bosses"} can't be captured.</p>`;
      else {
        let any = false;
        for (const id of ["orb", "gorb", "grorb"]) {
          if (!itemOpen(id) || !(S.items[id] > 0)) continue;
          any = true;
          const pct = Math.round(captureChance(e, id) * 100);
          it += btn("capture", id, `Throw ${an(iname(id, 1))}`, `${S.items[id]} left · ${pct}% chance on ${e.name}${e.status ? ` (boosted, it's ${STATUS_WORD[e.status.type]})` : ""} · Uses your turn`);
        }
        if (B.mythic) it += `<p class="muted">Prism Shards scatter in ${e.name}'s light, so only Binding Shards work.</p>`;
        else if (S.items.perfect > 0) { any = true; it += btn("capture", "perfect", "Throw a Prism Shard", `${S.items.perfect} left · 100% chance`); }
        if (!any) it += `<p class="muted">No capture items left.</p>`;
      }
      const can = itemsLeft() > 0;
      for (const id of ["potion", "superpotion"]) if (can && itemOpen(id) && S.items[id] > 0 && (p.hp < p.maxHp || (id === "superpotion" && p.status))) it += btn("use", `${id}:${p.uid}`, `Use ${an(iname(id, 1))} on ${p.name}`, `${S.items[id]} left · ${id === "potion" ? "Heals half of its health" : "Fully heals it"} · Uses your turn`);
      if (can && itemOpen("tonic") && S.items.tonic > 0 && teamMons().some(m => m.hp > 0 && m.hp < m.maxHp)) it += btn("use", "tonic", "Use a Team Tonic", `${S.items.tonic} left · Heals every standing team monster by half · Uses your turn`);
      if (can && itemOpen("revive") && S.items.revive > 0) for (const m of teamMons()) if (m.hp <= 0) it += btn("use", `revive:${m.uid}`, `Use a Revive Shard on ${m.name}`, `${S.items.revive} left · Back with half its health · Uses your turn`);
      for (const id of ["fury", "ward"]) if (can && itemOpen(id) && S.items[id] > 0 && !B[id]) it += btn("use", id, `Crush ${an(iname(id, 1))}`, `${S.items[id]} left · ${id === "fury" ? "50% more damage" : "A third less damage taken"} for the rest of this battle · Uses your turn`);
      const active = ["fury", "ward"].filter(id => B[id]).map(id => iname(id, 1));
      if (active.length) it += `<p>Active this battle: ${active.join(" and ")}.</p>`;
      if (capHolder()) it += `<p>${capLine()}</p>`;
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
      const sable = !autoOn() && S.level && !S.level.trial && sableNext() === S.level.w;
      if (sable) w += `<p>Sable is waiting at the end of this world.</p>` + btn("sable", "", "Battle Sable", "Your team starts fully healed", true);
      if (!autoOn()) w += btn("camp", "", "Return to camp", sable ? "Your team is restored. Sable will wait for you in Levels." : "Your team is restored for the next level", !sable);
    }
    return sec("h-wheel", "Reward wheel", w + `</div>`);
  }

  function render() {
    document.getElementById("result").textContent = S.result;
    const L = S.level, B = S.battle;
    const where = L ? (L.trial ? `Trial tier ${L.trial} · World ${L.w}, ${world(L.w).title}` : `World ${L.w}, ${world(L.w).title} · Level ${L.n}`) : "";
    const sub = { camp: S.campTab ? `Camp · ${tabLabel(S.campTab)}` : "Camp · Main menu", level: where, battle: B && B.wboss ? "World boss fight" : B && B.arena ? `Arena · Floor ${B.floor}` : B && B.sable ? `Rival Sable · World ${B.sable}` : B && B.mythic ? "The Heartcrystal · Kaleidra" : `${where} · Battle`, wheel: `${where} complete` };
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
