// ============================================================================
// THE WOODS — 14-node forest path.
// ============================================================================
(function () {
  const { grid, centers, w, h } = buildNodeCorridor(14, { roomW: 6, roomH: 6, cols: 4 });
  const rows = gridToRows(grid.map(r => r.map(c => (c === '#' ? '#' : '.'))));

  const legend = {
    '.': { tile: (tx,ty) => hashPick(tx,ty,['t_forest0', 't_forest1', 't_forest2']), overlay: () => (rng.int(1, 10) === 1 ? rng.pick(['o_flowers0', 'o_flowers1', 'o_tuft0', 'o_tuft1']) : null) },
    '#': { tile: 't_hillrock', solid: true },
  };

  function at(n) { return centers[n - 1]; }
  function node(n, opts) { return { x: at(n).x, y: at(n).y, ...opts }; }

  const entities = [];

  // 1 — Todd's Traveling Biscuit Cart
  entities.push(node(1, {
    sprite: 'npc_todd', label: "Todd's Biscuit Cart", interact: true, promptText: 'talk to Todd', blocking: true,
    onTrigger: async (engine) => {
      const s = engine.state;
      if (GameState.hasItem(s, 'magicBeans')) {
        const go = await UI.choice('"Magic beans?! I\'ll trade you a key and 5 life for those." — Todd', [{ label: 'Trade beans for key + 5 life', value: true }, { label: 'Keep my beans', value: false }]);
        if (go) { GameState.removeItem(s, 'magicBeans', 1); GameState.addItem(s, { ...ItemDefs.key }); GameState.addLife(s, 5); UI.notify('Got a Key and +5 life!'); }
      } else {
        await UI.say('"Biscuit? ...does nothing, as far as we can tell. Enjoy!" — Todd hands you a biscuit.', { speaker: 'Todd' });
        GameState.addItem(s, { id: 'biscuit', name: 'Biscuit', icon: 'i_bread', desc: 'Does nothing. As far as we can tell.' });
      }
    },
  }));

  // 2 — Frog-legged bears
  entities.push(node(2, {
    sprite: 'e_frogbear', label: 'Frog-legged bears', interact: true, promptText: 'approach', blocking: true, autoTrigger: true,
    onTrigger: async (engine, e) => {
      e._dead = true; const s = engine.state;
      const roll = await UI.rollBanner(6);
      if (roll === 1) { GameState.addLife(s, -1); await UI.say('One hugs you tight — slimy! -1 life.'); }
      else if (roll <= 3) await UI.say("They're too lazy to bother with you. Nothing happens.");
      else if (roll === 5) await Combat.start(s, group(Enemies.cub, Enemies.cub, Enemies.cub));
      else await Combat.start(s, Enemies.mamaBear());
    },
  }));

  // 3 — Box of Surprises
  entities.push(node(3, {
    sprite: 'i_chestbox', label: 'Box of Surprises', interact: true, promptText: 'open box', blocking: false, autoTrigger: true,
    onTrigger: async (engine, e) => {
      e._dead = true; const s = engine.state;
      const roll = await UI.rollBanner(6);
      if (roll === 1) { await UI.say("A voice inside shrieks \"TODD!!!!\" You're yanked back to the biscuit cart."); engine.loadArea('woods', at(1)); }
      else if (roll === 2) { GameState.addItem(s, { id: 'sharpArrow', name: 'Sharp Arrow', icon: 'i_arrow', combatUse: (st, ctx) => { const t = ctx.foes.find(f => f.hp > 0); if (t) { t.hp -= 10; ctx.pushLog(`Sharp arrow hits ${t.name} for 10!`); } } }); await UI.say('You find a wickedly sharp 10-damage arrow!'); }
      else if (roll === 3) await UI.say('A slow 1/1 servant creeps out and politely lets you pass. How nice.');
      else if (roll === 4) { GameState.addQ(s, 3); await UI.say('You find 3q rattling around inside!'); }
      else if (roll === 5) { GameState.spendQ(s, Math.min(s.q, 4)); await UI.say('A tiny gremlin steals 4q from you before vanishing.'); }
      else { await UI.say('You fall in! You tumble out somewhere in the Monster Hills...'); engine.loadArea('monsterhills', MonsterHillsAnchors.node4); }
    },
  }));

  // 4 — Box of Truths (repeatable, 3q per truth)
  const truths = [
    'The hills, or the lake — go to either, but be prepared.',
    'The downfall of a tyrant begins with a single knight.',
    'Bring a sword hilt to George. He knows a guy.',
    'The Queen likes red. The King likes blue. Knights like to eat.',
    'Todd likes magic beans. Everybody knows that.',
    'To a Knight: you need not visit the Lake. To a King or Queen: you need not visit the Hills.',
  ];
  entities.push(node(4, {
    sprite: 'i_scroll', label: 'Box of Truths', interact: true, promptText: 'ask for a truth (3q)', blocking: false,
    onTrigger: async (engine) => {
      const s = engine.state;
      const go = await UI.choice('Pay 3q for a truth?', [{ label: 'Yes', value: true }, { label: 'No', value: false }]);
      if (!go) return;
      if (!GameState.spendQ(s, 3)) { UI.notify('Not enough quickels!'); return; }
      await UI.say(rng.pick(truths), { speaker: 'The Box' });
    },
  }));

  // 5 — Lovin' Larry's
  entities.push(node(5, {
    sprite: 'npc_larry', label: "Lovin' Larry's", interact: true, promptText: 'talk to Larry', blocking: true,
    onTrigger: async () => { await UI.say('"Aw, all alone? Come back with a friend sometime." — Larry looks you up and down, unimpressed.', { speaker: 'Larry' }); },
  }));

  // 6 — Pack of bush monsters
  entities.push(node(6, {
    sprite: 'e_bushmonster', label: 'Bush monsters', interact: true, promptText: 'approach', blocking: true, autoTrigger: true,
    onTrigger: async (engine, e) => {
      e._dead = true; const s = engine.state;
      const res = await Combat.start(s, group(Enemies.bushMonster, Enemies.bushMonster, Enemies.bushMonster, Enemies.bushMonster));
      if (res.result === 'win') { GameState.addQ(s, 7); UI.notify('The thicket yields 7q worth of berries and trinkets!'); }
    },
  }));

  // 7 — Serpent's Den
  entities.push(node(7, {
    sprite: 'e_serpent', label: "Serpent's Den", interact: true, promptText: 'enter den', blocking: true, autoTrigger: true,
    onTrigger: async (engine, e) => {
      e._dead = true; const s = engine.state;
      const ranged = rng.d6() >= 4;
      const res = await Combat.start(s, ranged ? Enemies.serpentRanged() : Enemies.serpentMelee());
      if (res.result === 'win') { grantWeapon(s, 'sword'); s.weapons.find(w => w.id === 'sword').dmg = 7; UI.notify('You find a serpent-forged sword: 7 dmg!'); }
    },
  }));

  // 8 — Wishing Well of Fountain Youth
  entities.push(node(8, {
    sprite: 'o_well', label: 'Wishing Well', interact: true, promptText: 'make a wish (2q)', blocking: false,
    onTrigger: async (engine) => {
      const s = engine.state;
      const go = await UI.choice('Toss 2q into the well and wish?', [{ label: 'Wish', value: true }, { label: 'No', value: false }]);
      if (!go) return;
      if (!GameState.spendQ(s, 2)) { UI.notify('Not enough quickels!'); return; }
      const roll = await UI.rollBanner(6);
      if (roll <= 2) { GameState.addLife(s, -1); await UI.say('The well water is foul. -1 life.'); }
      else if (roll === 3 || roll === 6) { GameState.addLife(s, 3); GameState.addQ(s, 1); await UI.say('The waters shimmer with youth. +3 life, +1q.'); }
      else if (roll === 4) { GameState.addLife(s, 4); await UI.say('+4 life!'); }
      else { GameState.addLife(s, 10); await UI.say('The Fountain of Youth blesses you fully. +10 life!'); }
    },
  }));

  // 9 — Fishing Break
  entities.push(node(9, {
    sprite: 'i_fish', label: 'Fishing Break', interact: true, promptText: 'go fishing', blocking: false, autoTrigger: true,
    onTrigger: async (engine, e) => {
      e._dead = true; const s = engine.state;
      const roll = await UI.rollBanner(6);
      if (roll === 1) { GameState.addItem(s, { id: 'fish1', name: 'Fish', icon: 'i_fish', combatUse: (st, ctx) => { GameState.addLife(st, 1); ctx.pushLog('+1 life.'); } }); await UI.say('Caught a fish! (+1 life, eat anytime)'); }
      else if (roll === 2) { GameState.addItem(s, { id: 'fish3', name: '3 Fish', icon: 'i_fish', combatUse: (st, ctx) => { GameState.addLife(st, 5); ctx.pushLog('+5 life.'); } }); await UI.say('Caught 3 fish! (+5 life, eat anytime)'); }
      else if (roll === 3 || roll === 5) await UI.say("Nothing's biting today...");
      else {
        const fight = await UI.choice('A shark bites your line! Fight it, or let it go?', [{ label: 'Fight', value: true }, { label: 'Let it go', value: false }]);
        if (fight) {
          const res = await Combat.start(s, Enemies.shark());
          if (res.result === 'win') { GameState.addItem(s, { id: 'sharkmeat', name: 'Shark Meat', icon: 'i_fish', combatUse: (st, ctx) => { GameState.addLife(st, 5); ctx.pushLog('+5 life.'); } }); UI.notify('Shark meat! (+5 life, eat anytime)'); }
        } else await UI.say('You let it swim free.');
      }
    },
  }));

  // 10 — Current
  entities.push(node(10, {
    sprite: 't_water0', label: 'Current', interact: true, promptText: 'step into the current', blocking: false, autoTrigger: true,
    onTrigger: async (engine, e) => {
      e._dead = true; const s = engine.state;
      const roll = await UI.rollBanner(6);
      if (roll === 3 || roll === 5) { await UI.say('A good current carries you forward!'); engine.loadArea('woods', at(11)); }
      else { GameState.addLife(s, -3); await UI.say('A bad current drags at you. -3 life.'); }
    },
  }));

  // 11 — Arthur's Armor
  entities.push(node(11, {
    sprite: 'npc_knight', label: "Arthur's Armor", interact: true, promptText: 'shop', blocking: true,
    onTrigger: (engine) => UI.openShop({
      name: "Arthur's Armor",
      intro: 'A rusted suit of armor stands ready for a new owner.',
      items: [
        { name: "Arthur's Helmet", cost: 11, icon: 'i_helmet', desc: 'Take 3 less damage from ranged attacks', canBuy: s => !s.armor.helmet, blockedMsg: 'One helmet at a time!', onBuy: s => grantArmor(s, 'arthurHelmet') },
        { name: "Arthur's Chestplate", cost: 11, icon: 'i_chest', desc: 'Take 3 less non-ranged damage', canBuy: s => !s.armor.chest, blockedMsg: 'One chest piece at a time!', onBuy: s => grantArmor(s, 'arthurChest') },
      ],
    }, engine.state),
  }));

  // 12 — Giant toad
  entities.push(node(12, {
    sprite: 'e_toad', label: 'Giant Toad', interact: true, promptText: 'approach', blocking: true, autoTrigger: true,
    onTrigger: (engine, e) => { e._dead = true; Combat.start(engine.state, Enemies.giantToad()); },
  }));

  // 13 — Flock of crows
  entities.push(node(13, {
    sprite: 'e_crow', label: 'Flock of Crows', interact: true, promptText: 'approach', blocking: true, autoTrigger: true,
    onTrigger: (engine, e) => { e._dead = true; Combat.start(engine.state, Enemies.crows()); },
  }));

  // 14 — Fat tortoise + exit back to overworld
  entities.push(node(14, {
    sprite: 'e_tortoise', label: 'Fat Tortoise', interact: true, promptText: 'approach', blocking: true, autoTrigger: true,
    onTrigger: async (engine, e) => {
      e._dead = true;
      const res = await Combat.start(engine.state, Enemies.tortoise());
      if (res.result !== 'win') await UI.stun(1500, 'The tortoise blocks the path — you miss a turn catching your breath.');
    },
  }));
  entities.push({ x: at(1).x - 2, y: at(1).y, sprite: 'o_sign', label: 'To Overworld', interact: true, promptText: 'leave the Woods', blocking: false, autoTrigger: true,
    onTrigger: (engine) => engine.loadArea('overworld_south', { x: OSA.woodsEntrance.x, y: OSA.woodsEntrance.y + 2 }) });

  Areas.woods = { map: rows, legend, entities, entryPoint: at(1) };
})();
