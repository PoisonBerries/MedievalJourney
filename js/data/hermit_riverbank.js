// ============================================================================
// HERMIT'S HOME & RIVERBANK
// ============================================================================
(function () {
  // ---- Hermit's Home -----------------------------------------------------
  const W = 14, H = 12;
  const grid = blankGrid(W, H, '.');
  frameRect(grid, 0, 0, W, H, 'T');
  fillRect(grid, 1, 1, W - 2, H - 2, '.');

  const legend = { '.': { tile: (tx,ty) => hashPick(tx,ty,['t_forest0', 't_forest1', 't_forest2']) }, 'T': { tile: 't_forest0', overlay: (tx,ty) => hashPick(tx,ty,['o_tree', 'o_pine', 'o_bush']), solid: true } };

  async function hermitVisit(engine) {
    const s = engine.state;
    await UI.say('The hermit invites you in and puts the kettle on.', { speaker: 'Hermit' });
    const roll = await UI.rollBanner(6);
    if (roll === 1) await UI.say("You're stuck for 1 turn drinking tea and water. Cozy, at least.");
    else if (roll === 2) await UI.say('He shows off his prize-winning barley. Fascinating. Nothing else happens.');
    else if (roll === 3) await UI.say('You enjoy the hospitality. A pleasant visit.');
    else if (roll === 4) await UI.say('A nosy neighbor pops in to see what the fuss is about, then leaves.');
    else if (roll === 5) { GameState.addLife(s, -1); await UI.say('He gets drunk on homemade cider and accidentally shoots you. -1 life.'); }
    else { GameState.addQ(s, 1); await UI.say("\"It's your birthday? Here, take this q, don't tell anyone I have money.\" +1q"); }
  }

  async function hermitCellar(engine) {
    const s = engine.state;
    await UI.say('"For 15q, you can use my cellar — comes out the other side, by the Castle\'s east door." — Hermit', { speaker: 'Hermit' });
    const go = await UI.choice('Pay 15q to use the cellar shortcut?', [{ label: 'Yes', value: true }, { label: 'No', value: false }]);
    if (!go) return;
    if (!GameState.spendQ(s, 15)) { UI.notify('Not enough quickels!'); return; }
    await UI.say('You climb down into a musty tunnel... and emerge, blinking, at the east door of the Castle.');
    engine.loadArea('castle', CastleAnchors.east);
  }

  const entities = [
    { x: 6, y: 5, sprite: 'npc_hermit', label: 'Hermit', interact: true, promptText: 'visit', blocking: true, onTrigger: hermitVisit },
    { x: 9, y: 8, sprite: 'o_well', label: 'Cellar', interact: true, promptText: 'use cellar (15q)', blocking: false, onTrigger: hermitCellar },
    { x: W - 3, y: H - 3, sprite: 'o_sign', label: 'To Overworld', interact: true, promptText: 'leave', blocking: false, autoTrigger: true,
      onTrigger: (engine) => engine.loadArea('overworld_south', { x: OSA.hermitsHome.x, y: OSA.hermitsHome.y + 2 }) },
  ];

  Areas.hermitshome = { map: gridToRows(grid), legend, entities, townName: "Hermit's Home", entryArea: 'hermitshome', entryPoint: { x: 6, y: 8 } };
})();

(function () {
  // ---- Riverbank ----------------------------------------------------------
  const W = 16, H = 12;
  const grid = blankGrid(W, H, 's');
  frameRect(grid, 0, 0, W, H, '#');
  fillRect(grid, 1, 1, W - 2, 5, 's');
  fillRect(grid, 1, 6, W - 2, H - 7, '~');

  const legend = {
    's': { tile: 't_sand' }, '~': { tile: 't_water0', solid: true, water: true },
    '#': { tile: 't_hillrock', solid: true },
  };

  async function riverbankSign(engine) {
    const s = engine.state;
    if (s.flags.hasBoat) {
      await UI.say('"This marks the beginning of the Path of the Knight. If you don\'t have a boat you must roll to see where the current takes you." — Sign', { speaker: 'Sign' });
      if (GameState.setPath(s, 'knight')) await UI.say('With your boat, you row safely across. You commit to the Path of the Knight!');
      else await UI.say(`With your boat, you row safely across. (You remain on the Path of the ${s.flags.path}.)`);
      await UI.say('The river continues beyond any map yet drawn of this land. For now, the water carries only silence and the occasional fish.');
      return;
    }
    await UI.say('"This marks the beginning of the Path of the Knight. If you don\'t have a boat you must roll." — Sign', { speaker: 'Sign' });
    const roll = await UI.rollBanner(6);
    if (roll === 1) { await UI.say('The current sweeps you all the way back to Happy Town!'); engine.loadArea('happytown', Areas.happytown.entryPoint); }
    else if (roll === 2) { await UI.say('The current sweeps you to the Farmlands!'); engine.loadArea('farmlands', Areas.farmlands.entryPoint); }
    else if (roll <= 5) { await UI.say('The current sweeps you all the way into the Monster Hills, dumping you at a strange rabbit hole!'); engine.loadArea('monsterhills', MonsterHillsAnchors.node4); }
    else { await UI.say('The current sweeps you into the Random Tavern, dripping wet.'); engine.loadArea('randomtavern', Areas.randomtavern.entryPoint); }
  }

  async function fishingHole(engine) {
    const s = engine.state;
    const roll = await UI.rollBanner(6);
    if (roll === 1) { GameState.addItem(s, { ...ItemDefs.grammaThings, name: 'Fresh Fish', combatUse: (st, ctx) => { GameState.addLife(st, 1); ctx.pushLog('+1 life.'); } }); await UI.say('You catch a fish! (eat anytime for 1 life)'); }
    else if (roll <= 3) { GameState.addQ(s, 0); await UI.say('You catch 3 fish! Dinner is sorted for a while.'); GameState.addLife(s, 3); }
    else { await UI.say("Nothing's biting..."); }
  }

  const entities = [
    { x: 4, y: 3, sprite: 'o_sign', label: 'Path of the Knight', interact: true, promptText: 'read sign', blocking: false, onTrigger: riverbankSign },
    { x: 10, y: 3, sprite: 'i_fish', label: 'Fishing Spot', interact: true, promptText: 'fish', blocking: false, onTrigger: fishingHole },
    { x: W - 3, y: 3, sprite: 'o_sign', label: 'To Overworld', interact: true, promptText: 'leave', blocking: false, autoTrigger: true,
      onTrigger: (engine) => engine.loadArea('overworld_south', { x: OSA.riverbank.x, y: OSA.riverbank.y + 2 }) },
  ];

  Areas.riverbank = { map: gridToRows(grid), legend, entities, townName: 'Riverbank', entryArea: 'riverbank', entryPoint: { x: 8, y: 2 } };
})();
