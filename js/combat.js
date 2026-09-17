// ============================================================================
// COMBAT.JS — interactive turn-based combat.
// Core rule from the original notes: "non-range beats range, range beats
// non-range, range=range, non-range=non-range" -> whichever combatant's
// weapon TYPE differs from their opponent's this round lands a bonus hit
// (they caught them wrong-footed). Defending cancels the mismatch bonus
// against you and halves damage taken.
//
// Companions with a `dmg` stat (e.g. Sir Macintosh) fight alongside you
// every round. Sir Gus the Sacrificer instead absorbs a whole round of
// incoming damage per remaining charge. Target which foe to hit by
// clicking its card. Damage has a small +/-15% swing so fights don't feel
// perfectly deterministic. Winning rolls loot (mostly quickels, sometimes
// an item) when the enemy carries a lootTable.
// ============================================================================
const FISTS = { id: 'fists', name: 'Bare Fists', dmg: 1, range: false };

function withVariance(n) {
  if (n <= 0) return 0;
  return Math.max(1, Math.round(n * (0.85 + Math.random() * 0.3)));
}

function rollLoot(state, table) {
  const lines = [];
  if (!table) return lines;
  if (table.q) {
    const amt = rng.int(table.q[0], table.q[1]);
    if (amt > 0) { GameState.addQ(state, amt); lines.push(`+${amt}q`); }
  }
  if (table.items && table.itemChance && Math.random() < table.itemChance) {
    const item = rng.pick(table.items);
    GameState.addItem(state, { ...item });
    lines.push(`Found: ${item.name}`);
  }
  return lines;
}

const Combat = (() => {
  const root = document.getElementById('ui-root');

  function start(state, enemyDefRaw) {
    UI.lock();
    return new Promise(resolve => {
      const enemyDef = enemyDefRaw;
      const foes = (enemyDef.group || [enemyDef]).map(f => ({ ...f, hp: f.hp, maxHp: f.hp }));
      const log = [];
      let targetIdx = 0;
      let ended = false;

      const box = document.createElement('div');
      box.className = 'modal combat-modal';
      root.appendChild(box);

      if (state.flags.queenOpeningStrike) {
        let remaining = 7;
        while (remaining > 0 && foes.some(f => f.hp > 0)) {
          const t = foes.find(f => f.hp > 0);
          t.hp -= 1; remaining -= 1;
        }
        log.unshift('Your enchanted bow strikes for 7 divisible damage before the fight even begins!');
      }

      function pushLog(t) { log.unshift(t); if (log.length > 6) log.pop(); }
      function shake() { box.classList.add('shake'); setTimeout(() => box.classList.remove('shake'), 220); }

      function currentTarget() {
        const t = foes[targetIdx];
        if (t && t.hp > 0) return t;
        return foes.find(f => f.hp > 0);
      }

      function weaponOptions() {
        return state.weapons.length ? state.weapons.slice() : [FISTS];
      }
      function equippedWeapon() {
        return state.weapons.find(w => w.id === state.equippedWeapon) || state.weapons[0] || FISTS;
      }

      function playerAttack(weapon) {
        if (weapon.needsArrows) {
          const stock = state.arrows.basic || 0;
          if (stock <= 0) { pushLog('No arrows left! Buy more in Rich Village.'); render(); return; }
          state.arrows.basic -= 1;
        }
        const target = currentTarget();
        if (!target) return;
        let dmg = withVariance(weapon.dmg) + (state._strengthBuff || 0);
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
        shake();
      }

      // companions with a dmg stat fight alongside you every round you act.
      function companionAttacks() {
        state.companions.forEach(c => {
          if (!c.dmg || c.id === 'sirGus') return;
          const target = currentTarget();
          if (!target) return;
          const dmg = withVariance(c.dmg);
          target.hp -= dmg;
          pushLog(`${c.name} strikes ${target.name} for ${dmg}!`);
          if (target.hp <= 0) pushLog(`${target.name} is defeated!`);
        });
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
        const gus = state.companions.find(c => c.id === 'sirGus' && c.charges > 0);
        if (gus) {
          gus.charges -= 1;
          pushLog(`Sir Gus throws himself into harm's way! (${gus.charges} ${gus.charges === 1 ? 'life' : 'lives'} left)`);
          if (gus.charges <= 0) { state.companions = state.companions.filter(c => c !== gus); pushLog('Sir Gus has given his all, and falls.'); }
          return;
        }
        let hitAny = false;
        for (const f of foes) {
          if (f.hp <= 0) continue;
          if (f.fleesFromPig && state.companions.some(c => c.id === 'pig')) { pushLog(`${f.name} flees at the sight of your pig!`); continue; }
          let dmg = withVariance(f.dmg);
          const mismatch = playerWeapon.dual || (!!f.range !== !!playerWeapon.range);
          if (mismatch && !playerDefending) dmg += Math.ceil(f.dmg * 0.5);
          if (playerDefending) { dmg = Math.floor(dmg / 2); dmg -= (playerWeapon.blockBonus || 0); }
          dmg -= (playerWeapon.damageReduction || 0);
          dmg -= armorReduction(f.range);
          dmg = Math.max(0, dmg);
          if (dmg > 0) hitAny = true;
          GameState.addLife(state, -dmg);
          pushLog(`${f.name} hits you for ${dmg}${mismatch && !playerDefending ? ' (+ambush!)' : ''}${playerDefending ? ' (blocked)' : ''}.`);
        }
        if (hitAny) shake();
      }

      function checkEnd() {
        if (state.life <= 0) { showOutcome('lose'); return true; }
        if (foes.every(f => f.hp <= 0)) { showOutcome('win'); return true; }
        return false;
      }

      function showOutcome(result) {
        ended = true;
        let lootLines = [];
        if (result === 'win' && enemyDef.lootTable) lootLines = rollLoot(state, enemyDef.lootTable);
        if (result === 'win' && enemyDef.onDefeat) enemyDef.onDefeat(state);
        render(result, lootLines);
      }

      function finish(result) {
        box.remove();
        UI.unlock();
        resolve({ result });
      }

      function render(outcome, lootLines) {
        const weapon = equippedWeapon();
        box.innerHTML = `
          <div class="modal-head">Battle!</div>
          <div class="combat-foes">
            ${foes.map((f, i) => `<div class="foe ${f.hp <= 0 ? 'dead' : ''} ${!outcome && i === targetIdx && f.hp > 0 ? 'targeted' : ''}" data-idx="${i}">
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
          ${outcome ? `
            <div class="outcome-banner ${outcome}">
              <div class="outcome-title">${outcome === 'win' ? 'Victory!' : outcome === 'lose' ? 'Defeated...' : 'You escaped!'}</div>
              ${lootLines.length ? `<div class="outcome-loot">${lootLines.join(' &nbsp;·&nbsp; ')}</div>` : ''}
              <button class="title-btn continue-btn">Continue</button>
            </div>` : `
          <div class="combat-actions">
            <div class="weapon-row"></div>
            <div class="action-row">
              <button class="cbtn atk">Attack</button>
              <button class="cbtn def">Defend</button>
              <button class="cbtn item">Item</button>
              <button class="cbtn flee" ${enemyDef.canFlee === false ? 'disabled title="cannot flee"' : ''}>Flee</button>
            </div>
          </div>`}`;

        if (outcome) {
          box.querySelector('.continue-btn').onclick = () => finish(outcome);
          return;
        }

        box.querySelectorAll('.foe').forEach(el => {
          el.onclick = () => { const i = +el.dataset.idx; if (foes[i].hp > 0) { targetIdx = i; render(); } };
        });

        const wrow = box.querySelector('.weapon-row');
        weaponOptions().forEach(w => {
          const b = document.createElement('button');
          b.className = 'choice-btn small' + (w.id === state.equippedWeapon ? ' active' : '');
          b.textContent = w.name + (w.range ? ' (ranged)' : ' (melee)');
          b.onclick = () => { state.equippedWeapon = w.id; render(); };
          wrow.appendChild(b);
        });
        box.querySelector('.atk').onclick = () => {
          const w = equippedWeapon();
          playerAttack(w);
          companionAttacks();
          if (checkEnd()) return;
          enemyActTurn(false, w);
          if (!checkEnd()) render();
        };
        box.querySelector('.def').onclick = () => {
          const w = equippedWeapon();
          pushLog('You brace to defend.');
          companionAttacks();
          if (checkEnd()) return;
          enemyActTurn(true, w);
          if (!checkEnd()) render();
        };
        box.querySelector('.item').onclick = () => openItemMenu();
        box.querySelector('.flee').onclick = () => {
          if (enemyDef.canFlee === false) { pushLog("You can't flee this fight!"); render(); return; }
          if (rng.int(1, 6) >= 3) { showOutcome('flee'); return; }
          pushLog('Failed to flee!');
          const w = equippedWeapon();
          enemyActTurn(false, w);
          if (!checkEnd()) render();
        };
      }

      function openItemMenu() {
        const usable = state.items.filter(i => i.combatUse);
        if (!usable.length) { pushLog('No usable items.'); render(); return; }
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
            companionAttacks();
            if (checkEnd()) return;
            enemyActTurn(false, equippedWeapon());
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
