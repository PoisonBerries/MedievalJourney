// ============================================================================
// RANDOM TAVERN — Gamble & Have a Drink.
// ============================================================================
(function () {
  const W = 16, H = 14;
  const grid = blankGrid(W, H, 't');
  frameRect(grid, 0, 0, W, H, '#');
  fillRect(grid, 1, 1, W - 2, H - 2, 't');

  const legend = { 't': { tile: 't_wood' }, '#': { tile: 't_stonefloor', solid: true } };

  async function gamble(engine) {
    const s = engine.state;
    const tiers = [
      { cost: 1, label: 'Wager 1q' }, { cost: 3, label: 'Wager 3q' },
      { cost: 5, label: 'Wager 5q' }, { cost: 10, label: 'Wager 10q' },
    ];
    await UI.say('"Step right up, place a bet, roll the bones!" — the dealer', { speaker: 'Dealer' });
    const cost = await UI.choice('How much do you wager?', [...tiers.map(t => ({ label: t.label, value: t.cost })), { label: 'Walk away', value: 0 }]);
    if (!cost) return;
    if (!GameState.canAfford(s, cost)) { UI.notify('Not enough quickels!'); return; }
    GameState.spendQ(s, cost);
    const roll = await UI.rollBanner(6);
    let win = 0;
    if (cost === 1) win = roll <= 4 ? 2 : 0;
    if (cost === 3) win = roll <= 3 ? 6 : 0;
    if (cost === 5) win = roll <= 2 ? 10 : (roll === 3 ? 4 : 0);
    if (cost === 10) win = roll === 1 ? 20 : (roll === 2 ? 10 : (roll <= 5 ? 5 : 0));
    if (win > 0) { GameState.addQ(s, win); await UI.say(`You win ${win}q!`); }
    else await UI.say('You lose your wager. House always wins.');
  }

  async function haveADrink(engine) {
    const s = engine.state;
    await UI.say('You bellow up to the bar and order a drink...', { speaker: 'Bartender' });
    const roll = await UI.rollBanner(6);
    if (roll === 1) { GameState.addLife(s, 1); await UI.say('A hearty ale. +1 life.'); }
    else if (roll === 2) { GameState.addQ(s, 3); await UI.say('You get pulled into a dancing gig! +3q in tips.'); }
    else if (roll === 3) { await UI.say("You're too drunk. You wake up in Happy Town."); engine.loadArea('happytown', Areas.happytown.entryPoint); }
    else if (roll === 4) { GameState.addLife(s, -1); await UI.say('You get in a brawl. -1 life.'); }
    else if (roll === 5) { const w = GameState.loseRandomWeapon(s); await UI.say(`Super drunk! You lose ${w ? w.name : 'nothing (you had nothing to lose)'}.`); }
    else { await UI.say('Good times at the tavern. Nothing else happens, but it was fun.'); }
  }

  const entities = [
    { x: 5, y: 5, sprite: 'npc_larry', label: 'Gamble', interact: true, promptText: 'gamble', blocking: true, onTrigger: gamble },
    { x: 10, y: 5, sprite: 'npc_bartender', label: 'Have a Drink', interact: true, promptText: 'order a drink', blocking: true, onTrigger: haveADrink },
    { x: W - 3, y: H - 3, sprite: 'o_sign', label: 'To Overworld', interact: true, promptText: 'leave', blocking: false, autoTrigger: true,
      onTrigger: (engine) => engine.loadArea('overworld_south', { x: OSA.randomTavern.x, y: OSA.randomTavern.y + 2 }) },
  ];

  Areas.randomtavern = { map: gridToRows(grid), legend, entities, townName: 'Random Tavern', entryArea: 'randomtavern', entryPoint: { x: 8, y: 8 } };
})();
