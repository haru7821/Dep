import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import path from 'path';
const dir = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 820, height: 800 } });
await page.goto('file://' + path.join(dir, 'index.html'));
await page.waitForTimeout(300);
const files = ['warrior','wizard','archer','sorcerer','healer','shadow'];
await page.evaluate(async (files) => {
  const cv = document.createElement('canvas'); cv.width = 800; cv.height = 792;
  cv.id = 'previewCv';
  cv.style.cssText = 'position:fixed;left:0;top:0;z-index:99999';
  document.body.appendChild(cv);
  const x = cv.getContext('2d'); x.imageSmoothingEnabled = false;
  x.fillStyle = '#141a34'; x.fillRect(0,0,cv.width,cv.height);
  let y = 4;
  for (const f of files){
    const img = await new Promise(res => { const i=new Image(); i.onload=()=>res(i); i.onerror=()=>res(null); i.src='assets/'+f+'.png'; });
    if (!img) continue;
    const fw = img.width/6, fh = img.height/4;
    const picks = [[0,0],[1,3],[2,0],[2,3],[3,1],[3,4]];
    picks.forEach(([r,col], i) => x.drawImage(img, col*fw, r*fh, fw, fh, i*fw, y, fw, fh));
    x.fillStyle='#aab6e0'; x.font='bold 12px system-ui'; x.fillText(f, 6, y+14);
    y += fh;
  }
}, files);
await page.waitForTimeout(200);
await page.locator('#previewCv').screenshot({ path: path.join(dir, 'sheet-preview.png') });
await browser.close();
console.log('preview saved');
