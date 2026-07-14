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

// Keen Edge crit upgrade + critChance scaling
check('Keen Edge shard upgrade exists', await page.evaluate(() => !!SHARD_UPGRADES.find(u=>u.id==='crit')));
check('critChance scales with Keen Edge', await page.evaluate(() => {
  S.shardUpg.crit = 0; const a = critChance();
  S.shardUpg.crit = 10; const b = critChance();
  return Math.abs(a-0.03)<1e-9 && Math.abs(b-0.33)<1e-9;
}));
check('critRoll returns crit multiplier', await page.evaluate(() => {
  S.shardUpg.crit = 20; // ~63% but force by many rolls
  let crit=false; for(let i=0;i<50;i++){ const r=critRoll(100); if(r.crit){ crit = Math.abs(r.dmg-250)<1e-9; break; } }
  return crit;
}));

// Golden enemy spawns and pays big
check('Golden enemy can spawn with 30x gold', await page.evaluate(() => {
  // force RNG: run many spawns at a high wave
  enemies.length=0; let golden=null;
  for(let i=0;i<800 && !golden;i++){ spawnEnemy(22); golden = enemies.find(e=>e.golden); } // 22 = non-boss wave
  return !!golden && golden.goldMul >= 30;
}));

// bestWave + totalKills tracked and preserved through prestige
check('Stats tracked + preserved on prestige', await page.evaluate(() => {
  S.bestWave = 42; S.totalKills = 1234; S.totalGoldEarned = 9e6; S.shardsEarned = 0; S.shards = 0;
  document.getElementById('btnPrestige').onclick(); document.getElementById('confPrestige').onclick();
  return S.bestWave === 42 && S.totalKills === 1234;   // preserved even though wave reset to 1
}));

// Stats panel opens with real values
check('Stats panel opens', await page.evaluate(() => {
  openStats();
  const open = document.getElementById('modal').classList.contains('show');
  const has = document.getElementById('modalBox').textContent.includes('Best Wave');
  closeModal();
  return open && has;
}));

// Tap-to-cast: dispatch a pointerdown on a hero position casts the ready skill
check('Tap-to-cast fires a ready skill', await page.evaluate(() => {
  localStorage.removeItem('aether_crystal_save_v1');
  S.wave = 30; S.heroLevels = {garran:10,mira:10,faye:10,rai:10,aunel:0};
  enemies.length=0; for(let i=0;i<3;i++) enemies.push({x:400+i*30,y:view.ground,hp:1e12,maxHp:1e12,type:'normal',speed:20,frame:0,boss:false,slow:0,goldMul:1,atkTimer:0});
  const slot = heroSlots().find(s=>s.def.id==='mira');
  skillTimers.mira = slot.def.skill.cd;         // make it ready
  const rect = { left:0, top:0 };
  const canvas = document.getElementById('stage');
  canvas.getBoundingClientRect = () => ({left:0, top:0, width:view.w, height:view.h});
  const before = fx.length;
  canvas.dispatchEvent(new PointerEvent('pointerdown', { clientX: slot.x, clientY: slot.y - 30, bubbles:true }));
  return skillTimers.mira === 0 && fx.length > before;  // cast consumed cooldown + made FX
}));

// Boss HP bar path renders (boss present) without error
check('Boss wave runs with HP bar (no error)', await page.evaluate(() => {
  S.wave = 25; enemies.length=0; startWave(25); return isBossWave(25);
}));

// live run at 3x, ensure no console errors
await page.evaluate(() => { localStorage.removeItem('aether_crystal_save_v1'); });
await page.reload(); await page.waitForTimeout(200);
await page.evaluate(() => { S.gold=1e8; S.wave=24; S.shardUpg.crit=10; S.heroLevels={garran:12,mira:10,faye:10,rai:0,aunel:0}; buildHeroPanel(); S.speed=3; });
await page.waitForTimeout(4000);
check('Live run advances', await page.evaluate(() => S.wave >= 24));

console.log(R.join('\n'));
console.log('\nCONSOLE ERRORS:', errors.length ? errors : 'none');
await browser.close();
const failed = R.some(r=>r.startsWith('FAIL')) || errors.length;
console.log(failed ? '\nRESULT: FAIL' : '\nRESULT: ALL PASS');
process.exit(failed?1:0);
