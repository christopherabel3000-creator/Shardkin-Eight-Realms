# Shardkin: Eight Realms

A turn-based monster-collecting RPG, built to be fully playable with a screen reader (VoiceOver on iPhone, or any screen reader on a computer).

**Play it:** https://christopherabel3000-creator.github.io/shardkin-eight-realms/

## Current state
Step 1 of the build plan: a battle prototype. Your Fire starter, Cindercub, and two test monsters face random two-monster teams from the Plant world. It includes:

- Skills with element strengths and weaknesses
- Free switching between team members
- Capturing, with the success chance shown before each throw
- Potions, Capture Orbs and a Perfect Orb
- Experience, leveling and skill unlocks
- Optional sound effects

## Accessibility
Every screen section has a heading (What happened, Opponent, Your monster, Skills, Switch monster, Capture and items), and all actions are buttons. After each action, focus moves to "What happened" so the results of the turn are read aloud right away.

## Files
- `index.html` — the game (plain HTML, CSS and JavaScript, no build step)
- `DESIGN.md` — the full game design and build plan
