// ============================================================================
// THE GATE — mandatory checkpoint between the southern lands and the
// wild north (Monster Hills, Merlin, the Land of Difficulty, the Castle).
// ============================================================================
(function () {
  const W = 16, H = 14;
  const grid = blankGrid(W, H, 's');
  frameRect(grid, 0, 0, W, H, '#');
  fillRect(grid, 6, 0, 4, 3, '#'); // gatehouse towers flavor

  const legend = { 's': { tile: 't_stonepath' }, '#': { tile: 'o_castlewall', solid: true } };

  async function gateEncounter(engine) {
    const s = engine.state;
    if (s.flags.gatePassed) { await UI.say('The guards recognize you and wave you through.', { speaker: 'Guard' }); engine.loadArea('overworld_north', ONA.gateReturn); return; }
    const mode = await UI.choice('The gate is heavily guarded. What do you do?', [{ label: 'Fight the guards', value: 'fight' }, { label: 'Sneak around', value: 'sneak' }, { label: 'Turn back', value: 'back' }]);
    if (mode === 'back') return;
    if (mode === 'fight') {
      const roll = await UI.rollBanner(6);
      let res;
      if (roll <= 2) res = await Combat.start(s, foe('Gate Guards (10 strong)', 'e_soldier', 1, 10, false));
      else if (roll === 3) res = await Combat.start(s, Enemies.guardFred());
      else if (roll === 4) res = await Combat.start(s, group(Enemies.guardArcher, Enemies.guardArcher, Enemies.guardArcher));
      else if (roll === 5) res = await Combat.start(s, Enemies.titus());
      else {
        const pay = await UI.choice('"Pay 5q and we\'ll let you through," say Eddie & Betsy the goblins.', [{ label: 'Pay 5q', value: 'pay' }, { label: 'Refuse — fight their 500 goblins', value: 'fight' }]);
        if (pay === 'pay') { if (GameState.spendQ(s, 5)) { s.flags.gatePassed = true; await UI.say('They step aside, pockets jingling.'); engine.loadArea('overworld_north', ONA.gateReturn); return; } else { UI.notify('Not enough quickels!'); return; } }
        res = await Combat.start(s, Enemies.goblinSwarm());
        if (res.result !== 'win') { await UI.say('The goblin swarm overwhelms you — you wake up back in Happy Town.'); engine.loadArea('happytown', Areas.happytown.entryPoint); return; }
      }
      if (res.result === 'win') { s.flags.gatePassed = true; await UI.say('The way north is clear!'); engine.loadArea('overworld_north', ONA.gateReturn); }
      else if (res.result === 'lose') { await UI.say('You are beaten back. You wake up in Happy Town, bruised.'); engine.loadArea('happytown', Areas.happytown.entryPoint); }
    } else {
      const roll = await UI.rollBanner(6);
      if (roll === 1 || roll === 5) { await UI.say('Sneaking wide around the wall, you accidentally wander straight into the Monster Hills!'); engine.loadArea('monsterhills', Areas.monsterhills.entryPoint); }
      else if (roll === 2 || roll === 3) { await UI.say('You slip past the gate completely unseen!'); s.flags.gatePassed = true; engine.loadArea('overworld_north', ONA.gateReturn); }
      else if (roll === 4) {
        if (s.armor.boots) { await UI.say('Caught! ...but your boots let you slip free before they lock you up. Lucky.'); return; }
        await UI.say('Caught by the guards! You\'re thrown in the dungeons.');
        Dungeons.enter(engine, () => engine.loadArea('thegate', { x: 8, y: 10 }));
      }
      else await UI.say("You can't find a way around, and give up for now.");
    }
  }

  const entities = [
    { x: 8, y: 4, sprite: 'npc_guard', label: 'The Gate', interact: true, promptText: 'approach the gate', blocking: true, onTrigger: gateEncounter },
    { x: 8, y: H - 2, sprite: 'o_sign', label: 'To Overworld', interact: true, promptText: 'go back south', blocking: false, autoTrigger: true,
      onTrigger: (engine) => engine.loadArea('overworld_south', { x: OSA.gate.x, y: OSA.gate.y + 2 }) },
  ];

  Areas.thegate = { map: gridToRows(grid), legend, entities, entryPoint: { x: 8, y: 10 } };
})();
