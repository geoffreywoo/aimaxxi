import { buildSheet, INKS, LIMITS } from './storyboard-model.js';

const maker = document.querySelector('#maker');
if (maker) {
  const status = document.querySelector('#maker-status');
  const title = document.querySelector('#scene-title');
  const credit = document.querySelector('#scene-credit');
  const sources = document.querySelector('#scene-sources');
  const captions = [...maker.querySelectorAll('textarea')];
  const canvases = [...maker.querySelectorAll('canvas')];
  const undoButtons = [...maker.querySelectorAll('[data-undo]')];
  const strokes = [[], [], []];
  const measureContext = document.createElement('canvas').getContext('2d');
  let ink = INKS[0], active = null, busy = false, previewFrame = 0;
  const measure = (text, size) => {
    // Bold is a conservative bound for the shared heading/caption wrapper.
    measureContext.font = `bold ${size}px Arial`;
    return measureContext.measureText(text).width;
  };
  const sheet = () => buildSheet({ title: title.value, credit: credit.value, sources: sources.value, panels: captions.map((caption, i) => ({ caption: caption.value, strokes: strokes[i] })) }, measure);
  function preview() {
    cancelAnimationFrame(previewFrame);
    previewFrame = requestAnimationFrame(() => {
      const svg = new DOMParser().parseFromString(sheet(), 'image/svg+xml').documentElement;
      document.querySelector('#sheet-preview').replaceChildren(svg);
      undoButtons.forEach((button, i) => { button.disabled = !strokes[i].length; });
    });
  }
  function redraw(i) {
    const context = canvases[i].getContext('2d');
    context.clearRect(0, 0, 792, 240);
    context.lineWidth = 6;
    context.lineCap = context.lineJoin = 'round';
    for (const stroke of strokes[i]) {
      context.strokeStyle = context.fillStyle = stroke.color;
      context.beginPath();
      if (stroke.points.length === 1) {
        context.arc(stroke.points[0][0] * 792, stroke.points[0][1] * 240, 3, 0, Math.PI * 2);
        context.fill();
      } else {
        stroke.points.forEach(([x, y], n) => n ? context.lineTo(x * 792, y * 240) : context.moveTo(x * 792, y * 240));
        context.stroke();
      }
    }
  }
  function point(event, canvas) {
    const bounds = canvas.getBoundingClientRect();
    return [Math.max(0, Math.min(1, (event.clientX - bounds.left) / bounds.width)), Math.max(0, Math.min(1, (event.clientY - bounds.top) / bounds.height))];
  }
  function finish() {
    if (!active) return;
    const { i, pointerId } = active;
    active = null;
    if (canvases[i].hasPointerCapture(pointerId)) canvases[i].releasePointerCapture(pointerId);
    preview();
  }
  canvases.forEach((canvas, i) => {
    canvas.addEventListener('pointerdown', event => {
      if (event.button !== 0 || active) return;
      if (strokes[i].length >= LIMITS.strokes) { status.textContent = 'This panel is full. Undo a stroke to draw more.'; return; }
      const stroke = { color: ink, points: [point(event, canvas)] };
      strokes[i].push(stroke);
      active = { i, pointerId: event.pointerId, stroke };
      canvas.setPointerCapture(event.pointerId);
      redraw(i);
      event.preventDefault();
    });
    canvas.addEventListener('pointermove', event => {
      if (!active || active.i !== i || active.pointerId !== event.pointerId) return;
      const coalesced = event.getCoalescedEvents?.();
      for (const sample of coalesced?.length ? coalesced : [event]) {
        if (active.stroke.points.length >= LIMITS.points) {
          status.textContent = 'Stroke limit reached. Lift your pen or finger, then draw another stroke.';
          break;
        }
        active.stroke.points.push(point(sample, canvas));
      }
      redraw(i);
    });
    for (const event of ['pointerup', 'pointercancel', 'lostpointercapture']) canvas.addEventListener(event, event => {
      if (active?.i === i && active.pointerId === event.pointerId) finish();
    });
    undoButtons[i].addEventListener('click', () => { finish(); strokes[i].pop(); redraw(i); preview(); status.textContent = `Last stroke removed from panel ${i + 1}.`; });
  });
  for (const input of [title, credit, sources, ...captions]) input.addEventListener('input', preview);
  for (const button of maker.querySelectorAll('[data-ink]')) button.addEventListener('click', () => {
    ink = INKS[Number(button.dataset.ink)];
    maker.querySelectorAll('[data-ink]').forEach(other => other.setAttribute('aria-pressed', String(other === button)));
  });
  const svgData = svg => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  function download(blob, suffix) {
    const url = URL.createObjectURL(blob), anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `life-after-scarcity-scene.${suffix}`;
    anchor.dataset.movementEvent = 'ignore'; // Only the user's original export click is an intent.
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 30000);
  }
  for (const anchor of maker.querySelectorAll('[data-export]')) anchor.addEventListener('click', async event => {
    event.preventDefault();
    if (busy) return;
    busy = true;
    finish();
    maker.querySelectorAll('[data-export]').forEach(link => link.setAttribute('aria-disabled', 'true'));
    status.textContent = 'Preparing your file…';
    try {
      const svg = sheet();
      if (anchor.dataset.export === 'svg') download(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), 'svg');
      else {
        const image = new Image();
        image.src = svgData(svg);
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = 900; canvas.height = 1740;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
        if (!blob) throw new Error('PNG unavailable');
        download(blob, 'png');
      }
      status.textContent = 'File prepared. Check your browser’s downloads. Your draft is still here.';
    } catch {
      status.textContent = 'Export failed. Your draft is still here. Try the SVG download.';
    } finally {
      busy = false;
      maker.querySelectorAll('[data-export]').forEach(link => link.removeAttribute('aria-disabled'));
    }
  });
  maker.hidden = false;
  preview();
}
