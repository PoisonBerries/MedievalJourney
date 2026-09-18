// ============================================================================
// ITEMS.JS — weapon / armor / potion / food catalog referenced by shops,
// combat and events across every region file.
// ============================================================================
const Weapons = {
  butterknife: { id: 'butterknife', name: 'Butter Knife', dmg: 1, range: false, icon: 'i_sword' },
  sword: { id: 'sword', name: 'Sword', dmg: 5, range: false, icon: 'i_sword' },
  bow: { id: 'bow', name: 'Bow', dmg: 3, range: true, needsArrows: true, icon: 'i_bow' },
  pitchfork: { id: 'pitchfork', name: 'Pitchfork', dmg: 2, range: false, icon: 'i_pitchfork' },
  mace: { id: 'mace', name: 'Mace', dmg: 8, range: false, icon: 'i_mace' },
  club: { id: 'club', name: 'Defender\'s Club', dmg: 3, range: false, blockBonus: 3, icon: 'i_club' },
  crossbow: { id: 'crossbow', name: 'Crossbow', dmg: 4, range: true, needsArrows: true, arrowBonus: 2, icon: 'i_crossbow' },
  bladeSwift: { id: 'bladeSwift', name: 'Blade of Swiftness', dmg: 6, range: true, dual: true, icon: 'i_sword' },
  bladeBrutality: { id: 'bladeBrutality', name: 'Blade of Brutality', dmg: 10, range: false, icon: 'i_sword' },
  bladeDefense: { id: 'bladeDefense', name: 'Blade of Defense', dmg: 7, range: false, damageReduction: 2, icon: 'i_sword' },
  excalibur: { id: 'excalibur', name: 'Excalibur', dmg: 12, range: false, damageReduction: 1, binding: true, icon: 'i_excalibur' },
  farmSword: { id: 'sword', name: 'Sword' }, // alias helper
};

const Armors = {
  helmet: { slot: 'helmet', id: 'helmet', name: 'Helmet', rangedReduction: 1, icon: 'i_helmet' },
  chainmail: { slot: 'chest', id: 'chainmail', name: 'Chainmail', meleeReduction: 1, icon: 'i_chest' },
  fullArmor: { slot: 'chest', id: 'fullArmor', name: 'Full Armor', anyReduction: 3, icon: 'i_chest' },
  boots: { slot: 'boots', id: 'boots', name: 'Boots', icon: 'i_boots' },
  arthurHelmet: { slot: 'helmet', id: 'arthurHelmet', name: "Arthur's Helmet", rangedReduction: 3, icon: 'i_helmet_gold' },
  arthurChest: { slot: 'chest', id: 'arthurChest', name: "Arthur's Chestplate", meleeReduction: 3, icon: 'i_chest_gold' },
};

function makePotion(id, name, cost, effect, icon) {
  return { id, name, cost, icon, combatUse: effect, useOutOfCombat: effect };
}

const ItemDefs = {
  strengthPotion: { id: 'strengthPotion', name: 'Strength Potion', icon: 'i_potion_red', desc: '+3 damage next attack (1 use)', combatUse: (s, ctx) => { s._strengthBuff = 3; ctx.pushLog('You feel powerful! +3 damage on your next attack.'); } },
  healthPotion: { id: 'healthPotion', name: 'Health Potion', icon: 'i_potion_green', desc: 'Gain 1 life', combatUse: (s, ctx) => { GameState.addLife(s, 1); ctx.pushLog('You gain 1 life.'); } },
  vanishingSmoke: { id: 'vanishingSmoke', name: 'Vanishing Smoke', icon: 'i_potion_purple', desc: 'Evade all damage this round', combatUse: (s, ctx) => { s._evadeBuff = true; ctx.pushLog('You vanish into smoke, evading harm this round!'); } },
  broom: { id: 'broom', name: 'Witch\'s Broom', icon: 'i_broom', desc: 'Instantly sweep away any 1-HP enemy', combatUse: (s, ctx) => { const t = ctx.foes.find(f => f.hp > 0 && f.hp <= 1); if (t) { t.hp = 0; ctx.pushLog(`You sweep ${t.name} clean away!`); } else ctx.pushLog('No weak enough foe to sweep away.'); } },
  marriedIguana: { id: 'marriedIguana', name: 'Married Iguana Potion', icon: 'i_potion_teal', desc: '+3 life when drunk', combatUse: (s, ctx) => { GameState.addLife(s, 3); ctx.pushLog('+3 life!'); } },
  coldCane: { id: 'coldCane', name: 'Cold Cane Potion', icon: 'i_potion_blue', desc: 'All weapons +1 damage', combatUse: null },
  mooseJuice: { id: 'mooseJuice', name: 'Moose Juice', icon: 'i_potion_orange', desc: 'Woodland animals leave you be' },
  bread: { id: 'bread', name: 'Bread', icon: 'i_bread', desc: 'Restore 5 life', combatUse: (s, ctx) => { GameState.addLife(s, 5); ctx.pushLog('+5 life.'); } },
  pie: { id: 'pie', name: 'Pie of Choice', icon: 'i_pie', desc: 'Restore 10 life', combatUse: (s, ctx) => { GameState.addLife(s, 10); ctx.pushLog('+10 life.'); } },
  peanutFluff: { id: 'peanutFluff', name: 'Peanut Butter & Fluff', icon: 'i_pie', desc: 'Restore 15 life', combatUse: (s, ctx) => { GameState.addLife(s, 15); ctx.pushLog('+15 life.'); } },
  grammaThings: { id: 'grammaThings', name: 'Gramma Things', icon: 'i_bread', desc: 'Restore 7 life', combatUse: (s, ctx) => { GameState.addLife(s, 7); ctx.pushLog('+7 life.'); } },
  pineappleJuice: { id: 'pineappleJuice', name: 'Pineapple Juice', icon: 'i_potion_yellow', desc: 'Free & yummy', combatUse: (s, ctx) => { ctx.pushLog('Refreshingly free and yummy.'); } },
  magicBeans: { id: 'magicBeans', name: 'Magic Beans', icon: 'i_gem_blue', desc: 'A strange trade good' },
  scrollKingsPassage: { id: 'scrollKingsPassage', name: "King's Note of Passage", icon: 'i_scroll', desc: 'Proof you may take the Path of the King' },
  scrollQueensPassage: { id: 'scrollQueensPassage', name: "Queen's Note of Passage", icon: 'i_scroll', desc: 'Proof you may take the Path of the Queen' },
  hilt: { id: 'hilt', name: 'Bladeless Hilt', icon: 'i_hilt', desc: 'A sword hilt with an empty gem socket' },
  boat: { id: 'boat', name: 'Boat', icon: 'i_boat', desc: 'Lets you cross deep water' },
  horse: { id: 'horse', name: 'Horse', icon: 'i_horse', desc: 'Move noticeably faster on foot' },
  key: { id: 'key', name: 'Key', icon: 'i_key', desc: 'Unlocks locked things' },
  pig: { id: 'pig', name: 'Pig Companion', icon: 'e_pig', desc: 'Can be eaten for 3 life at any time', combatUse: (s, ctx) => { s.companions = s.companions.filter(c => c.id !== 'pig'); GameState.addLife(s, 3); ctx.pushLog('You eat your loyal pig. +3 life. (grim, but effective — and it stops fighting for you, obviously)'); } },
};

function grantWeapon(state, wid) {
  GameState.addWeapon(state, Weapons[wid]);
  state.equippedWeapon = wid;
}
function grantArmor(state, aid) {
  const a = Armors[aid];
  state.armor[a.slot] = a;
}
