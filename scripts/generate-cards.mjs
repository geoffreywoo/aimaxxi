#!/usr/bin/env node
/**
 * Generate og.png and cards/{slug}.png from the same canvas renderer in enlist.js.
 *
 * Not a site runtime dependency. Run once when the card art needs a refresh:
 *
 *   python3 -m http.server 8080
 *   node scripts/generate-cards.mjs
 *
 * Uses Playwright + the local Chrome install to load /index.html, wait for
 * fonts/icon, and call window.__ENLIST__.png() / drawOg() so committed PNGs
 * match what DOWNLOAD PNG exports in the browser.
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const BASE = process.env.ENLIST_BASE || 'http://127.0.0.1:8080';

async function loadPlaywright() {
  const candidates = [
    process.env.PLAYWRIGHT_PATH,
    'playwright-core',
    'playwright',
    '/tmp/pw/node_modules/playwright-core/index.js'
  ].filter(Boolean);
  let last;
  for (const id of candidates) {
    try {
      return await import(id);
    } catch (e) {
      last = e;
    }
  }
  console.error('Install playwright-core to generate cards (dev-only, not shipped):');
  console.error('  npm install --no-save playwright-core');
  console.error(last);
  process.exit(1);
}

const pwMod = await loadPlaywright();
const { chromium } = pwMod.chromium ? pwMod : (pwMod.default || {});

const browser = await chromium.launch({
  executablePath: process.env.CHROME_PATH || '/usr/bin/google-chrome-stable',
  args: ['--headless=new', '--hide-scrollbars']
});
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
page.setDefaultTimeout(60000);

const errors = [];
page.on('pageerror', (err) => errors.push(String(err)));

await page.goto(BASE + '/index.html', { waitUntil: 'networkidle' });
await page.waitForFunction(() => window.__ENLIST__);
await page.evaluate(() => window.__ENLIST__.ready());
await page.waitForTimeout(400);

const slugs = await page.evaluate(() => window.__ENLIST__.PILLARS.map((p) => p.slug));

mkdirSync(join(ROOT, 'cards'), { recursive: true });

async function saveDataUrl(dataUrl, dest) {
  const b64 = dataUrl.split(',')[1];
  writeFileSync(dest, Buffer.from(b64, 'base64'));
  const kb = Math.round(Buffer.from(b64, 'base64').length / 1024);
  console.log(dest.replace(ROOT + '/', '') + '  ' + kb + 'KB');
}

const og = await page.evaluate(() => window.__ENLIST__.png({ og: true, w: 1200, h: 630 }));
await saveDataUrl(og, join(ROOT, 'og.png'));

for (const slug of slugs) {
  const dataUrl = await page.evaluate((s) => {
    return window.__ENLIST__.png({ pillar: s, name: 'A MAXXI', w: 1200, h: 630 });
  }, slug);
  await saveDataUrl(dataUrl, join(ROOT, 'cards', slug + '.png'));
}

if (errors.length) {
  console.error('page errors:', errors);
  await browser.close();
  process.exit(1);
}

await browser.close();
console.log('ok');
