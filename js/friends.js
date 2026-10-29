// Shardkin: Eight Realms — Friends: your Shardbinder name, rival codes, trade codes, live duels and cloud saves.
// Files share one global scope and load in the order listed in index.html.
"use strict";

  // ---------- Names, codes and monsters on the move ----------
  function myName() { return (S.friends && S.friends.name) || "Shardbinder"; }
  // Random ids and keys, from the browser's secure random numbers when it has them.
  function randId(n, chars) {
    const c = chars || "abcdefghijkmnpqrstuvwxyz23456789";
    let r = null;
    try { r = crypto.getRandomValues(new Uint32Array(n)); } catch (e) { r = null; }
    let s = "";
    for (let i = 0; i < n; i++) s += c[(r ? r[i] : Math.floor(Math.random() * 4294967296)) % c.length];
    return s;
  }
  // Letters spaced out, so a screen reader reads a code letter by letter.
  function spell(code) { return String(code).split("").join(" "); }
  // Codes are a prefix and base64 of JSON, like save codes. Spaces and line breaks are ignored when pasting.
  function packCode(prefix, obj) {
    const bytes = new TextEncoder().encode(JSON.stringify(obj));
    let bin = "";
    for (let i = 0; i < bytes.length; i += 8192) bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 8192));
    return prefix + btoa(bin);
  }
  // Words pasted around a code run into it once spaces are removed, so a few shorter lengths are tried too.
  function unpackCode(prefix, text) {
    const flat = String(text || "").replace(/\s+/g, ""), at = flat.indexOf(prefix);
    if (at < 0) return null;
    const m = flat.slice(at + prefix.length).match(/^[A-Za-z0-9+/=]+/);
    if (!m) return null;
    for (let n = m[0].length; n >= Math.max(4, m[0].length - 80); n--) {
      try {
        const bin = atob(m[0].slice(0, n)), bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
        const d = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes));
        if (d && typeof d === "object") return d;
      } catch (e) { /* try a shorter length */ }
    }
    return null;
  }
  // A monster as it travels in a code or a duel: species, form, level, infusion, Shardborn, nickname and charm.
  function monPack(m) { return { id: m.id, st: m.stage || 0, lv: m.level, inf: m.infuse || 0, sh: m.shard ? 1 : 0, nk: m.nick || "", ch: m.charm || "" }; }
  // Rebuilds a monster from a code, checking every field, so a code can't hold anything the game couldn't make.
  // Its form follows its level, except that a final form (which needs a crest) is kept.
  function monUnpack(p, charm) {
    if (!p || typeof p !== "object" || typeof p.id !== "string" || !SP[p.id]) return null;
    const lv = Math.round(Number(p.lv));
    if (!(lv >= 1 && lv <= 250)) return null;
    const m = makeMon(p.id, lv, !!p.sh);
    if (Number(p.st) === 2 && SP[p.id].forms.length === 3 && lv >= EVOLVE_LEVEL) m.stage = 2;
    m.infuse = Math.max(0, Math.min(5, Math.round(Number(p.inf) || 0)));
    const nk = cleanName(p.nk, 16);
    if (nk) m.nick = nk;
    if (charm && CHARMS[p.ch]) m.charm = p.ch;
    m.name = formName(m); calc(m); m.hp = m.maxHp;
    return m;
  }
  function teamText(list) { return joinAnd(list.map(m => `${m.name}, level ${m.level}`)); }
  // Levels set to 100 for a fair fight; forms, infusions and charms stay as they are.
  function fairLevel(m) { m.level = 100; calc(m); m.hp = m.maxHp; return m; }
  // Puts a code in the clipboard if the browser allows it; it's always shown in a box too.
  function copyText(text, done) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => { const r = document.getElementById("result"); r.textContent = done; r.focus(); }, () => {});
      }
    } catch (e) { /* the box still has it */ }
  }
  // Results of online actions arrive later; they're shown and read like any other action. If the server doesn't answer
  // for a while, that's said too, and the result still arrives if the connection comes back.
  function later(p) {
    let done = false;
    const t = setTimeout(() => { if (!done) finish(["The online server isn't answering. Check your internet connection; this will finish if the connection comes back."], false); }, 15000);
    Promise.resolve(p).then(m => { done = true; clearTimeout(t); if (m) finish(m, false); }, () => { done = true; clearTimeout(t); finish([CONN_ERR], false); });
  }

  // ---------- Rival codes ----------
  // Your team as a code a friend can battle from their game. Friendly battles use copies of both teams, so nothing
  // changes for anyone: no experience, no items, and every monster is just as it was afterwards.
  const RIVAL_PREFIX = "SHARDKINRIVAL1.", TRADE_PREFIX = "SHARDKINTRADE1.";
  let rivalOut = "", tradeOut = "";
  function makeRivalCode() { return packCode(RIVAL_PREFIX, { v: 1, name: myName(), team: teamMons().map(monPack) }); }
  function readRivalCode(text) {
    const d = unpackCode(RIVAL_PREFIX, text);
    if (!d || !Array.isArray(d.team)) return null;
    const team = d.team.slice(0, 4).map(p => monUnpack(p, true)).filter(Boolean);
    return team.length ? { name: cleanName(d.name, 16) || "Your friend", team: team.map(monPack) } : null;
  }
  function friendBattle(P) {
    restoreAll(); S.level = null; S.wheel = null; S.confirm = null; S.dieChoose = false;
    const fair = !!S.friends.fair, real = S.team.slice();
    // Copies of your team stand in for it under temporary ids, and are removed when you leave the battle.
    const mine = teamMons().map(m => monUnpack(monPack(m), true));
    mine.forEach((m, i) => { m.uid = "x" + i; S.mons[m.uid] = m; });
    S.team = mine.map(m => m.uid);
    const foes = P.team.map(p => monUnpack(p, true));
    if (fair) [...mine, ...foes].forEach(fairLevel);
    S.battle = { boss: true, friend: true, fair, rival: P.name, realTeam: real, enemies: foes, active: S.team[0], forced: false, over: null, log: [] };
    S.screen = "battle";
    const e = foe();
    sfx("ambush"); crySfx(e, false);
    if (brief()) return [`Friendly battle with ${P.name}${fair ? ", everyone at level 100" : ""}. First: ${introLine(e)}.`];
    return [`A friendly battle with ${P.name}${fair ? ", with every monster at level 100" : ""}. ${P.name} sends out ${e.name}, ${introLine(e)}. Win or lose, nothing changes for your monsters, and items aren't used.`, `Your ${you().name} is ready.`];
  }
  function friendEnd(won, msgs) {
    const B = S.battle;
    B.over = won ? "friendwin" : "friendlose";
    for (const m of teamMons()) m.status = null;
    S.friends.battles[won ? "won" : "lost"]++;
    sfx(won ? "win" : "lose");
    msgs.push(won ? `You beat ${B.rival}'s team!` : `Your whole team has fainted. ${B.rival}'s team wins this one.`);
  }
  // Puts your own team back after a friendly battle and clears the copies.
  function endFriendBattle() {
    const B = S.battle;
    if (B && B.friend && B.realTeam) S.team = B.realTeam.filter(uid => S.mons[uid]);
    for (const uid of Object.keys(S.mons)) if (/^x\d+$/.test(uid)) delete S.mons[uid];
  }

  // ---------- Trade codes ----------
  // A monster you give travels in a code and leaves your base when you make it. Each player can take it from the code
  // once, so you can take it back if your friend doesn't. To trade, you each make a code for the other.
  // Anything you could release can be traded: not your team, favorites, Kaleidra, or monsters training or away.
  function makeTradeCode(uid) {
    const m = S.mons[uid];
    if (!m || !canRelease(m)) return null;
    const p = monPack(m);
    delete p.ch;
    const code = packCode(TRADE_PREFIX, { v: 1, tid: randId(10), from: myName(), mon: p });
    dropMon(uid);
    return { code, name: m.name };
  }
  function readTradeCode(text) {
    const d = unpackCode(TRADE_PREFIX, text);
    if (!d || typeof d.tid !== "string" || !/^[a-z0-9]{6,20}$/.test(d.tid)) return null;
    const m = monUnpack(d.mon, false);
    if (!m || SP[m.id].mythic) return null;
    return { tid: d.tid, from: cleanName(d.from, 16) || "a friend", mon: monPack(m) };
  }
  function tradeText(T) { const m = monUnpack(T.mon, false); return `${m.name}, ${an(rarityName(m))} ${m.el} monster at level ${m.level}${m.infuse ? `, infused ${m.infuse} of 5` : ""}${m.shard ? ", Shardborn" : ""}`; }
  function takeTrade(T) {
    if (S.tradesIn.includes(T.tid)) return null;
    const isNew = !S.dex.includes(T.mon.id);
    const m = addMon(monUnpack(T.mon, false), false);
    S.tradesIn.push(T.tid);
    if (S.tradesIn.length > 500) S.tradesIn.shift();
    sfx("catch"); if (m.shard) sfx("shardborn");
    return [`${m.name} joined your base from ${T.from}'s trade code${isNew ? ", new to your collection" : ""}.`];
  }

  // ---------- Online ----------
  // Live duels and cloud saves use the Firebase Realtime Database of the call-sheet-football project, shared with
  // Christopher's other games. These values identify the project; they are not passwords. Access is controlled by the
  // rules in database.rules.json, which have to be published in the Firebase console. The Firebase library loads only
  // when an online feature is first used.
  const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCY2-1Q7F5GJmrIs33-emT0_rwYN-TfiAw",
    authDomain: "call-sheet-football.firebaseapp.com",
    databaseURL: "https://call-sheet-football-default-rtdb.firebaseio.com",
    projectId: "call-sheet-football",
    storageBucket: "call-sheet-football.firebasestorage.app",
    messagingSenderId: "448422352869",
    appId: "1:448422352869:web:4eb76ce7d666c4ed02410c"
  };
  const FB_LIB = "https://www.gstatic.com/firebasejs/10.12.2/";
  const NET = { db: null, ref: null, code: null, side: null, st: null, seq: -1, busy: false, connected: null, everConnected: false, log: [] };
  const ONLINE_OFF = "Online play isn't switched on for Shardkin yet: its database rules still need to be published in the Firebase console. Rival codes and trade codes work without it.";
  const CONN_ERR = "Couldn't reach the online server. Check your internet connection and try again.";
  const DEVICE = (() => {
    let id = null;
    try { id = localStorage.getItem("shardkin-device"); } catch (e) { id = null; }
    if (!id) { id = randId(12); try { localStorage.setItem("shardkin-device", id); } catch (e) { /* a new id next time */ } }
    return id;
  })();
  let fbLoading = null;
  function loadFirebase() {
    if (typeof firebase !== "undefined" && firebase.database) return Promise.resolve(true);
    if (!fbLoading) {
      const add = src => new Promise((ok, no) => { const s = document.createElement("script"); s.src = src; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
      fbLoading = add(FB_LIB + "firebase-app-compat.js").then(() => add(FB_LIB + "firebase-database-compat.js")).then(() => true, () => { fbLoading = null; return false; });
    }
    return fbLoading;
  }
  async function netDb() {
    if (typeof navigator !== "undefined" && navigator.onLine === false) return null;
    if (NET.db) return NET.db;
    if (!(await loadFirebase())) return null;
    const app = firebase.apps && firebase.apps.length ? firebase.app() : firebase.initializeApp(FIREBASE_CONFIG);
    NET.db = app.database();
    NET.db.ref(".info/connected").on("value", snap => {
      const c = !!snap.val(), had = NET.everConnected, was = NET.connected;
      NET.connected = c;
      if (c) NET.everConnected = true;
      if (NET.code && had && was !== c) announce(c ? "Reconnected to the duel." : "Connection lost. Trying to reconnect.");
    });
    return NET.db;
  }
  function netErr(e) { return /permission/i.test(String(e && (e.code || e.message))) ? ONLINE_OFF : CONN_ERR; }
  // Changes a shared record safely: fn edits the parsed state, and returning false cancels the change.
  function txn(ref, fn, act) {
    return ref.transaction(cur => {
      if (cur === null) return null;
      let st;
      try { st = JSON.parse(cur.state); } catch (e) { return; }
      if (fn(st) === false) return;
      return { ver: cur.ver + 1, state: JSON.stringify(st), t: Date.now(), by: DEVICE, act };
    }, null, false).then(res => res.committed && res.snapshot.exists());
  }

  // ---------- Cloud saves ----------
  // Your whole game under a 12-character key, to load on another device. Anyone with the key can load or replace the
  // save, so it's kept like a password. Saves are numbered, so the game can tell when the cloud copy was changed from
  // another device since you last saved or loaded it here, and asks before replacing it.
  const KEY_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let pendingCloud = null;
  function keyText(k) { return `${k.slice(0, 4)} ${k.slice(4, 8)} ${k.slice(8)}`; }
  async function cloudSave(force) {
    const db = await netDb();
    if (!db) return [CONN_ERR];
    const C = S.cloud || {}, fresh = !C.key, key = C.key || randId(12, KEY_CHARS);
    let conflict = false, ver = 0, at = 0;
    try {
      const res = await db.ref("shardkinSaves/" + key).transaction(cur => {
        conflict = false;
        if (cur && (fresh || (!force && cur.ver !== C.ver))) { conflict = true; return; }
        ver = cur ? cur.ver + 1 : 1; at = Date.now();
        const copy = Object.assign({}, S, { cloud: { key, ver, at }, confirm: null, auto: null });
        return { ver, state: JSON.stringify(copy), t: at, by: DEVICE, act: "save" };
      }, null, false);
      if (!res.committed) {
        if (conflict && fresh) return cloudSave(force);
        if (conflict) { S.confirm = "cloudconflict"; return ["The cloud save was changed from another device since you last saved or loaded it here. Replace it with this game, or load the cloud save instead."]; }
        return [CONN_ERR];
      }
      S.cloud = { key, ver, at };
      S.confirm = null;
      return [fresh ? `Saved to the cloud. Your cloud key is ${keyText(key)}. Keep it somewhere safe, like a password: it loads this game on another device, and anyone with it can load or replace this save.`
        : `Saved to the cloud under your key ${keyText(key)}.`];
    } catch (e) { return [netErr(e)]; }
  }
  async function cloudCheck(text) {
    const key = String(text || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (key.length !== 12 || [...key].some(ch => !KEY_CHARS.includes(ch))) return ["Cloud keys are 12 letters and numbers, like ABCD EFGH JK23. Check the key and try again."];
    const db = await netDb();
    if (!db) return [CONN_ERR];
    try {
      const v = (await db.ref("shardkinSaves/" + key).once("value")).val();
      if (!v) return [`There's no cloud save with the key ${keyText(key)}.`];
      let d = null;
      try { d = upgradeSave(JSON.parse(v.state)); } catch (e) { d = null; }
      if (!d) return ["That cloud save couldn't be read."];
      d.cloud = { key, ver: v.ver, at: v.t };
      pendingCloud = d; S.confirm = "cloudload";
      return [`Found a cloud save from ${new Date(v.t).toLocaleString([], { dateStyle: "medium", timeStyle: "short" })}: ${saveSummary(d)}. Choose Yes, load it, or Keep my game.`];
    } catch (e) { return [netErr(e)]; }
  }

  // ---------- Live duels ----------
  // Two players battle with copies of their teams, each on their own device, choosing moves at the same time. A duel lives
  // at shardkinDuels/CODE as { ver, state, t, by, act }, where state is JSON with both players, both teams and the battle
  // so far. Whoever chooses second works out the turn with the same battle rules as the rest of the game, inside the
  // transaction that saves it. Its messages use the players' names, and its sounds are kept with it, so both players
  // read and hear the same turn, each with their own monster on the right.
  const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const DUEL_KEY = "shardkin-duel";
  function duelSession(v) {
    try {
      if (v === undefined) return JSON.parse(localStorage.getItem(DUEL_KEY) || "null");
      if (v) localStorage.setItem(DUEL_KEY, JSON.stringify(v)); else localStorage.removeItem(DUEL_KEY);
    } catch (e) { return null; }
    return v;
  }
  function duelMe() { return { dev: DEVICE, name: myName(), team: teamMons().map(monPack) }; }
  // Runs part of a duel with the battle rules: player names in messages, full messages, and every sound kept, so each
  // player hears it with their own settings. Leaves the turn's messages and sounds in the state.
  function duelRun(st, fn) {
    const keep = { battle: S.battle, q: queue, tones: S.hpTones, cries: S.cries, brief: S.brief };
    queue = [];
    S.battle = { duel: true, names: [st.p[0].name, st.p[1] ? st.p[1].name : ""] };
    S.hpTones = true; S.cries = true; S.brief = false;
    const msgs = [];
    try { fn(msgs); } finally {
      st.log = msgs; st.ev = queue; st.seq++;
      queue = keep.q; S.battle = keep.battle; S.hpTones = keep.tones; S.cries = keep.cries; S.brief = keep.brief;
    }
  }
  function duelStart(st) {
    st.mons = st.p.map(P => P.team.map(p => monUnpack(p, true)).filter(Boolean).map(m => (st.fair ? fairLevel(m) : m)));
    st.phase = "battle"; st.turn = 1; st.active = [0, 0];
    duelRun(st, msgs => {
      const a = st.mons[0][0], b = st.mons[1][0];
      msgs.push(`The duel begins${st.fair ? ", with every monster at level 100" : ""}! ${st.p[0].name} sends out ${a.name}, ${introLine(a)}. ${st.p[1].name} sends out ${b.name}, ${introLine(b)}.`);
      crySfx(a, true); crySfx(b, false);
    });
  }
  function duelValid(st, side, a) {
    const team = st.mons[side], cur = team[st.active[side]], i = a && a.i;
    if (!a || !Number.isInteger(i) || !cur || cur.hp <= 0) return false;
    if (a.k === "skill") { const sk = unlocked(cur)[i]; return !!sk && (!sk.support || supportLeft(cur) > 0); }
    if (a.k === "switch") return i !== st.active[side] && !!team[i] && team[i].hp > 0;
    return false;
  }
  function duelSwitch(st, side, i, msgs) {
    const out = st.mons[side][st.active[side]], m = st.mons[side][i];
    if (out.hp > 0) {
      bst(out).streak = 0;
      if (hasTrait(out, "mender")) { const h = mend(out, Math.ceil(out.maxHp / 4), side === 0); if (h) msgs.push(`${out.name} mends ${h} health as it steps back.`); }
    }
    st.active[side] = i;
    msgs.push(`${st.p[side].name} sends out ${m.name}.`);
    sfx("swap"); crySfx(m, side === 0);
  }
  // After a turn: anyone knocked out leaves, their player picks who's next, and a player with no one left loses.
  function duelFaints(st, msgs) {
    for (const s of [0, 1]) {
      const m = st.mons[s][st.active[s]];
      if (m.hp > 0 || m.done) continue;
      m.done = true;
      msgs.push(`${st.p[s].name}'s ${m.name} fainted.`); sfx("faint");
      if (st.mons[s].some(x => x.hp > 0)) { st.need[s] = 1; msgs.push(`${st.p[s].name} chooses who goes next.`); }
    }
    const out = [0, 1].filter(s => !st.mons[s].some(x => x.hp > 0));
    if (out.length) {
      st.phase = "over";
      st.winner = out.length === 2 ? null : 1 - out[0];
      st.why = out.length === 2 ? "draw" : "knockout";
      msgs.push(st.winner === null ? "Both teams are down at once. The duel is a draw." : `${st.p[st.winner].name} wins the duel!`);
    }
  }
  function duelTurn(st) {
    duelRun(st, msgs => {
      const act = st.act;
      for (const s of [0, 1]) if (act[s].k === "switch") duelSwitch(st, s, act[s].i, msgs);
      const a = st.mons[0][st.active[0]], b = st.mons[1][st.active[1]];
      const movers = [0, 1].filter(s => act[s].k === "skill");
      const order = movers.length === 2 ? (goesFirst(a, b) ? [0, 1] : [1, 0]) : movers;
      for (const s of order) {
        const me = st.mons[s][st.active[s]], them = st.mons[1 - s][st.active[1 - s]];
        if (me.hp <= 0 || them.hp <= 0) continue;
        const sk = unlocked(me)[act[s].i];
        if (canAct(me, s === 0, msgs)) useSkill(me, them, sk, s === 0, msgs);
        bst(me).acted = true;
      }
      if (a.hp > 0 && b.hp > 0) endOfRound(msgs, [[a, true], [b, false]]);
      duelFaints(st, msgs);
      st.act = [null, null]; st.turn++;
    });
  }
  // The sounds of a turn, from this player's side: their own monster on the right. Health tones, the low-health warning
  // and cries follow this player's settings.
  function duelSounds(ev) {
    const host = NET.side === 0;
    for (const e of ev || []) {
      if (typeof e === "string") { queue.push(e); continue; }
      const x = Object.assign({}, e);
      if ("you" in x && !host) x.you = !x.you;
      if (x.warn) continue;
      if (x.hp) {
        if (!S.hpTones) continue;
        queue.push(x);
        if (x.you && x.frac > 0 && x.frac < 0.25 && x.before >= 0.25) queue.push({ warn: true, you: true });
        continue;
      }
      if (x.cry && S.cries === false) continue;
      queue.push(x);
    }
  }
  async function duelHost() {
    if (!S.team.length) return ["Put at least one monster on your team first."];
    const db = await netDb();
    if (!db) return [CONN_ERR];
    try {
      for (let i = 0; i < 6; i++) {
        const code = randId(4, CODE_CHARS), ref = db.ref("shardkinDuels/" + code);
        const st = { v: 1, id: randId(10), fair: !!S.friends.fair, p: [duelMe(), null], phase: "lobby", turn: 0, act: [null, null], need: [0, 0], active: [0, 0], mons: null, log: [], ev: [], seq: 0, winner: null, why: "" };
        const res = await ref.transaction(cur => (cur ? undefined : { ver: 1, state: JSON.stringify(st), t: Date.now(), by: DEVICE, act: "create" }), null, false);
        if (res.committed) { duelEnter(code, 0, ref, true); return null; }
      }
      return ["Couldn't make a duel code. Try again."];
    } catch (e) { return [netErr(e)]; }
  }
  async function duelJoin(text) {
    const code = String(text || "").toUpperCase().replace(/[^A-Z]/g, "");
    if (!/^[A-Z]{4}$/.test(code)) return ["Duel codes are four letters, like K D R T."];
    const db = await netDb();
    if (!db) return [CONN_ERR];
    const ref = db.ref("shardkinDuels/" + code);
    try {
      const v = (await ref.once("value")).val();
      if (!v) return [`There's no duel with the code ${spell(code)}. Check it with your friend.`];
      const st = JSON.parse(v.state);
      for (const side of [0, 1]) if (st.p[side] && st.p[side].dev === DEVICE) { duelEnter(code, side, ref, false); return null; }
      if (st.p[1]) return [`Duel ${spell(code)} already has two players.`];
      if (!S.team.length) return ["Put at least one monster on your team first."];
      const me = duelMe();
      const ok = await txn(ref, s => { if (s.p[1] || s.phase !== "lobby") return false; s.p[1] = me; duelStart(s); }, "join");
      if (!ok) return [`Duel ${spell(code)} already has two players, or has ended.`];
      duelEnter(code, 1, ref, true);
      return null;
    } catch (e) { return [netErr(e)]; }
  }
  // fresh: a duel you just hosted or joined, rather than one you're coming back to.
  function duelEnter(code, side, ref, fresh) {
    if (NET.ref) NET.ref.off();
    Object.assign(NET, { ref, code, side, st: null, seq: -1, busy: false, log: [], fresh: !!fresh });
    duelSession({ code, side });
    clearPrompts();
    S.screen = "duel";
    ref.on("value", snap => duelRemote(snap.val()), e => finish([netErr(e)], false));
  }
  function duelLeave() {
    if (NET.ref) NET.ref.off();
    const st = NET.st;
    // A finished duel is forgotten; one still going can be rejoined from Friends.
    if (!st || st.phase === "over") duelSession(null);
    Object.assign(NET, { ref: null, code: null, side: null, st: null, seq: -1, busy: false, log: [] });
    S.screen = "camp"; S.campTab = "friends";
  }
  // Every change to the duel arrives here, for both players, including their own moves.
  function duelRemote(v) {
    if (!NET.code) return;
    if (!v) { NET.st = null; finish([`Duel ${spell(NET.code)} is no longer on the server.`], false); return; }
    let st;
    try { st = JSON.parse(v.state); } catch (e) { return; }
    const prev = NET.st, me = NET.side, them = 1 - me;
    NET.st = st;
    if (st.seq > NET.seq) {
      const first = NET.seq < 0;
      NET.seq = st.seq;
      const text = st.log.join(" ");
      if (text) NET.log.push(text);
      if (NET.log.length > 30) NET.log.shift();
      // A duel you come back to shows where it stands, without replaying old sounds.
      const back = first && !NET.fresh;
      NET.fresh = false;
      if (!back) duelSounds(st.ev);
      const msgs = st.phase === "lobby" ? [`You're hosting duel ${spell(NET.code)}. Your friend opens Friends, chooses Join a duel and enters ${NET.code}. The duel starts when they join.`] : st.log.slice();
      if (st.phase === "over") msgs.push(...duelRecord(st));
      else if (st.phase === "battle" && st.need[me]) msgs.push("Choose who goes next.");
      if (back && st.phase === "battle") msgs.unshift(`Back in duel ${spell(NET.code)} with ${st.p[them].name}.`);
      finish(msgs, false);
      return;
    }
    // No new turn: the other player chose their move.
    if (prev && st.phase === "battle" && !prev.act[them] && st.act[them] && !st.act[me]) announce(`${st.p[them].name} has chosen. Your move.`);
    render();
  }
  // The result, counted once per duel.
  function duelRecord(st) {
    if (st.winner === null || !st.id || S.friends.duelIds.includes(st.id)) return [];
    S.friends.duelIds.push(st.id);
    if (S.friends.duelIds.length > 50) S.friends.duelIds.shift();
    const won = st.winner === NET.side;
    S.friends.duels[won ? "won" : "lost"]++;
    sfx(won ? "win" : "lose");
    return [won ? "You won the duel!" : "You lost the duel."];
  }
  async function duelSend(change, act) {
    if (!NET.ref || NET.busy) return null;
    NET.busy = true;
    try {
      const ok = await txn(NET.ref, change, act);
      NET.busy = false;
      return ok ? null : ["That didn't go through, because the duel moved on. Check the screen and try again."];
    } catch (e) { NET.busy = false; return [netErr(e)]; }
  }
  function duelChoose(a) {
    const me = NET.side;
    return duelSend(s => {
      if (s.phase !== "battle" || s.need[0] || s.need[1] || s.act[me] || !duelValid(s, me, a)) return false;
      s.act[me] = a;
      if (s.act[1 - me]) duelTurn(s);
    }, "act");
  }
  function duelReplace(i) {
    const me = NET.side;
    return duelSend(s => {
      const m = s.mons && s.mons[me][i];
      if (s.phase !== "battle" || !s.need[me] || !m || m.hp <= 0) return false;
      duelRun(s, msgs => { s.active[me] = i; s.need[me] = 0; msgs.push(`${s.p[me].name} sends out ${m.name}.`); sfx("swap"); crySfx(m, me === 0); });
    }, "replace");
  }
  function duelForfeit() {
    const me = NET.side;
    return duelSend(s => {
      if (s.phase === "over") return false;
      duelRun(s, msgs => {
        s.phase = "over";
        if (s.p[1 - me]) { s.winner = 1 - me; s.why = "forfeit"; msgs.push(`${s.p[me].name} forfeits. ${s.p[1 - me].name} wins the duel!`); }
        else { s.why = "cancel"; msgs.push(`${s.p[me].name} stopped hosting the duel.`); }
      });
    }, "forfeit");
  }
  // What you chose this turn, said back while you wait.
  function duelChoiceText(st, side) {
    const a = st.act[side], cur = st.mons[side][st.active[side]];
    if (!a) return "";
    return a.k === "skill" ? unlocked(cur)[a.i].name : `to send out ${st.mons[side][a.i].name}`;
  }
