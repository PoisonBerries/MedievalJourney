// ============================================================================
// MAIN.JS — bootstrap: title screen, save/continue, HUD, engine wiring.
// ============================================================================
(function () {
  initSprites();

  const canvas = document.getElementById('game-canvas');
  const titleScreen = document.getElementById('title-screen');
  const deathScreen = document.getElementById('death-screen');
  const continueBtn = document.getElementById('continue-btn');
  const lifeFill = document.getElementById('life-fill');
  const lifeNum = document.getElementById('life-num');
  const qNum = document.getElementById('q-num');
  const areaName = document.getElementById('area-name');
  const invBtn = document.getElementById('inv-btn');

  let engine = null;

  function areaLabel(id) {
    if (Areas[id] && Areas[id].townName) return Areas[id].townName;
    const names = { overworld_south: 'The Kingdom Road', overworld_north: 'The Wild North', thegate: 'The Gate', woods: 'The Woods', monsterhills: 'Monster Hills', merlin: "Merlin's Hideout", castle: 'The Castle', dungeon_temp: 'The Dungeons' };
    return names[id] || id;
  }

  function refreshHud() {
    if (!engine) return;
    const s = engine.state;
    lifeFill.style.width = Math.max(0, 100 * s.life / s.maxLife) + '%';
    lifeNum.textContent = `${s.life}/${s.maxLife}`;
    qNum.textContent = s.q + 'q';
    areaName.textContent = areaLabel(s.position.area);
  }

  function startGame(state) {
    engine = new GameEngine(canvas, state);
    UI.bind(engine);
    engine.loadArea(state.position.area || 'happytown', state.position);
    engine.start();
    titleScreen.classList.add('hidden');
    deathScreen.classList.add('hidden');
    setInterval(() => GameState.save(engine.state), 4000);
    Events.on('player-died', () => {
      engine.blocked = true;
      deathScreen.classList.remove('hidden');
    });
    requestAnimationFrame(function tick() {
      refreshHud();
      requestAnimationFrame(tick);
    });
  }

  document.getElementById('new-game-btn').onclick = () => {
    GameState.clear();
    startGame(GameState.new());
  };
  document.getElementById('restart-btn').onclick = () => {
    GameState.clear();
    location.reload();
  };
  const existing = GameState.load();
  if (existing) continueBtn.style.display = 'inline-block'; else continueBtn.style.display = 'none';
  continueBtn.onclick = () => {
    const s = GameState.load() || GameState.new();
    startGame(s);
  };

  invBtn.onclick = () => { if (engine) UI.openInventory(engine.state); };
  Events.on('toggle-inventory', () => { if (engine) UI.openInventory(engine.state); });
  Events.on('escape-key', () => { /* reserved */ });

  window.addEventListener('beforeunload', () => { if (engine) GameState.save(engine.state); });
})();
