# Shardkin: Eight Realms — Design Document

## Overview
A turn-based monster-collecting RPG. You build a team of up to four monsters, roll a die to move through board-game-style levels, battle and capture monsters, and grow a home base that earns passive rewards. Single-player first, with co-op and PvP planned later.

- **Platform:** plain HTML/JavaScript web app, playable on iPhone with VoiceOver and on a computer. Hosted on GitHub Pages, with possible itch.io and app store releases later.
- **Accessibility:** fully playable by screen reader. Every screen uses real headings and buttons, and battle events (damage, captures, dice rolls, wheel spins) are announced as text, with sound effects as a bonus layer.

## Monsters

### Rarity and roster
Each element has 15 monsters, 120 in total.

| Rarity | Per element | Evolution |
|---|---|---|
| Legendary | 1 | Evolves twice; third and final form needs a special item |
| Epic | 2 | Evolves twice; third and final form needs a special item |
| Rare | 3 | Evolves once, no item needed |
| Uncommon | 4 | Doesn't evolve |
| Common | 5 | Doesn't evolve |

- Counting evolved forms, that's 24 forms per element and 192 in total.
- Rarer monsters appear less often and are harder to capture. A Rare, Epic or Legendary shows up about once per 40 fights on average.
- Epic and Legendary monsters can appear in any level of their world, but so rarely that synthesis is the practical way to get them.
- You can own duplicates of the same monster.

### Skills
- Each monster has up to 4 skills. It starts with 2 and unlocks the other 2 by leveling up.
- Prototype unlock levels: skill 3 at level 8, skill 4 at level 15 (to be tuned).

### Synthesis
- Combine 2 or 3 monsters into a more powerful one. The ingredient monsters are used up.
- Each Scroll of Synthesis is one specific recipe, for example "two Plant monsters make a Rare Plant monster." Scrolls are instructions, not consumables, so a recipe can be repeated once owned.
- Scrolls come from finishing a world, the shop, achievements, or (rarely) the reward wheel.

### Final forms
- Each Epic and Legendary monster has its own unique final-form item, consumed on use.
- Completing an element's world awards a random final-form item for that element, except World 3, which always gives the starter's Infernox Crest.
- Replaying the last level of a completed world gives a chance (not guaranteed) at another one on the reward wheel.
- The randomness is deliberate: it encourages collecting every monster and replaying old levels.

### Leveling
Monsters gain experience from battles and daily training. Every defeated or captured monster gives experience to every standing monster on the team, including monsters that didn't fight. Fainted monsters don't earn it. Monster levels are separate from the Shardbinder level.

## Elements
Strong means dealing extra damage (1.5x); weak means taking extra damage. A skill hitting an element that is strong against it deals reduced damage (about 0.67x). A skill matching its user's element gets a small bonus.

| Element | Strong against | Weak against |
|---|---|---|
| Fire | Plant | Water, Earth |
| Water | Fire, Earth | Plant, Electric |
| Earth | Fire, Electric | Water, Plant |
| Electric | Water | Earth |
| Plant | Water, Earth | Fire |
| Physical | — | — |
| Psychic | Ghost | Ghost |
| Ghost | Psychic | Psychic |

Physical is neutral against everything. Psychic and Ghost deal and take extra damage from each other and are neutral against everything else.

## Battles
- One-on-one: one monster fights at a time, from a team of up to 4.
- **Switching is free:** you switch and still act in the same turn.
- Using a skill, an item or a capture attempt uses your turn. Turn order is set by speed.
- **Capturing:** chance = (1 − current health ÷ max health) × a rarity multiplier. Common 1, Uncommon 0.75, Rare 0.5, Epic 0.3, Legendary 0.15. A Common at 1 of 25 health has a 96% chance. A failed attempt gives the wild monster a free action.
- **Capture items:** regular capture items, plus expensive special ones with a 100% success rate meant for the late game.
- Captured monsters always go to your base, never directly to your team.
- **Death:** a monster that dies stays dead for the rest of that level. Everyone is restored after the level ends.
- If your whole team dies, you fail the level and can restart it. You keep everything earned and caught on the failed attempt.

## Worlds and Levels

### World order
1. Plant
2. Water
3. Fire
4. Earth
5. Electric
6. Psychic
7. Ghost
8. Physical

- Worlds 1 and 2: 5 levels each. Worlds 3 and 4: 10 levels each. Worlds 5 to 8: 15 levels each.
- **Combination worlds:** after World 8, new worlds mix two elements (for example Fire and Water, or Electric and Psychic), with stronger monsters and 20 levels each.

### Level structure
- Your team is locked in before the level starts.
- Each level is a board of about 36 spaces. You roll a die to move forward.
- Space types include:
  - **Battle:** a random team of two monsters from that world, weighted toward common ones.
  - **Healing:** restores your lead monster (the one that starts the next fight).
  - **Damage:** hurts your lead monster.
  - **Portal:** jumps you to a random spot in the level.
- The board always ends at the boss space. Rolling past it lands you on it; no exact roll needed.
- The level boss is a normal monster from that world, but it must be defeated, not captured.
- **Reward wheel:** after clearing a level, spin for a prize such as a potion, money, experience, or (rarely) a Scroll of Synthesis or final-form item.

## World Bosses
- Hidden on random spaces that look ordinary and move around, so a loaded die can't target them.
- When found, choose:
  - **Fight:** battle it now. This ends the current level attempt, which must be restarted afterward.
  - **Ignore:** the boss becomes active, you finish the level, and fight it later.
- Only one boss can be active at a time.
- Bosses are extremely strong and usually take 5 to 10 fights to defeat.
- Damage dealt to the boss carries over between fights. Your team follows normal rules: dead monsters stay dead for that fight and everyone is restored for the next.
- You earn 1 fight every 2 hours, storing up to 5.
- A boss stays for 24 hours or until defeated. Defeating it gives a large reward.

## Daily Training
- **Time-based:** finishes after real-world time passes. Good for short daily sessions.
- **Experience-based:** finishes after the player earns enough experience from levels, worlds and other activities. Good for long sessions.
- Players can switch modes any time a session isn't in progress.

## Player Progression and Base
- The player has their own level, separate from monster levels.
- Shardbinder levels unlock features over time, such as the shop, the arena and new base buildings. This doubles as a gradual tutorial.
- The base stores every captured monster.
- Base buildings provide perks such as passive income for the shop.
- Proposed buildings: a training yard that speeds up training, and a lab or hatchery tied to synthesis.

## Shop
Sells items bought with money from levels, the wheel and passive income, for example:
- Potions and healing items
- Loaded die (choose your roll)
- Capture items, including the 100% capture item
- Scrolls of Synthesis

## Achievements
One-time milestones with rewards.

| Achievement | Reward |
|---|---|
| Complete World 1 (Plant) | Scroll of Synthesis: two Plant monsters into a Rare Plant monster |
| First synthesis | TBD |
| Reach Shardbinder level 5 | TBD |
| Collect 10 unique monsters | TBD |
| Complete each world | TBD |
| Proposed: first capture | Capture items |
| Proposed: first evolution | Money |
| Proposed: first world boss defeated | Rare item |
| Proposed: all 15 monsters of one element | Large reward |

"Quests" is reserved for possible repeatable daily or weekly goals later.

## Starting the Game
Every new player gets the same Epic Fire starter, Cindercub, one of the Fire element's two Epics. It's strong against World 1 (Plant), evolves as it levels, and its final form unlocks after completing World 3 (Fire).

## Future Multiplayer
- **Co-op:** two players tackle a world-themed level together.
- **PvP (the arena):** team duels, and raids on an opponent's base. Raids will need base defenses such as guard monsters or traps, so the base should be designed with that in mind.

## Monster Rosters

Forms are listed in evolution order. Rares evolve at level 16; Epics and Legendaries evolve at 16 and reach their final form with their own crest.

### Plant

| Rarity | Monsters |
|---|---|
| Common | Mossling; Sproutle; Fernkit; Budlet; Twiglet |
| Uncommon | Thornback; Petalwing; Mushwick; Briarfox |
| Rare | Bramblehorn → Elderhorn; Lilypaw → Lotuslynx; Cactling → Saguardian |
| Epic | Seedrake → Grovedrake → Sylvanwyrm; Mothbloom → Moonmoth → Eclipse Moth |
| Legendary | Saplord → Oakenreign → Worldroot |

### Water

| Rarity | Monsters |
|---|---|
| Common | Puddlepup; Bubblet; Driftling; Shellkin; Splashrat |
| Uncommon | Tidecrab; Reefwing; Mistnewt; Coralhound |
| Rare | Rippleray → Stormray; Frostfin → Glacierfin; Kelpling → Kelpwarden |
| Epic | Tidalisk → Torrentisk → Abyssalisk; Pearlcalf → Pearlwhale → Leviathal |
| Legendary | Deepcrown → Tidemonarch → Oceanheart |

### Fire

| Rarity | Monsters |
|---|---|
| Common | Emberling; Ashmouse; Kindlet; Flarefly; Coalpup |
| Uncommon | Magmole; Pyrofox; Smoulderbat; Cinderhorn |
| Rare | Blazewing → Pyrewing; Lavaback → Magmatortle; Salamandrite → Salamancer |
| Epic | Cindercub → Blazefang → Infernox; Kilnling → Kilnbeast → Forgetitan |
| Legendary | Solkit → Solarion → Sunsovereign |

### Earth

| Rarity | Monsters |
|---|---|
| Common | Pebblet; Dustmite; Burrowbun; Claypod; Rocklet |
| Uncommon | Quarryhog; Sandviper; Cragowl; Geodemite |
| Rare | Golemite → Golemon; Tremorhound → Quakehound; Amberix → Amberlord |
| Epic | Quakelet → Quakadon → Worldshaker; Glintmole → Gemborer → Crystalking |
| Legendary | Pebblord → Stonemonarch → Gaiacore |

### Electric

| Rarity | Monsters |
|---|---|
| Common | Sparkit; Zappip; Voltbug; Wattling; Fizzlet |
| Uncommon | Thunderpaw; Ampereel; Dynamole; Glowmoth |
| Rare | Stormhawk → Tempestalon; Voltigon → Gigavolt; Plasmink → Plasmalynx |
| Epic | Boltling → Thundrake → Stormtyrant; Coilbot → Teslatron → Omnicoil |
| Legendary | Fulmit → Fulminar → Skyfulgor |

### Psychic

| Rarity | Monsters |
|---|---|
| Common | Mindlet; Dozepuff; Hootwit; Prismite; Gazekin |
| Uncommon | Seerling; Mesmoth; Levitoad; Runefox |
| Rare | Astralynx → Cosmolynx; Sagebeak → Archsage; Dreamdeer → Dreamstag |
| Epic | Cerebrix → Cerebrion → Omnicerebra; Lunakit → Lunaria → Eclipsera |
| Legendary | Aethling → Aetherion → Aetherthrone |

### Ghost

| Rarity | Monsters |
|---|---|
| Common | Wispling; Gloomkit; Murkmoth; Boneling; Sheetsy |
| Uncommon | Ghoulcrow; Lanternwisp; Cryptbat; Mournhound |
| Rare | Specterfox → Wraithfox; Gravekeep → Graveward; Eeriel → Eeriseraph |
| Epic | Shadelet → Shadewyrm → Umbradragon; Hexling → Hexcaller → Hexsovereign |
| Legendary | Soulkin → Soulreaver → Soulmonarch |

### Physical

| Rarity | Monsters |
|---|---|
| Common | Pugilet; Scrapcat; Buffbun; Gruntle; Kickit |
| Uncommon | Brawlbear; Staffmonk; Ironhorn; Flexfrog |
| Rare | Cubrawl → Grandbrawl; Wrestlotl → Grapplotl; Swiftail → Blitztail |
| Epic | Oxling → Titanox → Colossox; Fistling → Fistmaster → Grandfist |
| Legendary | Atlaslet → Atlasaur → Worldbearer |

## Worlds

| World | Elements | Levels | Wild monster levels |
|---|---|---|---|
| 1 | Plant | 5 | 3 to 8 |
| 2 | Water | 5 | 9 to 14 |
| 3 | Fire | 10 | 15 to 25 |
| 4 | Earth | 10 | 26 to 36 |
| 5 | Electric | 15 | 37 to 52 |
| 6 | Psychic | 15 | 53 to 68 |
| 7 | Ghost | 15 | 69 to 84 |
| 8 | Physical | 15 | 85 to 100 |
| 9 | Fire and Water | 20 | 101 to 121 |
| 10 | Electric and Psychic | 20 | 122 to 142 |
| 11 | Earth and Plant | 20 | 143 to 163 |
| 12 | Ghost and Physical | 20 | 164 to 184 |

## Status Effects
- **Sleep:** the monster loses 1 to 3 turns (bosses only 1).
- **Stun:** the monster loses its next turn.
- **Poison:** the monster loses a tenth of its max health each round until the battle ends (much less for world bosses).
- A monster can have one status at a time. Statuses come as a chance on certain skills.
- Capture odds are multiplied by 1.5 for a sleeping or stunned target and 1.2 for a poisoned one.

## Board Spaces
- Wild battle, quiet path, healing spring, thorn trap, portal, **treasure chest** (coins, a Potion, Binding Shards or a rare Loaded Die), **wandering merchant** (sells Potions, Binding Shards and Loaded Dice at shop prices), level boss.
- Every board has one merchant between spaces 15 and 23, a healing spring between spaces 31 and 35, and never more than three battles in a row.
- Later levels and worlds have more battles and traps and fewer quiet paths.

## Prototype Numbers (first guesses, to tune)
- **Evolution:** Rare, Epic and Legendary monsters evolve at level 16. Each evolution stage adds 20% to base stats. Final forms need that monster's crest.
- **Wild rarity per monster:** Common 68%, Uncommon 30.75%, Rare 1%, Epic 0.2%, Legendary 0.05% (Rare or better about once per 40 fights).
- **Player experience:** level clear 40 + 10 × level number (doubled on the first clear), capture 10, synthesis 25, achievement 20, finished training 15. Each Shardbinder level needs 60 × current level.
- **Shardbinder level unlocks:** 2 Shop and Quests, 3 Training Yard, 4 Shard Mine, 5 Expedition Dock, 6 Hatchery, 7 Arena.
- **Shard Dust:** 4 per wild monster level after a battle win; 30 + 20 × level number for a level clear.
- **Shop:** Potion 40, Binding Shard 60, Loaded Die 120, Prism Shard 1,500, Epic Plant scroll 2,500, Legendary Plant scroll 6,000.
- **Synthesis scrolls:** Rare Plant (two Common or Uncommon Plant monsters; from the World 1 achievement), Epic Plant (two Rare Plant), Legendary Plant (two Epic Plant plus one Rare Plant). The result's level matches the highest ingredient.
- **Training Yard:** costs 150 Shard Dust. One monster, from the team or the base, trains at a time and can keep battling while it trains. It gains one full level's worth of experience. Time-based mode takes 3 hours; experience-based mode finishes after 30 Shardbinder experience per Shardbinder level, never under 150 (see Endgame Update).
- **Shard Mine:** costs 300, then 600 and 1,200 to upgrade. Earns 15, 30 or 50 Shard Dust per hour and holds up to 12 hours of earnings.
- **Reward wheel:** 2 Potions, 3 Binding Shards, 150 Shard Dust per world number, 25% of a level's experience for each team monster (based on each monster's own level, fainted ones included), or a Prism Shard. Replays of a world's last level add a chance at a random crest for that world.
- **World progression:** each world opens after clearing the previous world's last level. Wild levels rise by one per level, plus one more at each new world (see the Worlds table).
- **Combination worlds (9 to 12):** Fire and Water, Electric and Psychic, Earth and Plant, Ghost and Physical, 20 levels each, mixing both elements' monsters. Clearing one gives 2,000 Shard Dust, a Prism Shard and a crest from either element.
- **Achievements:** a clear achievement for every world (element worlds give that element's Rare scroll and a crest), a Master achievement for collecting each element's 15 monsters, and Shardkin Master for all 120.
- **World bosses:** 12% chance per level start that one is hiding (only if none is active). It moves to a new space ahead after every roll. It's one of the world's Epics, at least 5 levels above that world's toughest wild monsters and 2 levels above your strongest team monster, with 12 times normal health. You start with 1 fight and earn 1 every 2 hours, up to 5. It leaves after 24 hours. Each fight starts with your team fully healed; you can retreat and keep the damage. Defeating it gives 1,000 Shard Dust, a Prism Shard, a crest for that world and 150 Shardbinder experience. In simulated fights a full team at the end of World 1 needed about 8 fights.

## Activities Beyond the Campaign

### Quests
- Three daily quests (reset at local midnight) and three weekly quests (reset Monday), drawn from: win battles, capture monsters, capture monsters of one element, clear levels, open chests, spin the wheel, and, once unlocked, finish expeditions, hatch eggs, clear Arena floors and synthesize.
- Daily: 5 battles, 3 captures, 2 element captures, 2 levels and so on. Weekly targets are about five to eight times larger.
- Daily rewards: 100 + 20 × Shardbinder level coins plus 2 Potions or 3 Binding Shards, and 15 Shardbinder experience. Weekly: 500 + 50 × Shardbinder level coins plus a Prism Shard, 2 Loaded Dice or an egg, and 60 Shardbinder experience.
- Unlocks with the shop at Shardbinder level 2.

### Arena Tower
- Unlocks at Shardbinder level 7. An endless climb of rival trainers: 2 monsters per floor, 3 from floor 10, and a 4-monster champion every tenth floor. Rival monsters are level 4 + 2 × floor, from any element.
- Health carries over between floors, fainted monsters stay out, and rival monsters can't be captured. Lose and the run ends.
- Start at floor 1 or any checkpoint (11, 21, ...) up to one past your best floor.
- Rewards: 15 × floor coins each floor; first-time milestones give a Loaded Die every 5 floors, a Prism Shard and an egg every 10, and a crest every 25.

### Expeditions
- Expedition Dock: Shardbinder level 5, 400 Shard Dust. Up to 3 base monsters away at once, for 1, 4 or 8 hours.
- Returns hours × (10 + level) × a rarity factor in coins, 5% of a level's experience per hour, item chances each hour (Potion 10%, Binding Shard 8%, Loaded Die 3%), and a 15% egg chance on 8-hour trips.
- Monsters away can't battle, train or be used in synthesis.

### Hatchery
- Shardbinder level 6, 500 Shard Dust for one incubator; a second costs 1,000.
- Eggs take 6 hours and hatch into a monster of their element: Common 50%, Uncommon 35%, Rare 12%, Epic 2.5%, Legendary 0.5%, at that element world's starting level.
- Egg sources: treasure chests (4%), level bosses (8%), world bosses (always), 8-hour expeditions (15%), Arena milestones every 10 floors, and weekly quests.

### New achievements
New Life (first hatch), Explorer (10 expeditions), Arena Contender (floor 10), Arena Legend (floor 50).

## The Shard Theme

### Story
- **Prologue:** the Heartcrystal once held the eight elements in balance. It shattered, each shard grew a realm around itself, and the creatures born from its splinters became the Shardkin. The player is a Shardbinder, one of the few who can bind Shardkin to a team, journeying shard by shard to make the crystal whole.
- **World names:** 1 Verdant Shard (Plant), 2 Tidal Shard (Water), 3 Ember Shard (Fire), 4 Stone Shard (Earth), 5 Storm Shard (Electric), 6 Dream Shard (Psychic), 7 Hollow Shard (Ghost), 8 Iron Shard (Physical). The combination worlds are rifts where two shards ground together: 9 Steam Rift, 10 Mindstorm Rift, 11 Overgrown Rift, 12 Phantom Rift.
- Each world has a short intro line, shown in Levels, when it opens, and in the **Story** area of camp.
- **Heartcrystal Restored** achievement for clearing all eight element worlds, with an epilogue that sets up the rifts. Reward: 5,000 Shard Dust and 3 Prism Shards.
- "Player level" is now the **Shardbinder level**.

### Shardborn variants
- About 1 in 500 wild monsters is Shardborn (for example "Shardborn Mossling"): 10% stronger stats, a "Shardborn" tag, a crystal chime and an announcement when it appears.
- Captured Shardborn stay Shardborn, including through evolution. Hatched eggs are Shardborn 1 in 250 times and synthesis results 1 in 100.
- Defeating one drops triple shards. The collection tracks Shardborn caught out of 120.
- Achievements: Glimmer (first Shardborn, a Prism Shard and 1,000 Shard Dust) and Crystal Collector (10 different Shardborn, 5 Prism Shards).
- Auto-play's catch mode always tries to catch Shardborn.

### Elemental shards
- One material per element (Fire Shards, Water Shards and so on).
- Sources: half of defeated wild monsters (1 for Common and Uncommon, 3 Rare, 5 Epic, 8 Legendary, tripled for Shardborn), level bosses (3 + world number), world bosses (20), treasure chests (2 to 4), shard storms (3 to 6), expeditions (about 1 per 2 hours), Arena floors (1 + floor ÷ 10, random element) and the Shard Mine (1 per 2 hours per mine level, random opened element).

### Shard Forge
- A building: Shardbinder level 3, 250 Shard Dust. Opens its own area in camp.
- Forge items from any one element's shards: Potion 2, Binding Shard 3, Loaded Die 8, an egg of that element 25, Prism Shard 120.
- **Infusion:** spend shards of a monster's own element to raise its stats 3% per infusion, up to 5 (+15%). Costs 10, 20, 30, 40 and 50.
- Shardsmith achievement for 10 forges or infusions.

### Shard storms
- A rare board space (about one per board). Landing on it gives 3 to 6 shards of the world's element and makes Shardborn ten times more likely (1 in 50) for the rest of the level.

### Item names
- Capture Orb is now the **Binding Shard**, and Perfect Orb is now the **Prism Shard**.

## Camp Menu
- Camp opens on a main menu showing Shardbinder level, experience, Shard Dust and Coins, then menu buttons in three headed groups: **Adventure** (Levels, Trials, Arena), **Monsters** (Team and base, Collection, Synthesis, Training, Expeditions, Hatchery) and **Camp** (Bag, Shop, Coin Shop, Shard Forge, Quests, Buildings, Achievements, Story, Settings).
- Each button notes its status: why it's locked, or what's waiting (quest rewards to claim, expeditions back, eggs ready, training complete, Shard Mine coins, an active world boss).
- Choosing one opens only that area, with a Back to main menu button at the top and bottom.
- Finishing or leaving a level returns to the Levels area. Reopening the game at camp starts on the main menu.

## Auto-play
- Available on any level you've already cleared, from an "Auto-play" button under that level in camp.
- The die rolls itself and battles play out normally, with skills chosen for you: the skill with the best expected damage against the current opponent, counting element strength, the same-element bonus, accuracy and a small bonus for status effects.
- It switches monsters once per opponent when a teammate has a clearly better matchup, picks the best replacement when a monster faints, leaves the merchant without buying, never uses Loaded Dice, slips past world bosses (fight them later from camp) and spins the reward wheel.
- Settings (in camp and on the auto-play bar while it runs): speed (slow, normal, fast), repeat the level until stopped, use Potions below 30% health, and catch monsters you don't own yet. Catch mode uses gentler skills to weaken new monsters, then throws Binding Shards.
- It stops when the level is complete (unless repeating), when your whole team faints, or when you press Stop. You can take over from wherever it stops. It never resumes on its own after the game is closed.
- Accessibility: the auto-play bar stays in place while the screen updates, so focus stays on the Stop button. A short spoken summary of each step (rolls, landings, opponents, faints, wins, catches and prizes) is announced through a live region, and the full detail stays in "What happened" and the battle log. At fast speed, attack sounds are skipped so steps don't overlap.

## Sound
All sound is synthesized in the browser, with no audio files.
- **Element attack sounds:** Fire roars and crackles, Water bloops and splashes, Earth thumps and rumbles, Electric zaps and buzzes, Plant whips and rustles, Physical whooshes and punches, Psychic shimmers with a rising warble, Ghost wails downward.
- **Power:** skills up to 45 power play short and soft, up to 75 medium, and above 75 long and loud with extra layers.
- **Skill name layers:** bites snap; beams, shots and darts whistle in; slashes and claws swish; slams and charges add a thud; waves, storms and gales swell; roars, howls and wails add a cry.
- **Results:** a bright two-note chime after a strong hit, a dull thud after a weak one, and a whoosh with a falling tone for a miss.
- **Stereo:** your attacks lean right and your opponent's lean left, for headphone listeners.
- Loudness is balanced per element. Settings has a sound test for every element, the hit results and the left/right placement.

## Save Codes
- The game saves automatically in the browser, which is tied to one device.
- **Copy save code** (Settings) turns the whole game into text starting with `SHARDKIN1.` and tries to copy it to the clipboard; the code is also shown in a box so it can be selected and copied by hand.
- **Load a save code** accepts a pasted code, ignoring spaces and line breaks, shows what the code contains (Shardbinder level, monsters, Shard Dust, furthest world) and asks for confirmation before replacing the current game. Older save formats are upgraded on load.
- The replaced game is kept as a backup, and **Go back to my game from before the last import** swaps them back.

## Balance Pass 1 (after first playtest)
Playtest findings: coins piled up (78,000+ with nothing worth buying), the team outgrew each world by 30 levels through auto-play replays, rewards in World 3 were the same items as World 1, and world bosses fell in about 2 fights.

### Outgrown levels
- Experience is judged per monster against the monster it defeated or caught: full up to 3 levels above it, then 10% less per extra level, never below 10%. Messages note "(outgrown)".
- Battle coins, level-clear coins, chest coins and the wheel's coin prize use the team's highest level against the level's monsters.
- Low-level monsters carried through a level still earn full experience. Auto-play and catching are unchanged.
- On the playtest save, 10 replays of World 3, Level 10 went from 12,950 Shard Dust and 3 to 6 levels per monster to 893 Shard Dust and almost no levels.

### Coins
- Wild battle coins halved (2 per wild monster level instead of 4).
- Upgrades to spend on: Training Yard level 2 (2,000, trains two levels' worth per session) and level 3 (6,000, three levels' worth in 2 hours); Shard Mine levels 4 and 5 (4,000 and 10,000; 80 and 120 Shard Dust per hour); Expedition Dock expansion to 5 slots (4,000); warmer incubators (3,000, eggs in 4 hours) and a third incubator (6,000).
- **Crest Exchange** in the Shop: trade a crest for a random different crest of the same element for 2,000 Shard Dust.
- Loaded Die now 150 Shard Dust and Prism Shard 3,000.

### Item tiers
| Item | Unlocks | Shop price | Effect |
|---|---|---|---|
| Potion | World 1 | 40 | Heals half of one monster |
| Super Potion | World 3 | 180 | Fully heals one monster and clears its status |
| Revive Shard | World 4 | 600 | Revives a fainted team monster at half health, on the board or in battle |
| Team Tonic | World 6 | 900 | Heals every standing team monster by half |
| Binding Shard | World 1 | 60 | Capture item |
| Greater Binding Shard | World 3 | 250 | 1.5 times a Binding Shard's chance |
| Grand Binding Shard | World 5 | 700 | 2.25 times a Binding Shard's chance |
| Fury Shard | World 2 | 300 | 50% more damage for the rest of one battle |
| Ward Shard | World 2 | 300 | A third less damage taken for the rest of one battle |

- Chests, the reward wheel, the wandering merchant and the Shard Forge offer the higher tiers as worlds open (Forge: Super Potion 6, Greater Binding Shard 8, Fury or Ward 10, Revive 15 shards).
- Auto-play uses Super Potions when Potions run out, and the best capture item available.

### World bosses and crests
- World bosses have 16 times normal health and are at least 3 levels above your strongest monster, aiming for about 5 fights. (Superseded: health now comes from your team's strength; see Endgame Update.)
- When you hold a crest that fits a monster you own, the Team and base menu button, the welcome message and the crest's own message say so.

## Base Management
- **Sort** (one button that cycles): newest first (the default), highest level, rarest, by element, or by name.
- **Show:** All, each element you have in your base, Duplicates (species you own more than one of) and Shardborn. Each filter button says how many monsters it shows. Sort and filter are saved.
- **Swap onto team:** when the team is full, each base monster has a Swap button. It asks which team monster goes to base; the newcomer takes that monster's place, including the lead spot.
- **Release:** gives 2 × level × the expedition rarity factor in Shard Dust, plus the monster's elemental shard drop (1 Common or Uncommon, 3 Rare, 5 Epic, 8 Legendary, tripled for Shardborn). Released monsters stay counted in the collection. A confirmation notes if it's the only one of its kind, Shardborn, Epic or Legendary, or infused. Monsters on the team, training or on an expedition can't be released.

## Currencies
- **Shard Dust** is the everyday currency (formerly called coins): earned from battles, level clears, chests, the reward wheel, quests and the Shard Mine; spent in the Shop, on buildings and upgrades, and at the Crest Exchange.
- **Coins** are a rare premium currency, earned only from milestones and never from battles or replays:
  - First-time world clears: 5 + 5 × world number for Worlds 1 to 8 (10 to 45), 75 for each rift
  - 5 per achievement, 5 per weekly quest, 10 per world boss defeated, 5 per Shardborn caught, 10 per tenth Arena floor (first time)
  - Saves from before Coins existed are credited for milestones already reached (the playtest save received 120).
- **Coin Shop** (Camp menu):

| Item | Coins | Effect |
|---|---|---|
| Mythic Egg | 100 | Element of your choice (opened worlds); hatches an Epic (80%) or Legendary (20%) |
| Shardborn Lure | 25 | Shardborn ten times more likely on your next level, including auto-play |
| 3 Prism Shards | 40 | 100% capture items |
| Hurry | 5 | Finishes one training, hatching or expedition timer |
| Chosen Crest | 200 | The exact crest you want, for monsters you own (an exception to random crests) |

- **Egg levels:** eggs now hatch near your team's level: Mythic eggs at your team's average level, other eggs 10 levels below it, never below the element world's starting level.

## Endgame Update
Playtest findings, from a save at World 9 Level 17 with Shardbinder level 72 and four fully infused Legendary final forms, played forward in simulation with auto-play's choices: the 64 remaining campaign levels were cleared on the first try in every run, a World 9 world boss fell in one fight, and the Arena was the only real challenge. The save held 289,715 Shard Dust with every building maxed, 5,022 elemental shards, 53 eggs with empty incubators, and 28 crests none of its monsters could use. Its collection, 97 of 120, was missing 8 Rares, 11 Epics and 4 Legendaries. Enemies grew only with level, while the player grew through rarity, evolution and infusion.

### Fixes
- **Starter crest:** clearing World 3 always gives the Infernox Crest, as Starting the Game promises. Saves that cleared World 3 without holding one or owning an Infernox receive one, once.
- **Experience-based training** needs 30 Shardbinder experience per Shardbinder level, never under 150, fixed when the session starts. Late level clears pay 600 or more, so sessions had been finishing at once and sitting idle.
- **Hatchery:** Fill every free incubator (Mythic eggs first, then the largest piles) and Hatch all ready eggs.
- **Bag:** a camp area with currencies, items, eggs, elemental shards, crests (saying what each one fits) and scrolls. The main menu now shows only Shard Dust and Coins, and the board's Bag shows only what can be used on the board.
- A **one-time update notice** names the new camp areas when an older save loads.

### Collection
- A camp area under Monsters, with Missing (the default while anything is missing), Caught and All filters.
- One heading per element with its caught count. Each monster lists its forms, rarity, whether it's caught and as Shardborn, how many you own, and for an Epic or Legendary line not yet final, its crest and how many you hold.
- How to get each rarity is said once, at the top. Each element then gets one line: the scrolls that matter (owned, the Shop price, or the world clear that gives it) and the worlds its monsters live in.

### Heartcrystal fusion
Opens with Heartcrystal Restored, at the Shard Forge.

| Fusion | Cost | Result |
|---|---|---|
| Mythic egg from shards | 250 shards of the chosen element and 15,000 Shard Dust | A Mythic egg of that element |
| Egg fusion | 10 eggs of any element, taken a few at a time from the largest piles, and 15,000 Shard Dust | A Mythic egg of the chosen element |
| Crest fusion | 3 other crests of the same element and 5,000 Shard Dust | The crest a monster you own is waiting on |

Crest fusion is offered only for lines you own that still need their crest, and never uses a crest that fits one of your monsters. The element chooser at the Forge lists every opened element once fusion is open.

### Trials
- A camp area under Adventure, open after Heartcrystal Restored. Endless tiers: clearing a tier the first time opens the next. Tier 1 monsters are level 101 to 103, and each tier adds 5 levels.
- You choose a cleared world to host each Trial. Its elements fill the board and its prizes; the board is that world's last-level board, with no hidden world boss.
- Wild teams of three, by weight: Common 25, Uncommon 40, Rare 29, Epic 2.5, Legendary 0.5. Wild foes have half the tier in infusions, up to 5.
- The boss is an Epic (75%) or Legendary (25%) final form, 3 levels above the tier's range, with infusions equal to the tier, up to 5.
- Shardborn are three times as likely. Trial monsters can be caught; they arrive in their usual form with no infusions.
- **Five items per run:** healing items, Fury and Ward Shards and Loaded Dice count; capture items don't. Without a limit, Forge potions at 2 shards each let a strong team grind through runs of over 200 actions.
- Clear rewards: 1,000 + 250 × tier Shard Dust and 8 + tier shards of the host's element, Shardbinder experience of 600 + 20 × tier (all doubled on a first clear), and an 8% egg chance. First clears also pay 5 Coins, a Mythic egg every third tier and a Crest Choice every fifth.
- Trial reward wheel, by weight: 500 + 200 × tier Shard Dust 20, 10 + tier shards 18, 2 Grand Binding Shards 16, a Team Tonic and a Revive Shard 14, a quarter level of experience 12, a Prism Shard 8, an egg 6, a Mythic egg 4, a Crest Choice 2.
- A **Crest Choice** takes any crest a monster you own is waiting on, from the Bag.
- Cleared tiers can be replayed or auto-played.
- Achievements: Trial Initiate (tier 1: 3 Prism Shards), Trial Champion (tier 10: a Crest Choice and 10,000 Shard Dust), Trial Legend (tier 25: 2 Crest Choices and 25,000 Shard Dust).
- On the playtest save, the team cleared tiers 1 to 7 nearly always, 8 to 12 some of the time, and stalled at 13; Trial experience then raised it about ten levels over twenty runs, and it found about seven new species.

### World bosses grow with your team
- A world boss takes your team's highest evolution stage (a final form once your team has one) and the team's average infusion.
- Its health aims for about five fights from your current team: each team monster's best expected hit on the boss, times how many of the boss's hits it can take, summed over the team, times 5 fights, times a calibration of 1.1, and never under 4 times normal health. This replaces the flat 16 times normal health.
- World boss fights allow five items per fight, counted like Trials.
- Measured: the playtest team needs about 4 fights using items (6 without), and a team at the end of World 1 about 6 (it needed about 16 before).

## Comfort Update
- **Brief messages** (Settings, on by default for saves at Shardbinder level 10 or higher): attack lines like "Your Skyfulgor, Heavens' Fury: 340, strong. Wild Gaiacore 97 left.", and no repeated tips ("Your Skyfulgor is ready", "Switching is free", "Bosses must be defeated, not captured", "Roll when ready"). Auto-play's spoken summary understands both kinds of message.
- **Install as an app:** a web app manifest, icons (the Heartcrystal as an eight-facet gem, one facet per element color) and a service worker, so the game can be added to the Home Screen and played offline. Safari clears a website's storage after about seven days of browser use without a visit; an installed copy isn't counted that way, and an installed copy asks the browser to keep its storage permanently. Settings explains how to install and shows the storage status.
- **Today's backup:** the game as it was at the first load of each day, restorable from Settings; the replaced game becomes the usual backup.
- **Manage:** each monster row has a Manage button that opens a panel at the top of Team and base: nickname (up to 16 letters, numbers, spaces, apostrophes, periods and hyphens), favorite, crest, release. Nicknamed monsters show their species on their line, and evolution messages name the new form.
- **Favorites** can't be released, sent away or used up in synthesis.
- **Release extras:** releases spare Commons and Uncommons in one go, keeping the best of each species and anything favorited, named, infused, charmed or Shardborn, on the team, training or away. Rares and rarer are never included, since they're synthesis ingredients. A preview lists the count, value and monsters first.
- **Saved teams:** four slots; using one skips monsters that are away or gone.
- **Suggest a team:** in Levels and Trials. Each monster is scored against the world's Uncommon and Rare monsters at that world's last level (or the next Trial tier's level): how many of their best hits it can take, divided by how many of its best hits they can take. The top four make the team, best first. Tested in Trials, the suggestion did at least as well as the playtest team's own order.
- **Base headings:** sorted by element or rarity, the base list has a heading for each group.
- **A gentler first level:** in 400 simulated new games, 29% failed World 1 Level 1 at least once, mostly to a level 6 Rare boss against a lone level 5 Cindercub. World 1 Level 1 now has single wild monsters and an Uncommon boss at level 5; failures dropped to about 5%. The first catch of a new game says that catches wait in the base.

## Sound and Character Update
- **Monster cries:** synthesized, with no audio files, and the same every time for a species. The element sets the voice (Fire a crackling sawtooth, Water a gliding sine with a bubble, Earth a low square with a thump, Electric a buzzing square, Plant a chirping triangle with a rustle, Psychic two voices with vibrato, Ghost a falling wail with an echo, Physical a grunt with a thud). Syllables in the species name set the number of notes (Epics and Legendaries get one more), rarity and evolution set the pitch (rarer and more evolved is lower and slower), the name picks the melody, Legendaries add a low voice, and Shardborn add a crystal shimmer. Cries play when a monster enters battle, yours from the right and your opponent's from the left, and are skipped at fast auto-play speed. Settings can turn them off.
- Measured in Chromium's audio engine: all 192 forms render between 0.3 and 0.9 seconds, none silent or clipped, with average loudness within about 15% across the eight elements.
- **Collection:** in the Caught and All views, each caught species is a button that plays its cry, with its description as the second line; the button doesn't move focus, so you can browse cry after cry. Manage also has the description and the cry.
- **Health tones** (Settings, off by default): after every hit, poison tick, spring, trap or healing item, a tone for that monster's health, two octaves from 220 Hz (nearly out) to 880 Hz (full), yours on the right and your opponent's on the left. A two-note warning plays when your monster drops below a quarter. The sound test has a demo.
- **Descriptions:** one line for each of the 120 species, in `js/lore.js`.

## Build Plan
1. **Core battle** — done (prototype): skills, free switching, element chart, capturing, items, experience.
2. **Levels** — done (prototype): camp with team selection and base, five World 1 levels on 36-space dice boards (battle, healing, trap, portal and quiet spaces), level boss, reward wheel, automatic saving.
3. **Collection and team** — done (prototype): base storage, team selection, leveling and the 2+2 skill unlock.
4. **Progression** — done (prototype): Shardbinder level, shop, daily training, Training Yard and Shard Mine, achievements.
5. **Content** — done (prototype): all eight element worlds with full rosters, evolution, synthesis and status effects.
6. **World bosses** — done (prototype).
7. **Combination worlds** — done (prototype): four to start; more can be added.
8. **Endgame** — done (prototype): Trials, Collection, Bag, Heartcrystal fusion and world bosses that grow with your team.
9. **Multiplayer:** co-op, then PvP and base raids.

Progress will save on the device between sessions.
