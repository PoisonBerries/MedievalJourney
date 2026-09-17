// ============================================================================
// UI.JS — DOM overlay: dialogue, shops, inventory, toasts, combat.
// Written as async helpers (await UI.say(...)) so the region scripts in
// js/data/*.js can read almost like the original paper script.
// ============================================================================
const UI = (() => {
  let engineRef = null;
  function bind(engine) { engineRef = engine; }
  function lock() { if (engineRef) engineRef.blocked = true; }
  function unlock() { if (engineRef) engineRef.blocked = false; }

  const root = document.getElementById('ui-root');

  function el(tag, cls, html) {
    const e = document.createElement('div');
    e.className = cls || '';
    if (html !== undefined) e.innerHTML = html;
    if (tag !== 'div') { const r = document.createElement(tag); r.className = cls || ''; if (html !== undefined) r.innerHTML = html; return r; }
    return e;
  }

  function clearOverlay(node) { node.remove(); }

  // ---- toast --------------------------------------------------------
  function notify(text, life = 2200) {
    const t = el('div', 'toast', text);
    root.appendChild(t);
    requestAnimationFrame(() => t.classList.add('show'));
    setTimeout(() => { t.classList.remove('show'); setTimeout(() => t.remove(), 300); }, life);
  }

  // ---- dialogue -------------------------------------------------------
  function say(text, opts = {}) {
    lock();
    return new Promise(resolve => {
      const box = el('div', 'dialogue-box');
      box.innerHTML = `
        ${opts.speaker ? `<div class="speaker">${opts.speaker}</div>` : ''}
        <div class="dtext"></div>
        <div class="continue">▼ press E / click</div>`;
      root.appendChild(box);
      const dtext = box.querySelector('.dtext');
      let i = 0;
      const full = text;
      dtext.textContent = '';
      const typer = setInterval(() => {
        dtext.textContent = full.slice(0, i++);
        if (i > full.length) clearInterval(typer);
      }, 12);
      function finish() {
        clearInterval(typer);
        dtext.textContent = full;
        window.removeEventListener('keydown', onKey);
        box.removeEventListener('click', onClick);
        box.remove();
        unlock();
        resolve();
      }
      function onKey(e) { if (['e', ' ', 'enter', 'f'].includes(e.key.toLowerCase())) finish(); }
      function onClick() { finish(); }
      window.addEventListener('keydown', onKey);
      box.addEventListener('click', onClick);
    });
  }

  function choice(text, options) {
    lock();
    return new Promise(resolve => {
      const box = el('div', 'dialogue-box choice-box');
      box.innerHTML = `<div class="dtext">${text}</div><div class="choices"></div>`;
      const cont = box.querySelector('.choices');
      options.forEach(opt => {
        const b = document.createElement('button');
        b.className = 'choice-btn';
        b.textContent = opt.label;
        b.onclick = () => { box.remove(); unlock(); resolve(opt.value); };
        cont.appendChild(b);
      });
      root.appendChild(box);
    });
  }

  function rollBanner(sides = 6) {
    lock();
    return new Promise(resolve => {
      const box = el('div', 'roll-box');
      box.innerHTML = `<div class="die">?</div><div class="rolltext">rolling...</div>`;
      root.appendChild(box);
      const die = box.querySelector('.die');
      let n = 0;
      const spin = setInterval(() => { die.textContent = rng.int(1, sides); }, 60);
      setTimeout(() => {
        clearInterval(spin);
        const result = rng.int(1, sides);
        die.textContent = result;
        box.querySelector('.rolltext').textContent = `you rolled a ${result}!`;
        setTimeout(() => { box.remove(); unlock(); resolve(result); }, 700);
      }, 650);
    });
  }

  // ---- shop -----------------------------------------------------------
  function openShop(shop, state) {
    lock();
    return new Promise(resolve => {
      const box = el('div', 'modal shop-modal');
      const render = () => {
        box.innerHTML = `
          <div class="modal-head">${shop.name}<span class="qtag">${state.q} q</span></div>
          ${shop.intro ? `<div class="shop-intro">${shop.intro}</div>` : ''}
          <div class="shop-list"></div>
          <button class="close-btn">Leave</button>`;
        const list = box.querySelector('.shop-list');
        shop.items.forEach(item => {
          const row = document.createElement('div');
          row.className = 'shop-row';
          row.innerHTML = `<img src="${item.icon ? Sprites[item.icon]?.toDataURL() : ''}"/>
            <div class="shop-item-info"><b>${item.name}</b><br><span class="desc">${item.desc || ''}</span></div>
            <button class="buy-btn">${item.cost} q</button>`;
          row.querySelector('.buy-btn').onclick = () => {
            if (!GameState.canAfford(state, item.cost)) { notify("Not enough quickels!"); return; }
            if (item.canBuy && !item.canBuy(state)) { notify(item.blockedMsg || "Can't buy that right now."); return; }
            GameState.spendQ(state, item.cost);
            item.onBuy(state);
            notify(`Bought ${item.name}!`);
            render();
          };
          list.appendChild(row);
        });
        box.querySelector('.close-btn').onclick = () => { box.remove(); unlock(); resolve(); };
      };
      render();
      root.appendChild(box);
    });
  }

  // ---- inventory --------------------------------------------------------
  function openInventory(state) {
    lock();
    return new Promise(resolve => {
      const box = el('div', 'modal inv-modal');
      const armorList = Object.entries(state.armor).filter(([, v]) => v).map(([slot, v]) => `${slot}: ${v.name}`).join('<br>') || 'none';
      const arrows = Object.entries(state.arrows).filter(([, n]) => n > 0).map(([k, n]) => `${k} x${n}`).join(', ') || 'none';
      box.innerHTML = `
        <div class="modal-head">Inventory <span class="qtag">${state.q} q</span></div>
        <div class="inv-section"><b>Life:</b> ${state.life}/${state.maxLife}</div>
        <div class="inv-section"><b>Weapons</b><br>${state.weapons.map(w => `${w.id === state.equippedWeapon ? '➤ ' : ''}${w.name} (${w.dmg}dmg, ${w.range ? 'ranged' : 'melee'})`).join('<br>') || 'none'}</div>
        <div class="inv-section"><b>Armor</b><br>${armorList}</div>
        <div class="inv-section"><b>Arrows</b><br>${arrows}</div>
        <div class="inv-section"><b>Items</b><br>${state.items.map(i => `${i.name} x${i.qty}`).join('<br>') || 'none'}</div>
        <div class="inv-section"><b>Companions</b><br>${state.companions.map(c => c.name).join(', ') || 'none'}</div>
        <div class="inv-section"><b>Path:</b> ${state.flags.path || 'undecided'}</div>
        <div class="weapon-switch"></div>
        <button class="close-btn">Close</button>`;
      const sw = box.querySelector('.weapon-switch');
      state.weapons.forEach(w => {
        const b = document.createElement('button');
        b.className = 'choice-btn small';
        b.textContent = 'Equip ' + w.name;
        b.onclick = () => { state.equippedWeapon = w.id; notify('Equipped ' + w.name); box.remove(); unlock(); resolve(); openInventory(state); };
        sw.appendChild(b);
      });
      box.querySelector('.close-btn').onclick = () => { box.remove(); unlock(); resolve(); };
      root.appendChild(box);
    });
  }

  function stun(ms, msg) {
    lock();
    if (msg) notify(msg, Math.min(ms, 2500));
    return new Promise(resolve => setTimeout(() => { unlock(); resolve(); }, ms));
  }

  return { bind, notify, say, choice, rollBanner, openShop, openInventory, lock, unlock, stun };
})();
