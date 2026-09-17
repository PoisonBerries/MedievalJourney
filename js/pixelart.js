// ============================================================================
// PIXELART.JS — tiny procedural pixel-art renderer.
// Every sprite is authored as pixels on a grid (no external image files),
// rasterized once to an offscreen canvas, then blitted with nearest-neighbor
// scaling everywhere else in the game. Keeps the whole game a single static
// site (GitHub Pages friendly) while still looking like real pixel art.
// ============================================================================

const PixelArt = (() => {
  const cache = new Map();

  // ---- low level grid ------------------------------------------------
  function makeGrid(w, h) {
    const g = new Array(h);
    for (let y = 0; y < h; y++) g[y] = new Array(w).fill(null);
    return { w, h, px: g };
  }

  function set(grid, x, y, color) {
    if (x < 0 || y < 0 || x >= grid.w || y >= grid.h) return;
    grid.px[y][x] = color;
  }

  function rect(grid, x, y, w, h, color) {
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) set(grid, x + i, y + j, color);
  }

  function frame(grid, x, y, w, h, color) {
    rect(grid, x, y, w, 1, color);
    rect(grid, x, y + h - 1, w, 1, color);
    rect(grid, x, y, 1, h, color);
    rect(grid, x + w - 1, y, 1, h, color);
  }

  function circle(grid, cx, cy, r, color) {
    for (let y = -r; y <= r; y++) {
      for (let x = -r; x <= r; x++) {
        if (x * x + y * y <= r * r + 0.3) set(grid, cx + x, cy + y, color);
      }
    }
  }

  function line(grid, x0, y0, x1, y1, color) {
    let dx = Math.abs(x1 - x0), dy = Math.abs(y1 - y0);
    let sx = x0 < x1 ? 1 : -1, sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    while (true) {
      set(grid, x0, y0, color);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
  }

  function ellipse(grid, cx, cy, rx, ry, color) {
    for (let y = -ry; y <= ry; y++) {
      for (let x = -rx; x <= rx; x++) {
        if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1.02) set(grid, cx + x, cy + y, color);
      }
    }
  }

  function blotch(grid, cx, cy, r, color, seedN = 0) {
    const bumps = 5;
    for (let i = 0; i < bumps; i++) {
      const a = (i / bumps) * Math.PI * 2 + seedN;
      const rr = r * (0.55 + ((seedN * 7 + i * 13) % 5) / 10);
      circle(grid, Math.round(cx + Math.cos(a) * r * 0.4), Math.round(cy + Math.sin(a) * r * 0.4), Math.round(rr), color);
    }
    circle(grid, cx, cy, Math.round(r * 0.7), color);
  }

  function mirrorX(grid) {
    // mirrors left half onto right half (for symmetric characters)
    const half = Math.floor(grid.w / 2);
    for (let y = 0; y < grid.h; y++) {
      for (let x = 0; x < half; x++) {
        grid.px[y][grid.w - 1 - x] = grid.px[y][x];
      }
    }
  }

  // grows a 1px outline ring just outside the current silhouette — gives
  // props/characters a clean cel-shaded edge like Stardew/Celeste sprites.
  function outlineSilhouette(grid, color) {
    const snap = grid.px.map(row => row.slice());
    for (let y = 0; y < grid.h; y++) {
      for (let x = 0; x < grid.w; x++) {
        if (snap[y][x]) continue;
        const n = (snap[y - 1] && snap[y - 1][x]) || (snap[y + 1] && snap[y + 1][x]) || snap[y][x - 1] || snap[y][x + 1];
        if (n) set(grid, x, y, color);
      }
    }
  }

  // ---- rasterize to canvas --------------------------------------------
  function toCanvas(grid, scale = 1) {
    const c = document.createElement('canvas');
    c.width = grid.w * scale;
    c.height = grid.h * scale;
    const ctx = c.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    for (let y = 0; y < grid.h; y++) {
      for (let x = 0; x < grid.w; x++) {
        const col = grid.px[y][x];
        if (!col) continue;
        ctx.fillStyle = col;
        ctx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
    return c;
  }

  // build & cache a sprite. drawFn(grid, helpers) fills the grid.
  function build(key, w, h, drawFn, scale = 1) {
    if (cache.has(key)) return cache.get(key);
    const grid = makeGrid(w, h);
    drawFn(grid, { set, rect, frame, circle, line, mirrorX, ellipse, blotch, outlineSilhouette });
    const canvas = toCanvas(grid, scale);
    cache.set(key, canvas);
    return canvas;
  }

  function get(key) { return cache.get(key); }

  return { makeGrid, set, rect, frame, circle, line, ellipse, blotch, mirrorX, outlineSilhouette, toCanvas, build, get };
})();

// ============================================================================
// PALETTE — limited, warm, medieval-storybook palette (Stardew/Celeste-ish)
// ============================================================================
const PAL = {
  transparent: null,
  black: '#1a1523',
  outline: '#2b1d2c',
  white: '#f4ecd8',
  cream: '#f4ecd8',
  bone: '#e8dcc0',

  skin1: '#f0c29a', skin2: '#d99e6c', skin3: '#8a5a3c',
  hairBrown: '#5a3826', hairBlack: '#2b1d2c', hairBlonde: '#e8c168', hairGrey: '#c9c4b8', hairRed: '#a8492f',

  grass1: '#4a7a3a', grass2: '#3a6230', grass3: '#5f9450', grassHi: '#7ab55f', grassLo: '#2c4d26',
  dirt1: '#a8825a', dirt2: '#8a6a45', dirt3: '#c79b6c', dirtLo: '#6e5236',
  road1: '#a8977c', road2: '#948066',
  stoneLight: '#a7a8b0', stoneMid: '#82838c', stoneDark: '#54545c', stoneHi: '#c2c3ca',
  water1: '#3f7fb0', water2: '#2a5478', water3: '#6bb0dd', waterHi: '#a9dcf5',
  sand: '#e0cd93', sandLo: '#c7ab6c',
  wood1: '#9a6b3f', wood2: '#6b4426', wood3: '#c79256', woodLo: '#4f3018',
  leaf1: '#2f5d2a', leaf2: '#3f7a37', leaf3: '#255024', leafHi: '#6bab4a', leafLo: '#1c3d1c',
  roofRed: '#a8453d', roofRedLo: '#7a2f28', roofBlue: '#3a6285', roofBlueLo: '#264a63',
  roofPurple: '#6c4a82', roofPurpleLo: '#4a3260', roofBrown: '#6c4a2c', roofBrownLo: '#4a3018',
  snow: '#eef4fb', snowLo: '#cddbea',
  flowerWhite: '#f4ecd8', flowerYellow: '#f0c847', flowerPink: '#e88aa8', flowerRed: '#d94f4f',
  shadow: 'rgba(15,12,18,0.32)',

  gold: '#e8b34a', goldDark: '#b8842a', silver: '#c7cbd1',
  cloth_red: '#a8362f', cloth_blue: '#2e5f8a', cloth_green: '#3f7a45',
  cloth_purple: '#6a3f8a', cloth_brown: '#7a5230', cloth_grey: '#787c85',
  cloth_gold: '#c99a2f', cloth_pink: '#d97a9a', cloth_black: '#2b2530',
  cloth_white: '#e8e2d4', cloth_witch: '#3a2a4a',

  dragonGreen: '#3f8a4a', dragonRed: '#a8362f', dragonBlue: '#2e6f9a', dragonWhite: '#dbe8f2',
  ogreGreen: '#6a8a3f', goblinGreen: '#7a9a4a', bearBrown: '#7a5230', bearBrown2: '#5c3d1f',
  serpentGreen: '#3f9a5a', toadGreen: '#5a9a3f', crow: '#2b2530', tortoiseGreen: '#4a7a4f',
  ratGrey: '#8a8578', mooseBrown: '#6b4830', ghostWhite: '#dfe6ee',

  blade: '#c7cbd1', bladeDark: '#8f939c', hilt: '#8a5a34', hiltGold: '#e8b34a',
  arrowShaft: '#8a5a34', arrowHead: '#c7cbd1', flame: '#e8763a',

  potionRed: '#c23a4a', potionGreen: '#3fa860', potionBlue: '#3a7ac2', potionPurple: '#8a4ac2',
  potionTeal: '#2fa896', potionOrange: '#d97a2f', potionYellow: '#e8c847',
  glassLight: '#dfe9f2',
};

// deterministic per-tile pick — terrain variant sprites must stay stable
// frame to frame (a re-randomized pick every render would flicker/shimmer).
function hashPick(tx, ty, arr) {
  const h = ((tx * 928371 + ty * 137 + tx * ty * 7) >>> 0);
  return arr[h % arr.length];
}

const rng = {
  seedVal: 12345,
  seed(s) { this.seedVal = s; },
  next() {
    this.seedVal = (this.seedVal * 1103515245 + 12345) & 0x7fffffff;
    return this.seedVal / 0x7fffffff;
  },
  int(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  d6() { return this.int(1, 6); },
  d20() { return this.int(1, 20); },
};
