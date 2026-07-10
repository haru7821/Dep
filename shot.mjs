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
  S.wave = 55; S.gold = 210000; S.shards = 11; S.shardsEarned = 11; S.shardUpg.crit = 8;
  S.heroLevels = { garran:22, mira:18, faye:15, rai:8, aunel:0 };
  buildHeroPanel(); updateHud();
  enemies.length = 0;
  const et = ENEMY_TYPES;
  const line = [['normal',false],['runner',false],['golem',false],['normal',true],['wraith',false]];
  line.forEach(([t,gold],i) => {
    enemies.push({ x: 440 + i*95, y: view.ground, hp: enemyHP(55)*et[t].hp*0.75,
      maxHp: enemyHP(55)*et[t].hp, type:t, speed:et[t].spd, frame:0, boss:false,
      slow: t==='golem'?2:0, goldMul: gold? et[t].gold*30 : et[t].gold, golden:gold, atkTimer:0 });
  });
  // make skills ready (glow) + fire a crit floater and effects
  const slots = heroSlots();
  ['garran','mira','faye','rai'].forEach(id => skillTimers[id] = HERO_DEFS.find(d=>d.id===id).skill.cd);
  castSkill(slots.find(s=>s.def.id==='rai').def, slots.find(s=>s.def.id==='rai'), 8);
  addFloater(560, view.ground-60, 'CRIT!', '#ffa03c');
});
await page.waitForTimeout(70);
await page.screenshot({ path: path.join(dir, 'screenshot.png') });
await browser.close();
console.log('shot saved');
