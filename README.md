# Shardkin: Eight Realms

A turn-based monster-collecting RPG, built to be fully playable with a screen reader (VoiceOver on iPhone, or any screen reader on a computer).

**Play it:** https://christopherabel3000-creator.github.io/Shardkin-Eight-Realms/

## Current state
A playable single-player campaign:

- **Twelve worlds:** the eight element worlds (Plant, Water, Fire, Earth, Electric, Psychic, Ghost, Physical) plus four combination worlds, 170 levels in all.
- **A story to the end:** Sable, a rival Shardbinder, waits at the end of every world with a team that grows from two monsters to four. Each win adds Sable's part to the Story, and the last, in the Phantom Rift, is the final battle.
- **Kaleidra**, the mythical 121st Shardkin, wakes in the Heartcrystal after the final battle. It's the only Heart Shardkin, can be caught only with Binding Shards, and takes any element's shards at the Forge.
- **120 monsters**, 15 per element, with evolutions and crest-unlocked final forms.
- **Dice-board levels** with wild battles, healing springs, thorn traps, portals, treasure chests, a wandering merchant and quiet paths, plus a look-ahead and Loaded Dice.
- **Level bosses**, a **reward wheel**, and **roaming world bosses** that carry damage over between fights and grow with your team, aiming for about five fights at any stage.
- **Trials**, the endgame: once the Heartcrystal is restored, climb endless tiers on any cleared world, against three-monster wild teams with more Rares, Epics and Legendaries and an infused final-form boss, with five items allowed per run and a new rule each week. First clears pay Coins, Mythic eggs and Crest Choices.
- **Collection:** all 120 monsters by element, with what you've caught, Shardborn, and how to get the ones you're missing.
- **Bag:** every item, egg, elemental shard, crest and scroll in one place, with what each crest fits.
- **Heartcrystal fusion** at the Shard Forge: forge Mythic eggs from shards, fuse ten eggs into a Mythic egg, and fuse three spare crests into the one a monster needs.
- **Battles** with element strengths, sleep, stun and poison, free switching, capturing and team-wide experience.
- **Traits:** every species has one, such as Thorn Hide, Sturdy, Phase or Element Pride, shown in battle, in Manage and in the Collection.
- **Support skills:** at level 25 each monster learns its element's support skill, usable twice per battle: Photosynthesis heals, Tide Veil halves the next two hits, Kindle powers up, Stone Skin hardens, Overcharge acts first, Clarity cleanses, Hex Shroud weakens the opponent, and Bulk Up does a bit of both. Opponents use them too.
- **Charms**, forged at the Shard Forge and worn one per monster: more health, speed, protection, accuracy, capture chance or experience, or 15% more damage for one element.
- **Weekly Trial rules:** each week brings one rule to every Trial, such as a Fire Surge, Lean Supplies (three items), Shard Rain, Titan Week or Bounty Week.
- **Camp:** player levels, a shop, synthesis, daily training, the Shard Mine for passive Shard Dust, expeditions, a hatchery, and achievements.
- **Daily and weekly quests**, and an endless **Arena tower** of rival trainers.
- **Auto-play** for cleared levels, with speed, repeat, potion and catching settings.
- **Shardborn variants**, rare crystal versions of every monster, plus elemental shards, the **Shard Forge**, shard storms and the story of the Heartcrystal.
- **Element-themed attack sounds** that change with each skill's power and name, plus a sound test in Settings.
- **Monster cries:** every species has its own synthesized cry, built from its element, rarity, name and form, played when it enters battle and from the Collection, where caught monsters also have descriptions.
- **Health tones** (Settings): after each hit, a tone whose pitch follows the target's health, yours on the right and your opponent's on the left, with a warning when yours drops below a quarter.
- **Two currencies:** everyday Shard Dust, and rare Coins earned from milestones and spent in the Coin Shop on Mythic Eggs, Shardborn Lures, Chosen Crests and more.
- **Base management:** sort and filter your base (with a heading per element or rarity), swap a base monster straight onto a full team, and release monsters you don't need for Shard Dust and elemental shards, one at a time or all your spare Commons and Uncommons at once with **Release extras**.
- **Team tools:** Manage any monster to give it a nickname or make it a favorite (favorites can't be released or used up in synthesis), save up to four teams, and **Suggest a team** for any world or Trial.
- **Brief messages** (Settings): shorter battle lines without the tips you already know.
- **Friends** (under Adventure): a Shardbinder name, **rival codes** to battle a friend's team from your own game, **trade codes** to send a monster to a friend, **live duels** with each player on their own device, and a **cloud save** under a private key. Friendly battles and duels use copies of both teams, so nothing changes for anyone's monsters, and a fair-fight option puts every monster at level 100.
- **Automatic saving** in your browser, plus **save codes** in Settings to back up your game or move it to another device, and a backup of your game from the start of each day.
- **Install as an app:** add the game to your Home Screen to play full screen and offline. An installed copy isn't cleared by Safari for going unused.

## Accessibility
Camp opens on a main menu grouped under Adventure, Monsters and Camp headings; each area opens on its own with a Back to main menu button. Every screen section has a heading (for example What happened, Level board, Look ahead, Opponent, Skills, Switch monster), and all actions are buttons. After each action, focus moves to "What happened" so the results of the turn are read aloud right away.

## Files
- `index.html` — the page; loads the stylesheet and scripts (plain HTML, CSS and JavaScript, no build step)
- `css/style.css` — the look of every screen, in light and dark mode
- `js/` — the game code, split by area and loaded in this order (they share one global scope, so order matters):
  - `data.js` — elements, monsters, rosters, worlds and stat math
  - `lore.js` — a description of every species
  - `state.js` — items, shop, buildings, saving, save codes, new games and achievements
  - `sound.js` — sound effects, synthesized attack sounds, monster cries and health tones
  - `progress.js` — experience, evolution, currencies, shards, expeditions, hatchery, quests, the Arena, base management, Trials and Heartcrystal fusion
  - `board.js` — dice-board levels and world bosses
  - `battle.js` — battles, the reward wheel, synthesis and training timers
  - `story.js` — Rival Sable, the final battle and Kaleidra
  - `friends.js` — your Shardbinder name, rival codes, trade codes, live duels and cloud saves
  - `screens.js` — drawing every screen and camp area
  - `input.js` — button handling; every action goes through `doAction`
  - `autoplay.js` — auto-play, then starting the game (loads last)

When you change a file, bump the `?v=` number on its line in `index.html` so phones don't keep an old copy. The service worker saves each file under its `?v=` address, so a new number is also what makes the installed app pick up the change.
- `fonts/` — the game's two fonts (Atkinson Hyperlegible and Chakra Petch, both under the SIL Open Font License), kept with the game so it looks right offline
- `vendor/firebase/` — the Firebase library (version 10.12.2), kept with the game and loaded only when an online feature is first used
- `manifest.webmanifest`, `icons/` — the app name and icons used when the game is installed from the website
- `sw.js` — the service worker: keeps the website playable offline. The page is always fetched fresh when online; everything it lists is saved as it's used. The App Store app doesn't use it.
- `privacy.html`, `support.html` — the privacy policy and the support page, linked from Friends and used as the App Store's Privacy Policy URL and Support URL
- `database.rules.json` — the Firebase Realtime Database rules for live duels and cloud saves (see Online play below)
- `package.json`, `capacitor.config.json`, `scripts/build-www.js`, `ios/`, `.github/workflows/ios.yml` — the iPhone app (see App Store below)
- `appstore/` — the App Store listing text and screenshots. Not part of the game or the app.
- `DESIGN.md` — the full game design and build plan
- `tools/icon.py` — redraws the gem icon at 1024 pixels and the app's launch image. `tools/screenshots.py` — takes the App Store screenshots from a showcase game: `node scripts/build-www.js`, serve `www/` on port 8765, then `python3 tools/screenshots.py appstore/screenshots`.
- `tools/sim.js` — a balance simulator, not loaded by the game. It plays a saved game forward with the real game code and auto-play's choices: `node tools/sim.js <file with a save code> <campaign|trials|wboss|arena> [runs]`. Use it to check a balance change against a real save before it ships.

## Online play
Live duels and cloud saves use the game's own Firebase project, `shardkin-8747e` (Realtime Database, US). Duels live under `shardkinDuels/<CODE>` and cloud saves under `shardkinSaves/<KEY>`. The Firebase library loads only when an online feature is first used, so the rest of the game never needs a connection.

The rules are in `database.rules.json` and are published in the Firebase console (Realtime Database, then Rules). Change the file and the console together.

Until November 2026 the game used the call-sheet-football project shared with the other games. A cloud key from then is still found there, read only, and saving it again moves it to the new project under the same key (js/friends.js). Duels in progress at the changeover aren't carried across.

The rules only accept well-formed records and require every change to be exactly one version newer than the last, so a duel or save can't be rewound or wiped. A duel nobody has touched in 7 days can be deleted, which the game does when its code comes up again. A cloud save is never deleted outright: Delete the cloud save (Friends) replaces it with `{ ver, t, gone: true }`, so the game and device code are gone and the marker keeps the key from loading an old copy or being reused. Nobody can list the saves or duels; each can only be read with its key or code.

## App Store
The App Store version wraps the same files with [Capacitor](https://capacitorjs.com). Nothing about the game changes: `scripts/build-www.js` copies the page, the two extra pages, `css/`, `js/`, `fonts/`, `icons/` and `vendor/` into `www/`, and `npx cap sync ios` puts them in the Xcode project in `ios/`. In the app the save is also kept as a file in the app's Documents folder (js/state.js), which iOS never clears; if the web view's storage comes up empty at startup, the game is restored from that file.

There's no Mac needed: `.github/workflows/ios.yml` builds the app on GitHub's Macs. Every push that touches the game checks that it still builds; running the workflow by hand (Actions, iPhone app, Run workflow) signs it and sends it to TestFlight. Signing needs four repo secrets, listed at the top of the workflow. The app is `com.playbyear.shardkin`.
