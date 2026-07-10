import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import path from 'path';
const dir = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1000, height: 720 } });
await page.goto('file://' + path.join(dir, 'index.html'));
await page.evaluate(() => localStorage.removeItem('aether_crystal_save_v1'));
await page.reload();
await page.waitForTimeout(300);
await page.evaluate(() => {
  S.wave = 62; S.gold = 340000; S.shards = 6; S.shardsEarned = 14; S.talentPoints = 9;
  S.shardUpg.crit = 8; S.bestWave = 62; S.totalKills = 8400; S.totalGoldEarned = 5e8; S.goldenKills = 3; S.prestiges = 4;
  S.talents = { might:4, precision:2, haste:3, bulwark:2, greed:3, focus:2 };
  S.heroLevels = { garran:24, mira:20, faye:17, rai:10, aunel:0 };
  checkAchievements();
  openTalents();
});
await page.waitForTimeout(120);
await page.screenshot({ path: path.join(dir, 'screenshot-talents.png') });
await page.evaluate(() => { closeModal(); openAchievements(); });
await page.waitForTimeout(120);
await page.screenshot({ path: path.join(dir, 'screenshot-achievements.png') });
// main battle shot for the README hero image
await page.evaluate(() => {
  closeModal(); buildHeroPanel(); updateHud();
  enemies.length = 0;
  const et = ENEMY_TYPES;
  [['normal',false],['runner',false],['golem',false],['normal',true],['wraith',false]].forEach(([t,g],i) => {
    enemies.push({ x: 440 + i*95, y: view.ground, hp: enemyHP(62)*et[t].hp*0.75,
      maxHp: enemyHP(62)*et[t].hp, type:t, speed:et[t].spd, frame:0, boss:false,
      slow: t==='golem'?2:0, goldMul: g? et[t].gold*30 : et[t].gold, golden:g, atkTimer:0 });
  });
  const slots = heroSlots();
  ['garran','mira','faye','rai'].forEach(id => skillTimers[id] = HERO_DEFS.find(d=>d.id===id).skill.cd);
  castSkill(slots.find(s=>s.def.id==='rai').def, slots.find(s=>s.def.id==='rai'), 10);
  addFloater(560, view.ground-60, 'CRIT!', '#ffa03c');
});
await page.waitForTimeout(70);
await page.screenshot({ path: path.join(dir, 'screenshot.png') });
await browser.close();
console.log('shots saved');
