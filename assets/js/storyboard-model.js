// A local-only, self-contained SVG. No uploaded files, links or active content.
export const LIMITS = Object.freeze({ title: 40, caption: 84, credit: 48, sources: 80, strokes: 80, points: 256 });
export const INKS = Object.freeze(['#172d32', '#e46d2e']);
export function cleanText(value, limit) {
  return Array.from(String(value ?? '').replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '').replace(/\s+/g, ' ')).slice(0, limit).join('').trim();
}
export const xml = value => String(value).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char]));
const estimate = (text, size) => Array.from(text).length * size;
export function wrap(text, width, size, measure = estimate) {
  const lines = [];
  for (const paragraph of text.split(/\r?\n/)) {
    let line = '';
    for (const word of paragraph.trim().split(/\s+/).filter(Boolean)) {
      if (line && measure(`${line}${word}`, size) > width) { lines.push(line.trimEnd()); line = ''; }
      for (const char of Array.from(word)) {
        if (line && measure(line + char, size) > width) { lines.push(line.trimEnd()); line = ''; }
        line += char;
      }
      line += ' ';
    }
    lines.push(line.trimEnd());
  }
  return lines;
}
function fitted(text, width, size, minSize, count, measure) {
  let lines = wrap(text, width, size, measure);
  while (lines.length > count && size > minSize) lines = wrap(text, width, --size, measure);
  return { lines, size };
}
function textLines(text, x, y, width, size, minSize, count, spacing, measure, weight = 'normal') {
  const fit = fitted(text, width, size, minSize, count, measure);
  return fit.lines.map((line, index) => `<text x="${x}" y="${y + index * spacing}" font-size="${fit.size}" font-weight="${weight}">${xml(line)}</text>`).join('');
}
export function safeStrokes(value) {
  if (!Array.isArray(value)) return [];
  return value.slice(0, LIMITS.strokes).filter(stroke => INKS.includes(stroke?.color) && Array.isArray(stroke.points)).map(stroke => ({
    color: stroke.color,
    points: stroke.points.slice(0, LIMITS.points).filter(p => Array.isArray(p) && p.length === 2 && p.every(Number.isFinite)).map(p => p.map(n => Math.max(0, Math.min(1, n))))
  })).filter(stroke => stroke.points.length);
}
export function drawingSVG(strokes) {
  const fixed = n => n.toFixed(2);
  return safeStrokes(strokes).map(stroke => stroke.points.length === 1
    ? `<circle cx="${fixed(stroke.points[0][0] * 792)}" cy="${fixed(stroke.points[0][1] * 240)}" r="3" fill="${stroke.color}"/>`
    : `<path d="${stroke.points.map(([x, y], i) => `${i ? 'L' : 'M'}${fixed(x * 792)} ${fixed(y * 240)}`).join(' ')}" fill="none" stroke="${stroke.color}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`).join('');
}
export function buildSheet(input = {}, measure = estimate) {
  const title = cleanText(input.title, LIMITS.title) || 'YOUR SCENE';
  const credit = cleanText(input.credit, LIMITS.credit) || '[your name / handle]';
  const sources = cleanText(input.sources, LIMITS.sources) || '[credit any other material you use]';
  const prompts = ['What becomes easy?', 'Who changes an old rule?', 'What happens because of that choice?'];
  const headings = ['THE MACHINE WORKS.', 'CHANGE ONE OLD RULE.', 'SHOW WHAT HAPPENS.'];
  const captions = prompts.map((prompt, i) => cleanText(input.panels?.[i]?.caption, LIMITS.caption) || prompt);
  const heading = fitted(title, 836, 48, 38, 2, measure);
  const titleSVG = heading.lines.map((line, i) => `<text x="32" y="${heading.lines.length === 1 ? 107 : 82 + i * 48}" font-size="${heading.size}" font-weight="bold">${xml(line)}</text>`).join('');
  const panels = prompts.map((_, i) => `<g transform="translate(24 ${156 + i * 470})"><rect width="852" height="440" rx="16" fill="#fffdf7" stroke="#172d32" stroke-width="4"/><circle cx="43" cy="42" r="22" fill="#f28b39"/><text x="43" y="51" text-anchor="middle" font-size="26" font-weight="bold">${i + 1}</text><text x="82" y="50" font-size="26" font-weight="bold">${headings[i]}</text><path d="M24 72H828" stroke="#c5cdc6" stroke-width="2"/><g transform="translate(30 82)">${drawingSVG(input.panels?.[i]?.strokes)}</g>${textLines(captions[i], 30, 350, 792, 30, 22, 3, 35, measure)}</g>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1740" viewBox="0 0 900 1740"><title>${xml(title)} — Life After Scarcity storyboard</title><desc>Fictional scene. ${xml(captions.join(' / '))}. Scene and art: ${xml(credit)}. Sources: ${xml(sources)}.</desc><rect width="900" height="1740" fill="#fff9eb"/><g fill="#172d32" font-family="Arial,sans-serif"><text x="32" y="34" font-size="23" letter-spacing="1">LIFE AFTER SCARCITY · FICTION</text>${titleSVG}${panels}${textLines(`Scene + art: ${credit}`, 32, 1580, 836, 24, 20, 2, 27, measure)}${textLines(`Sources: ${sources}`, 32, 1640, 836, 22, 18, 2, 25, measure)}<text x="32" y="1700" font-size="20">Original template: Anti Hunter / AI/MAXXI · Life After Scarcity</text><text x="32" y="1730" font-size="20">Fiction · aimaxxi.com/life-after-scarcity/make</text></g></svg>`;
}
