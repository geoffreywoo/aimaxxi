(function () {
  var cv = document.getElementById('forge-cv');
  if (!cv || !cv.getContext) return;
  var ctx = cv.getContext('2d');
  var W = 1080, H = 1080;
  var BG = '#050505', INK = '#f4f4f0', MUT = 'rgba(244,244,240,.55)';
  var FAINT = 'rgba(244,244,240,.32)', LINE = 'rgba(244,244,240,.14)', CRT = '#7dff9a';
  var ANTON = 'Anton, Impact, sans-serif';
  var MONO = '"Space Mono", "Courier New", monospace';
  var SANS = 'Archivo, Helvetica, Arial, sans-serif';
  var TPL = ['flag', 'outline', 'tape', 'crt', 'hero', 'list', 'pillar', 'stamp'];
  var CAPTIONS = [
    '10x is cowardice. we want 1,000,000x.',
    'if it can be automated, automate it.',
    'if it can be scaled, scale it.',
    'if it can be memed, meme it.',
    'no brakes. no ceilings.',
    'no vibes left unoptimized.',
    'intelligence is the ultimate resource.',
    'memes are the transmission layer.',
    'the decels are organized. so are we.',
    'stop optimizing. start maxxing.',
    'maximum compute. maximum memes.'
  ];
  var PILLARS = [
    { num: '01', name: 'MAXIMUM COMPUTE', body: 'build the datacenters. the substrate is FLOPs and we are short.' },
    { num: '02', name: 'MAXIMUM INTELLIGENCE', body: 'intelligence is the ultimate resource.' },
    { num: '03', name: 'MAXIMUM AGENTS', body: 'if it can be automated, automate it.' },
    { num: '04', name: 'MAXIMUM ROBOTS', body: 'ship the robots. the physical world is the final frontier.' },
    { num: '05', name: 'MAXIMUM ENERGY', body: 'energy is the only real currency.' },
    { num: '06', name: 'MAXIMUM MEMES', body: 'mint the memes. memes are the transmission layer.' }
  ];
  var LIST = [
    { n: '01', t: 'MAXIMUM COMPUTE', s: 'build the substrate' },
    { n: '02', t: 'MAXIMUM INTELLIGENCE', s: 'train the models' },
    { n: '03', t: 'MAXIMUM AGENTS', s: 'automate it' },
    { n: '04', t: 'MAXIMUM MEMES', s: 'transmit' }
  ];
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var state = { t: 'flag', cap: 0, custom: '', pillar: 5, photo: null, scan: 0, exportOk: true };
  var iconImg = null, heroImg = null, heroWait = null, needs = false, crtOn = false, copyTimer = 0;
  var el = {
    temps: document.getElementById('forge-temps'),
    cap: document.getElementById('forge-cap'),
    custom: document.getElementById('forge-custom'),
    customPane: document.getElementById('forge-custom-pane'),
    capPane: document.getElementById('forge-cap-pane'),
    pillarPane: document.getElementById('forge-pillar-pane'),
    pillars: document.getElementById('forge-pillars'),
    stampPane: document.getElementById('forge-stamp-pane'),
    file: document.getElementById('forge-file'),
    fileBtn: document.getElementById('forge-file-btn'),
    preview: document.getElementById('forge-preview'),
    sr: document.getElementById('forge-sr'),
    dl: document.getElementById('forge-dl'),
    share: document.getElementById('forge-share'),
    copy: document.getElementById('forge-copy'),
    x: document.getElementById('forge-x'),
    err: document.getElementById('forge-err'),
    wrap: document.getElementById('forge')
  };

  function ls(c, v) { try { c.letterSpacing = v; } catch (e) {} }
  function requestDraw() {
    if (needs) return;
    needs = true;
    requestAnimationFrame(function () { needs = false; draw(); });
  }
  function caption() {
    if (state.t === 'pillar') return PILLARS[state.pillar].body;
    if (state.cap === 'custom') {
      var t = (state.custom || '').slice(0, 96);
      return t || '10x is cowardice.';
    }
    return CAPTIONS[state.cap] || CAPTIONS[0];
  }
  function wrapLines(c, text, maxW) {
    var words = String(text).split(/\s+/), lines = [], cur = '';
    function pushWord(w) {
      if (c.measureText(w).width <= maxW) { cur = w; return; }
      var chunk = '';
      for (var j = 0; j < w.length; j++) {
        var t2 = chunk + w.charAt(j);
        if (c.measureText(t2).width <= maxW) chunk = t2;
        else { if (chunk) lines.push(chunk); chunk = w.charAt(j); }
      }
      cur = chunk;
    }
    for (var i = 0; i < words.length; i++) {
      var trial = cur ? cur + ' ' + words[i] : words[i];
      if (!cur) { pushWord(words[i]); continue; }
      if (c.measureText(trial).width <= maxW) cur = trial;
      else { lines.push(cur); cur = ''; pushWord(words[i]); }
    }
    if (cur) lines.push(cur);
    return lines.length ? lines : [''];
  }
  function fit(c, text, stack, maxW, start, min, maxLines) {
    var size = start, lines;
    while (size >= min) {
      c.font = size + 'px ' + stack;
      lines = wrapLines(c, text, maxW);
      if (lines.length <= maxLines) return { lines: lines, size: size };
      size -= 2;
    }
    c.font = min + 'px ' + stack;
    lines = wrapLines(c, text, maxW);
    if (lines.length > maxLines) {
      lines = lines.slice(0, maxLines);
      var last = lines[maxLines - 1];
      while (last.length && c.measureText(last + '…').width > maxW) last = last.slice(0, -1);
      lines[maxLines - 1] = last + '…';
    }
    return { lines: lines, size: min };
  }
  function fillLines(c, fitted, x, y, align, gap) {
    c.textAlign = align || 'center';
    c.textBaseline = 'top';
    var lh = (gap || 0.92) * fitted.size;
    c.font = fitted.size + 'px ' + ANTON;
    for (var i = 0; i < fitted.lines.length; i++) c.fillText(fitted.lines[i], x, y + i * lh);
    return lh * fitted.lines.length;
  }
  function strokeLines(c, fitted, x, y, align, gap, lw) {
    c.textAlign = align || 'center';
    c.textBaseline = 'top';
    c.lineJoin = 'miter';
    c.miterLimit = 2;
    c.lineWidth = lw || Math.max(2, fitted.size * 0.03);
    var lh = (gap || 0.92) * fitted.size;
    c.font = fitted.size + 'px ' + ANTON;
    for (var i = 0; i < fitted.lines.length; i++) c.strokeText(fitted.lines[i], x, y + i * lh);
    return lh * fitted.lines.length;
  }
  function kicker(c, text, x, y, color, size) {
    c.fillStyle = color || MUT;
    c.font = (size || 22) + 'px ' + MONO;
    ls(c, '0.28em');
    c.textAlign = 'left';
    c.textBaseline = 'top';
    c.fillText(text, x, y);
    ls(c, '0px');
  }
  function mark(c, x, y, s) {
    if (!iconImg) return;
    c.drawImage(iconImg, x, y, s, s);
  }
  function lockup(c, x, y, size, color) {
    c.fillStyle = color || INK;
    c.font = (size || 28) + 'px ' + ANTON;
    c.textAlign = 'left';
    c.textBaseline = 'middle';
    ls(c, '0.06em');
    c.fillText('AI/MAXXI', x, y);
    ls(c, '0px');
  }
  function cover(c, img, w, h) {
    var iw = img.naturalWidth || img.width, ih = img.naturalHeight || img.height;
    if (!iw || !ih) return;
    var r = Math.max(w / iw, h / ih), dw = iw * r, dh = ih * r;
    c.drawImage(img, (w - dw) / 2, (h - dh) / 2, dw, dh);
  }
  function frame() {
    ctx.strokeStyle = LINE;
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, W - 2, H - 2);
  }

  function drawFlag() {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    kicker(ctx, 'AI/MAXXI  ↗↗', 72, 64);
    if (iconImg) mark(ctx, (W - 460) / 2, 150, 460);
    ctx.fillStyle = INK;
    var f = fit(ctx, caption(), ANTON, W - 144, 78, 28, 3);
    fillLines(ctx, f, W / 2, 660);
    ctx.fillStyle = MUT;
    ctx.font = '20px ' + MONO;
    ctx.textAlign = 'center';
    ctx.fillText('TRANSMIT', W / 2, 1008);
    frame();
  }
  function drawOutline() {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    kicker(ctx, 'AI/MAXXI  ↗↗', 72, 64);
    ctx.strokeStyle = INK;
    var f = fit(ctx, caption(), ANTON, W - 120, 118, 36, 3);
    var block = f.size * 0.92 * f.lines.length;
    strokeLines(ctx, f, W / 2, (H - block) / 2, 'center', 0.92, Math.max(3, f.size * 0.028));
    ctx.fillStyle = INK;
    ctx.fillRect(72, 980, W - 144, 3);
    frame();
  }
  function drawTape() {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    kicker(ctx, 'TRANSMISSION LAYER', 72, 70);
    kicker(ctx, 'AI/MAXXI ↗↗', 72, 108, INK, 22);
    ctx.fillStyle = INK; ctx.fillRect(72, 168, W - 144, 3);
    ctx.fillStyle = INK;
    var f = fit(ctx, caption(), ANTON, W - 144, 96, 32, 3);
    var block = f.size * 0.92 * f.lines.length;
    fillLines(ctx, f, W / 2, (H - block) / 2 + 10);
    ctx.fillStyle = INK; ctx.fillRect(72, 930, W - 144, 3);
    ctx.fillStyle = MUT;
    ctx.font = '20px ' + MONO;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ls(ctx, '0.24em');
    ctx.fillText('NO BRAKES. NO CEILINGS.', 72, 956);
    ls(ctx, '0px');
    frame();
  }
  function drawCrt() {
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);
    ctx.strokeStyle = CRT; ctx.lineWidth = 2; ctx.strokeRect(28, 28, W - 56, H - 56);
    ctx.fillStyle = CRT;
    ctx.font = '22px ' + MONO;
    ls(ctx, '0.22em');
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText('MAXXI // FORGE', 64, 64);
    ctx.textAlign = 'right';
    ctx.fillText('SYS.OK', W - 64, 64);
    ls(ctx, '0px');
    var f = fit(ctx, caption(), ANTON, W - 160, 92, 30, 3);
    ctx.fillStyle = CRT;
    var block = f.size * 0.92 * f.lines.length;
    fillLines(ctx, f, W / 2, (H - block) / 2);
    ctx.save();
    ctx.fillStyle = 'rgba(0,0,0,0.38)';
    var off = reduce ? 0 : state.scan;
    for (var y = off % 4; y < H; y += 4) ctx.fillRect(0, y, W, 2);
    ctx.restore();
    ctx.fillStyle = CRT;
    ctx.font = '18px ' + MONO;
    ctx.textAlign = 'left';
    ctx.fillText('1080×1080  READY', 64, 1008);
    ctx.textAlign = 'right';
    ctx.fillText('↗↗', W - 64, 1008);
  }
  function drawHero() {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    if (heroImg) cover(ctx, heroImg, W, H);
    var g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, 'rgba(5,5,5,.62)');
    g.addColorStop(0.45, 'rgba(5,5,5,.38)');
    g.addColorStop(1, 'rgba(5,5,5,.94)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    kicker(ctx, 'THE MEMETIC WARFARE ENGINE', 72, 72, 'rgba(244,244,240,.85)', 20);
    ctx.fillStyle = INK;
    var f = fit(ctx, caption(), ANTON, W - 144, 88, 32, 3);
    fillLines(ctx, f, 72, 420, 'left', 0.9);
    mark(ctx, 72, 940, 72);
    lockup(ctx, 160, 976, 32);
  }
  function drawList() {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    kicker(ctx, 'THE MAXIMS  ↗', 72, 64, INK, 22);
    var y = 150;
    for (var i = 0; i < LIST.length; i++) {
      ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.strokeRect(72, y + 18, 34, 34);
      ctx.fillStyle = INK;
      ctx.font = '22px ' + ANTON;
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
      ctx.fillText('↗', 89, y + 36);
      ctx.textAlign = 'left'; ctx.textBaseline = 'top';
      ctx.font = '42px ' + ANTON;
      ctx.fillText(LIST[i].t, 128, y);
      ctx.fillStyle = MUT;
      ctx.font = '20px ' + MONO;
      ls(ctx, '0.16em');
      ctx.fillText(LIST[i].n + '  ' + LIST[i].s, 128, y + 54);
      ls(ctx, '0px');
      ctx.fillStyle = LINE; ctx.fillRect(72, y + 108, W - 144, 1);
      y += 140;
    }
    ctx.fillStyle = INK;
    var f = fit(ctx, caption(), ANTON, W - 144, 48, 24, 3);
    fillLines(ctx, f, 72, 760, 'left');
    frame();
  }
  function drawPillar() {
    var p = PILLARS[state.pillar];
    var parts = p.name.split(' ');
    var a = parts[0], b = parts.slice(1).join(' ');
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    kicker(ctx, p.num + '  /  06', 72, 64, FAINT, 22);
    ctx.fillStyle = INK;
    ctx.font = '118px ' + ANTON;
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    ctx.fillText(a, 64, 160);
    var bw = ctx.measureText(b).width;
    var bSize = 118;
    if (bw > W - 128) {
      bSize = Math.max(48, Math.floor(118 * (W - 128) / bw));
      ctx.font = bSize + 'px ' + ANTON;
    }
    ctx.fillText(b, 64, 286);
    ctx.fillStyle = INK; ctx.fillRect(72, 460, 120, 4);
    ctx.fillStyle = INK;
    var f = fit(ctx, p.body, ANTON, W - 144, 54, 26, 3);
    fillLines(ctx, f, 72, 500, 'left');
    mark(ctx, 72, 940, 72);
    lockup(ctx, 160, 976, 32);
    frame();
  }
  function drawStamp() {
    ctx.fillStyle = BG; ctx.fillRect(0, 0, W, H);
    if (!state.photo) {
      ctx.strokeStyle = INK; ctx.lineWidth = 3;
      ctx.setLineDash([22, 16]);
      ctx.strokeRect(80, 80, W - 160, H - 160);
      ctx.setLineDash([]);
      ctx.fillStyle = INK;
      var f = fit(ctx, 'DROP A FACE. STAMP THE MARK.', ANTON, W - 240, 52, 28, 3);
      fillLines(ctx, f, W / 2, 500);
      mark(ctx, (W - 96) / 2, 360, 96);
      frame();
      return;
    }
    ctx.save();
    try { ctx.filter = 'grayscale(1) contrast(1.12)'; } catch (e) {}
    cover(ctx, state.photo, W, H);
    ctx.filter = 'none';
    ctx.restore();
    var g = ctx.createLinearGradient(0, H * 0.5, 0, H);
    g.addColorStop(0, 'rgba(5,5,5,0)');
    g.addColorStop(1, 'rgba(5,5,5,.94)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, 196, 88);
    mark(ctx, 12, 10, 68);
    lockup(ctx, 84, 48, 22);
    ctx.fillStyle = INK;
    var f = fit(ctx, caption(), ANTON, W - 144, 64, 26, 3);
    var block = f.size * 0.92 * f.lines.length;
    fillLines(ctx, f, 72, H - 80 - block, 'left');
  }

  var DRAWS = {
    flag: drawFlag, outline: drawOutline, tape: drawTape, crt: drawCrt,
    hero: drawHero, list: drawList, pillar: drawPillar, stamp: drawStamp
  };

  function draw() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    (DRAWS[state.t] || drawFlag)();
    var label = 'AI/MAXXI meme, ' + state.t.toUpperCase() + ' template, caption ' + caption();
    cv.setAttribute('aria-label', label);
    if (el.sr) el.sr.textContent = caption();
    if (el.x) {
      el.x.href = 'https://twitter.com/intent/tweet?text=' +
        encodeURIComponent(caption() + ' https://aimaxxi.com/#memes ↗↗');
    }
    if (state.t === 'crt' && !reduce && !crtOn) {
      crtOn = true;
      requestAnimationFrame(tickCrt);
    }
    if (state.t !== 'crt') crtOn = false;
  }
  function tickCrt(t) {
    if (!crtOn || state.t !== 'crt' || reduce) { crtOn = false; return; }
    state.scan = (t * 0.05) % 8;
    requestDraw();
    requestAnimationFrame(tickCrt);
  }

  function loadIcon() {
    if (iconImg) return;
    var im = new Image();
    im.onload = function () { iconImg = im; requestDraw(); };
    im.src = 'icon.png';
  }
  function loadHero() {
    if (heroImg) return;
    if (heroWait) return;
    heroWait = true;
    var im = new Image();
    im.onload = function () { heroImg = im; heroWait = false; requestDraw(); };
    im.onerror = function () { heroWait = false; requestDraw(); };
    im.src = 'hero-bg.jpg';
  }
  function loadFonts() {
    if (!document.fonts) return;
    var p = [];
    try {
      p.push(document.fonts.load('80px Anton'));
      p.push(document.fonts.load('24px "Space Mono"'));
      p.push(document.fonts.load('20px Archivo'));
    } catch (e) {}
    var ready = document.fonts.ready ? document.fonts.ready : Promise.all(p);
    ready.then(function () { requestDraw(); }).catch(function () { requestDraw(); });
  }

  function setExportOk(ok, msg) {
    state.exportOk = ok;
    if (el.dl) el.dl.disabled = !ok;
    if (el.share) el.share.disabled = !ok;
    if (el.err) el.err.textContent = ok ? '' : (msg || 'COULD NOT EXPORT — TRY ANOTHER IMAGE');
  }
  function fileName() { return 'aimaxxi-' + state.t + '.png'; }
  function toBlob(fn) {
    try {
      cv.toBlob(function (blob) {
        if (!blob) { setExportOk(false); return; }
        setExportOk(true);
        fn(blob);
      }, 'image/png');
    } catch (e) { setExportOk(false); }
  }
  function downloadBlob(blob) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement('a');
    a.href = url; a.download = fileName();
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 1500);
  }
  function copyCaption(btn) {
    var txt = caption();
    var idle = btn.getAttribute('data-idle') || 'COPY CAPTION';
    var done = function () {
      btn.textContent = 'COPIED ↗';
      clearTimeout(copyTimer);
      copyTimer = setTimeout(function () { btn.textContent = idle; }, 2000);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(done, fallback);
    } else fallback();
    function fallback() {
      var ta = document.createElement('textarea');
      ta.value = txt; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); } catch (e) {}
      document.body.removeChild(ta); done();
    }
  }
  function canShareFiles() {
    if (!navigator.share || !navigator.canShare) return false;
    try {
      var f = new File([new Blob(['x'], { type: 'image/png' })], 'x.png', { type: 'image/png' });
      return navigator.canShare({ files: [f] });
    } catch (e) { return false; }
  }
  function doShare() {
    toBlob(function (blob) {
      var file = new File([blob], fileName(), { type: 'image/png' });
      if (canShareFiles()) {
        navigator.share({ files: [file], title: 'AI/MAXXI', text: caption() }).catch(function (err) {
          if (err && err.name === 'AbortError') return;
          downloadBlob(blob); copyCaption(el.copy);
        });
        return;
      }
      if (navigator.share) {
        navigator.share({ title: 'AI/MAXXI', text: caption() + ' https://aimaxxi.com/#memes' }).catch(function (err) {
          if (err && err.name === 'AbortError') return;
          downloadBlob(blob); copyCaption(el.copy);
        });
        return;
      }
      downloadBlob(blob); copyCaption(el.copy);
    });
  }

  function ingest(file) {
    if (!file || (file.type && file.type.indexOf('image/') !== 0)) return;
    if (state.photo && state.photo.close) { try { state.photo.close(); } catch (e) {} }
    state.photo = null;
    function viaImg() {
      var url = URL.createObjectURL(file);
      var im = new Image();
      im.onload = function () { state.photo = im; URL.revokeObjectURL(url); setExportOk(true); requestDraw(); };
      im.onerror = function () { URL.revokeObjectURL(url); };
      im.src = url;
    }
    if (window.createImageBitmap) {
      createImageBitmap(file).then(function (bmp) {
        state.photo = bmp; setExportOk(true); requestDraw();
      }, viaImg);
    } else viaImg();
  }

  function syncPanes() {
    var isP = state.t === 'pillar', isS = state.t === 'stamp', isC = state.cap === 'custom' && !isP;
    if (el.pillarPane) el.pillarPane.classList.toggle('on', isP);
    if (el.stampPane) el.stampPane.classList.toggle('on', isS);
    if (el.capPane) el.capPane.classList.toggle('on', !isP);
    if (el.customPane) el.customPane.classList.toggle('on', isC);
    if (el.preview) el.preview.classList.toggle('stamp', isS);
    if (state.t === 'hero') loadHero();
  }
  function selectTemplate(id) {
    if (TPL.indexOf(id) < 0) return;
    state.t = id;
    var radios = el.temps ? el.temps.querySelectorAll('input[name="forge-t"]') : [];
    for (var i = 0; i < radios.length; i++) radios[i].checked = radios[i].value === id;
    syncPanes(); requestDraw();
  }
  function applyHash() {
    var h = location.hash || '';
    if (h.indexOf('#memes') !== 0) return;
    var q = h.indexOf('?');
    if (q < 0) return;
    var map = {};
    h.slice(q + 1).split('&').forEach(function (pair) {
      var kv = pair.split('='), k = decodeURIComponent(kv[0] || ''), v = decodeURIComponent(kv[1] || '');
      map[k] = v;
    });
    if (map.t) selectTemplate(String(map.t).toLowerCase());
    if (map.c != null && map.c !== '') {
      var n = parseInt(map.c, 10);
      if (!isNaN(n) && n >= 0 && n < CAPTIONS.length) {
        state.cap = n; if (el.cap) el.cap.value = String(n);
      } else if (n === CAPTIONS.length || String(map.c).toLowerCase() === 'custom') {
        state.cap = 'custom'; if (el.cap) el.cap.value = 'custom';
      }
      syncPanes(); requestDraw();
    }
  }

  if (el.temps) el.temps.addEventListener('change', function (e) {
    if (e.target && e.target.name === 'forge-t') selectTemplate(e.target.value);
  });
  if (el.cap) el.cap.addEventListener('change', function () {
    state.cap = el.cap.value === 'custom' ? 'custom' : parseInt(el.cap.value, 10);
    syncPanes(); requestDraw();
  });
  if (el.custom) el.custom.addEventListener('input', function () {
    state.custom = el.custom.value.slice(0, 96);
    requestDraw();
  });
  if (el.pillars) el.pillars.addEventListener('change', function (e) {
    if (e.target && e.target.name === 'forge-p') {
      var n = parseInt(e.target.value, 10);
      if (!isNaN(n) && n >= 0 && n < PILLARS.length) { state.pillar = n; requestDraw(); }
    }
  });
  if (el.file) el.file.addEventListener('change', function () {
    if (el.file.files && el.file.files[0]) ingest(el.file.files[0]);
  });
  if (el.fileBtn) el.fileBtn.addEventListener('click', function () { el.file && el.file.click(); });
  function bindDrop(node) {
    if (!node) return;
    node.addEventListener('dragover', function (e) {
      if (state.t !== 'stamp') return;
      e.preventDefault(); node.classList.add('is-drop');
    });
    node.addEventListener('dragleave', function () { node.classList.remove('is-drop'); });
    node.addEventListener('drop', function (e) {
      node.classList.remove('is-drop');
      if (state.t !== 'stamp') return;
      e.preventDefault();
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) ingest(f);
    });
  }
  bindDrop(el.preview); bindDrop(el.stampPane);
  if (el.dl) el.dl.addEventListener('click', function () { toBlob(downloadBlob); });
  if (el.share) el.share.addEventListener('click', doShare);
  if (el.copy) {
    el.copy.setAttribute('data-idle', el.copy.textContent);
    el.copy.addEventListener('click', function () { copyCaption(el.copy); });
  }
  if (!navigator.share && el.share) el.share.textContent = 'DOWNLOAD + COPY';

  if (window.matchMedia) {
    var mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    var onMq = function () { reduce = mq.matches; if (reduce) crtOn = false; requestDraw(); };
    if (mq.addEventListener) mq.addEventListener('change', onMq);
    else if (mq.addListener) mq.addListener(onMq);
  }
  window.addEventListener('hashchange', applyHash);

  if (el.wrap && 'IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      if (!es[0] || !es[0].isIntersecting) return;
      io.disconnect(); loadIcon(); loadFonts();
    }, { threshold: 0.12 });
    io.observe(el.wrap);
  } else { loadIcon(); loadFonts(); }

  applyHash();
  syncPanes();
  requestDraw();
})();
