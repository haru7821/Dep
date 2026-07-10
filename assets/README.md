# Sprite sheet assets

Drop your PNG sprite sheets here to replace the built-in canvas pixel-art with
real animated frames. Expected filenames (mapped in `../sheets.js`):

| File | Character in game | Source sheet |
|------|-------------------|--------------|
| `warrior.png`  | **Sir Garran** (Knight) | red-headband swordsman |
| `wizard.png`   | **Mira** (Mage)         | purple wizard w/ staff |
| `archer.png`   | **Faye** (Archer)       | green hooded archer |
| `sorcerer.png` | **Rai** (Storm Ronin)   | orange elemental sorcerer |
| `shadow.png`   | **Boss**                | dark red-eyed shadow mage |

*(Aunel the Healer has no sheet yet and keeps the built-in art.)*

## How to turn it on

Sheets are **off by default** so the game runs clean with no art. After adding
the PNGs, enable them by any of:

- click the **🎨** button in the controls bar, **or**
- open the game with `?sheets=1` in the URL, **or**
- run `localStorage.setItem('use_sheets','1')` in the console, then reload.

Missing or broken sheets fall back to the built-in canvas sprites automatically.

## Frame layout

Each sheet is read as a uniform grid of `rows × cols` cells (rows =
idle / walk / attack / cast). The per-sheet grid size and how many frames each
animation uses are set in **`../sheets.js` → `SHEET_CONFIG`** — the only place to
edit. If your exported sheet's frames don't line up (wrong size or offset),
adjust that character's `rows`, `cols`, and `anim` frame counts there.
