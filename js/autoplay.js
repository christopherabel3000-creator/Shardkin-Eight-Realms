// Shardkin: Eight Realms — Auto-play, then starting the game (this file loads last).
// Files share one global scope and load in the order listed in index.html.
"use strict";

  // ---------- Auto-play ----------
  // Rolls the die and picks skills on cleared levels. Every action goes through doAction, exactly as if the player chose it.
  const AUTO_SPEED = { slow: 3500, normal: 2000, fast: 700 };
  const SPEED_NAME = { slow: "Slow", normal: "Normal", fast: "Fast" };
  let autoTimer = null;
  function autoOn() { return !!(S.auto && S.auto.on); }
  function prefs() { if (!S.autoPrefs) S.autoPrefs = { speed: "normal", repeat: false, potions: false, capture: false }; return S.autoPrefs; }
  function togglePref(k) {
    const A = prefs();
    if (k === "speed") { A.speed = { slow: "normal", normal: "fast", fast: "slow" }[A.speed]; return `Auto-play speed: ${SPEED_NAME[A.speed]}.`; }
    A[k] = !A[k];
    return { repeat: "Repeat the level", potions: "Use Potions", capture: "Catch new monsters" }[k] + `: ${A[k] ? "on" : "off"}.`;
  }
  function bestMult(m, e) { return Math.max(...attacks(m).map(s => mult(s.el, e.el))); }
  // Attack skills come first in a monster's list, so their positions are the same in attacks() and unlocked().
  function autoSkill(p, e) {
    let bi = 0, bv = -1;
    attacks(p).forEach((s, i) => {
      let v = s.power * mult(s.el, e.el) * (s.el === p.el ? (hasTrait(p, "pride") ? 1.4 : 1.2) : 1) * s.acc / 100;
      if (s.st && !e.status) v *= 1 + s.stc / 200;
      if (v > bv) { bv = v; bi = i; }
    });
    return bi;
  }
  // Support skills: heal when low, clear poison, and buff at the start of a fight that will take a while.
  function autoSupport(p, e) {
    const i = unlocked(p).findIndex(s => s.support);
    if (i < 0 || supportLeft(p) <= 0) return -1;
    const kind = unlocked(p)[i].support, hp = p.hp / p.maxHp, heals = kind === "heal" || kind === "cleanse" || kind === "mend";
    if (heals && hp < 0.35) return i;
    if (heals && kind !== "heal" && p.status && p.status.type === "poison" && hp < 0.6) return i;
    const hits = e.hp / Math.max(1, ...attacks(p).map(s => estDmg(p, e, s)));
    if (!heals && !bst(p).acted && hp > 0.7 && hits >= 3) return i;
    return -1;
  }
  // When trying to catch a monster: the hardest-hitting skill that should leave it standing, or the softest one.
  function gentleSkill(p, e) {
    const sk = attacks(p).map((s, i) => [i, estDmg(p, e, s)]);
    const safe = sk.filter(x => x[1] < e.hp * 0.8).sort((a, b) => b[1] - a[1]);
    return safe.length ? safe[0][0] : sk.sort((a, b) => a[1] - b[1])[0][0];
  }
  function autoChoose() {
    const A = prefs();
    if (S.screen === "level") {
      const L = S.level;
      if (L.failed) return null;
      if (L.encounter) return ["wbignore", ""];
      if (L.shopOpen) return ["merchleave", ""];
      const lead = leadMon();
      const potB = S.items.potion > 0 ? "potion" : itemOpen("superpotion") && S.items.superpotion > 0 ? "superpotion" : null;
      if (A.potions && potB && itemsLeft() > 0 && lead.hp > 0 && lead.hp < lead.maxHp * 0.3) return ["useboard", `${potB}:${lead.uid}`];
      return ["roll", ""];
    }
    if (S.screen === "battle") {
      const B = S.battle;
      if (B.over === "win") return [B.boss ? "towheel" : "continue", ""];
      if (B.over) return null;
      const e = foe(), p = you(), alive = teamMons().filter(m => m.hp > 0 && m.uid !== B.active);
      if (B.forced) {
        alive.sort((a, b) => bestMult(b, e) - bestMult(a, e) || b.hp / b.maxHp - a.hp / a.maxHp);
        return ["switch", alive[0].uid];
      }
      // Switch once per opponent if a teammate has a clearly better matchup.
      const idx = B.enemies.indexOf(e);
      if (B.autoSw !== idx && bestMult(p, e) < 1) {
        const better = alive.filter(m => bestMult(m, e) > bestMult(p, e) && m.hp > m.maxHp * 0.4).sort((a, b) => bestMult(b, e) - bestMult(a, e))[0];
        if (better) { B.autoSw = idx; return ["switch", better.uid]; }
      }
      const pot = S.items.potion > 0 ? "potion" : itemOpen("superpotion") && S.items.superpotion > 0 ? "superpotion" : null;
      if (A.potions && pot && itemsLeft() > 0 && p.hp < p.maxHp * 0.3) return ["use", `${pot}:${p.uid}`];
      const bindItem = ["orb", "gorb", "grorb"].find(id => itemOpen(id) && S.items[id] > 0);
      if (A.capture && !B.boss && bindItem && (!S.dex.includes(e.id) || e.shard)) {
        if (captureChance(e, bindItem) >= 0.5 || e.hp <= e.maxHp * 0.35) return ["capture", bindItem];
        return ["skill", gentleSkill(p, e)];
      }
      const sup = autoSupport(p, e);
      if (sup >= 0) return ["skill", sup];
      return ["skill", autoSkill(p, e)];
    }
    if (S.screen === "wheel") return S.wheel.spun ? (A.repeat ? ["autorepeat", ""] : null) : ["spin", ""];
    return null;
  }
  // A short spoken summary of each step: rolls, landings, new opponents, faints, wins, captures and prizes.
  // The patterns cover both full and Brief messages.
  const KEEP = new RegExp([
    "^You rolled", "^You used a Loaded", "^You land on", "portal pulls", "recovers", "Thorns hit", "open the chest", "merchant", "ambushes you", "steps forward",
    "level boss appears", "world boss was hiding", "slip past", "Something rare", "fainted", "won the battle", "defeated the level boss", "reached level", "evolved",
    "learned", "captured", "broke free", "Potion", "stops on", "Achievement unlocked", "begins\\.", "Auto-play started", "failed", "Shardborn", "glitters",
    "Crystals rain", "left behind", "shattered into",
    "^Rolled", "^Loaded Die", "^Space \\d", "^Wild team of", "^Wild [^,:]+, (Common|Uncommon|Rare|Epic|Legendary) ", "^Next:", "'s next:", "^Boss:", "^Won:",
    "^Caught", "on this team", "^Level \\d+ complete", "^Inside:", "^Plus \\d+ \\w+ Shards?\\.", "^Plus an? \\w+ egg", "heals \\d", "takes \\d", "^Trial tier \\d+ in", ": wild level"
  ].join("|"));
  function autoSummary(msgs) {
    const sents = (msgs.join(" ").match(/[^.!?]+[.!?]+/g) || []).map(x => x.trim()).filter(x => KEEP.test(x));
    return sents.join(" ");
  }
  function updateAutobar() {
    const bar = document.getElementById("autobar"), on = autoOn();
    bar.hidden = !on;
    if (!on) return;
    const A = prefs(), Au = S.auto;
    let st = `Run ${Au.runs} of ${levelName(Au)}${A.repeat ? ", repeating" : ""}. `;
    if (S.screen === "battle" && S.battle) { const e = foe(), p = you(); st += e ? `Battle: your ${p.name}, ${p.hp} of ${p.maxHp} health, against ${e.name}, ${e.hp} of ${e.maxHp}.` : "Battle won."; }
    else if (S.screen === "level" && S.level) st += `Space ${S.level.pos + 1} of ${BOARD_SIZE}.`;
    else if (S.screen === "wheel") st += "Reward wheel.";
    st += ` So far: ${S.coins - Au.coins0} Shard Dust and ${(S.counts.caps || 0) - Au.caps0} captures.`;
    document.getElementById("autostatus").textContent = st;
    const set = (id, text, pressed) => { const b = document.getElementById(id); b.textContent = text; if (pressed !== undefined) b.setAttribute("aria-pressed", String(pressed)); };
    set("ap-speed", `Speed: ${SPEED_NAME[A.speed]}`);
    set("ap-repeat", `Repeat the level: ${A.repeat ? "on" : "off"}`, A.repeat);
    set("ap-potions", `Use Potions: ${A.potions ? "on" : "off"}`, A.potions);
    set("ap-capture", `Catch new monsters: ${A.capture ? "on" : "off"}`, A.capture);
  }
  function autoDelay(soundLen) {
    const base = AUTO_SPEED[prefs().speed];
    return prefs().speed === "fast" ? base : Math.max(base, soundLen * 1000 + 300);
  }
  function autoBegin() {
    updateAutobar();
    document.getElementById("autolive").textContent = `Auto-play started on ${levelName(S.auto)}. ${S.level ? leadMon().name + " leads." : ""}`;
    document.getElementById("autostop").focus();
    clearTimeout(autoTimer);
    autoTimer = setTimeout(autoNext, AUTO_SPEED[prefs().speed]);
  }
  function autoNext() {
    autoTimer = null;
    if (!autoOn()) return;
    const c = autoChoose();
    if (!c) { autoStop(autoEndReason()); return; }
    const len = doAction(c[0], c[1], true);
    if (autoOn()) autoTimer = setTimeout(autoNext, autoDelay(len || 0));
  }
  function autoEndReason() {
    if ((S.level && S.level.failed) || (S.battle && S.battle.over === "lose")) return "your whole team fainted, so the level failed. You kept your captures and experience";
    if (S.screen === "wheel" && S.wheel && S.wheel.spun) return `the level is complete and you won ${S.wheel.prize}`;
    return "there was nothing left to do";
  }
  function autoStop(reason) {
    clearTimeout(autoTimer); autoTimer = null;
    const Au = S.auto;
    if (!Au) return;
    S.auto = null;
    const coins = S.coins - Au.coins0, caps = (S.counts.caps || 0) - Au.caps0;
    S.result = `Auto-play stopped: ${reason}. ${Au.runs} run${Au.runs === 1 ? "" : "s"}, ${coins} Shard Dust earned, ${caps} monster${caps === 1 ? "" : "s"} captured. You're in control now.`;
    render();
    updateAutobar();
    document.getElementById("result").focus();
    queue = [];
  }
  document.getElementById("autobar").addEventListener("click", ev => {
    const b = ev.target.closest("button");
    if (!b || !autoOn()) return;
    if (b.id === "autostop") { autoStop("you stopped it"); return; }
    const t = togglePref(b.dataset.p);
    updateAutobar(); save();
    document.getElementById("autolive").textContent = t;
  });
  document.getElementById("soundBtn").addEventListener("click", () => { S.sound = !S.sound; render(); });

  S = load();
  let autoWasOn = false;
  if (S) {
    ensureExtras();
    // A live duel can't survive a reload: it's rejoined from Friends.
    const wasDuel = S.screen === "duel";
    if (wasDuel) { S.screen = "camp"; S.campTab = "friends"; }
    else if (S.screen === "camp") S.campTab = null;
    if (S.auto) { autoWasOn = true; S.auto = null; }
    S.confirm = null;
    S.result = wasDuel ? "Welcome back. You can rejoin your duel from Friends." : { camp: "Welcome back. You're at camp.", level: "Welcome back. Your level is waiting where you left it.", battle: "Welcome back. Your battle is waiting where you left it.", wheel: "Welcome back. Your reward wheel is waiting." }[S.screen] || "Welcome back.";
    const extra = [];
    applyUpdates(extra);
    if (S._pendingPxp) { givePxp(S._pendingPxp, extra); delete S._pendingPxp; }
    wbTick(extra);
    checkAch(extra);
    if (S.wboss) extra.push(`World boss ${S.wboss.name} is active with ${S.wfights.count} fight${S.wfights.count === 1 ? "" : "s"} available.`);
    if (S.screen === "camp" && S.mine && minePending() > 0) extra.push(`Your Shard Mine has ${minePending()} Shard Dust ready.`);
    if (S.training.session && trainingStatus().done) extra.push("A monster has finished training.");
    if (readyCrests().length) extra.push(`You have a crest ready to use on ${readyCrests().map(m => m.name).join(", ")}. Find it in Team and base.`);
    if (S.gemsBackfill) { extra.push(`New: Coins are now a rare premium currency, and your old coins are now called Shard Dust. You've been given ${S.gemsBackfill} Coins for the milestones you've already reached. Spend them in the Coin Shop.`); delete S.gemsBackfill; }
    if (autoWasOn) extra.push("Auto-play stopped when the game was closed. You can carry on yourself or start it again from camp.");
    if (S.exped && S.exped.list.some(x => expLeft(x) <= 0)) extra.push("A monster is back from an expedition.");
    if (S.hatch && S.hatch.incub.some(x => hatchLeft(x) <= 0)) extra.push("An egg is ready to hatch.");
    ensureQuests();
    if (extra.length) S.result += " " + extra.join(" ");
    queue = [];
    dailyBackup();
  } else newGame();
  render();
  // Offline support and storage: the service worker keeps the game playable without a connection,
  // and an installed copy asks the browser to keep its storage permanently.
  checkStorage();
  if (isStandalone()) requestPersist(false);
  try {
    if ("serviceWorker" in navigator && (location.protocol === "https:" || location.hostname === "localhost")) navigator.serviceWorker.register("sw.js").catch(() => {});
  } catch (e) { /* offline support is optional */ }
