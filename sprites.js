/*
 * sprites.js — "Echoes of the Aether Crystal"
 * -------------------------------------------------------------------------
 * Pure canvas-2D pixel-art sprite renderers, JRPG (16-bit) flavor.
 *
 * Everything is drawn from grids of `ctx.fillRect` blocks so the result
 * reads like a Final-Fantasy / Dragon-Quest era sprite sheet. No images,
 * no fetch, no imports — just math and rectangles.
 *
 * All functions are attached to `window` (for direct calls) and bundled
 * into `window.Sprites` at the bottom of the file.
 *
 * Coordinate convention for characters:
 *   x      = horizontal CENTER of the sprite (in canvas px)
 *   baseY  = the ground line where the feet rest (in canvas px)
 *   size   = the size (in canvas px) of ONE logical pixel of the sprite
 *   frame  = 0 or 1, a 2-frame bob for idle/attack animation
 *
 * The little `px()` helper below is the heart of the whole file: it maps
 * a grid coordinate (col, row) — measured in "sprite pixels" — to a filled
 * rectangle on the canvas, so a sprite can be authored on a tidy integer
 * grid and scaled cleanly by `size`.
 * -------------------------------------------------------------------------
 */
(function () {
  'use strict';

  /* =======================================================================
   * Low-level pixel helpers
   * ===================================================================== */

  /**
   * Draw a single sprite-pixel (or a rectangular run of them).
   * The sprite grid is authored with its own origin at (originX, originY)
   * expressed in canvas pixels, and each grid cell is `size` canvas px.
   *
   * @param cx grid column (can be fractional for half-pixel nudges)
   * @param cy grid row
   * @param w  width in grid cells   (default 1)
   * @param h  height in grid cells  (default 1)
   */
  function makePx(ctx, originX, originY, size) {
    return function px(cx, cy, color, w, h) {
      ctx.fillStyle = color;
      ctx.fillRect(
        Math.round(originX + cx * size),
        Math.round(originY + cy * size),
        Math.ceil((w || 1) * size),
        Math.ceil((h || 1) * size)
      );
    };
  }

  /**
   * Paint a whole sprite from a string map + palette table.
   * `rows` is an array of equal-length strings; each character keys into
   * `palette`. Spaces (and any key missing from the palette) are skipped,
   * which lets us leave transparent holes for the silhouette.
   *
   * gridW is used only to horizontally center the art on `x`.
   */
  function paintGrid(ctx, rows, palette, x, baseY, size, gridW, gridH) {
    var originX = x - (gridW * size) / 2;
    var originY = baseY - gridH * size;
    var px = makePx(ctx, originX, originY, size);
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      for (var c = 0; c < row.length; c++) {
        var key = row[c];
        var color = palette[key];
        if (color) px(c, r, color, 1, 1);
      }
    }
    return px; // handy for drawing extras (weapons, glows) afterwards
  }

  /** Soft ground shadow ellipse beneath a character. */
  function groundShadow(ctx, x, baseY, size, radius) {
    ctx.save();
    ctx.globalAlpha = 0.28;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(x, baseY + size * 0.4, radius, radius * 0.35, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  /* =======================================================================
   * HERO: Sir Garran — the Knight (Tank)
   * Palette: blue plate, silver helm, gold trim, red plume.
   * ===================================================================== */
  function drawKnight(ctx, x, baseY, size, frame) {
    var bob = frame ? 1 : 0;         // whole body lifts 1px on frame 1
    var y = baseY - bob * size;
    groundShadow(ctx, x, baseY, size, size * 5);

    var P = {
      O: '#0b1a33', // outline / deep shadow
      p: '#c0392b', // plume red
      s: '#d9dde4', // silver (helm / highlights)
      S: '#8a9099', // silver shade
      f: '#f0c9a0', // face skin
      F: '#c98f63', // skin shade
      b: '#2e5ca8', // blue armor
      B: '#1c3d75', // blue armor shade
      g: '#f2c14e', // gold trim
      w: '#5b3a1e'  // brown (sword grip / boots)
    };

    // 12 wide x 16 tall grid. '.' = transparent.
    var rows = [
      '....pp......',
      '...OppO.....',
      '...OssO.....',
      '..OssssO....',
      '..OsffsO....',
      '..OsffsO....',
      '...OSSO.....',
      '..ObbbbO....',
      '.ObBbbBbO...',
      '.OgbbbbgO...',
      '.ObbbbbbO...',
      '.ObBbbBbO...',
      '..ObbbbO....',
      '..Ob..bO....',
      '..Ow..wO....',
      '..OO..OO....'
    ];
    paintGrid(ctx, rows, P, x, y, size, 12, 16);

    // --- Shield (left side) drawn as its own little grid ---
    var px = makePx(ctx, x - 12 * size / 2, y - 16 * size, size);
    // shield body
    px(0.2, 7.5, P.O, 2.6, 5.2);
    px(0.5, 8, P.b, 2, 4.2);
    px(0.9, 8.6, P.g, 1.2, 1.2); // gold boss
    px(0.7, 10.2, P.s, 1.6, 0.5); // cross highlight

    // --- Sword (right hand), raised a touch more on attack frame ---
    var swordLift = frame ? 1 : 0;
    var sx = 9.2, sy = 3.2 - swordLift * 0.6;
    px(sx, sy, P.O, 1, 8);          // blade outline
    px(sx + 0.2, sy + 0.2, P.s, 0.6, 6.4); // blade
    px(sx - 0.6, sy + 6.2, P.g, 2.2, 0.8); // crossguard
    px(sx, sy + 7, P.w, 1, 1.4);    // grip
  }

  /* =======================================================================
   * HERO: Mira — the Mage (AoE caster)
   * Palette: purple robe, red trim, pointed hat, glowing cyan orb staff.
   * ===================================================================== */
  function drawMage(ctx, x, baseY, size, frame) {
    var bob = frame ? 1 : 0;
    var y = baseY - bob * size;
    groundShadow(ctx, x, baseY, size, size * 4.5);

    var P = {
      O: '#1b0f2a', // outline
      h: '#5b2a86', // hat / robe purple
      H: '#3d1c5c', // purple shade
      r: '#c0392b', // red trim
      g: '#f2c14e', // gold trim
      f: '#f0c9a0', // face
      F: '#c98f63', // face shade
      w: '#6b4a2a', // staff wood
      s: '#e9e4f0'  // star/highlight
    };

    var rows = [
      '.....O......',
      '....OhO.....',
      '...OhhhO....',
      '..OhhhhhO...',
      '.OhhhHhhhO..',
      'OhrrrrrrrhO.',
      '..OfffO.....',
      '..OfFfO.....',
      '..OhhhO.....',
      '.OhhrhhO....',
      '.OhHhhHO....',
      '.OhhrhhO....',
      '.OhhhhhO....',
      '.OrrrrrO....',
      '..Oh.hO.....',
      '..OO.OO.....'
    ];
    paintGrid(ctx, rows, P, x, y, size, 12, 16);

    // little gold star on the hat
    var px = makePx(ctx, x - 12 * size / 2, y - 16 * size, size);
    px(4.4, 3.4, P.g, 0.9, 0.9);

    // --- Staff on the right, orb pulses/rises on the cast frame ---
    var lift = frame ? 1 : 0;
    var stx = 8.6, sty = 1 - lift;
    px(stx, sty + 1, P.w, 0.8, 12);     // shaft
    // glowing orb (radial-ish, built from concentric blocks)
    var ocx = stx + 0.4, ocy = sty;
    var glow = frame ? '#8ff0ff' : '#5cd8ff';
    ctx.save();
    ctx.globalAlpha = 0.35;
    px(ocx - 1.4, ocy - 1.4, glow, 3.6, 3.6);
    ctx.restore();
    px(ocx - 0.9, ocy - 0.9, '#2aa9d6', 2.4, 2.4);
    px(ocx - 0.5, ocy - 0.5, glow, 1.6, 1.6);
    px(ocx - 0.1, ocy - 0.1, '#ffffff', 0.7, 0.7);
  }

  /* =======================================================================
   * HERO: Faye — the Archer (Fast attacker)
   * Palette: green hood/cloak, leather, bow.
   * ===================================================================== */
  function drawArcher(ctx, x, baseY, size, frame) {
    var bob = frame ? 1 : 0;
    var y = baseY - bob * size;
    groundShadow(ctx, x, baseY, size, size * 4.5);

    var P = {
      O: '#12240f', // outline
      g: '#3f8f3a', // hood/cloak green
      G: '#2c6b2a', // green shade
      l: '#7a4a24', // leather
      L: '#5b3618', // leather shade
      f: '#f0c9a0', // face
      F: '#c98f63', // face shade
      y: '#f2c14e', // gold/feather accent
      w: '#caa06a'  // bow wood
    };

    var rows = [
      '...OgggO....',
      '..OgGgGgO...',
      '..Ogf ffO...',   // hood opening + face
      '..OgfFffO...',
      '...OfffO....',
      '..OgggggO...',
      '.OgGgggGgO..',
      '.Oglgggl gO.',
      '.OgllllllO..',
      '.OgLllLlgO..',
      '.OgllllllO..',
      '..OgggggO...',
      '..Og...gO...',
      '..Ol...lO...',
      '..OL...LO...',
      '..OO...OO...'
    ];
    paintGrid(ctx, rows, P, x, y, size, 12, 16);

    var px = makePx(ctx, x - 12 * size / 2, y - 16 * size, size);
    // quiver + feather at the shoulder
    px(9, 2, P.l, 1, 4);
    px(9.1, 1.3, P.y, 0.8, 1);

    // --- Bow on the left; string is drawn "drawn back" a bit on frame 1 ---
    var pull = frame ? 1 : 0;
    var bx = 1.2, by = 3.5;
    // bow arc as short vertical segments
    px(bx, by, P.w, 0.7, 9);
    px(bx + 0.4, by - 0.4, P.w, 0.7, 1);
    px(bx + 0.4, by + 8.6, P.w, 0.7, 1);
    // string
    ctx.strokeStyle = '#e8e8d8';
    ctx.lineWidth = Math.max(1, size * 0.18);
    ctx.beginPath();
    var strTopX = originXHelper(bx + 0.7, x, size);
    ctx.moveTo(originXHelper(bx + 0.7, x, size), y - 16 * size + (by - 0.2) * size);
    ctx.lineTo(originXHelper(bx + 2.2 + pull, x, size), y - 16 * size + (by + 4) * size);
    ctx.lineTo(originXHelper(bx + 0.7, x, size), y - 16 * size + (by + 8.6) * size);
    ctx.stroke();
    void strTopX;
  }

  // helper to convert a grid-col to canvas-x for the archer's string
  function originXHelper(col, x, size) {
    return Math.round(x - (12 * size) / 2 + col * size);
  }

  /* =======================================================================
   * HERO: Aunel — the Healer (Support)
   * Palette: white/gold robe, golden halo, holding a warm light.
   * ===================================================================== */
  function drawHealer(ctx, x, baseY, size, frame) {
    var bob = frame ? 1 : 0;
    var y = baseY - bob * size;
    groundShadow(ctx, x, baseY, size, size * 4.5);

    var P = {
      O: '#4a4432', // soft warm outline
      w: '#f6f3e8', // robe white
      W: '#d9d3bf', // robe shade
      g: '#f2c14e', // gold trim / halo
      G: '#caa03a', // gold shade
      f: '#f0c9a0', // face
      F: '#c98f63', // face shade
      h: '#a06a2c'  // hair
    };

    var rows = [
      '....ggg.....',   // halo
      '...g...g....',
      '...OhhhO....',
      '..OhffffO...',
      '..OffffFO...',
      '..OfffffO...',
      '...OwwwO....',
      '..OwgwgwO...',
      '.OwwwgwwwO..',
      '.OwWwgwWwO..',
      '.OwwwgwwwO..',
      '.OggwwwggO..',
      '..OwwwwwO...',
      '..Ow...wO...',
      '..Ow...wO...',
      '..OO...OO...'
    ];
    paintGrid(ctx, rows, P, x, y, size, 12, 16);

    var px = makePx(ctx, x - 12 * size / 2, y - 16 * size, size);

    // halo glow
    ctx.save();
    ctx.globalAlpha = 0.30 + (frame ? 0.12 : 0);
    px(4, -0.3, '#fff2b0', 4, 1.4);
    ctx.restore();

    // --- Held light orb in right hand, breathes with frame ---
    var lift = frame ? 0.6 : 0;
    var lx = 8.4, ly = 7 - lift;
    ctx.save();
    ctx.globalAlpha = 0.4;
    px(lx - 1.2, ly - 1.2, '#fff2b0', 3.4, 3.4);
    ctx.restore();
    px(lx - 0.6, ly - 0.6, '#ffd766', 1.9, 1.9);
    px(lx - 0.1, ly - 0.1, '#ffffff', 0.8, 0.8);
  }

  /* =======================================================================
   * HERO: Rai, the Storm Ronin (unlocks wave 50)
   * Palette: indigo/steel-blue kimono + hakama, straw conical hat, dark
   * topknot, silver katana with a pale-cyan lightning glint, crackling
   * electric-cyan accents. On frame 1 the katana is raised/readied.
   * ===================================================================== */
  function drawRonin(ctx, x, baseY, size, frame) {
    var bob = frame ? 1 : 0;
    var y = baseY - bob * size;
    groundShadow(ctx, x, baseY, size, size * 4.8);

    var P = {
      O: '#0c1226', // outline / deep shadow
      s: '#d9b878', // straw hat
      S: '#b08f4f', // straw hat shade
      k: '#33518f', // indigo kimono
      K: '#22386b', // kimono shade
      h: '#1a2340', // steel-blue hakama (dark)
      f: '#f0c9a0', // face skin
      F: '#c98f63', // skin shade
      t: '#141824', // topknot / obi black-blue
      c: '#8ff0ff', // electric cyan accent
      g: '#f2c14e'  // small gold cord
    };

    // 12 wide x 16 tall. Conical straw hat, indigo kimono, hakama legs.
    var rows = [
      '....ssss....',
      '...OssssO...',
      '..OssssssO..',
      '.OSssssssSO.',
      '..OOffffOO..',
      '...OffFfO...',
      '...OfffO....',
      '..OktktkO...',   // shoulders + kimono collar (cyan spark hints)
      '.OkKkkkkKO..',
      '.OkkgkkgkO..',   // gold obi cords
      '.OkKkkkkKO..',
      '.OhhhhhhhO..',   // hakama waist
      '.OhHhhhHhO..',
      '.Ohh..hhO...',
      '.Ohh..hhO...',
      '.OO....OO...'
    ];
    paintGrid(ctx, rows, P, x, y, size, 12, 16);

    var px = makePx(ctx, x - 12 * size / 2, y - 16 * size, size);

    // small crackling cyan spark on the shoulders (brighter on frame 1)
    ctx.save();
    ctx.globalAlpha = frame ? 0.9 : 0.5;
    px(3.4, 7.1, P.c, 0.5, 0.5);
    px(7.1, 7.4, P.c, 0.5, 0.5);
    ctx.restore();

    // --- Katana on the right hand ---
    // frame 0: held ready low/diagonal. frame 1: raised high overhead.
    ctx.save();
    if (frame) {
      // raised: near-vertical blade above the shoulder
      var bx = 9.0, by = -2.2;
      px(bx - 0.4, by + 5.2, P.O, 1.8, 1);            // guard (tsuba)
      px(bx, by + 6, '#2a1c0f', 0.9, 2);              // grip (tsuka)
      px(bx - 0.1, by, P.O, 1, 5.4);                  // blade outline
      px(bx + 0.15, by + 0.2, '#e6ecf2', 0.55, 4.8);  // steel blade
      // lightning glint running down the edge
      ctx.globalAlpha = 0.85;
      px(bx + 0.15, by + 0.4, P.c, 0.3, 1.2);
      px(bx + 0.15, by + 2.4, P.c, 0.3, 1.0);
    } else {
      // ready: blade angled down-forward from the hip
      var gx = 8.6, gy = 8.4;
      px(gx, gy, '#2a1c0f', 1, 1.4);          // grip
      px(gx - 0.3, gy - 0.3, P.O, 1.8, 0.8);  // guard
      // stepped diagonal blade going down-right
      px(gx + 1.0, gy - 1.6, P.O, 1, 1.2);
      px(gx + 1.8, gy - 3.0, P.O, 1, 1.2);
      px(gx + 2.6, gy - 4.4, P.O, 1, 1.2);
      px(gx + 1.15, gy - 1.5, '#e6ecf2', 0.6, 0.9);
      px(gx + 1.95, gy - 2.9, '#e6ecf2', 0.6, 0.9);
      px(gx + 2.75, gy - 4.3, '#e6ecf2', 0.6, 0.9);
      // faint cyan glint at the tip
      ctx.globalAlpha = 0.8;
      px(gx + 3.0, gy - 4.9, P.c, 0.6, 0.6);
    }
    ctx.restore();

    // a couple of tiny lightning arcs crackling near the raised blade
    if (frame) {
      ctx.save();
      ctx.strokeStyle = P.c;
      ctx.globalAlpha = 0.7;
      ctx.lineWidth = Math.max(1, size * 0.2);
      var ox = x - 12 * size / 2, oy = y - 16 * size;
      ctx.beginPath();
      ctx.moveTo(ox + 9.2 * size, oy - 2.0 * size);
      ctx.lineTo(ox + 10.2 * size, oy - 1.0 * size);
      ctx.lineTo(ox + 9.4 * size, oy - 0.2 * size);
      ctx.lineTo(ox + 10.4 * size, oy + 0.8 * size);
      ctx.stroke();
      ctx.restore();
    }
  }

  /* =======================================================================
   * ENEMIES — cute-but-menacing shadow monsters.
   * type: 'normal' | 'fast' | 'tank'. hpRatio tints toward pale as it dies.
   * They face LEFT (marching in from the right toward the crystal).
   * ===================================================================== */
  function drawEnemy(ctx, x, baseY, size, type, frame) {
    var wob = frame ? 1 : 0;
    var y = baseY - wob * size;
    groundShadow(ctx, x, baseY, size, size * 3.6);

    // Per-type body color + eye color
    var body, bodyShade, eye, gridW, gridH, rows;
    if (type === 'fast') {
      body = '#7d3fb0'; bodyShade = '#5a2b82'; eye = '#ffe14d';
    } else if (type === 'tank') {
      body = '#3a5f4a'; bodyShade = '#26402f'; eye = '#ff5a3c';
    } else {
      body = '#3b3b52'; bodyShade = '#242437'; eye = '#ff4d6d';
    }

    // As HP drops, blend the body toward a washed-out gray (fade to death).
    var pale = 1 - clamp01(hpRatioSafe(0)); // placeholder, replaced below

    var P = {
      O: '#0a0a12', // near-black outline
      b: body,
      B: bodyShade,
      e: eye,
      w: '#ffffff', // eye glint
      t: '#e8e8f0'  // teeth
    };

    if (type === 'tank') {
      // Big, squat, armored blob with horns.
      gridW = 12; gridH = 12;
      rows = [
        '.O......O...',
        '.OB....BO...',
        '..OBbbBO....',
        '.OBbbbbBO...',
        'OBbeb beBO..',
        'OBbbbbbbBO..',
        'OBb t t bBO.',
        'OBbtttttBO..',
        '.OBbbbbBO...',
        '..OBbbBO....',
        '..O.OO.O....',
        '..O....O....'
      ];
    } else if (type === 'fast') {
      // Lean, spiky, forward-leaning gremlin.
      gridW = 12; gridH = 12;
      rows = [
        '..O...O.....',
        '..OB.BO.....',
        '...OBBO.....',
        '..OBbbBO....',
        '.Obebe bO...',
        '.Obbbbb O...',
        '.Ob ttt bO..',
        '..Obbbb O...',
        '...OBbBO....',
        '...OB.O.....',
        '..OB..O.....',
        '..O...O.....'
      ];
    } else {
      // Classic round shadow-slime with two glowing eyes.
      gridW = 12; gridH = 12;
      rows = [
        '....OOOO....',
        '..OOBbbBOO..',
        '.OBbbbbbbBO.',
        '.ObebbbebbO.',
        'OBbeebbeebBO',
        'ObbbbbbbbbbO',
        'Obb tttt bbO',
        'OBbtttttbBO.',
        '.OBbbbbbBO..',
        '..OBbbbBO...',
        '.OO.O.O.OO..',
        '.O...O...O..'
      ];
    }

    // Repaint with HP-based paling by pre-mixing the body colors.
    P.b = mixHex(body, '#9a9aa6', pale * 0.0); // pale computed below
    paintGrid(ctx, rows, P, x, y, size, gridW, gridH);
    void P; void pale;

    // Note: paling handled in wrapper below via hpRatio argument.
  }

  /* =======================================================================
   * BOSS — a large imposing shadow demon.
   * Centered at x, feet at baseY. Slow menacing 2-frame sway.
   * ===================================================================== */
  function drawBoss(ctx, x, baseY, size, frame) {
    var sway = frame ? 1 : 0;
    var y = baseY - sway * size;
    groundShadow(ctx, x, baseY, size, size * 9);

    var P = {
      O: '#050308', // outline
      b: '#2a1533', // dark purple body
      B: '#180a20', // body shade
      m: '#4a1f5c', // mid purple highlight
      e: '#ff3b3b', // burning eyes
      E: '#ffd24d', // inner eye
      h: '#b0b0bd', // horn / bone
      H: '#7d7d8a', // horn shade
      t: '#e8e2ea', // teeth
      c: '#ff7a1a'  // chest ember
    };

    // 18 wide x 22 tall — a proper boss silhouette with wings + horns.
    var rows = [
      'h................h',
      'Hh..............hH',
      'OHh.OOOOOOOO.hHO..',
      '.OHhOBbbbbbBOhHO..',
      '.mOBbbbbbbbbBOm...',
      'mmOBbmbbbbmbBOmm..',
      'mmObbmbbbbmbbOmm..',
      '.OBbeEbbbbeEbBO...',
      '.ObbeebbbbeebbO...',
      '.ObbbbmbbmbbbbO...',
      '.ObbbtttttttbbO...',
      '.OBbtOtOtOtObBO...',
      '..OBbbbbbbbbBO....',
      '..ObbbbccbbbbO....',
      '..ObbbcccccbbO....',
      '..OBbbbccbbbBO....',
      '...OBbbbbbbBO.....',
      '...ObbbBBbbbO.....',
      '...Obb.OO.bbO.....',
      '...OO..OO..OO.....',
      '...O...OO...O.....',
      '...O...OO...O.....'
    ];
    paintGrid(ctx, rows, P, x, y, size, 18, 22);

    // Big ragged wings drawn as triangular block fans on each side.
    var px = makePx(ctx, x - 18 * size / 2, y - 22 * size, size);
    var wingCol = '#1f0f28', wingEdge = P.O;
    // left wing
    for (var i = 0; i < 5; i++) {
      px(2.5 - i * 0.5, 3 + i, wingEdge, 1, 1);
      px(1 - i * 0.4, 4 + i * 1.3, wingCol, 2 + i * 0.4, 1);
    }
    // right wing (mirror)
    for (var j = 0; j < 5; j++) {
      px(15.5 + j * 0.5 - 1, 3 + j, wingEdge, 1, 1);
      px(15 + j * 0.4 - 1, 4 + j * 1.3, wingCol, 2 + j * 0.4, 1);
    }

    // Eye glow flicker
    ctx.save();
    ctx.globalAlpha = frame ? 0.45 : 0.25;
    px(4.5, 7, '#ff5a5a', 2, 2);
    px(11.5, 7, '#ff5a5a', 2, 2);
    ctx.restore();
  }

  /* =======================================================================
   * THE AETHER CRYSTAL — floating glowing crystal the player defends.
   * pulse 0..1 drives the glow; hpRatio 0..1 dims + cracks it.
   * Centered at (x, y).
   * ===================================================================== */
  function drawCrystal(ctx, x, y, size, pulse, hpRatio) {
    pulse = clamp01(pulse);
    hpRatio = clamp01(hpRatio == null ? 1 : hpRatio);

    // Hue shifts from bright cyan (full HP) toward dim red (near death).
    var hp = hpRatio;
    var coreLight = mixHex('#bff6ff', '#ff9a9a', 1 - hp);
    var coreMid = mixHex('#4fd0ff', '#c0392b', 1 - hp);
    var coreDark = mixHex('#1f7bb5', '#6e1b14', 1 - hp);
    var edge = '#0d2a3a';

    var gridW = 10, gridH = 14;
    var originX = x - (gridW * size) / 2;
    var originY = y - (gridH * size) / 2;
    var px = makePx(ctx, originX, originY, size);

    // --- Aura glow (concentric translucent blocks, pulses in size) ---
    var glowR = 3 + pulse * 1.6;
    ctx.save();
    ctx.globalAlpha = (0.10 + pulse * 0.18) * (0.4 + 0.6 * hp);
    ctx.fillStyle = coreLight;
    ctx.beginPath();
    ctx.arc(x, y, size * glowR * 1.6, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // --- Crystal facets (diamond silhouette) ---
    var P = {
      O: edge,
      l: coreLight,
      m: coreMid,
      d: coreDark
    };
    var rows = [
      '....OO....',
      '...OllO...',
      '..OlmmlO..',
      '.OlmmmmlO.',
      'OlmmddmmlO',
      'OmmddddmmO',
      'Ommddddmm O',
      'OdmddddmdO',
      '.OdmddmdO.',
      '..OdmmdO..',
      '...OddO...',
      '....OO....',
      '.....l....',
      '.....O....'
    ];
    // paint manually (rows have a stray extra char guard)
    for (var r = 0; r < rows.length; r++) {
      var row = rows[r];
      for (var c = 0; c < row.length && c < gridW; c++) {
        var col = P[row[c]];
        if (col) px(c, r, col, 1, 1);
      }
    }

    // --- Bright specular highlight (top-left facet) ---
    ctx.save();
    ctx.globalAlpha = 0.5 + pulse * 0.4;
    px(3, 2, '#ffffff', 1, 2);
    px(2, 4, '#ffffff', 1, 1);
    ctx.restore();

    // --- Cracks appear as HP drops (draw dark jagged lines) ---
    if (hp < 0.66) {
      ctx.save();
      ctx.strokeStyle = 'rgba(10,20,30,0.8)';
      ctx.lineWidth = Math.max(1, size * 0.4);
      ctx.beginPath();
      ctx.moveTo(originX + 5 * size, originY + 3 * size);
      ctx.lineTo(originX + 4 * size, originY + 6 * size);
      ctx.lineTo(originX + 6 * size, originY + 8 * size);
      ctx.stroke();
      if (hp < 0.33) {
        ctx.beginPath();
        ctx.moveTo(originX + 5 * size, originY + 5 * size);
        ctx.lineTo(originX + 7 * size, originY + 7 * size);
        ctx.lineTo(originX + 6 * size, originY + 10 * size);
        ctx.stroke();
      }
      ctx.restore();
    }

    // --- Floating sparkles orbiting the crystal ---
    ctx.save();
    ctx.globalAlpha = 0.6 + pulse * 0.4;
    ctx.fillStyle = coreLight;
    var t = pulse * Math.PI * 2;
    for (var s = 0; s < 3; s++) {
      var a = t + (s * Math.PI * 2) / 3;
      var sx = x + Math.cos(a) * size * 6;
      var sy = y + Math.sin(a) * size * 4 - size * 2;
      ctx.fillRect(Math.round(sx), Math.round(sy), Math.ceil(size), Math.ceil(size));
    }
    ctx.restore();
  }

  /* =======================================================================
   * PARALLAX BACKGROUND
   * Starry night sky gradient + moon + distant mountains + village
   * silhouette + ground. `time` (ms) drives twinkle + a gentle moon glow.
   * ===================================================================== */
  function drawBackground(ctx, w, h, time) {
    time = time || 0;

    // --- Sky gradient (deep indigo -> dusky violet near horizon) ---
    var groundY = Math.round(h * 0.82);
    var sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#0b1030');
    sky.addColorStop(0.55, '#1a1e46');
    sky.addColorStop(1, '#3a2a52');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, w, groundY);

    // --- Stars (deterministic pseudo-random field, twinkling) ---
    var starCount = Math.floor(w / 6);
    for (var i = 0; i < starCount; i++) {
      var sx = (hash01(i * 2 + 1) * w);
      var sy = hash01(i * 2 + 7) * groundY * 0.85;
      var tw = 0.5 + 0.5 * Math.sin(time * 0.002 + i * 1.3);
      var a = 0.25 + tw * 0.6;
      ctx.globalAlpha = a;
      ctx.fillStyle = i % 7 === 0 ? '#bfe0ff' : '#ffffff';
      var ssize = hash01(i * 3 + 2) > 0.85 ? 2 : 1;
      ctx.fillRect(Math.round(sx), Math.round(sy), ssize, ssize);
    }
    ctx.globalAlpha = 1;

    // --- Moon (top-right) with soft pulsing glow ---
    var moonX = w * 0.82, moonY = h * 0.2;
    var moonGlow = 0.5 + 0.5 * Math.sin(time * 0.0012);
    ctx.save();
    ctx.globalAlpha = 0.18 + moonGlow * 0.12;
    ctx.fillStyle = '#fff4d0';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 46, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = '#fdf6e3';
    ctx.beginPath();
    ctx.arc(moonX, moonY, 26, 0, Math.PI * 2);
    ctx.fill();
    // crater bite (shadow crescent)
    ctx.fillStyle = '#1a1e46';
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    ctx.arc(moonX + 9, moonY - 5, 22, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // --- Far mountain range (back layer, hazy blue) ---
    drawMountains(ctx, w, groundY, groundY - h * 0.30, '#232a55', 3, 0.0);
    // --- Near mountain range (front, darker) ---
    drawMountains(ctx, w, groundY, groundY - h * 0.20, '#2c2140', 5, 0.5);

    // --- Village silhouette on the horizon ---
    drawVillage(ctx, w, groundY, time);

    // --- Ground (dark grassy plain with a subtle top rim of light) ---
    var gr = ctx.createLinearGradient(0, groundY, 0, h);
    gr.addColorStop(0, '#22331f');
    gr.addColorStop(1, '#111c10');
    ctx.fillStyle = gr;
    ctx.fillRect(0, groundY, w, h - groundY);
    // rim highlight
    ctx.fillStyle = '#3a5c34';
    ctx.fillRect(0, groundY, w, 2);
    // scattered grass tufts
    ctx.fillStyle = '#2c4a28';
    for (var g = 0; g < w; g += 14) {
      var gh = 3 + (hash01(g) * 4) | 0;
      ctx.fillRect(g, groundY + 4, 2, gh);
    }
  }

  /** Jagged mountain band. seedOff varies the profile between layers. */
  function drawMountains(ctx, w, groundY, peakY, color, step, seedOff) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    var n = 8 * step;
    for (var i = 0; i <= n; i++) {
      var mx = (i / n) * w;
      var base = groundY;
      var height = (base - peakY) * (0.4 + 0.6 * hash01(i * 1.7 + seedOff * 31));
      var my = base - height;
      ctx.lineTo(mx, my);
    }
    ctx.lineTo(w, groundY);
    ctx.closePath();
    ctx.fill();
  }

  /** Tiny village of rooftops + a couple lit windows. */
  function drawVillage(ctx, w, groundY, time) {
    var baseY = groundY;
    ctx.save();
    var count = Math.max(4, Math.floor(w / 90));
    for (var i = 0; i < count; i++) {
      var hx = (i + 0.5) * (w / count) + (hash01(i * 5) - 0.5) * 40;
      var hw = 20 + hash01(i * 9) * 16;
      var hh = 16 + hash01(i * 3) * 18;
      // wall
      ctx.fillStyle = '#171a2e';
      ctx.fillRect(hx - hw / 2, baseY - hh, hw, hh);
      // roof
      ctx.fillStyle = '#0f1122';
      ctx.beginPath();
      ctx.moveTo(hx - hw / 2 - 3, baseY - hh);
      ctx.lineTo(hx, baseY - hh - hw * 0.5);
      ctx.lineTo(hx + hw / 2 + 3, baseY - hh);
      ctx.closePath();
      ctx.fill();
      // window (warm, occasionally flickering)
      var flick = 0.6 + 0.4 * Math.sin(time * 0.004 + i * 2.1);
      ctx.globalAlpha = flick;
      ctx.fillStyle = '#ffb347';
      ctx.fillRect(hx - 2, baseY - hh * 0.55, 4, 4);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  /* =======================================================================
   * Small math utilities
   * ===================================================================== */

  /** Deterministic hash -> [0,1). Used for stars, mountains, village. */
  function hash01(n) {
    var x = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return x - Math.floor(x);
  }

  function clamp01(v) {
    if (v < 0) return 0;
    if (v > 1) return 1;
    return v;
  }

  // placeholder used inside drawEnemy before the wrapper injects hpRatio
  function hpRatioSafe() { return 1; }

  /** Linear blend between two #rrggbb colors. t=0 -> a, t=1 -> b. */
  function mixHex(a, b, t) {
    t = clamp01(t);
    var ca = parseHex(a), cb = parseHex(b);
    var r = Math.round(ca[0] + (cb[0] - ca[0]) * t);
    var g = Math.round(ca[1] + (cb[1] - ca[1]) * t);
    var bl = Math.round(ca[2] + (cb[2] - ca[2]) * t);
    return 'rgb(' + r + ',' + g + ',' + bl + ')';
  }

  function parseHex(h) {
    if (h[0] === '#') h = h.slice(1);
    if (h.length === 3) {
      h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    }
    return [
      parseInt(h.slice(0, 2), 16),
      parseInt(h.slice(2, 4), 16),
      parseInt(h.slice(4, 6), 16)
    ];
  }

  /* =======================================================================
   * Re-implement drawEnemy cleanly with real hpRatio paling.
   * (Defined last so it overrides the stub above.)
   * ===================================================================== */
  drawEnemy = function (ctx, x, baseY, size, type, frame, hpRatio) {
    hpRatio = clamp01(hpRatio == null ? 1 : hpRatio);
    var pale = (1 - hpRatio) * 0.55; // fade toward gray as it dies
    var wob = frame ? 1 : 0;

    // 'wraith' floats: no ground contact, a hover offset, and a soft
    // bob that swaps direction from the walkers' wobble.
    var floats = (type === 'wraith');
    var floatLift = floats ? (frame ? 4 : 3) : 0;
    var y = baseY - wob * size - floatLift * size;
    if (!floats) groundShadow(ctx, x, baseY, size, size * 3.6);

    // Per-type body / shade / eye palette.
    var body, bodyShade, eye, seam;
    if (type === 'fast') {
      body = '#7d3fb0'; bodyShade = '#5a2b82'; eye = '#ffe14d';
    } else if (type === 'tank') {
      body = '#3a5f4a'; bodyShade = '#26402f'; eye = '#ff5a3c';
    } else if (type === 'runner') {
      body = '#8a2f2f'; bodyShade = '#5e1e1e'; eye = '#ffd23c';
    } else if (type === 'golem') {
      body = '#4a4550'; bodyShade = '#2b2830'; eye = '#ff8a3c';
      seam = '#ff7a1a'; // molten glowing cracks
    } else if (type === 'wraith') {
      body = '#9fb8c8'; bodyShade = '#6f8a9c'; eye = '#b6ff9e';
    } else {
      body = '#3b3b52'; bodyShade = '#242437'; eye = '#ff4d6d';
    }

    var P = {
      O: '#0a0a12',
      b: mixHex(body, '#9aa0ac', pale),
      B: mixHex(bodyShade, '#6b6f7a', pale),
      e: eye,
      s: seam ? mixHex(seam, '#9aa0ac', pale) : undefined, // golem seam glow
      w: '#ffffff',
      t: '#e8e8f0'
    };
    // wraiths glow eerily rather than fade to dull gray teeth.
    if (type === 'wraith') { P.O = '#1c2b33'; P.t = '#e9fff0'; }

    var rows, gridW = 12, gridH = 12;
    if (type === 'tank') {
      rows = [
        '.O......O...',
        '.OB....BO...',
        '..OBbbBO....',
        '.OBbbbbBO...',
        'OBbeb beBO..',
        'OBbbbbbbBO..',
        'OBb t t bBO.',
        'OBbtttttBO..',
        '.OBbbbbBO...',
        '..OBbbBO....',
        '..O.OO.O....',
        '..O....O....'
      ];
    } else if (type === 'fast') {
      rows = [
        '..O...O.....',
        '..OB.BO.....',
        '...OBBO.....',
        '..OBbbBO....',
        '.Obebe bO...',
        '.Obbbbb O...',
        '.Ob ttt bO..',
        '..Obbbb O...',
        '...OBbBO....',
        '...OB.O.....',
        '..OB..O.....',
        '..O...O.....'
      ];
    } else if (type === 'runner') {
      // Lean, low, forward-leaning sprinter. Legs shift with the frame
      // to sell a running stride; bright (eye-colored) shins.
      if (frame) {
        rows = [
          '.....O..O...',
          '....OBbBO...',
          '...ObebbO...',
          '...Obbbb O..',
          '..Obb ttbO..',
          '..ObbbbbO...',
          '.OBbbbBO....',
          '.Obb.bO.....',
          'Oe...bO.....',
          '.O..Oe......',
          '....O.......',
          '...O........'
        ];
      } else {
        rows = [
          '....O..O....',
          '...OBbBO....',
          '..ObebbO....',
          '..Obbbb O...',
          '.Obb ttbO...',
          '.ObbbbbO....',
          'OBbbbBO.....',
          'Obb.bbO.....',
          'Oe...eO.....',
          '.O...O......',
          '.O...O......',
          'O.....O.....'
        ];
      }
    } else if (type === 'golem') {
      // Big blocky obsidian brute with cracked-rock texture + molten seams.
      gridW = 14; gridH = 14;
      rows = [
        '.OO......OO...',
        '.ObO....ObO...',
        'OBbbOOOObbBO..',
        'OBbsbbbbsbBO..',
        'ObbbbbbbbbbO..',
        'ObebbssbbebO..',
        'Obbbbssbbbb O.',
        'OBbttttttbBO..',
        'ObbsbbbbsbbO..',
        'ObbbbbbbbbbO..',
        'OBbbbssbbbBO..',
        '.ObbO..ObbO...',
        '.ObbO..ObbO...',
        '.OOO....OOO...'
      ];
    } else if (type === 'wraith') {
      // Ghostly specter: hooded head, eerie eyes, and a wispy tail
      // (no legs). Painted semi-transparent below.
      rows = [
        '...OOOO.....',
        '..OBbbBO....',
        '.ObbbbbbO...',
        '.Obebebeb O.',   // glowing eyes
        '.ObbbbbbbO..',
        '.Obb tt bbO.',
        '.OBbbbbbBO..',
        '..ObbbbbO...',
        '..Obbbbb O..',
        '...ObbbO....',
        '..Ob.bbO....',   // wispy tail begins
        '...O.bO.....'
      ];
    } else {
      rows = [
        '....OOOO....',
        '..OOBbbBOO..',
        '.OBbbbbbbBO.',
        '.ObebbbebbO.',
        'OBbeebbeebBO',
        'ObbbbbbbbbbO',
        'Obb tttt bbO',
        'OBbtttttbBO.',
        '.OBbbbbbBO..',
        '..OBbbbBO...',
        '.OO.O.O.OO..',
        '.O...O...O..'
      ];
    }

    // Wraiths render translucent for a see-through ghost feel.
    if (type === 'wraith') {
      ctx.save();
      ctx.globalAlpha = 0.62;
    }
    paintGrid(ctx, rows, P, x, y, size, gridW, gridH);

    var px = makePx(ctx, x - gridW * size / 2, y - gridH * size, size);

    if (type === 'golem') {
      // Molten seam glow flickers with the frame.
      ctx.save();
      ctx.globalAlpha = frame ? 0.55 : 0.30;
      px(6, 5, '#ffd24d', 2, 2);
      px(3, 3, '#ffb347', 1, 1);
      px(10, 3, '#ffb347', 1, 1);
      ctx.restore();
    } else if (type === 'wraith') {
      // Trailing wisps of the tail, fading downward, + an eerie aura.
      ctx.globalAlpha = 0.4;
      px(4.5, 11.4, P.b, 1, 1);
      ctx.globalAlpha = 0.22;
      px(5, 12.4, P.b, 1, 1);
      ctx.restore(); // end the translucent body block

      ctx.save();
      ctx.globalAlpha = frame ? 0.28 : 0.18;
      px(2.5, 2.5, '#b6ff9e', 7, 6); // pale-green glow halo
      ctx.restore();
    }

    // eye glints for the round slime
    ctx.save();
    ctx.globalAlpha = 0.9;
    if (type === 'normal') {
      px(3.1, 4.1, '#ffffff', 0.5, 0.5);
      px(7.1, 4.1, '#ffffff', 0.5, 0.5);
    }
    ctx.restore();
  };

  /* =======================================================================
   * Publish to global scope
   * ===================================================================== */
  window.drawKnight = drawKnight;
  window.drawMage = drawMage;
  window.drawArcher = drawArcher;
  window.drawHealer = drawHealer;
  window.drawRonin = drawRonin;
  window.drawEnemy = function (ctx, x, baseY, size, type, frame, hpRatio) {
    return drawEnemy(ctx, x, baseY, size, type, frame, hpRatio);
  };
  window.drawBoss = drawBoss;
  window.drawCrystal = drawCrystal;
  window.drawBackground = drawBackground;

  window.Sprites = {
    drawKnight: drawKnight,
    drawMage: drawMage,
    drawArcher: drawArcher,
    drawHealer: drawHealer,
    drawRonin: drawRonin,
    drawEnemy: window.drawEnemy,
    drawBoss: drawBoss,
    drawCrystal: drawCrystal,
    drawBackground: drawBackground
  };
})(typeof window !== 'undefined' ? window : this);
