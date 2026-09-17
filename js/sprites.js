// ============================================================================
// SPRITES.JS — the sprite atlas. Everything is generated at load time onto
// pixel grids, then upscaled with nearest-neighbor. TILE = 32px on screen.
//
// Resolution budget (all drawn at scale 1, i.e. 1 canvas px = 1 screen px):
//   terrain / small props  -> 32x32   (fills exactly one tile)
//   characters (npc/enemy) -> 40x52   (bigger than a tile, anchored at feet)
//   buildings               -> 64x64   (tall cottages, anchored at their door)
// ============================================================================
const TILE = 32;
const CHAR_W = 40, CHAR_H = 52;
const BLDG_W = 64, BLDG_H = 64;

// box a given sprite key should be rendered at (engine uses this to anchor
// oversized sprites at their feet/base instead of squashing them into 32x32)
function spriteBox(key) {
  if (!key) return { w: TILE, h: TILE };
  if (key.startsWith('player') || key.startsWith('npc_') || key.startsWith('e_')) return { w: CHAR_W, h: CHAR_H };
  if (key.startsWith('b_')) return { w: BLDG_W, h: BLDG_H };
  if (key === 'o_castletower' || key === 'o_snowyhill' || key === 'o_gatehouse') return { w: BLDG_W, h: BLDG_H };
  if (key === 'o_tree' || key === 'o_bigbush') return { w: TILE, h: TILE };
  return { w: TILE, h: TILE };
}

function shadeEdge(H, grid, x, y, w, h, lo, hi) {
  H.rect(grid, x, y, w, 1, hi);
  H.rect(grid, x, y + h - 1, w, 1, lo);
}

// ---------------------------------------------------------------- TERRAIN --
// all 32x32, scale 1. Several variants per type so the world doesn't look
// like an obvious repeating grid.
function drawGrass(grid, H, v) {
  const base = v % 2 === 0 ? PAL.grass1 : PAL.grass2;
  H.rect(grid, 0, 0, 32, 32, base);
  for (let i = 0; i < 5; i++) {
    const x = (i * 11 + v * 5) % 26 + 3, y = (i * 7 + v * 3) % 26 + 3;
    H.circle(grid, x, y, 3, v % 2 === 0 ? PAL.grass2 : PAL.grass1);
  }
  for (let i = 0; i < 16; i++) {
    const x = (i * 5 + v * 9) % 30 + 1, y = (i * 8 + v * 4) % 30 + 1;
    H.rect(grid, x, y, 1, 2, i % 3 === 0 ? PAL.grassHi : PAL.grassLo);
  }
  if (v === 2 || v === 4) {
    const spots = v === 2 ? [[8, 10], [22, 20]] : [[16, 16], [26, 6]];
    spots.forEach(([fx, fy]) => {
      H.set(grid, fx, fy, PAL.flowerYellow); H.set(grid, fx + 1, fy, PAL.flowerWhite);
      H.set(grid, fx, fy + 1, PAL.flowerWhite); H.set(grid, fx + 1, fy - 1, PAL.leaf2);
    });
  }
  if (v === 5) {
    [[10, 24], [24, 12]].forEach(([fx, fy]) => {
      H.set(grid, fx, fy, PAL.flowerPink); H.set(grid, fx + 1, fy, PAL.flowerRed);
      H.set(grid, fx, fy + 1, PAL.flowerPink);
    });
  }
}
function drawPath(grid, H, v) {
  H.rect(grid, 0, 0, 32, 32, PAL.dirt1);
  for (let i = 0; i < 9; i++) {
    const x = (i * 9 + v * 7) % 28 + 2, y = (i * 6 + v * 5) % 28 + 2;
    H.circle(grid, x, y, 3, i % 2 === 0 ? PAL.dirt2 : PAL.dirt3);
  }
  for (let i = 0; i < 6; i++) {
    const x = (i * 13 + v * 3) % 29 + 1, y = (i * 9 + v * 6) % 29 + 1;
    H.set(grid, x, y, PAL.stoneMid); H.set(grid, x + 1, y, PAL.stoneLight);
  }
  shadeEdge(H, grid, 0, 0, 32, 32, PAL.dirtLo, PAL.dirt3);
}
function drawStonePath(grid, H) {
  H.rect(grid, 0, 0, 32, 32, PAL.stoneMid);
  H.frame(grid, 1, 1, 15, 15, PAL.stoneDark);
  H.frame(grid, 16, 1, 15, 15, PAL.stoneDark);
  H.frame(grid, 1, 16, 15, 15, PAL.stoneDark);
  H.frame(grid, 16, 16, 15, 15, PAL.stoneDark);
  H.rect(grid, 2, 2, 5, 5, PAL.stoneHi); H.rect(grid, 18, 18, 4, 4, PAL.stoneHi);
}
function drawWater(grid, H, frame) {
  H.rect(grid, 0, 0, 32, 32, PAL.water1);
  for (let y = 3; y < 32; y += 6) {
    for (let x = 0; x < 32; x++) {
      const wave = Math.sin((x + frame * 7) * 0.35) * 1.6;
      if (Math.abs(((y + wave) % 6)) < 1.3) H.set(grid, x, y, PAL.water3);
    }
  }
  for (let i = 0; i < 4; i++) {
    const x = (i * 11 + frame * 6) % 30 + 1, y = (i * 8 + frame * 3) % 30 + 1;
    H.set(grid, x, y, PAL.waterHi);
  }
  H.rect(grid, 0, 0, 32, 2, PAL.water2);
}
function drawSand(grid, H, v) {
  H.rect(grid, 0, 0, 32, 32, PAL.sand);
  for (let i = 0; i < 8; i++) H.set(grid, (i * 5 + v * 3) % 32, (i * 3 + 4 + v * 2) % 32, PAL.sandLo);
  H.rect(grid, 0, 0, 32, 2, PAL.sandLo);
}
function drawWoodFloor(grid, H) {
  H.rect(grid, 0, 0, 32, 32, PAL.wood1);
  for (let y = 0; y < 32; y += 8) { H.rect(grid, 0, y, 32, 1, PAL.wood2); H.rect(grid, 0, y + 7, 32, 1, PAL.wood3); }
}
function drawStoneFloor(grid, H) {
  H.rect(grid, 0, 0, 32, 32, PAL.stoneLight);
  H.rect(grid, 0, 15, 32, 1, PAL.stoneMid); H.rect(grid, 15, 0, 1, 32, PAL.stoneMid);
  H.rect(grid, 0, 0, 32, 1, PAL.stoneHi); H.rect(grid, 0, 31, 32, 1, PAL.stoneDark);
}
function drawSnow(grid, H, v) {
  H.rect(grid, 0, 0, 32, 32, PAL.snow);
  for (let i = 0; i < 6; i++) H.circle(grid, (i * 7 + v * 4) % 28 + 2, (i * 5 + v * 3) % 28 + 2, 2, PAL.snowLo);
}
function drawHillRock(grid, H) {
  H.rect(grid, 0, 0, 32, 32, PAL.stoneMid);
  H.blotch(grid, 10, 10, 8, PAL.stoneDark, 1);
  H.blotch(grid, 22, 20, 7, PAL.stoneLight, 2);
  H.rect(grid, 0, 24, 32, 8, PAL.grass2);
  shadeEdge(H, grid, 0, 24, 32, 8, PAL.grassLo, PAL.grass3);
}
function drawForestFloor(grid, H, v) {
  H.rect(grid, 0, 0, 32, 32, PAL.grass2);
  for (let i = 0; i < 10; i++) H.set(grid, (i * 4 + 1 + v * 3) % 32, (i * 6 + 3 + v * 2) % 32, PAL.leafLo);
  for (let i = 0; i < 4; i++) H.circle(grid, (i * 9 + v * 5) % 26 + 3, (i * 7 + v * 2) % 26 + 3, 2, PAL.dirt2);
}

// ------------------------------------------------------------- SCENERY ----
// 32x32 tile-overlay props (they render squarely within one tile, so any
// ground shadow they need is baked directly into the sprite).
function drawTree(grid, H, v = 0) {
  H.ellipse(grid, 16, 28, 10, 3, PAL.shadow);
  H.rect(grid, 13, 18, 6, 11, PAL.wood2);
  H.rect(grid, 13, 18, 2, 11, PAL.woodLo);
  H.rect(grid, 17, 18, 2, 11, PAL.wood3);
  H.circle(grid, 16, 13, 11, PAL.leaf1);
  H.circle(grid, 10, 12, 7, PAL.leaf2);
  H.circle(grid, 21, 14, 7, PAL.leaf2);
  H.circle(grid, 16, 8, 7, PAL.leafHi);
  H.circle(grid, 22, 18, 4, PAL.leafLo);
  H.outlineSilhouette(grid, PAL.outline);
}
function drawPineTree(grid, H) {
  H.ellipse(grid, 16, 29, 9, 2, PAL.shadow);
  H.rect(grid, 14, 22, 4, 7, PAL.wood2);
  for (let i = 0; i < 3; i++) {
    const y = 20 - i * 7, w = 13 - i * 3;
    H.rect(grid, 16 - w, y, w * 2, 8, i % 2 === 0 ? PAL.leaf1 : PAL.leaf2);
    H.rect(grid, 16 - w, y, 4, 8, PAL.leafHi);
  }
  H.outlineSilhouette(grid, PAL.outline);
}
function drawBush(grid, H) {
  H.ellipse(grid, 16, 26, 9, 3, PAL.shadow);
  H.circle(grid, 16, 20, 8, PAL.leaf1);
  H.circle(grid, 10, 21, 5, PAL.leaf2);
  H.circle(grid, 22, 21, 5, PAL.leaf2);
  H.circle(grid, 14, 17, 4, PAL.leafHi);
  H.circle(grid, 12, 22, 1, PAL.flowerRed); H.circle(grid, 20, 20, 1, PAL.flowerRed);
  H.outlineSilhouette(grid, PAL.outline);
}
function drawFlowerPatch(grid, H, v) {
  const colors = [PAL.flowerYellow, PAL.flowerWhite, PAL.flowerPink, PAL.flowerRed];
  for (let i = 0; i < 5; i++) {
    const x = (i * 6 + v * 3) % 26 + 3, y = (i * 5 + v * 4) % 20 + 8;
    H.rect(grid, x, y, 1, 3, PAL.leaf2);
    H.set(grid, x - 1, y, colors[(i + v) % colors.length]);
    H.set(grid, x + 1, y, colors[(i + v + 1) % colors.length]);
    H.set(grid, x, y - 1, PAL.flowerWhite);
  }
}
function drawTallGrassTuft(grid, H, v) {
  for (let i = 0; i < 6; i++) {
    const x = 6 + i * 4 + (v % 3), h = 6 + ((i + v) % 3) * 2;
    H.line(grid, x, 24, x - 1, 24 - h, PAL.grass3);
    H.line(grid, x + 1, 24, x + 2, 24 - h + 2, PAL.grassHi);
  }
}
function drawRockProp(grid, H) {
  H.ellipse(grid, 16, 27, 8, 2, PAL.shadow);
  H.blotch(grid, 16, 19, 8, PAL.stoneMid, 3);
  H.blotch(grid, 12, 16, 5, PAL.stoneHi, 5);
  H.blotch(grid, 20, 22, 4, PAL.stoneDark, 7);
  for (let i = 0; i < 3; i++) H.circle(grid, 10 + i * 6, 24, 1, PAL.leaf2);
  H.outlineSilhouette(grid, PAL.outline);
}
function drawSign(grid, H) {
  H.ellipse(grid, 16, 29, 5, 2, PAL.shadow);
  H.rect(grid, 14, 14, 4, 15, PAL.wood2);
  H.rect(grid, 15, 14, 1, 15, PAL.wood3);
  H.rect(grid, 4, 3, 24, 13, PAL.wood1);
  H.rect(grid, 4, 3, 24, 2, PAL.wood3);
  H.frame(grid, 4, 3, 24, 13, PAL.woodLo);
  H.line(grid, 8, 9, 24, 9, PAL.woodLo);
  H.outlineSilhouette(grid, PAL.outline);
}
function drawWell(grid, H) {
  H.ellipse(grid, 16, 29, 9, 2, PAL.shadow);
  H.rect(grid, 3, 5, 3, 14, PAL.wood2); H.rect(grid, 26, 5, 3, 14, PAL.wood2);
  H.rect(grid, 2, 3, 28, 3, PAL.wood1);
  H.line(grid, 16, 6, 16, 16, PAL.woodLo);
  H.circle(grid, 16, 20, 11, PAL.stoneMid);
  H.circle(grid, 16, 20, 8, PAL.water2);
  H.circle(grid, 16, 20, 5, PAL.water1);
  H.frame(grid, 16 - 11, 9, 22, 11, PAL.stoneDark);
  H.rect(grid, 14, 16, 4, 3, PAL.wood2);
  H.outlineSilhouette(grid, PAL.outline);
}
function drawFence(grid, H) {
  H.rect(grid, 2, 10, 2, 18, PAL.wood2); H.rect(grid, 28, 10, 2, 18, PAL.wood2);
  H.rect(grid, 0, 13, 32, 3, PAL.wood1); H.rect(grid, 0, 21, 32, 3, PAL.wood1);
  shadeEdge(H, grid, 0, 13, 32, 3, PAL.woodLo, PAL.wood3);
  shadeEdge(H, grid, 0, 21, 32, 3, PAL.woodLo, PAL.wood3);
}
function drawCastleWall(grid, H) {
  H.rect(grid, 0, 0, 32, 32, PAL.stoneMid);
  H.rect(grid, 0, 0, 32, 6, PAL.stoneDark);
  for (let x = 0; x < 32; x += 8) { H.rect(grid, x, 0, 4, 4, PAL.stoneHi); H.rect(grid, x + 1, 5, 2, 27, PAL.stoneDark); }
  for (let y = 8; y < 32; y += 8) H.rect(grid, 0, y, 32, 1, PAL.stoneDark);
  H.rect(grid, 0, 0, 1, 32, PAL.stoneHi);
}
function drawCastleTower(grid, H) {
  H.ellipse(grid, 32, 60, 20, 4, PAL.shadow);
  H.rect(grid, 8, 20, 48, 40, PAL.stoneMid);
  for (let y = 20; y < 60; y += 8) H.rect(grid, 8, y, 48, 1, PAL.stoneDark);
  for (let x = 8; x < 56; x += 10) H.rect(grid, x, 20, 2, 40, PAL.stoneDark);
  H.rect(grid, 8, 20, 2, 40, PAL.stoneHi);
  for (let i = 0; i < 6; i++) { const x = 8 + i * 8; H.rect(grid, x, 12, 5, 8, PAL.stoneMid); H.rect(grid, x, 8, 5, 4, PAL.stoneDark); }
  H.rect(grid, 0, 0, 64, 12, PAL.roofPurple);
  for (let i = 0; i < 12; i++) H.rect(grid, i * 5, i % 2, 5, 12 - i, i % 2 ? PAL.roofPurpleLo : PAL.roofPurple);
  H.rect(grid, 26, 40, 12, 20, PAL.stoneDark);
  H.outlineSilhouette(grid, PAL.outline);
}
function drawSnowyHill(grid, H) {
  // a rocky, snow-capped mountain mound — used for the Monster Hills
  // waypoint, so it should read as terrain, not a building.
  H.ellipse(grid, 32, 60, 24, 4, PAL.shadow);
  H.blotch(grid, 32, 40, 22, PAL.stoneMid, 2);
  H.blotch(grid, 18, 46, 14, PAL.stoneDark, 5);
  H.blotch(grid, 46, 44, 13, PAL.stoneDark, 8);
  H.blotch(grid, 32, 24, 15, PAL.snow, 3);
  H.blotch(grid, 22, 32, 8, PAL.snow, 6);
  H.blotch(grid, 42, 30, 8, PAL.snow, 9);
  for (let i = 0; i < 5; i++) H.set(grid, 26 + i * 3, 30 + (i % 2) * 2, PAL.snowLo);
  H.ellipse(grid, 32, 58, 7, 6, PAL.black); // cave mouth
  H.ellipse(grid, 32, 58, 5, 4, PAL.outline);
  H.outlineSilhouette(grid, PAL.outline);
}
function drawGatehouse(grid, H) {
  // twin towers flanking a barred archway — a checkpoint, distinct from
  // both the snowy hill and the castle's single round tower.
  H.ellipse(grid, 32, 61, 22, 4, PAL.shadow);
  [4, 40].forEach(tx => {
    H.rect(grid, tx, 14, 20, 46, PAL.stoneMid);
    for (let y = 14; y < 60; y += 8) H.rect(grid, tx, y, 20, 1, PAL.stoneDark);
    H.rect(grid, tx, 14, 2, 46, PAL.stoneHi);
    for (let i = 0; i < 3; i++) H.rect(grid, tx + 1 + i * 7, 8, 5, 6, PAL.stoneMid);
  });
  H.rect(grid, 22, 30, 20, 30, PAL.black);
  for (let x = 24; x < 40; x += 4) H.rect(grid, x, 30, 2, 30, PAL.stoneDark);
  H.rect(grid, 22, 30, 20, 4, PAL.stoneDark);
  H.rect(grid, 26, 6, 3, 10, PAL.wood2);
  H.rect(grid, 26, 4, 8, 5, PAL.cloth_red);
  H.outlineSilhouette(grid, PAL.outline);
}

// ------------------------------------------------------------ BUILDINGS ---
// 64x64, anchored at the base (door) — visually taller than a tile, like a
// real cottage, while still only occupying one collision tile.
function drawBuilding(grid, H, opts) {
  const { roof, roofLo, wall, wallLo, trim, doorC, hasFlowerBox = true, shape = 'cottage' } = opts;
  H.ellipse(grid, 32, 61, 22, 4, PAL.shadow);

  // stone foundation
  H.rect(grid, 6, 52, 52, 8, PAL.stoneMid);
  shadeEdge(H, grid, 6, 52, 52, 8, PAL.stoneDark, PAL.stoneHi);

  // walls
  H.rect(grid, 8, 26, 48, 27, wall);
  for (let y = 27; y < 53; y += 5) H.rect(grid, 8, y, 48, 1, wallLo);
  H.rect(grid, 8, 26, 2, 27, wallLo); H.rect(grid, 54, 26, 2, 27, wallLo);

  // roof (stacked bands narrowing to a ridge, with shingle rows)
  const roofTop = 4, roofBase = 28, apexY = roofTop;
  for (let y = apexY; y < roofBase; y++) {
    const t = (y - apexY) / (roofBase - apexY);
    const w = 4 + t * 30;
    H.rect(grid, Math.round(32 - w), y, Math.round(w * 2), 1, (y % 3 === 0) ? roofLo : roof);
  }
  H.rect(grid, 30, apexY - 2, 4, 4, roofLo); // ridge cap
  H.rect(grid, 6, roofBase - 2, 52, 3, roofLo); // eave shadow line

  // chimney + smoke
  H.rect(grid, 44, 10, 7, 16, PAL.stoneMid);
  H.rect(grid, 44, 10, 7, 2, PAL.stoneHi);
  H.circle(grid, 48, 6, 2, 'rgba(220,220,225,0.55)');
  H.circle(grid, 50, 2, 3, 'rgba(220,220,225,0.4)');

  // door
  H.rect(grid, 27, 38, 11, 15, doorC);
  H.rect(grid, 27, 38, 5, 15, PAL.woodLo);
  H.line(grid, 32, 38, 32, 53, PAL.outline);
  H.circle(grid, 35, 46, 1, PAL.gold);
  H.frame(grid, 26, 37, 13, 16, PAL.outline);

  // windows + flower boxes
  [[13, 34], [45, 34]].forEach(([wx, wy]) => {
    H.rect(grid, wx, wy, 8, 8, PAL.glassLight);
    H.line(grid, wx + 4, wy, wx + 4, wy + 8, trim);
    H.line(grid, wx, wy + 4, wx + 8, wy + 4, trim);
    H.frame(grid, wx - 1, wy - 1, 10, 10, trim);
    if (hasFlowerBox) {
      H.rect(grid, wx - 1, wy + 9, 10, 3, PAL.wood2);
      H.set(grid, wx + 1, wy + 8, PAL.flowerRed); H.set(grid, wx + 4, wy + 8, PAL.flowerYellow); H.set(grid, wx + 7, wy + 8, PAL.flowerPink);
    }
  });

  H.outlineSilhouette(grid, PAL.outline);
}

// ------------------------------------------------------------- HUMANOID ---
// 40x52. viewMode: 'front' (default, used facing down), 'back' (facing up),
// 'side' (facing left/right — engine flips horizontally for left).
function drawHumanoid(grid, H, o, viewMode = 'front') {
  const skin = o.skin || PAL.skin1, skinLo = o.skinLo || PAL.skin2, hair = o.hair || PAL.hairBrown,
        shirt = o.shirt || PAL.cloth_blue, shirtLo = o.shirtLo || PAL.cloth_blue, pants = o.pants || PAL.cloth_brown,
        hairStyle = o.hairStyle || 'short';
  const cx = 20;
  const legOffset = viewMode === 'side' ? 2 : 0;

  // legs
  H.rect(grid, cx - 7, 38, 6, 11, pants); H.rect(grid, cx + 1, 38 + legOffset, 6, 11 - legOffset, pants);
  H.rect(grid, cx - 7, 38, 2, 11, PAL.outline);
  H.rect(grid, cx - 7, 47, 6, 3, PAL.woodLo); H.rect(grid, cx + 1, 47 + legOffset, 6, 3, PAL.woodLo);

  // torso
  H.rect(grid, cx - 9, 24, 18, 15, shirt);
  H.rect(grid, cx - 9, 24, 4, 15, shirtLo);
  H.rect(grid, cx - 9, 24, 18, 2, o.shirtHi || PAL.cloth_white);

  // arms
  H.rect(grid, cx - 13, 25, 5, 11, skinLo); H.rect(grid, cx + 8, 25, 5, 11, skin);

  // head
  if (viewMode === 'back') {
    H.circle(grid, cx, 13, 10, hair);
    H.rect(grid, cx - 9, 20, 18, 5, hair);
  } else {
    H.circle(grid, cx, 13, 10, skin);
    H.circle(grid, cx - 4, 15, 3, skinLo);
    if (viewMode === 'front') { H.set(grid, cx - 3, 12, PAL.outline); H.set(grid, cx + 3, 12, PAL.outline); H.rect(grid, cx - 2, 17, 4, 1, o.mouth || PAL.skin3); }
    else { H.set(grid, cx + 4, 12, PAL.outline); }
    if (hairStyle === 'short') { H.rect(grid, cx - 9, 4, 18, 6, hair); H.rect(grid, cx - 10, 6, 3, 9, hair); H.rect(grid, cx + 7, 6, 3, 9, hair); }
    if (hairStyle === 'long') { H.rect(grid, cx - 9, 4, 18, 6, hair); H.rect(grid, cx - 11, 8, 4, 16, hair); H.rect(grid, cx + 7, 8, 4, 16, hair); }
    if (hairStyle === 'bald') { H.rect(grid, cx - 8, 5, 16, 3, hair); }
    if (o.beard) H.rect(grid, cx - 7, 17, 14, 5, o.beard);
  }
  if (o.hat) {
    H.rect(grid, cx - 9, 2, 18, 5, o.hat);
    if (o.hatTall) for (let i = 0; i < 9; i++) H.rect(grid, cx - 4 + i * 0.2, -8 - i, Math.max(1, 8 - i), 2, o.hat);
  }
  H.outlineSilhouette(grid, PAL.outline);
}

// ------------------------------------------------------------ CREATURES ---
// composed within the 40x52 box but drawn compact & low, near the feet.
function drawQuadruped(grid, H, body, belly, bodyHi) {
  const gy = 40;
  H.ellipse(grid, 20, 49, 14, 3, PAL.shadow);
  H.rect(grid, 6, gy - 10, 26, 12, body);
  H.rect(grid, 8, gy - 2, 22, 4, belly);
  H.rect(grid, gy - 32, gy - 10, 4, 4, bodyHi || body);
  [8, 13, 20, 25].forEach(x => H.rect(grid, x, gy, 3, 6, body));
  H.rect(grid, 26, gy - 20, 9, 12, body);
  H.circle(grid, 32, gy - 20, 6, body);
  H.set(grid, 34, gy - 22, PAL.outline);
  H.rect(grid, 4, gy - 8, 4, 3, body);
  H.outlineSilhouette(grid, PAL.outline);
}
function drawDragon(grid, H, body, wing, wingHi) {
  drawQuadruped(grid, H, body, wing);
  H.ellipse(grid, 16, 24, 10, 6, wing);
  H.ellipse(grid, 16, 24, 6, 3, wingHi || wing);
  H.set(grid, 35, 18, PAL.outline);
  H.outlineSilhouette(grid, PAL.outline);
}
function drawBird(grid, H, body) {
  H.ellipse(grid, 20, 47, 8, 2, PAL.shadow);
  H.circle(grid, 20, 38, 8, body);
  H.rect(grid, 26, 36, 5, 2, PAL.outline);
  H.rect(grid, 15, 45, 2, 3, PAL.outline); H.rect(grid, 22, 45, 2, 3, PAL.outline);
  H.set(grid, 24, 35, PAL.outline);
  H.outlineSilhouette(grid, PAL.outline);
}
function drawBlob(grid, H, body, hi) {
  H.ellipse(grid, 20, 47, 11, 3, PAL.shadow);
  H.circle(grid, 20, 38, 12, body);
  H.circle(grid, 15, 32, 5, hi || body);
  H.set(grid, 15, 36, PAL.outline); H.set(grid, 25, 36, PAL.outline);
  H.outlineSilhouette(grid, PAL.outline);
}
function drawShellCreature(grid, H, shell, skin) {
  H.ellipse(grid, 20, 47, 12, 3, PAL.shadow);
  H.circle(grid, 20, 37, 12, shell);
  H.circle(grid, 20, 37, 8, PAL.leaf2);
  H.circle(grid, 20, 34, 4, PAL.leafHi);
  H.rect(grid, 6, 40, 6, 4, skin); H.rect(grid, 28, 40, 6, 4, skin);
  H.rect(grid, 14, 26, 8, 8, skin);
  H.outlineSilhouette(grid, PAL.outline);
}
function drawSerpent(grid, H, body) {
  H.ellipse(grid, 20, 47, 10, 2, PAL.shadow);
  for (let i = 0; i < 7; i++) H.rect(grid, 10 + (i % 2) * 8, 12 + i * 5, 12, 6, body);
  H.set(grid, 16, 13, PAL.outline);
  H.outlineSilhouette(grid, PAL.outline);
}
function drawRat(grid, H, body) {
  H.ellipse(grid, 20, 47, 9, 2, PAL.shadow);
  H.rect(grid, 10, 38, 18, 8, body);
  H.circle(grid, 29, 38, 6, body);
  H.line(grid, 8, 46, 2, 44, PAL.outline);
  H.set(grid, 32, 36, PAL.outline);
  H.outlineSilhouette(grid, PAL.outline);
}

// ------------------------------------------------------------- ITEMS ------
// small UI/inventory icons, 16x16 @ scale2 (32 output) — untouched budget.
function drawSword(grid, H) { H.rect(grid, 7, 1, 2, 9, PAL.blade); H.set(grid, 6, 1, PAL.bladeDark); H.set(grid, 9, 1, PAL.bladeDark); H.rect(grid, 4, 10, 8, 2, PAL.hiltGold); H.rect(grid, 7, 12, 2, 4, PAL.hilt); }
function drawExcalibur(grid, H) { drawSword(grid, H); H.set(grid, 8, 11, PAL.potionBlue); H.rect(grid, 6, 0, 4, 1, PAL.cream); }
function drawBow(grid, H) { H.line(grid, 4, 1, 2, 8, PAL.wood2); H.line(grid, 2, 8, 4, 15, PAL.wood2); H.line(grid, 4, 1, 13, 8, PAL.bone); H.line(grid, 13, 8, 4, 15, PAL.bone); }
function drawCrossbow(grid, H) { H.rect(grid, 2, 7, 12, 2, PAL.wood2); H.rect(grid, 6, 2, 2, 13, PAL.wood1); H.line(grid, 6, 2, 1, 8, PAL.bone); H.line(grid, 8, 2, 13, 8, PAL.bone); }
function drawPitchfork(grid, H) { H.rect(grid, 7, 4, 2, 11, PAL.wood2); H.rect(grid, 4, 1, 2, 4, PAL.bladeDark); H.rect(grid, 7, 1, 2, 4, PAL.bladeDark); H.rect(grid, 10, 1, 2, 4, PAL.bladeDark); }
function drawMace(grid, H) { H.rect(grid, 7, 5, 2, 10, PAL.wood2); H.circle(grid, 8, 4, 4, PAL.stoneMid); for (let a = 0; a < 6; a++) H.set(grid, 8 + Math.round(4 * Math.cos(a)), 4 + Math.round(4 * Math.sin(a)), PAL.stoneDark); }
function drawClub(grid, H) {
  // a knobby wooden cudgel, not a lollipop: tapered handle, lumpy wide head.
  H.rect(grid, 7, 8, 2, 7, PAL.woodLo);
  H.blotch(grid, 8, 5, 5, PAL.wood1, 4);
  H.set(grid, 6, 3, PAL.wood3); H.set(grid, 10, 6, PAL.woodLo); H.set(grid, 7, 7, PAL.woodLo);
}
function drawArrow(grid, H, headColor) { H.rect(grid, 7, 4, 2, 10, PAL.arrowShaft); H.rect(grid, 5, 1, 6, 4, headColor); H.rect(grid, 5, 13, 2, 2, PAL.white); H.rect(grid, 9, 13, 2, 2, PAL.white); }
function drawFlamingArrow(grid, H) {
  drawArrow(grid, H, PAL.bladeDark);
  H.circle(grid, 8, 2, 3, PAL.flame);
  H.circle(grid, 8, 0, 2, PAL.flowerYellow);
  H.set(grid, 6, 1, PAL.flame); H.set(grid, 10, 1, PAL.flame);
}
function drawTripleArrow(grid, H) {
  [3, 8, 13].forEach((x, i) => {
    H.rect(grid, x, 5 + i % 2, 1, 9 - i % 2, PAL.arrowShaft);
    H.rect(grid, x - 1, 2 + i % 2, 3, 3, PAL.silver);
  });
}
function drawStunArrow(grid, H) {
  drawArrow(grid, H, PAL.potionBlue);
  H.line(grid, 2, 3, 4, 6, PAL.flowerYellow); H.line(grid, 4, 6, 2, 7, PAL.flowerYellow); H.line(grid, 2, 7, 4, 10, PAL.flowerYellow);
}
function drawPotion(grid, H, color) { H.rect(grid, 6, 1, 4, 3, PAL.wood2); H.circle(grid, 8, 10, 5, color); H.rect(grid, 5, 6, 6, 5, color); H.frame(grid, 5, 6, 6, 8, PAL.glassLight); }
function drawBroom(grid, H) {
  // handle up top, straw bristles fanning WIDE at the bottom (not the other
  // way around — a narrow-at-bottom fan just reads as a blob, not a broom).
  H.rect(grid, 7, 0, 2, 8, PAL.wood1);
  H.set(grid, 7, 0, PAL.wood3);
  const tips = [1, 3, 5, 7, 8, 10, 12, 14];
  tips.forEach((tx, i) => H.line(grid, 7 + (i % 2), 9, tx, 15, i % 2 === 0 ? PAL.gold : PAL.goldDark));
  H.rect(grid, 5, 8, 6, 2, PAL.woodLo);
}
function drawArmorPiece(grid, H, kind, gold) {
  const metal = gold ? PAL.gold : PAL.silver, metalLo = gold ? PAL.goldDark : PAL.stoneMid;
  if (kind === 'helmet') {
    H.circle(grid, 8, 7, 6, metal);
    H.rect(grid, 4, 9, 8, 2, metalLo);
    H.rect(grid, 7, 3, 2, 6, metalLo); // nose guard
    H.set(grid, 4, 6, PAL.glassLight);
  }
  if (kind === 'chest') {
    // rounded shoulders + a tapered waist so it reads as a torso, not a plaque.
    H.circle(grid, 4, 4, 2, metal); H.circle(grid, 12, 4, 2, metal);
    H.rect(grid, 3, 4, 10, 9, metal);
    H.rect(grid, 4, 12, 8, 2, metal);
    H.rect(grid, 6, 3, 4, 11, metalLo);
    H.set(grid, 5, 6, PAL.glassLight); H.set(grid, 11, 6, PAL.glassLight);
    H.outlineSilhouette(grid, PAL.outline);
  }
  if (kind === 'boots') {
    H.rect(grid, 3, 4, 3, 8, metal); H.rect(grid, 9, 4, 3, 8, metal);
    H.ellipse(grid, 4, 12, 3, 2, metal); H.ellipse(grid, 10, 12, 3, 2, metal); // curved toes
    H.rect(grid, 1, 12, 6, 2, metalLo); H.rect(grid, 7, 12, 6, 2, metalLo);
    H.line(grid, 1, 13, 7, 13, PAL.outline); H.line(grid, 7, 13, 13, 13, PAL.outline);
  }
}
function drawCoin(grid, H) { H.circle(grid, 8, 8, 6, PAL.gold); H.circle(grid, 8, 8, 4, PAL.goldDark); }
function drawScroll(grid, H) { H.rect(grid, 3, 4, 10, 8, PAL.bone); H.rect(grid, 2, 3, 2, 10, PAL.wood2); H.rect(grid, 12, 3, 2, 10, PAL.wood2); for (let y = 6; y < 11; y += 2) H.rect(grid, 5, y, 6, 1, PAL.hairBrown); }
function drawKey(grid, H) { H.circle(grid, 5, 5, 3, PAL.gold); H.rect(grid, 5, 5, 8, 2, PAL.gold); H.rect(grid, 11, 7, 1, 3, PAL.gold); H.rect(grid, 13, 7, 1, 3, PAL.gold); }
function drawChest(grid, H) { H.rect(grid, 2, 7, 12, 7, PAL.wood1); H.rect(grid, 2, 5, 12, 3, PAL.wood2); H.rect(grid, 7, 8, 2, 2, PAL.gold); H.frame(grid, 2, 5, 12, 9, PAL.outline); }
function drawBoat(grid, H) { H.rect(grid, 2, 6, 12, 4, PAL.wood1); H.rect(grid, 1, 9, 14, 3, PAL.wood2); H.rect(grid, 7, 1, 1, 6, PAL.wood2); H.rect(grid, 8, 1, 5, 4, PAL.cloth_white); }
function drawHorseIcon(grid, H) {
  H.rect(grid, 2, 7, 9, 5, PAL.mooseBrown); // body
  H.rect(grid, 9, 3, 4, 7, PAL.mooseBrown); // neck up to head
  H.circle(grid, 13, 3, 2, PAL.mooseBrown); // head
  H.line(grid, 9, 2, 11, 5, PAL.hairBlack); H.line(grid, 10, 1, 12, 4, PAL.hairBlack); // mane
  H.rect(grid, 3, 11, 2, 3, PAL.dirt2); H.rect(grid, 8, 11, 2, 3, PAL.dirt2); // legs
  H.line(grid, 2, 8, 0, 12, PAL.hairBlack); // tail
  H.set(grid, 14, 2, PAL.outline);
}
function drawBread(grid, H) {
  // an oblong loaf with diagonal slashes across the top.
  H.ellipse(grid, 8, 9, 6, 4, PAL.dirt1);
  H.ellipse(grid, 8, 7, 6, 4, PAL.gold);
  H.line(grid, 4, 6, 7, 3, PAL.dirt2); H.line(grid, 7, 7, 10, 4, PAL.dirt2); H.line(grid, 10, 8, 12, 6, PAL.dirt2);
}
function drawPie(grid, H) {
  // round, with a lattice crust clipped to the tin — no outer square frame,
  // or it just reads as a waffle/grate instead of a pie.
  H.circle(grid, 8, 9, 6, PAL.wood3);
  H.circle(grid, 8, 9, 5, PAL.roofRed);
  for (let i = -3; i <= 3; i += 2) H.line(grid, 8 + i, 5, 8 + i, 13, PAL.gold);
  H.line(grid, 3, 9, 13, 9, PAL.gold);
  for (let a = 0; a < 10; a++) {
    const ang = (a / 10) * Math.PI * 2;
    H.set(grid, Math.round(8 + Math.cos(ang) * 6), Math.round(9 + Math.sin(ang) * 6), PAL.wood1);
  }
}
function drawFish(grid, H) { H.circle(grid, 6, 8, 4, PAL.water3); H.rect(grid, 10, 6, 4, 4, PAL.water3); H.set(grid, 4, 7, PAL.outline); }
function drawGem(grid, H, color) { H.rect(grid, 5, 4, 6, 4, color); H.rect(grid, 3, 6, 10, 4, color); H.rect(grid, 5, 10, 6, 3, color); H.set(grid, 6, 6, PAL.cream); }

// ============================================================================
// REGISTER
// ============================================================================
const Sprites = {};
function reg(name, w, h, fn, scale) { Sprites[name] = PixelArt.build(name, w, h, fn, scale); }

function initSprites() {
  // terrain
  for (let v = 0; v < 6; v++) reg('t_grass' + v, 32, 32, (g, H) => drawGrass(g, H, v), 1);
  for (let v = 0; v < 3; v++) reg('t_road' + v, 32, 32, (g, H) => drawPath(g, H, v), 1);
  reg('t_road', 32, 32, (g, H) => drawPath(g, H, 0), 1);
  reg('t_stonepath', 32, 32, drawStonePath, 1);
  reg('t_water0', 32, 32, (g, H) => drawWater(g, H, 0), 1);
  reg('t_water1', 32, 32, (g, H) => drawWater(g, H, 1), 1);
  reg('t_sand', 32, 32, (g, H) => drawSand(g, H, 0), 1);
  reg('t_wood', 32, 32, drawWoodFloor, 1);
  reg('t_stonefloor', 32, 32, drawStoneFloor, 1);
  for (let v = 0; v < 3; v++) reg('t_snow' + v, 32, 32, (g, H) => drawSnow(g, H, v), 1);
  reg('t_snow', 32, 32, (g, H) => drawSnow(g, H, 0), 1);
  reg('t_hillrock', 32, 32, drawHillRock, 1);
  for (let v = 0; v < 3; v++) reg('t_forest' + v, 32, 32, (g, H) => drawForestFloor(g, H, v), 1);
  reg('t_forest', 32, 32, (g, H) => drawForestFloor(g, H, 0), 1);

  // scenery (tile overlays)
  reg('o_tree', 32, 32, (g, H) => drawTree(g, H), 1);
  reg('o_pine', 32, 32, drawPineTree, 1);
  reg('o_bush', 32, 32, drawBush, 1);
  for (let v = 0; v < 3; v++) reg('o_flowers' + v, 32, 32, (g, H) => drawFlowerPatch(g, H, v), 1);
  for (let v = 0; v < 3; v++) reg('o_tuft' + v, 32, 32, (g, H) => drawTallGrassTuft(g, H, v), 1);
  reg('o_rock', 32, 32, drawRockProp, 1);
  reg('o_sign', 32, 32, drawSign, 1);
  reg('o_well', 32, 32, drawWell, 1);
  reg('o_fence', 32, 32, drawFence, 1);
  reg('o_castlewall', 32, 32, drawCastleWall, 1);
  reg('o_castletower', 64, 64, drawCastleTower, 1);
  reg('o_snowyhill', 64, 64, drawSnowyHill, 1);
  reg('o_gatehouse', 64, 64, drawGatehouse, 1);

  // buildings (64x64)
  const B = {
    b_generic_red: { roof: PAL.roofRed, roofLo: PAL.roofRedLo, wall: PAL.bone, wallLo: PAL.stoneLight, trim: PAL.wood2, doorC: PAL.wood1 },
    b_generic_blue: { roof: PAL.roofBlue, roofLo: PAL.roofBlueLo, wall: PAL.bone, wallLo: PAL.stoneLight, trim: PAL.wood2, doorC: PAL.wood1 },
    b_generic_purple: { roof: PAL.roofPurple, roofLo: PAL.roofPurpleLo, wall: PAL.stoneLight, wallLo: PAL.stoneMid, trim: PAL.stoneDark, doorC: PAL.wood2 },
    b_generic_brown: { roof: PAL.roofBrown, roofLo: PAL.roofBrownLo, wall: PAL.wood1, wallLo: PAL.woodLo, trim: PAL.wood2, doorC: PAL.woodLo },
    b_tavern: { roof: PAL.roofBrown, roofLo: PAL.roofBrownLo, wall: PAL.dirt1, wallLo: PAL.dirtLo, trim: PAL.wood2, doorC: PAL.woodLo, hasFlowerBox: false },
    b_witch: { roof: PAL.cloth_witch, roofLo: PAL.roofPurpleLo, wall: PAL.stoneDark, wallLo: PAL.black, trim: PAL.cloth_witch, doorC: PAL.woodLo, hasFlowerBox: false },
    b_rich: { roof: PAL.gold, roofLo: PAL.goldDark, wall: PAL.cloth_white, wallLo: PAL.stoneLight, trim: PAL.gold, doorC: PAL.wood1 },
  };
  Object.entries(B).forEach(([key, opts]) => reg(key, 64, 64, (g, H) => drawBuilding(g, H, opts), 1));

  // player (directional)
  const playerOpts = { skin: PAL.skin1, skinLo: PAL.skin2, hair: PAL.hairBrown, hairStyle: 'short', shirt: PAL.cloth_green, shirtLo: '#2f5d33', pants: PAL.cloth_brown };
  reg('player_down', 40, 52, (g, H) => drawHumanoid(g, H, playerOpts, 'front'), 1);
  reg('player_up', 40, 52, (g, H) => drawHumanoid(g, H, playerOpts, 'back'), 1);
  reg('player_side', 40, 52, (g, H) => drawHumanoid(g, H, playerOpts, 'side'), 1);

  // villagers / NPCs (front view only)
  const npc = (key, opts) => reg(key, 40, 52, (g, H) => drawHumanoid(g, H, opts, 'front'), 1);
  npc('npc_farmer', { skin: PAL.skin2, skinLo: PAL.skin3, hair: PAL.hairBlonde, hairStyle: 'short', shirt: PAL.cloth_brown, shirtLo: PAL.woodLo, pants: PAL.dirt2, hat: PAL.wood1 });
  npc('npc_bob', { skin: PAL.skin1, skinLo: PAL.skin2, hair: PAL.hairGrey, hairStyle: 'bald', shirt: PAL.cloth_grey, shirtLo: PAL.stoneDark, pants: PAL.cloth_brown, beard: PAL.hairGrey });
  npc('npc_witch', { skin: PAL.skin3, skinLo: PAL.hairBlack, hair: PAL.hairBlack, hairStyle: 'long', shirt: PAL.cloth_witch, shirtLo: PAL.black, pants: PAL.cloth_black, hat: PAL.cloth_witch, hatTall: true });
  npc('npc_baker', { skin: PAL.skin1, skinLo: PAL.skin2, hair: PAL.hairRed, hairStyle: 'short', shirt: PAL.cloth_white, shirtLo: PAL.stoneLight, pants: PAL.cloth_white, hat: PAL.cloth_white });
  npc('npc_horace', { skin: PAL.skin2, skinLo: PAL.skin3, hair: PAL.hairBrown, hairStyle: 'short', shirt: PAL.cloth_purple, shirtLo: PAL.roofPurpleLo, pants: PAL.cloth_black, hat: PAL.cloth_black });
  npc('npc_bartender', { skin: PAL.skin2, skinLo: PAL.skin3, hair: PAL.hairBlack, hairStyle: 'bald', shirt: PAL.cloth_red, shirtLo: PAL.roofRedLo, pants: PAL.cloth_brown, beard: PAL.hairBlack });
  npc('npc_hermit', { skin: PAL.skin3, skinLo: PAL.hairBrown, hair: PAL.hairGrey, hairStyle: 'long', shirt: PAL.cloth_brown, shirtLo: PAL.woodLo, pants: PAL.cloth_brown, beard: PAL.hairGrey });
  npc('npc_ron', { skin: PAL.skin1, skinLo: PAL.skin2, hair: PAL.hairGrey, hairStyle: 'short', shirt: PAL.silver, shirtLo: PAL.stoneMid, pants: PAL.cloth_grey });
  npc('npc_george', { skin: PAL.skin2, skinLo: PAL.skin3, hair: PAL.hairBlack, hairStyle: 'short', shirt: PAL.cloth_gold, shirtLo: PAL.goldDark, pants: PAL.cloth_black });
  npc('npc_gramma', { skin: PAL.skin1, skinLo: PAL.skin2, hair: PAL.hairGrey, hairStyle: 'long', shirt: PAL.cloth_pink, shirtLo: '#b85f7d', pants: PAL.cloth_pink });
  npc('npc_larry', { skin: PAL.skin2, skinLo: PAL.skin3, hair: PAL.hairBlonde, hairStyle: 'short', shirt: PAL.cloth_pink, shirtLo: '#b85f7d', pants: PAL.cloth_purple });
  npc('npc_merlin', { skin: PAL.skin1, skinLo: PAL.skin2, hair: PAL.cloth_white, hairStyle: 'long', shirt: PAL.cloth_blue, shirtLo: PAL.roofBlueLo, pants: PAL.cloth_blue, beard: PAL.cloth_white, hat: PAL.cloth_purple, hatTall: true });
  npc('npc_guard', { skin: PAL.skin2, skinLo: PAL.skin3, hair: PAL.hairBlack, hairStyle: 'bald', shirt: PAL.stoneMid, shirtLo: PAL.stoneDark, pants: PAL.stoneDark, hat: PAL.silver });
  npc('npc_king', { skin: PAL.skin1, skinLo: PAL.skin2, hair: PAL.hairGrey, hairStyle: 'short', shirt: PAL.cloth_purple, shirtLo: PAL.roofPurpleLo, pants: PAL.cloth_gold, hat: PAL.gold, beard: PAL.hairGrey });
  npc('npc_queen', { skin: PAL.skin1, skinLo: PAL.skin2, hair: PAL.hairBlack, hairStyle: 'long', shirt: PAL.cloth_red, shirtLo: PAL.roofRedLo, pants: PAL.cloth_gold, hat: PAL.gold });
  npc('npc_todd', { skin: PAL.skin2, skinLo: PAL.skin3, hair: PAL.hairBrown, hairStyle: 'short', shirt: PAL.cloth_brown, shirtLo: PAL.woodLo, pants: PAL.cloth_brown, hat: PAL.wood1 });
  npc('npc_grace', { skin: PAL.skin1, skinLo: PAL.skin2, hair: PAL.hairGrey, hairStyle: 'long', shirt: PAL.cloth_green, shirtLo: PAL.leafLo, pants: PAL.cloth_green });
  npc('npc_lady_of_lake', { skin: PAL.dragonWhite, skinLo: PAL.water3, hair: PAL.potionBlue, hairStyle: 'long', shirt: PAL.water3, shirtLo: PAL.water2, pants: PAL.water2 });
  npc('npc_hubert', { skin: PAL.skin2, skinLo: PAL.skin3, hair: PAL.hairBrown, hairStyle: 'short', shirt: PAL.dirt1, shirtLo: PAL.dirtLo, pants: PAL.dirt2, hat: PAL.wood1 });
  npc('npc_knight', { skin: PAL.skin1, skinLo: PAL.skin2, hair: PAL.hairBrown, hairStyle: 'short', shirt: PAL.silver, shirtLo: PAL.stoneMid, pants: PAL.stoneMid, hat: PAL.silver });

  // enemies
  const enemy = (key, fn) => reg(key, 40, 52, fn, 1);
  enemy('e_babydragon', (g, H) => drawDragon(g, H, PAL.dragonGreen, PAL.leaf2, PAL.leafHi));
  enemy('e_mamadragon', (g, H) => drawDragon(g, H, PAL.dragonRed, PAL.roofRed, PAL.roofRedLo));
  enemy('e_snowdragon', (g, H) => drawDragon(g, H, PAL.dragonWhite, PAL.silver, PAL.stoneHi));
  enemy('e_ogre', (g, H) => drawHumanoid(g, H, { skin: PAL.ogreGreen, skinLo: PAL.leafLo, hair: PAL.hairBlack, hairStyle: 'bald', shirt: PAL.cloth_brown, shirtLo: PAL.woodLo, pants: PAL.cloth_brown }, 'front'));
  enemy('e_babyogre', (g, H) => drawHumanoid(g, H, { skin: PAL.ogreGreen, skinLo: PAL.leafLo, hair: PAL.hairBlack, hairStyle: 'bald', shirt: PAL.cloth_brown, shirtLo: PAL.woodLo, pants: PAL.cloth_brown }, 'front'));
  enemy('e_giant', (g, H) => drawHumanoid(g, H, { skin: PAL.skin3, skinLo: PAL.hairBrown, hair: PAL.hairBrown, hairStyle: 'short', shirt: PAL.cloth_grey, shirtLo: PAL.stoneDark, pants: PAL.cloth_grey }, 'front'));
  enemy('e_goblin', (g, H) => drawHumanoid(g, H, { skin: PAL.goblinGreen, skinLo: PAL.leafLo, hair: PAL.hairBlack, hairStyle: 'bald', shirt: PAL.cloth_brown, shirtLo: PAL.woodLo, pants: PAL.cloth_brown }, 'front'));
  enemy('e_babygoblin', (g, H) => drawHumanoid(g, H, { skin: PAL.goblinGreen, skinLo: PAL.leafLo, hair: PAL.hairBlack, hairStyle: 'bald', shirt: PAL.cloth_brown, shirtLo: PAL.woodLo, pants: PAL.cloth_brown }, 'front'));
  enemy('e_vegetablelamb', (g, H) => drawQuadruped(g, H, PAL.leaf2, PAL.leaf3, PAL.leafHi));
  enemy('e_pig', (g, H) => drawQuadruped(g, H, PAL.cloth_pink, PAL.skin1, PAL.flowerPink));
  enemy('e_frogbear', (g, H) => drawQuadruped(g, H, PAL.bearBrown, PAL.serpentGreen));
  enemy('e_mamabear', (g, H) => drawQuadruped(g, H, PAL.bearBrown2, PAL.bearBrown));
  enemy('e_cub', (g, H) => drawQuadruped(g, H, PAL.bearBrown, PAL.bearBrown2));
  enemy('e_centicore', (g, H) => drawQuadruped(g, H, PAL.dirt1, PAL.bone));
  enemy('e_chicken', (g, H) => drawBird(g, H, PAL.bone));
  enemy('e_serpent', (g, H) => drawSerpent(g, H, PAL.serpentGreen));
  enemy('e_toad', (g, H) => drawBlob(g, H, PAL.toadGreen, PAL.leafHi));
  enemy('e_crow', (g, H) => drawBird(g, H, PAL.crow));
  enemy('e_tortoise', (g, H) => drawShellCreature(g, H, PAL.tortoiseGreen, PAL.leaf2));
  enemy('e_rat', (g, H) => drawRat(g, H, PAL.ratGrey));
  enemy('e_moose', (g, H) => drawQuadruped(g, H, PAL.mooseBrown, PAL.dirt2));
  enemy('e_ghost', (g, H) => drawBlob(g, H, PAL.ghostWhite, PAL.snow));
  enemy('e_bushmonster', (g, H) => drawBlob(g, H, PAL.leaf1, PAL.leafHi));
  enemy('e_snowmonster', (g, H) => drawBlob(g, H, PAL.snow, PAL.snowLo));
  enemy('e_shark', (g, H) => drawQuadruped(g, H, PAL.stoneMid, PAL.cloth_white));
  enemy('e_soldier', (g, H) => drawHumanoid(g, H, { skin: PAL.skin1, skinLo: PAL.skin2, hair: PAL.hairBlack, hairStyle: 'bald', shirt: PAL.stoneMid, shirtLo: PAL.stoneDark, pants: PAL.stoneDark, hat: PAL.silver }, 'front'));
  enemy('e_archer', (g, H) => drawHumanoid(g, H, { skin: PAL.skin1, skinLo: PAL.skin2, hair: PAL.hairBrown, hairStyle: 'short', shirt: PAL.cloth_green, shirtLo: PAL.leafLo, pants: PAL.dirt2 }, 'front'));

  // items (16x16 @ scale2)
  reg('i_sword', 16, 16, drawSword, 2);
  reg('i_excalibur', 16, 16, drawExcalibur, 2);
  reg('i_bow', 16, 16, drawBow, 2);
  reg('i_crossbow', 16, 16, drawCrossbow, 2);
  reg('i_pitchfork', 16, 16, drawPitchfork, 2);
  reg('i_mace', 16, 16, drawMace, 2);
  reg('i_club', 16, 16, drawClub, 2);
  reg('i_arrow', 16, 16, (g, H) => drawArrow(g, H, PAL.bladeDark), 2);
  reg('i_arrow_flame', 16, 16, drawFlamingArrow, 2);
  reg('i_arrow_triple', 16, 16, drawTripleArrow, 2);
  reg('i_arrow_stun', 16, 16, drawStunArrow, 2);
  reg('i_potion_red', 16, 16, (g, H) => drawPotion(g, H, PAL.potionRed), 2);
  reg('i_potion_green', 16, 16, (g, H) => drawPotion(g, H, PAL.potionGreen), 2);
  reg('i_potion_blue', 16, 16, (g, H) => drawPotion(g, H, PAL.potionBlue), 2);
  reg('i_potion_purple', 16, 16, (g, H) => drawPotion(g, H, PAL.potionPurple), 2);
  reg('i_potion_teal', 16, 16, (g, H) => drawPotion(g, H, PAL.potionTeal), 2);
  reg('i_potion_orange', 16, 16, (g, H) => drawPotion(g, H, PAL.potionOrange), 2);
  reg('i_potion_yellow', 16, 16, (g, H) => drawPotion(g, H, PAL.potionYellow), 2);
  reg('i_broom', 16, 16, drawBroom, 2);
  reg('i_helmet', 16, 16, (g, H) => drawArmorPiece(g, H, 'helmet'), 2);
  reg('i_chest', 16, 16, (g, H) => drawArmorPiece(g, H, 'chest'), 2);
  reg('i_boots', 16, 16, (g, H) => drawArmorPiece(g, H, 'boots'), 2);
  reg('i_helmet_gold', 16, 16, (g, H) => drawArmorPiece(g, H, 'helmet', true), 2);
  reg('i_chest_gold', 16, 16, (g, H) => drawArmorPiece(g, H, 'chest', true), 2);
  reg('i_coin', 16, 16, drawCoin, 2);
  reg('i_scroll', 16, 16, drawScroll, 2);
  reg('i_key', 16, 16, drawKey, 2);
  reg('i_chestbox', 16, 16, drawChest, 2);
  reg('i_boat', 16, 16, drawBoat, 2);
  reg('i_horse', 16, 16, drawHorseIcon, 2);
  reg('i_bread', 16, 16, drawBread, 2);
  reg('i_pie', 16, 16, drawPie, 2);
  reg('i_fish', 16, 16, drawFish, 2);
  reg('i_gem_blue', 16, 16, (g, H) => drawGem(g, H, PAL.potionBlue), 2);
  reg('i_hilt', 16, 16, (g, H) => { H.rect(g, 7, 4, 2, 10, PAL.hilt); H.rect(g, 4, 3, 8, 2, PAL.hiltGold); H.rect(g, 7, 1, 2, 2, PAL.stoneDark); }, 2);
}

function drawSprite(ctx, key, x, y, w = TILE, h = TILE, flip = false) {
  const c = Sprites[key];
  if (!c) return;
  ctx.save();
  if (flip) { ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(c, 0, 0, w, h); }
  else ctx.drawImage(c, x, y, w, h);
  ctx.restore();
}
