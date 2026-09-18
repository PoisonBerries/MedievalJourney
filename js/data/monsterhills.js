// ============================================================================
// MONSTER HILLS — 10-node snowy mountain path, north of The Gate.
// ============================================================================
const MonsterHillsAnchors = {};

(function () {
  const { grid, centers, w, h } = buildNodeCorridor(10, { roomW: 6, roomH: 6, cols: 4 });
  // extra side room for the second rabbit hole ("space 4*") used as a
  // shortcut entrance from Riverbank / the Woods box of surprises.
  const extraW = w + 8;
  const grid2 = grid.map(r => [...r, ...new Array(8).fill('#')]);
  const portalX = w + 3, portalY = centers[0].y;
  fillRect(grid2, portalX - 2, portalY - 2, 5, 5, '.');
  carveRoad(grid2, centers[0].x, centers[0].y, portalX, portalY, '.');
  MonsterHillsAnchors.node4 = { x: portalX, y: portalY };

  const rows = gridToRows(grid2.map(r => r.map(c => (c === '#' ? '#' : '.'))));
  const legend = { '.': { tile: (tx, ty) => hashPick(tx, ty, ['t_snow0', 't_snow1', 't_snow2']) }, '#': { tile: 't_hillrock', solid: true } };

  function at(n) { return centers[n - 1]; }
  function node(n, opts) { return { x: at(n).x, y: at(n).y, ...opts }; }

  const entities = [];

  // 1 — baby dragons
  entities.push(node(1, {
    sprite: 'e_babydragon', label: 'Baby Dragons', interact: true, promptText: 'approach', blocking: true, autoTrigger: true, forceEncounter: true,
    onTrigger: async (engine, e) => {
      e._dead = true; const s = engine.state;
      const res = await Combat.start(s, group(Enemies.babyDragon, Enemies.babyDragon, Enemies.babyDragon));
      if (res.result === 'win') { GameState.addQ(s, 3); UI.notify('+3q for the successful hunt!'); }
    },
  }));

  // 2 — sleeping ogre
  entities.push(node(2, {
    sprite: 'e_ogre', label: 'Sleeping Ogre', interact: true, promptText: 'sneak closer', blocking: true, autoTrigger: true, forceEncounter: true,
    onTrigger: async (engine, e) => {
      e._dead = true; const s = engine.state;
      const roll = await UI.rollBanner(6);
      if (roll === 1) await UI.say('You sneak past without a sound.');
      else if (roll <= 3) { await UI.say("He hasn't eaten in a week and is much weaker. You wake him anyway."); await Combat.start(s, foe('Hungry Ogre', 'e_ogre', 5, 1, false)); }
      else if (roll <= 5) { await UI.say('You wake the ogre!'); await Combat.start(s, Enemies.ogreFull()); }
      else { await UI.say('The ogre, stuffed from a huge feast, readies to throw boulders — then pukes up 4 baby ogres and keels over!'); await Combat.start(s, group(Enemies.babyOgre, Enemies.babyOgre, Enemies.babyOgre, Enemies.babyOgre)); }
    },
  }));

  // 3 — giant
  entities.push(node(3, {
    sprite: 'e_giant', label: 'Hill Giant', interact: true, promptText: 'approach', blocking: true, autoTrigger: true, forceEncounter: true,
    onTrigger: async (engine, e) => {
      e._dead = true; const s = engine.state;
      if (s.armor.boots) { await UI.say('Your boots let you slip past the giant unnoticed.'); return; }
      const pay = await UI.choice('A 5/6 Hill Giant blocks the path. Pay 4q to pass, or fight?', [{ label: 'Pay 4q', value: 'pay' }, { label: 'Fight', value: 'fight' }]);
      if (pay === 'pay') { if (GameState.spendQ(s, 4)) await UI.say('The giant grunts and lets you through.'); else UI.notify('Not enough quickels!'); }
      else await Combat.start(s, Enemies.giant());
    },
  }));

  // 4 — rabbit hole (the "main" end; the portal room is the other end)
  entities.push(node(4, {
    sprite: 'o_rock', label: 'Rabbit Hole', interact: true, promptText: 'peer in', blocking: false,
    onTrigger: () => UI.say("A rabbit hole. You've already found where its other end comes out."),
  }));
  entities.push({ x: MonsterHillsAnchors.node4.x, y: MonsterHillsAnchors.node4.y, sprite: 'o_rock', label: 'Rabbit Hole', interact: true, promptText: 'jump in', blocking: false, autoTrigger: true,
    onTrigger: async (engine, e) => { await UI.say('You tumble through a rabbit hole and pop out further up the trail!'); engine.loadArea('monsterhills', at(4)); } });

  // 5 — Vegetable Lamb of Tartary
  entities.push(node(5, {
    sprite: 'e_vegetablelamb', label: 'Vegetable Lamb of Tartary', interact: true, promptText: 'approach', blocking: true, autoTrigger: true, forceEncounter: true,
    onTrigger: async (engine, e) => {
      e._dead = true; const s = engine.state;
      const res = await Combat.start(s, Enemies.vegetableLamb());
      if (res.result === 'win') {
        s.flags.beatVegetableLamb = true;
        await UI.say('Its umbilical cord contains not one, but two Notes of King\'s Passage. You take only one — why would you take two?');
        GameState.addItem(s, { ...ItemDefs.scrollKingsPassage });
      }
    },
  }));

  // 6 — stumble down hill
  entities.push(node(6, {
    sprite: 'o_rock', label: 'Steep Slope', interact: true, promptText: 'climb down', blocking: false, autoTrigger: true,
    onTrigger: async (engine, e) => {
      e._dead = true; const s = engine.state;
      const roll = await UI.rollBanner(6);
      if (roll === 1) { GameState.spendQ(s, Math.min(s.q, 1)); await UI.say('You stumble and 1q falls out of your pocket, lost forever.'); }
      else if (roll === 2) { s.companions.push({ id: 'pig', name: 'Pig', dmg: 1, range: false }); GameState.addItem(s, { ...ItemDefs.pig }); await UI.say('You find a 1/1 pig! It likes you, and will even take the occasional bite out of foes. (can be eaten for 3 life anytime)'); }
      else if (roll === 3) { const w2 = GameState.loseRandomWeapon(s); await UI.say(`You lose ${w2 ? w2.name : 'nothing'} in the fall.`); }
      else if (roll === 4) { GameState.addLife(s, -2); await UI.say('You land on a very sharp object that cannot be specified. -2 life.'); }
      else await UI.say('You fell down a hill. That about covers it.');
    },
  }));

  // 7 — Centicore
  entities.push(node(7, {
    sprite: 'e_centicore', label: 'Centicore', interact: true, promptText: 'approach', blocking: true, autoTrigger: true, forceEncounter: true,
    onTrigger: async (engine, e) => {
      e._dead = true; const s = engine.state;
      const res = await Combat.start(s, Enemies.centicore());
      if (res.result === 'win' && rng.d6() === 1) { s.companions.push({ id: 'chicken', name: 'Ranged Chicken' }); GameState.addWeapon(s, { id: 'companion-chicken', name: 'Chicken (2 dmg, ranged)', dmg: 2, range: true }); UI.notify('You cut it open and find a 2/1 ranged chicken companion!'); }
    },
  }));

  // 8 — Mama dragon
  entities.push(node(8, {
    sprite: 'e_mamadragon', label: 'Mama Dragon', interact: true, promptText: 'approach', blocking: true, autoTrigger: true, forceEncounter: true,
    onTrigger: async (engine, e) => {
      e._dead = true; const s = engine.state;
      const res = await Combat.start(s, Enemies.mamaDragon());
      if (res.result === 'win' && !s.flags.queenScrollTaken) { s.flags.queenScrollTaken = true; GameState.addItem(s, { ...ItemDefs.scrollQueensPassage }); UI.notify("You take the Queen's Note of Passage from the scroll in her claws."); }
    },
  }));

  // 9 — frozen corpses (atmosphere)
  entities.push(node(9, {
    sprite: 'e_ghost', label: 'A Grim Sight', interact: true, promptText: 'look closer', blocking: false, autoTrigger: true,
    onTrigger: async (engine, e) => {
      e._dead = true; const s = engine.state;
      await UI.say('The hills turn snowy. You see the frozen bodies of other hopeful adventurers, not too different from yourself.');
      GameState.addQ(s, 1);
      await UI.say('You find 1q clutched in a frozen hand. You take it, and try not to think about it.');
    },
  }));

  // 10 — Snow dragon
  entities.push(node(10, {
    sprite: 'e_snowdragon', label: 'Snow Dragon', interact: true, promptText: 'sneak toward the scroll', blocking: true, autoTrigger: true, forceEncounter: true,
    onTrigger: async (engine, e) => {
      e._dead = true; const s = engine.state;
      const roll = await UI.rollBanner(6);
      if (roll === 1) { await UI.stun(4000, 'You step on a corpse — a loud crack echoes! You freeze in place for a long while.'); }
      else if (roll === 2) { await UI.say('She wakes, furious, and sends a pack of snow monsters after you!'); await Combat.start(s, foe('Snow Monster Pack', 'e_snowmonster', 1, 7, false)); }
      else if (roll <= 4) { await UI.say('You successfully retrieve the scroll and run away!'); GameState.addItem(s, { ...ItemDefs.scrollQueensPassage }); }
      else if (roll === 5) { await UI.say('She catches you fleeing — you drop the scroll and it rolls off down the trail.'); }
      else { await UI.say('No sneaking past this one — you must fight her.'); const res = await Combat.start(s, Enemies.snowDragon()); if (res.result === 'win') GameState.addItem(s, { ...ItemDefs.scrollQueensPassage }); }
    },
  }));

  entities.push({ x: at(1).x - 2, y: at(1).y, sprite: 'o_sign', label: 'To the Hills Path', interact: true, promptText: 'leave the hills', blocking: false, autoTrigger: true,
    onTrigger: (engine) => engine.loadArea('overworld_north', { x: ONA.monsterHills.x, y: ONA.monsterHills.y + 2 }) });

  Areas.monsterhills = { map: rows, legend, entities, entryPoint: at(1) };
})();
