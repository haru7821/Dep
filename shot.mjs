import { chromium } from 'playwright-core';
import { fileURLToPath } from 'url';
import path from 'path';
const dir = path.dirname(fileURLToPath(import.meta.url));
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium-1194/chrome-linux/chrome' });
const page = await browser.newPage({ viewport: { width: 1000, height: 640 } });
await page.goto('file://' + path.join(dir, 'index.html'));
await page.evaluate(() => {
  localStorage.removeItem('aether_crystal_save_v1');
});
await page.reload();
await page.waitForTimeout(300);
await page.evaluate(() => {
  S.wave = 27; S.gold = 48200; S.shards = 6; S.shardsEarned = 6;
  S.heroLevels = { garran:14, mira:9, faye:5, aunel:0 };
  buildHeroPanel(); updateHud();
});
await page.waitForTimeout(1800);
await page.screenshot({ path: path.join(dir, 'screenshot.png') });
await browser.close();
console.log('shot saved');
