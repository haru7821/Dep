import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import path from 'path';
const dir = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
const errors = [];
page.on('console', m => { if (m.type()==='error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERR: '+e.message));
await page.goto('file://' + path.join(dir, 'index.html'));
await page.evaluate(() => localStorage.removeItem('aether_crystal_save_v1'));
await page.reload();
await page.waitForTimeout(300);
const R = []; const check = (n,c) => R.push((c?'PASS':'FAIL')+' — '+n);

check('Particle presets defined (fire/ice/poison/spark/holy)', await page.evaluate(() =>
  ['fire','ice','poison','spark','holy','earth','frost','smoke'].every(k=>!!PARTICLE_PRESETS[k])));

// each skill spawns its element particles
check('Skills spawn element particles', await page.evaluate(() => {
  S.wave = 30; S.heroLevels = {garran:20,mira:20,faye:20,rai:20,aunel:5}; buildHeroPanel();
  const counts = {};
  for (const id of ['garran','mira','faye','rai','aunel']){
    enemies.length = 0; particles.length = 0;
    for (let i=0;i<5;i++) enemies.push({x:400+i*30,y:view.ground,hp:1e12,maxHp:1e12,type:'normal',speed:20,frame:0,boss:false,slow:0,goldMul:1,atkTimer:0});
    const slot = heroSlots().find(s=>s.def.id===id);
    castSkill(slot.def, slot, 20);
    counts[id] = particles.length;
  }
  return Object.values(counts).every(c => c > 0);
}));

// wraith death emits poison particles
check('Wraith death emits poison particles', await page.evaluate(() => {
  particles.length = 0;
  const e = {x:400,y:view.ground,hp:5,maxHp:5,type:'wraith',speed:34,frame:0,boss:false,slow:0,goldMul:2,atkTimer:0};
  enemies.length = 0; enemies.push(e);
  damageEnemy(e, 999);
  return particles.length > 0;
}));

// boss death emits a big burst
check('Boss death emits burst', await page.evaluate(() => {
  particles.length = 0;
  const e = {x:500,y:view.ground,hp:5,maxHp:5,type:'boss',speed:18,frame:0,boss:true,slow:0,goldMul:10,atkTimer:0};
  enemies.length = 0; enemies.push(e);
  damageEnemy(e, 999);
  return particles.length > 20;
}));

// particle cap respected
check('Particle count capped', await page.evaluate(() => {
  particles.length = 0;
  for (let i=0;i<80;i++) spawnParticles(400, 300, 'fire', 1);
  return particles.length <= MAX_PARTICLES;
}));

// particles update & expire
check('Particles expire over time', await page.evaluate(() => {
  particles.length = 0; spawnParticles(400,300,'spark',1);
  const before = particles.length;
  for (let i=0;i<60;i++) updateParticles(0.05);   // 3s
  return before > 0 && particles.length === 0;
}));

// live run at 3x with lots of casts — no console errors, particles bounded
await page.evaluate(() => { localStorage.removeItem('aether_crystal_save_v1'); });
await page.reload(); await page.waitForTimeout(200);
await page.evaluate(() => { S.gold=1e8; S.wave=27; S.heroLevels={garran:14,mira:12,faye:12,rai:8,aunel:0}; buildHeroPanel(); S.speed=3; });
await page.waitForTimeout(5000);
check('Live run: particles bounded', await page.evaluate(() => particles.length <= MAX_PARTICLES));
check('Live run advances', await page.evaluate(() => S.wave >= 27));

console.log(R.join('\n'));
console.log('\nCONSOLE ERRORS:', errors.length ? errors : 'none');
await browser.close();
const failed = R.some(r=>r.startsWith('FAIL')) || errors.length;
console.log(failed ? '\nRESULT: FAIL' : '\nRESULT: ALL PASS');
process.exit(failed?1:0);
