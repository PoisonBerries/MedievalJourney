// ============================================================================
// ENGINE.JS — canvas, input, camera, generic AreaMap walking/rendering.
// One scene format handles towns, roads AND the old board-game "node graph"
// regions (Woods / Monster Hills / Land of Difficulty / Castle) — those are
// just corridor-shaped maps with event tiles placed at each numbered node.
// ============================================================================

function drawShadow(ctx, cx, footY, width) {
  ctx.save();
  ctx.fillStyle = 'rgba(10,8,14,0.32)';
  ctx.beginPath();
  ctx.ellipse(cx, footY, width * 0.32, width * 0.11, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

const Input = (() => {
  const keys = new Set();
  let mouse = { x: 0, y: 0, down: false, clickedThisFrame: false };
  window.addEventListener('keydown', e => {
    keys.add(e.key.toLowerCase());
    if (['e', ' ', 'enter', 'f'].includes(e.key.toLowerCase())) Events.emit('interact-key');
    if (e.key.toLowerCase() === 'i') Events.emit('toggle-inventory');
    if (e.key.toLowerCase() === 'escape') Events.emit('escape-key');
  });
  window.addEventListener('keyup', e => keys.delete(e.key.toLowerCase()));
  function bindCanvas(canvas) {
    canvas.addEventListener('mousemove', e => {
      const r = canvas.getBoundingClientRect();
      mouse.x = (e.clientX - r.left) * (canvas.width / r.width);
      mouse.y = (e.clientY - r.top) * (canvas.height / r.height);
    });
    canvas.addEventListener('mousedown', () => { mouse.down = true; mouse.clickedThisFrame = true; });
    canvas.addEventListener('mouseup', () => { mouse.down = false; });
  }
  function down(...k) { return k.some(key => keys.has(key)); }
  function consumeClick() { const c = mouse.clickedThisFrame; mouse.clickedThisFrame = false; return c; }
  return { keys, mouse, bindCanvas, down, consumeClick };
})();

class Camera {
  constructor(viewW, viewH) { this.x = 0; this.y = 0; this.viewW = viewW; this.viewH = viewH; }
  follow(px, py, mapW, mapH) {
    this.x = Math.max(0, Math.min(mapW - this.viewW, px - this.viewW / 2));
    this.y = Math.max(0, Math.min(mapH - this.viewH, py - this.viewH / 2));
    if (mapW < this.viewW) this.x = -(this.viewW - mapW) / 2;
    if (mapH < this.viewH) this.y = -(this.viewH - mapH) / 2;
  }
}

// -------------------------------------------------------------- AreaMap ----
class AreaMap {
  constructor(def) {
    this.def = def;
    this.rows = def.map;
    this.h = this.rows.length;
    this.w = this.rows[0].length;
    this.pxW = this.w * TILE;
    this.pxH = this.h * TILE;
    this.entities = (def.entities || []).map(e => ({ ...e, _dead: false }));
  }
  tileAt(tx, ty) {
    if (ty < 0 || ty >= this.h || tx < 0 || tx >= this.w) return '#';
    return this.rows[ty][tx];
  }
  legendFor(ch) { return this.def.legend[ch] || this.def.legend['.']; }
  isSolid(tx, ty) {
    const ch = this.tileAt(tx, ty);
    if (ch === '#') return true;
    const leg = this.legendFor(ch);
    return !!(leg && leg.solid);
  }
  entitiesNear(px, py, range = TILE * 1.1) {
    return this.entities.filter(e => !e._dead && Math.hypot(e.x * TILE + TILE / 2 - px, e.y * TILE + TILE / 2 - py) < range);
  }
  entityBlocking(tx, ty) {
    return this.entities.find(e => !e._dead && e.blocking !== false && e.x === tx && e.y === ty);
  }
}

// -------------------------------------------------------------- Player -----
class Player {
  constructor(x, y) {
    this.x = x; this.y = y; // pixel coords, top-left
    this.w = 24; this.h = 28;
    this.speed = 130; // px/sec
    this.facing = 'down';
    this.moving = false;
    this.animT = 0;
  }
  get cx() { return this.x + this.w / 2; }
  get cy() { return this.y + this.h / 2; }
}

// -------------------------------------------------------------- Engine -----
class GameEngine {
  constructor(canvas, state) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.ctx.imageSmoothingEnabled = false;
    this.state = state;
    this.camera = new Camera(canvas.width, canvas.height);
    this.player = new Player(state.position.x * TILE, state.position.y * TILE);
    this.area = null;
    this.blocked = false; // true while a modal (dialogue/shop/combat) owns input
    this.lastTs = 0;
    this.interactHint = null;
    Input.bindCanvas(canvas);
    Events.on('interact-key', () => this.tryInteract());
    this.loop = this.loop.bind(this);
  }

  loadArea(areaId, spawn) {
    const def = Areas[areaId];
    if (!def) { console.error('Unknown area', areaId); return; }
    this.area = new AreaMap(def);
    if (spawn) { this.player.x = spawn.x * TILE + 4; this.player.y = spawn.y * TILE + 2; }
    this.state.position.area = areaId;
    this.state.position.x = Math.floor(this.player.x / TILE);
    this.state.position.y = Math.floor(this.player.y / TILE);
    if (def.onEnter && !this.state.visited[areaId]) def.onEnter(this.state);
    this.state.visited[areaId] = true;
    if (def.music) {} // no audio assets; visuals only
    Events.emit('area-changed', areaId);
  }

  start() { requestAnimationFrame(this.loop); }

  loop(ts) {
    const dt = Math.min(0.05, (ts - this.lastTs) / 1000 || 0);
    this.lastTs = ts;
    if (!this.blocked && this.state.life > 0) this.update(dt);
    this.render();
    requestAnimationFrame(this.loop);
  }

  tryInteract() {
    if (this.blocked || !this.area) return;
    if (this.interactHint) this.triggerEntity(this.interactHint);
  }

  update(dt) {
    const p = this.player, area = this.area;
    if (!area) return;
    p.speed = 130 * (this.state.flags.royalSpeed ? 1.8 : this.state.flags.hasHorse ? 1.4 : 1);
    let dx = 0, dy = 0;
    if (Input.down('w', 'arrowup')) dy -= 1;
    if (Input.down('s', 'arrowdown')) dy += 1;
    if (Input.down('a', 'arrowleft')) dx -= 1;
    if (Input.down('d', 'arrowright')) dx += 1;
    p.moving = dx !== 0 || dy !== 0;
    if (p.moving) {
      const len = Math.hypot(dx, dy) || 1;
      dx = dx / len * p.speed * dt; dy = dy / len * p.speed * dt;
      if (Math.abs(dx) > Math.abs(dy)) p.facing = dx > 0 ? 'right' : 'left';
      else if (dy !== 0) p.facing = dy > 0 ? 'down' : 'up';
      this.moveAxis(dx, 0);
      this.moveAxis(0, dy);
      p.animT += dt;
    }
    this.state.position.x = Math.floor(p.cx / TILE);
    this.state.position.y = Math.floor(p.cy / TILE);

    // ambient danger zones (e.g. the Land of Difficulty) — periodic random encounters
    const tileCh = area.tileAt(Math.floor(p.cx / TILE), Math.floor(p.cy / TILE));
    const tileLeg = area.legendFor(tileCh);
    if (tileLeg && tileLeg.danger && p.moving && !this._dangerCooldown) {
      if (Math.random() < tileLeg.danger * dt) {
        this._dangerCooldown = true;
        setTimeout(() => { this._dangerCooldown = false; }, 4000);
        const handler = tileLeg.onDanger || area.def.onDanger;
        if (handler) handler(this);
      }
    }

    // proximity hint + auto-trigger walk-over events/exits
    const near = area.entitiesNear(p.cx, p.cy, TILE * 0.75);
    this.interactHint = near.find(e => e.interact) || null;
    const stepOn = area.entities.find(e => !e._dead && e.autoTrigger && e.x === Math.floor(p.cx / TILE) && e.y === Math.floor(p.cy / TILE));
    if (stepOn) this.triggerEntity(stepOn);

    // forced encounters (dungeon monsters) — triggers the instant you get
    // close, whether or not you're centered on its tile, so there's no
    // skirting around it through the rest of an open room.
    const forceMonster = area.entities.find(e => !e._dead && e.forceEncounter && Math.hypot(e.x * TILE + TILE / 2 - p.cx, e.y * TILE + TILE / 2 - p.cy) < TILE * 1.15);
    if (forceMonster) this.triggerEntity(forceMonster);

    if (Input.consumeClick() && this.interactHint) this.triggerEntity(this.interactHint);

    this.camera.follow(p.cx, p.cy, area.pxW, area.pxH);
  }

  moveAxis(dx, dy) {
    const p = this.player, area = this.area;
    const nx = p.x + dx, ny = p.y + dy;
    const corners = [
      [nx + 3, p.y + ny - p.y + p.h - 2], // placeholder unused
    ];
    const testX = nx, testY = ny;
    const left = Math.floor((testX + 4) / TILE), right = Math.floor((testX + p.w - 4) / TILE);
    const top = Math.floor((testY + p.h * 0.5) / TILE), bottom = Math.floor((testY + p.h - 2) / TILE);
    let collide = false;
    for (const tx of [left, right]) {
      for (const ty of [top, bottom]) {
        if (area.isSolid(tx, ty)) collide = true;
        if (area.entityBlocking(tx, ty)) collide = true;
      }
    }
    if (!collide) { p.x = nx; p.y = ny; }
  }

  triggerEntity(e) {
    if (e._dead) return;
    if (e.onTrigger) e.onTrigger(this, e);
  }

  render() {
    const { ctx, canvas, camera, area, player } = this;
    ctx.fillStyle = '#0b0b12';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    if (!area) return;
    const camX = camera.x, camY = camera.y;
    const startTx = Math.max(0, Math.floor(camX / TILE));
    const endTx = Math.min(area.w - 1, Math.ceil((camX + canvas.width) / TILE));
    const startTy = Math.max(0, Math.floor(camY / TILE));
    const endTy = Math.min(area.h - 1, Math.ceil((camY + canvas.height) / TILE));

    for (let ty = startTy; ty <= endTy; ty++) {
      for (let tx = startTx; tx <= endTx; tx++) {
        const ch = area.tileAt(tx, ty);
        const leg = area.legendFor(ch);
        const key = typeof leg.tile === 'function' ? leg.tile(tx, ty) : leg.tile;
        drawSprite(ctx, key, tx * TILE - camX, ty * TILE - camY);
        if (leg.overlay) {
          // tile-overlay props (trees/rocks/signs/etc) are pre-baked 32x32
          // stamps with their own shadow already drawn into the sprite.
          const ov = typeof leg.overlay === 'function' ? leg.overlay(tx, ty) : leg.overlay;
          drawSprite(ctx, ov, tx * TILE - camX, ty * TILE - camY);
        }
      }
    }

    // entities (sorted by y for pseudo-depth)
    const visibleEntities = area.entities.filter(e => !e._dead);
    const drawList = visibleEntities.map(e => ({ e, y: e.y }));
    drawList.push({ e: { isPlayer: true }, y: player.cy / TILE });
    drawList.sort((a, b) => a.y - b.y);

    for (const { e } of drawList) {
      if (e.isPlayer) {
        this.renderPlayer();
        continue;
      }
      const sx = e.x * TILE - camX, sy = e.y * TILE - camY;
      if (sx < -TILE * 2 || sy < -TILE * 2 || sx > canvas.width + TILE * 2 || sy > canvas.height + TILE * 2) continue;
      const box = spriteBox(e.sprite);
      const w = e.size || box.w, h = e.size ? e.size : box.h;
      drawShadow(ctx, sx + TILE / 2, sy + TILE - 3, w);
      drawSprite(ctx, e.sprite, sx + (TILE - w) / 2, sy + TILE - h, w, h);
      const nearPlayer = Math.hypot(e.x * TILE + TILE / 2 - player.cx, e.y * TILE + TILE / 2 - player.cy) < TILE * 2.5;
      if (e.label && nearPlayer && e !== this.interactHint) {
        ctx.font = '10px monospace';
        ctx.fillStyle = '#fff';
        ctx.textAlign = 'center';
        ctx.fillText(e.label, sx + TILE / 2, sy + TILE - h - 6);
      }
    }

    // interact prompt
    if (this.interactHint && !this.blocked) {
      const e = this.interactHint;
      const eBox = spriteBox(e.sprite);
      const eh = e.size || eBox.h;
      const sx = e.x * TILE - camX + TILE / 2, sy = e.y * TILE - camY + TILE - eh - 8;
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffe98a';
      ctx.fillText('[E] ' + (e.promptText || 'talk'), sx, sy);
    }

    ctx.textAlign = 'left';
  }

  renderPlayer() {
    const { ctx, camera, player: p } = this;
    const feetX = p.x - camera.x + p.w / 2, feetY = p.y - camera.y + p.h;
    const bob = p.moving ? Math.sin(p.animT * 10) * 1.5 : 0;
    const box = spriteBox('player_down');
    const key = p.facing === 'up' ? 'player_up' : (p.facing === 'left' || p.facing === 'right') ? 'player_side' : 'player_down';
    drawShadow(ctx, feetX, feetY - 2, box.w);
    drawSprite(ctx, key, feetX - box.w / 2, feetY - box.h + bob, box.w, box.h, p.facing === 'left');
  }
}
