import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { inflateRawSync } from 'node:zlib';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const config = JSON.parse(await readFile(path.join(root, 'site.config.json'), 'utf8'));
const html = await readFile(path.join(dist, 'index.html'), 'utf8');
const decode = (value) => value.replace(/&(?:amp|quot|apos|lt|gt|#39);/g,
  (entity) => ({ '&amp;': '&', '&quot;': '"', '&apos;': "'", '&#39;': "'", '&lt;': '<', '&gt;': '>' }[entity]));
const tags = (source, tag) => [...source.matchAll(new RegExp(`<${tag}\\b([^>]*)>`, 'gi'))].map((match) => {
  const attributes = {};
  for (const attr of match[1].matchAll(/([\w:-]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g)) {
    attributes[attr[1].toLowerCase()] = decode(attr[2] ?? attr[3] ?? attr[4] ?? '');
  }
  return attributes;
});
const anchors = tags(html, 'a');
const plainHTML = html.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
const text = plainHTML.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
const localPath = (url, base = '/') => {
  const parsed = new URL(url, new URL(base, config.url));
  if (parsed.origin !== new URL(config.url).origin) return null;
  return path.join(dist, decodeURIComponent(parsed.pathname));
};
async function filesUnder(directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const name = path.join(directory, entry.name);
    files.push(...(entry.isDirectory() ? await filesUnder(name) : [name]));
  }
  return files;
}
function pngDimensions(bytes, name) {
  assert.deepEqual(bytes.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), `${name}: valid PNG signature`);
  assert.equal(bytes.toString('ascii', 12, 16), 'IHDR', `${name}: PNG dimension header`);
  return [bytes.readUInt32BE(16), bytes.readUInt32BE(20)];
}
function rasterDimensions(bytes, name) {
  if (/\.png$/i.test(name)) return pngDimensions(bytes, name);
  assert.match(name, /\.jpe?g$/i, `${name}: supported social image format`);
  assert.equal(bytes.readUInt16BE(0), 0xffd8, `${name}: valid JPEG signature`);
  const frames = new Set([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf]);
  let cursor = 2;
  while (cursor + 3 < bytes.length) {
    assert.equal(bytes[cursor++], 0xff, `${name}: JPEG marker boundary`);
    while (bytes[cursor] === 0xff) cursor++;
    const marker = bytes[cursor++];
    if (marker === 0xda || marker === 0xd9) break;
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    const length = bytes.readUInt16BE(cursor);
    assert.ok(length >= 2 && cursor + length <= bytes.length, `${name}: complete JPEG segment`);
    if (frames.has(marker)) {
      assert.ok(length >= 8, `${name}: complete JPEG frame header`);
      return [bytes.readUInt16BE(cursor + 5), bytes.readUInt16BE(cursor + 3)];
    }
    cursor += length;
  }
  assert.fail(`${name}: JPEG frame dimensions not found`);
}

// Read the ZIP central directory, then decompress the selected local entries.
// Comparing extracted bytes to the published downloads catches stale kit builds.
function zipEntries(bytes) {
  let end = bytes.length - 22;
  const limit = Math.max(0, end - 65535);
  while (end >= limit && bytes.readUInt32LE(end) !== 0x06054b50) end--;
  assert.ok(end >= limit, 'ZIP end-of-central-directory exists');
  const count = bytes.readUInt16LE(end + 10);
  let cursor = bytes.readUInt32LE(end + 16);
  const entries = new Map();
  for (let i = 0; i < count; i++) {
    assert.equal(bytes.readUInt32LE(cursor), 0x02014b50, 'ZIP central entry signature');
    const method = bytes.readUInt16LE(cursor + 10);
    const compressedSize = bytes.readUInt32LE(cursor + 20);
    const size = bytes.readUInt32LE(cursor + 24);
    const nameLength = bytes.readUInt16LE(cursor + 28);
    const extraLength = bytes.readUInt16LE(cursor + 30);
    const commentLength = bytes.readUInt16LE(cursor + 32);
    const offset = bytes.readUInt32LE(cursor + 42);
    const name = bytes.toString('utf8', cursor + 46, cursor + 46 + nameLength);
    assert.ok(!entries.has(name), `ZIP entry is unique: ${name}`);
    assert.ok(!name.startsWith('/') && !name.split('/').includes('..'), `ZIP path is safe: ${name}`);
    assert.equal(bytes.readUInt32LE(offset), 0x04034b50, `ZIP local header: ${name}`);
    const start = offset + 30 + bytes.readUInt16LE(offset + 26) + bytes.readUInt16LE(offset + 28);
    const compressed = bytes.subarray(start, start + compressedSize);
    assert.ok(method === 0 || method === 8, `Supported ZIP compression: ${name}`);
    const content = method === 8 ? inflateRawSync(compressed) : compressed;
    assert.equal(content.length, size, `ZIP uncompressed length: ${name}`);
    entries.set(name, content);
    cursor += 46 + nameLength + extraLength + commentLength;
  }
  return entries;
}

test('mint display and every token destination preserve the canonical Solana address', () => {
  assert.equal(config.mint, '5cQReyzgJQbtbGLvkm1vN9GDGFBWzcAC6TDprBwzVVjL');
  const input = tags(html, 'input').find((tag) => tag.id === 'mint-address');
  assert.equal(input?.value, config.mint);
  assert.ok('readonly' in input, 'mint stays selectable without JavaScript');
  const destinations = {
    buy: `https://jup.ag/swap?buy=${config.mint}&sell=So11111111111111111111111111111111111111112`,
    chart: `https://dexscreener.com/solana/${config.mint}`,
    explorer: `https://solscan.io/token/${config.mint}`,
  };
  for (const [kind, expected] of Object.entries(destinations)) {
    const links = anchors.filter((anchor) => anchor['data-token-link'] === kind);
    assert.ok(links.length > 0, `${kind} destination exists`);
    for (const link of links) assert.equal(link.href, expected);
  }
  for (const anchor of anchors) {
    if (/^https:\/\/(?:jup\.ag|dexscreener\.com|solscan\.io)\//.test(anchor.href ?? '')) {
      assert.ok(Object.values(destinations).includes(anchor.href), `Unexpected token destination: ${anchor.href}`);
    }
  }
});

test('public files contain no obsolete uppercase mint or private production sources', async () => {
  for (const file of await filesUnder(dist)) {
    const relative = path.relative(dist, file);
    assert.ok(!relative.split(path.sep).includes('source'), `Raw source excluded: ${relative}`);
    assert.ok(!/BRAND-AND-MOVEMENT-PLAN|provenance-hero-power|provenance-posters/.test(relative), `Private planning excluded: ${relative}`);
    assert.ok(!(await readFile(file)).includes(Buffer.from(config.mint.toUpperCase())), `Obsolete uppercase mint in ${relative}`);
  }
});

test('all local page, image, script, font and download references resolve', async () => {
  const references = [];
  for (const tag of tags(html, '[a-z][a-z0-9-]*')) {
    for (const key of ['href', 'src']) if (tag[key] && !tag[key].startsWith('#')) references.push([tag[key], '/']);
    if (tag.srcset) for (const candidate of tag.srcset.split(',')) references.push([candidate.trim().split(/\s+/)[0], '/']);
  }
  for (const file of await filesUnder(dist)) {
    if (!file.endsWith('.css')) continue;
    const css = await readFile(file, 'utf8');
    for (const match of css.matchAll(/url\(\s*["']?([^"')\s]+)["']?\s*\)/g)) {
      references.push([match[1], '/' + path.relative(dist, file).split(path.sep).join('/')]);
    }
  }
  for (const [reference, base] of references) {
    const file = localPath(reference, base);
    if (!file) continue;
    const info = await stat(file);
    assert.ok(info.isFile() || (info.isDirectory() && (await stat(path.join(file,'index.html'))).isFile()), `Local reference resolves: ${reference}`);
  }
  const downloads = anchors.filter((anchor) => 'download' in anchor);
  assert.ok(downloads.length >= 6, 'individual assets and the complete kit are downloadable');
  for (const link of downloads) {
    const file = localPath(link.href);
    assert.ok(file, `Download is hosted locally: ${link.href}`);
    assert.ok((await stat(file)).size > 0, `Download is nonempty: ${link.href}`);
  }
});

test('all same-page links work and established public anchors survive', () => {
  const ids = tags(html, '[a-z][a-z0-9-]*').filter((tag) => tag.id).map((tag) => tag.id);
  assert.equal(ids.length, new Set(ids).size, 'IDs are unique');
  for (const id of ['top', 'doctrine', 'schism', 'buy', 'memes']) assert.ok(ids.includes(id), `Legacy anchor: #${id}`);
  for (const anchor of anchors.filter((tag) => tag.href?.startsWith('#'))) {
    assert.ok(ids.includes(decodeURIComponent(anchor.href.slice(1))), `Anchor target exists: ${anchor.href}`);
  }
});

test('essential reading and participation are delivered as static HTML', () => {
  assert.doesNotMatch(html, /\{\{[^}]+\}\}/, 'build resolves every placeholder');
  assert.equal(tags(plainHTML, 'h1').length, 1, 'one static main heading');
  for (const id of ['doctrine', 'kit', 'join', 'token']) {
    const section = tags(plainHTML, 'section').find((tag) => tag.id === id);
    assert.ok(section, `Static section exists: ${id}`);
    assert.ok(!('hidden' in section) && section['aria-hidden'] !== 'true', `Section is not script-gated: ${id}`);
  }
  assert.ok(tags(plainHTML, 'h3').length >= 12, 'doctrine, asset and participation content renders directly');
  assert.match(text, /participat(?:e|ion)[^.]{0,80}(?:hold|open)|participation is open/i);
  assert.match(text, /Select the address to copy it\./, 'manual copy fallback');
  assert.match(text, /price can fall, including to zero/i, 'token risk copy is present without scripts');
});

test('participation links open editable, correctly attributed and public destinations', () => {
  const share = anchors.map((anchor) => anchor.href).find((href) => href?.startsWith('https://x.com/intent/post?'));
  const shareURL = new URL(share);
  assert.equal(shareURL.searchParams.get('url'), config.url + '/life-after-scarcity');
  assert.equal(shareURL.searchParams.get('text'), '@antihunterai my scene from Life After Scarcity. Source and credit: Permission to feature:');
  assert.match(text, /Opens an editable post\. Attach your image yourself\./);
  const submission = anchors.map((anchor) => anchor.href).find((href) => href?.startsWith(config.repository + '/issues/new?'));
  const submissionURL = new URL(submission);
  assert.equal(submissionURL.searchParams.get('title'), '[Life After Scarcity] My scene or source');
  const body = submissionURL.searchParams.get('body');
  for (const section of ['The work', 'Links', 'Creator credit', 'Description', 'Original or remix', 'Permission to feature']) {
    assert.ok(body.includes(`## ${section}\n`), `Submission prompt has ${section}`);
  }
  assert.match(body, /Please do not include private information\. This issue will be public\./);
  assert.match(text, /Optional for code and source\. Public; sign-in required\./);
});

test('poster exports and social preview have their promised raster dimensions', async () => {
  const posters = (await readdir(path.join(dist, 'assets/kit'))).filter((name) => /^poster-.*\.png$/.test(name));
  assert.deepEqual(posters.sort(), ['poster-night-shift.png', 'poster-power.png', 'poster-transmission.png']);
  for (const name of posters) {
    assert.deepEqual(pngDimensions(await readFile(path.join(dist, 'assets/kit', name)), name), [1080, 1350]);
  }
  assert.deepEqual(pngDimensions(await readFile(path.join(dist, 'assets/brand/og.png')), 'Open Graph'), [1200, 630]);
  for (const img of tags(html, 'img').filter((tag) => tag.src?.endsWith('.png'))) {
    assert.deepEqual(pngDimensions(await readFile(localPath(img.src)), img.src), [Number(img.width), Number(img.height)], `Advertised PNG dimensions: ${img.src}`);
  }
  const metadata = tags(html, 'meta');
  const socialURL = metadata.find((tag) => tag.property === 'og:image')?.content;
  const socialPath = localPath(socialURL);
  assert.ok(socialPath, 'advertised social image is hosted with the site');
  assert.deepEqual(rasterDimensions(await readFile(socialPath), socialPath), [1200, 630], 'actual advertised social preview dimensions');
  assert.equal(metadata.find((tag) => tag.name === 'twitter:image')?.content, socialURL, 'Open Graph and X use the same image');
  assert.equal(metadata.find((tag) => tag.property === 'og:image:width')?.content, '1200');
  assert.equal(metadata.find((tag) => tag.property === 'og:image:height')?.content, '630');
});

test('the brand-kit ZIP contains the same bytes as each individual download', async () => {
  const zipLinks = anchors.filter((anchor) => 'download' in anchor && anchor.href?.endsWith('.zip'));
  assert.ok(zipLinks.length > 0);
  assert.equal(new Set(zipLinks.map((anchor) => anchor.href)).size, 1, 'all kit buttons use the same archive');
  const entries = zipEntries(await readFile(localPath(zipLinks[0].href)));
  for (const name of entries.keys()) assert.ok(!name.split('/').includes('source'), `Raw generated art excluded from kit: ${name}`);
  for (const link of anchors.filter((anchor) => 'download' in anchor && !anchor.href.endsWith('.zip'))) {
    const basename = path.basename(link.href);
    const matches = [...entries].filter(([name]) => name.endsWith('/' + basename));
    assert.equal(matches.length, 1, `Exactly one kit entry for ${basename}`);
    assert.deepEqual(matches[0][1], await readFile(localPath(link.href)), `Kit is current: ${basename}`);
  }
  for (const basename of ['BRAND-GUIDE.md', 'COMMUNITY-USE.md', 'PROVENANCE.json']) {
    const entry = [...entries].find(([name]) => name.endsWith('/' + basename));
    assert.ok(entry, `Kit documentation: ${basename}`);
    assert.deepEqual(entry[1], await readFile(path.join(dist, 'assets/kit', basename)));
  }
});
