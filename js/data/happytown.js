// ============================================================================
// HAPPY TOWN — "(no fighting)" — the player's starting town.
// ============================================================================
(function () {
  const W = 22, H = 18;
  const grid = blankGrid(W, H, '.');
  frameRect(grid, 0, 0, W, H, 'T');
  fillRect(grid, 1, 1, W - 2, H - 2, '.');
  fillRect(grid, 2, 8, W - 4, 3, '=');
  scatter(grid, 1, 1, W - 2, H - 2, ',', 0.06);

  const legend = {
    '.': { tile: (tx,ty) => hashPick(tx,ty,['t_grass0', 't_grass0', 't_grass1', 't_grass2', 't_grass4']) },
    ',': { tile: (tx,ty) => hashPick(tx,ty,['t_grass1', 't_grass5']) },
    '=': { tile: (tx,ty) => hashPick(tx,ty,['t_road0', 't_road1', 't_road2']) },
    'T': { tile: 't_grass0', overlay: (tx,ty) => hashPick(tx,ty,['o_tree', 'o_bush']), solid: true },
    '#': { tile: 't_hillrock', solid: true },
  };

  function shopEntity(x, y, sprite, label, prompt, shopDef) {
    return {
      x, y, sprite, label, interact: true, promptText: prompt, blocking: true,
      onTrigger: (engine) => UI.openShop(shopDef, engine.state),
    };
  }

  const entities = [
    shopEntity(4, 3, 'b_generic_red', "Bob's Weapon Emporium", 'shop', {
      name: "Bob's Weapon Emporium",
      intro: '"Best blades this side of the Poor Country road!" — Bob',
      items: [
        { name: 'Sword', cost: 4, icon: 'i_sword', desc: '5 dmg, no range', onBuy: s => grantWeapon(s, 'sword') },
        { name: 'Bow', cost: 3, icon: 'i_bow', desc: '3 dmg, ranged — needs arrows! (sold in Rich Village)', onBuy: s => grantWeapon(s, 'bow') },
        { name: 'Pitchfork', cost: 1, icon: 'i_pitchfork', desc: '2 dmg, no range — farmhand price', onBuy: s => grantWeapon(s, 'pitchfork') },
      ],
    }),
    shopEntity(9, 3, 'b_witch', "Definitely Not A Witch's Witch Shop", 'shop', {
      name: "Definitely Not A Witch's Witch Shop",
      intro: '"I am simply an herbalist with excellent taste in hats." — the proprietor',
      items: [
        { name: "Witch's Broom", cost: 5, icon: 'i_potion_blue', desc: 'Combat item: instantly sweep away a 1-HP enemy', onBuy: s => GameState.addItem(s, { ...ItemDefs.broom }) },
        { name: 'Strength Potion', cost: 2, icon: 'i_potion_red', desc: 'Combat item: +3 damage, one use', onBuy: s => GameState.addItem(s, { ...ItemDefs.strengthPotion }) },
        { name: 'Health Potion', cost: 2, icon: 'i_potion_green', desc: 'Combat item: gain 1 life', onBuy: s => GameState.addItem(s, { ...ItemDefs.healthPotion }) },
        { name: 'Vanishing Smoke', cost: 5, icon: 'i_potion_purple', desc: 'Combat item: evade all damage this round', onBuy: s => GameState.addItem(s, { ...ItemDefs.vanishingSmoke }) },
      ],
    }),
    shopEntity(14, 3, 'b_generic_brown', "Bob's Bakery", 'shop', {
      name: "Bob's Bakery",
      intro: '"Fresh loaves! ...mostly." — Bob (a different Bob)',
      items: [{
        name: 'Bread', cost: 6, icon: 'i_bread', desc: 'Restore 5 life — sometimes there\'s a surprise inside',
        onBuy: async (s) => {
          GameState.addItem(s, { ...ItemDefs.bread });
          const roll = await UI.rollBanner(6);
          if (roll === 2) { GameState.addItem(s, { ...ItemDefs.magicBeans }); UI.notify('Magic beans were baked into the loaf!'); }
        },
      }],
    }),
    shopEntity(4, 12, 'b_generic_blue', 'Boat Shop', 'shop', {
      name: 'Boat Shop',
      intro: 'A single, slightly leaky rowboat is for sale.',
      items: [{ name: 'Boat', cost: 1, icon: 'i_boat', desc: 'Lets you cross deep water', canBuy: s => !s.flags.hasBoat, blockedMsg: 'You already own a boat.', onBuy: s => { s.flags.hasBoat = true; GameState.addItem(s, { ...ItemDefs.boat }); } }],
    }),
    {
      x: 14, y: 12, sprite: 'b_generic_purple', label: 'Medieval Transportation Inc.', interact: true, promptText: 'talk to Horace', blocking: true,
      onTrigger: (engine) => horaceScript(engine),
    },
    { x: 11, y: 15, sprite: 'o_sign', label: '', interact: true, promptText: 'read sign', blocking: false, onTrigger: () => UI.say('A weathered sign points south: "Poor Country — work your way up."', { speaker: 'Sign' }) },
    { x: W - 3, y: H - 3, sprite: 'o_sign', label: 'To Overworld', interact: true, promptText: 'leave town', blocking: false, autoTrigger: true,
      onTrigger: (engine) => engine.loadArea('overworld_south', { x: OSA.happyTown.x, y: OSA.happyTown.y + 2 }) },
  ];

  async function horaceScript(engine) {
    const s = engine.state;
    await UI.say('"Hi, I\'m Horace, transportation director here. The grey lines on yer map are quick trails, pay me 2q and I\'ll transport you in my trusty carriage — but it can be risky! First visitor gets there first ride free."', { speaker: 'Horace' });
    const dests = Object.keys(s.visited).filter(a => Areas[a] && Areas[a].townName && a !== s.position.area);
    if (!dests.length) { await UI.say("\"You haven't discovered anywhere else to go yet!\"", { speaker: 'Horace' }); return; }
    const choice = await UI.choice('Where to?', [...dests.map(d => ({ label: Areas[d].townName, value: d })), { label: 'Never mind', value: null }]);
    if (!choice) return;
    const free = !s.flags.usedHorace;
    if (!free && !GameState.spendQ(s, 2)) { UI.notify('Not enough quickels!'); return; }
    s.flags.usedHorace = true;
    await UI.say(free ? '"First ride\'s on me!"' : '"Hop in!"', { speaker: 'Horace' });
    if (rng.d6() === 1) {
      await UI.say('The carriage hits a rut in the road — bandits! (a risky ride indeed)', { speaker: 'Horace' });
      const res = await Combat.start(s, Enemies.goblinThief());
      if (res.result === 'lose') { GameState.addLife(s, 0); }
    }
    engine.loadArea(Areas[choice].entryArea, Areas[choice].entryPoint);
  }

  Areas.happytown = {
    map: gridToRows(grid), legend, entities,
    townName: 'Happy Town', entryArea: 'happytown', entryPoint: { x: 11, y: 9 },
    noFighting: true,
  };
})();
