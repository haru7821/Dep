import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
const dir = path.dirname(fileURLToPath(import.meta.url));
const url = 'file://' + path.join(dir, 'index.html');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1000, height: 640 } });
await page.goto(url);

// build a synthetic 7col x 5row sheet: each cell labeled "r,c" on a colored bg
const dataUrl = await page.evaluate(() => {
  const cols=7, rows=5, cw=96, ch=96;
  const cv=document.createElement('canvas'); cv.width=cols*cw; cv.height=rows*ch;
  const x=cv.getContext('2d');
  const rowCol=['#5b8dff','#57e18a','#ffcf5e','#ff7ad0','#c76bff'];
  for(let r=0;r<rows;r++)for(let c=0;c<cols;c++){
    x.fillStyle=rowCol[r]; x.globalAlpha=0.9; x.beginPath();
    x.arc(c*cw+cw/2, r*ch+ch/2, 34, 0, Math.PI*2); x.fill(); x.globalAlpha=1;
    x.fillStyle='#0a0e24'; x.font='bold 26px system-ui'; x.textAlign='center'; x.textBaseline='middle';
    x.fillText(r+','+c, c*cw+cw/2, r*ch+ch/2);
  }
  return cv.toDataURL('image/png');
});
fs.mkdirSync(path.join(dir,'assets'),{recursive:true});
fs.writeFileSync(path.join(dir,'assets','warrior.png'), Buffer.from(dataUrl.split(',')[1],'base64'));

// now load the game with sheets ON and confirm garran draws frame from row 2/3 (attack/cast)
await page.goto(url + '?sheets=1');
await page.evaluate(() => localStorage.removeItem('aether_crystal_save_v1'));
await page.goto(url + '?sheets=1');
await page.waitForTimeout(400);
const drew = await page.evaluate(async () => {
  await new Promise(r=>setTimeout(r,300)); // let image load
  S.wave=30; S.heroLevels={garran:10,mira:0,faye:0,rai:0,aunel:0}; buildHeroPanel();
  const g = heroSlots().find(s=>s.def.id==='garran');
  heroAnim.garran = { name:'attack', t:1 };
  const ctx = document.getElementById('stage').getContext('2d');
  return Sheets.draw(ctx, 'garran', g.x, g.y, 60, 'attack', 0);  // true = drew from sheet
});
await page.evaluate(() => { heroAnim.garran={name:'attack',t:5}; enemies.length=0; });
await page.waitForTimeout(200);
await page.screenshot({ path: path.join(dir,'prove-sheets.png') });
await browser.close();

// clean up: remove the synthetic sheet so the repo ships with fallback art
fs.rmSync(path.join(dir,'assets','warrior.png'));
console.log('Sheets.draw drew from image sheet:', drew);
console.log(drew ? 'PROOF: PASS' : 'PROOF: FAIL');
process.exit(drew ? 0 : 1);
