import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import path from 'path';
const dir = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1000, height: 900 } });
await page.goto('file://' + path.join(dir, 'index.html'));
await page.waitForTimeout(200);
const files = ['warrior','wizard','archer','sorcerer','shadow'];
await page.evaluate(async (files) => {
  const cv=document.createElement('canvas'); cv.width=980; cv.height=880; cv.id='v';
  cv.style.cssText='position:fixed;left:0;top:0;z-index:99999';
  document.body.appendChild(cv);
  const x=cv.getContext('2d'); x.imageSmoothingEnabled=false;
  x.fillStyle='#141a34'; x.fillRect(0,0,cv.width,cv.height);
  let y=6;
  for(const f of files){
    const img=await new Promise(r=>{const i=new Image();i.onload=()=>r(i);i.onerror=()=>r(null);i.src='assets/'+f+'.png?'+Date.now();});
    if(!img){ y+=20; continue; }
    const scale=Math.min(1, 940/img.width, 160/(img.height));
    x.fillStyle='#aab6e0'; x.font='bold 12px system-ui'; x.fillText(f+'  '+img.width+'x'+img.height, 6, y+12);
    x.drawImage(img, 6, y+16, img.width*scale, img.height*scale);
    y += 16 + img.height*scale + 8;
  }
}, files);
await page.waitForTimeout(200);
await page.locator('#v').screenshot({ path: path.join(dir, 'clean-view.png') });
await browser.close();
console.log('clean-view saved');
