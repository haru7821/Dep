/* ============================================================================
   Echoes of the Aether Crystal — Image sprite-sheet animation system
   ----------------------------------------------------------------------------
   Drop the provided PNG sprite sheets into ./assets/ and the game renders their
   real animation frames (idle / walk / attack / cast) instead of the built-in
   canvas pixel-art. If a sheet is missing OR sprites are disabled, the game
   falls back to sprites.js automatically — so it always runs.

   ENABLE: sheets are OFF by default (so a fresh clone with no art stays clean).
   Turn them on after adding the PNGs by EITHER:
     • opening the game with  ?sheets=1   in the URL, or
     • running in the console: localStorage.setItem('use_sheets','1')  then reload
     • or clicking the 🎨 button in the controls bar.

   FRAME LAYOUT: each sheet is treated as a uniform grid of `rows` × `cols`
   cells (cell size = imageW/cols × imageH/rows). Each animation names its row
   and how many frames it uses (left-packed). If your exported sheets don't line
   up, tweak the numbers in SHEET_CONFIG below — that's the only place to edit.
   ========================================================================== */
'use strict';
window.Sheets = (function () {
  // character id -> sheet file + grid + per-animation {row, frames, fps}
  const SHEET_CONFIG = {
    // Warrior (red headband swordsman)  →  Sir Garran (Knight)
    garran: { file:'warrior.png',  rows:5, cols:7, fit:1.15,
      anim:{ idle:{row:0,frames:5,fps:6}, walk:{row:1,frames:5,fps:8},
             attack:{row:2,frames:7,fps:12}, cast:{row:3,frames:7,fps:12} } },
    // Purple Wizard (staff, fire/ice cast)  →  Mira (Mage)
    mira:   { file:'wizard.png',   rows:4, cols:10, fit:1.1,
      anim:{ idle:{row:0,frames:5,fps:6}, walk:{row:1,frames:8,fps:8},
             attack:{row:2,frames:10,fps:12}, cast:{row:3,frames:9,fps:12} } },
    // Green hooded Archer  →  Faye (Archer)
    faye:   { file:'archer.png',   rows:5, cols:7, fit:1.05,
      anim:{ idle:{row:0,frames:5,fps:6}, walk:{row:1,frames:6,fps:8},
             attack:{row:2,frames:7,fps:14}, cast:{row:3,frames:7,fps:12} } },
    // Elemental Sorcerer (orange hood, elemental orbs)  →  Rai (Storm Ronin)
    rai:    { file:'sorcerer.png',  rows:4, cols:10, fit:1.1,
      anim:{ idle:{row:0,frames:6,fps:6}, walk:{row:1,frames:7,fps:8},
             attack:{row:2,frames:8,fps:12}, cast:{row:3,frames:10,fps:12} } },
    // (Aunel has no provided sheet → keeps canvas art via fallback)

    // Dark shadow mage (red eyes, purple energy)  →  Boss
    boss:   { file:'shadow.png',   rows:5, cols:7, fit:1.0,
      anim:{ idle:{row:0,frames:5,fps:5}, walk:{row:1,frames:7,fps:7},
             attack:{row:2,frames:7,fps:10}, cast:{row:3,frames:8,fps:10} } },
  };

  const imgs = {};   // id -> { img, ok, failed }
  let enabled = false;

  function detectEnabled(){
    try {
      if (typeof location !== 'undefined' && /[?&]sheets=1/.test(location.search)) return true;
      if (typeof localStorage !== 'undefined' && localStorage.getItem('use_sheets') === '1') return true;
    } catch (e) {}
    return false;
  }
  enabled = detectEnabled();

  function isEnabled(){ return enabled; }
  function setEnabled(on){
    enabled = !!on;
    try { localStorage.setItem('use_sheets', on ? '1' : '0'); } catch (e) {}
  }
  function has(id){ return !!SHEET_CONFIG[id]; }

  function load(id){
    const c = SHEET_CONFIG[id];
    if (!c || imgs[id]) return;
    const rec = { img: new Image(), ok: false, failed: false };
    rec.img.onload  = () => { rec.ok = true; };
    rec.img.onerror = () => { rec.failed = true; };
    rec.img.src = 'assets/' + c.file;
    imgs[id] = rec;
  }

  function ready(id){ return !!(imgs[id] && imgs[id].ok); }

  // Draw one animation frame centered at x, feet at baseY, scaled to targetH px.
  // Returns true if it drew (caller then skips the canvas fallback), else false.
  function draw(ctx, id, x, baseY, targetH, animName, timeMs){
    if (!enabled) return false;
    const c = SHEET_CONFIG[id];
    if (!c) return false;
    load(id);
    const rec = imgs[id];
    if (!rec || !rec.ok) return false;

    const a = c.anim[animName] || c.anim.idle;
    const fw = rec.img.width  / c.cols;
    const fh = rec.img.height / c.rows;
    if (!fw || !fh) return false;

    const frame = Math.floor(timeMs / 1000 * (a.fps || 8)) % a.frames;
    const sx = frame * fw, sy = a.row * fh;

    const dh = targetH * (c.fit || 1);
    const dw = fw * (dh / fh);
    const prev = ctx.imageSmoothingEnabled;
    ctx.imageSmoothingEnabled = true;
    ctx.drawImage(rec.img, sx, sy, fw, fh, x - dw / 2, baseY - dh, dw, dh);
    ctx.imageSmoothingEnabled = prev;
    return true;
  }

  return { draw, load, ready, has, isEnabled, setEnabled, CONFIG: SHEET_CONFIG };
})();
