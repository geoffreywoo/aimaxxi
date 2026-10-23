import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { buildSheet, cleanText, safeStrokes, wrap, LIMITS } from '../assets/js/storyboard-model.js';
import { campaignContext } from '../assets/js/movement-analytics.js';

test('only the maker route gets its new label; existing campaign labels stay intact', () => {
  assert.deepEqual(campaignContext('/life-after-scarcity/make'), { campaign: 'life-after-scarcity', episode: 'storyboard-maker' });
  assert.deepEqual(campaignContext('/life-after-scarcity/make/'), campaignContext('/life-after-scarcity/make'));
  assert.deepEqual(campaignContext('/life-after-scarcity'), { campaign: 'life-after-scarcity', episode: 'writers-room' });
  assert.deepEqual(campaignContext('/missions/make-the-future-tangible'), { campaign: 'aimaxxi-movement', episode: 'make-the-future-tangible' });
});

test('exports escape hostile text and contain no active or linked content', () => {
  const attack = '<script>alert(1)</script>&"';
  const svg = buildSheet({ title: attack, credit: attack, sources: attack, panels: [{ caption: attack }] });
  assert.match(svg, /&lt;script&gt;alert\(1\)&lt;\/script&gt;&amp;&quot;/);
  assert.doesNotMatch(svg, /<script|foreignObject|href=|<image|onload=|<style/);
  assert.match(svg, /width="900" height="1740"/);
});

test('text bounds and whitespace prevent tall newline or long-word exports', () => {
  assert.equal(cleanText(' a\n\n b\t c\u0000 ', 50), 'a b c');
  assert.equal(Array.from(cleanText('🟧'.repeat(100), LIMITS.title)).length, LIMITS.title);
  assert.deepEqual(wrap('ABCDEFGHIJ', 4, 1), ['ABCD', 'EFGH', 'IJ']);
  const svg = buildSheet({ title: 'W'.repeat(400), credit: 'W'.repeat(400), sources: 'W'.repeat(400), panels: [0, 1, 2].map(() => ({ caption: 'W'.repeat(400) + '\n'.repeat(400) })) });
  assert.doesNotMatch(svg, /NaN|Infinity|undefined/);
  const panel = svg.split('<g transform="translate(24 156)">')[1].split('<g transform="translate(24 626)">')[0];
  assert.ok([...panel.matchAll(/<text /g)].length <= 5, 'fixed number, heading and at most3 caption lines');
});

test('stroke coordinates, colors and amount cannot escape the drawing boundary', () => {
  assert.deepEqual(safeStrokes([{ color: '#172d32', points: [[-2, 3], [NaN, 1], [Infinity, 0]] }, { color: 'url(https://example.com)', points: [[0, 0]] }]), [{ color: '#172d32', points: [[0, 1]] }]);
  const strokes = safeStrokes(Array.from({ length: 200 }, () => ({ color: '#e46d2e', points: Array.from({ length: 500 }, () => [0.5, 0.5]) })));
  assert.equal(strokes.length, LIMITS.strokes);
  assert.equal(strokes[0].points.length, LIMITS.points);
  assert.match(buildSheet({ panels: [{ strokes: [{ color: '#e46d2e', points: [[0.2, 0.4]] }] }] }), /<circle cx="158.40" cy="96.00" r="3" fill="#e46d2e"/);
});

test('the built editor is reachable and does not add a draft submission or storage path', async () => {
  const html = await readFile(new URL('../dist/life-after-scarcity/make/index.html', import.meta.url), 'utf8');
  const ui = await readFile(new URL('../assets/js/storyboard.js', import.meta.url), 'utf8');
  const room = await readFile(new URL('../dist/life-after-scarcity/index.html', import.meta.url), 'utf8');
  assert.match(room, /href="\/life-after-scarcity\/make"/);
  assert.match(html, /Your draft stays in this tab/);
  assert.match(html, /permission to feature/);
  assert.match(html, /aria-live="polite"/);
  assert.doesNotMatch(ui, /\bfetch\(|XMLHttpRequest|sendBeacon|localStorage|sessionStorage|URLSearchParams|location\.|\.va\(/);
});
