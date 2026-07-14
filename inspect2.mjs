import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import path from 'path';
const dir = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 960, height: 1000 } });
await page.goto('file://' + path.join(dir, 'index.html'));
await page.waitForTimeout(200);
const strips = ['warrior.png.png','wizard.png.png','archer.png.png','sorcerer.png.png','shadow.png.png'];
const mons  = ['dragon.png','ghost.png','oak.png','slime.png'];
await page.evaluate(async ({strips, mons}) => {
  const cv=document.createElement('canvas'); cv.width=940; cv.height=980; cv.id='v';
  cv.style.cssText='position:fixed;left:0;top:0;z-index:99999';
  document.body.appendChild(cv);
  const x=cv.getContext('2d'); x.imageSmoothingEnabled=false;
  x.fillStyle='#141a34'; x.fillRect(0,0,cv.width,cv.height);
  const load=f=>new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src='assets/'+f;});
  let y=6;
  for(const f of strips){
    const img=await load(f); if(!img){y+=20;continue;}
    const sc=920/img.width; const h=img.height*sc;
    x.drawImage(img,10,y+14,img.width*sc,h);
    // guess frames assuming ~square cells: draw grid every h px
    const cell=img.height; const n=Math.round(img.width/cell);
    x.strokeStyle='rgba(0,255,180,.5)'; x.lineWidth=1;
    for(let c=0;c<=n;c++){ const gx=10+c*cell*sc; x.beginPath();x.moveTo(gx,y+14);x.lineTo(gx,y+14+h);x.stroke(); }
    x.fillStyle='#cdd6f0'; x.font='bold 12px system-ui'; x.fillText(f+'  '+img.width+'x'+img.height+'  ~'+n+' frames(sq)', 10, y+11);
    y += 14+h+10;
  }
  let mx=10;
  for(const f of mons){
    const img=await load(f); if(!img){continue;}
    const sc=Math.min(1,150/img.height);
    x.fillStyle='#cdd6f0'; x.font='bold 12px system-ui'; x.fillText(f+' '+img.width+'x'+img.height, mx, y+11);
    x.drawImage(img, mx, y+14, img.width*sc, img.height*sc);
    mx += img.width*sc + 14;
  }
}, {strips, mons});
await page.waitForTimeout(200);
await page.locator('#v').screenshot({ path: path.join(dir, 'inspect2.png') });
await browser.close();
console.log('inspect2 saved');
