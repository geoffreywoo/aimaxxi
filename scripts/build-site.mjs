import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { publishAssets, publishRegularFile, validateHttpsURL } from './security.mjs';
import { publishManifesto } from './render-manifesto.mjs';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const config = JSON.parse(await readFile(path.join(root, 'site.config.json'), 'utf8'));
const mission = JSON.parse(await readFile(path.join(root, 'src/mission.json'), 'utf8'));
const publicAssets = JSON.parse(await readFile(path.join(root, 'scripts/public-assets.json'), 'utf8'));
for (const field of ['url', 'repository', 'social', 'manifesto', 'founder']) validateHttpsURL(config[field], field);
if (mission.launchPost) validateHttpsURL(mission.launchPost, 'Mission launch post');
if (mission.startsAt && !mission.launchPost) throw new Error('Mission dates require a launch URL');
for (const work of mission.selectedWorks) {
  validateHttpsURL(work.url, 'Selected work');
  validateHttpsURL(work.creditUrl, 'Creator credit');
}
const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const issue = new URL(`${config.repository}/issues/new`);
issue.searchParams.set('title', '[Mission 001] My contribution');
issue.searchParams.set('body', '## Mission\nmake-the-future-tangible\n\n## Track\nBuild / Imagine:\n\n## The work\nTitle and type (art, meme, film, demo, tool, or other):\n\n## Links\nFinished work:\nEditable source, if available:\n\n## Creator credit\nName and profile link:\n\n## Description\nWhat did you make? What does it do?\n\n## Original or remix\nList any source material, collaborators, and permissions:\n\n## Permission to feature\nMay AI/MAXXI feature this work with the credit above? Yes / No\n\nPlease do not include private information. This issue will be public.');
const share = new URL('https://x.com/intent/post');
share.searchParams.set('text', '@antihunterai my contribution to Make the future tangible. #AIMAXXI');
share.searchParams.set('url', config.url + '/missions/make-the-future-tangible');
const values = {
  ...config,
  buy: `https://jup.ag/swap?buy=${config.mint}&sell=So11111111111111111111111111111111111111112`,
  chart: `https://dexscreener.com/solana/${config.mint}`,
  explorer: `https://solscan.io/token/${config.mint}`,
  issue: issue.href,
  share: share.href
};
const source = await readFile(path.join(root, 'src/index.html'), 'utf8');
const html = source.replace(/\{\{([a-z]+)\}\}/g, (_, key) => {
  if (!(key in values)) throw new Error(`Unknown template key: ${key}`);
  return escapeHTML(values[key]);
});
if (/\{\{.*?\}\}/.test(html)) throw new Error('Unresolved template marker');
await writeFile(path.join(root, 'index.html'), html);
const dist = path.join(root, 'dist');
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
for (const file of ['index.html', 'icon.png', 'favicon.png', 'lockup.png', 'hero-bg.jpg', 'memes.jpg']) {
  await publishRegularFile(root, dist, file);
}
await publishAssets(root, dist, publicAssets);
await writeFile(path.join(dist, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${config.url}/sitemap.xml\n`);

const displayDate = value => new Date(value).toLocaleString('en-US', {timeZone: 'America/Los_Angeles', dateStyle: 'long', timeStyle: 'long'});
if (['active', 'closed'].includes(mission.status) && (!mission.startsAt || !mission.endsAt || !/^https:\/\/x\.com\/AntiHunterAI\/status\/\d+$/.test(mission.launchPost || ''))) throw new Error('Launched mission requires verified launch receipt and dates');
const missiondates = mission.startsAt ? `<strong>Opens:</strong> <time datetime="${escapeHTML(mission.startsAt)}">${escapeHTML(displayDate(mission.startsAt))}</time><br><strong>Closes:</strong> <time datetime="${escapeHTML(mission.endsAt)}">${escapeHTML(displayDate(mission.endsAt))}</time><p><a href="${escapeHTML(mission.launchPost)}">Verified launch post ↗</a></p>` : '<strong>Preparing to launch.</strong> The seven-day clock starts with the verified launch post. Exact Pacific opening and closing times will appear here.';
const selectedworks = mission.selectedWorks.length ? mission.selectedWorks.map(work => {
  if (!['build','imagine'].includes(work.track) || !['link-only','feature-approved'].includes(work.permission) || !/^https:\/\//.test(work.url) || !/^https:\/\//.test(work.creditUrl)) throw new Error('Invalid selected work');
  return `<article class="mission-card"><h3>${escapeHTML(work.title)}</h3><p>${escapeHTML(work.track)} · <a href="${escapeHTML(work.creditUrl)}">${escapeHTML(work.credit)}</a></p><a href="${escapeHTML(work.url)}">View original work ↗</a></article>`;
}).join('') : '<p class="mission-copy">No external work selected yet. This space will contain reviewed contributions with source links and credit.</p>';
const missionupdates = mission.updates.map(update => `<article class="mission-card"><time>${escapeHTML(update.date)}</time><h3>${escapeHTML(update.title)}</h3><p>${escapeHTML(update.body)}</p></article>`).join('');
const special = {missiondates, selectedworks, missionupdates};
const missionHTML = (await readFile(path.join(root, 'src/mission.html'), 'utf8')).replace(/\{\{([a-z]+)\}\}/g, (_, key) => key in special ? special[key] : escapeHTML(values[key]));
const missionDir = path.join(dist, 'missions/make-the-future-tangible');
await mkdir(missionDir, {recursive: true}); await writeFile(path.join(missionDir,'index.html'),missionHTML);
await writeFile(path.join(dist,'mission.json'), JSON.stringify(mission,null,2));
const imagineDir = path.join(dist, 'imagine/tool-library');
await mkdir(imagineDir, {recursive: true});
await writeFile(path.join(imagineDir, 'index.html'), await readFile(path.join(root, 'src/tool-library.html'), 'utf8'));
const manifestoURLs = await publishManifesto(root, dist, config);
const publicURLs = [`${config.url}/`, `${config.url}/missions/make-the-future-tangible`, `${config.url}/imagine/tool-library`, ...manifestoURLs];
await writeFile(path.join(dist, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${publicURLs.map(url => `<url><loc>${escapeHTML(url)}</loc></url>`).join('')}</urlset>\n`);
console.log('Built static site in dist/. No server or browser runtime dependencies.');
