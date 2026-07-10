import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import path from 'path';
const dir = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1000, height: 640 } });
await page.goto('file://' + path.join(dir, 'index.html'));
await page.evaluate(() => localStorage.removeItem('aether_crystal_save_v1'));
await page.reload();
await page.waitForTimeout(300);
await page.evaluate(() => {
  S.wave = 58; S.gold = 260000; S.shards = 8; S.shardsEarned = 14; S.talentPoints = 4;
  S.heroLevels = { garran:22, mira:18, faye:16, rai:10, aunel:0 };
  buildHeroPanel(); updateHud();
  S.speed = 0;                    // freeze the sim so the burst frame holds
  enemies.length = 0; particles.length = 0; fx.length = 0;
  const et = ENEMY_TYPES;
  [['normal',false],['runner',false],['golem',false],['tank',false],['wraith',false]].forEach(([t,g],i) => {
    enemies.push({ x: 430 + i*100, y: view.ground, hp: enemyHP(58)*et[t].hp*0.6,
      maxHp: enemyHP(58)*et[t].hp, type:t, speed:et[t].spd, frame:0, boss:false,
      slow: t==='tank'?2:0, goldMul: et[t].gold, golden:g, atkTimer:0 });
  });
  const g = view.ground;
  // FIRE burst
  fx.push({kind:'nova',x:500,y:g-16,r0:6,r:95,dur:0.45,color:'#ff9d3c',t:0.15});
  spawnParticles(500, g-16, 'fire', 2.0); spawnParticles(500, g-16, 'smoke', 1.0);
  // ICE nova
  fx.push({kind:'nova',x:660,y:g-16,r0:8,r:150,dur:0.6,color:'#8fe0ff',t:0.18});
  spawnParticles(660, g-16, 'ice', 1.8); spawnParticles(660, g-16, 'frost', 1.6);
  // LIGHTNING chain + sparks
  fx.push({kind:'chain',segs:[[300,g-24,760,g-14],[760,g-14,830,g-14]],dur:0.3,color:'#bff0ff',t:0.05});
  spawnParticles(760, g-14, 'spark', 1.2); spawnParticles(830, g-14, 'spark', 1.0);
  // POISON cloud (wraith)
  spawnParticles(830, g-18, 'poison', 1.8);
  // HOLY sparkles at crystal
  spawnParticles(view.crystalX, g-24, 'holy', 1.2);
  // spread them a little
  for (let i=0;i<7;i++) updateParticles(0.03);
});
await page.waitForTimeout(30);
await page.screenshot({ path: path.join(dir, 'screenshot.png') });
await browser.close();
console.log('shot saved');
