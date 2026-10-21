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
- Completing an element's world awards a random final-form item for that element.
- Replaying the last level of a completed world gives a chance (not guaranteed) at another one on the reward wheel.
- The randomness is deliberate: it encourages collecting every monster and replaying old levels.

### Leveling
Monsters gain experience from battles and daily training. Every defeated or captured monster gives experience to every standing monster on the team, including monsters that didn't fight. Fainted monsters don't earn it. Monster levels are separate from the player level.

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
- Player levels unlock features over time, such as the shop, the arena and new base buildings. This doubles as a gradual tutorial.
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
| Reach player level 5 | TBD |
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

## Build Plan
1. **Core battle** — done (prototype): skills, free switching, element chart, capturing, items, experience.
2. **Levels** — done (prototype): camp with team selection and base, five World 1 levels on 36-space dice boards (battle, healing, trap, portal and quiet spaces), level boss, reward wheel, automatic saving.
3. **Collection and team:** base storage, team selection, leveling and the 2+2 skill unlock.
4. **Progression:** player level, shop, daily training, base buildings, passive income, achievements.
5. **Content:** evolution, synthesis, and worlds 2 through 8.
6. **World bosses.**
7. **Combination worlds.**
8. **Multiplayer:** co-op, then PvP and base raids.

Progress will save on the device between sessions.
