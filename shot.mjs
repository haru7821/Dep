import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import path from 'path';
const dir = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1000, height: 640 } });
await page.goto('file://' + path.join(dir, 'index.html'));
await page.evaluate(() => localStorage.removeItem('aether_crystal_save_v1'));
await page.reload();
await page.waitForTimeout(700);   // let sheet images load
await page.evaluate(() => {
  S.wave = 60; S.gold = 300000; S.shards = 8; S.shardsEarned = 14; S.talentPoints = 5;
  S.heroLevels = { garran:22, mira:18, faye:16, rai:10, aunel:6 };
  buildHeroPanel(); updateHud();
  // set each hero into a lively animation state
  const anims = { garran:'attack', mira:'cast', faye:'attack', rai:'cast', aunel:'cast' };
  for (const id in anims) heroAnim[id] = { name:anims[id], t:5 };
  enemies.length = 0;
  const et = ENEMY_TYPES;
  [['runner',false],['golem',false],['wraith',false],['normal',true]].forEach(([t,g],i) => {
    enemies.push({ x: 470 + i*110, y: view.ground, hp: enemyHP(60)*et[t].hp*0.7,
      maxHp: enemyHP(60)*et[t].hp, type:t, speed:et[t].spd, frame:0, boss:false,
      slow:0, goldMul: et[t].gold, golden:g, atkTimer:0 });
  });
});
await page.waitForTimeout(120);
await page.screenshot({ path: path.join(dir, 'screenshot.png') });

// also a boss-wave shot (shadow sheet)
await page.evaluate(() => {
  enemies.length = 0;
  const hp = enemyHP(60)*8;
  enemies.push({ x: 640, y: view.ground, hp:hp*0.7, maxHp:hp, type:'boss', speed:18, frame:0, boss:true, slow:0, goldMul:10, atkTimer:0 });
});
await page.waitForTimeout(200);
await page.screenshot({ path: path.join(dir, 'screenshot-boss.png') });
await browser.close();
console.log('shots saved');
