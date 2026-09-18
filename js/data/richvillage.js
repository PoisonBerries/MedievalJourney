// ============================================================================
// RICH VILLAGE — "where money is spent." Ron's Armoury, Gramma's, Le
// Expensive Weapon Shop of George (+ hilt backroom), Big Sam's Arrows,
// Hubert's Horse Hut.
// ============================================================================
(function () {
  const W = 24, H = 20;
  const grid = blankGrid(W, H, '.');
  frameRect(grid, 0, 0, W, H, 'T');
  fillRect(grid, 1, 1, W - 2, H - 2, '.');
  fillRect(grid, 2, 9, W - 4, 2, '=');
  scatter(grid, 1, 1, W - 2, H - 2, ',', 0.08);
  carveRoad(grid, W - 3, 10, W - 3, H - 2, '=');
  const exitGap = openBorderGap(grid, W - 3, H - 1, 2, true, '=');

  const legend = {
    '.': { tile: (tx,ty) => hashPick(tx,ty,['t_grass0', 't_grass1', 't_grass2', 't_grass3']) }, ',': { tile: (tx,ty) => hashPick(tx,ty,['t_grass1', 't_grass5']) },
    '=': { tile: (tx,ty) => hashPick(tx,ty,['t_road0', 't_road1']) }, 'T': { tile: 't_grass0', overlay: (tx,ty) => hashPick(tx,ty,['o_tree', 'o_bush']), solid: true },
    '#': { tile: 't_hillrock', solid: true },
  };

  const ronShop = {
    name: "Ron's Rich People Armoury", intro: '"Only the finest steel for the finest folk." — Ron',
    items: [
      { name: 'Helmet', cost: 5, icon: 'i_helmet', desc: 'Take 1 less damage from ranged attacks', canBuy: s => !s.armor.helmet, blockedMsg: 'One helmet at a time!', onBuy: s => grantArmor(s, 'helmet') },
      { name: 'Chainmail', cost: 5, icon: 'i_chest', desc: 'Take 1 less non-ranged damage', canBuy: s => !s.armor.chest, blockedMsg: 'One chest piece at a time!', onBuy: s => grantArmor(s, 'chainmail') },
      { name: 'Full Armor', cost: 15, icon: 'i_chest', desc: 'Take 3 less damage in any combat', canBuy: s => !s.armor.chest, blockedMsg: 'One chest piece at a time!', onBuy: s => grantArmor(s, 'fullArmor') },
      { name: 'Boots', cost: 5, icon: 'i_boots', desc: 'Guarantees you slip past certain guards and obstacles unnoticed', canBuy: s => !s.armor.boots, blockedMsg: 'One pair of boots at a time!', onBuy: s => grantArmor(s, 'boots') },
    ],
  };

  const grammaShop = {
    name: "Gramma's Home Cooking & Healing for the Rich", intro: '"Sit, sit, eat something, you look thin." — Gramma',
    items: [
      { name: 'Gramma Things', cost: 10, icon: 'i_bread', desc: 'Restore 7 life', onBuy: s => GameState.addItem(s, { ...ItemDefs.grammaThings }) },
      { name: 'Pie of Choice', cost: 35, icon: 'i_pie', desc: 'Restore 10 life', onBuy: s => GameState.addItem(s, { ...ItemDefs.pie }) },
      { name: 'Pineapple Juice', cost: 0, icon: 'i_potion_green', desc: 'Free & yummy!', onBuy: s => GameState.addItem(s, { ...ItemDefs.pineappleJuice }) },
      { name: 'Peanut Butter & Fluff', cost: 75, icon: 'i_pie', desc: 'Restore 15 life', onBuy: s => GameState.addItem(s, { ...ItemDefs.peanutFluff }) },
    ],
  };

  function georgeShop(state) {
    const items = [
      { name: 'Crossbow', cost: 10, icon: 'i_crossbow', desc: '+2 damage to all arrows', onBuy: s => grantWeapon(s, 'crossbow') },
      { name: 'Mace', cost: 10, icon: 'i_mace', desc: '8 dmg, no range', onBuy: s => grantWeapon(s, 'mace') },
      { name: "Defender's Club", cost: 7, icon: 'i_club', desc: '3 dmg, no range — enemies deal 3 less damage while you block', onBuy: s => grantWeapon(s, 'club') },
      { name: 'Weapon Adornment', cost: 4, icon: 'i_gem_blue', desc: "+1 damage, permanently, to your equipped weapon", onBuy: s => { const w = s.weapons.find(w => w.id === s.equippedWeapon); if (w) w.dmg += 1; } },
    ];
    if (state.flags.hasHilt) {
      items.push(
        { name: 'Blade of Swiftness', cost: 12, icon: 'i_sword', desc: '6 dmg, counts as BOTH ranged & melee (always ambushes)', onBuy: s => grantWeapon(s, 'bladeSwift') },
        { name: 'Blade of Brutality', cost: 14, icon: 'i_sword', desc: '10 dmg, no range', onBuy: s => grantWeapon(s, 'bladeBrutality') },
        { name: 'Blade of Defense', cost: 13, icon: 'i_sword', desc: '7 dmg — take 2 less damage in any combat', onBuy: s => grantWeapon(s, 'bladeDefense') },
      );
    }
    return { name: 'Le Expensive Weapon Shop of George', intro: state.flags.hasHilt ? '"...you have a hilt? Right this way, to the BACK ROOM." — George' : '"Everything here costs a fortune. That\'s the point." — George', items };
  }

  const bigSamShop = {
    name: "Big Sam's Arrow Collection", intro: '"1q per arrow, unless noted. Don\'t ask where I get the flame ones." — Sam',
    items: [
      { name: 'Basic Arrows x5', cost: 2, icon: 'i_arrow', desc: 'Ammo for bows & crossbows', onBuy: s => GameState.addArrows(s, 'basic', 5) },
      { name: 'Flaming Arrow', cost: 1, icon: 'i_arrow_flame', desc: '18 dmg, ranged — cannot be divided among enemies', onBuy: s => GameState.addItem(s, { id: 'arrowFlame', name: 'Flaming Arrow', icon: 'i_arrow_flame', combatUse: (st, ctx) => { const t = ctx.foes.find(f => f.hp > 0); if (t) { t.hp -= 18; ctx.pushLog(`The flaming arrow scorches ${t.name} for 18!`); } } }) },
      { name: 'Triple Arrow Set', cost: 1, icon: 'i_arrow_triple', desc: '5 dmg, ranged — can be divided among enemies', onBuy: s => GameState.addItem(s, { id: 'arrowTriple', name: 'Triple Arrow Set', icon: 'i_arrow_triple', combatUse: (st, ctx) => { const alive = ctx.foes.filter(f => f.hp > 0); const each = Math.ceil(5 / Math.max(1, Math.min(3, alive.length))); alive.slice(0, 3).forEach(f => { f.hp -= each; ctx.pushLog(`Triple arrow hits ${f.name} for ${each}!`); }); } }) },
      { name: 'Stun Arrow', cost: 2, icon: 'i_arrow_stun', desc: '1 dmg, ranged — you take 1 less damage from that foe next round', onBuy: s => GameState.addItem(s, { id: 'arrowStun', name: 'Stun Arrow', icon: 'i_arrow_stun', combatUse: (st, ctx) => { const t = ctx.foes.find(f => f.hp > 0); if (t) { t.hp -= 1; t.dmg = Math.max(0, t.dmg - 1); ctx.pushLog(`${t.name} is stunned! (1 dmg, and weakened)`); } } }) },
    ],
  };

  async function hubert(engine) {
    const s = engine.state;
    await UI.say('"5q for a horse — she\'ll carry you faster down any road." — Hubert', { speaker: 'Hubert' });
    if (s.flags.hasHorse) { await UI.say('"That\'s the same horse I sold you! Take good care of her."'); return; }
    const go = await UI.choice('Buy a horse for 5q?', [{ label: 'Yes', value: true }, { label: 'No', value: false }]);
    if (!go) return;
    if (!GameState.spendQ(s, 5)) { UI.notify('Not enough quickels!'); return; }
    s.flags.hasHorse = true;
    GameState.addItem(s, { ...ItemDefs.horse });
    await UI.say('You gallop off — you move faster now!');
  }

  const entities = [
    { x: 5, y: 4, sprite: 'b_generic_brown', label: "Ron's Armoury", interact: true, promptText: 'shop', blocking: true, onTrigger: (e) => UI.openShop(ronShop, e.state) },
    { x: 10, y: 4, sprite: 'npc_gramma', label: "Gramma's", interact: true, promptText: 'shop', blocking: true, onTrigger: (e) => UI.openShop(grammaShop, e.state) },
    { x: 15, y: 4, sprite: 'b_rich', label: 'Le Expensive Weapon Shop', interact: true, promptText: 'shop', blocking: true, onTrigger: (e) => UI.openShop(georgeShop(e.state), e.state) },
    { x: 20, y: 4, sprite: 'sign_weapon', label: "Big Sam's Arrows", interact: true, promptText: 'shop', blocking: true, onTrigger: (e) => UI.openShop(bigSamShop, e.state) },
    { x: 12, y: 15, sprite: 'npc_hubert', label: "Hubert's Horse Hut", interact: true, promptText: "talk to Hubert", blocking: true, onTrigger: hubert },
    { x: exitGap[0].x, y: exitGap[0].y - 1, sprite: 'o_sign', label: 'To Overworld', interact: true, promptText: 'leave', blocking: false },
    { x: exitGap[0].x, y: exitGap[0].y, sprite: '', blocking: false, autoTrigger: true,
      onTrigger: (engine) => engine.loadArea('overworld_south', { x: OSA.richVillage.x, y: OSA.richVillage.y + 2 }) },
    { x: exitGap[1].x, y: exitGap[1].y, sprite: '', blocking: false, autoTrigger: true,
      onTrigger: (engine) => engine.loadArea('overworld_south', { x: OSA.richVillage.x, y: OSA.richVillage.y + 2 }) },
  ];

  Areas.richvillage = { map: gridToRows(grid), legend, entities, townName: 'Rich Village', entryArea: 'richvillage', entryPoint: { x: 12, y: 10 } };
})();
