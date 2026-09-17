// ============================================================================
// COMBAT.JS — interactive turn-based combat.
// Core rule from the original notes: "non-range beats range, range beats
// non-range, range=range, non-range=non-range" -> whichever combatant's
// weapon TYPE differs from their opponent's this round lands a bonus hit
// (they caught them wrong-footed). Defending cancels the mismatch bonus
// against you and halves damage taken.
// ============================================================================
const FISTS = { id: 'fists', name: 'Bare Fists', dmg: 1, range: false };

const Combat = (() => {
  const root = document.getElementById('ui-root');

  function cloneEnemy(def) {
    return JSON.parse(JSON.stringify(def, (k, v) => (typeof v === 'function' ? undefined : v)));
  }

  function start(state, enemyDefRaw) {
    UI.lock();
    return new Promise(resolve => {
      const enemyDef = enemyDefRaw; // keep functions (onDefeat etc.), track hp separately
      const foes = (enemyDef.group || [enemyDef]).map(f => ({ ...f, hp: f.hp, maxHp: f.hp }));
      const log = [];
      let fled = false;

      if (state.flags.queenOpeningStrike) {
        let remaining = 7;
        const alive = foes.filter(f => f.hp > 0);
        while (remaining > 0 && alive.some(f => f.hp > 0)) {
          const t = alive.find(f => f.hp > 0);
          t.hp -= 1; remaining -= 1;
        }
        log.unshift('Your enchanted bow strikes for 7 divisible damage before the fight even begins!');
      }

      const box = document.createElement('div');
      box.className = 'modal combat-modal';
      root.appendChild(box);

      function pushLog(t) { log.unshift(t); if (log.length > 5) log.pop(); render(); }

      function weaponOptions() {
        return state.weapons.length ? state.weapons.slice() : [FISTS];
      }

      function playerAttack(weapon) {
        if (weapon.needsArrows) {
          const stock = state.arrows.basic || 0;
          if (stock <= 0) { pushLog('No arrows left! Buy more in Rich Village.'); return; }
          state.arrows.basic -= 1;
        }
        const target = foes.find(f => f.hp > 0);
        if (!target) return;
        let dmg = weapon.dmg + (state._strengthBuff || 0);
        state._strengthBuff = 0;
        const mismatch = weapon.dual || (!!weapon.range !== !!target.range);
        if (mismatch) dmg += Math.ceil(weapon.dmg * 0.5);
        if (weapon.needsArrows && state.weapons.some(w => w.id === 'crossbow')) dmg += Weapons.crossbow.arrowBonus;
        dmg = Math.max(0, dmg);
        target.hp -= dmg;
        pushLog(`You hit ${target.name} with ${weapon.name} for ${dmg}${mismatch ? ' (+ambush!)' : ''}.`);
        if (target.hp <= 0) {
          pushLog(`${target.name} is defeated!`);
          if (target.onDeathDamage) { GameState.addLife(state, -target.onDeathDamage); pushLog(`${target.name} got you for ${target.onDeathDamage} as they fell!`); }
        }
      }

      function armorReduction(range) {
        let r = 0;
        const helm = state.armor.helmet, chest = state.armor.chest;
        if (range && helm) r += helm.rangedReduction || 0;
        if (!range && chest) r += chest.meleeReduction || 0;
        if (chest) r += chest.anyReduction || 0;
        return r;
      }

      function enemyActTurn(playerDefending, playerWeapon) {
        if (state._evadeBuff) { pushLog('You vanish in smoke — no damage taken this round!'); state._evadeBuff = false; return; }
        for (const f of foes) {
          if (f.hp <= 0) continue;
          if (f.fleesFromPig && state.companions.some(c => c.id === 'pig')) { pushLog(`${f.name} flees at the sight of your pig!`); continue; }
          let dmg = f.dmg;
          const mismatch = playerWeapon.dual || (!!f.range !== !!playerWeapon.range);
          if (mismatch && !playerDefending) dmg += Math.ceil(f.dmg * 0.5);
          if (playerDefending) { dmg = Math.floor(dmg / 2); dmg -= (playerWeapon.blockBonus || 0); }
          dmg -= (playerWeapon.damageReduction || 0);
          dmg -= armorReduction(f.range);
          dmg = Math.max(0, dmg);
          GameState.addLife(state, -dmg);
          pushLog(`${f.name} hits you for ${dmg}${mismatch && !playerDefending ? ' (+ambush!)' : ''}${playerDefending ? ' (blocked)' : ''}.`);
        }
      }

      function checkEnd() {
        if (state.life <= 0) { finish('lose'); return true; }
        if (foes.every(f => f.hp <= 0)) { finish('win'); return true; }
        return false;
      }

      function finish(result) {
        box.remove();
        UI.unlock();
        if (result === 'win' && enemyDef.onDefeat) enemyDef.onDefeat(state);
        resolve({ result });
      }

      function render() {
        const weapon = state.weapons.find(w => w.id === state.equippedWeapon) || state.weapons[0] || FISTS;
        box.innerHTML = `
          <div class="modal-head">Battle!</div>
          <div class="combat-foes">
            ${foes.map(f => `<div class="foe ${f.hp <= 0 ? 'dead' : ''}">
                <img src="${Sprites[f.sprite]?.toDataURL() || ''}"/>
                <div class="foename">${f.name}</div>
                <div class="hpbar"><div class="hpfill" style="width:${Math.max(0, 100 * f.hp / f.maxHp)}%"></div></div>
                <div class="hptext">${Math.max(0, f.hp)}/${f.maxHp} ${f.range ? '(ranged)' : '(melee)'}</div>
              </div>`).join('')}
          </div>
          <div class="player-status">
            <div class="hpbar big"><div class="hpfill" style="width:${100 * state.life / state.maxLife}%"></div></div>
            <div class="hptext">You: ${state.life}/${state.maxLife} — wielding ${weapon.name} ${weapon.range ? '(ranged)' : '(melee)'}</div>
          </div>
          <div class="combat-log">${log.map(l => `<div>${l}</div>`).join('')}</div>
          <div class="combat-actions">
            <div class="weapon-row"></div>
            <div class="action-row">
              <button class="cbtn atk">Attack</button>
              <button class="cbtn def">Defend</button>
              <button class="cbtn item">Item</button>
              <button class="cbtn flee" ${enemyDef.canFlee === false ? 'disabled title="cannot flee"' : ''}>Flee</button>
            </div>
          </div>`;
        const wrow = box.querySelector('.weapon-row');
        weaponOptions().forEach(w => {
          const b = document.createElement('button');
          b.className = 'choice-btn small' + (w.id === state.equippedWeapon ? ' active' : '');
          b.textContent = w.name + (w.range ? ' (ranged)' : ' (melee)');
          b.onclick = () => { state.equippedWeapon = w.id; render(); };
          wrow.appendChild(b);
        });
        box.querySelector('.atk').onclick = () => {
          const w = state.weapons.find(w => w.id === state.equippedWeapon) || state.weapons[0] || FISTS;
          playerAttack(w);
          if (checkEnd()) return;
          enemyActTurn(false, w);
          checkEnd();
        };
        box.querySelector('.def').onclick = () => {
          const w = state.weapons.find(w => w.id === state.equippedWeapon) || state.weapons[0] || FISTS;
          pushLog('You brace to defend.');
          enemyActTurn(true, w);
          checkEnd();
        };
        box.querySelector('.item').onclick = () => openItemMenu();
        box.querySelector('.flee').onclick = () => {
          if (enemyDef.canFlee === false) { pushLog("You can't flee this fight!"); return; }
          if (rng.int(1, 6) >= 3) { finish('flee'); }
          else { pushLog('Failed to flee!'); const w = state.weapons.find(w => w.id === state.equippedWeapon) || state.weapons[0] || FISTS; enemyActTurn(false, w); checkEnd(); }
        };
      }

      function openItemMenu() {
        const usable = state.items.filter(i => i.combatUse);
        if (!usable.length) { pushLog('No usable items.'); return; }
        const menu = document.createElement('div');
        menu.className = 'item-menu';
        menu.innerHTML = usable.map((i, idx) => `<button class="choice-btn small" data-idx="${idx}">${i.name} x${i.qty}</button>`).join('') + `<button class="choice-btn small cancel">Cancel</button>`;
        box.appendChild(menu);
        menu.querySelectorAll('button[data-idx]').forEach(btn => {
          btn.onclick = () => {
            const item = usable[+btn.dataset.idx];
            item.combatUse(state, { pushLog, foes });
            GameState.removeItem(state, item.id, 1);
            menu.remove();
            if (!checkEnd()) render();
          };
        });
        menu.querySelector('.cancel').onclick = () => menu.remove();
      }

      render();
    });
  }

  return { start };
})();
