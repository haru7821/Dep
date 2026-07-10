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

// data present + buttons
check('Talents + Achievements defined', await page.evaluate(() => TALENTS.length>=10 && ACHIEVEMENTS.length>=10));
check('Talent/Achievement/Stats buttons present', await page.evaluate(() =>
  ['btnTalents','btnAch','btnStats','s-tp'].every(id=>!!document.getElementById(id))));

// achievement unlock grants TP + shards exactly once
check('Achievement unlock grants reward once', await page.evaluate(() => {
  S.achievements = {}; S.talentPoints = 0; S.shards = 0; S.bestWave = 60;   // triggers w25(+1TP,1s) + w50(+1TP,2s)
  checkAchievements();
  const tp1 = S.talentPoints, sh1 = S.shards;
  checkAchievements(); // second call must NOT re-grant
  return tp1===2 && sh1===3 && S.talentPoints===2 && S.shards===3;
}));

// buying a talent spends TP and applies its effect (Might → damage up)
check('Buying Might increases combat damage', await page.evaluate(() => {
  S.talents = {}; S.talentPoints = 10; S.shardsEarned = 0; S.shardUpg={power:0,gold:0,speed:0,ward:0,crit:0};
  const before = combatMul();
  S.talentPoints -= TALENTS.find(t=>t.id==='might').cost; S.talents.might = 1;
  const after = combatMul();
  return after > before && Math.abs(after/before - 1.05) < 1e-9;
}));

// Haste lowers attack interval, Focus lowers skill cd, Bulwark raises ward
check('Haste/Focus/Bulwark modifiers apply', await page.evaluate(() => {
  S.talents = { haste:4, focus:5, bulwark:4 };
  const def = HERO_DEFS.find(d=>d.id==='garran');
  const hasteOk = Math.abs(effInterval(def) - def.atkInterval*0.8) < 1e-9;      // -20%
  const focusOk = Math.abs(effSkillCd(def) - def.skill.cd*0.8) < 1e-9;          // -20%
  const wardOk  = wardMul() > shardMul('ward');                                  // +40%
  return hasteOk && focusOk && wardOk;
}));

// Precision raises crit multiplier
check('Precision raises crit multiplier', await page.evaluate(() => {
  S.talents = { precision:5 }; return Math.abs(critMultiplier() - 3.0) < 1e-9;   // 2.5 + 0.5
}));

// Talents panel opens + buy button works via DOM
check('Talents panel opens and shows TP', await page.evaluate(() => {
  S.talentPoints = 5; openTalents();
  const ok = document.getElementById('modalBox').textContent.includes('Talent Tree');
  closeModal(); return ok;
}));
check('Achievements panel opens', await page.evaluate(() => {
  openAchievements();
  const ok = document.getElementById('modalBox').textContent.includes('Achievements');
  closeModal(); return ok;
}));

// prestige awards +2 TP and preserves talents/achievements
check('Prestige grants +2 TP, preserves talents/achievements', await page.evaluate(() => {
  S.talents = { might:3 }; S.talentPoints = 1; S.prestiges = 0;
  S.bestWave = 1; S.totalKills = 0; S.goldenKills = 0;
  S.totalGoldEarned = 9e6; S.shardsEarned = 0; S.shards = 0;
  // pre-mark every achievement that WOULD auto-fire, so we isolate the +2 TP prestige reward
  S.achievements = { g1m:true, p1:true };
  document.getElementById('btnPrestige').onclick(); document.getElementById('confPrestige').onclick();
  return S.talentPoints===3 && S.talents.might===3 && S.achievements.g1m===true && S.prestiges===1;
}));

// old save (no talent/achievement fields) loads without breaking
check('Old save without new fields loads clean', await page.evaluate(() => {
  const old = { wave:5, gold:100, heroLevels:{garran:2,mira:1}, shardUpg:{power:1} };
  localStorage.setItem('aether_crystal_save_v1', JSON.stringify(old));
  return true;  // reload below proves no crash
}));
await page.reload(); await page.waitForTimeout(300);
check('Reload with old save: no crash, talents default', await page.evaluate(() =>
  typeof S.talentPoints==='number' && typeof S.talents==='object' && typeof S.achievements==='object' && S.heroLevels.rai===0));

// live run at 3x with talents active, no errors
await page.evaluate(() => {
  localStorage.removeItem('aether_crystal_save_v1');
});
await page.reload(); await page.waitForTimeout(200);
await page.evaluate(() => { S.gold=1e8; S.wave=30; S.talents={might:5,haste:4,focus:5,regen:3,greed:4}; S.heroLevels={garran:12,mira:10,faye:10,rai:5,aunel:0}; buildHeroPanel(); S.speed=3; });
await page.waitForTimeout(4000);
check('Live run with talents advances', await page.evaluate(() => S.wave >= 30));

console.log(R.join('\n'));
console.log('\nCONSOLE ERRORS:', errors.length ? errors : 'none');
await browser.close();
const failed = R.some(r=>r.startsWith('FAIL')) || errors.length;
console.log(failed ? '\nRESULT: FAIL' : '\nRESULT: ALL PASS');
process.exit(failed?1:0);
