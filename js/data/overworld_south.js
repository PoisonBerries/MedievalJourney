// ============================================================================
// OVERWORLD (SOUTH) — Happy Town / Poor Country / Farmlands / Wealthy
// Country / Rich Village / Woods / Random Tavern / Hermit's Home /
// Riverbank / The Lake, all connected by road, south of The Gate.
// ============================================================================
const OSA = { // anchor coordinates, reused by region files for their exits
  happyTown: { x: 6, y: 34 }, farmlands: { x: 8, y: 24 }, richVillage: { x: 14, y: 13 },
  randomTavern: { x: 26, y: 28 }, hermitsHome: { x: 36, y: 26 }, riverbank: { x: 46, y: 29 },
  woodsEntrance: { x: 26, y: 19 }, lake: { x: 28, y: 11 }, gate: { x: 26, y: 4 },
};

(function () {
  const W = 52, H = 38;
  const grid = blankGrid(W, H, '.');
  frameRect(grid, 0, 0, W, H, 'T');

  const A = OSA;
  const edges = [
    [A.happyTown, A.farmlands], [A.farmlands, A.richVillage], [A.farmlands, A.randomTavern],
    [A.randomTavern, A.happyTown], [A.richVillage, A.woodsEntrance], [A.woodsEntrance, A.randomTavern],
    [A.woodsEntrance, A.hermitsHome], [A.hermitsHome, A.riverbank], [A.woodsEntrance, A.lake],
    [A.lake, A.richVillage], [A.lake, A.gate], [A.richVillage, A.gate],
  ];
  edges.forEach(([a, b]) => { carveRoad(grid, a.x, a.y, b.x, b.y, '='); widen(grid, Math.round((a.x + b.x) / 2), Math.round((a.y + b.y) / 2), '=', 2); });
  Object.values(A).forEach(p => widen(grid, p.x, p.y, '=', 3));

  blob(grid, A.lake.x, A.lake.y, 4, '~');
  scatter(grid, 0, 0, W, H, 'T', 0.05, ['=', '~']);
  scatter(grid, 0, 0, W, H, ',', 0.1, ['=', '~', 'T']);
  // forest ring around woods entrance (visual cue you're nearing the Woods)
  for (let a2 = 0; a2 < 18; a2++) {
    const ang = a2 / 18 * Math.PI * 2;
    const bx = A.woodsEntrance.x + Math.round(Math.cos(ang) * 5), by = A.woodsEntrance.y + Math.round(Math.sin(ang) * 5);
    if (Math.abs(bx - A.woodsEntrance.x) > 1 || Math.abs(by - A.woodsEntrance.y) > 1) setAt(grid, bx, by, 'T');
  }
  setAt(grid, A.gate.x, A.gate.y - 1, '='); // road continues to the gate building above

  const legend = {
    '.': { tile: () => rng.pick(['t_grass0', 't_grass0', 't_grass1']) },
    ',': { tile: 't_grass1' },
    '=': { tile: 't_road' },
    'T': { tile: 't_grass0', overlay: 'o_tree', solid: true },
    '~': { tile: 't_water0', solid: true },
    '#': { tile: 't_hillrock', solid: true },
  };

  function marker(p, sprite, label, promptText, onTrigger, size) {
    return { x: p.x, y: p.y, sprite, label, size, interact: true, promptText, blocking: true, onTrigger };
  }

  const entities = [
    marker(A.happyTown, 'b_generic_red', 'Happy Town', 'enter Happy Town (no fighting)', (e) => e.loadArea('happytown', Areas.happytown.entryPoint)),
    marker(A.farmlands, 'b_generic_brown', 'Farmlands', 'enter the Farmlands', (e) => e.loadArea('farmlands', Areas.farmlands.entryPoint)),
    marker(A.richVillage, 'b_rich', 'Rich Village', 'enter Rich Village', (e) => e.loadArea('richvillage', Areas.richvillage.entryPoint)),
    marker(A.randomTavern, 'b_tavern', 'Random Tavern', 'enter the Random Tavern', (e) => e.loadArea('randomtavern', Areas.randomtavern.entryPoint)),
    marker(A.hermitsHome, 'b_generic_brown', "Hermit's Home", "visit the Hermit's Home", (e) => e.loadArea('hermitshome', Areas.hermitshome.entryPoint)),
    marker(A.riverbank, 'o_sign', 'Riverbank', 'go to the Riverbank', (e) => e.loadArea('riverbank', Areas.riverbank.entryPoint)),
    marker(A.woodsEntrance, 'o_tree', 'The Woods', 'enter the Woods', (e) => e.loadArea('woods', Areas.woods.entryPoint)),
    marker(A.gate, 'o_castletower', 'The Gate', 'approach the Gate', (e) => e.loadArea('thegate', Areas.thegate.entryPoint)),
    {
      x: A.lake.x, y: A.lake.y + 4, sprite: 'o_sign', label: 'The Lake', interact: true, promptText: 'approach the water', blocking: false,
      onTrigger: (engine) => lakeScript(engine),
    },
    { x: 4, y: 4, sprite: 'o_sign', label: '', interact: true, promptText: 'read sign', blocking: false,
      onTrigger: () => UI.say('"Poor Country — work your way up."', { speaker: 'Sign' }) },
  ];

  async function lakeScript(engine) {
    const s = engine.state;
    if (s.flags.metLadyOfLake) { UI.notify('The lake ripples quietly. The Lady does not reappear.'); return; }
    s.flags.metLadyOfLake = true;
    await UI.say('The Lady of the Lake slowly emerges. She hands you the hilt of a sword — no blade — with an empty spot for a gem.', { speaker: 'The Lady of the Lake' });
    await UI.say('All of your other weapons disappear. 5q appear in your pocket. You are teleported back to Happy Town.');
    s.weapons = [];
    s.equippedWeapon = null;
    GameState.addItem(s, { ...ItemDefs.hilt });
    s.flags.hasHilt = true;
    GameState.addQ(s, 5);
    engine.loadArea('happytown', Areas.happytown.entryPoint);
  }

  Areas.overworld_south = { map: gridToRows(grid), legend, entities };
})();
