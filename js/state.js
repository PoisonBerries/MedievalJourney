// ============================================================================
// STATE.JS — player save data & helpers. Names/units match the original
// paper rules: "life" (health) and "q" (quickels, the currency).
// ============================================================================
const GameState = {
  new() {
    return {
      life: 25,
      maxLife: 25,
      q: 3,
      weapons: [{ id: 'butterknife', name: 'Butter Knife', dmg: 1, range: false }],
      equippedWeapon: 'butterknife',
      armor: { helmet: null, chest: null, boots: null },
      items: [], // potions, scrolls, keys, misc {id,name,qty,...}
      companions: [], // {id,name,dmg,range,hp?}
      flags: {},      // arbitrary story flags (hasBoat, hasHorse, path, etc.)
      arrows: {},     // {basic: n, flame: n, triple: n, stun: n}
      position: { area: 'happytown', x: 11, y: 9 },
      statusEffects: [], // {type:'love'|'stuck'|'frozen', turns:n, data}
      visited: {},
      log: [],
    };
  },

  save(state) {
    try { localStorage.setItem('medievalJourneySave', JSON.stringify(state)); } catch (e) {}
  },
  load() {
    try {
      const raw = localStorage.getItem('medievalJourneySave');
      return raw ? JSON.parse(raw) : null;
    } catch (e) { return null; }
  },
  clear() { try { localStorage.removeItem('medievalJourneySave'); } catch (e) {} },

  addLife(state, n) {
    state.life = Math.max(0, Math.min(state.maxLife, state.life + n));
    if (state.life <= 0) Events.emit('player-died');
  },
  addQ(state, n) { state.q = Math.max(0, state.q + n); },
  canAfford(state, n) { return state.q >= n; },
  spendQ(state, n) { if (!this.canAfford(state, n)) return false; state.q -= n; return true; },

  addItem(state, item) {
    const existing = state.items.find(i => i.id === item.id);
    if (existing) existing.qty = (existing.qty || 1) + (item.qty || 1);
    else state.items.push(Object.assign({ qty: 1 }, item));
  },
  removeItem(state, id, qty = 1) {
    const i = state.items.find(x => x.id === id);
    if (!i) return false;
    i.qty -= qty;
    if (i.qty <= 0) state.items = state.items.filter(x => x.id !== id);
    return true;
  },
  hasItem(state, id) { return state.items.some(i => i.id === id && i.qty > 0); },

  addWeapon(state, w) {
    if (!state.weapons.find(x => x.id === w.id)) state.weapons.push(w);
  },
  loseRandomWeapon(state) {
    const losable = state.weapons.filter(w => w.id !== 'excalibur');
    if (!losable.length) return null;
    const w = rng.pick(losable);
    state.weapons = state.weapons.filter(x => x.id !== w.id);
    if (state.equippedWeapon === w.id) state.equippedWeapon = state.weapons[0]?.id || null;
    return w;
  },

  addArrows(state, kind, n) { state.arrows[kind] = (state.arrows[kind] || 0) + n; },

  setPath(state, path) {
    if (state.flags.path && state.flags.path !== path) return false; // can't switch
    state.flags.path = path;
    return true;
  },

  log(state, msg) {
    state.log.push(msg);
    Events.emit('log', msg);
  },
};

// tiny pub/sub used across UI/engine
const Events = (() => {
  const handlers = {};
  return {
    on(evt, fn) { (handlers[evt] = handlers[evt] || []).push(fn); },
    emit(evt, data) { (handlers[evt] || []).forEach(fn => fn(data)); },
  };
})();
