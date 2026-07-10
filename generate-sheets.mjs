/* Generates DETAILED animated pixel-art sprite sheets (idle/walk/attack/cast)
   as PNGs into ./assets/. Higher resolution (128px cells, fine pixel unit) with
   shading, outlines, and per-frame motion. Layout: 4 rows x 6 frames. */
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage();

// base colors only — mid/dark/light tones are derived in-page via shade()
const CHARS = {
  warrior:  { primary:'#8a5a2e', cape:'#6f4522', metal:'#c7d0da', skin:'#f0c9a0', hair:'#6b3f1e', trim:'#c0392b', accent:'#f2c14e', gear:'band',   weapon:'sword' },
  wizard:   { primary:'#4a1f7a', cape:'#37135e', metal:'#7a5230', skin:'#f0c9a0', hair:'#2a1240', trim:'#c0392b', accent:'#f2c14e', gear:'wizhat', weapon:'staff', orb:'#5cd8ff' },
  archer:   { primary:'#3f8f3a', cape:'#2c6b2a', metal:'#7a4a24', skin:'#f0c9a0', hair:'#5b3a1e', trim:'#caa06a', accent:'#f2c14e', gear:'hood',   weapon:'bow' },
  sorcerer: { primary:'#2a2740', cape:'#191630', metal:'#caa050', skin:'#f0c9a0', hair:'#241a12', trim:'#ff8a1a', accent:'#ffb347', gear:'hood',   weapon:'orbs' },
  healer:   { primary:'#f2efe2', cape:'#d8d2be', metal:'#caa03a', skin:'#f0c9a0', hair:'#a06a2c', trim:'#f2c14e', accent:'#fff2b0', gear:'hood',   weapon:'staff', orb:'#ffd766', aura:'#ffe9a0' },
  shadow:   { primary:'#241233', cape:'#150a1f', metal:'#4a1f5c', skin:'#20142c', hair:'#140a20', trim:'#7a2fb0', accent:'#a44bff', gear:'cowl',   weapon:'wisp', eyes:'#ff3b3b', aura:'#a44bff' },
};
const FILE = { warrior:'warrior.png', wizard:'wizard.png', archer:'archer.png', sorcerer:'sorcerer.png', healer:'healer.png', shadow:'shadow.png' };

for (const [name, cfg] of Object.entries(CHARS)){
  const dataUrl = await page.evaluate((cfg) => {
    const CELL = 128, COLS = 6, ROWS = 4, U = 2.4;   // finer pixel unit
    const ANIMS = ['idle','walk','attack','cast'];
    const cv = document.createElement('canvas'); cv.width = COLS*CELL; cv.height = ROWS*CELL;
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    const OUT = '#0b1020';

    const shade = (hex, f) => {
      let r=parseInt(hex.slice(1,3),16), gg=parseInt(hex.slice(3,5),16), b=parseInt(hex.slice(5,7),16);
      r=Math.max(0,Math.min(255,Math.round(r*f))); gg=Math.max(0,Math.min(255,Math.round(gg*f))); b=Math.max(0,Math.min(255,Math.round(b*f)));
      return 'rgb('+r+','+gg+','+b+')';
    };
    const R = (x,y,w,h,c)=>{ g.fillStyle=c; g.fillRect(Math.round(x),Math.round(y),Math.max(1,Math.round(w)),Math.max(1,Math.round(h))); };
    // filled rect with a 1px-ish dark outline for a defined silhouette
    const RO = (x,y,w,h,c,o=OUT)=>{ R(x-1,y-1,w+2,h+2,o); R(x,y,w,h,c); };

    const P = {
      skin:cfg.skin, skinD:shade(cfg.skin,0.82), skinL:shade(cfg.skin,1.08),
      hair:cfg.hair, hairD:shade(cfg.hair,0.75),
      pri:cfg.primary, priM:shade(cfg.primary,0.86), priD:shade(cfg.primary,0.68), priL:shade(cfg.primary,1.14),
      cape:cfg.cape, capeD:shade(cfg.cape,0.75),
      metal:cfg.metal, metalM:shade(cfg.metal,0.8), metalD:shade(cfg.metal,0.6), metalL:shade(cfg.metal,1.2),
      trim:cfg.trim, trimD:shade(cfg.trim,0.75),
      accent:cfg.accent,
    };

    function glowCircle(x,y,r,color,blur){ g.save(); g.shadowColor=color; g.shadowBlur=blur; g.fillStyle=color; g.beginPath(); g.arc(x,y,r,0,7); g.fill(); g.restore(); }

    function draw(cx, fy, anim, prog){
      const t = prog, tau = Math.PI*2;
      const br = Math.sin(t*tau);
      const walkC = anim==='walk' ? Math.sin(t*tau) : 0;
      const yo = anim==='idle' ? br*1.3*U*0.5 : anim==='walk' ? -Math.abs(walkC)*U : 0;   // body lift
      const y = fy + yo;
      // attack swing envelope, cast build/release
      const swing = anim==='attack' ? (t<0.45 ? -0.7 + t*0.6 : 0.95 - (t-0.45)*0.5) : 0;
      const castT = anim==='cast' ? (t<0.75 ? t/0.75 : 1-(t-0.75)/0.25) : 0;
      const capeSway = Math.sin(t*tau+0.6) * U * (anim==='walk'?1.6:anim==='attack'?2:1);

      // ---- ground shadow ----
      g.globalAlpha=0.28; g.fillStyle='#000'; g.beginPath(); g.ellipse(cx, fy, 11*U, 3*U, 0,0,7); g.fill(); g.globalAlpha=1;

      // ---- back cape ----
      g.fillStyle=P.capeD; g.beginPath();
      g.moveTo(cx-8*U, y-19*U); g.lineTo(cx+8*U, y-19*U);
      g.lineTo(cx+9*U+capeSway, y-2*U); g.lineTo(cx+3*U+capeSway, y-1*U);
      g.lineTo(cx, y-3*U); g.lineTo(cx-3*U-capeSway, y-1*U); g.lineTo(cx-9*U-capeSway, y-2*U);
      g.closePath(); g.fill();
      g.fillStyle=P.cape; g.beginPath();
      g.moveTo(cx-7*U, y-19*U); g.lineTo(cx+7*U, y-19*U); g.lineTo(cx+7*U+capeSway, y-4*U);
      g.lineTo(cx-7*U-capeSway, y-4*U); g.closePath(); g.fill();

      // ---- legs / boots (stride) ----
      const s = walkC*2*U;
      const legFn = (lx, dir, col, boot) => {
        R(cx+lx-1.6*U, y-6*U, 3.2*U, 5*U, col);            // leg
        RO(cx+lx-2*U, y-2.2*U, 4*U, 2.4*U, boot);          // boot
        R(cx+lx-2*U, y-2.2*U, 4*U, 0.9*U, P.metalL);       // boot cuff hi
      };
      legFn(-2.6*U + s, -1, P.priD, P.metalD);
      legFn( 2.6*U - s,  1, P.priM, P.metal);

      // ---- torso ----
      RO(cx-7*U, y-19*U, 14*U, 13.5*U, P.pri);
      R(cx-7*U, y-19*U, 5*U, 13.5*U, P.priM);              // left shade
      R(cx-2*U, y-19*U, 4*U, 12*U, P.priL);                // front light
      // belt + buckle
      R(cx-7*U, y-8.5*U, 14*U, 2*U, P.trimD);
      R(cx-7*U, y-8.5*U, 14*U, 0.8*U, P.trim);
      RO(cx-1.3*U, y-8.7*U, 2.6*U, 2.4*U, P.accent);
      // shoulder trims
      R(cx-7.5*U, y-19*U, 15*U, 1.6*U, P.trim);
      // chest emblem
      R(cx-1*U, y-16*U, 2*U, 4*U, P.accent);

      // ---- back arm ----
      RO(cx-8.5*U, y-18*U, 3*U, 8*U, P.priM);
      R(cx-8*U, y-11*U, 2.4*U, 2.4*U, P.skin);             // hand

      // ---- front arm + weapon ----
      const shx = cx+6.5*U, shy = y-17*U;                  // shoulder
      const hx = cx+7*U, hy = y-10*U;                      // hand rest
      const W = cfg.weapon;
      if (W==='sword'){
        RO(cx+5.5*U, y-18*U, 3*U, 8*U, P.priL);            // front arm
        g.save(); g.translate(cx+6*U, y-11*U); g.rotate(-1.0 + swing*1.7);
        R(-1.4*U,-1.4*U, 2.8*U, 2.8*U, P.skin);            // hand grip
        R(-0.5*U, 0.4*U, 1.6*U, 3*U, shade(cfg.metal,0.4));// grip
        RO(-1.6*U, 3.2*U, 4*U, 1.6*U, P.accent);           // pommel/guard
        RO(-0.7*U, -12*U, 2*U, 12.5*U, P.metal);           // blade
        R(-0.2*U, -12*U, 0.7*U, 12*U, P.metalL);           // blade highlight
        R(0.1*U, -11*U, 0.3*U, 10*U, P.metalD);            // fuller
        g.restore();
        if (anim==='attack' && t>0.5){ g.strokeStyle='#eef4ff'; g.lineWidth=3; g.globalAlpha=1-(t-0.5)/0.5;
          g.beginPath(); g.arc(cx+4*U, y-9*U, 11*U, -1.2, 0.6); g.stroke(); g.globalAlpha=1; }
      } else if (W==='bow'){
        const pull = anim==='attack'? t : (anim==='cast'?castT:0.25);
        RO(cx+4.5*U, y-17*U, 3*U, 7*U, P.priL);
        g.strokeStyle=P.metalD; g.lineWidth=U; g.beginPath(); g.arc(cx+8*U, y-10*U, 7*U, -1.15, 1.15); g.stroke();
        g.strokeStyle=P.accent; g.lineWidth=1; g.beginPath(); g.arc(cx+8*U, y-10*U, 7*U, -1.15, 1.15); g.stroke();
        g.strokeStyle='#f2f2f2'; g.lineWidth=1; g.beginPath();
        g.moveTo(cx+8*U, y-16.5*U); g.lineTo(cx+8*U-pull*4*U, y-10*U); g.lineTo(cx+8*U, y-3.5*U); g.stroke();
        R(cx+3*U, y-11*U, 2.4*U, 2.4*U, P.skin);
        if ((anim==='attack'||anim==='cast') && t>0.6){ R(cx+8*U, y-10.5*U, 7*U, 1*U, '#caa06a'); R(cx+15*U, y-11*U, 2.5*U, 2.5*U, P.accent); }
      } else if (W==='staff'){
        RO(cx+5.5*U, y-17*U, 3*U, 8*U, P.priL);
        R(cx+6.6*U, y-24*U, 1.8*U, 17*U, shade(cfg.metal,0.55));   // shaft
        R(cx+6.6*U, y-24*U, 0.7*U, 17*U, P.metalL);
        for(let k=0;k<4;k++) R(cx+6.4*U, y-18*U+k*3*U, 2.2*U, 0.8*U, P.metalD); // wrap
        const orb = cfg.orb||'#5cd8ff'; const rr = (2.4+castT*2.6)*U;
        glowCircle(cx+7.5*U, y-24*U, rr, orb, 12+castT*16);
        R(cx+6.6*U, y-25*U, 1.6*U,1.6*U, '#ffffff');
      } else if (W==='orbs'){
        RO(cx+5.5*U, y-17*U, 3*U, 7*U, P.priL);
        R(cx+6*U, y-11*U, 2.4*U, 2.4*U, P.skin);
        const cols=['#ff5a3c','#5be18a','#5cd8ff'];
        for(let i=0;i<3;i++){ const a=t*tau+i*2.094; const ox=cx+Math.cos(a)*6*U, oy=y-11*U+Math.sin(a)*4.5*U;
          glowCircle(ox,oy,(1.8+castT*1.6)*U,cols[i],9+castT*10); R(ox-0.6*U,oy-0.6*U,1.2*U,1.2*U,'#ffffff'); }
      } else if (W==='wisp'){
        RO(cx+5.5*U, y-17*U, 3*U, 8*U, P.priM);
        R(cx+6*U, y-10*U, 2.6*U, 2.6*U, P.metalM);
        const rr=(2+castT*3)*U;
        glowCircle(cx+8*U, y-10*U, rr, cfg.accent, 12+castT*16);
        for(let i=0;i<4;i++){ const a=t*tau+i*1.57; R(cx+8*U+Math.cos(a)*5*U, y-10*U+Math.sin(a)*5*U, 1.4*U,1.4*U, cfg.accent); }
      }

      // ---- neck + head ----
      R(cx-2.2*U, y-20*U, 4.4*U, 2.5*U, P.skinD);
      RO(cx-6*U, y-31*U, 12*U, 11*U, P.skin);              // head
      R(cx-6*U, y-31*U, 4*U, 11*U, P.skinD);               // face shade
      R(cx+1*U, y-30*U, 4*U, 9*U, P.skinL);                // face light
      // ears
      R(cx-6.6*U, y-27*U, 1.4*U, 2.4*U, P.skinD); R(cx+5.2*U, y-27*U, 1.4*U, 2.4*U, P.skin);

      // ---- gear ----
      const gear = cfg.gear;
      if (gear==='band'){
        R(cx-6.4*U, y-31.5*U, 12.8*U, 4*U, P.hair);        // hair top
        R(cx-6.6*U, y-30*U, 2*U, 4*U, P.hair); R(cx+4.6*U, y-30*U, 2*U, 4*U, P.hairD);
        R(cx-6.6*U, y-28.6*U, 13.2*U, 1.8*U, P.trim);      // headband
        R(cx+3.4*U, y-29*U, 3*U, 2*U, P.trim);             // band tail
      } else if (gear==='wizhat'){
        R(cx-9*U, y-24*U, 18*U, 2.6*U, P.priD);            // brim
        R(cx-9*U, y-24*U, 18*U, 1*U, P.priL);
        for(let k=0;k<7;k++){ const w=(9-k*1.1)*U; R(cx-w/2 + Math.sin(k*0.7)*U, y-24*U-k*2.6*U, w, 3*U, k%2?P.priM:P.pri); }
        glowCircle(cx+2*U, y-40*U, 1.8*U, P.accent, 8);
      } else if (gear==='hood'){
        RO(cx-7.5*U, y-33*U, 15*U, 9*U, P.priD);           // hood outer
        R(cx-6.2*U, y-32*U, 12.4*U, 5*U, P.pri);
        R(cx-6.2*U, y-32*U, 4*U, 6*U, P.priM);
        R(cx-4.5*U, y-26*U, 9*U, 4*U, shade(cfg.skin, gear==='hood'?0.7:1)); // face in shadow
        R(cx-4.5*U, y-26*U, 9*U, 4*U, P.skinD);
      } else if (gear==='cowl'){
        RO(cx-8*U, y-34*U, 16*U, 12*U, P.priD);
        R(cx-6.5*U, y-33*U, 13*U, 6*U, P.pri);
        R(cx-5*U, y-25*U, 10*U, 5*U, '#0a0710');           // pitch-dark face
      }

      // ---- face (eyes) ----
      if (cfg.eyes){ glowCircle(cx-2.6*U, y-24.5*U, 1.5*U, cfg.eyes, 8); glowCircle(cx+2.2*U, y-24.5*U, 1.5*U, cfg.eyes, 8); }
      else if (gear!=='cowl'){
        R(cx-3.4*U, y-25*U, 1.8*U, 2.2*U, '#ffffff'); R(cx+1.6*U, y-25*U, 1.8*U, 2.2*U, '#ffffff');
        R(cx-2.8*U, y-24.6*U, 1.1*U, 1.6*U, '#20304a'); R(cx+2.1*U, y-24.6*U, 1.1*U, 1.6*U, '#20304a');
        R(cx-3.6*U, y-26*U, 2*U, 0.8*U, P.hairD); R(cx+1.6*U, y-26*U, 2*U, 0.8*U, P.hairD); // brows
      }

      // ---- cast aura / rune ----
      if (cfg.aura && anim==='cast'){
        g.save(); g.globalAlpha=0.22+0.18*Math.sin(t*tau); g.strokeStyle=cfg.aura; g.lineWidth=1.6;
        g.beginPath(); g.ellipse(cx, y-10*U, 10*U, 13*U, 0, 0, 7); g.stroke();
        g.beginPath(); g.arc(cx, y-4*U, (6+castT*3)*U, 0, 7); g.stroke(); g.restore();
      }
    }

    ANIMS.forEach((anim, r) => {
      for (let c = 0; c < COLS; c++){
        const cx = c*CELL + CELL/2;
        const fy = r*CELL + CELL - 12;
        draw(cx, fy, anim, c/COLS);
      }
    });
    return cv.toDataURL('image/png');
  }, cfg);

  fs.mkdirSync(path.join(dir,'assets'),{recursive:true});
  fs.writeFileSync(path.join(dir,'assets',FILE[name]), Buffer.from(dataUrl.split(',')[1],'base64'));
  console.log('wrote assets/'+FILE[name]);
}
await browser.close();
console.log('done');
