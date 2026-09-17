// ============================================================================
// SPRITES.JS — parameterized pixel-art templates + the concrete sprite table.
// Everything is generated at load time onto tiny grids (16x16 or 32x32)
// then upscaled with nearest-neighbor. TILE = 32px on screen.
// ============================================================================
const TILE = 32;

function outlineFill(H, grid, x, y, w, h, fillColor) {
  H.rect(grid, x, y, w, h, fillColor);
}

// ---------------------------------------------------------------- TERRAIN --
function drawGrass(grid, H, variant = 0) {
  H.rect(grid, 0, 0, 16, 16, variant === 1 ? PAL.grass2 : PAL.grass1);
  const specks = variant === 1 ? 6 : 4;
  for (let i = 0; i < specks; i++) {
    const x = (i * 5 + variant * 3) % 14 + 1, y = (i * 7 + variant * 2) % 14 + 1;
    H.set(grid, x, y, PAL.grass3);
  }
}
function drawDirtRoad(grid, H) {
  H.rect(grid, 0, 0, 16, 16, PAL.road1);
  for (let i = 0; i < 10; i++) H.set(grid, (i * 3 + 2) % 16, (i * 5 + 1) % 16, PAL.road2);
}
function drawStonePath(grid, H) {
  H.rect(grid, 0, 0, 16, 16, PAL.stoneMid);
  H.frame(grid, 0, 0, 8, 8, PAL.stoneDark);
  H.frame(grid, 8, 0, 8, 8, PAL.stoneDark);
  H.frame(grid, 0, 8, 8, 8, PAL.stoneDark);
  H.frame(grid, 8, 8, 8, 8, PAL.stoneDark);
}
function drawWater(grid, H, frame = 0) {
  H.rect(grid, 0, 0, 16, 16, PAL.water1);
  for (let y = 2; y < 16; y += 4) {
    for (let x = 0; x < 16; x++) {
      if ((x + frame * 2) % 8 < 4) H.set(grid, x, y, PAL.water3);
    }
  }
}
function drawSand(grid, H) {
  H.rect(grid, 0, 0, 16, 16, PAL.sand);
  for (let i = 0; i < 8; i++) H.set(grid, (i * 5) % 16, (i * 3 + 4) % 16, PAL.road2);
}
function drawWoodFloor(grid, H) {
  H.rect(grid, 0, 0, 16, 16, PAL.wood1);
  for (let y = 0; y < 16; y += 4) H.rect(grid, 0, y, 16, 1, PAL.wood2);
}
function drawStoneFloor(grid, H) {
  H.rect(grid, 0, 0, 16, 16, PAL.stoneLight);
  H.rect(grid, 0, 7, 16, 1, PAL.stoneMid);
  H.rect(grid, 7, 0, 1, 16, PAL.stoneMid);
}
function drawSnow(grid, H) {
  H.rect(grid, 0, 0, 16, 16, PAL.snow);
  for (let i = 0; i < 5; i++) H.set(grid, (i * 6 + 2) % 16, (i * 4 + 3) % 16, PAL.stoneLight);
}
function drawHillRock(grid, H) {
  H.rect(grid, 0, 0, 16, 16, PAL.stoneMid);
  H.rect(grid, 1, 1, 6, 5, PAL.stoneDark);
  H.rect(grid, 9, 8, 6, 6, PAL.stoneDark);
  H.rect(grid, 0, 12, 16, 4, PAL.grass2);
}
function drawForestFloor(grid, H) {
  H.rect(grid, 0, 0, 16, 16, PAL.grass2);
  for (let i = 0; i < 6; i++) H.set(grid, (i * 4 + 1) % 16, (i * 6 + 3) % 16, PAL.leaf3);
}

// ------------------------------------------------------------- SCENERY ----
function drawTree(grid, H) {
  H.rect(grid, 6, 9, 4, 6, PAL.wood2);
  H.circle(grid, 8, 5, 6, PAL.leaf1);
  H.circle(grid, 6, 4, 4, PAL.leaf2);
  H.circle(grid, 10, 6, 4, PAL.leaf2);
}
function drawBush(grid, H) {
  H.circle(grid, 8, 10, 5, PAL.leaf2);
  H.circle(grid, 5, 11, 3, PAL.leaf1);
  H.circle(grid, 11, 11, 3, PAL.leaf1);
}
function drawRockProp(grid, H) {
  H.rect(grid, 3, 8, 10, 6, PAL.stoneMid);
  H.rect(grid, 4, 6, 7, 4, PAL.stoneLight);
}
function drawSign(grid, H) {
  H.rect(grid, 7, 6, 2, 9, PAL.wood2);
  H.rect(grid, 2, 2, 12, 6, PAL.wood1);
  H.frame(grid, 2, 2, 12, 6, PAL.wood2);
}
function drawWell(grid, H) {
  H.circle(grid, 8, 10, 6, PAL.stoneMid);
  H.circle(grid, 8, 10, 4, PAL.water2);
  H.rect(grid, 2, 2, 2, 8, PAL.wood2);
  H.rect(grid, 12, 2, 2, 8, PAL.wood2);
  H.rect(grid, 2, 1, 12, 2, PAL.wood1);
}
function drawFence(grid, H) {
  H.rect(grid, 1, 4, 2, 10, PAL.wood2);
  H.rect(grid, 13, 4, 2, 10, PAL.wood2);
  H.rect(grid, 0, 6, 16, 2, PAL.wood1);
  H.rect(grid, 0, 10, 16, 2, PAL.wood1);
}
function drawCastleWall(grid, H) {
  H.rect(grid, 0, 0, 16, 16, PAL.stoneMid);
  H.rect(grid, 0, 0, 16, 3, PAL.stoneDark);
  for (let x = 0; x < 16; x += 4) H.rect(grid, x, 0, 2, 2, PAL.stoneLight);
  H.frame(grid, 0, 4, 8, 6, PAL.stoneDark);
  H.frame(grid, 8, 10, 8, 6, PAL.stoneDark);
}
function drawCastleTower(grid, H) {
  H.rect(grid, 2, 4, 12, 12, PAL.stoneMid);
  H.rect(grid, 0, 0, 16, 5, PAL.roofPurple);
  H.rect(grid, 6, 8, 4, 4, PAL.stoneDark);
  for (let x = 0; x < 16; x += 4) H.rect(grid, x, 4, 2, 2, PAL.stoneLight);
}

function drawBuilding(grid, H, roof, wall) {
  // 32x32 building prop (bigger than a tile)
  H.rect(grid, 2, 14, 28, 18, wall);
  H.frame(grid, 2, 14, 28, 18, PAL.outline);
  // roof (triangle-ish)
  for (let i = 0; i < 16; i++) {
    H.rect(grid, 16 - i, 2 + i, 2 * i + 2, 2, roof);
  }
  H.rect(grid, 13, 20, 6, 12, PAL.wood2); // door
  H.rect(grid, 6, 18, 5, 5, PAL.glassLight); // window
  H.frame(grid, 6, 18, 5, 5, PAL.wood2);
  H.rect(grid, 21, 18, 5, 5, PAL.glassLight);
  H.frame(grid, 21, 18, 5, 5, PAL.wood2);
}

function drawShopSign(grid, H, iconColor) {
  H.rect(grid, 14, 0, 4, 14, PAL.wood2);
  H.circle(grid, 16, 16, 10, PAL.bone);
  H.frame(grid, 16 - 10, 6, 20, 20, PAL.outline);
  H.circle(grid, 16, 16, 6, iconColor);
}

// ------------------------------------------------------------- HUMANOID ---
function drawHumanoid(grid, H, o) {
  const skin = o.skin || PAL.skin1, hair = o.hair || PAL.hairBrown,
        shirt = o.shirt || PAL.cloth_blue, pants = o.pants || PAL.cloth_brown,
        hairStyle = o.hairStyle || 'short';
  // legs
  H.rect(grid, 5, 12, 2, 3, pants); H.rect(grid, 9, 12, 2, 3, pants);
  H.rect(grid, 5, 15, 2, 1, PAL.outline); H.rect(grid, 9, 15, 2, 1, PAL.outline);
  // torso
  H.rect(grid, 4, 8, 8, 5, shirt);
  // arms
  H.rect(grid, 2, 8, 2, 4, skin); H.rect(grid, 12, 8, 2, 4, skin);
  // neck+head
  H.rect(grid, 6, 6, 4, 2, skin);
  H.rect(grid, 4, 2, 8, 5, skin);
  H.set(grid, 6, 4, PAL.outline); H.set(grid, 9, 4, PAL.outline); // eyes
  // hair
  if (hairStyle === 'short') { H.rect(grid, 3, 1, 10, 2, hair); H.rect(grid, 3, 1, 2, 3, hair); H.rect(grid, 11, 1, 2, 3, hair); }
  if (hairStyle === 'long') { H.rect(grid, 3, 1, 10, 2, hair); H.rect(grid, 2, 2, 2, 6, hair); H.rect(grid, 12, 2, 2, 6, hair); }
  if (hairStyle === 'bald') { /* nothing */ }
  if (o.hat) { H.rect(grid, 3, 0, 10, 2, o.hat); if (o.hatTall) H.rect(grid, 5, -2, 6, 3, o.hat); }
  if (o.beard) { H.rect(grid, 4, 6, 8, 2, o.beard); }
  if (o.accessoryTop) o.accessoryTop(grid, H);
  return grid;
}

function drawWizardHat(grid, H, color) {
  H.rect(grid, 3, -1, 10, 2, PAL.outline);
  for (let i = 0; i < 6; i++) H.rect(grid, 6 - i, -1 - i, 2 + 2 * i, 2, color);
}

// ------------------------------------------------------------ CREATURES ---
function drawQuadruped(grid, H, body, belly, size = 1) {
  H.rect(grid, 2, 9, 12, 5, body);
  H.rect(grid, 3, 12, 10, 2, belly);
  H.rect(grid, 2, 13, 2, 3, body); H.rect(grid, 12, 13, 2, 3, body);
  H.rect(grid, 4, 13, 2, 3, body); H.rect(grid, 10, 13, 2, 3, body);
  H.rect(grid, 11, 4, 5, 6, body); // neck/head
  H.circle(grid, 13, 5, 3, body);
  H.set(grid, 14, 4, PAL.outline);
  H.rect(grid, 1, 8, 2, 1, body); // tail base
}
function drawDragon(grid, H, body, wing) {
  drawQuadruped(grid, H, body, wing);
  H.rect(grid, 4, 4, 8, 5, wing); // wings
  H.frame(grid, 4, 4, 8, 5, PAL.outline);
  H.line(grid, 1, 9, -2, 6, body); // tail flick (may clip, fine)
  H.set(grid, 15, 3, PAL.outline);
}
function drawBird(grid, H, body) {
  H.circle(grid, 8, 9, 4, body);
  H.rect(grid, 11, 8, 3, 1, PAL.outline);
  H.rect(grid, 6, 12, 1, 2, PAL.outline); H.rect(grid, 9, 12, 1, 2, PAL.outline);
  H.set(grid, 10, 7, PAL.outline);
}
function drawBlob(grid, H, body) {
  H.circle(grid, 8, 9, 6, body);
  H.set(grid, 6, 8, PAL.outline); H.set(grid, 10, 8, PAL.outline);
}
function drawShellCreature(grid, H, shell, skin) {
  H.circle(grid, 8, 9, 6, shell);
  H.circle(grid, 8, 9, 4, PAL.leaf2);
  H.rect(grid, 2, 10, 3, 2, skin); H.rect(grid, 11, 10, 3, 2, skin);
  H.rect(grid, 6, 4, 4, 4, skin);
}
function drawSerpent(grid, H, body) {
  for (let i = 0; i < 6; i++) H.rect(grid, (i % 2) * 4 + 2, 2 + i * 2, 6, 3, body);
  H.set(grid, 6, 3, PAL.outline);
}
function drawRat(grid, H, body) {
  H.rect(grid, 3, 9, 9, 4, body);
  H.circle(grid, 12, 9, 3, body);
  H.rect(grid, 2, 12, 1, 3, PAL.outline);
  H.set(grid, 13, 8, PAL.outline);
}

// ------------------------------------------------------------- ITEMS ------
function drawSword(grid, H) {
  H.rect(grid, 7, 1, 2, 9, PAL.blade);
  H.set(grid, 6, 1, PAL.bladeDark); H.set(grid, 9, 1, PAL.bladeDark);
  H.rect(grid, 4, 10, 8, 2, PAL.hiltGold);
  H.rect(grid, 7, 12, 2, 4, PAL.hilt);
}
function drawExcalibur(grid, H) {
  drawSword(grid, H);
  H.set(grid, 8, 11, PAL.potionBlue);
  H.rect(grid, 6, 0, 4, 1, PAL.cream);
}
function drawBow(grid, H) {
  H.line(grid, 4, 1, 2, 8, PAL.wood2); H.line(grid, 2, 8, 4, 15, PAL.wood2);
  H.line(grid, 4, 1, 13, 8, PAL.bone); H.line(grid, 13, 8, 4, 15, PAL.bone);
}
function drawCrossbow(grid, H) {
  H.rect(grid, 2, 7, 12, 2, PAL.wood2);
  H.rect(grid, 6, 2, 2, 13, PAL.wood1);
  H.line(grid, 6, 2, 1, 8, PAL.bone); H.line(grid, 8, 2, 13, 8, PAL.bone);
}
function drawPitchfork(grid, H) {
  H.rect(grid, 7, 4, 2, 11, PAL.wood2);
  H.rect(grid, 4, 1, 2, 4, PAL.bladeDark); H.rect(grid, 7, 1, 2, 4, PAL.bladeDark); H.rect(grid, 10, 1, 2, 4, PAL.bladeDark);
}
function drawMace(grid, H) {
  H.rect(grid, 7, 5, 2, 10, PAL.wood2);
  H.circle(grid, 8, 4, 4, PAL.stoneMid);
  for (let a = 0; a < 6; a++) H.set(grid, 8 + Math.round(4 * Math.cos(a)), 4 + Math.round(4 * Math.sin(a)), PAL.stoneDark);
}
function drawClub(grid, H) {
  H.rect(grid, 7, 6, 2, 9, PAL.wood2);
  H.rect(grid, 5, 1, 6, 6, PAL.wood1);
}
function drawArrow(grid, H, headColor) {
  H.rect(grid, 7, 4, 2, 10, PAL.arrowShaft);
  H.rect(grid, 5, 1, 6, 4, headColor);
  H.rect(grid, 5, 13, 2, 2, PAL.white); H.rect(grid, 9, 13, 2, 2, PAL.white);
}
function drawPotion(grid, H, color) {
  H.rect(grid, 6, 1, 4, 3, PAL.wood2);
  H.circle(grid, 8, 10, 5, color);
  H.rect(grid, 5, 6, 6, 5, color);
  H.frame(grid, 5, 6, 6, 8, PAL.glassLight);
}
function drawArmorPiece(grid, H, kind) {
  if (kind === 'helmet') { H.circle(grid, 8, 7, 6, PAL.silver); H.rect(grid, 4, 9, 8, 2, PAL.stoneDark); }
  if (kind === 'chest') { H.rect(grid, 3, 3, 10, 10, PAL.silver); H.rect(grid, 6, 3, 4, 10, PAL.stoneMid); }
  if (kind === 'boots') { H.rect(grid, 3, 6, 4, 8, PAL.hilt); H.rect(grid, 9, 6, 4, 8, PAL.hilt); }
}
function drawCoin(grid, H) {
  H.circle(grid, 8, 8, 6, PAL.gold);
  H.circle(grid, 8, 8, 4, PAL.goldDark);
}
function drawScroll(grid, H) {
  H.rect(grid, 3, 4, 10, 8, PAL.bone);
  H.rect(grid, 2, 3, 2, 10, PAL.wood2); H.rect(grid, 12, 3, 2, 10, PAL.wood2);
  for (let y = 6; y < 11; y += 2) H.rect(grid, 5, y, 6, 1, PAL.hairBrown);
}
function drawKey(grid, H) {
  H.circle(grid, 5, 5, 3, PAL.gold);
  H.rect(grid, 5, 5, 8, 2, PAL.gold);
  H.rect(grid, 11, 7, 1, 3, PAL.gold); H.rect(grid, 13, 7, 1, 3, PAL.gold);
}
function drawChest(grid, H) {
  H.rect(grid, 2, 7, 12, 7, PAL.wood1);
  H.rect(grid, 2, 5, 12, 3, PAL.wood2);
  H.rect(grid, 7, 8, 2, 2, PAL.gold);
  H.frame(grid, 2, 5, 12, 9, PAL.outline);
}
function drawBoat(grid, H) {
  H.rect(grid, 2, 6, 12, 4, PAL.wood1);
  H.rect(grid, 1, 9, 14, 3, PAL.wood2);
  H.rect(grid, 7, 1, 1, 6, PAL.wood2);
  H.rect(grid, 8, 1, 5, 4, PAL.cloth_white);
}
function drawHorse(grid, H) {
  drawQuadruped(grid, H, PAL.mooseBrown, PAL.dirt1);
  H.rect(grid, 12, 2, 3, 3, PAL.hairBlack);
}
function drawBread(grid, H) {
  H.circle(grid, 8, 9, 6, PAL.dirt1);
  H.circle(grid, 8, 7, 5, PAL.gold);
  H.line(grid, 4, 7, 12, 7, PAL.dirt2);
}
function drawPie(grid, H) {
  H.circle(grid, 8, 9, 6, PAL.roofRed);
  H.circle(grid, 8, 8, 5, PAL.gold);
  H.line(grid, 8, 3, 8, 13, PAL.dirt2); H.line(grid, 3, 9, 13, 9, PAL.dirt2);
}
function drawFish(grid, H) {
  H.circle(grid, 6, 8, 4, PAL.water3);
  H.rect(grid, 10, 6, 4, 4, PAL.water3);
  H.set(grid, 4, 7, PAL.outline);
}
function drawGem(grid, H, color) {
  H.rect(grid, 5, 4, 6, 4, color);
  H.rect(grid, 3, 6, 10, 4, color);
  H.rect(grid, 5, 10, 6, 3, color);
  H.set(grid, 6, 6, PAL.cream);
}

// ============================================================================
// REGISTER — build the whole sprite atlas up front.
// ============================================================================
const Sprites = {};

function reg(name, w, h, fn, scale) { Sprites[name] = PixelArt.build(name, w, h, fn, scale); }

function initSprites() {
  // terrain (32px tiles, 16px grid x2)
  reg('t_grass0', 16, 16, (g, H) => drawGrass(g, H, 0), 2);
  reg('t_grass1', 16, 16, (g, H) => drawGrass(g, H, 1), 2);
  reg('t_road', 16, 16, drawDirtRoad, 2);
  reg('t_stonepath', 16, 16, drawStonePath, 2);
  reg('t_water0', 16, 16, (g, H) => drawWater(g, H, 0), 2);
  reg('t_water1', 16, 16, (g, H) => drawWater(g, H, 1), 2);
  reg('t_sand', 16, 16, drawSand, 2);
  reg('t_wood', 16, 16, drawWoodFloor, 2);
  reg('t_stonefloor', 16, 16, drawStoneFloor, 2);
  reg('t_snow', 16, 16, drawSnow, 2);
  reg('t_hillrock', 16, 16, drawHillRock, 2);
  reg('t_forest', 16, 16, drawForestFloor, 2);

  // scenery
  reg('o_tree', 16, 16, drawTree, 2);
  reg('o_bush', 16, 16, drawBush, 2);
  reg('o_rock', 16, 16, drawRockProp, 2);
  reg('o_sign', 16, 16, drawSign, 2);
  reg('o_well', 16, 16, drawWell, 2);
  reg('o_fence', 16, 16, drawFence, 2);
  reg('o_castlewall', 16, 16, drawCastleWall, 2);
  reg('o_castletower', 16, 16, drawCastleTower, 2);

  reg('b_generic_red', 32, 32, (g, H) => drawBuilding(g, H, PAL.roofRed, PAL.bone), 2);
  reg('b_generic_blue', 32, 32, (g, H) => drawBuilding(g, H, PAL.roofBlue, PAL.bone), 2);
  reg('b_generic_purple', 32, 32, (g, H) => drawBuilding(g, H, PAL.roofPurple, PAL.stoneLight), 2);
  reg('b_generic_brown', 32, 32, (g, H) => drawBuilding(g, H, PAL.roofBrown, PAL.wood1), 2);
  reg('b_tavern', 32, 32, (g, H) => drawBuilding(g, H, PAL.roofBrown, PAL.dirt1), 2);
  reg('b_witch', 32, 32, (g, H) => drawBuilding(g, H, PAL.cloth_witch, PAL.stoneDark), 2);
  reg('b_rich', 32, 32, (g, H) => drawBuilding(g, H, PAL.gold, PAL.cloth_white), 2);

  reg('sign_weapon', 32, 32, (g, H) => drawShopSign(g, H, PAL.bladeDark), 2);
  reg('sign_potion', 32, 32, (g, H) => drawShopSign(g, H, PAL.potionGreen), 2);
  reg('sign_food', 32, 32, (g, H) => drawShopSign(g, H, PAL.gold), 2);
  reg('sign_armor', 32, 32, (g, H) => drawShopSign(g, H, PAL.silver), 2);
  reg('sign_cart', 32, 32, (g, H) => drawShopSign(g, H, PAL.wood1), 2);

  // player (4 simple frames just reuse one for now, direction via flip)
  reg('player', 16, 16, (g, H) => drawHumanoid(g, H, { skin: PAL.skin1, hair: PAL.hairBrown, hairStyle: 'short', shirt: PAL.cloth_green, pants: PAL.cloth_brown }), 2);

  // villagers / NPCs
  reg('npc_farmer', 16, 16, (g, H) => drawHumanoid(g, H, { skin: PAL.skin2, hair: PAL.hairBlonde, hairStyle: 'short', shirt: PAL.cloth_brown, pants: PAL.dirt2, hat: PAL.wood1 }), 2);
  reg('npc_bob', 16, 16, (g, H) => drawHumanoid(g, H, { skin: PAL.skin1, hair: PAL.hairGrey, hairStyle: 'bald', shirt: PAL.cloth_grey, pants: PAL.cloth_brown, beard: PAL.hairGrey }), 2);
  reg('npc_witch', 16, 16, (g, H) => drawHumanoid(g, H, { skin: PAL.skin3, hair: PAL.hairBlack, hairStyle: 'long', shirt: PAL.cloth_witch, pants: PAL.cloth_black, hat: PAL.cloth_witch, hatTall: true }), 2);
  reg('npc_baker', 16, 16, (g, H) => drawHumanoid(g, H, { skin: PAL.skin1, hair: PAL.hairRed, hairStyle: 'short', shirt: PAL.cloth_white, pants: PAL.cloth_white, hat: PAL.cloth_white }), 2);
  reg('npc_horace', 16, 16, (g, H) => drawHumanoid(g, H, { skin: PAL.skin2, hair: PAL.hairBrown, hairStyle: 'short', shirt: PAL.cloth_purple, pants: PAL.cloth_black, hat: PAL.cloth_black }), 2);
  reg('npc_bartender', 16, 16, (g, H) => drawHumanoid(g, H, { skin: PAL.skin2, hair: PAL.hairBlack, hairStyle: 'bald', shirt: PAL.cloth_red, pants: PAL.cloth_brown, beard: PAL.hairBlack }), 2);
  reg('npc_hermit', 16, 16, (g, H) => drawHumanoid(g, H, { skin: PAL.skin3, hair: PAL.hairGrey, hairStyle: 'long', shirt: PAL.cloth_brown, pants: PAL.cloth_brown, beard: PAL.hairGrey }), 2);
  reg('npc_ron', 16, 16, (g, H) => drawHumanoid(g, H, { skin: PAL.skin1, hair: PAL.hairGrey, hairStyle: 'short', shirt: PAL.silver, pants: PAL.cloth_grey }), 2);
  reg('npc_george', 16, 16, (g, H) => drawHumanoid(g, H, { skin: PAL.skin2, hair: PAL.hairBlack, hairStyle: 'short', shirt: PAL.cloth_gold, pants: PAL.cloth_black }), 2);
  reg('npc_gramma', 16, 16, (g, H) => drawHumanoid(g, H, { skin: PAL.skin1, hair: PAL.hairGrey, hairStyle: 'long', shirt: PAL.cloth_pink, pants: PAL.cloth_pink }), 2);
  reg('npc_larry', 16, 16, (g, H) => drawHumanoid(g, H, { skin: PAL.skin2, hair: PAL.hairBlonde, hairStyle: 'short', shirt: PAL.cloth_pink, pants: PAL.cloth_purple }), 2);
  reg('npc_merlin', 16, 16, (g, H) => drawHumanoid(g, H, { skin: PAL.skin1, hair: PAL.cloth_white, hairStyle: 'long', shirt: PAL.cloth_blue, pants: PAL.cloth_blue, beard: PAL.cloth_white, hat: PAL.cloth_purple, hatTall: true }), 2);
  reg('npc_guard', 16, 16, (g, H) => drawHumanoid(g, H, { skin: PAL.skin2, hair: PAL.hairBlack, hairStyle: 'bald', shirt: PAL.stoneMid, pants: PAL.stoneDark, hat: PAL.silver }), 2);
  reg('npc_king', 16, 16, (g, H) => drawHumanoid(g, H, { skin: PAL.skin1, hair: PAL.hairGrey, hairStyle: 'short', shirt: PAL.cloth_purple, pants: PAL.cloth_gold, hat: PAL.gold, beard: PAL.hairGrey }), 2);
  reg('npc_queen', 16, 16, (g, H) => drawHumanoid(g, H, { skin: PAL.skin1, hair: PAL.hairBlack, hairStyle: 'long', shirt: PAL.cloth_red, pants: PAL.cloth_gold, hat: PAL.gold }), 2);
  reg('npc_todd', 16, 16, (g, H) => drawHumanoid(g, H, { skin: PAL.skin2, hair: PAL.hairBrown, hairStyle: 'short', shirt: PAL.cloth_brown, pants: PAL.cloth_brown, hat: PAL.wood1 }), 2);
  reg('npc_grace', 16, 16, (g, H) => drawHumanoid(g, H, { skin: PAL.skin1, hair: PAL.hairGrey, hairStyle: 'long', shirt: PAL.cloth_green, pants: PAL.cloth_green }), 2);
  reg('npc_lady_of_lake', 16, 16, (g, H) => drawHumanoid(g, H, { skin: PAL.dragonWhite, hair: PAL.potionBlue, hairStyle: 'long', shirt: PAL.water3, pants: PAL.water2 }), 2);
  reg('npc_hubert', 16, 16, (g, H) => drawHumanoid(g, H, { skin: PAL.skin2, hair: PAL.hairBrown, hairStyle: 'short', shirt: PAL.dirt1, pants: PAL.dirt2, hat: PAL.wood1 }), 2);
  reg('npc_knight', 16, 16, (g, H) => drawHumanoid(g, H, { skin: PAL.skin1, hair: PAL.hairBrown, hairStyle: 'short', shirt: PAL.silver, pants: PAL.stoneMid, hat: PAL.silver }), 2);

  // enemies — small (32x32)
  reg('e_babydragon', 16, 16, (g, H) => drawDragon(g, H, PAL.dragonGreen, PAL.leaf2), 2);
  reg('e_mamadragon', 16, 16, (g, H) => drawDragon(g, H, PAL.dragonRed, PAL.roofRed), 2);
  reg('e_snowdragon', 16, 16, (g, H) => drawDragon(g, H, PAL.dragonWhite, PAL.silver), 2);
  reg('e_ogre', 16, 16, (g, H) => drawHumanoid(g, H, { skin: PAL.ogreGreen, hair: PAL.hairBlack, hairStyle: 'bald', shirt: PAL.cloth_brown, pants: PAL.cloth_brown }), 2);
  reg('e_babyogre', 16, 16, (g, H) => drawHumanoid(g, H, { skin: PAL.ogreGreen, hair: PAL.hairBlack, hairStyle: 'bald', shirt: PAL.cloth_brown, pants: PAL.cloth_brown }), 2);
  reg('e_giant', 16, 16, (g, H) => drawHumanoid(g, H, { skin: PAL.skin3, hair: PAL.hairBrown, hairStyle: 'short', shirt: PAL.cloth_grey, pants: PAL.cloth_grey }), 2);
  reg('e_goblin', 16, 16, (g, H) => drawHumanoid(g, H, { skin: PAL.goblinGreen, hair: PAL.hairBlack, hairStyle: 'bald', shirt: PAL.cloth_brown, pants: PAL.cloth_brown }), 2);
  reg('e_babygoblin', 16, 16, (g, H) => drawHumanoid(g, H, { skin: PAL.goblinGreen, hair: PAL.hairBlack, hairStyle: 'bald', shirt: PAL.cloth_brown, pants: PAL.cloth_brown }), 2);
  reg('e_vegetablelamb', 16, 16, (g, H) => drawQuadruped(g, H, PAL.leaf2, PAL.leaf3), 2);
  reg('e_pig', 16, 16, (g, H) => drawQuadruped(g, H, PAL.cloth_pink, PAL.skin1), 2);
  reg('e_frogbear', 16, 16, (g, H) => drawQuadruped(g, H, PAL.bearBrown, PAL.serpentGreen), 2);
  reg('e_mamabear', 16, 16, (g, H) => drawQuadruped(g, H, PAL.bearBrown2, PAL.bearBrown), 2);
  reg('e_cub', 16, 16, (g, H) => drawQuadruped(g, H, PAL.bearBrown, PAL.bearBrown2), 2);
  reg('e_centicore', 16, 16, (g, H) => drawQuadruped(g, H, PAL.dirt1, PAL.bone), 2);
  reg('e_chicken', 16, 16, (g, H) => drawBird(g, H, PAL.bone), 2);
  reg('e_serpent', 16, 16, (g, H) => drawSerpent(g, H, PAL.serpentGreen), 2);
  reg('e_toad', 16, 16, (g, H) => drawBlob(g, H, PAL.toadGreen), 2);
  reg('e_crow', 16, 16, (g, H) => drawBird(g, H, PAL.crow), 2);
  reg('e_tortoise', 16, 16, (g, H) => drawShellCreature(g, H, PAL.tortoiseGreen, PAL.leaf2), 2);
  reg('e_rat', 16, 16, (g, H) => drawRat(g, H, PAL.ratGrey), 2);
  reg('e_moose', 16, 16, (g, H) => drawQuadruped(g, H, PAL.mooseBrown, PAL.dirt2), 2);
  reg('e_ghost', 16, 16, (g, H) => drawBlob(g, H, PAL.ghostWhite), 2);
  reg('e_bushmonster', 16, 16, (g, H) => drawBlob(g, H, PAL.leaf1), 2);
  reg('e_snowmonster', 16, 16, (g, H) => drawBlob(g, H, PAL.snow), 2);
  reg('e_shark', 16, 16, (g, H) => drawQuadruped(g, H, PAL.stoneMid, PAL.cloth_white), 2);
  reg('e_soldier', 16, 16, (g, H) => drawHumanoid(g, H, { skin: PAL.skin1, hair: PAL.hairBlack, hairStyle: 'bald', shirt: PAL.stoneMid, pants: PAL.stoneDark, hat: PAL.silver }), 2);
  reg('e_archer', 16, 16, (g, H) => drawHumanoid(g, H, { skin: PAL.skin1, hair: PAL.hairBrown, hairStyle: 'short', shirt: PAL.cloth_green, pants: PAL.dirt2 }), 2);

  // items (16x16 icon, scale 2 = 32)
  reg('i_sword', 16, 16, drawSword, 2);
  reg('i_excalibur', 16, 16, drawExcalibur, 2);
  reg('i_bow', 16, 16, drawBow, 2);
  reg('i_crossbow', 16, 16, drawCrossbow, 2);
  reg('i_pitchfork', 16, 16, drawPitchfork, 2);
  reg('i_mace', 16, 16, drawMace, 2);
  reg('i_club', 16, 16, drawClub, 2);
  reg('i_arrow', 16, 16, (g, H) => drawArrow(g, H, PAL.bladeDark), 2);
  reg('i_arrow_flame', 16, 16, (g, H) => drawArrow(g, H, PAL.flame), 2);
  reg('i_arrow_triple', 16, 16, (g, H) => drawArrow(g, H, PAL.silver), 2);
  reg('i_arrow_stun', 16, 16, (g, H) => drawArrow(g, H, PAL.potionBlue), 2);
  reg('i_potion_red', 16, 16, (g, H) => drawPotion(g, H, PAL.potionRed), 2);
  reg('i_potion_green', 16, 16, (g, H) => drawPotion(g, H, PAL.potionGreen), 2);
  reg('i_potion_blue', 16, 16, (g, H) => drawPotion(g, H, PAL.potionBlue), 2);
  reg('i_potion_purple', 16, 16, (g, H) => drawPotion(g, H, PAL.potionPurple), 2);
  reg('i_helmet', 16, 16, (g, H) => drawArmorPiece(g, H, 'helmet'), 2);
  reg('i_chest', 16, 16, (g, H) => drawArmorPiece(g, H, 'chest'), 2);
  reg('i_boots', 16, 16, (g, H) => drawArmorPiece(g, H, 'boots'), 2);
  reg('i_coin', 16, 16, drawCoin, 2);
  reg('i_scroll', 16, 16, drawScroll, 2);
  reg('i_key', 16, 16, drawKey, 2);
  reg('i_chestbox', 16, 16, drawChest, 2);
  reg('i_boat', 16, 16, drawBoat, 2);
  reg('i_horse', 16, 16, drawHorse, 2);
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
