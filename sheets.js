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
  // bestiary monster: row 0 = idle (used for walking), row 1 = attack
  const bmob = (ir,ar) => ({ idle:{row:0,frames:ir,fps:6}, walk:{row:0,frames:ir,fps:6},
                             attack:{row:1,frames:ar,fps:10}, cast:{row:1,frames:ar,fps:10} });
  // flip:true mirrors the sprite horizontally so it faces the incoming enemies
  // (right). Aunel has no sheet and uses the built-in canvas art.
  // sliced sheets pack every character at the same body height, so heroes share
  // one fit for a consistent on-screen size.
  const HFIT = 1.05;  // hero on-screen scale (halved per request)
  // heroes from hero.png: row0 idle, row1 attack; art faces right (no flip)
  const SHEET_CONFIG = {
    garran: { file:'warrior.png',  rows:2, cols:4, fit:HFIT, anim:bmob(2,4) },  // Knight
    mira:   { file:'wizard.png',   rows:2, cols:3, fit:HFIT, anim:bmob(2,3) },  // Mage
    faye:   { file:'archer.png',   rows:2, cols:5, fit:HFIT, anim:bmob(2,5) },  // Archer
    rai:    { file:'sorcerer.png', rows:2, cols:3, fit:HFIT, anim:bmob(2,3) },  // Sorcerer
    // the defended crystal, as an animated tower (idle glow / attack fires a bolt)
    tower:  { file:'tower.png',    rows:2, cols:4, fit:1.0,  anim:bmob(4,4) },
    // monsters — extracted from the bestiary (idle + attack rows). Face left
    // = the direction they march, so no flip.
    slime:      { file:'slime.png',      rows:2, cols:11, fit:1.0, flip:true, anim:bmob(6,11) },  // earth
    zombie:     { file:'zombie.png',     rows:2, cols:5,  fit:1.0, flip:true, anim:bmob(3,5)  },  // poison
    specter:    { file:'specter.png',    rows:2, cols:5,  fit:1.0, flip:true, anim:bmob(2,5)  },  // dark
    skeleton:   { file:'skeleton.png',   rows:2, cols:7,  fit:1.0, flip:true, anim:bmob(2,7)  },  // tank
    dragon:     { file:'dragon.png',     rows:2, cols:4,  fit:1.0, flip:true, anim:bmob(4,4)  },  // Boss (fire)
    elderghost: { file:'elderghost.png', rows:2, cols:5,  fit:1.0, flip:true, anim:bmob(3,5)  },  // Boss (dark)
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
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    if (c.flip){                       // mirror horizontally around x
      ctx.translate(x, 0); ctx.scale(-1, 1);
      ctx.drawImage(rec.img, sx, sy, fw, fh, -dw / 2, baseY - dh, dw, dh);
    } else {
      ctx.drawImage(rec.img, sx, sy, fw, fh, x - dw / 2, baseY - dh, dw, dh);
    }
    ctx.restore();
    return true;
  }

  function preload(){ if (enabled) Object.keys(SHEET_CONFIG).forEach(load); }

  return { draw, load, ready, has, preload, isEnabled, setEnabled, CONFIG: SHEET_CONFIG };
})();
