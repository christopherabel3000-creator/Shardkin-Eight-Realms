# Shardkin: Eight Realms

A turn-based monster-collecting RPG, built to be fully playable with a screen reader (VoiceOver on iPhone, or any screen reader on a computer).

**Play it:** https://christopherabel3000-creator.github.io/Shardkin-Eight-Realms/

## Current state
A playable single-player campaign:

- **Twelve worlds:** the eight element worlds (Plant, Water, Fire, Earth, Electric, Psychic, Ghost, Physical) plus four combination worlds, 170 levels in all.
- **120 monsters**, 15 per element, with evolutions and crest-unlocked final forms.
- **Dice-board levels** with wild battles, healing springs, thorn traps, portals, treasure chests, a wandering merchant and quiet paths, plus a look-ahead and Loaded Dice.
- **Level bosses**, a **reward wheel**, and **roaming world bosses** that carry damage over between fights and grow with your team, aiming for about five fights at any stage.
- **Trials**, the endgame: once the Heartcrystal is restored, climb endless tiers on any cleared world, against three-monster wild teams with more Rares, Epics and Legendaries and an infused final-form boss, with five items allowed per run. First clears pay Coins, Mythic eggs and Crest Choices.
- **Collection:** all 120 monsters by element, with what you've caught, Shardborn, and how to get the ones you're missing.
- **Bag:** every item, egg, elemental shard, crest and scroll in one place, with what each crest fits.
- **Heartcrystal fusion** at the Shard Forge: forge Mythic eggs from shards, fuse ten eggs into a Mythic egg, and fuse three spare crests into the one a monster needs.
- **Battles** with element strengths, sleep, stun and poison, free switching, capturing and team-wide experience.
- **Camp:** player levels, a shop, synthesis, daily training, the Shard Mine for passive Shard Dust, expeditions, a hatchery, and achievements.
- **Daily and weekly quests**, and an endless **Arena tower** of rival trainers.
- **Auto-play** for cleared levels, with speed, repeat, potion and catching settings.
- **Shardborn variants**, rare crystal versions of every monster, plus elemental shards, the **Shard Forge**, shard storms and the story of the Heartcrystal.
- **Element-themed attack sounds** that change with each skill's power and name, plus a sound test in Settings.
- **Two currencies:** everyday Shard Dust, and rare Coins earned from milestones and spent in the Coin Shop on Mythic Eggs, Shardborn Lures, Chosen Crests and more.
- **Base management:** sort and filter your base, swap a base monster straight onto a full team, and release monsters you don't need for Shard Dust and elemental shards.
- **Automatic saving** in your browser, plus **save codes** in Settings to back up your game or move it to another device.

## Accessibility
Camp opens on a main menu grouped under Adventure, Monsters and Camp headings; each area opens on its own with a Back to main menu button. Every screen section has a heading (for example What happened, Level board, Look ahead, Opponent, Skills, Switch monster), and all actions are buttons. After each action, focus moves to "What happened" so the results of the turn are read aloud right away.

## Files
- `index.html` — the page; loads the stylesheet and scripts (plain HTML, CSS and JavaScript, no build step)
- `css/style.css` — the look of every screen, in light and dark mode
- `js/` — the game code, split by area and loaded in this order (they share one global scope, so order matters):
  - `data.js` — elements, monsters, rosters, worlds and stat math
  - `state.js` — items, shop, buildings, saving, save codes, new games and achievements
  - `sound.js` — sound effects and synthesized attack sounds
  - `progress.js` — experience, evolution, currencies, shards, expeditions, hatchery, quests, the Arena, base management, Trials and Heartcrystal fusion
  - `board.js` — dice-board levels and world bosses
  - `battle.js` — battles, the reward wheel, synthesis and training timers
  - `screens.js` — drawing every screen and camp area
  - `input.js` — button handling; every action goes through `doAction`
  - `autoplay.js` — auto-play, then starting the game (loads last)

When you change a file, bump the `?v=` number on its line in `index.html` so phones don't keep an old copy.
- `DESIGN.md` — the full game design and build plan
- `tools/sim.js` — a balance simulator, not loaded by the game. It plays a saved game forward with the real game code and auto-play's choices: `node tools/sim.js <file with a save code> <campaign|trials|wboss|arena> [runs]`. Use it to check a balance change against a real save before it ships.
