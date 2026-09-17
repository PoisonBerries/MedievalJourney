// ============================================================================
// MAPGEN.JS — small helpers for authoring AreaMap tile grids in code instead
// of hand-typed ASCII (much less error prone for big maps).
// ============================================================================
function blankGrid(w, h, fill = '.') {
  const rows = [];
  for (let y = 0; y < h; y++) rows.push(new Array(w).fill(fill));
  return rows;
}
function gridToRows(grid) { return grid.map(r => r.join('')); }
function setAt(grid, x, y, ch) { if (grid[y] && x >= 0 && x < grid[y].length) grid[y][x] = ch; }
function fillRect(grid, x, y, w, h, ch) { for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) setAt(grid, x + i, y + j, ch); }
function frameRect(grid, x, y, w, h, ch) {
  fillRect(grid, x, y, w, 1, ch); fillRect(grid, x, y + h - 1, w, 1, ch);
  fillRect(grid, x, y, 1, h, ch); fillRect(grid, x + w - 1, y, 1, h, ch);
}
function carveRoad(grid, x1, y1, x2, y2, ch = '=') {
  let x = x1, y = y1;
  while (x !== x2) { setAt(grid, x, y, ch); setAt(grid, x, y - 1 >= 0 ? y : y, ch); x += x < x2 ? 1 : -1; }
  setAt(grid, x, y, ch);
  while (y !== y2) { setAt(grid, x, y, ch); y += y < y2 ? 1 : -1; setAt(grid, x, y, ch); }
  setAt(grid, x2, y2, ch);
}
function widen(grid, x, y, ch, w = 2) {
  for (let dx = -Math.floor(w / 2); dx <= Math.floor(w / 2); dx++)
    for (let dy = -Math.floor(w / 2); dy <= Math.floor(w / 2); dy++)
      if (grid[y + dy] && grid[y + dy][x + dx] !== undefined) setAt(grid, x + dx, y + dy, ch);
}
function blob(grid, cx, cy, r, ch) {
  for (let y = -r; y <= r; y++) for (let x = -r; x <= r; x++)
    if (x * x + y * y <= r * r + rng.int(-1, 1)) setAt(grid, cx + x, cy + y, ch);
}
function scatter(grid, x, y, w, h, ch, density = 0.08, avoid = ['=', '~']) {
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
    const gx = x + i, gy = y + j;
    if (!grid[gy]) continue;
    if (avoid.includes(grid[gy][gx])) continue;
    if (Math.random() < density) setAt(grid, gx, gy, ch);
  }
}

// simple linear "node graph" corridor generator used by Woods / Monster
// Hills / Land of Difficulty / Merlin's Hideout / Castle wings: a snaking
// path of rooms, one per numbered node from the original notes, each
// wide enough to walk in, connected by short corridors.
function buildNodeCorridor(nodeCount, opts = {}) {
  const roomW = opts.roomW || 5, roomH = opts.roomH || 5, gap = opts.gap || 3;
  const cols = opts.cols || Math.ceil(Math.sqrt(nodeCount));
  const w = cols * (roomW + gap) + gap;
  const rowsN = Math.ceil(nodeCount / cols);
  const h = rowsN * (roomH + gap) + gap;
  const grid = blankGrid(w, h, '#');
  const centers = [];
  for (let i = 0; i < nodeCount; i++) {
    const col = i % cols, row = Math.floor(i / cols);
    const x = gap + col * (roomW + gap), y = gap + row * (roomH + gap);
    fillRect(grid, x, y, roomW, roomH, '.');
    centers.push({ x: x + Math.floor(roomW / 2), y: y + Math.floor(roomH / 2) });
    if (i > 0) {
      const a = centers[i - 1], b = centers[i];
      carveRoad(grid, a.x, a.y, b.x, b.y, '.');
      widen(grid, Math.round((a.x + b.x) / 2), Math.round((a.y + b.y) / 2), '.', 2);
    }
  }
  return { grid, centers, w, h };
}
