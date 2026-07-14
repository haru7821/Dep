/* ============================================================================
   Dungeon background — overrides Sprites.drawBackground with a stone-brick
   dungeon corridor (mossy walls, arch, flagstone floor, flickering torches).
   Loaded after sprites.js so it replaces the night-sky background.
   ========================================================================== */
'use strict';
(function () {
  // stable pseudo-random per tile (so stones don't flicker frame to frame)
  function hash(a, b){ let h = (a * 73856093 ^ b * 19349663) >>> 0; return (h % 1000) / 1000; }

  function drawTorch(ctx, x, y, time){
    // wrought-iron bracket
    ctx.fillStyle = '#241a10'; ctx.fillRect(x-2, y, 4, 16);
    ctx.fillStyle = '#3a2a16'; ctx.fillRect(x-5, y+13, 10, 4);
    // warm glow on the wall
    const fl = 0.72 + 0.22*Math.sin(time/90) + 0.12*Math.sin(time/37 + x);
    let g = ctx.createRadialGradient(x, y-6, 2, x, y-6, 86);
    g.addColorStop(0, 'rgba(255,186,86,'+(0.34*fl)+')');
    g.addColorStop(1, 'rgba(255,140,40,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y-6, 86, 0, 7); ctx.fill();
    // flame
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    const cols = ['#ff6a12', '#ffab3c', '#ffe38a'];
    for (let i = 0; i < 3; i++){
      const fy = y - 6 - i*5;
      const fw = (7 - i*2) + Math.sin(time/60 + i)*1.6;
      ctx.fillStyle = cols[i];
      ctx.beginPath();
      ctx.ellipse(x + Math.sin(time/70 + i)*1.4, fy, Math.max(1, fw*0.55), Math.max(2,(10 - i*2))*fl, 0, 0, 7);
      ctx.fill();
    }
    ctx.restore();
  }

  function drawBackground(ctx, w, h, time){
    const floorY = Math.round(h * 0.72);

    // base
    ctx.fillStyle = '#181c15'; ctx.fillRect(0, 0, w, h);

    // ---- brick wall ----
    const bw = 46, bh = 22;
    for (let ry = 0, r = 0; ry < floorY; ry += bh, r++){
      const off = (r % 2) ? bw/2 : 0;
      for (let x = -off; x < w; x += bw){
        const n = hash(r, Math.round(x/bw));
        const b = 56 + n*26;                    // stone brightness (greenish grey)
        ctx.fillStyle = `rgb(${Math.round(b*0.74)},${Math.round(b*0.84)},${Math.round(b*0.68)})`;
        ctx.fillRect(x+1, ry+1, bw-2, bh-2);
        ctx.fillStyle = 'rgba(255,255,235,0.05)';  // top bevel
        ctx.fillRect(x+1, ry+1, bw-2, 2);
        ctx.fillStyle = 'rgba(0,0,0,0.18)';        // bottom shade
        ctx.fillRect(x+1, ry+bh-3, bw-2, 2);
        if (n > 0.86){ ctx.fillStyle = 'rgba(70,104,52,0.55)'; ctx.fillRect(x+2, ry+bh-6, bw-4, 5); } // moss
      }
    }

    // ---- back arch (depth) ----
    const ax = Math.round(w*0.5), aw = Math.min(220, w*0.26), ah = floorY*0.86;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(ax-aw/2, floorY);
    ctx.lineTo(ax-aw/2, floorY-ah*0.55);
    ctx.arc(ax, floorY-ah*0.55, aw/2, Math.PI, 0);
    ctx.lineTo(ax+aw/2, floorY);
    ctx.closePath();
    let ag = ctx.createLinearGradient(0, floorY-ah, 0, floorY);
    ag.addColorStop(0, '#0c0f0a'); ag.addColorStop(1, '#050704');
    ctx.fillStyle = ag; ctx.fill();
    ctx.lineWidth = 5; ctx.strokeStyle = '#2c322a'; ctx.stroke();
    ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(120,140,105,0.25)'; ctx.stroke();
    ctx.restore();

    // ---- flagstone floor ----
    ctx.fillStyle = '#20241c'; ctx.fillRect(0, floorY, w, h-floorY);
    const fh = 20;
    for (let y = floorY+2, r = 0; y < h; y += fh, r++){
      const off = (r % 2) ? 24 : 0;
      for (let x = -off; x < w; x += 48){
        const n = hash(900+r, Math.round(x/48));
        ctx.fillStyle = `rgb(${Math.round(30+n*16)},${Math.round(34+n*16)},${Math.round(26+n*12)})`;
        ctx.fillRect(x+1, y+1, 46, fh-2);
        if (n > 0.88){ ctx.fillStyle = 'rgba(70,104,52,0.4)'; ctx.fillRect(x+2, y+2, 12, 4); }
      }
    }
    // floor lip
    ctx.fillStyle = '#0e110b'; ctx.fillRect(0, floorY-2, w, 3);
    ctx.fillStyle = 'rgba(150,170,130,0.16)'; ctx.fillRect(0, floorY+1, w, 2);

    // ---- torches ----
    drawTorch(ctx, Math.round(w*0.20), Math.round(floorY*0.42), time);
    drawTorch(ctx, Math.round(w*0.78), Math.round(floorY*0.42), time);

    // ---- vignette ----
    const vg = ctx.createRadialGradient(w/2, h*0.5, h*0.32, w/2, h*0.5, h*0.9);
    vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.42)');
    ctx.fillStyle = vg; ctx.fillRect(0, 0, w, h);
  }

  if (window.Sprites) window.Sprites.drawBackground = drawBackground;
  window.drawDungeon = drawBackground;
})();
