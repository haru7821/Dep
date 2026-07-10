import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import path from 'path';

const dir = path.dirname(fileURLToPath(import.meta.url));
const url = 'file://' + path.join(dir, 'index.html');

const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1000, height: 700 } });
const errors = [];
page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));

await page.goto(url);
await page.waitForTimeout(400);

// initial state
const start = await page.evaluate(() => ({ wave: S.wave, gold: S.gold }));
console.log('Start:', JSON.stringify(start));

// crank speed to 3x and let it run
await page.evaluate(() => { S.speed = 3; });
await page.waitForTimeout(6000);

const mid = await page.evaluate(() => ({
  wave: S.wave, gold: S.gold, total: S.totalGoldEarned,
  enemies: enemies.length, crystal: Math.round(S.crystalHp*100),
  heroSlots: heroSlots().filter(s=>s.active).length,
}));
console.log('After 6s @3x:', JSON.stringify(mid));

// buy some upgrades to progress faster, verify affordability logic
await page.evaluate(() => { S.gold += 100000; });
const before = await page.evaluate(() => S.heroLevels.garran);
await page.click('#buy-garran');
const after = await page.evaluate(() => S.heroLevels.garran);
console.log('Garran level buy:', before, '->', after);

// give tons of gold, run to trigger unlocks + prestige availability
await page.evaluate(() => { S.gold += 5e6; S.totalGoldEarned += 5e6; });
await page.waitForTimeout(3000);
const late = await page.evaluate(() => ({
  wave: S.wave, prestigeShards: Math.floor(Math.sqrt(S.totalGoldEarned/1e6)),
  prestigeEnabled: !document.getElementById('btnPrestige').disabled,
}));
console.log('Late:', JSON.stringify(late));

// test shard shop + prestige flow
await page.click('#btnShop');
const shopOpen = await page.evaluate(() => document.getElementById('modal').classList.contains('show'));
console.log('Shard shop opens:', shopOpen);
await page.evaluate(() => closeModal());

await page.click('#btnPrestige');
await page.waitForTimeout(200);
const prestigeModal = await page.evaluate(() => !!document.getElementById('confPrestige'));
console.log('Prestige modal:', prestigeModal);
if (prestigeModal){
  await page.click('#confPrestige');
  const afterP = await page.evaluate(() => ({ wave: S.wave, shards: S.shards, gold: S.gold }));
  console.log('After prestige:', JSON.stringify(afterP));
}

// screenshot for visual check
await page.evaluate(() => { S.wave = 5; S.gold = 5000; });
await page.waitForTimeout(1500);
await page.screenshot({ path: path.join(dir, 'screenshot.png') });

console.log('\nCONSOLE ERRORS:', errors.length ? errors : 'none');
await browser.close();
console.log(errors.length ? 'VERIFY: FAIL' : 'VERIFY: PASS');
process.exit(errors.length ? 1 : 0);
