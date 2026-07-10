import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import path from 'path';
const dir = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 820, height: 1100 } });
await page.goto('file://' + path.join(dir, 'index.html'));   // file:// origin
await page.waitForTimeout(200);
const files = ['warrior','wizard','archer','sorcerer','shadow'];
await page.evaluate(async (files) => {
  const SW=384, SH=256;              // scaled sheet (1536x1024 / 4)
  const cv = document.createElement('canvas'); cv.width = 2*SW+30; cv.height = 3*SH+90;
  cv.id='ins'; cv.style.cssText='position:fixed;left:0;top:0;z-index:99999';
  document.body.appendChild(cv);
  const x = cv.getContext('2d'); x.imageSmoothingEnabled=false;
  x.fillStyle='#0d1024'; x.fillRect(0,0,cv.width,cv.height);
  for (let idx=0; idx<files.length; idx++){
    const f=files[idx];
    const img = await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src='assets/'+f+'.png.png';});
    const ox = (idx%2)*(SW+10)+6, oy = Math.floor(idx/2)*(SH+28)+22;
    x.fillStyle='#cdd6f0'; x.font='bold 13px system-ui'; x.fillText(f+'  ('+(img?img.width+'x'+img.height:'FAIL')+')', ox, oy-6);
    if(!img) continue;
    x.drawImage(img, ox, oy, SW, SH);
    // 6 cols x 4 rows grid
    x.strokeStyle='rgba(0,255,180,.5)'; x.lineWidth=1;
    for(let c=0;c<=6;c++){ x.beginPath(); x.moveTo(ox+c*SW/6, oy); x.lineTo(ox+c*SW/6, oy+SH); x.stroke(); }
    for(let r=0;r<=4;r++){ x.beginPath(); x.moveTo(ox, oy+r*SH/4); x.lineTo(ox+SW, oy+r*SH/4); x.stroke(); }
  }
}, files);
await page.waitForTimeout(200);
await page.locator('#ins').screenshot({ path: path.join(dir, 'inspect.png') });
await browser.close();
console.log('inspect saved');
