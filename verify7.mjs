import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import path from 'path';
const dir = path.dirname(fileURLToPath(import.meta.url));
const url = 'file://' + path.join(dir, 'index.html');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const R = []; const check = (n,c) => R.push((c?'PASS':'FAIL')+' — '+n);

// ---- default (sheets ON, assets present): sheets render, error-free ----
{
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  const errors = [];
  page.on('console', m => { if (m.type()==='error') errors.push(m.text()); });
  page.on('pageerror', e => errors.push('PAGEERR: '+e.message));
  await page.goto(url);
  await page.evaluate(() => localStorage.removeItem('aether_crystal_save_v1'));
  await page.reload(); await page.waitForTimeout(600);   // let sheet images load

  check('Sheets API loaded, enabled by default', await page.evaluate(() => !!window.Sheets && Sheets.isEnabled()===true));
  check('All hero + boss sheets configured', await page.evaluate(() =>
    ['garran','mira','faye','rai','boss'].every(id => !!Sheets.CONFIG[id])));
  check('🎨 toggle button present', await page.evaluate(() => !!document.getElementById('btnSheets')));
  check('Healer sheet removed → Aunel uses canvas fallback', await page.evaluate(() =>
    !Sheets.CONFIG.aunel && Sheets.draw(document.getElementById('stage').getContext('2d'),'aunel',100,300,60,'idle',0)===false));
  check('Flip flags: garran/mira/rai/boss flipped, faye not', await page.evaluate(() =>
    ['garran','mira','rai','boss'].every(id=>Sheets.CONFIG[id].flip===true) && !Sheets.CONFIG.faye.flip));
  check('Sheet images load (ready after load)', await page.evaluate(async () => {
    ['garran','mira','faye','rai','boss'].forEach(id => Sheets.load(id));
    await new Promise(r => setTimeout(r, 600));
    return ['garran','mira','faye','rai','boss'].every(id => Sheets.ready(id));
  }));
  check('Sheets.draw renders from image (returns true)', await page.evaluate(() => {
    const ctx = document.getElementById('stage').getContext('2d');
    return Sheets.draw(ctx,'garran',100,300,60,'attack',0)===true;
  }));
  check('Hero anim state → attack/cast on action', await page.evaluate(() => {
    S.wave=30; S.heroLevels={garran:10,mira:10,faye:10,rai:10,aunel:0}; buildHeroPanel();
    enemies.length=0; for(let i=0;i<3;i++) enemies.push({x:400+i*30,y:view.ground,hp:1e12,maxHp:1e12,type:'normal',speed:20,frame:0,boss:false,slow:0,goldMul:1,atkTimer:0});
    const slots=heroSlots();
    const g=slots.find(s=>s.def.id==='garran'); basicAttack(g.def,g,10); const a=heroAnim.garran&&heroAnim.garran.name;
    const m=slots.find(s=>s.def.id==='mira'); castSkill(m.def,m,10); const c=heroAnim.mira&&heroAnim.mira.name;
    return a==='attack' && c==='cast';
  }));

  await page.evaluate(() => { localStorage.removeItem('aether_crystal_save_v1'); });
  await page.reload(); await page.waitForTimeout(400);
  await page.evaluate(() => { S.gold=1e7; S.wave=26; S.heroLevels={garran:12,mira:10,faye:10,rai:0,aunel:0}; buildHeroPanel(); S.speed=3; });
  await page.waitForTimeout(3500);
  check('Default run advances, no console errors', await page.evaluate(() => S.wave>=26) && errors.length===0);
  if (errors.length) console.log('  default errors:', errors.slice(0,5));
  await page.close();
}

// ---- disabled via ?sheets=0: clean canvas fallback ----
{
  const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERR: '+e.message));
  await page.goto(url + '?sheets=0');
  await page.evaluate(() => localStorage.removeItem('aether_crystal_save_v1'));
  await page.goto(url + '?sheets=0');
  await page.waitForTimeout(300);
  check('?sheets=0 disables sheets (canvas fallback)', await page.evaluate(() =>
    Sheets.isEnabled()===false &&
    Sheets.draw(document.getElementById('stage').getContext('2d'),'garran',100,300,60,'idle',0)===false));
  await page.evaluate(() => { S.gold=1e7; S.wave=24; S.heroLevels={garran:12,mira:10,faye:8,rai:0,aunel:0}; buildHeroPanel(); S.speed=3; });
  await page.waitForTimeout(3000);
  check('Fallback run advances, no crash', await page.evaluate(() => S.wave>=24) && errors.length===0);
  await page.close();
}

console.log(R.join('\n'));
await browser.close();
const failed = R.some(r=>r.startsWith('FAIL'));
console.log(failed ? '\nRESULT: FAIL' : '\nRESULT: ALL PASS');
process.exit(failed?1:0);
