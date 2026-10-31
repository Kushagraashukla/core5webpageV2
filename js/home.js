/* Core5 — homepage interactions. Every block is optional: if its markup is missing it does nothing. */
(function () {
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia('(pointer: fine)').matches;
  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function ease(t) { t = clamp(t, 0, 1); return 1 - Math.pow(1 - t, 3); }
  function easeIO(t) { t = clamp(t, 0, 1); return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function onVisible(el, cb, opts) {
    if (!('IntersectionObserver' in window)) { cb(true); return; }
    new IntersectionObserver(function (es) { es.forEach(function (e) { cb(e.isIntersecting); }); }, opts || { threshold: 0 }).observe(el);
  }
  // Progress (0..1) of a tall section whose sticky child is pinned while it scrolls past
  function pinProgress(section, stage) {
    var r = section.getBoundingClientRect();
    var top = parseFloat(getComputedStyle(stage).top) || 0;
    var span = r.height - stage.offsetHeight;
    return span > 0 ? clamp((top - r.top) / span, 0, 1) : 1;
  }

  /* Shared pointer: normalised -1..1 across the viewport; each scene smooths it separately */
  var pointer = { x: 0, y: 0 };
  if (finePointer && !reduceMotion) {
    window.addEventListener('pointermove', function (e) {
      pointer.x = (e.clientX / window.innerWidth - 0.5) * 2;
      pointer.y = (e.clientY / window.innerHeight - 0.5) * 2;
    }, { passive: true });
  }
  function follower(k) {
    var f = { x: 0, y: 0 };
    f.step = function () { f.x += (pointer.x - f.x) * k; f.y += (pointer.y - f.y) * k; return Math.abs(pointer.x - f.x) + Math.abs(pointer.y - f.y) > 0.001; };
    return f;
  }
  // rAF loop that only runs while `el` is on screen and the tab is visible
  function loopWhileVisible(el, frame) {
    var running = false, visible = false;
    function tick(now) { if (!running) return; frame(now); requestAnimationFrame(tick); }
    function sync() {
      var should = visible && !document.hidden;
      if (should && !running) { running = true; requestAnimationFrame(tick); }
      if (!should) running = false;
    }
    onVisible(el, function (v) { visible = v; sync(); });
    document.addEventListener('visibilitychange', sync);
  }

  /* ============================================================
     00 · EMERGENCE — scroll assembles a radial mechanism inspired by
     the logo's dot emblem, reveals the real logo, then unfolds the
     five architecture layers. Fully reversible; nothing autoplays.
     ============================================================ */
  (function emergence() {
    var section = document.getElementById('emerge');
    var stage = document.getElementById('emergeStage');
    var mech = document.getElementById('emergeMech');
    if (!section || !stage || !mech) return;
    var NS = 'http://www.w3.org/2000/svg';
    function el(tag, attrs, parent) {
      var n = document.createElementNS(NS, tag);
      for (var k in attrs) n.setAttribute(k, attrs[k]);
      if (parent) parent.appendChild(n);
      return n;
    }
    function arc(r, a0, a1) {
      var p = function (a) { a = (a - 90) * Math.PI / 180; return (r * Math.cos(a)).toFixed(1) + ' ' + (r * Math.sin(a)).toFixed(1); };
      return 'M' + p(a0) + ' A' + r + ' ' + r + ' 0 ' + (a1 - a0 > 180 ? 1 : 0) + ' 1 ' + p(a1);
    }

    // --- Concentric rings: each with its own radius, tick rhythm, segments, nodes, direction and speed
    var RINGS = [
      { r: 160, ticks: 48, major: 8, segs: [[12, 74], [196, 236]], nodes: 3, dir: 1, spd: 1.5 },
      { r: 208, ticks: 96, major: 12, segs: [[40, 110], [230, 262], [300, 326]], thin: [[120, 220]], nodes: 4, dir: -1, spd: 1.05, label: 'CLOUD · DATA · AI · SECURITY · APPLICATIONS' },
      { r: 262, ticks: 72, major: 6, segs: [[0, 36], [158, 214]], nodes: 6, dir: 1, spd: .78 },
      { r: 320, ticks: 144, major: 16, segs: [[64, 150], [252, 284]], thin: [[160, 240]], nodes: 5, dir: -1, spd: .56 },
      { r: 382, ticks: 60, major: 10, segs: [[96, 128], [204, 318]], nodes: 8, dir: 1, spd: .4, label: 'RELIABLE · INNOVATIVE · FUTURE READY' },
      { r: 446, ticks: 180, major: 18, segs: [], thin: [[0, 90], [180, 270]], nodes: 12, dir: -1, spd: .26 }
    ];
    var ringRoot = document.getElementById('emergeRings');
    var ringEls = RINGS.map(function (R, idx) {
      var g = el('g', { opacity: 0 }, ringRoot);
      el('circle', { r: R.r, class: 'ring-base' }, g);
      for (var k = 0; k < R.ticks; k++) {
        var a = k / R.ticks * Math.PI * 2, major = k % (R.ticks / R.major) === 0;
        var r1 = R.r + 3, r2 = R.r + (major ? 14 : 6);
        el('line', { x1: (r1 * Math.cos(a)).toFixed(1), y1: (r1 * Math.sin(a)).toFixed(1), x2: (r2 * Math.cos(a)).toFixed(1), y2: (r2 * Math.sin(a)).toFixed(1), class: 'ring-tick' + (major ? ' major' : '') }, g);
      }
      R.segs.forEach(function (s) { el('path', { d: arc(R.r - 7, s[0], s[1]), class: 'ring-seg' }, g); });
      (R.thin || []).forEach(function (s) { el('path', { d: arc(R.r - 14, s[0], s[1]), class: 'ring-seg thin' }, g); });
      for (var n = 0; n < R.nodes; n++) {
        var na = (n / R.nodes * 360 + idx * 17) * Math.PI / 180;
        el('circle', { cx: (R.r * Math.cos(na)).toFixed(1), cy: (R.r * Math.sin(na)).toFixed(1), r: n % 2 ? 3 : 4.5, class: 'ring-node' + (n % 3 === 0 ? ' solid' : '') }, g);
      }
      if (R.label) {
        var id = 'ringPath' + idx;
        el('path', { id: id, d: 'M0 ' + (R.r + 26) + ' A' + (R.r + 26) + ' ' + (R.r + 26) + ' 0 1 1 0.1 ' + (R.r + 26), fill: 'none' }, g);
        var t = el('text', { class: 'ring-label' }, g);
        var tp = el('textPath', { href: '#' + id, startOffset: '6%' }, t);
        tp.textContent = R.label;
      }
      return g;
    });

    // --- The logo's own emblem: 203 dots measured from logo.png, as [x, y, r, gold] around the gold sphere (image px)
    var EMBLEM = [10.6,48.2,3.0,1,-38.4,33.0,2.3,0,-8.8,53.8,4.5,1,-50.4,21.5,2.0,0,-47.0,29.1,2.8,0,-56.7,13.4,2.6,0,-25.0,54.8,5.7,1,-56.7,23.8,3.4,0,36.5,50.0,2.3,1,-62.1,4.9,3.0,0,27.8,55.9,3.1,1,43.4,45.1,1.7,1,17.1,61.7,4.3,1,-65.9,-4.9,3.8,0,-42.9,51.3,6.5,1,-65.5,17.6,3.6,0,2.0,67.9,5.6,1,60.4,31.7,1.8,1,55.6,40.0,2.0,1,50.4,49.8,2.5,1,-69.1,-16.0,4.7,0,-65.5,-27.6,4.1,0,-72.4,9.5,4.1,0,-62.0,-38.7,4.4,0,-16.7,72.5,6.8,1,43.4,60.6,3.0,1,-56.8,-49.5,4.7,0,-61.5,44.8,7.4,1,26.0,-72.0,4.2,0,-49.8,-58.6,4.7,0,41.7,-64.7,4.1,0,11.1,-76.4,4.4,0,-2.3,-77.5,4.4,0,-41.2,-66.0,4.7,0,-15.2,-76.5,4.8,0,-29.4,-72.3,5.0,0,33.1,71.0,3.8,1,58.5,-53.6,4.1,0,-80.2,-0.4,5.1,0,-76.9,-28.1,4.8,0,-38.7,72.8,8.1,1,19.1,81.3,4.8,1,73.2,-41.3,4.2,0,-78.0,34.8,7.4,1,-75.6,-42.8,5.7,0,-86.3,-12.3,5.4,0,81.1,32.3,1.5,0,77.4,40.7,1.0,0,86.4,-25.2,4.1,0,0.8,90.1,6.0,1,68.1,60.5,1.6,0,62.1,-67.3,2.8,0,-62.0,67.7,9.2,1,-70.6,-59.0,6.6,0,47.5,-78.9,3.5,0,29.9,-87.4,4.5,0,11.3,-92.8,5.0,0,-91.0,22.9,7.4,1,64.1,69.0,1.7,0,-8.1,-94.9,5.5,0,-59.8,-74.2,6.8,0,-92.0,-26.0,6.3,0,-27.3,-92.4,6.1,0,-44.9,-85.9,6.8,0,-21.5,95.7,7.0,1,98.6,-6.1,4.3,0,58.1,80.3,2.8,0,86.4,52.7,1.0,0,-101.6,6.9,8.6,1,-85.6,57.3,10.1,1,82.4,63.7,1.0,0,-95.4,-43.6,8.1,0,47.7,93.5,4.0,0,-45.7,97.1,7.7,1,91.3,-60.4,4.0,0,75.9,-78.9,3.6,0,79.5,75.6,2.0,0,37.6,-103.6,5.1,0,58.0,-93.9,4.4,0,-91.7,-63.3,8.8,0,-110.9,-14.0,9.4,1,110.7,16.1,4.7,0,32.1,107.5,5.3,0,15.6,-111.9,5.7,0,75.1,85.7,2.8,0,109.4,-33.8,3.4,0,-107.6,40.3,10.9,1,-6.8,-115.6,6.3,0,106.2,-48.1,3.4,1,-81.9,-83.1,8.5,0,-71.3,93.2,8.3,1,-29.2,-114.2,7.1,0,-50.2,-107.9,7.8,0,-68.5,-97.5,8.2,0,118.3,-18.1,2.6,0,97.5,-69.9,3.4,1,67.6,100.3,4.2,0,-115.2,-38.4,9.2,1,12.3,121.0,7.2,0,122.0,-8.6,1.9,0,59.6,-106.9,3.0,1,118.8,39.5,5.1,0,-124.1,17.6,11.1,1,100.0,76.4,3.7,0,38.2,-120.0,4.7,1,86.7,-93.3,3.8,1,-112.0,-62.1,8.1,1,-98.2,83.7,9.0,1,55.2,117.6,6.2,0,-11.8,130.0,8.8,0,18.9,-132.4,5.8,1,-134.7,-7.6,10.9,1,-104.2,-85.7,7.0,1,72.4,-114.5,3.9,1,91.7,104.1,4.6,0,-5.4,-139.4,6.9,1,-123.3,67.5,9.2,1,-40.3,134.8,10.1,0,36.0,136.7,8.7,0,125.8,66.1,4.5,0,-29.6,-140.0,7.4,1,-139.4,-33.9,10.6,1,56.4,-132.5,3.9,1,-52.7,-135.0,8.2,1,-75.7,-124.4,9.0,1,-99.4,-108.2,11.2,1,-135.4,-61.0,10.2,1,-122.4,-86.1,10.0,1,-143.3,46.6,9.1,1,148.4,-27.9,3.5,1,137.3,-64.1,3.6,1,38.0,-147.1,4.6,1,-72.0,134.1,11.4,0,152.7,9.2,3.4,1,7.9,155.6,10.8,0,122.1,-97.0,3.4,1,71.2,139.3,6.6,0,151.3,43.6,3.4,1,-157.8,22.7,9.5,1,126.5,98.5,4.6,0,13.2,-161.7,5.3,1,101.1,-128.1,3.4,1,-106.0,126.0,12.5,0,-168.2,-4.9,9.7,1,-46.4,-162.0,6.5,1,-28.0,167.1,12.0,0,43.4,164.2,6.7,0,-76.1,-154.4,7.7,1,75.3,-155.5,3.0,1,-18.1,-171.9,5.9,1,114.5,132.0,5.8,0,-171.8,-33.4,9.3,1,-106.1,-139.9,8.6,1,-138.9,109.9,13.4,0,-166.9,-61.9,9.6,1,-133.4,-118.0,9.3,1,-154.3,-90.2,9.8,1,10.1,181.8,6.1,0,-67.4,170.4,13.0,0,44.7,-178.1,3.0,1,-168.2,85.9,13.8,0,93.5,164.4,5.4,0,-28.9,191.5,5.2,0,10.5,-195.4,3.1,1,-57.4,-187.3,5.2,1,-108.7,164.5,13.2,0,-191.1,56.2,13.6,0,62.4,190.4,5.8,0,-91.3,-181.5,6.1,1,-206.4,21.4,13.4,0,-148.7,148.3,13.5,0,-124.8,-168.9,6.7,1,23.1,208.8,6.0,0,-212.9,-16.0,12.6,0,-154.7,-147.3,7.5,1,-180.3,-118.2,8.6,1,-210.1,-53.1,11.7,0,-199.5,-87.4,10.3,0,-20.9,219.3,6.5,0,-186.3,123.9,13.4,0,-74.8,-213.4,2.3,0,-67.4,220.0,7.1,0,-216.7,91.6,12.7,0,-115.1,210.5,8.0,0,-117.6,-209.7,3.0,0,-238.9,51.6,11.8,0,-205.0,-141.5,6.0,0,-161.4,191.4,8.2,0,-251.7,8.5,11.5,0,-228.0,-111.7,8.0,0,-161.8,-197.1,3.5,0,-245.2,-75.1,9.3,0,-254.7,-34.0,10.3,0,-201.4,167.1,7.2,0,-202.4,-176.5,4.1,0,-235.4,136.5,6.7,0,-261.5,100.4,6.8,0,-241.1,-148.8,4.1,0,-282.8,57.6,6.2,0,-268.6,-113.9,4.7,0,-294.6,11.7,5.8,0,-287.0,-76.0,4.8,0,-296.4,-33.5,5.3,0];
    var emblem = document.getElementById('elogoEmblem');
    var dotRoot = document.getElementById('emDots');
    var emCore = document.getElementById('emCore'), emHalo = document.getElementById('emHalo');
    var seed = 5;
    function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }
    var dots = [], N = EMBLEM.length / 4;
    for (var i = 0; i < N; i++) {
      var sa = rnd() * Math.PI * 2, sr = 520 + rnd() * 700;
      dots.push({
        tx: EMBLEM[i * 4], ty: EMBLEM[i * 4 + 1],
        sx: sr * Math.cos(sa), sy: sr * Math.sin(sa),
        n: el('circle', { r: EMBLEM[i * 4 + 2], class: EMBLEM[i * 4 + 3] ? 'dg' : 'dn', opacity: 0 }, dotRoot)
      });
    }
    var halo = document.getElementById('emergeHalo');

    // --- Architecture layers: each plate gets its own line drawing
    var PATTERNS = {
      cloud: function () { var s = ''; for (var r = 0; r < 3; r++) for (var c = 0; c < 3; c++) s += '<rect class="p-box" x="' + (13 + c * 27) + '" y="' + (13 + r * 27) + '" width="20" height="20" rx="1.5"/>'; return s; },
      sec: function () { return '<rect class="p-ln" x="7" y="7" width="86" height="86"/><rect class="p-ln-d" x="19" y="19" width="62" height="62"/><rect class="p-ln-d" x="31" y="31" width="38" height="38"/><circle class="p-node" cx="7" cy="7" r="2.4"/><circle class="p-node" cx="93" cy="7" r="2.4"/><circle class="p-node" cx="93" cy="93" r="2.4"/><circle class="p-node" cx="7" cy="93" r="2.4"/><rect class="p-box" x="44" y="44" width="12" height="12"/>'; },
      data: function () { var s = ''; for (var r = 0; r < 4; r++) { var y = 20 + r * 20; s += '<line class="p-ln-d" x1="8" y1="' + y + '" x2="92" y2="' + y + '"/>'; for (var c = 0; c < 4; c++) s += '<circle class="p-node" cx="' + (16 + c * 22 + (r % 2) * 9) + '" cy="' + y + '" r="' + (c === r ? 2.6 : 1.4) + '"/>'; } return s + '<line class="p-ln" x1="8" y1="50" x2="92" y2="50"/>'; },
      ai: function () { var s = '', pts = []; for (var r = 0; r < 4; r++) for (var c = 0; c < 4; c++) pts.push([20 + c * 20, 20 + r * 20]); pts.forEach(function (a, k) { if (k % 4 < 3) s += '<line class="p-ln-d" x1="' + a[0] + '" y1="' + a[1] + '" x2="' + (a[0] + 20) + '" y2="' + a[1] + '"/>'; if (k < 12) s += '<line class="p-ln-d" x1="' + a[0] + '" y1="' + a[1] + '" x2="' + a[0] + '" y2="' + (a[1] + 20) + '"/>'; }); s += '<path class="p-ln" d="M20 20 L40 40 L60 40 L80 60 M20 80 L40 60 L60 60 L80 80"/>'; pts.forEach(function (a, k) { s += '<circle class="p-node" cx="' + a[0] + '" cy="' + a[1] + '" r="' + ([5, 9, 10, 15].indexOf(k) > -1 ? 3 : 1.6) + '"/>'; }); return s; },
      apps: function () { var s = ''; for (var r = 0; r < 3; r++) for (var c = 0; c < 2; c++) s += '<rect class="p-box" x="' + (12 + c * 42) + '" y="' + (12 + r * 27) + '" width="34" height="21" rx="2"/><line class="p-ln" x1="' + (16 + c * 42) + '" y1="' + (18 + r * 27) + '" x2="' + (30 + c * 42) + '" y2="' + (18 + r * 27) + '"/>'; return s; }
    };
    var layers = Array.prototype.slice.call(document.querySelectorAll('#elayers .elayer'));
    layers.forEach(function (L) { L.innerHTML = '<svg viewBox="0 0 100 100" aria-hidden="true">' + PATTERNS[L.getAttribute('data-k')]() + '</svg>'; });
    var layerBox = document.getElementById('elayers');
    var labels = Array.prototype.slice.call(document.querySelectorAll('#emergeLabels span'));
    var logo = document.getElementById('emergeLogo');
    var plate = document.getElementById('elogoPlate');
    var part = {};
    ['emblem', 'word', 'tag', 'line'].forEach(function (k) { var d = logo.querySelector('.ep-' + k); part[k] = { el: d, img: d.querySelector('img') }; });
    var cue = document.getElementById('emergeCue');
    var fin = document.getElementById('emergeFinal');
    var hud = Array.prototype.slice.call(document.querySelectorAll('#emergeHud li'));
    var bar = document.getElementById('emergeBar');
    function mix(a, b, t) { return a + (b - a) * t; }

    var pv = 0, lastKey = '';
    var mouse = follower(0.07);
    function render(p) {
      var W = stage.clientWidth, H = stage.clientHeight;
      var narrow = W < 700;
      var A = ease((p - 0.03) / 0.27);    // 1 · rings + emblem assemble
      var M = easeIO((p - 0.31) / 0.09);  // emblem slides into its place in the logo
      var Wd = easeIO((p - 0.34) / 0.10); // 2 · CORE5 rises
      var T = easeIO((p - 0.45) / 0.08);  // 3 · TECHNOLOGY PARTNER
      var T2 = easeIO((p - 0.50) / 0.06); //     reliable · innovative · future ready
      var B = easeIO((p - 0.56) / 0.08);  // 4 · white backing
      var X = easeIO((p - 0.67) / 0.21);  // architecture unfolds
      var F = ease((p - 0.89) / 0.08);    // complete world
      var mx = mouse.x, my = mouse.y;

      stage.style.setProperty('--g', (0.22 + 0.78 * A).toFixed(3));
      stage.style.setProperty('--l', (A * 0.95).toFixed(3));
      cue.style.opacity = (1 - clamp(p / 0.035, 0, 1)).toFixed(2);

      // Rings: grow in, keep turning through the whole sequence, then lay down as the floor orbit
      var scale = (0.86 + 0.14 * A) * (1 + (narrow ? 0.5 : 0.32) * X);
      mech.style.transform =
        'translate3d(' + (mx * 30).toFixed(1) + 'px,' + (my * 22 + X * H * (narrow ? 0.2 : 0.22)).toFixed(1) + 'px,0) ' +
        'rotateX(' + (X * 72 - my * 13 * (1 - X * 0.5)).toFixed(2) + 'deg) rotateY(' + (mx * 16 * (1 - X * 0.6)).toFixed(2) + 'deg) scale(' + scale.toFixed(3) + ')';
      ringEls.forEach(function (g, i) {
        var R = RINGS[i];
        var a = ease((p - 0.04 - i * 0.04) / 0.12);
        var ang = R.dir * R.spd * p * 640 + R.dir * mx * 8 * (i + 1);
        g.setAttribute('opacity', (a * (1 - 0.25 * B * (1 - X)) * (1 - 0.4 * X)).toFixed(3));
        g.setAttribute('transform', 'rotate(' + ang.toFixed(2) + ') scale(' + (0.72 + 0.28 * a).toFixed(3) + ')');
      });
      halo.setAttribute('r', (30 + 80 * A + 40 * X).toFixed(1));
      halo.setAttribute('opacity', ((0.35 + 0.65 * A) * (1 - 0.6 * M * (1 - X))).toFixed(2));

      // Logo box (exact logo.png proportions): centred, then lifted above the stack
      var Lw = logo.offsetWidth, Lh = logo.offsetHeight;
      var lm = mix(30, -14, M), lmy = mix(22, -10, M);
      logo.style.transform = 'translate(-50%,-50%) translate3d(' + (mx * lm).toFixed(1) + 'px,' + (my * lmy - X * H * (narrow ? 0.3 : 0.335)).toFixed(1) + 'px,0) scale(' + (1 - (narrow ? 0.35 : 0.52) * X).toFixed(3) + ')';

      // Emblem: starts on the stage centre at the rings' scale, then settles into the logo
      var unit = Math.min(W, H) * 0.86 / 1000;     // px per ring unit
      var k1 = unit * 0.56 / (Lw / 1600);           // stage-1 emblem size relative to its logo size
      var em = 0.92 + 0.08 * A;
      emblem.style.transform = 'translate(' + (0.2738 * Lw * (1 - M)).toFixed(1) + 'px,' + (0.0374 * Lh * (1 - M)).toFixed(1) + 'px) scale(' + (mix(k1, 1, M) * mix(em, 1, M)).toFixed(4) + ')';
      var sp = clamp((p - 0.05) / 0.25, 0, 1);
      var rot = -130 * (1 - ease(sp)) * Math.PI / 180;
      var cr = Math.cos(rot), sr = Math.sin(rot);
      dots.forEach(function (d, k) {
        var t = ease((sp - (k / N) * 0.45) / 0.55);
        var x = d.sx + (d.tx - d.sx) * t, y = d.sy + (d.ty - d.sy) * t;
        d.n.setAttribute('cx', (x * cr - y * sr).toFixed(1));
        d.n.setAttribute('cy', (x * sr + y * cr).toFixed(1));
        d.n.setAttribute('opacity', t.toFixed(3));
      });
      var c0 = ease((p - 0.03) / 0.1);
      emCore.setAttribute('r', (25.25 * c0).toFixed(2));
      emHalo.setAttribute('opacity', (c0 * (1 - B)).toFixed(3));
      // On dark, navy dots are lifted to a readable blue; on the white backing they return to logo navy
      var nb = [109 + (2 - 109) * B, 143 + (24 - 143) * B, 224 + (87 - 224) * B].map(Math.round);
      emblem.style.setProperty('--dn', 'rgb(' + nb.join(',') + ')');
      var swap = clamp((B - 0.55) / 0.4, 0, 1);    // hand over to the exact asset
      emblem.style.opacity = (1 - swap).toFixed(3);
      part.emblem.el.style.opacity = swap.toFixed(3);

      // A soft rim light keeps the navy letters legible on dark until the white backing arrives
      var glow = 1 - B;
      var rim = glow > 0.01 ? 'drop-shadow(0 0 1px rgba(255,255,255,' + (0.9 * glow).toFixed(2) + ')) drop-shadow(0 0 18px rgba(255,255,255,' + (0.28 * glow).toFixed(2) + '))' : 'none';
      // CORE5 rises from below its baseline and attaches to the emblem
      part.word.el.style.opacity = Wd > 0 ? 1 : 0;
      part.word.img.style.transform = 'translate(' + (-(1 - Wd) * 5).toFixed(2) + '%,' + ((1 - Wd) * 48).toFixed(2) + '%)';
      part.word.img.style.filter = rim;
      // Tagline: rules and TECHNOLOGY PARTNER open outward from the centre, then the values line rises
      var cl = 34 + 30.7 * (1 - T), cr2 = 35.3 * (1 - T);
      part.tag.el.style.opacity = T > 0 ? 1 : 0;
      part.tag.el.style.clipPath = 'inset(61% ' + cr2.toFixed(2) + '% 20.9% ' + cl.toFixed(2) + '%)';
      part.tag.img.style.transform = 'translateY(' + ((1 - T) * 6).toFixed(2) + '%)';
      part.line.el.style.opacity = T2.toFixed(3);
      part.line.img.style.transform = 'translateY(' + ((1 - T2) * 9).toFixed(2) + '%)';
      part.line.img.style.filter = rim;
      // White backing: a line of light that opens into the panel
      var bx = ease(B / 0.6), by = 0.03 + 0.97 * easeIO((B - 0.3) / 0.7);
      plate.style.opacity = clamp(B * 3, 0, 1).toFixed(3);
      plate.style.transform = 'scale(' + bx.toFixed(4) + ',' + by.toFixed(4) + ')';

      // Layers rise one after another
      var L = Math.round(clamp(Math.min(W, H) * (narrow ? 0.5 : 0.34), 150, 300));
      layerBox.style.setProperty('--L', L + 'px');
      layerBox.style.transform = 'translateY(' + (narrow ? 2 : 0) + 'vh) rotateX(' + (58 - my * 12).toFixed(2) + 'deg) rotateZ(' + (-45 + mx * 21).toFixed(2) + 'deg)';
      var gap = L * 0.17;
      layers.forEach(function (Ly, i) {
        var lv = ease((p - 0.70 - i * 0.035) / 0.08);
        Ly.style.opacity = lv.toFixed(3);
        Ly.style.transform = 'translateZ(' + (i * gap * lv + (1 - lv) * -60).toFixed(1) + 'px)';
      });
      var sr0 = stage.getBoundingClientRect();
      layers.forEach(function (Ly, i) {
        var lab = labels[i];
        var o = clamp(parseFloat(Ly.style.opacity) * (X > 0.4 ? 1 : 0), 0, 1);
        lab.style.opacity = narrow ? 0 : o.toFixed(3);
        if (o > 0) {
          var rr = Ly.getBoundingClientRect();
          lab.style.transform = 'translate(' + (rr.right - sr0.left + 8).toFixed(0) + 'px,' + (rr.top - sr0.top + rr.height * 0.5 - 8).toFixed(0) + 'px)';
        }
      });

      fin.style.opacity = F.toFixed(3);
      fin.style.transform = 'translateY(' + ((1 - F) * 24).toFixed(1) + 'px)';
      var stageIdx = p < 0.04 ? 0 : p < 0.31 ? 1 : p < 0.66 ? 2 : p < 0.89 ? 3 : 4;
      hud.forEach(function (li, k) { li.classList.toggle('is-on', k === stageIdx); li.classList.toggle('is-done', k < stageIdx); });
      bar.style.transform = 'scaleX(' + p.toFixed(3) + ')';
    }

    if (reduceMotion) {
      section.classList.add('is-static');
      render(1);
      window.addEventListener('resize', function () { render(1); });
      return;
    }
    loopWhileVisible(section, function () {
      var target = pinProgress(section, stage);
      pv += (target - pv) * 0.14; // smooth catch-up keeps fast scrolling fluid in both directions
      if (Math.abs(target - pv) < 0.0005) pv = target;
      var moving = mouse.step();
      var key = pv.toFixed(4) + '|' + mouse.x.toFixed(3) + '|' + mouse.y.toFixed(3) + '|' + stage.clientWidth;
      if (key !== lastKey || moving) { lastKey = key; render(pv); }
    });
    render(0);
  })();

  /* ============================================================
     01 · HERO — original photographs with a wipe transition, HUD
     overlay and layered cursor parallax; messages as tabs
     ============================================================ */
  (function hero() {
    var hero = document.getElementById('hero');
    if (!hero) return;
    var msgs = hero.querySelectorAll('.hero-msg');
    var tabs = hero.querySelectorAll('.hero-tab');
    var shots = hero.querySelectorAll('.hero-shot');
    var reticle = document.getElementById('hudReticle');
    var tag = document.getElementById('hudTag');
    if (!msgs.length || msgs.length !== tabs.length) return;

    // Reticle ticks
    var ticks = reticle && reticle.querySelector('.ticks');
    if (ticks) {
      var s = '';
      for (var k = 0; k < 48; k++) {
        var a = k / 48 * Math.PI * 2, r2 = k % 6 ? 74 : 80;
        s += '<line x1="' + (68 * Math.cos(a)).toFixed(1) + '" y1="' + (68 * Math.sin(a)).toFixed(1) + '" x2="' + (r2 * Math.cos(a)).toFixed(1) + '" y2="' + (r2 * Math.sin(a)).toFixed(1) + '"/>';
      }
      ticks.innerHTML = s;
    }

    // Words rise one by one
    hero.querySelectorAll('[data-split]').forEach(function (title) {
      var n = 0;
      (function wrap(node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (child) {
          if (child.nodeType === 3) {
            var frag = document.createDocumentFragment();
            child.textContent.split(/(\s+)/).forEach(function (part) {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
              var w = document.createElement('span'); w.className = 'w';
              var inner = document.createElement('span'); inner.textContent = part;
              w.style.setProperty('--i', n++);
              w.appendChild(inner); frag.appendChild(w);
            });
            node.replaceChild(frag, child);
          } else if (child.nodeType === 1) wrap(child);
        });
      })(title);
    });

    var current = 0, cleanup = null;
    function show(i, focus) {
      var prev = current;
      current = (i + msgs.length) % msgs.length;
      msgs.forEach(function (m, k) {
        var on = k === current;
        m.classList.toggle('is-active', on);
        m.setAttribute('aria-hidden', String(!on));
        m.querySelectorAll('a').forEach(function (a) { if (on) a.removeAttribute('tabindex'); else a.setAttribute('tabindex', '-1'); });
      });
      tabs.forEach(function (t, k) {
        var on = k === current;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
      });
      if (shots.length && prev !== current) {
        clearTimeout(cleanup);
        shots.forEach(function (sh) { sh.classList.remove('was-active'); });
        shots[prev].classList.remove('is-active');
        shots[prev].classList.add('was-active');
        shots[current].classList.add('is-active');
        cleanup = setTimeout(function () { shots[prev].classList.remove('was-active'); }, 1600);
      }
      if (reticle && shots[current]) {
        var cs = shots[current].style;
        reticle.style.setProperty('--fx', cs.getPropertyValue('--fx'));
        reticle.style.setProperty('--fy', cs.getPropertyValue('--fy'));
      }
      if (tag) tag.textContent = 'FOCUS 0' + (current + 1) + ' — ' + tabs[current].textContent.replace(/^\d+/, '').trim().toUpperCase();
    }
    tabs.forEach(function (t, k) {
      t.addEventListener('click', function () { show(k); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1, true); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); show(current - 1, true); }
      });
    });
    show(0);

    if (reduceMotion) { hero.classList.add('no-auto'); return; }
    hero.querySelector('.hero-tabs').addEventListener('animationend', function (e) {
      if (e.animationName === 'tabFill') show(current + 1);
    });
    hero.addEventListener('pointerenter', function () { hero.classList.add('is-paused'); });
    hero.addEventListener('pointerleave', function () { hero.classList.remove('is-paused'); });
    hero.addEventListener('focusin', function () { hero.classList.add('is-paused'); });
    hero.addEventListener('focusout', function () { hero.classList.remove('is-paused'); });

    // Layered parallax: photo < HUD; copy barely moves so it stays readable
    var media = document.getElementById('heroMedia'), hud = document.getElementById('heroHud'), copy = document.getElementById('heroCopy');
    var m = follower(0.08);
    loopWhileVisible(hero, function () {
      m.step();
      var sy = clamp(-hero.getBoundingClientRect().top, 0, 1200);
      media.style.transform = 'translate3d(' + (m.x * -34).toFixed(1) + 'px,' + (m.y * -24 + sy * 0.22).toFixed(1) + 'px,0) scale(1.06)';
      if (hud) hud.style.transform = 'translate3d(' + (m.x * 50).toFixed(1) + 'px,' + (m.y * 31).toFixed(1) + 'px,0)';
      if (copy) copy.style.transform = 'translate3d(' + (m.x * 10).toFixed(1) + 'px,' + (m.y * 6.5 - sy * 0.08).toFixed(1) + 'px,0)';
    });
  })();

  /* ============================================================
     MANIFESTO — words light up as the paragraph scrolls through
     ============================================================ */
  (function manifesto() {
    var el = document.querySelector('[data-words]');
    if (!el) return;
    var words = [];
    (function wrap(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            var s = document.createElement('span'); s.className = 'mw'; s.textContent = part;
            words.push(s); frag.appendChild(s);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) wrap(child);
      });
    })(el);
    if (reduceMotion) { words.forEach(function (w) { w.classList.add('is-lit'); }); return; }
    var lit = -1, ticking = false;
    function update() {
      ticking = false;
      var r = el.getBoundingClientRect(), vh = window.innerHeight;
      var n = Math.round(clamp((vh * 0.85 - r.top) / (r.height + vh * 0.3), 0, 1) * words.length);
      if (n === lit) return;
      lit = n;
      words.forEach(function (w, i) { w.classList.toggle('is-lit', i < n); });
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  })();

  /* ============================================================
     02 · SERVICES — 3D perspective carousel (drag, arrows, keys)
     ============================================================ */
  (function orbit() {
    var root = document.getElementById('orbit');
    var track = document.getElementById('orbitTrack');
    if (!root || !track) return;
    var cards = Array.prototype.slice.call(track.querySelectorAll('.ocard'));
    var n = cards.length;
    var count = document.getElementById('orbitCount'), fill = document.getElementById('orbitFill');
    var pos = 0;
    function wrapD(d) { return ((d % n) + n + n / 2) % n - n / 2; }
    function cardW() { return cards[0].offsetWidth || 380; }
    function render() {
      var w = cardW();
      cards.forEach(function (c, i) {
        var d = wrapD(i - pos), ad = Math.abs(d), sg = d < 0 ? -1 : 1;
        var x = sg * (ad <= 1 ? ad * 0.8 : 0.8 + (ad - 1) * 0.5) * w;
        var z = -ad * 230;
        var rot = -clamp(d, -1.7, 1.7) * 32;
        var sc = 1 - Math.min(ad, 3) * 0.05;
        c.style.transform = 'translate3d(' + x.toFixed(1) + 'px,0,' + z.toFixed(1) + 'px) rotateY(' + rot.toFixed(2) + 'deg) scale(' + sc.toFixed(3) + ')';
        var op = clamp(1 - (ad - 2.2) * 0.9, 0, 1);
        c.style.opacity = op.toFixed(3);
        c.style.visibility = op <= 0.01 ? 'hidden' : 'visible';
        c.style.zIndex = String(100 - Math.round(ad * 10));
        c.style.setProperty('--shift', (d * -34).toFixed(1) + 'px');
        c.style.setProperty('--tint', (0.12 + Math.min(ad, 2) * 0.2).toFixed(2));
        c.style.setProperty('--bri', (0.92 - Math.min(ad, 2) * 0.2).toFixed(2));
        var active = ad < 0.5;
        c.classList.toggle('is-active', active);
        c.tabIndex = active ? 0 : -1;
        c.setAttribute('aria-hidden', String(!active && ad > 2.5));
      });
      var idx = ((Math.round(pos) % n) + n) % n;
      if (count) count.textContent = String(idx + 1).padStart(2, '0') + ' / ' + n;
      if (fill) { fill.style.left = (idx / n * 100) + '%'; fill.style.width = (100 / n) + '%'; }
    }
    function go(target) { pos = Math.round(target); render(); }
    document.getElementById('orbitPrev').addEventListener('click', function () { go(pos - 1); });
    document.getElementById('orbitNext').addEventListener('click', function () { go(pos + 1); });
    root.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowRight') { e.preventDefault(); go(pos + 1); focusActive(); }
      if (e.key === 'ArrowLeft') { e.preventDefault(); go(pos - 1); focusActive(); }
    });
    function focusActive() { var a = track.querySelector('.ocard.is-active'); if (a) a.focus({ preventScroll: true }); }

    // Drag / swipe
    var startX = 0, startPos = 0, dragging = false, moved = 0, lastX = 0, lastT = 0, vel = 0;
    root.addEventListener('pointerdown', function (e) {
      if (e.button !== 0) return;
      dragging = true; moved = 0; startX = lastX = e.clientX; startPos = pos; lastT = performance.now(); vel = 0;
      root.classList.add('is-drag');
    });
    window.addEventListener('pointermove', function (e) {
      if (!dragging) return;
      var dx = e.clientX - startX; moved = Math.max(moved, Math.abs(dx));
      var now = performance.now();
      vel = (e.clientX - lastX) / Math.max(now - lastT, 1); lastX = e.clientX; lastT = now;
      pos = startPos - dx / (cardW() * 0.8);
      render();
    });
    window.addEventListener('pointerup', function () {
      if (!dragging) return;
      dragging = false; root.classList.remove('is-drag');
      go(pos - clamp(vel * 2.2, -2, 2));
    });
    cards.forEach(function (c, i) {
      c.addEventListener('dragstart', function (e) { e.preventDefault(); });
      c.addEventListener('click', function (e) {
        if (moved > 6) { e.preventDefault(); return; }
        var d = wrapD(i - pos);
        if (Math.abs(d) >= 0.5) { e.preventDefault(); go(pos + d); }
      });
    });

    // Whole carousel tilts toward the cursor
    if (finePointer && !reduceMotion) {
      root.addEventListener('pointermove', function (e) {
        if (dragging) return;
        var r = root.getBoundingClientRect();
        track.style.setProperty('--ty', (((e.clientX - r.left) / r.width - 0.5) * 14).toFixed(2) + 'deg');
        track.style.setProperty('--tx', (((e.clientY - r.top) / r.height - 0.5) * -8).toFixed(2) + 'deg');
      });
      root.addEventListener('pointerleave', function () { track.style.removeProperty('--ty'); track.style.removeProperty('--tx'); });
    }
    window.addEventListener('resize', render);
    render();
  })();

  /* ============================================================
     ISOMETRIC CANVAS ENGINE — shared by the topology and finale scenes
     ============================================================ */
  function makeIso(canvas) {
    var ctx = canvas.getContext('2d');
    var iso = { ctx: ctx, W: 0, H: 0, S: 20, ox: 0, oy: 0, mx: 0, my: 0, shear: 0.3, drift: 0.35 };
    iso.fit = function () {
      var r = canvas.getBoundingClientRect();
      iso.W = r.width; iso.H = r.height;
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    iso.P = function (x, y, z) {
      return [
        iso.ox + (x - y) * iso.S * 0.866 + iso.mx * iso.S * (iso.drift + z * iso.shear),
        iso.oy + (x + y) * iso.S * 0.5 - z * iso.S + iso.my * iso.S * (iso.drift * 0.5 + z * iso.shear * 0.35)
      ];
    };
    iso.poly = function (pts, fill, stroke, lw) {
      ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
      for (var k = 1; k < pts.length; k++) ctx.lineTo(pts[k][0], pts[k][1]);
      ctx.closePath();
      if (fill) { ctx.fillStyle = fill; ctx.fill(); }
      if (stroke) { ctx.lineWidth = lw || 1; ctx.strokeStyle = stroke; ctx.stroke(); }
    };
    iso.line = function (a, b, stroke, lw, dash) {
      ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]);
      ctx.lineWidth = lw || 1; ctx.strokeStyle = stroke;
      if (dash) ctx.setLineDash(dash);
      ctx.stroke();
      if (dash) ctx.setLineDash([]);
    };
    iso.dot = function (p, r, fill) { ctx.beginPath(); ctx.arc(p[0], p[1], r, 0, Math.PI * 2); ctx.fillStyle = fill; ctx.fill(); };
    // Prism from z0 to z0+h over the rectangle (x,y)-(x+w,y+d); only the three visible faces are drawn
    iso.box = function (x, y, w, d, z0, h, o) {
      var P = iso.P, x1 = x + w, y1 = y + d, z1 = z0 + h;
      iso.poly([P(x, y1, z0), P(x1, y1, z0), P(x1, y1, z1), P(x, y1, z1)], o.left || '#0d2558', o.edge || 'rgba(255,255,255,0.08)');
      iso.poly([P(x1, y, z0), P(x1, y1, z0), P(x1, y1, z1), P(x1, y, z1)], o.right || '#091c46', o.edge || 'rgba(255,255,255,0.08)');
      iso.poly([P(x, y, z1), P(x1, y, z1), P(x1, y1, z1), P(x, y1, z1)], o.top || '#14316b', o.topEdge || 'rgba(255,255,255,0.16)', o.lw);
    };
    iso.text = function (s, p, color, size, align) {
      ctx.font = '500 ' + (size || 10) + 'px "JetBrains Mono", ui-monospace, Consolas, monospace';
      ctx.fillStyle = color; ctx.textAlign = align || 'left'; ctx.fillText(s, p[0], p[1]);
    };
    return iso;
  }
  function rng(seed) { return function () { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }; }

  /* ============================================================
     03 · CLOUD TOPOLOGY — pinned; scroll lifts one layer at a time
     ============================================================ */
  (function topology() {
    var section = document.getElementById('topology');
    var canvas = document.getElementById('topoCanvas');
    if (!section || !canvas || !canvas.getContext) return;
    var stage = section.querySelector('.topo-stage');
    var chapters = section.querySelectorAll('.topo-ch');
    var idxBtns = section.querySelectorAll('#topoIndex button');
    var iso = makeIso(canvas);
    var P = iso.P;
    iso.shear = 0.42; iso.drift = 0.58;

    var R = 1.8, NAMES = ['CLOUD INFRASTRUCTURE', 'SECURITY & GOVERNANCE', 'DATA ARCHITECTURE', 'AI / MACHINE LEARNING', 'ENTERPRISE APPLICATIONS'];
    var r = rng(23), racks = [];
    for (var gx = -6; gx <= 5; gx++) for (var gy = -6; gy <= 5; gy++) {
      var cx = gx + 0.5, cy = gy + 0.5, dist = Math.sqrt(cx * cx + cy * cy);
      if (Math.abs(cx) < 3 && Math.abs(cy) < 3) continue;
      if (dist > 6.4 || r() < 0.55) continue;
      racks.push({ x: gx + 0.14, y: gy + 0.14, s: 0.72, h: (0.3 + r() * 1.1) * clamp(1.3 - dist / 7, 0.3, 1), lit: r() < 0.35, seed: r() * 10 });
    }
    racks.sort(function (a, b) { return (a.x + a.y) - (b.x + b.y); });
    var FLOATERS = [{ x: -5.2, y: -0.6, z: 2.8, n: 'MODULE 01' }, { x: 3.4, y: -5.4, z: 3.4, n: 'MODULE 02' }, { x: -1.4, y: 5.0, z: 2.2, n: 'MODULE 03' }];
    var pulses = [];
    for (var k = 0; k < 10; k++) pulses.push({ t: r() * 6, sp: 0.8 + r() * 0.9, a: racks[Math.floor(r() * racks.length)] });
    var lifts = [0, 0, 0, 0, 0];
    var pv = 0, active = 0;
    var mouse = follower(0.06);

    function layout() {
      iso.fit();
      var wide = iso.W > 960;
      iso.S = wide ? Math.min(iso.W / 18, iso.H / 12.5) : Math.min(iso.W / 12, iso.H / 17);
      iso.ox = wide ? iso.W * 0.6 : iso.W * 0.48;
      iso.oy = wide ? iso.H * 0.74 : iso.H * 0.46;
    }

    function plate(i, z, vis, isActive, t) {
      var a = vis * (isActive ? 1 : 0.62), th = 0.14;
      iso.poly([P(-R, R, z - th), P(R, R, z - th), P(R, R, z), P(-R, R, z)], 'rgba(13,37,88,' + (0.95 * a) + ')', 'rgba(255,255,255,' + (0.1 * a) + ')');
      iso.poly([P(R, -R, z - th), P(R, R, z - th), P(R, R, z), P(R, -R, z)], 'rgba(9,28,70,' + (0.95 * a) + ')', 'rgba(255,255,255,' + (0.1 * a) + ')');
      iso.poly([P(-R, -R, z), P(R, -R, z), P(R, R, z), P(-R, R, z)],
        isActive ? 'rgba(24,58,124,' + (0.92 * vis) + ')' : 'rgba(18,44,98,' + (0.8 * a) + ')',
        isActive ? 'rgba(240,176,32,' + (0.95 * vis) + ')' : 'rgba(199,207,227,' + (0.28 * a) + ')', isActive ? 1.6 : 1);
      var gold = 'rgba(240,176,32,' + (0.85 * a) + ')', dim = 'rgba(199,207,227,' + (0.35 * a) + ')';
      if (i === 0) { // compute modules with blinking status lights
        for (var u = -1; u <= 1; u++) for (var v = -1; v <= 1; v++) {
          iso.box(u * 1.05 - 0.36, v * 1.05 - 0.36, 0.72, 0.72, z, 0.22, { top: 'rgba(30,70,150,' + a + ')', left: 'rgba(13,37,88,' + a + ')', right: 'rgba(9,28,70,' + a + ')', edge: 'rgba(255,255,255,' + (0.08 * a) + ')', topEdge: isActive ? gold : dim });
          if (isActive) iso.dot(P(u * 1.05 + 0.36, v * 1.05 - 0.2, z + 0.12), 1.6, 'rgba(240,176,32,' + (0.4 + 0.6 * Math.abs(Math.sin(t / 300 + u * 2 + v))).toFixed(2) + ')');
        }
      } else if (i === 1) { // nested security boundaries with a sweeping scan
        [R + 0.45, R * 0.62, R * 0.3].forEach(function (q, j) {
          iso.ctx.lineDashOffset = j === 0 ? -t / 40 : 0;
          iso.ctx.setLineDash(j === 0 ? [5, 6] : []);
          iso.poly([P(-q, -q, z), P(q, -q, z), P(q, q, z), P(-q, q, z)], null, j === 0 ? gold : dim);
          iso.ctx.setLineDash([]);
        });
        iso.ctx.lineDashOffset = 0;
        [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(function (c) { iso.dot(P(c[0] * (R + 0.45), c[1] * (R + 0.45), z), 3, gold); });
        if (isActive) { var sx = -R + ((t / 1600) % 1) * 2 * R; iso.line(P(sx, -R, z), P(sx, R, z), 'rgba(240,176,32,0.8)', 1.5); }
      } else if (i === 2) { // data lanes with flowing packets
        for (var lane = -1.2; lane <= 1.21; lane += 0.8) {
          iso.line(P(-R, lane, z), P(R, lane, z), dim, 1, [3, 4]);
          for (var q = 0; q < 3; q++) {
            var f = ((t / 2400 + q / 3 + lane) % 1 + 1) % 1;
            iso.dot(P(-R + f * 2 * R, lane, z), isActive ? 2.6 : 1.6, gold);
          }
        }
      } else if (i === 3) { // node lattice with travelling activations
        var pts = [];
        for (var a1 = -1.2; a1 <= 1.21; a1 += 0.8) for (var b1 = -1.2; b1 <= 1.21; b1 += 0.8) pts.push([a1, b1]);
        pts.forEach(function (pt, j) {
          if (j % 4 < 3) iso.line(P(pt[0], pt[1], z), P(pt[0], pt[1] + 0.8, z), dim);
          if (j < 12) iso.line(P(pt[0], pt[1], z), P(pt[0] + 0.8, pt[1], z), dim);
        });
        if (isActive) {
          var hop = Math.floor(t / 260) % pts.length, nx = (hop * 5 + 3) % pts.length;
          iso.line(P(pts[hop][0], pts[hop][1], z), P(pts[nx][0], pts[nx][1], z), 'rgba(240,176,32,0.9)', 1.4);
        }
        pts.forEach(function (pt, j) { iso.dot(P(pt[0], pt[1], z), j % 5 === 0 ? 3.2 : 1.8, j % 5 === 0 ? gold : dim); });
      } else { // application tiles, one lifting
        for (var c2 = 0; c2 < 2; c2++) for (var r2 = 0; r2 < 3; r2++) {
          var lift = isActive && (Math.floor(t / 900) % 6) === c2 * 3 + r2 ? 0.22 : 0;
          iso.box(-1.5 + c2 * 1.6, -1.5 + r2 * 1.05, 1.35, 0.8, z + lift, 0.08, { top: 'rgba(30,70,150,' + a + ')', left: 'rgba(13,37,88,' + a + ')', right: 'rgba(9,28,70,' + a + ')', topEdge: lift ? 'rgba(240,176,32,1)' : (isActive ? gold : dim), edge: 'transparent' });
        }
      }
      // label with leader line
      var k0 = P(R, -R, z);
      if (iso.W > 640 && vis > 0.6) {
        iso.line(k0, [k0[0] + 34, k0[1]], isActive ? 'rgba(240,176,32,0.8)' : 'rgba(199,207,227,0.3)');
        iso.text('L' + (i + 1) + '  ' + NAMES[i], [k0[0] + 42, k0[1] + 3.5], isActive ? 'rgba(240,176,32,' + vis + ')' : 'rgba(199,207,227,' + (0.55 * vis) + ')', isActive ? 11 : 10);
      }
    }

    function draw(t) {
      var ctx = iso.ctx;
      ctx.clearRect(0, 0, iso.W, iso.H);
      // floor grid with coordinates
      for (var i = -7; i <= 7; i++) {
        var al = 0.075 * (1 - Math.abs(i) / 8);
        iso.line(P(i, -7, 0), P(i, 7, 0), 'rgba(199,207,227,' + al.toFixed(3) + ')');
        iso.line(P(-7, i, 0), P(7, i, 0), 'rgba(199,207,227,' + al.toFixed(3) + ')');
        if (i % 2 === 0 && iso.W > 640) {
          iso.text('X' + (i < 0 ? '−' : '+') + Math.abs(i).toString().padStart(2, '0'), P(i, 7.3, 0), 'rgba(199,207,227,0.28)', 9, 'center');
          iso.text('Y' + (i < 0 ? '−' : '+') + Math.abs(i).toString().padStart(2, '0'), P(7.3, i, 0), 'rgba(199,207,227,0.28)', 9, 'center');
        }
      }
      // signals along the floor
      pulses.forEach(function (pu) {
        pu.t += 0.016 * pu.sp;
        var sx = Math.round(pu.a.x), sy = Math.round(pu.a.y), ex = clamp(sx, -2, 2), ey = clamp(sy, -2, 2);
        var l1 = Math.abs(ex - sx), len = l1 + Math.abs(ey - sy);
        if (pu.t > len + 0.6) { pu.t = 0; pu.a = racks[Math.floor(Math.random() * racks.length)]; return; }
        for (var q = 0; q < 6; q++) {
          var d = pu.t - q * 0.09; if (d < 0 || d > len) continue;
          var pt = d <= l1 ? [sx + Math.sign(ex - sx) * d, sy] : [ex, sy + Math.sign(ey - sy) * (d - l1)];
          iso.dot(P(pt[0], pt[1], 0), q ? 1.5 : 2.4, 'rgba(240,176,32,' + (0.9 - q * 0.15) + ')');
        }
      });
      // racks behind the stack
      var ri = 0;
      function rack(b) {
        iso.box(b.x, b.y, b.s, b.s, 0, b.h, { topEdge: b.lit ? 'rgba(240,176,32,0.55)' : 'rgba(255,255,255,0.15)' });
        for (var z = 0.16; z < b.h - 0.06; z += 0.16) {
          iso.line(P(b.x + b.s, b.y + 0.08, z), P(b.x + b.s, b.y + b.s - 0.08, z), 'rgba(255,255,255,0.06)');
          if (b.lit) iso.dot(P(b.x + b.s, b.y + 0.16, z + 0.07), 1.1, 'rgba(240,176,32,' + (0.3 + 0.6 * Math.abs(Math.sin(t / 400 + z * 9 + b.seed))).toFixed(2) + ')');
        }
      }
      for (; ri < racks.length && racks[ri].x + racks[ri].y < -1; ri++) rack(racks[ri]);

      // floor glow under the stack
      var base = P(0, 0, 0);
      var gr = ctx.createRadialGradient(base[0], base[1], 0, base[0], base[1], iso.S * 4);
      gr.addColorStop(0, 'rgba(201,147,42,0.24)'); gr.addColorStop(1, 'rgba(201,147,42,0)');
      ctx.fillStyle = gr; ctx.beginPath(); ctx.ellipse(base[0], base[1], iso.S * 4, iso.S * 2.2, 0, 0, Math.PI * 2); ctx.fill();

      // the stack
      var lp = pv * 5.6 - 0.2;
      var zs = [];
      for (var L = 0; L < 5; L++) {
        lifts[L] += ((L === active ? 0.5 : 0) - lifts[L]) * 0.1;
        var vis = ease(lp - L + 1.2);
        zs.push({ z: 0.4 + L * 1.05 * vis + lifts[L], v: vis });
      }
      // pillars + climbing signals
      [[-R, -R], [R, -R], [R, R], [-R, R]].forEach(function (c, ci) {
        var top = zs[4].v > 0.05 ? zs[4].z : zs[0].z;
        iso.line(P(c[0], c[1], 0), P(c[0], c[1], top), 'rgba(240,176,32,0.32)', 1, [3, 5]);
        var f = ((t / 2600) + ci * 0.25) % 1;
        iso.dot(P(c[0], c[1], f * top), 2.2, 'rgba(240,176,32,' + (1 - f * 0.6).toFixed(2) + ')');
      });
      zs.forEach(function (o, L2) { if (o.v > 0.01) plate(L2, o.z, o.v, L2 === active, t); });

      for (; ri < racks.length; ri++) rack(racks[ri]);

      // floating modules with drop lines
      FLOATERS.forEach(function (f, j) {
        var bob = Math.sin(t / 1400 + j * 2) * 0.12;
        iso.line(P(f.x + 0.3, f.y + 0.3, 0), P(f.x + 0.3, f.y + 0.3, f.z + bob), 'rgba(199,207,227,0.18)', 1, [2, 4]);
        iso.box(f.x, f.y, 0.6, 0.6, f.z + bob, 0.4, { topEdge: 'rgba(240,176,32,0.7)', top: '#183a7c' });
        if (iso.W > 640) iso.text(f.n, P(f.x + 0.9, f.y, f.z + bob + 0.55), 'rgba(199,207,227,0.5)', 9);
      });
    }

    function setActive(a) {
      if (a === active && chapters[a].classList.contains('is-active')) return;
      active = a;
      chapters.forEach(function (c, k) { c.classList.toggle('is-active', k === a); });
      idxBtns.forEach(function (b, k) { b.classList.toggle('is-active', k === a); b.classList.toggle('is-done', k < a); b.setAttribute('aria-pressed', String(k === a)); });
    }
    idxBtns.forEach(function (b, k) {
      b.addEventListener('click', function () {
        var rr = section.getBoundingClientRect();
        var span = section.offsetHeight - stage.offsetHeight;
        var target = (k + 0.2 + 0.5) / 5.6;
        window.scrollTo({ top: window.scrollY + rr.top - (parseFloat(getComputedStyle(stage).top) || 0) + target * span, behavior: reduceMotion ? 'auto' : 'smooth' });
      });
    });

    layout();
    window.addEventListener('resize', function () { layout(); if (reduceMotion) draw(0); });
    if (reduceMotion) {
      section.classList.add('is-static');
      pv = 1; active = 4; lifts[4] = 0.5;
      chapters.forEach(function (c) { c.classList.add('is-active'); });
      layout(); draw(0);
      return;
    }
    setActive(0);
    loopWhileVisible(section, function (now) {
      var target = pinProgress(section, stage);
      pv += (target - pv) * 0.12;
      setActive(clamp(Math.floor(pv * 5.6 - 0.2 + 0.0001), 0, 4));
      mouse.step(); iso.mx = mouse.x; iso.my = mouse.y;
      draw(now);
    });
  })();

  /* ---------- Why section: gentle parallax on the inset image ---------- */
  (function () {
    var sub = document.querySelector('.why-img-sub');
    if (!sub || reduceMotion) return;
    var ticking = false;
    function update() {
      ticking = false;
      var r = sub.getBoundingClientRect();
      sub.style.setProperty('--py', clamp((r.top + r.height / 2 - window.innerHeight / 2) * -0.1, -70, 70).toFixed(1) + 'px');
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
    update();
  })();

  /* ---------- Stories: the photo is revealed around the cursor ---------- */
  (function () {
    if (!finePointer) return;
    document.querySelectorAll('.story').forEach(function (s) {
      s.addEventListener('pointermove', function (e) {
        var r = s.getBoundingClientRect();
        s.style.setProperty('--mx', (e.clientX - r.left) + 'px');
        s.style.setProperty('--my', (e.clientY - r.top) + 'px');
      });
    });
  })();

  /* ---------- Testimonials: tabbed quotes ---------- */
  (function () {
    var tabs = document.querySelectorAll('.testi-tab');
    var quotes = document.querySelectorAll('.testi-quote');
    var num = document.getElementById('testiNum');
    if (!tabs.length || tabs.length !== quotes.length) return;
    var cur = 0;
    function show(i, focus) {
      cur = (i + tabs.length) % tabs.length;
      tabs.forEach(function (t, k) {
        var on = k === cur;
        t.classList.toggle('is-active', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        if (on && focus) t.focus();
      });
      quotes.forEach(function (q, k) { q.classList.toggle('is-active', k === cur); });
      if (num) num.textContent = '0' + (cur + 1);
    }
    tabs.forEach(function (t, k) {
      t.addEventListener('click', function () { show(k); });
      t.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); show(cur + 1, true); }
        if (e.key === 'ArrowLeft') { e.preventDefault(); show(cur - 1, true); }
      });
    });
  })();

  /* ============================================================
     FINALE — a stepped architectural structure rising to a lit core
     ============================================================ */
  (function finale() {
    var canvas = document.getElementById('finaleCanvas');
    if (!canvas || !canvas.getContext) return;
    var section = canvas.closest('section');
    var iso = makeIso(canvas), P = iso.P;
    iso.shear = 0.45; iso.drift = 0.65;
    var r = rng(41), blocks = [];
    for (var x = -5; x <= 4; x++) for (var y = -5; y <= 4; y++) {
      var cx = x + 0.5, cy = y + 0.5, d = Math.max(Math.abs(cx), Math.abs(cy));
      if (d > 4.6 || (d > 3 && r() < 0.35)) continue;
      var core = d < 1;
      blocks.push({ x: x + 0.06, y: y + 0.06, h: core ? 3.6 : Math.max(0.25, (4.8 - d) * 0.62 + (r() - 0.5) * 0.3), d: d, core: core });
    }
    blocks.sort(function (a, b) { return (a.x + a.y) - (b.x + b.y); });
    var started = 0, mouse = follower(0.06), q = 0, baseS = 20;
    var clip = document.getElementById('finaleClip');
    function layout() {
      iso.fit();
      var wide = iso.W > 960;
      baseS = wide ? Math.min(iso.W / 21, iso.H / 15) : Math.min(iso.W / 15, iso.H / 24);
      iso.ox = wide ? iso.W * 0.74 : iso.W * 0.5;
      iso.oy = wide ? iso.H * 0.76 : iso.H * 0.54;
    }
    function draw(now) {
      var ctx = iso.ctx, t = reduceMotion ? 1e5 : now - started;
      iso.S = baseS * (1.05 - 0.09 * q); // the structure recedes slightly as you scroll past: a slow zoom-out
      ctx.clearRect(0, 0, iso.W, iso.H);
      for (var i = -7; i <= 7; i++) {
        var al = 0.06 * (1 - Math.abs(i) / 8);
        iso.line(P(i, -7, 0), P(i, 7, 0), 'rgba(199,207,227,' + al.toFixed(3) + ')');
        iso.line(P(-7, i, 0), P(7, i, 0), 'rgba(199,207,227,' + al.toFixed(3) + ')');
      }
      blocks.forEach(function (b) {
        var g = ease((t - 200 - (4.6 - b.d) * 160) / 1100);
        if (g <= 0) return;
        var h = b.h * g, lvl = clamp(b.h / 3, 0, 1);
        iso.box(b.x, b.y, 0.88, 0.88, 0, h, {
          top: b.core ? '#1c4290' : '#14316b',
          topEdge: 'rgba(240,176,32,' + (b.core ? 1 : 0.15 + lvl * 0.6).toFixed(2) + ')',
          lw: b.core ? 1.6 : 1
        });
      });
      // light from the core
      var c = P(0, 0, 3.6 * ease((t - 400) / 1200));
      var glow = ctx.createRadialGradient(c[0], c[1], 0, c[0], c[1], iso.S * 3.2);
      var pulse = 0.55 + 0.15 * Math.sin(t / 900);
      glow.addColorStop(0, 'rgba(255,214,120,' + pulse.toFixed(2) + ')'); glow.addColorStop(0.25, 'rgba(240,176,32,0.25)'); glow.addColorStop(1, 'rgba(240,176,32,0)');
      ctx.fillStyle = glow; ctx.beginPath(); ctx.arc(c[0], c[1], iso.S * 3.2, 0, Math.PI * 2); ctx.fill();
      // a beam rising from the core
      var beam = ctx.createLinearGradient(c[0], c[1], c[0], c[1] - iso.S * 6);
      beam.addColorStop(0, 'rgba(240,176,32,0.45)'); beam.addColorStop(1, 'rgba(240,176,32,0)');
      ctx.fillStyle = beam; ctx.fillRect(c[0] - 1, c[1] - iso.S * 6, 2, iso.S * 6);
      if (clip) clip.style.setProperty('--hz', (1.05 - 0.09 * q).toFixed(4));
    }

    /* ---- Cosmos: one star field in shared coordinates, drawn into the finale canvas
       and the footer canvas so it carries across the section boundary without a seam */
    var skies = ['finaleSky', 'footerSky'].map(function (id) { var cv = document.getElementById(id); return cv && { cv: cv, ctx: cv.getContext('2d') }; }).filter(Boolean);
    var stars = [], band = null, VW = 0, VH = 0, HF = 0;
    function skyLayout() {
      var top0 = section.getBoundingClientRect().top;
      var dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      skies.forEach(function (s) {
        var r = s.cv.getBoundingClientRect();
        s.off = r.top - top0; s.w = r.width; s.h = r.height;
        s.cv.width = Math.round(r.width * dpr); s.cv.height = Math.round(r.height * dpr);
        s.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        VH = Math.max(VH, s.off + s.h);
      });
      VW = section.clientWidth; HF = section.offsetHeight;
      var rr = rng(7); stars = [];
      var area = VW * VH;
      [[0.25, 4200, 0.35, 0.8, 0.12, 0.38], [0.55, 12000, 0.6, 1.1, 0.2, 0.5], [1, 36000, 0.9, 1.6, 0.3, 0.68]].forEach(function (L) {
        var n = Math.round(area / L[1]);
        for (var i = 0; i < n; i++) stars.push({
          x: rr() * VW, y: rr() * VH, z: L[0],
          r: L[2] + rr() * (L[3] - L[2]), a: L[4] + rr() * (L[5] - L[4]),
          warm: rr() < 0.09, tw: 0.4 + rr() * 1.4, ph: rr() * 6.28
        });
      });
      // Milky-way band: soft dust along a shallow diagonal, pre-rendered once at half resolution
      band = document.createElement('canvas');
      band.width = Math.ceil(VW / 2); band.height = Math.ceil(VH / 2);
      var b = band.getContext('2d'); b.scale(0.5, 0.5);
      var x0 = -0.1 * VW, y0 = HF * 0.92, x1 = 1.1 * VW, y1 = HF * 0.08;
      var dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy), nx = -dy / len, ny = dx / len;
      for (var k = 0; k < 7; k++) {
        var u = 0.1 + k * 0.13 + rr() * 0.05, px = x0 + dx * u, py = y0 + dy * u, rad = VW * (0.12 + rr() * 0.08);
        var g = b.createRadialGradient(px, py, 0, px, py, rad);
        g.addColorStop(0, k === 4 ? 'rgba(240,176,32,0.045)' : 'rgba(76,108,190,0.075)'); g.addColorStop(1, 'rgba(76,108,190,0)');
        b.fillStyle = g; b.fillRect(px - rad, py - rad, rad * 2, rad * 2);
      }
      for (var j = 0; j < 2600; j++) {
        var uu = rr(), vv = ((rr() + rr() + rr()) / 3 - 0.5) * VW * 0.3;
        b.fillStyle = 'rgba(205,215,245,' + (0.03 + rr() * 0.09).toFixed(3) + ')';
        b.fillRect(x0 + dx * uu + nx * vv, y0 + dy * uu + ny * vv, 1.2, 1.2);
      }
    }
    function drawSky(now) {
      if (!skies.length) return;
      var t = now / 1000, mx = mouse.x, my = mouse.y;
      var vpx = VW * 0.72, vpy = HF * 0.74;
      skies.forEach(function (s) {
        var ctx = s.ctx;
        ctx.clearRect(0, 0, s.w, s.h);
        // band = deepest layer
        var bs = 1 + 0.1 * (1 - q), bdx = mx * 10, bdy = (q - 0.5) * HF * 0.16 + my * 7;
        ctx.globalAlpha = 1;
        ctx.drawImage(band, vpx - vpx * bs + bdx, vpy - vpy * bs + bdy - s.off, VW * bs, VH * bs);
        // atmosphere straddling the section boundary, so the light carries into the footer
        var gx = VW * 0.62 + mx * 14, gy = HF - s.off, gr = Math.max(VW * 0.6, 520);
        var ag = ctx.createRadialGradient(gx, gy, 0, gx, gy, gr);
        ag.addColorStop(0, 'rgba(24,58,128,0.42)'); ag.addColorStop(0.45, 'rgba(18,48,105,0.18)'); ag.addColorStop(1, 'rgba(18,48,105,0)');
        ctx.fillStyle = ag; ctx.fillRect(0, 0, s.w, s.h);
        stars.forEach(function (st) {
          var sc = 1 + 0.16 * st.z * (1 - q);                       // zooming out: nearer stars travel further
          var x = vpx + (st.x - vpx) * sc + mx * (8 + 30 * st.z);
          var y = vpy + (st.y - vpy) * sc + (q - 0.5) * HF * 0.2 * (1 - st.z * 0.75) + my * (6 + 20 * st.z) - s.off;
          if (y < -4 || y > s.h + 4 || x < -4 || x > s.w + 4) return;
          var a = st.a * (st.z > 0.3 ? 0.78 + 0.22 * Math.sin(t * st.tw + st.ph) : 1);
          ctx.fillStyle = st.warm ? 'rgba(255,214,150,' + a.toFixed(3) + ')' : 'rgba(214,224,255,' + a.toFixed(3) + ')';
          ctx.beginPath(); ctx.arc(x, y, st.r, 0, 6.2832); ctx.fill();
          if (st.z === 1) { ctx.fillStyle = 'rgba(214,224,255,' + (a * 0.08).toFixed(3) + ')'; ctx.beginPath(); ctx.arc(x, y, st.r * 4, 0, 6.2832); ctx.fill(); }
        });
      });
    }
    function progress() {
      var r = section.getBoundingClientRect(), vh = window.innerHeight;
      q = clamp((vh - r.top) / (vh + r.height), 0, 1);
    }

    layout(); skyLayout(); progress();
    var footer = document.getElementById('footerSky');
    var footEl = footer && footer.parentNode;
    var sound = footEl && footEl.querySelector('.footer-statement p');
    function riseStatement() {
      if (!sound) return;
      var r = sound.getBoundingClientRect(), vh = window.innerHeight;
      sound.style.setProperty('--rise', (0.18 + 0.82 * ease((vh - r.top) / (vh * 0.55))).toFixed(3));
    }
    window.addEventListener('resize', function () { layout(); skyLayout(); progress(); if (reduceMotion) { draw(0); drawSky(0); } });
    if (reduceMotion) { draw(0); drawSky(0); return; }
    onVisible(section, function (v) { if (v && !started) started = performance.now(); });
    var last = -1;
    function frame(now) {
      if (now === last) return; // finale and footer loops can share a frame
      last = now;
      if (!started) started = now;
      mouse.step(); iso.mx = mouse.x; iso.my = mouse.y;
      progress(); riseStatement();
      if (section.getBoundingClientRect().bottom > 0) draw(now);
      drawSky(now);
    }
    loopWhileVisible(section, frame);
    if (footEl) loopWhileVisible(footEl, frame);
  })();
})();
