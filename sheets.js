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
  // Sheets sliced from the uploaded art (slice-sheets.mjs) are 4 rows
  // (idle/walk/attack/cast); frame counts per row vary and are set below.
  const rows4 = (i,w,a,c) => ({ idle:{row:0,frames:i,fps:7}, walk:{row:1,frames:w,fps:9},
                                attack:{row:2,frames:a,fps:12}, cast:{row:3,frames:c,fps:11} });
  const SHEET_CONFIG = {
    garran: { file:'warrior.png',  rows:4, cols:5, fit:1.25, anim:rows4(5,2,1,1) },  // Knight  (warrior art)
    mira:   { file:'wizard.png',   rows:4, cols:8, fit:1.20, anim:rows4(5,8,2,2) },  // Mage    (purple wizard art)
    faye:   { file:'archer.png',   rows:4, cols:5, fit:1.20, anim:rows4(5,5,1,2) },  // Archer
    rai:    { file:'sorcerer.png', rows:4, cols:5, fit:1.22, anim:rows4(5,1,1,1) },  // Ronin   (elemental sorcerer art)
    boss:   { file:'shadow.png',   rows:4, cols:5, fit:1.6,  anim:rows4(2,5,1,2) },  // Boss    (shadow mage art)
    aunel:  { file:'healer.png',   rows:4, cols:6, fit:1.15,                         // Healer  (generated placeholder)
      anim:{ idle:{row:0,frames:6,fps:6}, walk:{row:1,frames:6,fps:9}, attack:{row:2,frames:6,fps:13}, cast:{row:3,frames:6,fps:12} } },
  };

  const imgs = {};   // id -> { img, ok, failed }
  let enabled = false;

  function detectEnabled(){
    // On by default now that sprite sheets ship in assets/; explicit off wins.
    try {
      if (typeof location !== 'undefined' && /[?&]sheets=0/.test(location.search)) return false;
      if (typeof location !== 'undefined' && /[?&]sheets=1/.test(location.search)) return true;
      if (typeof localStorage !== 'undefined' && localStorage.getItem('use_sheets') === '0') return false;
    } catch (e) {}
    return true;
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
