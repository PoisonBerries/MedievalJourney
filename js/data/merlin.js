// ============================================================================
// MERLIN'S HIDEOUT — 6-node cave path ending at the wizard himself.
// ============================================================================
(function () {
  const { grid, centers } = buildNodeCorridor(6, { roomW: 6, roomH: 6, cols: 3 });
  const extraGrid = grid.map(r => [...r, ...new Array(8).fill('#')]);
  const merlinRoom = { x: grid[0].length + 3, y: centers[5].y };
  fillRect(extraGrid, merlinRoom.x - 2, merlinRoom.y - 2, 5, 5, '.');
  carveRoad(extraGrid, centers[5].x, centers[5].y, merlinRoom.x, merlinRoom.y, '.');

  const rows = gridToRows(extraGrid.map(r => r.map(c => (c === '#' ? '#' : '.'))));
  const legend = { '.': { tile: 't_stonefloor' }, '#': { tile: 'o_castlewall', solid: true } };
  function at(n) { return centers[n - 1]; }

  const entities = [
    { x: at(1).x, y: at(1).y, sprite: 'i_gem_blue', label: '', interact: true, promptText: 'look around', blocking: false, autoTrigger: true,
      onTrigger: (e, ent) => { ent._dead = true; UI.say('You enter the caves of Merlin. Cold air and the smell of old parchment.'); } },
    { x: at(2).x, y: at(2).y, sprite: 'i_key', label: 'Rotting skeleton', interact: true, promptText: 'examine', blocking: false, autoTrigger: true,
      onTrigger: (e, ent) => { ent._dead = true; UI.say('A rotting skeleton lies here, still wearing a tarnished crown. You leave it be. Some things are best undisturbed.'); } },
    { x: at(3).x, y: at(3).y, sprite: 'i_scroll', label: '', interact: true, promptText: '', blocking: false, autoTrigger: true,
      onTrigger: (engine, ent) => { ent._dead = true; const s = engine.state; if (GameState.hasItem(s, 'scrollKingsPassage') || GameState.hasItem(s, 'scrollQueensPassage')) { UI.say('A hidden current of magic sweeps you forward.'); engine.loadArea('merlin', at(4)); } } },
    { x: at(5).x, y: at(5).y, sprite: 'e_crow', label: '', interact: true, promptText: '', blocking: false, autoTrigger: true, forceEncounter: true,
      onTrigger: (engine, ent) => { ent._dead = true; const s = engine.state; if (GameState.hasItem(s, 'scrollKingsPassage') || GameState.hasItem(s, 'scrollQueensPassage')) Combat.start(s, Enemies.screechOwl()); } },
    { x: at(6).x, y: at(6).y, sprite: 'i_gem_blue', label: 'Crystal Ball', interact: true, promptText: 'gaze into it', blocking: false, autoTrigger: true,
      onTrigger: async (engine, ent) => {
        ent._dead = true; const s = engine.state;
        const beaten = [];
        if (s.flags.beatVegetableLamb) beaten.push('the Vegetable Lamb of Tartary');
        if (s.flags.queenScrollTaken) beaten.push('a Mama Dragon');
        await UI.say(beaten.length ? `The crystal ball shows visions of ${beaten.join(' and ')}. Merlin would be impressed.` : 'The crystal ball swirls, showing nothing yet worth seeing.');
      } },
    {
      x: merlinRoom.x, y: merlinRoom.y, sprite: 'npc_merlin', label: 'Merlin', interact: true, promptText: 'approach Merlin', blocking: true,
      onTrigger: (engine) => merlinScript(engine),
    },
  ];

  async function libraryVisit(s) {
    const c = await UI.choice('The library holds three books. Which do you read?', [
      { label: 'Spirits and How to Cast Them', value: 'spirits' },
      { label: 'The Art of Toads', value: 'toads' },
      { label: 'Wizard Pants', value: 'pants' },
    ]);
    if (c === 'spirits') {
      s.companions.push(
        { id: 'spirit1', name: 'Spirit', dmg: 1, range: false },
        { id: 'spirit2', name: 'Spirit', dmg: 1, range: false },
        { id: 'spirit3', name: 'Spirit', dmg: 1, range: false },
      );
      await UI.say('You cast 3 ghostly (1/1, non-ranged) spirit companions! Each one strikes alongside you in a fight.');
    }
    if (c === 'toads') { s.companions.push({ id: 'toadCompanion', name: 'Toad Companion' }); GameState.addWeapon(s, { id: 'companion-toad', name: 'Toad (4 dmg, ranged)', dmg: 4, range: true }); await UI.say('You catch a 4/4 ranged toad companion!'); }
    if (c === 'pants') { GameState.addLife(s, 1); await UI.say('You put on the Wizard Pants. Stylish, and +1 life.'); }
  }
  async function potionVisit(s) {
    const c = await UI.choice('Which potion do you take?', [
      { label: 'Married Iguana Potion (+3 life)', value: 'iguana' },
      { label: 'Cold Cane Potion (all weapons +1 dmg)', value: 'cane' },
      { label: 'Moose Juice (woodland animals leave you be)', value: 'moose' },
    ]);
    if (c === 'iguana') { GameState.addLife(s, 3); await UI.say('+3 life!'); }
    if (c === 'cane') { s.weapons.forEach(w => w.dmg += 1); await UI.say('Every weapon you own gets +1 damage!'); }
    if (c === 'moose') { s.flags.mooseJuice = true; await UI.say('Woodland animals will leave you well alone.'); }
  }

  async function merlinScript(engine) {
    const s = engine.state;
    if (s.flags.hasHilt) {
      const hasBlade = s.weapons.some(w => ['sword', 'bladeSwift', 'bladeBrutality', 'bladeDefense'].includes(w.id));
      if (!hasBlade) {
        await UI.say('Merlin notices your bladeless hilt. "You\'ll need an actual blade first — try Rich Village." He teleports you there.', { speaker: 'Merlin' });
        engine.loadArea('richvillage', Areas.richvillage.entryPoint);
        return;
      }
      await UI.say('Merlin notices your sword and welcomes you in. He places a gem in the hilt...', { speaker: 'Merlin' });
      const blade = s.weapons.find(w => ['sword', 'bladeSwift', 'bladeBrutality', 'bladeDefense'].includes(w.id));
      const baseDmg = blade.dmg;
      s.weapons = s.weapons.filter(w => w !== blade);
      GameState.removeItem(s, 'hilt', 1);
      grantWeapon(s, 'excalibur');
      s.weapons.find(w => w.id === 'excalibur').dmg = baseDmg + 7;
      s.flags.hasExcalibur = true;
      await UI.say('The hilt and blade fuse into EXCALIBUR! (+7 damage, take 1 less damage, cannot be lost)');
      await UI.say('"You must find the Knights of the Round Table to survive what comes next," Merlin warns. He lets you visit the library and take a potion, once each.');
      await libraryVisit(s);
      await potionVisit(s);
      await UI.say('Merlin teleports you deep into the Land of Difficulty.');
      engine.loadArea('overworld_north', ONA.landOfDifficulty17);
    } else if (GameState.hasItem(s, 'scrollKingsPassage') || GameState.hasItem(s, 'scrollQueensPassage')) {
      await UI.say('Merlin notices your Note of Passage and looks a little shocked. Still, he says you may visit the library, or have a potion.', { speaker: 'Merlin' });
      const c = await UI.choice('Which will it be?', [{ label: 'Library', value: 'lib' }, { label: 'Potion', value: 'pot' }]);
      if (c === 'lib') await libraryVisit(s); else await potionVisit(s);
      await UI.say('Merlin teleports you deep into the Land of Difficulty.');
      engine.loadArea('overworld_north', ONA.landOfDifficulty16);
    } else {
      await UI.say("Merlin squints at you. \"You're not on any path yet, are you? Come back when you've found your calling.\"", { speaker: 'Merlin' });
    }
  }

  Areas.merlin = { map: rows, legend, entities, entryPoint: at(1) };
})();
