// ============================================================================
// OVERWORLD (NORTH) — beyond The Gate: Monster Hills, Merlin's Hideout,
// the Land of Difficulty (a dangerous road), and the Castle.
// ============================================================================
const ONA = {
  gateReturn: { x: 24, y: 27 }, monsterHills: { x: 8, y: 18 }, merlinsHideout: { x: 16, y: 10 },
  landOfDifficultyStart: { x: 22, y: 9 }, castleEntrance: { x: 42, y: 6 },
  castleSouthExit: { x: 42, y: 8 }, castleEastExit: { x: 10, y: 8 }, castleNorthExit: { x: 42, y: 2 },
  landOfDifficulty16: { x: 26, y: 9 }, landOfDifficulty17: { x: 36, y: 8 },
};

(function () {
  const W = 48, H = 30;
  const grid = blankGrid(W, H, '.');
  frameRect(grid, 0, 0, W, H, '^');

  const A = ONA;
  const edges = [
    [A.gateReturn, A.monsterHills], [A.gateReturn, A.merlinsHideout],
    [A.merlinsHideout, A.landOfDifficultyStart], [A.landOfDifficultyStart, A.castleEntrance],
  ];
  edges.forEach(([a, b]) => { carveRoad(grid, a.x, a.y, b.x, b.y, '='); widen(grid, Math.round((a.x + b.x) / 2), Math.round((a.y + b.y) / 2), '=', 2); });
  Object.values(A).forEach(p => widen(grid, p.x, p.y, '=', 3));
  // Land of Difficulty: mark the stretch of road east of Merlin's Hideout as dangerous
  for (let x = A.landOfDifficultyStart.x; x <= A.castleEntrance.x; x++) {
    for (let y = 6; y <= 11; y++) if (grid[y] && grid[y][x] === '=') setAt(grid, x, y, 'D');
  }
  blob(grid, 8, 18, 5, '^'); // hills border with a gap for the entrance
  fillRect(grid, A.monsterHills.x - 1, A.monsterHills.y - 1, 3, 3, '=');
  scatter(grid, 0, 0, W, H, ',', 0.1, ['=', 'D', '^']);
  scatter(grid, 0, 0, W, H, 'T', 0.06, ['=', 'D', '^']);

  const roadLoot = { q: [2, 6], itemChance: 0.18, items: [{ ...ItemDefs.healthPotion }, { ...ItemDefs.grammaThings }] };
  const difficultyLoot = { q: [4, 12], itemChance: 0.3, items: [{ ...ItemDefs.pie }, { ...ItemDefs.vanishingSmoke }, { ...ItemDefs.broom }] };
  const roadPool = [() => foe('Wandering Wolf-Dog', 'e_rat', 2, 5, false), () => foe('Sneaky Goblin', 'e_goblin', 2, 6, false), () => foe('Icy Crow', 'e_crow', 1, 4, false)];
  const dangerPool = [Enemies.rockThrower, Enemies.drunkCastlegoer, Enemies.goblinThief, Enemies.mamaBear, Enemies.centicore];
  function onRoadDanger(engine) { const en = rng.pick(roadPool)(); en.lootTable = roadLoot; Combat.start(engine.state, en); }
  function onDanger(engine) { const en = rng.pick(dangerPool)(); en.lootTable = difficultyLoot; Combat.start(engine.state, en); }

  const legend = {
    '.': { tile: (tx,ty) => hashPick(tx,ty,['t_snow0', 't_snow1', 't_grass1', 't_snow0']), danger: 0.015, onDanger: onRoadDanger },
    ',': { tile: (tx,ty) => hashPick(tx,ty,['t_grass1', 't_snow2']), danger: 0.015, onDanger: onRoadDanger },
    '=': { tile: (tx,ty) => hashPick(tx,ty,['t_road0', 't_road1']), danger: 0.03, onDanger: onRoadDanger },
    'D': { tile: (tx,ty) => hashPick(tx,ty,['t_road0', 't_road2']), overlay: 'o_rock', danger: 0.12, onDanger },
    'T': { tile: 't_snow0', overlay: (tx,ty) => hashPick(tx,ty,['o_pine', 'o_pine', 'o_tree']), solid: true },
    '^': { tile: 't_hillrock', solid: true },
  };

  function marker(p, sprite, label, promptText, onTrigger) {
    return { x: p.x, y: p.y, sprite, label, interact: true, promptText, blocking: true, onTrigger };
  }

  const entities = [
    marker(A.monsterHills, 'o_snowyhill', 'Monster Hills', 'climb into the Monster Hills', (e) => e.loadArea('monsterhills', Areas.monsterhills.entryPoint)),
    marker(A.merlinsHideout, 'npc_merlin', "Merlin's Hideout", "enter Merlin's Hideout", (e) => e.loadArea('merlin', Areas.merlin.entryPoint)),
    marker(A.castleEntrance, 'o_castletower', 'The Castle', 'enter the very large Castle', (e) => e.loadArea('castle', Areas.castle.entryPoint)),
    { x: 20, y: 5, sprite: 'o_sign', label: 'Land of Difficulty', interact: true, promptText: 'read sign', blocking: false,
      onTrigger: () => UI.say('"THE LAND OF DIFFICULTY" is carved crudely into a warning post. The road ahead looks rough.', { speaker: 'Sign' }) },
  ];

  Areas.overworld_north = { map: gridToRows(grid), legend, entities, onDanger };
})();
