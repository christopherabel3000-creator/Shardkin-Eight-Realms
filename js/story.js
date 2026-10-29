// Shardkin: Eight Realms — The story: Rival Sable, the final battle in the Phantom Rift, and Kaleidra.
// Files share one global scope and load in the order listed in index.html.
"use strict";

  // ---------- Rival Sable ----------
  // Sable, a rival Shardbinder, waits at the end of every world, one world at a time and in order. Battles start from
  // Levels, or from the reward wheel after that world's last level, always with your team fully healed, and are never
  // auto-played. Losing costs nothing. The first win in each world pays Coins and Shard Dust and adds to the Story.
  const SABLE = {
    // The monsters Sable picked up in each realm. Sable's own Shadelet line always comes out last.
    teams: [["mushwick"], ["mistnewt"], ["smoulderbat", "salamandrite"], ["sandviper", "amberix"], ["glowmoth", "plasmink"], ["mesmoth", "dreamdeer"],
      ["cryptbat", "eeriel"], ["flexfrog", "swiftail"], ["blazewing", "tidalisk", "kilnling"], ["stormhawk", "cerebrix", "boltling"],
      ["golemite", "mothbloom", "glintmole"], ["hexling", "fistling", "soulkin"]],
    ace: "shadelet",
    // Levels above (or below) the world's last wild level: [supporting monsters, Sable's own], tuned in simulation so a
    // reasonable team usually wins on the first try and the final battle is the hardest. Infusion in the rifts.
    lift: [[2, 4], [0, 2], [2, 4], [1, 3], [4, 6], [4, 6], [-2, 0], [-9, -7], [12, 14], [13, 15], [8, 10], [-12, -10]],
    infuse: [0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 3, 5],
    lines: [
      { before: "A Shardbinder in a gray cloak blocks the path, a small shadowy Shadelet at their heel. \"I'm Sable. They say you're putting the Heartcrystal back together. Show me why anyone should let you.\"",
        after: "Sable catches Shadelet as it falls. \"Fine. You're not hopeless.\" Then, more quietly: \"The Shardkin were born from the broken crystal. Has anyone asked what happens to them when it's whole?\" Sable is gone before you can answer." },
      { before: "Sable waits at the water's edge. Shadelet has grown into Shadewyrm. \"Two shards bound. I've asked every old Shardbinder what happens at eight. None of them will say.\"",
        after: "\"The tides listen to you now,\" Sable mutters, watching the waves. \"Keep going, then. I'll be watching what it does to them.\"" },
      { before: "Sable stands in the ash with Shadewyrm coiled close. \"Your Cindercub could become Infernox here. Mine has grown too. Let's see whose bond burns hotter.\"",
        after: "Sable brushes the ash from their cloak. \"Your team fights like it trusts you,\" they admit. \"I suppose that counts for something.\"" },
      { before: "Sable sits on a boulder, counting on their fingers. \"Four of eight. Halfway. Do you ever wonder whether the shards want to be put back together?\"",
        after: "\"Stubborn as the mountain,\" Sable says. \"So am I.\" They leave the Stone Shard without looking back." },
      { before: "Lightning shows Sable on the ridge. \"The Storm Shardkin are restless. They can feel the crystal pulling at them. I won't let you rush this.\"",
        after: "Sable's cloak is smoking from the last bolt, and for once they laugh. \"Faster than thunder. All right, you've made your point.\"" },
      { before: "In the hum of the Dream Shard, Sable's voice seems to come from everywhere. \"Last night I dreamed the crystal whole, and every Shardkin was gone. Tell me that was only a dream.\"",
        after: "Sable is quiet for a long time. \"Shadewyrm was all I had, growing up in the Hollow Shard. Promise me you'll stop if they start to fade.\"" },
      { before: "This is where Sable found Shadelet, curled up in the dark. \"Home,\" Sable says. \"Things here linger long after they should be gone. So will I.\"",
        after: "\"One shard left,\" Sable says. \"If they fade, I'll never forgive you. If they don't, I'll never forgive myself for doubting you.\"" },
      { before: "The Heartcrystal is whole, and its light reaches even the Iron Shard. A crest gleams on Shadewyrm's brow, and it rises as Umbradragon. \"Everyone says the Shardkin are fine,\" Sable says. \"I need to see it for myself. Battle me with everything you have.\"",
        after: "When it's over, Sable counts every Shardkin in sight, twice. Not one has faded, and Umbradragon is stronger than ever. Sable laughs, really laughs, for the first time. \"I was wrong. Good.\"" },
      { before: "Sable is already here, staring into the boiling rift. \"The crystal's whole, so why are the rifts still open? Race you to the bottom.\"",
        after: "\"All right, you win the race,\" Sable says. \"But listen: the Shardkin pouring out of the rifts aren't angry. They're scared.\"" },
      { before: "Sable stands with eyes closed in the crackling air. \"There's a voice under the thunder, and it sounds like the Heartcrystal. Battle me, then tell me you hear it too.\"",
        after: "Now you both hear it: one clear note, ringing from somewhere inside the Heartcrystal. \"Something new is waking in there,\" Sable whispers." },
      { before: "Roots split the stone all around Sable. \"Every rift points the same way: the Phantom Rift, where I found Shadelet. Beat me here, and I'll show you the path.\"",
        after: "\"The Phantom Rift, where the Hollow and Iron Shards met,\" Sable says. \"I'll be waiting at its heart, and I won't go easy on you.\"" },
      { before: "At the heart of the Phantom Rift, even the restless dead fall silent. Sable waits beside Umbradragon. \"Everything led here. No holding back, Shardbinder. Show me the bond that made the crystal whole.\"",
        after: "Umbradragon bows its great head, and Sable smiles. \"You were right, all along. Thank you.\"" }
    ],
    lose: "Sable recalls their team. \"Not yet. Come find me when you're ready.\""
  };
  // After the final battle, and after Kaleidra is caught: the last two chapters of the Story.
  const FINALE = "Then the Phantom Rift falls quiet, and the other rifts quiet with it. Above the Heartcrystal a ninth light wakes, shining with every element at once. Sable whispers its name from the oldest songs: Kaleidra, the heart of the shards.";
  const KALEIDRA_END = "Kaleidra settles beside your team, glowing with every realm's color at once. Sable shakes their head, grinning. \"The songs said it chooses its Shardbinder. Looks like it chose.\" The eight realms are at peace, and your journey is complete. The Trials, the Arena and the rifts are there whenever you want them.";
  function sableBeaten(w) { return (S.sable || []).includes(w); }
  // The world where Sable is waiting now, or 0: the first world without a win over Sable, once you've cleared it.
  function sableNext() {
    for (let w = 1; w <= WORLDS.length; w++) if (!sableBeaten(w)) return worldCleared(w) ? w : 0;
    return 0;
  }
  function sableFinal(w) { return w === WORLDS.length; }
  function sableCoins(w) { return sableFinal(w) ? 30 : w > 8 ? 20 : 10; }
  function sableDust(w) { return 300 * w; }
  function sableTeam(w) {
    const hi = wildRange(w, world(w).levels)[1], [sup, own] = SABLE.lift[w - 1], inf = SABLE.infuse[w - 1];
    // In the rifts Sable's Epics and Legendaries are in their final forms; Sable's own reaches Umbradragon in World 8.
    const team = SABLE.teams[w - 1].map((id, i) => trialPrep(makeMon(id, Math.max(5, hi + sup + (i ? 1 : 0))), inf, w >= 9));
    const ace = trialPrep(makeMon(SABLE.ace, Math.max(6, hi + own)), Math.min(5, inf + (inf ? 1 : 0)), w >= 8);
    if (w >= 7) { ace.charm = "Ghost"; calc(ace); ace.hp = ace.maxHp; }
    return [...team, ace];
  }
  function sableLevels(w) { const t = sableTeam(w).map(m => m.level); return [Math.min(...t), Math.max(...t)]; }
  function sableBattle(w) {
    restoreAll(); S.level = null; S.wheel = null; S.confirm = null; S.dieChoose = false;
    teamMons().forEach(clearBattleState);
    const enemies = sableTeam(w);
    S.battle = { boss: true, sable: w, finale: sableFinal(w), rival: "Sable", enemies, active: S.team[0], forced: false, over: null, log: [] };
    S.screen = "battle";
    const e = foe(), n = enemies.length;
    sfx(sableFinal(w) ? "giant" : "boss"); crySfx(e, false);
    const msgs = [SABLE.lines[w - 1].before];
    if (brief()) msgs.push(`Sable's team of ${TEAM_WORD[n]}. First: ${introLine(e)}.`);
    else msgs.push(`Sable sends out ${e.name}, ${introLine(e)}. Sable has ${n} monsters, and your team starts fully healed.`, `Your ${you().name} is ready.`);
    return msgs;
  }
  function sableWin(msgs) {
    const B = S.battle, w = B.sable, first = !sableBeaten(w);
    B.over = "sablewin"; sfx("win");
    if (first) S.sable.push(w);
    msgs.push(B.finale ? "You won the final battle against Sable!" : `You beat Sable in World ${w}!`, SABLE.lines[w - 1].after);
    if (first) {
      const d = sableDust(w);
      S.coins += d;
      giveGems(sableCoins(w), msgs, `You earned ${fmt(d)} Shard Dust and`);
      givePxp(50 + 25 * w, msgs);
    }
    if (B.finale) msgs.push(FINALE, "Kaleidra waits at the Heartcrystal. Approach it from Levels.");
    else {
      const next = sableNext();
      if (next) msgs.push(`Sable is already waiting at the end of World ${next}.`);
      else if (w < WORLDS.length) msgs.push(`Sable will be waiting at the end of World ${w + 1}.`);
    }
  }
  function sableLose(msgs) {
    const B = S.battle;
    B.over = "sablelose";
    for (const m of teamMons()) m.status = null;
    sfx("lose");
    msgs.push(`Your whole team has fainted. ${SABLE.lose} You can battle Sable again from Levels.`);
  }

  // ---------- Kaleidra ----------
  // The mythical 121st Shardkin. After the final battle it waits at the Heartcrystal, approached from Levels with your
  // team fully healed. It can be caught with Binding Shards, but not Prism Shards, and it's hard to catch. If it's
  // knocked out, or your team falls, it drifts back into the Heartcrystal to wait, so there are as many tries as you like.
  const MYTHIC_CAPTURE = 0.12;
  function kaleidraOpen() { return sableBeaten(WORLDS.length) && !S.dex.includes("kaleidra"); }
  function kaleidraLevel() { return Math.max(100, teamTop() + 3); }
  function kaleidraBattle() {
    restoreAll(); S.level = null; S.wheel = null; S.confirm = null; S.dieChoose = false;
    teamMons().forEach(clearBattleState);
    const k = trialPrep(makeMon("kaleidra", kaleidraLevel()), 5, false);
    S.battle = { boss: false, mythic: true, enemies: [k], active: S.team[0], forced: false, over: null, log: [] };
    S.screen = "battle";
    sfx("shardborn"); crySfx(k, false);
    if (brief()) return [`Kaleidra, Mythical Heart, level ${k.level}. Prism Shards won't work.`];
    return [`The Heartcrystal blazes, and Kaleidra unfolds from its light: a Mythical Heart Shardkin at level ${k.level}. It can't be put to sleep, stunned or poisoned, and Prism Shards scatter in its light, so wear it down and use Binding Shards.`, `Your ${you().name} is ready.`];
  }
  // knockedOut: Kaleidra fell. Otherwise your team did. Either way it waits in the Heartcrystal for another try.
  function kaleidraEnd(knockedOut, msgs) {
    const B = S.battle;
    B.over = "mythicend";
    for (const m of teamMons()) m.status = null;
    sfx(knockedOut ? "faint" : "lose");
    msgs.push(knockedOut ? "Kaleidra's light flickers out, and it drifts back into the Heartcrystal. It will be there when you return."
      : "Your whole team has fainted. Kaleidra drifts back into the Heartcrystal, unharmed. Approach it again from Levels whenever you're ready.");
  }
  function kaleidraCaught(msgs) {
    S.battle.over = "mythiccaught";
    sfx("win");
    msgs.push(KALEIDRA_END);
  }

  // ---------- Story achievements ----------
  ACH.push({ id: "sable8", name: "Rival in Every Realm", desc: "Beat Sable in all eight element worlds.", test: () => [1, 2, 3, 4, 5, 6, 7, 8].every(sableBeaten), reward: "a Crest Choice", give: () => { S.items.crestChoice++; } });
  ACH.push({ id: "finale", name: "The Ninth Light", desc: "Win the final battle against Sable in the Phantom Rift.", test: () => sableBeaten(WORLDS.length), reward: "5 Prism Shards and 10000 Shard Dust", give: () => { S.items.perfect += 5; S.coins += 10000; } });
  ACH.push({ id: "kaleidra", name: "Heart of the Shards", desc: "Catch the Shardkin that wakes after the final battle.", test: () => S.dex.includes("kaleidra"), reward: "2 Crest Choices and 20000 Shard Dust", give: () => { S.items.crestChoice += 2; S.coins += 20000; } });
