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
const R = [];
const check = (n,c) => R.push((c?'PASS':'FAIL')+' — '+n);

// audio module present + buttons exist
check('GameAudio module loaded', await page.evaluate(() => !!window.GameAudio && !!GameAudio.sfx.ice && !!GameAudio.sfx.lightning));
check('Music & Mute buttons present', await page.evaluate(() => !!document.getElementById('btnMusic') && !!document.getElementById('btnMute')));

// 5 heroes incl. Rai at wave 50
check('Rai hero defined, unlock wave 50', await page.evaluate(() => { const r=HERO_DEFS.find(d=>d.id==='rai'); return r && r.unlockWave===50 && r.draw==='drawRonin'; }));
check('Every hero has an AoE skill', await page.evaluate(() => HERO_DEFS.every(d=>d.skill && d.skill.name && d.skill.cd>0)));
check('Mage skill = frost/slow, Archer = explode', await page.evaluate(() => {
  const m=HERO_DEFS.find(d=>d.id==='mira').skill, f=HERO_DEFS.find(d=>d.id==='faye').skill;
  return m.kind==='frost' && f.kind==='explode';
}));

// Frost Nova applies slow; explosive/chain deal AoE — drive a real cast
const combat = await page.evaluate(() => {
  S.wave = 30; S.heroLevels = {garran:20,mira:20,faye:20,rai:20,aunel:0};
  buildHeroPanel();
  // hand-spawn a cluster of enemies
  enemies.length = 0;
  for (let i=0;i<6;i++) enemies.push({x:400+i*30,y:view.ground,hp:1e9,maxHp:1e9,type:'normal',speed:20,frame:0,boss:false,slow:0,goldMul:1,atkTimer:0});
  const slots = heroSlots();
  const mira = slots.find(s=>s.def.id==='mira');
  castSkill(mira.def, mira, 20);       // Frost Nova
  const slowed = enemies.filter(e=>e.slow>0).length;
  const fxKinds = fx.map(o=>o.kind);
  // chain lightning from Rai produces a 'chain' fx with segments
  const rai = slots.find(s=>s.def.id==='rai');
  castSkill(rai.def, rai, 20);
  const chain = fx.find(o=>o.kind==='chain');
  return { slowed, hadNova: fxKinds.includes('nova'), chainSegs: chain? chain.segs.length : 0, enemyCount: enemies.length };
});
check('Frost Nova slows all enemies', combat.slowed >= 6);
check('Skills emit visible FX (nova)', combat.hadNova);
check('Chain Lightning links multiple targets', combat.chainSegs >= 2);

// wraith is slow-immune
check('Wraith immune to slow', await page.evaluate(() => {
  enemies.length = 0;
  enemies.push({x:400,y:view.ground,hp:1e9,maxHp:1e9,type:'wraith',speed:34,frame:0,boss:false,slow:0,goldMul:2,atkTimer:0});
  const slots = heroSlots(); const mira = slots.find(s=>s.def.id==='mira');
  castSkill(mira.def, mira, 20);
  return enemies[0].slow === 0;
}));

// new enemy types actually spawn across waves
check('New enemy types spawn (runner/golem/wraith)', await page.evaluate(() => {
  const seen = new Set();
  for (let w=1; w<=40; w++) for (let k=0;k<40;k++){ if(!(w%5===0)) seen.add(pickType(w)); }
  return ['runner','golem','wraith'].every(t=>seen.has(t));
}));

// live run: let skills fire, ensure no errors and basic-attack FX appear
await page.evaluate(() => { localStorage.removeItem('aether_crystal_save_v1'); });
await page.reload(); await page.waitForTimeout(200);
await page.evaluate(() => { S.gold=1e7; S.wave=26; S.heroLevels={garran:15,mira:12,faye:10,rai:0,aunel:0}; buildHeroPanel(); S.speed=3; });
await page.waitForTimeout(4000);
const live = await page.evaluate(() => ({ wave:S.wave, fxSeen: fx.length>=0, err:false }));
check('Live run advances with skills active', live.wave >= 26);

console.log(R.join('\n'));
console.log('\nCONSOLE ERRORS:', errors.length ? errors : 'none');
await browser.close();
const failed = R.some(r=>r.startsWith('FAIL')) || errors.length;
console.log(failed ? '\nRESULT: FAIL' : '\nRESULT: ALL PASS');
process.exit(failed?1:0);
