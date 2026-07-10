# Sprite sheet assets

This folder ships with **generated** animated sprite sheets (made by
`../generate-sheets.mjs`, themed to match each class). They are used by default.
To use your own art, replace a PNG with the same filename. Expected filenames
(mapped in `../sheets.js`):

| File | Character in game | Source sheet |
|------|-------------------|--------------|
| `warrior.png`  | **Sir Garran** (Knight) | red-headband swordsman |
| `wizard.png`   | **Mira** (Mage)         | purple wizard w/ staff |
| `archer.png`   | **Faye** (Archer)       | green hooded archer |
| `sorcerer.png` | **Rai** (Storm Ronin)   | orange elemental sorcerer |
| `shadow.png`   | **Boss**                | dark red-eyed shadow mage |

*(Aunel the Healer has no sheet yet and keeps the built-in art.)*

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
