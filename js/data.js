// Shardkin: Eight Realms — Elements, monsters, rosters, worlds and stat math.
// Files share one global scope and load in the order listed in index.html.
"use strict";

  // ---------- Elements ----------
  const STRONG = {
    Fire: ["Plant"], Water: ["Fire", "Earth"], Earth: ["Fire", "Electric"],
    Electric: ["Water"], Plant: ["Water", "Earth"], Physical: [],
    Psychic: ["Ghost"], Ghost: ["Psychic"]
  };
  function mult(skillEl, defEl) {
    if (STRONG[skillEl].includes(defEl)) return 1.5;
    if (STRONG[defEl].includes(skillEl)) return 0.67;
    return 1;
  }
  function effWord(m) { return m > 1 ? "Strong" : m < 1 ? "Weak" : "Neutral"; }

  // ---------- Monsters ----------
  // forms: names by stage. Stage 1 comes at EVOLVE_LEVEL; stage 2 (Epic/Legendary) needs that monster's crest.
  // skills: [name, element, power, accuracy, optional [status, chance %]]
  const SKILL_UNLOCK = [1, 1, 8, 15];
  const EVOLVE_LEVEL = 16;
  const SP = {
    cindercub: { el: "Fire", rarity: "Epic", forms: ["Cindercub", "Blazefang", "Infernox"], base: { hp: 70, atk: 75, def: 55, spd: 70 },
      skills: [["Ember Swipe", "Fire", 40, 100], ["Pounce", "Physical", 35, 100, ["stun", 25]], ["Flare Burst", "Fire", 70, 90], ["Blazing Crown", "Fire", 95, 85]] },
    // ----- Plant -----
    mossling: { el: "Plant", rarity: "Common", forms: ["Mossling"], base: { hp: 55, atk: 40, def: 50, spd: 35 },
      skills: [["Vine Lash", "Plant", 40, 100], ["Tackle", "Physical", 40, 100], ["Spore Cloud", "Plant", 35, 90, ["sleep", 40]], ["Overgrowth", "Plant", 75, 85]] },
    sproutle: { el: "Plant", rarity: "Common", forms: ["Sproutle"], base: { hp: 45, atk: 50, def: 40, spd: 55 },
      skills: [["Leaf Dart", "Plant", 40, 100], ["Seed Spit", "Plant", 30, 100, ["poison", 30]], ["Razor Leaf", "Plant", 60, 90], ["Bloom Burst", "Plant", 80, 85]] },
    fernkit: { el: "Plant", rarity: "Common", forms: ["Fernkit"], base: { hp: 50, atk: 45, def: 45, spd: 50 },
      skills: [["Frond Slap", "Plant", 40, 100], ["Scratch", "Physical", 35, 100], ["Fern Spiral", "Plant", 60, 90], ["Canopy Drop", "Plant", 80, 85]] },
    budlet: { el: "Plant", rarity: "Common", forms: ["Budlet"], base: { hp: 50, atk: 42, def: 48, spd: 45 },
      skills: [["Bud Bop", "Plant", 40, 100], ["Nuzzle", "Physical", 35, 100], ["Petal Pop", "Plant", 60, 90], ["Full Bloom", "Plant", 80, 85]] },
    twiglet: { el: "Plant", rarity: "Common", forms: ["Twiglet"], base: { hp: 42, atk: 52, def: 38, spd: 58 },
      skills: [["Twig Jab", "Plant", 40, 100], ["Quick Poke", "Physical", 35, 100, ["stun", 20]], ["Bark Snap", "Plant", 60, 90], ["Splinter Rain", "Plant", 80, 85]] },
    thornback: { el: "Plant", rarity: "Uncommon", forms: ["Thornback"], base: { hp: 65, atk: 60, def: 65, spd: 40 },
      skills: [["Thorn Volley", "Plant", 55, 95, ["poison", 25]], ["Shell Bash", "Physical", 45, 100], ["Briar Wall", "Plant", 70, 90], ["Spine Storm", "Plant", 90, 85]] },
    petalwing: { el: "Plant", rarity: "Uncommon", forms: ["Petalwing"], base: { hp: 50, atk: 60, def: 45, spd: 70 },
      skills: [["Petal Gust", "Plant", 50, 100], ["Peck", "Physical", 40, 100], ["Pollen Dive", "Plant", 70, 90], ["Blossom Gale", "Plant", 90, 85]] },
    mushwick: { el: "Plant", rarity: "Uncommon", forms: ["Mushwick"], base: { hp: 70, atk: 50, def: 60, spd: 30 },
      skills: [["Spore Puff", "Plant", 40, 100, ["sleep", 30]], ["Cap Slam", "Physical", 45, 100], ["Mycelium Grip", "Earth", 60, 90], ["Fungal Bloom", "Plant", 85, 85]] },
    briarfox: { el: "Plant", rarity: "Uncommon", forms: ["Briarfox"], base: { hp: 55, atk: 65, def: 45, spd: 72 },
      skills: [["Briar Bite", "Plant", 50, 100], ["Swift Claw", "Physical", 45, 100], ["Thorn Dash", "Plant", 70, 90], ["Wild Hunt", "Physical", 85, 85]] },
    bramblehorn: { el: "Plant", rarity: "Rare", forms: ["Bramblehorn", "Elderhorn"], base: { hp: 75, atk: 75, def: 70, spd: 50 },
      skills: [["Bramble Charge", "Plant", 65, 95], ["Root Bind", "Earth", 50, 100, ["stun", 25]], ["Thicket Crush", "Plant", 80, 90], ["Ancient Grove", "Plant", 100, 85]] },
    lilypaw: { el: "Plant", rarity: "Rare", forms: ["Lilypaw", "Lotuslynx"], base: { hp: 65, atk: 70, def: 60, spd: 75 },
      skills: [["Lily Swipe", "Plant", 55, 100], ["Dew Splash", "Water", 50, 100], ["Lotus Pounce", "Plant", 75, 90], ["Tidal Bloom", "Water", 85, 85]] },
    cactling: { el: "Plant", rarity: "Rare", forms: ["Cactling", "Saguardian"], base: { hp: 65, atk: 72, def: 82, spd: 35 },
      skills: [["Needle Shot", "Plant", 55, 100, ["poison", 25]], ["Sand Jab", "Earth", 50, 100], ["Spine Barrage", "Plant", 75, 90], ["Desert Crown", "Earth", 85, 85]] },
    seedrake: { el: "Plant", rarity: "Epic", forms: ["Seedrake", "Grovedrake", "Sylvanwyrm"], base: { hp: 75, atk: 80, def: 65, spd: 65 },
      skills: [["Seed Breath", "Plant", 60, 100], ["Tail Whip", "Physical", 50, 100], ["Grove Fang", "Plant", 80, 90], ["Verdant Roar", "Plant", 100, 85]] },
    mothbloom: { el: "Plant", rarity: "Epic", forms: ["Mothbloom", "Moonmoth", "Eclipse Moth"], base: { hp: 65, atk: 78, def: 60, spd: 85 },
      skills: [["Pollen Wing", "Plant", 60, 100], ["Dream Dust", "Psychic", 50, 100, ["sleep", 40]], ["Moonpetal", "Plant", 80, 90], ["Eclipse Veil", "Psychic", 95, 85]] },
    saplord: { el: "Plant", rarity: "Legendary", forms: ["Saplord", "Oakenreign", "Worldroot"], base: { hp: 95, atk: 90, def: 90, spd: 60 },
      skills: [["Root Strike", "Plant", 70, 100], ["Stone Grip", "Earth", 60, 100, ["stun", 25]], ["Ancient Bloom", "Plant", 90, 90], ["Worldroot Wrath", "Plant", 110, 85]] },
    // ----- Water -----
    puddlepup: { el: "Water", rarity: "Common", forms: ["Puddlepup"], base: { hp: 55, atk: 45, def: 45, spd: 45 },
      skills: [["Splash Bite", "Water", 40, 100], ["Tackle", "Physical", 40, 100], ["Puddle Pounce", "Water", 60, 90], ["Rain Howl", "Water", 80, 85]] },
    bubblet: { el: "Water", rarity: "Common", forms: ["Bubblet"], base: { hp: 45, atk: 40, def: 50, spd: 55 },
      skills: [["Bubble Pop", "Water", 40, 100], ["Bubble Lull", "Water", 30, 95, ["sleep", 40]], ["Foam Burst", "Water", 60, 90], ["Bubble Storm", "Water", 80, 85]] },
    driftling: { el: "Water", rarity: "Common", forms: ["Driftling"], base: { hp: 50, atk: 42, def: 48, spd: 50 },
      skills: [["Drift Slap", "Water", 40, 100], ["Nudge", "Physical", 35, 100], ["Current Spin", "Water", 60, 90], ["Undertow", "Water", 80, 85]] },
    shellkin: { el: "Water", rarity: "Common", forms: ["Shellkin"], base: { hp: 60, atk: 40, def: 62, spd: 30 },
      skills: [["Shell Smack", "Physical", 40, 100], ["Brine Squirt", "Water", 40, 100], ["Pearl Shot", "Water", 60, 90], ["Clam Crush", "Physical", 80, 85]] },
    splashrat: { el: "Water", rarity: "Common", forms: ["Splashrat"], base: { hp: 42, atk: 52, def: 38, spd: 62 },
      skills: [["Wet Nip", "Water", 40, 100], ["Gnaw", "Physical", 35, 100, ["stun", 20]], ["Spray Dash", "Water", 60, 90], ["Flash Flood", "Water", 80, 85]] },
    tidecrab: { el: "Water", rarity: "Uncommon", forms: ["Tidecrab"], base: { hp: 65, atk: 60, def: 70, spd: 35 },
      skills: [["Tide Pinch", "Water", 50, 100, ["stun", 20]], ["Claw Bash", "Physical", 45, 100], ["Surf Slam", "Water", 70, 90], ["Crab Hammer", "Water", 90, 85]] },
    reefwing: { el: "Water", rarity: "Uncommon", forms: ["Reefwing"], base: { hp: 52, atk: 60, def: 45, spd: 72 },
      skills: [["Reef Dive", "Water", 50, 100], ["Venom Dart", "Physical", 40, 100, ["poison", 30]], ["Coral Gust", "Water", 70, 90], ["Reef Tempest", "Water", 90, 85]] },
    mistnewt: { el: "Water", rarity: "Uncommon", forms: ["Mistnewt"], base: { hp: 55, atk: 58, def: 52, spd: 60 },
      skills: [["Mist Lick", "Water", 50, 100], ["Haze Daze", "Psychic", 40, 100, ["sleep", 30]], ["Fog Lash", "Water", 70, 90], ["Mire Wave", "Water", 90, 85]] },
    coralhound: { el: "Water", rarity: "Uncommon", forms: ["Coralhound"], base: { hp: 62, atk: 64, def: 55, spd: 55 },
      skills: [["Coral Fang", "Water", 50, 100], ["Pack Rush", "Physical", 45, 100], ["Reef Howl", "Water", 70, 90], ["Abyss Bite", "Water", 90, 85]] },
    rippleray: { el: "Water", rarity: "Rare", forms: ["Rippleray", "Stormray"], base: { hp: 65, atk: 70, def: 60, spd: 75 },
      skills: [["Ripple Glide", "Water", 65, 95], ["Shock Tail", "Electric", 50, 100, ["stun", 30]], ["Wave Cutter", "Water", 80, 90], ["Storm Surge", "Electric", 95, 85]] },
    frostfin: { el: "Water", rarity: "Rare", forms: ["Frostfin", "Glacierfin"], base: { hp: 70, atk: 72, def: 65, spd: 55 },
      skills: [["Chill Fin", "Water", 65, 95], ["Frost Bite", "Physical", 50, 100, ["stun", 25]], ["Glacial Rush", "Water", 80, 90], ["Frozen Deep", "Water", 100, 85]] },
    kelpling: { el: "Water", rarity: "Rare", forms: ["Kelpling", "Kelpwarden"], base: { hp: 75, atk: 65, def: 75, spd: 45 },
      skills: [["Kelp Whip", "Water", 60, 100], ["Seaweed Snare", "Plant", 50, 100, ["poison", 30]], ["Tidal Coil", "Water", 80, 90], ["Kelp Forest", "Plant", 90, 85]] },
    tidalisk: { el: "Water", rarity: "Epic", forms: ["Tidalisk", "Torrentisk", "Abyssalisk"], base: { hp: 75, atk: 82, def: 65, spd: 65 },
      skills: [["Torrent Fang", "Water", 60, 100], ["Coil Crush", "Physical", 50, 100, ["stun", 25]], ["Riptide", "Water", 80, 90], ["Abyssal Torrent", "Water", 100, 85]] },
    pearlcalf: { el: "Water", rarity: "Epic", forms: ["Pearlcalf", "Pearlwhale", "Leviathal"], base: { hp: 90, atk: 70, def: 75, spd: 45 },
      skills: [["Pearl Spout", "Water", 60, 100], ["Whale Song", "Psychic", 50, 100, ["sleep", 40]], ["Breach Slam", "Water", 80, 90], ["Deep Leviathan", "Water", 100, 85]] },
    deepcrown: { el: "Water", rarity: "Legendary", forms: ["Deepcrown", "Tidemonarch", "Oceanheart"], base: { hp: 95, atk: 90, def: 88, spd: 65 },
      skills: [["Crown Wave", "Water", 70, 100], ["Pressure Bind", "Physical", 60, 100, ["stun", 25]], ["Sovereign Tide", "Water", 90, 90], ["Ocean's Heart", "Water", 110, 85]] }
  };
  // ----- Worlds 3 to 8, in a compact form -----
  // id | forms (slash-separated) | rarity | hp,atk,def,spd | four skills separated by ";".
  // A skill can add ":Element" (otherwise it matches the monster) and ":sleep30" style status chances.
  // Power and accuracy come from the rarity templates below.
  const POWER = { Common: [40, 35, 60, 80], Uncommon: [50, 45, 70, 90], Rare: [65, 50, 80, 100], Epic: [60, 50, 80, 100], Legendary: [70, 60, 90, 110] };
  const ACC = [100, 100, 90, 85];
  const ROSTER = {
    Fire: `
emberling|Emberling|Common|50,48,42,52|Ember Nip;Scratch:Physical;Cinder Toss;Flame Rush
ashmouse|Ashmouse|Common|42,52,38,62|Ash Bite;Smoke Puff:sleep30;Hot Dash;Scorch Rush
kindlet|Kindlet|Common|55,44,48,40|Kindle Bump;Tackle:Physical;Fire Spin;Blaze Wheel
flarefly|Flarefly|Common|44,50,40,60|Flicker;Dazzle:Psychic:stun20;Flare Dart;Firefly Swarm
coalpup|Coalpup|Common|58,46,52,38|Coal Bite;Headbutt:Physical;Ember Fang;Furnace Charge
magmole|Magmole|Uncommon|65,58,68,38|Magma Dig;Rock Paw:Earth;Lava Burst;Molten Quake:Earth
pyrofox|Pyrofox|Uncommon|52,64,46,72|Fox Fire;Quick Bite:Physical;Blaze Tail;Inferno Dash
smoulderbat|Smoulderbat|Uncommon|55,58,50,62|Heat Wing;Smoke Screech:Ghost:sleep30;Ember Swoop;Firestorm
cinderhorn|Cinderhorn|Uncommon|66,62,60,48|Horn Singe;Ram:Physical:stun20;Scorch Charge;Volcanic Ram
blazewing|Blazewing/Pyrewing|Rare|62,72,58,78|Flame Peck;Gust:Physical;Sunfire Dive;Rebirth Blaze
lavaback|Lavaback/Magmatortle|Rare|80,66,82,35|Lava Shell;Rock Slam:Earth:stun25;Magma Wave;Eruption
salamandrite|Salamandrite/Salamancer|Rare|65,74,60,70|Flame Lash;Toxic Tongue:Physical:poison30;Fire Whirl;Hellfire
kilnling|Kilnling/Kilnbeast/Forgetitan|Epic|85,80,75,45|Kiln Punch;Iron Slam:Physical:stun25;Forge Blast;Titan Furnace
solkit|Solkit/Solarion/Sunsovereign|Legendary|90,92,82,72|Solar Flare;Radiant Roar:Psychic:stun25;Sun Pillar;Supernova`,
    Earth: `
pebblet|Pebblet|Common|60,50,70,30|Rock Toss;Headbutt:Physical;Quake Stomp;Boulder Crash
dustmite|Dustmite|Common|44,48,46,56|Dust Kick;Grit Spray:stun20;Sand Burst;Dune Rush
burrowbun|Burrowbun|Common|52,46,48,54|Dig Hop;Thump:Physical;Mud Shot;Tunnel Strike
claypod|Claypod|Common|62,40,62,30|Clay Slap;Mud Glob:stun20;Clay Crush;Golem Fist
rocklet|Rocklet|Common|50,52,60,36|Pebble Shot;Roll:Physical;Rock Slide;Stone Edge
quarryhog|Quarryhog|Uncommon|70,62,66,40|Tusk Dig;Charge:Physical:stun20;Quarry Slam;Landslide
sandviper|Sandviper|Uncommon|54,64,48,70|Sand Fang:poison30;Coil:Physical;Dune Strike;Desert Venom
cragowl|Cragowl|Uncommon|56,58,56,62|Crag Talon;Hypno Stare:Psychic:sleep30;Rock Dive;Canyon Gale
geodemite|Geodemite|Uncommon|60,56,72,42|Geode Pop;Crystal Glint:Psychic;Shard Burst;Geode Quake
golemite|Golemite/Golemon|Rare|82,72,85,30|Stone Fist;Body Slam:Physical:stun25;Rock Crusher;Mountain Fall
tremorhound|Tremorhound/Quakehound|Rare|66,76,60,70|Tremor Bite;Ground Howl:stun25;Fault Line;Seismic Pounce
amberix|Amberix/Amberlord|Rare|70,68,78,48|Amber Shot;Resin Trap:Plant:sleep30;Fossil Blast;Ancient Amber
quakelet|Quakelet/Quakadon/Worldshaker|Epic|85,84,78,50|Quake Bite;Tail Slam:Physical:stun25;Earth Crush;World Shatter
glintmole|Glintmole/Gemborer/Crystalking|Epic|75,78,80,60|Gem Claw;Prism Flash:Psychic:sleep30;Crystal Drill;Geode Cataclysm
pebblord|Pebblord/Stonemonarch/Gaiacore|Legendary|98,90,95,50|Core Strike;Gravity Bind:Psychic:stun25;Tectonic Fury;Gaia's Wrath`,
    Electric: `
sparkit|Sparkit|Common|45,55,40,80|Static Nip;Quick Dash:Physical:stun20;Volt Arc;Storm Coil
zappip|Zappip|Common|48,50,42,62|Zap;Peck:Physical;Charge Beam;Thunder Peck
voltbug|Voltbug|Common|46,46,50,55|Buzz Shock:stun20;Bite:Physical;Volt Swarm;Megawatt Buzz
wattling|Wattling|Common|52,48,46,50|Watt Bump;Tackle:Physical;Spark Ball;Power Surge
fizzlet|Fizzlet|Common|42,54,38,64|Fizz;Pop:Physical;Static Burst;Fizz Bomb
thunderpaw|Thunderpaw|Uncommon|54,64,48,72|Thunder Paw;Pounce:Physical;Volt Claw;Lightning Lunge
ampereel|Ampereel|Uncommon|60,60,52,60|Eel Shock:stun25;Wrap:Physical;Ampere Wave;Megavolt
dynamole|Dynamole|Uncommon|66,58,64,42|Dynamo Dig;Ground Spark:Earth;Charge Burst;Overload
glowmoth|Glowmoth|Uncommon|52,60,44,70|Glow Dust:sleep30;Wing Bash:Physical;Neon Gust;Plasma Glow
stormhawk|Stormhawk/Tempestalon|Rare|64,74,56,82|Bolt Talon;Gale:Physical;Thunder Dive;Tempest Strike
voltigon|Voltigon/Gigavolt|Rare|78,70,72,50|Volt Ram;Magnet Bind:Physical:stun25;Gigawatt Beam;Grid Collapse
plasmink|Plasmink/Plasmalynx|Rare|64,72,60,78|Plasma Swipe;Mind Spark:Psychic:sleep30;Arc Pounce;Plasma Storm
boltling|Boltling/Thundrake/Stormtyrant|Epic|78,84,66,72|Bolt Fang;Static Roar:stun25;Thunder Breath;Storm Cataclysm
coilbot|Coilbot/Teslatron/Omnicoil|Epic|75,76,80,58|Coil Zap;Magnet Field:Physical:stun25;Tesla Beam;Omega Discharge
fulmit|Fulmit/Fulminar/Skyfulgor|Legendary|92,94,80,80|Sky Bolt;Thunderclap:Physical:stun25;Fulmination;Heavens' Fury`,
    Psychic: `
mindlet|Mindlet|Common|48,50,46,50|Mind Poke;Bonk:Physical;Psy Wave;Mind Blast
dozepuff|Dozepuff|Common|55,40,52,40|Doze Puff:sleep40;Tackle:Physical;Dream Beam;Lull Burst
hootwit|Hootwit|Common|46,52,44,58|Hoot;Peck:Physical;Psybeam;Wisdom Strike
prismite|Prismite|Common|44,54,48,52|Prism Spark;Glint:Physical:stun20;Light Ray;Spectrum Burst
gazekin|Gazekin|Common|50,48,48,54|Gaze:stun20;Nudge:Physical;Third Eye;Mind Crush
seerling|Seerling|Uncommon|56,62,50,62|Foresight Jab;Palm Strike:Physical;Psy Lance;Prophecy
mesmoth|Mesmoth|Uncommon|52,60,46,70|Mesmer Wing:sleep30;Gust:Physical;Hypno Beam;Trance Storm
levitoad|Levitoad|Uncommon|66,56,62,40|Float Slam;Tongue Lash:Physical:stun20;Gravity Pulse;Levitate Crash
runefox|Runefox|Uncommon|54,64,48,68|Rune Bite;Fox Feint:Physical;Glyph Blast;Arcane Pounce
astralynx|Astralynx/Cosmolynx|Rare|64,74,58,78|Astral Claw;Star Gaze:sleep30;Nebula Pounce;Cosmic Rift
sagebeak|Sagebeak/Archsage|Rare|70,70,70,55|Sage Peck;Mind Lock:stun25;Psystorm;Enlightenment
dreamdeer|Dreamdeer/Dreamstag|Rare|72,68,66,62|Dream Kick;Antler Ram:Physical;Reverie;Waking Nightmare:Ghost
cerebrix|Cerebrix/Cerebrion/Omnicerebra|Epic|72,86,62,74|Brain Wave;Mind Snap:stun25;Psionic Burst;Mind Singularity
lunakit|Lunakit/Lunaria/Eclipsera|Epic|78,80,68,70|Moon Beam;Lunar Lullaby:sleep40;Crescent Slash:Physical;Total Eclipse
aethling|Aethling/Aetherion/Aetherthrone|Legendary|92,95,82,78|Aether Pulse;Time Stop:stun25;Reality Warp;Infinite Mind`,
    Ghost: `
wispling|Wispling|Common|44,52,40,60|Wisp Touch;Lick:Physical:stun20;Shadow Ball;Spirit Flare
gloomkit|Gloomkit|Common|50,48,46,50|Gloom Swipe;Scratch:Physical;Shade Pounce;Night Claw
murkmoth|Murkmoth|Common|46,50,44,56|Murk Dust:sleep30;Flutter:Physical;Shadow Wing;Dusk Swarm
boneling|Boneling|Common|56,46,56,36|Bone Tap;Rattle:Physical:stun20;Grave Toss;Ossuary Crash
sheetsy|Sheetsy|Common|48,44,50,48|Boo;Sheet Wrap:Physical;Haunt;Phantom Fright
ghoulcrow|Ghoulcrow|Uncommon|54,62,46,70|Grave Peck;Caw:Physical:stun20;Curse Dive;Murder Flock
lanternwisp|Lanternwisp|Uncommon|56,60,52,56|Lantern Glow:sleep30;Bump:Physical;Wisp Burn:Fire;Soul Lantern
cryptbat|Cryptbat|Uncommon|52,62,48,68|Crypt Bite:poison30;Wing Slap:Physical;Shadow Swoop;Night Shroud
mournhound|Mournhound|Uncommon|66,62,58,50|Mourn Howl;Grave Bite:Physical;Spirit Fang;Requiem Rush
specterfox|Specterfox/Wraithfox|Rare|62,74,56,80|Specter Bite;Vanish Strike:Physical;Ectoplasm;Wraith Rush
gravekeep|Gravekeep/Graveward|Rare|80,68,80,40|Grave Toll;Shovel Smack:Physical:stun25;Tomb Slam;Last Rites
eeriel|Eeriel/Eeriseraph|Rare|64,72,60,74|Chill Touch;Eerie Wail:sleep30;Soul Siphon;Seraph's Lament:Psychic
shadelet|Shadelet/Shadewyrm/Umbradragon|Epic|76,84,64,72|Shade Fang;Fear Roar:stun25;Umbral Breath;Eclipse of Souls
hexling|Hexling/Hexcaller/Hexsovereign|Epic|72,82,66,70|Hex Bolt;Curse Mark:poison30;Voodoo Burst;Grand Hex
soulkin|Soulkin/Soulreaver/Soulmonarch|Legendary|92,95,80,78|Soul Strike;Spirit Chain:Physical:stun25;Netherstorm;Final Judgment`,
    Physical: `
pugilet|Pugilet|Common|55,56,48,48|Jab;Uppercut;Haymaker;Flurry
scrapcat|Scrapcat|Common|46,54,40,62|Scratch;Pounce:stun20;Fury Swipes;Alley Rush
buffbun|Buffbun|Common|56,52,48,52|Hop Kick;Ear Slap;Double Kick;Moon Drop
gruntle|Gruntle|Common|62,50,56,34|Grunt Bash;Stomp:stun20;Body Check;Belly Flop
kickit|Kickit|Common|48,56,44,58|Low Kick;Tail Smack;Spin Kick;Tornado Kick
brawlbear|Brawlbear|Uncommon|72,66,62,40|Bear Swipe;Bear Hug:stun20;Maul;Grizzly Rush
staffmonk|Staffmonk|Uncommon|56,62,54,64|Staff Strike;Focus Palm:Psychic;Whirl Staff;Hundred Blows
ironhorn|Ironhorn|Uncommon|68,64,70,40|Horn Jab;Iron Charge:stun20;Battering Ram;Rhino Rampage
flexfrog|Flexfrog|Uncommon|56,60,48,68|Frog Kick;Tongue Whip:stun20;Leap Smash;Bounce Barrage
cubrawl|Cubrawl/Grandbrawl|Rare|74,78,64,58|Power Punch;Stunning Blow:stun25;Mega Punch;Knockout
wrestlotl|Wrestlotl/Grapplotl|Rare|78,72,72,48|Grapple;Headlock:stun25;Suplex;Piledriver
swiftail|Swiftail/Blitztail|Rare|62,72,56,84|Swift Strike;Feint;Blitz;Afterimage Assault
oxling|Oxling/Titanox/Colossox|Epic|88,86,78,48|Horn Gore;Stampede:stun25;Titan Charge;Colossal Crash
fistling|Fistling/Fistmaster/Grandfist|Epic|74,90,62,76|Rapid Fist;Pressure Point:stun25;Dragon Fist;Ultimate Strike
atlaslet|Atlaslet/Atlasaur/Worldbearer|Legendary|98,96,90,60|Atlas Punch;Earthshake:Earth:stun25;Titan Hold;World Breaker`
  };
  const EXTRA_POOLS = {};
  for (const [el, text] of Object.entries(ROSTER)) {
    EXTRA_POOLS[el] = { Common: [], Uncommon: [], Rare: [], Epic: [], Legendary: [] };
    for (const line of text.trim().split("\n")) {
      const [id, forms, rarity, stats, skills] = line.split("|");
      const [hp, atk, def, spd] = stats.split(",").map(Number);
      SP[id] = { el, rarity, forms: forms.split("/"), base: { hp, atk, def, spd },
        skills: skills.split(";").map((sk, i) => {
          const parts = sk.split(":"), out = [parts[0], el, POWER[rarity][i], ACC[i]];
          for (const p of parts.slice(1)) {
            const st = p.match(/^(sleep|stun|poison)(\d+)$/);
            if (st) out[4] = [st[1], Number(st[2])]; else out[1] = p;
          }
          return out;
        }) };
      EXTRA_POOLS[el][rarity].push(id);
    }
  }
  // Cindercub, the starter, is one of the Fire element's two Epics.
  EXTRA_POOLS.Fire.Epic.unshift("cindercub");
  function crestName(id) { return `${SP[id].forms[2]} Crest`; }
  const POOLS = {
    Plant: { Common: ["mossling", "sproutle", "fernkit", "budlet", "twiglet"], Uncommon: ["thornback", "petalwing", "mushwick", "briarfox"],
      Rare: ["bramblehorn", "lilypaw", "cactling"], Epic: ["seedrake", "mothbloom"], Legendary: ["saplord"] },
    Water: { Common: ["puddlepup", "bubblet", "driftling", "shellkin", "splashrat"], Uncommon: ["tidecrab", "reefwing", "mistnewt", "coralhound"],
      Rare: ["rippleray", "frostfin", "kelpling"], Epic: ["tidalisk", "pearlcalf"], Legendary: ["deepcrown"] }
  };
  Object.assign(POOLS, EXTRA_POOLS);
  const ELEMENTS = ["Plant", "Water", "Fire", "Earth", "Electric", "Psychic", "Ghost", "Physical"];
  // Eight element worlds, then combination worlds that mix two elements' monsters at higher levels.
  const WORLDS = [
    { els: ["Plant"], levels: 5 }, { els: ["Water"], levels: 5 }, { els: ["Fire"], levels: 10 }, { els: ["Earth"], levels: 10 },
    { els: ["Electric"], levels: 15 }, { els: ["Psychic"], levels: 15 }, { els: ["Ghost"], levels: 15 }, { els: ["Physical"], levels: 15 },
    { els: ["Fire", "Water"], levels: 20 }, { els: ["Electric", "Psychic"], levels: 20 }, { els: ["Earth", "Plant"], levels: 20 }, { els: ["Ghost", "Physical"], levels: 20 }
  ];
  WORLDS.forEach(W => { W.name = W.els.join(" and "); });
  // Each realm formed around one shard of the Heartcrystal; the rifts are where two shards ground together.
  const PROLOGUE = "Long ago, the Heartcrystal held the eight elements in balance. When it shattered, each shard fell to the ground and grew a realm around itself, and the creatures born from its splinters became the Shardkin. You are a Shardbinder, one of the few who can bind Shardkin to a team. Journey shard by shard, and perhaps the Heartcrystal can be made whole again.";
  const EPILOGUE = "With all eight shards bound, the Heartcrystal glows whole for the first time in an age. But the rifts where shards once ground together remain open, and stronger Shardkin are pouring out of them.";
  const WORLD_TITLES = ["Verdant Shard", "Tidal Shard", "Ember Shard", "Stone Shard", "Storm Shard", "Dream Shard", "Hollow Shard", "Iron Shard", "Steam Rift", "Mindstorm Rift", "Overgrown Rift", "Phantom Rift"];
  const WORLD_LORE = [
    "The Verdant Shard fell into a forest and never stopped growing. Its Shardkin bloom, creep and tangle.",
    "The Tidal Shard sank beneath the sea, and its pull still moves the tides. Its Shardkin swim, surge and drift.",
    "The Ember Shard landed burning and has never cooled. Its Shardkin blaze through ash and cinder, and somewhere here waits the crest that could awaken Infernox.",
    "The Stone Shard buried itself deep and raised mountains around it. Its Shardkin are as patient and heavy as rock.",
    "The Storm Shard split the sky and still crackles in the clouds. Its Shardkin move faster than thunder.",
    "The Dream Shard hums at the edge of sleep. Its Shardkin bend thought, memory and time.",
    "The Hollow Shard fell where nothing lives, and things that should be gone linger around it. Its Shardkin drift between here and elsewhere.",
    "The Iron Shard holds no element at all, only strength. Its Shardkin trust their fists, hooves and horns.",
    "Where the Ember and Tidal Shards ground together, the air boils. Fire and Water Shardkin fight for every inch.",
    "Lightning and thought tangle where the Storm and Dream Shards meet.",
    "Roots split stone where the Verdant and Stone Shards collide.",
    "Where the Hollow and Iron Shards met, the restless dead learned to fight."
  ];
  WORLDS.forEach((W, i) => { W.title = WORLD_TITLES[i]; W.lore = WORLD_LORE[i]; });
  function worldPool(w, tier) { return world(w).els.flatMap(e => POOLS[e][tier]); }
  function worldEl(w) { return pickFrom(world(w).els); }
  function levelIndex(w, n) { let g = 0; for (let i = 1; i < w; i++) g += world(i).levels; return g + n - 1; }
  function elementWorld(el) { return WORLDS.findIndex(W => W.els.length === 1 && W.els[0] === el) + 1; }
  function poolIds(el) { return Object.values(POOLS[el]).flat(); }
  function crestSpecies(el) { return [...POOLS[el].Epic, ...POOLS[el].Legendary]; }
  function world(w) { return WORLDS[w - 1]; }
  // Chance per wild monster. Rare or better is about 1 in 40 fights of two monsters.
  const RARITY_WEIGHT = [["Common", 68], ["Uncommon", 30.75], ["Rare", 1], ["Epic", 0.2], ["Legendary", 0.05]];
  const CAPTURE_MULT = { Common: 1, Uncommon: 0.75, Rare: 0.5, Epic: 0.3, Legendary: 0.15 };
  const STATUS_CAPTURE = { sleep: 1.5, stun: 1.5, poison: 1.2 };
  const XP_MULT = { Common: 1, Uncommon: 1.3, Rare: 1.8, Epic: 2.5, Legendary: 3.5 };
  function wildRange(w, n) { const lo = 3 + levelIndex(w, n) + (w - 1); return [lo, lo + 1]; }

  function calc(m) {
    // Evolution adds 20% per stage, Shardborn add 10%, and each Forge infusion adds 3%.
    const b = SP[m.id].base, L = m.level, k = (1 + 0.2 * (m.stage || 0)) * (m.shard ? 1.1 : 1) * (1 + 0.03 * (m.infuse || 0));
    m.maxHp = Math.floor(b.hp * k * L / 20) + L + 10;
    m.atk = Math.floor(b.atk * k * L / 25) + 5;
    m.def = Math.floor(b.def * k * L / 25) + 5;
    m.spd = Math.floor(b.spd * k * L / 25) + 5;
  }
  function formName(m) { return (m.shard ? "Shardborn " : "") + SP[m.id].forms[m.stage]; }
  function makeMon(id, level, shard) {
    const s = SP[id];
    const m = { id, name: s.forms[0], el: s.el, rarity: s.rarity, level, xp: 0, stage: 0, status: null, shard: !!shard, infuse: 0 };
    if (s.forms.length > 1 && level >= EVOLVE_LEVEL) m.stage = 1;
    m.name = formName(m);
    calc(m); m.hp = m.maxHp; return m;
  }
  function skillsOf(m) {
    return SP[m.id].skills.map((s, i) => ({ name: s[0], el: s[1], power: s[2], acc: s[3], unlock: SKILL_UNLOCK[i], st: s[4] ? s[4][0] : null, stc: s[4] ? s[4][1] : 0 }));
  }
  function unlocked(m) { return skillsOf(m).filter(s => m.level >= s.unlock); }
  function xpNeed(L) { return 10 * L + 3 * L * L; }
  function rand(a, b) { return a + Math.floor(Math.random() * (b - a + 1)); }
  function pickFrom(list) { return list[Math.floor(Math.random() * list.length)]; }
  function pickWeighted(list) {
    const total = list.reduce((s, x) => s + x[1], 0);
    let r = Math.random() * total;
    for (const x of list) { if (r < x[1]) return x[0]; r -= x[1]; }
    return list[0][0];
  }
