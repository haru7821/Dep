# Sprite sheet assets

The game sheets here are **sliced from the uploaded source art in `raw/`** by
`../slice-sheets.mjs` (it auto-detects sprite rows/frames, drops the baked-in
titles and row labels, and re-packs them into clean uniform grids). `healer.png`
is a generated placeholder (no Healer art was provided). Filenames map to
characters in `../sheets.js`:

| File | Character in game | Source sheet |
|------|-------------------|--------------|
| `warrior.png`  | **Sir Garran** (Knight) | red-headband swordsman |
| `wizard.png`   | **Mira** (Mage)         | purple wizard w/ staff |
| `archer.png`   | **Faye** (Archer)       | green hooded archer |
| `sorcerer.png` | **Rai** (Storm Ronin)   | orange elemental sorcerer |
| `shadow.png`   | **Boss**                | dark red-eyed shadow mage |

`raw/` holds the original uploaded showcase sheets (titles/labels intact), named
by their actual art. Re-slice after editing them with `node ../slice-sheets.mjs`
(it prints the frame counts to set in `SHEET_CONFIG`).

## Turning it off / on

Sheets are **on by default**. To force the built-in canvas art instead:

- click the **🎨** button in the controls bar to toggle, **or**
- open the game with `?sheets=0` in the URL, **or**
- run `localStorage.setItem('use_sheets','0')` in the console, then reload.

Missing or broken sheets fall back to the built-in canvas sprites automatically.

## Frame layout

Each sheet is read as a uniform grid of `rows × cols` cells (rows =
idle / walk / attack / cast). The per-sheet grid size and how many frames each
animation uses are set in **`../sheets.js` → `SHEET_CONFIG`** — the only place to
edit. If your exported sheet's frames don't line up (wrong size or offset),
adjust that character's `rows`, `cols`, and `anim` frame counts there.
