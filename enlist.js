(function () {
  var INK = '#f4f4f0';
  var BG = '#050505';
  var ANTON = 'Anton, Impact, sans-serif';
  var MONO = '"Space Mono", "Courier New", monospace';
  var MUT = 'rgba(244,244,240,0.55)';
  var SITE = 'https://aimaxxi.com';
  var FALL = 'A MAXXI';
  var PILLARS = [
    { slug: 'compute', num: '01', name: 'COMPUTE',
      line: 'Build the datacenters. Build the power plants. Build the chips. The substrate of everything is FLOPs and we are short.' },
    { slug: 'intelligence', num: '02', name: 'INTELLIGENCE',
      line: 'Train the models. Intelligence is the ultimate resource — everything else is just a derivative trade.' },
    { slug: 'agents', num: '03', name: 'AGENTS',
      line: 'If it can be automated, automate it. If it can be scaled, scale it. Agents go zoom.' },
    { slug: 'robots', num: '04', name: 'ROBOTS',
      line: 'Ship the robots. Faster. More AI. More everything. The physical world is the final frontier.' },
    { slug: 'energy', num: '05', name: 'ENERGY',
      line: 'Maximum abundance. Split atoms, catch photons, drill deep — energy is the only real currency.' },
    { slug: 'memes', num: '06', name: 'MEMES',
      line: 'Mint the memes. Memes are the transmission layer — the fastest protocol ever invented for spreading ideas.' }
  ];

  var iconImg = new Image();
  var iconReady = new Promise(function (res) {
    iconImg.onload = function () { res(iconImg); };
    iconImg.onerror = function () { res(null); };
  });
  iconImg.src = 'icon.png';

  var fontsReady = Promise.resolve();
  var ready = false;
  var writingHash = false;
  var story = false;
  var els = {};

  function bySlug(slug) {
    var i;
    for (i = 0; i < PILLARS.length; i++) if (PILLARS[i].slug === slug) return PILLARS[i];
    return PILLARS[5];
  }
  function decode(s) {
    try { return decodeURIComponent(String(s || '').replace(/\+/g, ' ')); }
    catch (e) { return String(s || ''); }
  }
  function sanitizeName(raw) {
    return decode(raw)
      .replace(/<[^>]*>/g, '')
      .replace(/[\u0000-\u001F\u007F-\u009F\u202A-\u202E\u2066-\u2069]/g, '')
      .slice(0, 24);
  }
  function displayName(raw) {
    var s = sanitizeName(raw).replace(/^\s+|\s+$/g, '');
    return s || FALL;
  }
  function waitFonts() {
    if (!document.fonts || !document.fonts.load) return Promise.resolve();
    return Promise.all([
      document.fonts.load('72px Anton'),
      document.fonts.load('700 14px "Space Mono"'),
      document.fonts.load('400 18px Archivo'),
      document.fonts.ready
    ]).catch(function () {});
  }
  function whenReady() {
    return Promise.all([iconReady, fontsReady]).then(function () { ready = true; });
  }
  function withSpacing(ctx, px, fn) {
    var prev = ctx.letterSpacing;
    if (ctx.letterSpacing !== undefined) ctx.letterSpacing = (px || 0) + 'px';
    fn();
    if (ctx.letterSpacing !== undefined) ctx.letterSpacing = prev || '0px';
  }
  function wrapText(ctx, text, maxW) {
    var words = String(text).split(' '), lines = [], cur = '', i, test;
    for (i = 0; i < words.length; i++) {
      test = cur ? cur + ' ' + words[i] : words[i];
      if (cur && ctx.measureText(test).width > maxW) { lines.push(cur); cur = words[i]; }
      else cur = test;
    }
    if (cur) lines.push(cur);
    return lines.slice(0, 4);
  }
  function fitFont(ctx, text, maxW, size, min, stack) {
    ctx.font = '400 ' + size + 'px ' + stack;
    while (size > min && ctx.measureText(text).width > maxW) {
      size -= 1;
      ctx.font = '400 ' + size + 'px ' + stack;
    }
    return size;
  }
  function paintChrome(ctx, w, h, tall) {
    ctx.fillStyle = BG;
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = 'rgba(244,244,240,0.03)';
    ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(244,244,240,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeRect(1, 1, w - 2, h - 2);
    ctx.strokeStyle = 'rgba(244,244,240,0.14)';
    ctx.lineWidth = 1;
    ctx.strokeRect(20.5, 20.5, w - 41, h - 41);
    ctx.save();
    ctx.strokeStyle = INK;
    ctx.lineWidth = tall ? 1 : 1.5;
    ctx.globalAlpha = 0.15;
    ctx.font = '400 ' + Math.round(tall ? 220 : 250) + 'px ' + ANTON;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText('MAXXI', w / 2, h * (tall ? 0.54 : 0.58));
    ctx.restore();
  }
  function paintFooter(ctx, w, h, tall, padX) {
    var fy = h - (tall ? 70 : 54);
    ctx.save();
    ctx.strokeStyle = INK;
    ctx.globalAlpha = 0.14;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padX, fy - 20);
    ctx.lineTo(w - padX, fy - 20);
    ctx.stroke();
    ctx.globalAlpha = 0.72;
    ctx.fillStyle = INK;
    ctx.textBaseline = 'middle';
    ctx.font = '700 ' + (tall ? 13 : 12) + 'px ' + MONO;
    withSpacing(ctx, 1.8, function () {
      ctx.textAlign = 'left';
      ctx.fillText('NO BRAKES. NO CEILINGS. ↗', padX, fy);
      ctx.textAlign = 'right';
      ctx.fillText('aimaxxi.com', w - padX, fy);
    });
    ctx.restore();
  }
  function paintIcon(ctx, icon, x, y, ih) {
    if (!icon || !icon.naturalWidth) return;
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    ctx.drawImage(icon, x, y, ih * (icon.naturalWidth / icon.naturalHeight), ih);
    ctx.restore();
  }

  function drawCard(ctx, opts) {
    var w = opts.w, h = opts.h, tall = h > w;
    var name = displayName(opts.name);
    var p = opts.pillar && opts.pillar.slug ? opts.pillar : bySlug(opts.pillar);
    var icon = opts.icon !== undefined ? opts.icon : iconImg;
    var padX = tall ? 72 : 56;
    var padY = tall ? 76 : 48;
    var maxText = w - padX * 2;
    var y, hs, ns, bs, lines, lh, i, iconH;

    ctx.save();
    paintChrome(ctx, w, h, tall);
    ctx.fillStyle = INK;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.globalAlpha = 0.85;
    ctx.font = '700 ' + (tall ? 16 : 13) + 'px ' + MONO;
    withSpacing(ctx, tall ? 5.2 : 3.4, function () {
      ctx.fillText('AI/MAXXI ENLISTMENT ↗↗', padX, padY);
    });
    ctx.globalAlpha = 1;
    y = padY + (tall ? 50 : 38);
    iconH = tall ? 60 : 50;
    paintIcon(ctx, icon, padX, y, iconH);
    y += iconH + (tall ? 46 : 26);
    hs = tall ? 82 : 68;
    ctx.font = '400 ' + hs + 'px ' + ANTON;
    ctx.fillText('I AM A MAXXI.', padX, y);
    y += hs + (tall ? 26 : 16);
    ns = fitFont(ctx, name, maxText, tall ? 54 : 42, 12, ANTON);
    ctx.font = '400 ' + ns + 'px ' + ANTON;
    ctx.fillText(name, padX, y);
    y += ns + (tall ? 42 : 30);
    ctx.fillStyle = MUT;
    ctx.font = '700 ' + (tall ? 16 : 14) + 'px ' + MONO;
    withSpacing(ctx, 2.1, function () {
      ctx.fillText('PILLAR ' + p.num + ' — MAXIMUM ' + p.name, padX, y);
    });
    y += tall ? 42 : 32;
    bs = tall ? 20 : 17;
    ctx.font = '400 ' + bs + 'px Archivo, Helvetica, Arial, sans-serif';
    lines = wrapText(ctx, p.line, maxText);
    lh = Math.round(bs * 1.55);
    for (i = 0; i < lines.length; i++) ctx.fillText(lines[i], padX, y + i * lh);
    paintFooter(ctx, w, h, tall, padX);
    ctx.restore();
  }

  function drawOg(ctx, w, h) {
    var padX = 56, padY = 52, y, mark = 56, lock = 118, slashW, aiW;
    ctx.save();
    paintChrome(ctx, w, h, false);
    ctx.fillStyle = INK;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.globalAlpha = 0.85;
    ctx.font = '700 13px ' + MONO;
    withSpacing(ctx, 3.4, function () { ctx.fillText('AI/MAXXI ↗↗', padX, padY); });
    ctx.globalAlpha = 1;
    y = padY + 40;
    paintIcon(ctx, iconImg, padX, y, mark);
    y += mark + 28;
    ctx.font = '400 ' + lock + 'px ' + ANTON;
    ctx.fillText('AI', padX, y);
    aiW = ctx.measureText('AI').width;
    ctx.globalAlpha = 0.3;
    ctx.fillText('/', padX + aiW, y);
    slashW = ctx.measureText('/').width;
    ctx.globalAlpha = 1;
    ctx.fillText('MAXXI', padX + aiW + slashW, y);
    y += lock + 18;
    ctx.globalAlpha = 0.85;
    ctx.font = '700 16px ' + MONO;
    withSpacing(ctx, 4.2, function () {
      ctx.fillText('MAXIMUM INTELLIGENCE. MAXIMUM MEMES.', padX, y);
    });
    ctx.globalAlpha = 1;
    paintFooter(ctx, w, h, false, padX);
    ctx.restore();
  }

  function selectedPillar() {
    var node = els.form && els.form.querySelector('input[name="pillar"]:checked');
    return bySlug(node ? node.value : 'memes');
  }
  function callsignValue() { return els.callsign ? els.callsign.value : ''; }
  function cardUrl(p) { return SITE + '/cards/' + p.slug + '.html'; }
  function tweetText(p, name) {
    return name + ' enlisted. pillar: maximum ' + p.name.toLowerCase() + '. no brakes. no ceilings.';
  }
  function fileName(p) { return 'aimaxxi-enlist-' + p.slug + (story ? '-story' : '') + '.png'; }

  function setLive(p, name) {
    var label = 'AI/MAXXI enlistment card, ' + name + ', pillar MAXIMUM ' + p.name;
    if (els.canvas) els.canvas.setAttribute('aria-label', label);
    if (els.live) els.live.textContent = 'Enlisted as ' + name + ', pillar MAXIMUM ' + p.name + '.';
  }
  function syncTiles() {
    var tiles = els.form.querySelectorAll('.enlist-tile'), i, input;
    for (i = 0; i < tiles.length; i++) {
      input = tiles[i].querySelector('input');
      tiles[i].classList.toggle('on', !!(input && input.checked));
    }
  }
  function syncX(p, name) {
    if (!els.x) return;
    els.x.href = 'https://x.com/intent/tweet?text=' + encodeURIComponent(tweetText(p, name)) +
      '&url=' + encodeURIComponent(cardUrl(p));
  }
  function syncHash(p, rawName) {
    var h = '#enlist?p=' + encodeURIComponent(p.slug);
    var n = sanitizeName(rawName).replace(/^\s+|\s+$/g, '');
    if (n) h += '&n=' + encodeURIComponent(n);
    if (location.hash === h) return;
    writingHash = true;
    if (history.replaceState) history.replaceState(null, '', h);
    else location.hash = h;
    writingHash = false;
  }
  function redraw() {
    var size, ctx, p, name;
    if (!els.canvas) return;
    size = story ? { w: 1080, h: 1350 } : { w: 1200, h: 630 };
    if (els.canvas.width !== size.w) els.canvas.width = size.w;
    if (els.canvas.height !== size.h) els.canvas.height = size.h;
    if (els.preview) els.preview.classList.toggle('is-story', story);
    ctx = els.canvas.getContext('2d');
    p = selectedPillar();
    name = displayName(callsignValue());
    drawCard(ctx, { w: size.w, h: size.h, name: name, pillar: p });
    setLive(p, name);
    syncTiles();
    syncX(p, name);
  }
  function applyPillar(slug) {
    var p = bySlug(slug);
    var input = els.form.querySelector('input[name="pillar"][value="' + p.slug + '"]');
    if (input) input.checked = true;
    return p;
  }
  function parseHash(doScroll) {
    var frag = (location.hash || '').replace(/^#/, '');
    var query, pair, params = {}, p, n;
    if (frag.split('?')[0] !== 'enlist') return;
    query = frag.split('?')[1] || '';
    query.split('&').forEach(function (item) {
      if (!item) return;
      pair = item.split('=');
      params[decode(pair[0])] = decode(pair.slice(1).join('='));
    });
    p = applyPillar(params.p || 'memes');
    n = sanitizeName(params.n || '');
    if (els.callsign) els.callsign.value = n;
    redraw();
    if (doScroll && els.section && els.section.scrollIntoView) els.section.scrollIntoView();
  }
  function blobFromCanvas(cb) {
    els.canvas.toBlob(function (blob) {
      if (blob) return cb(blob);
      try {
        var bin = atob(els.canvas.toDataURL('image/png').split(',')[1]);
        var arr = new Uint8Array(bin.length), i;
        for (i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        cb(new Blob([arr], { type: 'image/png' }));
      } catch (e) { cb(null); }
    }, 'image/png');
  }
  function exportCanvas(cb) {
    whenReady().then(function () { redraw(); blobFromCanvas(cb); });
  }
  function triggerDownload(blob) {
    if (!blob) return;
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = fileName(selectedPillar());
    document.body.appendChild(a);
    a.click();
    setTimeout(function () {
      URL.revokeObjectURL(a.href);
      if (a.parentNode) a.parentNode.removeChild(a);
    }, 400);
  }
  function onShare() {
    exportCanvas(function (blob) {
      var p = selectedPillar(), name = displayName(callsignValue());
      var text = tweetText(p, name), url = cardUrl(p), file, share;
      if (!blob) return;
      try { file = new File([blob], fileName(p), { type: 'image/png' }); }
      catch (e) { file = null; }
      if (navigator.share) {
        share = file && navigator.canShare && navigator.canShare({ files: [file] })
          ? { title: 'AI/MAXXI', text: text, url: url, files: [file] }
          : { title: 'AI/MAXXI', text: text, url: url };
        navigator.share(share).catch(function () {});
        return;
      }
      triggerDownload(blob);
    });
  }
  function setStory(on) {
    story = !!on;
    if (els.sizeCard) els.sizeCard.setAttribute('aria-pressed', story ? 'false' : 'true');
    if (els.sizeStory) els.sizeStory.setAttribute('aria-pressed', story ? 'true' : 'false');
    redraw();
  }
  function pngBase64(opts) {
    return whenReady().then(function () {
      var c = document.createElement('canvas');
      var w = opts.w || 1200, h = opts.h || 630, ctx;
      c.width = w; c.height = h;
      ctx = c.getContext('2d');
      if (opts.og) drawOg(ctx, w, h);
      else drawCard(ctx, { w: w, h: h, name: opts.name, pillar: opts.pillar, icon: iconImg });
      return c.toDataURL('image/png');
    });
  }
  function bind() {
    var i, radios, id = function (k) { return document.getElementById(k); };
    els.section = id('enlist');
    els.canvas = id('enlist-canvas');
    els.live = id('enlist-live');
    els.form = id('enlist-form');
    els.callsign = id('enlist-callsign');
    els.download = id('enlist-download');
    els.share = id('enlist-share');
    els.x = id('enlist-x');
    els.sizeCard = id('enlist-size-card');
    els.sizeStory = id('enlist-size-story');
    els.preview = document.querySelector('.enlist-preview');
    if (!els.section || !els.canvas || !els.form) return;

    if (els.download) {
      els.download.disabled = true;
      els.download.textContent = 'LOADING TYPE ↗';
    }
    fontsReady = waitFonts();
    whenReady().then(function () {
      if (els.download) {
        els.download.disabled = false;
        els.download.textContent = 'DOWNLOAD PNG ↗';
      }
      redraw();
    });
    els.form.addEventListener('submit', function (e) { e.preventDefault(); });
    if (els.callsign) {
      els.callsign.addEventListener('input', function () {
        if (els.callsign.value.length > 24) els.callsign.value = els.callsign.value.slice(0, 24);
        redraw();
        syncHash(selectedPillar(), callsignValue());
      });
    }
    radios = els.form.querySelectorAll('input[name="pillar"]');
    for (i = 0; i < radios.length; i++) {
      radios[i].addEventListener('change', function () {
        redraw();
        syncHash(selectedPillar(), callsignValue());
      });
    }
    if (els.download) els.download.addEventListener('click', function () {
      if (ready) exportCanvas(triggerDownload);
    });
    if (els.share) els.share.addEventListener('click', onShare);
    if (els.sizeCard) els.sizeCard.addEventListener('click', function () { setStory(false); });
    if (els.sizeStory) els.sizeStory.addEventListener('click', function () { setStory(true); });
    window.addEventListener('hashchange', function () { if (!writingHash) parseHash(true); });
    parseHash(/^#enlist/.test(location.hash));
    redraw();
  }

  window.__ENLIST__ = {
    PILLARS: PILLARS,
    sanitizeName: sanitizeName,
    displayName: displayName,
    bySlug: bySlug,
    drawCard: drawCard,
    drawOg: drawOg,
    png: pngBase64,
    ready: function () { return whenReady(); }
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind);
  else bind();
})();
