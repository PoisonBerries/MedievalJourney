// ============================================================================
// CASTLE — "very large" — plus a reusable Dungeons mini-game, since half
// the castle's mishaps end with "...and then you're thrown in the dungeons."
// ============================================================================
const CastleAnchors = {};

const Dungeons = (() => {
  function layout(variant) {
    const grid = blankGrid(11, 9, '#');
    fillRect(grid, 5, 3, 1, 3, '.'); fillRect(grid, 1, 4, 9, 1, '.');
    fillRect(grid, 1, 1, 1, 7, '.'); fillRect(grid, 9, 1, 1, 7, '.');
    fillRect(grid, 1, 1, 9, 1, '.'); fillRect(grid, 1, 7, 9, 1, '.');
    const spots = { r1: { x: 2, y: 2 }, r2: { x: 8, y: 2 }, r3: { x: 2, y: 6 }, r4: { x: 8, y: 6 }, p: { x: 5, y: 1 }, exit: { x: 5, y: 7 }, start: { x: 5, y: 5 }, dollar: { x: 5, y: 0 } };
    return { grid, spots };
  }

  function enter(engine, onExit) {
    const s = engine.state;
    const variant = rng.pick([1, 2, 3]);
    const { grid, spots } = layout(variant);
    const rats = variant === 3 ? ['r1', 'r3'] : variant === 2 ? ['r1', 'r2', 'r3', 'r4'] : ['r1'];
    const legend = { '.': { tile: 't_stonefloor' }, '#': { tile: 'o_castlewall', solid: true } };
    const entities = [];
    rats.forEach(k => entities.push({ x: spots[k].x, y: spots[k].y, sprite: 'e_rat', label: 'Rat', interact: true, promptText: 'catch rat', blocking: false, autoTrigger: true,
      onTrigger: (eng, e) => { e._dead = true; s.companions.push({ id: 'rat' + k, name: 'Rat', dmg: 1, range: false }); UI.notify('A rat companion joins you! (1/1, and it bites)'); } }));
    entities.push({ x: spots.p.x, y: spots.p.y, sprite: 'e_rat', label: 'Rat Poison', interact: true, promptText: '...', blocking: false, autoTrigger: true,
      onTrigger: (eng, e) => { e._dead = true; const before = s.companions.length; s.companions = s.companions.filter(c => !c.id.startsWith('rat')); if (before !== s.companions.length) UI.notify('Rat poison! Your rat companions scatter and die.'); } });
    if (variant === 2 && spots.dollar) entities.push({ x: spots.dollar.x, y: spots.dollar.y, sprite: 'i_coin', label: 'Cache', interact: true, promptText: 'take quickels', blocking: false, autoTrigger: true,
      onTrigger: (eng, e) => { e._dead = true; GameState.addQ(s, 8); UI.notify('You find a stash of every transportation fee ever paid here: +8q!'); } });
    // a rat swarm flanks both approaches to the exit along the bottom
    // corridor, so however you looped the ring you can't reach it unfought.
    [4, 6].forEach(gx => entities.push({ x: gx, y: 7, sprite: 'e_rat', label: 'Hostile Rats', interact: true, promptText: 'the path is blocked', blocking: true, autoTrigger: true, forceEncounter: true,
      onTrigger: (eng, e) => { e._dead = true; Combat.start(s, foe('Hostile Rat Swarm', 'e_rat', 2, 5, false)); } }));
    entities.push({ x: spots.exit.x, y: spots.exit.y, sprite: 'o_sign', label: 'Exit', interact: true, promptText: 'climb out', blocking: false, autoTrigger: true,
      onTrigger: () => { UI.notify('You escape the dungeon!'); onExit(); } });
    Areas.dungeon_temp = { map: gridToRows(grid), legend, entities, entryPoint: spots.start };
    engine.loadArea('dungeon_temp', spots.start);
  }
  return { enter };
})();

// ---- shared Castle pt.2 tables -------------------------------------------
async function castleEnemyRoll(engine) {
  const s = engine.state; const roll = rng.d6();
  if (roll === 1) {
    const c = await UI.choice('A shady figure blocks you.', [{ label: 'Give up an item', value: 'item' }, { label: 'Fight the goblin thief', value: 'fight' }]);
    if (c === 'item' && s.items.length) GameState.removeItem(s, s.items[0].id, 1);
    else await Combat.start(s, Enemies.goblinThief());
  } else if (roll === 2) await Combat.start(s, Enemies.rockThrower());
  else if (roll === 3) await Combat.start(s, Enemies.drunkCastlegoer());
  else if (roll === 4) await Combat.start(s, Enemies.peasantMob());
  else if (roll === 5) { const res = await Combat.start(s, Enemies.ghost()); if (res.result !== 'win') await UI.stun(3000, "The ghost's wail costs you time — you're dazed for a while."); }
  else await Combat.start(s, Enemies.looseMoose());
}

async function castleEventRoll(engine) {
  const s = engine.state; const roll = rng.d6();
  if (roll === 1) {
    const sub = rng.d6();
    if (sub <= 3) { await UI.say('Witch trials! You are found guilty and lose your magical items.', { speaker: 'Town Crier' }); s.items = s.items.filter(i => !i.id.includes('potion')); Dungeons.enter(engine, () => {}); }
    else await UI.say('Witch trials are held, but no apparent witches are found in town. Nothing happens.');
  } else if (roll === 2) {
    GameState.addLife(s, -3 - s.companions.filter(c => c.id.startsWith('rat')).length);
    await UI.say('The Plague sweeps through! -3 life (and 1 more per rat companion).');
  } else if (roll === 3) {
    if (rng.d6() % 2 === 1) { GameState.addLife(s, 1); await UI.say('Cranberry Festival! You gain 1 life from the free cider.'); }
    else { GameState.addItem(s, { id: 'festArrow', name: 'Festival Arrow', icon: 'i_arrow_flame', combatUse: (st, ctx) => { const t = ctx.foes.find(f => f.hp > 0); if (t) { t.hp -= 12; ctx.pushLog(`Festival arrow deals 12 to ${t.name}!`); } } }); await UI.say('Cranberry Festival! You win 2 twelve-damage festival arrows.'); }
  } else if (roll === 4) {
    const sub = rng.d6();
    if (sub === 1) { GameState.addQ(s, 1); await UI.say('Weapon Day: you invent a wheel. Everyone loves it. +1q for your trouble.'); }
    else if (sub === 2) { const w = s.weapons.find(w => w.id === s.equippedWeapon); if (w) w.dmg += 2; await UI.say('Weapon Day: your weapon is upgraded! +2 damage.'); }
    else if (sub <= 4) { const w = s.weapons.find(w => w.id === s.equippedWeapon); if (w) w.dmg = Math.max(1, w.dmg - 1); await UI.say('Weapon Day: you try to upgrade your weapon, but it loses 1 damage instead. Oops.'); }
    else { await UI.say('Weapon Day goes wrong — you\'re sent to the dungeons. At least you find 3q down there.'); GameState.addQ(s, 3); Dungeons.enter(engine, () => {}); }
  } else if (roll === 5) {
    const sub = rng.d6();
    if (sub <= 3) { await UI.say('You become a jester. Everyone hates the act. Sent to the dungeons.'); Dungeons.enter(engine, () => {}); }
    else { const w = s.weapons.find(w => w.id === s.equippedWeapon); if (w) w.dmg += 3; await UI.say('You become a jester and they love it! A weapon of choice gets +3 damage.'); }
  } else {
    const sub = rng.d6();
    if (sub <= 2) await UI.say('There is a war. You opt out.');
    else { GameState.addLife(s, -1); await UI.say('There is a war — you join, and get stabbed once. -1 life.'); }
  }
}

(function () {
  const W = 46, H = 30;
  const grid = blankGrid(W, H, '#');
  const cx = 23, cy = 15;
  fillRect(grid, cx - 2, cy - 2, 4, 4, '.'); // hub
  fillRect(grid, 2, cy - 1, cx - 2, 2, '.'); // west (purple) wing
  fillRect(grid, cx - 1, 2, 2, cy - 2, '.'); // north (green) wing
  fillRect(grid, cx - 1, cy, 2, H - 2 - cy, '.'); // south (orange) wing
  fillRect(grid, cx, cy - 1, W - 2 - cx, 2, '.'); // east (red) wing
  fillRect(grid, cx - 5, cy - 7, 10, 5, '.'); // great hall room (north end)
  fillRect(grid, 3, cy - 4, 8, 6, '.'); // queen's quarters (west end)
  fillRect(grid, cx - 5, H - 8, 10, 6, '.'); // courtyard (south end)
  fillRect(grid, W - 12, cy - 4, 9, 6, '.'); // king's quarters (east end)
  fillRect(grid, cx + 6, cy - 9, 6, 5, '.'); // long red hallway event room (NE)

  const legend = { '.': { tile: 't_stonefloor' }, '#': { tile: 'o_castlewall', solid: true } };

  function lockedDoor(x, y, checkFn, failMsg) {
    return { x, y, sprite: 'i_key', label: 'Locked Door', interact: true, promptText: 'try door', blocking: true,
      onTrigger: async (engine, e) => { const s = engine.state; if (checkFn(s)) { e.blocking = false; e.interact = false; UI.notify('The door unlocks.'); } else await UI.say(failMsg); } };
  }

  function enemyNode(x, y) { return { x, y, sprite: 'e_soldier', label: 'Trouble', interact: true, promptText: 'approach', blocking: true, autoTrigger: true, forceEncounter: true, onTrigger: (engine, e) => { e._dead = true; castleEnemyRoll(engine); } }; }
  function eventNode(x, y) { return { x, y, sprite: 'i_scroll', label: 'Something Happening', interact: true, promptText: 'investigate', blocking: false, autoTrigger: true, onTrigger: (engine, e) => { e._dead = true; castleEventRoll(engine); } }; }
  function dungeonSpur(x, y) { return { x, y, sprite: 'o_well', label: 'Dark Stairwell', interact: true, promptText: 'descend', blocking: false, onTrigger: (engine) => Dungeons.enter(engine, () => engine.loadArea('castle', { x, y: y + 1 })) }; }

  async function greatHall(engine) {
    const s = engine.state;
    if (s.flags.hasExcalibur) {
      const c = await UI.choice('Great Hall: feast, or visit the Knights of the Round Table?', [{ label: 'Feast', value: 'feast' }, { label: 'Knights of the Round Table', value: 'knights' }]);
      if (c === 'knights') return knightsOfTheRoundTable(engine);
      return feast(engine);
    }
    return feast(engine);
  }
  async function feast(engine) {
    const s = engine.state;
    const roll = rng.d6();
    if (roll === 1) { GameState.addLife(s, 3); await UI.say('A magnificent feast! +3 life.'); }
    else if (roll === 2) { GameState.addLife(s, 1); await UI.say('A decent feast. +1 life.'); }
    else { GameState.addLife(s, -1); await UI.say('Food poisoning. -1 life.'); }
  }
  async function knightsOfTheRoundTable(engine) {
    const s = engine.state;
    if (s.flags.isKnight) { await UI.say('"They already know your name here, Sir." — a Knight'); return; }
    s.flags.isKnight = true;
    await UI.say('You are dubbed a Knight of the Round Table! Choose your companion:', { speaker: 'King Arthur (in spirit)' });
    const c = await UI.choice('Choose one:', [
      { label: 'Sir Todd — deals 3 dmg to ALL enemies at once', value: 'todd' },
      { label: 'Sir Gus the Sacrificer — absorbs 3 hits for you before falling', value: 'gus' },
      { label: 'Sir Macintosh — a mighty 15/15 ally, ranged & non-ranged', value: 'mac' },
    ]);
    if (c === 'todd') GameState.addItem(s, { id: 'sirTodd', name: 'Sir Todd', icon: 'i_scroll', combatUse: (st, ctx) => { ctx.foes.forEach(f => { if (f.hp > 0) f.hp -= 3; }); ctx.pushLog('Sir Todd sweeps through, dealing 3 to every foe!'); } });
    if (c === 'gus') s.companions.push({ id: 'sirGus', name: 'Sir Gus the Sacrificer', charges: 3 });
    if (c === 'mac') s.companions.push({ id: 'sirMac', name: 'Sir Macintosh', dmg: 15, hp: 15, range: true });
  }

  async function courtyardSoup(engine) {
    const s = engine.state;
    const go = await UI.choice('"Fresh soup, 15q, put color back in those cheeks!" — Grace Rogers', [{ label: 'Buy soup (15q)', value: true }, { label: 'No thanks', value: false }]);
    if (!go) return;
    if (!GameState.spendQ(s, 15)) { UI.notify('Not enough quickels!'); return; }
    GameState.addLife(s, 30);
    await UI.say('The soup is absolutely magical. +30 life!');
    engine.state.flags.courtyardCleared = true;
  }

  async function kingsQuarters(engine) {
    const s = engine.state;
    if (!GameState.hasItem(s, 'scrollKingsPassage')) { await UI.say('The door is barred: "King\'s Passage required."'); return; }
    if (s.flags.isKing || s.flags.isQueen) { await UI.say('The guards bow as royalty passes.'); return; }
    await UI.say('The King himself rises to meet your challenge, an army of a thousand soldiers at his back in spirit alone.', { speaker: 'The King' });
    const res = await Combat.start(s, Enemies.king());
    if (res.result === 'win') {
      s.flags.isKing = true; GameState.setPath(s, 'king');
      await UI.say('You are crowned King! Your trusty steed lets you move even faster, and the Gate opens for you freely from now on.');
      s.flags.gatePassed = true; s.flags.royalSpeed = true;
    } else { await UI.say('Defeated! You are thrown in the dungeons.'); Dungeons.enter(engine, () => engine.loadArea('castle', CastleAnchors.east)); }
  }

  async function queensQuarters(engine) {
    const s = engine.state;
    if (!GameState.hasItem(s, 'scrollQueensPassage')) { await UI.say('The door is barred: "Queen\'s Passage required."'); return; }
    if (s.flags.isKing || s.flags.isQueen) { await UI.say('The guards bow as royalty passes.'); return; }
    await UI.say('The Queen draws her enchanted bow — it deals 7 divisible damage the instant the fight begins!', { speaker: 'The Queen' });
    GameState.addLife(s, -7);
    if (s.life <= 0) { await UI.say('The opening volley finishes you. To the dungeons.'); Dungeons.enter(engine, () => engine.loadArea('castle', { x: cx, y: cy })); return; }
    const res = await Combat.start(s, Enemies.queen());
    if (res.result === 'win') {
      s.flags.isQueen = true; GameState.setPath(s, 'queen');
      await UI.say('You are crowned Queen! You may deal 7 divisible damage to any foe at the start of any battle from now on, and the Gate opens for you freely.');
      s.flags.gatePassed = true; s.flags.queenOpeningStrike = true;
      engine.loadArea('castle', { x: W - 3, y: cy });
    } else { await UI.say('Defeated! You are thrown in the dungeons.'); Dungeons.enter(engine, () => engine.loadArea('castle', { x: cx, y: cy })); }
  }

  async function toddCameo(engine) {
    const s = engine.state;
    if (!GameState.hasItem(s, 'key')) { await UI.say('The door is locked tight. Perhaps a key would help.'); return; }
    await UI.say('You unlock the door and find... Todd. Somehow. "Biscuit?" he offers, entirely unbothered.', { speaker: 'Todd' });
    GameState.addLife(s, 5);
    await UI.say('It\'s strangely comforting. +5 life.');
  }

  const entities = [
    // west (purple) wing — Queen's side
    enemyNode(cx - 8, cy), eventNode(cx - 4, cy - 1),
    lockedDoor(6, cy - 4, s => GameState.hasItem(s, 'scrollQueensPassage') || s.flags.isQueen || s.flags.isKing, '"Queen\'s Passage required." the guard states flatly.'),
    { x: 6, y: cy - 5, sprite: 'npc_queen', label: "Queen's Quarters", interact: true, promptText: 'enter', blocking: true, onTrigger: queensQuarters },
    dungeonSpur(3, cy),
    { x: 2, y: cy, sprite: 'o_sign', label: 'East Entrance', interact: true, promptText: 'leave via east door', blocking: false, autoTrigger: true, onTrigger: (e) => e.loadArea('overworld_north', ONA.castleEastExit) },

    // north (green) wing — Great Hall
    enemyNode(cx, cy - 5), eventNode(cx + 1, cy - 8),
    { x: cx - 2, y: cy - 6, sprite: 'b_generic_purple', label: 'Great Hall', interact: true, promptText: 'enter the Great Hall', blocking: true, onTrigger: greatHall },
    dungeonSpur(cx - 3, 3),
    lockedDoor(cx + 3, cy - 9, s => GameState.hasItem(s, 'key'), 'Locked.'),
    { x: cx + 4, y: cy - 10, sprite: 'npc_todd', label: 'Todd?!', interact: true, promptText: 'open door', blocking: true, onTrigger: toddCameo },
    { x: cx, y: 3, sprite: 'o_sign', label: 'North Entrance', interact: true, promptText: 'leave via north door', blocking: false, autoTrigger: true, onTrigger: (e) => e.loadArea('overworld_north', ONA.castleNorthExit) },

    // south (orange) wing — Courtyard (main entrance from Land of Difficulty)
    enemyNode(cx, cy + 5),
    { x: cx - 2, y: H - 6, sprite: 'npc_grace', label: 'Courtyard — Grace Rogers', interact: true, promptText: 'buy soup', blocking: true, onTrigger: courtyardSoup },
    dungeonSpur(cx, H - 9),
    { x: cx, y: H - 2, sprite: 'o_sign', label: 'South Entrance / To Land of Difficulty', interact: true, promptText: 'leave via south door', blocking: false, autoTrigger: true, onTrigger: (e) => e.loadArea('overworld_north', ONA.castleSouthExit) },

    // east (red) wing — King's side + long hallway
    enemyNode(cx + 8, cy),
    { x: cx + 6, y: cy - 8, sprite: 'i_scroll', label: 'A Long Hallway', interact: true, promptText: '(it really is a long hallway)', blocking: false, onTrigger: () => UI.say('It is, in fact, a very long hallway. You walk it. That\'s about it.') },
    lockedDoor(W - 13, cy - 4, s => GameState.hasItem(s, 'scrollKingsPassage') || s.flags.isKing || s.flags.isQueen, '"King\'s Passage required," the guard states flatly.'),
    { x: W - 6, y: cy - 5, sprite: 'npc_king', label: "King's Quarters", interact: true, promptText: 'enter', blocking: true, onTrigger: kingsQuarters },
    dungeonSpur(W - 4, cy),
  ];

  CastleAnchors.east = { x: 4, y: cy };
  CastleAnchors.hub = { x: cx, y: cy };
  Areas.castle = { map: gridToRows(grid), legend, entities, entryPoint: { x: cx, y: cy + 8 } };
})();
