import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import path from 'path';
const dir = path.dirname(fileURLToPath(import.meta.url));
const url = 'file://' + path.join(dir, 'index.html');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const R = []; const check = (n,c) => R.push((c?'PASS':'FAIL')+' — '+n);

// ---- default (sheets OFF): pure canvas fallback, must be error-free ----
{
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  const errors = [];
  page.on('console', m => { if (m.type()==='error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERR: '+e.message));
  await page.goto(url);
  await page.evaluate(() => localStorage.removeItem('aether_crystal_save_v1'));
  await page.reload(); await page.waitForTimeout(300);

  check('Sheets API loaded, disabled by default', await page.evaluate(() => !!window.Sheets && Sheets.isEnabled()===false));
  check('All hero + boss sheets configured', await page.evaluate(() =>
    ['garran','mira','faye','rai','boss'].every(id => !!Sheets.CONFIG[id])));
  check('🎨 toggle button present', await page.evaluate(() => !!document.getElementById('btnSheets')));
  // anim state flips to attack/cast
  check('Hero anim state → attack/cast on action', await page.evaluate(() => {
    S.wave=30; S.heroLevels={garran:10,mira:10,faye:10,rai:10,aunel:0}; buildHeroPanel();
    enemies.length=0; for(let i=0;i<3;i++) enemies.push({x:400+i*30,y:view.ground,hp:1e12,maxHp:1e12,type:'normal',speed:20,frame:0,boss:false,slow:0,goldMul:1,atkTimer:0});
    const slots=heroSlots(); const g=slots.find(s=>s.def.id==='garran');
    basicAttack(g.def,g,10); const a = heroAnim.garran && heroAnim.garran.name;
    const m=slots.find(s=>s.def.id==='mira'); castSkill(m.def,m,10); const c = heroAnim.mira && heroAnim.mira.name;
    return a==='attack' && c==='cast';
  }));
  check('Sheets.draw returns false while disabled (canvas fallback)', await page.evaluate(() =>
    Sheets.draw(document.getElementById('stage').getContext('2d'),'garran',100,300,60,'idle',0)===false));

  await page.evaluate(() => { localStorage.removeItem('aether_crystal_save_v1'); });
  await page.reload(); await page.waitForTimeout(200);
  await page.evaluate(() => { S.gold=1e7; S.wave=26; S.heroLevels={garran:12,mira:10,faye:10,rai:0,aunel:0}; buildHeroPanel(); S.speed=3; });
  await page.waitForTimeout(3500);
  check('Default run advances, no console errors', await page.evaluate(() => S.wave>=26) && errors.length===0);
  if (errors.length) console.log('  default errors:', errors);
  await page.close();
}

// ---- sheets ON but assets missing: must NOT crash, must fall back ----
{
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  const hardErrors = [];
  page.on('pageerror', e => hardErrors.push('PAGEERR: '+e.message));   // ignore image 404 console noise
  await page.goto(url + '?sheets=1');
  await page.evaluate(() => localStorage.removeItem('aether_crystal_save_v1'));
  await page.reload({ waitUntil: 'load' });
  await page.goto(url + '?sheets=1');
  await page.waitForTimeout(300);
  check('Sheets enabled via ?sheets=1', await page.evaluate(() => Sheets.isEnabled()===true));
  await page.evaluate(() => { S.gold=1e7; S.wave=24; S.heroLevels={garran:12,mira:10,faye:8,rai:0,aunel:0}; buildHeroPanel(); S.speed=3; });
  await page.waitForTimeout(3500);
  check('Enabled+missing-assets: no crash, falls back, advances',
    await page.evaluate(() => S.wave>=24) && hardErrors.length===0);
  if (hardErrors.length) console.log('  hard errors:', hardErrors);
  await page.close();
}

console.log(R.join('\n'));
await browser.close();
const failed = R.some(r=>r.startsWith('FAIL'));
console.log(failed ? '\nRESULT: FAIL' : '\nRESULT: ALL PASS');
process.exit(failed?1:0);
