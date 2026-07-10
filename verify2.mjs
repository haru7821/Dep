import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import path from 'path';
const dir = path.dirname(fileURLToPath(import.meta.url));
const url = 'file://' + path.join(dir, 'index.html');
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
const errors = [];
page.on('console', m => { if (m.type()==='error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERR: '+e.message));
await page.goto(url);
await page.evaluate(() => localStorage.removeItem('aether_crystal_save_v1'));
await page.reload();
await page.waitForTimeout(300);

const results = [];
const check = (name, cond) => results.push((cond?'PASS':'FAIL')+' — '+name);

// FIX 1: Crystal Ward reduces incoming damage
const ward = await page.evaluate(() => {
  S.crystalHp = 1; S.shardUpg.ward = 0;
  const before = S.crystalHp;
  // simulate an enemy hitting crystal with ward 0
  S.crystalHp -= 0.05 / (SHARD_UPGRADES.find(u=>u.id==='ward').effect(0));
  const dmg0 = before - S.crystalHp;
  S.crystalHp = 1;
  S.crystalHp -= 0.05 / (SHARD_UPGRADES.find(u=>u.id==='ward').effect(5)); // +100% hp
  const dmg5 = 1 - S.crystalHp;
  return { dmg0, dmg5 };
});
check('Crystal Ward L5 halves crystal damage', Math.abs(ward.dmg5 - ward.dmg0/2) < 1e-9);

// FIX 4: fmt(Infinity)
const inf = await page.evaluate(() => fmt(Infinity) + '|' + fmt(NaN) + '|' + fmt(1234567));
check('fmt handles Infinity/NaN', inf.startsWith('∞|∞|'));

// FIX 3: buyHero unlock guard — force wave below Mira's unlock, try to buy
const guard = await page.evaluate(() => {
  S.wave = 5; S.gold = 1e9; S.heroLevels.mira = 0;
  buildHeroPanel();
  buyHero(HERO_DEFS.find(d=>d.id==='mira'));  // should be blocked (wave<10)
  return S.heroLevels.mira;
});
check('Cannot recruit Mira below unlock wave', guard === 0);

// FIX 2 + shard exploit: prestige preserves totalGold, awards delta, no refund on spend
const prestige = await page.evaluate(() => {
  // reset to a clean-ish run
  S.shards = 0; S.shardsEarned = 0; S.shardUpg = {power:0,gold:0,speed:0,ward:0,crit:0};
  // pre-unlock all achievements so their shard rewards don't perturb the prestige-only math
  S.achievements = Object.fromEntries(ACHIEVEMENTS.map(a=>[a.id,true]));
  S.totalGoldEarned = 9e6; // sqrt(9)=3 shards
  const t0 = prestigeShards(S.totalGoldEarned);           // 3
  // first prestige
  document.getElementById('btnPrestige').onclick(); document.getElementById('confPrestige').onclick();
  const afterP1 = { shards:S.shards, earned:S.shardsEarned, total:S.totalGoldEarned };
  // spend 3 shards in shop, then check we can't prestige again for free
  S.shards = 0; // simulate spending all 3 in shop
  const canFree = !document.getElementById('btnPrestige').disabled;
  // earn more: total 25e6 -> sqrt=5 -> gain 5-3 = 2
  S.totalGoldEarned = 25e6;
  updateHud();
  const enabledNow = !document.getElementById('btnPrestige').disabled;
  document.getElementById('btnPrestige').onclick(); document.getElementById('confPrestige').onclick();
  const afterP2 = { shards:S.shards, earned:S.shardsEarned, total:S.totalGoldEarned };
  return { t0, afterP1, canFree, enabledNow, afterP2 };
});
check('Prestige 1 awards 3 shards',       prestige.afterP1.shards===3 && prestige.afterP1.earned===3);
check('Prestige preserves totalGoldEarned',prestige.afterP1.total===9e6);
check('No free re-prestige after spending', prestige.canFree===false);
check('Re-prestige at 25M awards delta (+2, not +5)', prestige.afterP2.shards===2 && prestige.afterP2.earned===5);

// smoke: run a few seconds, ensure no errors and waves advance
await page.evaluate(() => { localStorage.removeItem('aether_crystal_save_v1'); });
await page.reload(); await page.waitForTimeout(200);
await page.evaluate(() => S.speed = 3);
await page.waitForTimeout(4000);
const adv = await page.evaluate(() => S.wave);
check('Waves advance during play', adv >= 2);

console.log(results.join('\n'));
console.log('\nCONSOLE ERRORS:', errors.length ? errors : 'none');
await browser.close();
const failed = results.some(r=>r.startsWith('FAIL')) || errors.length;
console.log(failed ? '\nRESULT: FAIL' : '\nRESULT: ALL PASS');
process.exit(failed ? 1 : 0);
