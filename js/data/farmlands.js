// ============================================================================
// FARMLANDS — "Work your way up." Jeremiah's Bean Farm, Wheat & Corn
// Industries, Mabel's Mustard Plantation.
// ============================================================================
(function () {
  const W = 22, H = 18;
  const grid = blankGrid(W, H, '.');
  frameRect(grid, 0, 0, W, H, 'T');
  fillRect(grid, 1, 1, W - 2, H - 2, '.');
  fillRect(grid, 2, 8, W - 4, 2, '=');
  scatter(grid, 1, 1, W - 2, H - 2, ',', 0.1);

  const legend = {
    '.': { tile: (tx,ty) => hashPick(tx,ty,['t_grass0', 't_grass1', 't_grass3']) },
    ',': { tile: (tx,ty) => hashPick(tx,ty,['t_grass1', 't_grass2']) },
    '=': { tile: (tx,ty) => hashPick(tx,ty,['t_road0', 't_road1']) },
    'T': { tile: 't_grass0', overlay: 'o_tree', solid: true },
    '#': { tile: 't_hillrock', solid: true },
  };

  async function jeremiah(engine) {
    const s = engine.state;
    await UI.say('"Hello! Pay me 2q and you can work for me — as long as your beans succeed." — Jeremiah', { speaker: 'Jeremiah' });
    const go = await UI.choice('Work the bean farm for 2q?', [{ label: 'Pay 2q and work', value: true }, { label: 'Not now', value: false }]);
    if (!go) return;
    if (!GameState.spendQ(s, 2)) { UI.notify('Not enough quickels!'); return; }
    await UI.say('Two turns pass tending the bean rows...');
    const roll = await UI.rollBanner(6);
    if (roll <= 2) await UI.say('Drought! Your beans die in the field. Jeremiah shrugs apologetically.');
    else if (roll <= 4) { GameState.addQ(s, 10); await UI.say('Plentiful beans! Jeremiah pays you 10q.'); }
    else if (roll === 5) { GameState.addQ(s, 15); await UI.say("A bountiful harvest — Jeremiah is thrilled and gives you 15q!"); }
    else { GameState.addItem(s, { ...ItemDefs.magicBeans }); await UI.say("Jeremiah trades you his cow's calf for a handful of strange magic beans. No pay, but... magic beans!"); }
  }

  async function wheat(engine) {
    const s = engine.state;
    await UI.say('Wheat Industry: pay 1q to get started.', { speaker: 'Sign' });
    const go = await UI.choice('Pay 1q and farm wheat (3 turns)?', [{ label: 'Yes', value: true }, { label: 'No', value: false }]);
    if (!go) return;
    if (!GameState.spendQ(s, 1)) { UI.notify('Not enough quickels!'); return; }
    await UI.say('Three turns of wheat farming pass...');
    const roll = await UI.rollBanner(6);
    if (roll === 1) { GameState.addQ(s, 5); await UI.say('Bad season, but you still scrape together 5q.'); }
    else if (roll === 2) { GameState.addQ(s, 3); await UI.say('An ok season. 3q.'); }
    else if (roll === 3) { GameState.addQ(s, 4); await UI.say('A good season. 4q.'); }
    else if (roll <= 5) { GameState.addQ(s, 10); await UI.say('A perfect season! 10q.'); }
    else { GameState.addLife(s, 3); GameState.addQ(s, 1); await UI.say('You eat all your wheat yourself. +3 life, +1q.'); }
  }

  async function corn(engine) {
    const s = engine.state;
    await UI.say('Corn Industry: 2q to start, 5q back after 7 turns.', { speaker: 'Sign' });
    const go = await UI.choice('Invest 2q in corn?', [{ label: 'Yes', value: true }, { label: 'No', value: false }]);
    if (!go) return;
    if (!GameState.spendQ(s, 2)) { UI.notify('Not enough quickels!'); return; }
    await UI.say('Seven turns pass tending the cornfield...');
    GameState.addQ(s, 5);
    await UI.say('The corn sells well. +5q.');
  }

  async function mustard(engine) {
    const s = engine.state;
    await UI.say('"Pay 10q, 10 turns — same odds as wheat but four times the value!" — Mabel', { speaker: 'Mabel' });
    const go = await UI.choice('Invest 10q in mustard?', [{ label: 'Yes', value: true }, { label: 'No', value: false }]);
    if (!go) return;
    if (!GameState.spendQ(s, 10)) { UI.notify('Not enough quickels!'); return; }
    await UI.say('Ten long turns of mustard farming pass...');
    const roll = await UI.rollBanner(6);
    const table = { 1: 20, 2: 12, 3: 16, 4: 40, 5: 40 };
    if (table[roll]) { GameState.addQ(s, table[roll]); await UI.say(`The mustard sells for ${table[roll]}q!`); }
    else await UI.say('The crop is wasted — no lives to gain from mustard, unfortunately.');
  }

  const entities = [
    { x: 5, y: 4, sprite: 'npc_farmer', label: 'Jeremiah', interact: true, promptText: "talk to Jeremiah", blocking: true, onTrigger: jeremiah },
    { x: 11, y: 4, sprite: 'o_sign', label: 'Wheat Industry', interact: true, promptText: 'work the wheat', blocking: false, onTrigger: wheat },
    { x: 16, y: 4, sprite: 'o_sign', label: 'Corn Industry', interact: true, promptText: 'work the corn', blocking: false, onTrigger: corn },
    { x: 11, y: 13, sprite: 'npc_gramma', label: "Mabel's Mustard Plantation", interact: true, promptText: 'talk to Mabel', blocking: true, onTrigger: mustard },
    { x: W - 3, y: H - 3, sprite: 'o_sign', label: 'To Overworld', interact: true, promptText: 'leave', blocking: false, autoTrigger: true,
      onTrigger: (engine) => engine.loadArea('overworld_south', { x: OSA.farmlands.x, y: OSA.farmlands.y + 2 }) },
  ];

  Areas.farmlands = { map: gridToRows(grid), legend, entities, townName: 'Farmlands', entryArea: 'farmlands', entryPoint: { x: 11, y: 9 } };
})();
