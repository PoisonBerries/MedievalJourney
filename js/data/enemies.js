// ============================================================================
// ENEMIES.JS — stat blocks as "dmg/hp" straight from the original notes.
// ============================================================================
function foe(name, sprite, dmg, hp, range, extra = {}) {
  return { name, sprite, dmg, hp, range, canFlee: true, ...extra };
}

const Enemies = {
  babyDragon: () => foe('Baby Dragon', 'e_babydragon', 1, 1, true),
  ogreSleepy: () => foe('Startled Ogre', 'e_ogre', 5, 1, false),
  ogreFull: () => foe('Well-Fed Ogre', 'e_ogre', 5, 4, false),
  babyOgre: () => foe('Baby Ogre', 'e_babyogre', 1, 1, true),
  giant: () => foe('Hill Giant', 'e_giant', 5, 6, false, { canFlee: false }),
  vegetableLamb: () => foe('Vegetable Lamb of Tartary', 'e_vegetablelamb', 0, 5, false),
  centicore: () => foe('Centicore', 'e_centicore', 7, 4, true),
  mamaDragon: () => foe('Mama Dragon', 'e_mamadragon', 2, 6, false),
  snowMonster: () => foe('Snow Monster', 'e_snowmonster', 1, 1, false),
  snowDragon: () => foe('Snow Dragon', 'e_snowdragon', 1, 7, false),
  frogBears1: () => foe('Frog-Legged Bear', 'e_frogbear', 4, 6, false),
  mamaBear: () => foe('Mama Bear', 'e_mamabear', 4, 6, false),
  cub: () => foe('Bear Cub', 'e_cub', 1, 2, true),
  serpentMelee: () => foe('Serpent', 'e_serpent', 3, 6, false),
  serpentRanged: () => foe('Venomous Serpent', 'e_serpent', 2, 9, true),
  giantToad: () => foe('Giant Toad', 'e_toad', 8, 8, true), // ranged via its tongue
  crows: () => foe('Flock of Crows', 'e_crow', 1, 10, false),
  tortoise: () => foe('Fat Tortoise', 'e_tortoise', 5, 15, false, { canFlee: false }),
  shark: () => foe('Shark', 'e_shark', 5, 10, false),
  bushMonster: () => foe('Bush Monster', 'e_bushmonster', 0, 4, false),
  goatMonster: () => foe('Centicore (Goat Monster)', 'e_centicore', 7, 4, true),
  guardFred: () => foe('Fred the Guard', 'e_soldier', 1, 8, false),
  guardArcher: () => foe('Gate Archer', 'e_archer', 3, 3, true),
  titus: () => foe('Titus the Destroyer', 'e_soldier', 10, 1, false, { onDeathDamage: 1 }),
  goblinSwarm: () => foe('Betsy\'s Goblin Swarm (500 strong!)', 'e_goblin', 1, 20, false, { canFlee: false }),
  ratOne: () => foe('Rat', 'e_rat', 1, 1, false),
  ratPoison: () => foe('Poisoned Rat', 'e_rat', 2, 1, false),
  screechOwl: () => foe('Screech Owl', 'e_crow', 2, 2, true),
  ghost: () => foe('Angry Ghost', 'e_ghost', 3, 13, false, { canFlee: false }),
  peasantMob: () => foe('Angry Mob of Peasants', 'e_soldier', 2, 13, false, { fleesFromPig: true }),
  rockThrower: () => foe('Local Rock-Throwing Oddball', 'e_soldier', 7, 6, true),
  drunkCastlegoer: () => foe('Drunken Castlegoer', 'e_soldier', 5, 9, false),
  looseMoose: () => foe('Juice Moose on the Loose', 'e_moose', 7, 10, true),
  goblinThief: () => foe('Goblin Thief', 'e_goblin', 6, 12, false),
  king: () => foe('The King', 'npc_king', 5, 20, true, { canFlee: false }), // castle.js narrates his "army in spirit" before the fight
  queen: () => foe('The Queen', 'npc_queen', 7, 20, false, { canFlee: false }), // castle.js applies her opening 7-damage volley before combat starts
  knightMacintosh: () => foe('Sir Macintosh', 'npc_knight', 15, 15, true, { canFlee: false }),
};

function group(...makers) { return { group: makers.map(m => m()) }; }
