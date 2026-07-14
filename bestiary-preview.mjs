import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import path from 'path';
const dir = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
await page.goto('file://' + path.join(dir, 'index.html'));
await page.waitForTimeout(150);
const mons=['dragon','skeleton','elderghost','zombie','slime','specter'];
await page.evaluate(async (mons)=>{
  const cv=document.createElement('canvas'); cv.width=980;cv.height=880;cv.id='v';
  cv.style.cssText='position:fixed;left:0;top:0;z-index:99999';
  document.body.appendChild(cv);
  const x=cv.getContext('2d'); x.imageSmoothingEnabled=false;
  x.fillStyle='#eef2ff'; x.fillRect(0,0,cv.width,cv.height);
  let y=6;
  for(const m of mons){
    const img=await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src='assets/'+m+'.png?'+Date.now();});
    if(!img){y+=20;continue;}
    const sc=Math.min(120/(img.height/2), 940/img.width);
    x.fillStyle='#334'; x.font='bold 13px system-ui'; x.fillText(m+'  '+img.width+'x'+img.height+' (idle top / attack bottom)', 6, y+12);
    x.drawImage(img, 6, y+16, img.width*sc, img.height*sc);
    y += 16 + img.height*sc + 10;
  }
}, mons);
await page.waitForTimeout(150);
await page.locator('#v').screenshot({ path: path.join(dir,'bestiary-preview.png') });
await browser.close(); console.log('saved');
