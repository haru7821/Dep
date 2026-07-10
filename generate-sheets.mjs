/* Generates animated pixel-art sprite sheets (idle/walk/attack/cast) as PNGs
   into ./assets/. Rendered in a headless browser canvas, then written to disk.
   Layout: 4 rows (idle, walk, attack, cast) x 6 frames, 80px cells. */
import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const dir = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage();

const CHARS = {
  warrior:  { skin:'#f0c9a0', hair:'#7a4a24', cloak:'#5b3a1e', cloakD:'#3d2614', trim:'#c0392b', metal:'#c9d2dc', metalD:'#8a939c', accent:'#f2c14e', gear:'hair', weapon:'sword' },
  wizard:   { skin:'#f0c9a0', hair:'#3d1c5c', cloak:'#4a1f7a', cloakD:'#301050', trim:'#c0392b', metal:'#6b4a2a', metalD:'#4a3018', accent:'#f2c14e', gear:'hat', weapon:'staff', orb:'#5cd8ff' },
  archer:   { skin:'#f0c9a0', hair:'#5b3a1e', cloak:'#3f8f3a', cloakD:'#2c6b2a', trim:'#caa06a', metal:'#7a4a24', metalD:'#5b3618', accent:'#f2c14e', gear:'hood', weapon:'bow' },
  sorcerer: { skin:'#f0c9a0', hair:'#241a12', cloak:'#2a2740', cloakD:'#181630', trim:'#ff8a1a', metal:'#caa050', metalD:'#8a6a30', accent:'#ffb347', gear:'hood', weapon:'orbs' },
  healer:   { skin:'#f0c9a0', hair:'#a06a2c', cloak:'#f6f3e8', cloakD:'#d9d3bf', trim:'#f2c14e', metal:'#caa03a', metalD:'#9a7a2a', accent:'#fff2b0', gear:'hood', weapon:'staff', orb:'#ffd766', aura:'#ffe9a0' },
  shadow:   { skin:'#20142c', hair:'#140a20', cloak:'#241233', cloakD:'#160a20', trim:'#7a2fb0', metal:'#4a1f5c', metalD:'#2a1533', accent:'#a44bff', gear:'cowl', weapon:'none', eyes:'#ff3b3b', aura:'#a44bff' },
};
const FILE = { warrior:'warrior.png', wizard:'wizard.png', archer:'archer.png', sorcerer:'sorcerer.png', healer:'healer.png', shadow:'shadow.png' };

for (const [name, cfg] of Object.entries(CHARS)){
  const dataUrl = await page.evaluate((cfg) => {
    const CELL = 80, COLS = 6, ROWS = 4, U = 3;   // U = pixel unit
    const ANIMS = ['idle','walk','attack','cast'];
    const cv = document.createElement('canvas'); cv.width = COLS*CELL; cv.height = ROWS*CELL;
    const g = cv.getContext('2d'); g.imageSmoothingEnabled = false;
    const R = (x,y,w,h,c)=>{ g.fillStyle=c; g.fillRect(Math.round(x),Math.round(y),Math.round(w),Math.round(h)); };
    const OUT = '#0c1226';

    function draw(cx, fy, anim, prog){
      const bob = Math.sin(prog*Math.PI*2);
      const walk = anim==='walk';
      const stride = walk ? Math.sin(prog*Math.PI*2) : 0;
      const yb = (anim==='idle'? bob*U*0.4 : walk? -Math.abs(bob)*U*0.5 : 0);
      const swing = anim==='attack' ? (prog<0.5 ? -0.5+prog*1.2 : 1.0-(prog-0.5)*1.2) : 0;
      const castT = anim==='cast' ? Math.min(1, prog*1.3) : 0;
      const y = fy + yb;

      // ground shadow
      g.globalAlpha=0.25; R(cx-9*U, fy-1, 18*U, 3, '#000'); g.globalAlpha=1;

      // legs (stride)
      const lx = 3*U + stride*2*U, rx = 3*U - stride*2*U;
      R(cx-lx-2*U, y-4*U, 3*U, 4*U, cfg.metalD);
      R(cx+rx-1*U, y-4*U, 3*U, 4*U, cfg.metal);

      // body / cloak
      R(cx-6*U, y-13*U, 12*U, 10*U, cfg.cloakD);
      R(cx-5*U, y-13*U, 10*U, 9*U, cfg.cloak);
      R(cx-5*U, y-8*U, 10*U, 1*U, cfg.trim);            // belt
      // chest highlight
      R(cx-3*U, y-12*U, 3*U, 5*U, cfg.metal);

      // back arm + weapon
      const wax = cx+4*U, way = y-11*U;
      if (cfg.weapon==='sword'){
        g.save(); g.translate(wax, way); g.rotate(-0.9+swing*1.6);
        R(-1*U,-1*U,2*U,2*U,cfg.skin);                 // hand
        R(0,-9*U,1.4*U,9*U,cfg.metal);                 // blade
        R(-0.4*U,-0*U,2.2*U,1.4*U,cfg.accent);         // guard
        g.restore();
        if (anim==='attack' && prog>0.55){             // slash arc
          g.strokeStyle='#eaf2ff'; g.lineWidth=3; g.globalAlpha=1-(prog-0.55)/0.45;
          g.beginPath(); g.arc(cx+3*U, y-9*U, 8*U, -1.1, 0.7); g.stroke(); g.globalAlpha=1;
        }
      } else if (cfg.weapon==='bow'){
        const draw2 = anim==='attack'? prog : (anim==='cast'?castT:0.3);
        g.strokeStyle=cfg.metalD; g.lineWidth=2;
        g.beginPath(); g.arc(cx+5*U, y-9*U, 6*U, -1.1, 1.1); g.stroke();
        g.strokeStyle='#e8e8e8'; g.lineWidth=1;
        g.beginPath(); g.moveTo(cx+5*U, y-15*U); g.lineTo(cx+5*U-draw2*3*U, y-9*U); g.lineTo(cx+5*U, y-3*U); g.stroke();
        R(cx-2*U,y-1*U,2*U,2*U,cfg.skin);
        if ((anim==='attack'||anim==='cast') && prog>0.7){ R(cx+7*U,y-9.5*U,5*U,1*U,'#caa06a'); R(cx+12*U,y-10*U,2*U,2*U,cfg.accent);} // arrow
      } else if (cfg.weapon==='staff'){
        R(cx+4*U, y-16*U, 1.5*U, 14*U, cfg.metalD);    // staff
        const orb = cfg.orb||'#5cd8ff';
        const rr = (2 + castT*2.5)*U;
        g.save(); g.shadowColor=orb; g.shadowBlur=10+castT*14;
        g.fillStyle=orb; g.beginPath(); g.arc(cx+4.7*U, y-16*U, rr, 0, 7); g.fill();
        g.fillStyle='#ffffff'; g.beginPath(); g.arc(cx+4.7*U, y-16*U, rr*0.4, 0, 7); g.fill(); g.restore();
      } else if (cfg.weapon==='orbs'){
        const cols=['#ff5a3c','#5be18a','#5cd8ff'];    // elemental orbs
        for(let i=0;i<3;i++){ const a=prog*Math.PI*2+i*2.1; const ox=cx+Math.cos(a)*5*U, oy=y-10*U+Math.sin(a)*4*U;
          g.save(); g.shadowColor=cols[i]; g.shadowBlur=8+castT*10; g.fillStyle=cols[i];
          g.beginPath(); g.arc(ox,oy,(1.6+castT*1.4)*U,0,7); g.fill(); g.restore(); }
      }

      // head
      R(cx-5*U, y-21*U, 10*U, 8*U, OUT);
      R(cx-4*U, y-20*U, 8*U, 7*U, cfg.skin);
      // gear
      if (cfg.gear==='helm'){ R(cx-5*U,y-22*U,10*U,4*U,cfg.metal); R(cx-5*U,y-19*U,10*U,1*U,cfg.metalD); }
      else if (cfg.gear==='hair'){ R(cx-5*U,y-22*U,10*U,3*U,cfg.hair); R(cx-6*U,y-21*U,2*U,4*U,cfg.hair); R(cx-5*U,y-22.5*U,10*U,1.2*U,cfg.trim); } // headband
      else if (cfg.gear==='hat'){ R(cx-7*U,y-22*U,14*U,2.5*U,cfg.cloak); for(let i=0;i<5;i++) R(cx-1.5*U-i*0.3*U, y-22*U-i*1.6*U, (5-i)*U, 2*U, cfg.cloakD); R(cx+1.5*U,y-30*U,1.6*U,1.6*U,cfg.accent);}
      else if (cfg.gear==='hood'){ R(cx-6*U,y-23*U,12*U,7*U,cfg.cloakD); R(cx-5*U,y-22*U,10*U,4*U,cfg.cloak); R(cx-4*U,y-16*U,8*U,3*U,cfg.skin); }
      else if (cfg.gear==='cowl'){ R(cx-6*U,y-24*U,12*U,10*U,cfg.cloakD); R(cx-5*U,y-23*U,10*U,4*U,cfg.cloak); }
      // face / eyes
      if (cfg.eyes){ g.save(); g.shadowColor=cfg.eyes; g.shadowBlur=8; R(cx-3*U,y-18*U,2*U,2*U,cfg.eyes); R(cx+1*U,y-18*U,2*U,2*U,cfg.eyes); g.restore(); }
      else { R(cx-2.5*U,y-18*U,1.4*U,1.6*U,'#2a2a3a'); R(cx+1*U,y-18*U,1.4*U,1.6*U,'#2a2a3a'); }

      // aura (cast) for magical types
      if (cfg.aura && (anim==='cast')){ g.save(); g.globalAlpha=0.25+0.2*Math.sin(prog*Math.PI*2); g.strokeStyle=cfg.aura; g.lineWidth=2;
        g.beginPath(); g.ellipse(cx, y-10*U, 9*U, 12*U, 0, 0, 7); g.stroke(); g.restore(); }
    }

    ANIMS.forEach((anim, r) => {
      for (let c = 0; c < 6; c++){
        const cx = c*CELL + CELL/2;
        const fy = r*CELL + CELL - 8;
        draw(cx, fy, anim, c/6);
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
