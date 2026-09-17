# Medieval Journey

A free-roam, pixel-art digitization of the hand-drawn board game *Medieval Journey*. Built with plain HTML5 Canvas + JavaScript — no build step, no dependencies, runs entirely in the browser and deploys straight to GitHub Pages.

## Play locally

Just serve the folder statically (opening `index.html` directly via `file://` will fail because scripts load as separate files):

```bash
python3 -m http.server 8000
# then open http://localhost:8000
```

## Controls

- **WASD / Arrow keys** — walk around
- **E / Space / F / click** — talk, shop, open doors, fight
- **I** — inventory
- Mouse click on a highlighted `[E]` prompt also works

## Deploying to GitHub Pages

```bash
git add -A
git commit -m "Medieval Journey"
git branch -M main
git remote add origin <your-repo-url>
git push -u origin main
```

Then in the repo's **Settings → Pages**, set source to the `main` branch, root folder. The site will be live at `https://<you>.github.io/<repo>/`.

## How it's structured

- `js/pixelart.js`, `js/sprites.js` — every sprite (tiles, characters, monsters, items) is drawn procedurally onto tiny pixel grids and rasterized once at load — no external image files at all.
- `js/engine.js` — the free-roam movement/camera/collision engine. One generic "AreaMap" format handles towns, the overworld, and the old board's numbered node-paths (Woods, Monster Hills, Merlin's Hideout, the Castle) — those became corridor-shaped rooms with the original numbered events attached to each room.
- `js/combat.js` — interactive Attack / Defend / Item / Flee combat. The original rule *"non-range beats range, range beats non-range"* became a real tactical mechanic: whichever side's weapon type doesn't match their opponent's lands a bonus "ambush" hit, so swapping between a melee and ranged weapon mid-fight matters.
- `js/state.js` — save file (life, quickels, weapons, armor, companions, flags) — autosaves every few seconds and on exit, to `localStorage`.
- `js/data/*.js` — one file per region, transcribing the original notes: shops, NPC scripts, dice-roll tables, and encounters, using the original quotes and quickel/life numbers wherever the notes gave them.

## Liberties taken (per your go-ahead)

- The board's numbered "spaces" became actual walkable rooms you move through in real time, with the original event/encounter table firing when you reach that room.
- The "Land of Difficulty" wasn't its own encounter table in the notes (unlike Woods/Monster Hills), so it became a genuinely dangerous stretch of the northern overworld road with ambient random encounters.
- Combat is real-time-adjacent and interactive (weapon swapping, defend, items) rather than pure dice rolls, though dice rolls (`d6`) still drive every shop/event table exactly as written.
- A few connective/shortcut moments (the Hermit's cellar → Castle east door, Riverbank's current dumping you into the Monster Hills, the Woods' Box of Surprises doing the same) are original but consistent with the "rabbit hole" teleport logic already in your Monster Hills notes.
- Multiplayer-only bits (Lovin' Larry's, the love-potion companions) are shown with their solo-player branch, since this is single-player.

## Known limitations

- One-shot node encounters (Woods/Monster Hills/Castle rooms) reset if you reload a saved game mid-session — only your stats, items, and story flags persist, not which individual rooms you'd already cleared.
- No sound/music (visuals only).
