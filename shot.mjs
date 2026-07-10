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
  S.wave = 55; S.gold = 182000; S.shards = 9; S.shardsEarned = 9;
  S.heroLevels = { garran:22, mira:18, faye:15, rai:8, aunel:0 };
  buildHeroPanel(); updateHud();
  // stage a varied enemy line-up
  enemies.length = 0;
  const types = ['normal','fast','runner','tank','golem','wraith'];
  types.forEach((t,i) => {
    const et = ENEMY_TYPES[t];
    enemies.push({ x: 430 + i*80, y: view.ground, hp: enemyHP(55)*et.hp*0.7,
      maxHp: enemyHP(55)*et.hp, type:t, speed:et.spd, frame:0, boss:false,
      slow: (t==='tank'||t==='normal')?2:0, goldMul:et.gold, atkTimer:0 });
  });
  // fire a couple of skills so effects are on screen
  const slots = heroSlots();
  castSkill(slots.find(s=>s.def.id==='rai').def, slots.find(s=>s.def.id==='rai'), 8);
  castSkill(slots.find(s=>s.def.id==='faye').def, slots.find(s=>s.def.id==='faye'), 15);
  castSkill(slots.find(s=>s.def.id==='mira').def, slots.find(s=>s.def.id==='mira'), 18);
});
await page.waitForTimeout(80);
await page.screenshot({ path: path.join(dir, 'screenshot.png') });
await browser.close();
console.log('shot saved');
