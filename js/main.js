document.addEventListener('DOMContentLoaded', function () {

  /* ---------- Header scroll state ---------- */
  var header = document.querySelector('.site-header');
  function onScroll() {
    if (!header) return;
    if (window.scrollY > 40) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');

    var backTop = document.querySelector('.back-top');
    if (backTop) {
      if (window.scrollY > 500) backTop.classList.add('show');
      else backTop.classList.remove('show');
    }
  }
  window.addEventListener('scroll', onScroll);
  onScroll();

  /* ---------- Mobile nav ---------- */
  var toggle = document.querySelector('.nav-toggle');
  var mobileNav = document.querySelector('.mobile-nav');
  var mobileClose = document.querySelector('.mobile-close');
  if (toggle && mobileNav) {
    toggle.addEventListener('click', function () { mobileNav.classList.add('open'); });
  }
  if (mobileClose && mobileNav) {
    mobileClose.addEventListener('click', function () { mobileNav.classList.remove('open'); });
  }
  document.querySelectorAll('.mobile-nav .has-sub > a').forEach(function (a) {
    a.addEventListener('click', function (e) {
      e.preventDefault();
      var sub = a.parentElement.querySelector('.sub');
      if (sub) sub.classList.toggle('open');
    });
  });

  /* ---------- Hero slider (Cross-fade, 5s auto-advance, keyboard, accessible) ---------- */
  (function initHeroSlider() {
    var slider = document.querySelector('.hero-slider');
    if (!slider) return;

    var slides = slider.querySelectorAll('.hero-slide');
    var prevBtn = slider.querySelector('.hero-arrow-prev');
    var nextBtn = slider.querySelector('.hero-arrow-next');
    var dots = slider.querySelectorAll('.hero-dot');
    var total = slides.length;
    if (total === 0) return;

    var currentIndex = 0;
    var timer = null;
    var INTERVAL = 5000;
    var prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    function showSlide(index) {
      if (index < 0) index = total - 1;
      if (index >= total) index = 0;

      slides.forEach(function (slide, i) {
        if (i === index) {
          slide.classList.add('active');
          slide.setAttribute('aria-hidden', 'false');
        } else {
          slide.classList.remove('active');
          slide.setAttribute('aria-hidden', 'true');
        }
      });

      dots.forEach(function (dot, i) {
        if (i === index) {
          dot.classList.add('active');
          dot.setAttribute('aria-selected', 'true');
        } else {
          dot.classList.remove('active');
          dot.setAttribute('aria-selected', 'false');
        }
      });

      slider.setAttribute('data-active-theme', String(index));
      currentIndex = index;
    }

    function nextSlide() {
      showSlide(currentIndex + 1);
    }

    function prevSlide() {
      showSlide(currentIndex - 1);
    }

    function startAutoPlay() {
      if (prefersReduced) return;
      stopAutoPlay();
      timer = setInterval(nextSlide, INTERVAL);
    }

    function stopAutoPlay() {
      if (timer) {
        clearInterval(timer);
        timer = null;
      }
    }

    // Prev / Next button listeners
    if (prevBtn) {
      prevBtn.addEventListener('click', function () {
        prevSlide();
        startAutoPlay();
      });
    }
    if (nextBtn) {
      nextBtn.addEventListener('click', function () {
        nextSlide();
        startAutoPlay();
      });
    }

    // Pagination dot click listeners
    dots.forEach(function (dot) {
      dot.addEventListener('click', function () {
        var targetIdx = parseInt(dot.getAttribute('data-index'), 10);
        if (!isNaN(targetIdx)) {
          showSlide(targetIdx);
          startAutoPlay();
        }
      });
    });

    // Pause on hover
    slider.addEventListener('mouseenter', stopAutoPlay);
    slider.addEventListener('mouseleave', startAutoPlay);

    // Pause when tab is hidden
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) {
        stopAutoPlay();
      } else {
        startAutoPlay();
      }
    });

    // Keyboard navigation
    slider.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') {
        prevSlide();
        startAutoPlay();
      } else if (e.key === 'ArrowRight') {
        nextSlide();
        startAutoPlay();
      }
    });

    // Initialize slide and auto play
    showSlide(0);
    startAutoPlay();
  })();

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add('in'); });
  }

  /* ---------- Counter animation ---------- */
  var counters = document.querySelectorAll('[data-count]');
  if ('IntersectionObserver' in window && counters.length) {
    var counted = new WeakSet();
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting && !counted.has(entry.target)) {
          counted.add(entry.target);
          animateCount(entry.target);
        }
      });
    }, { threshold: 0.4 });
    counters.forEach(function (el) { cio.observe(el); });
  }
  function animateCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    var duration = 1400;
    var start = null;
    function step(ts) {
      if (!start) start = ts;
      var progress = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - progress, 3);
      var value = Math.floor(eased * target);
      el.textContent = value + suffix;
      if (progress < 1) requestAnimationFrame(step);
      else el.textContent = target + suffix;
    }
    requestAnimationFrame(step);
  }

  /* ---------- FAQ accordion ---------- */
  document.querySelectorAll('.faq-item .faq-q').forEach(function (q) {
    q.addEventListener('click', function () {
      var item = q.closest('.faq-item');
      var wasOpen = item.classList.contains('open');
      document.querySelectorAll('.faq-item.open').forEach(function (o) { o.classList.remove('open'); });
      if (!wasOpen) item.classList.add('open');
    });
  });

  /* ---------- Contact form (demo submit) ---------- */
  var form = document.querySelector('.contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var original = btn.textContent;
      btn.textContent = 'Thank you — we\'ll be in touch shortly!';
      btn.disabled = true;
      setTimeout(function () {
        btn.textContent = original;
        btn.disabled = false;
        form.reset();
      }, 3200);
    });
  }

  /* ---------- Spotlight hover glow ---------- */
  document.querySelectorAll('.spotlight').forEach(function (el) {
    el.addEventListener('mousemove', function (e) {
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      el.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });

  /* ---------- Magnetic buttons ---------- */
  document.querySelectorAll('.btn-magnetic').forEach(function (btn) {
    btn.addEventListener('mousemove', function (e) {
      var r = btn.getBoundingClientRect();
      var x = (e.clientX - r.left - r.width / 2) * 0.25;
      var y = (e.clientY - r.top - r.height / 2) * 0.35;
      btn.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    });
    btn.addEventListener('mouseleave', function () { btn.style.transform = 'translate(0,0)'; });
  });

  /* ---------- Staggered reveal for grids ---------- */
  document.querySelectorAll('.svc-grid, .icon-grid, .value-grid, .team-grid, .testi-track, .case-grid, .stats-grid').forEach(function (grid) {
    Array.prototype.forEach.call(grid.children, function (child, i) {
      if (child.classList.contains('reveal')) {
        child.style.transitionDelay = Math.min(i * 90, 360) + 'ms';
      }
    });
  });

  /* ---------- Hero mouse-follow glow ---------- */
  (function () {
    var stage = document.getElementById('heroSticky');
    var glow = document.getElementById('heroGlow');
    if (!stage || !glow) return;
    if (!window.matchMedia('(pointer: fine)').matches) return;
    stage.addEventListener('mousemove', function (e) {
      var r = stage.getBoundingClientRect();
      glow.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      glow.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  })();

  /* ---------- Hero scroll-driven crossfade (sticky, no page lock) ---------- */
  (function () {
    var hero = document.getElementById('hero');
    var titleGroup = document.getElementById('heroTitleGroup');
    var mark = document.getElementById('heroMark');
    var fill = document.getElementById('heroProgressFill');
    if (!hero || !titleGroup || !mark) return;

    var TITLE_END = 0.45;
    var MARK_START = 0.3;
    var MARK_END = 0.85;

    function clamp(v, min, max) { return Math.min(max, Math.max(min, v)); }

    function heroProgress() {
      var heroHeight = hero.offsetHeight || 1;
      var vh = window.innerHeight || 1;
      var scrollable = Math.max(heroHeight - vh, 1);
      var scrolled = clamp(-hero.getBoundingClientRect().top, 0, scrollable);
      return scrolled / scrollable;
    }

    function update() {
      var progress = heroProgress();

      var t1 = 1 - clamp(progress / TITLE_END, 0, 1);
      titleGroup.style.opacity = String(t1);
      titleGroup.style.transform = 'translateY(' + ((1 - t1) * -22) + 'px) scale(' + (0.97 + t1 * 0.03) + ')';
      titleGroup.style.filter = 'blur(' + ((1 - t1) * 8) + 'px)';

      var t2 = clamp((progress - MARK_START) / (MARK_END - MARK_START), 0, 1);
      mark.style.opacity = String(t2);
      mark.style.transform = 'translateY(' + ((1 - t2) * 16) + 'px)';
      mark.style.filter = 'blur(' + ((1 - t2) * 6) + 'px)';
      mark.style.letterSpacing = ((1 - t2) * 0.18) + 'em';

      if (fill) fill.style.transform = 'scaleX(' + progress + ')';
    }

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    update();
  })();

  /* ---------- Services coverflow carousel (Swiper, faithful to the given spec) ---------- */
  (function () {
    var el = document.querySelector('.svc-swiper');
    if (!el) return;
    if (typeof Swiper === 'undefined') return; // CDN unavailable — rest of page is unaffected

    try {
      new Swiper(el, {
        effect: 'coverflow',
        grabCursor: true,
        centeredSlides: true,
        loop: true,
        slidesPerView: 'auto',
        coverflowEffect: {
          rotate: 40,
          stretch: 0,
          depth: 100,
          modifier: 1,
          slideShadows: true
        },
        pagination: {
          el: '#svcPagination',
          clickable: true
        }
      });
    } catch (err) {
      // Swiper failed to init — slides remain visible as a static row
    }
  })();

  /* ---------- Hero starfield (Three.js, optional & fully guarded) ---------- */
  (function () {
    var hero = document.getElementById('hero');
    var stage = document.getElementById('heroSticky');
    var canvas = document.getElementById('heroCanvas');
    if (!hero || !stage || !canvas) return;
    if (typeof THREE === 'undefined') return; // CDN unavailable — hero still works fine
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    try {
      var width = stage.clientWidth, height = stage.clientHeight;
      if (!width || !height) return;

      var scene = new THREE.Scene();
      var camera = new THREE.PerspectiveCamera(65, width / height, 1, 2000);
      var baseZ = 420;
      camera.position.z = baseZ;
      var targetCameraZ = baseZ;
      var targetCameraY = 0;
      var targetTilt = 0;

      var renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

      // Brand-tinted palette: white, warm gold, soft ice-blue
      var palette = [0xffffff, 0xf0c56a, 0xc7d4f0];
      var groups = [];

      [1, 2, 3].forEach(function (depth) {
        var count = 550;
        var positions = new Float32Array(count * 3);
        var colors = new Float32Array(count * 3);
        for (var i = 0; i < count; i++) {
          var radius = 260 + Math.random() * 640;
          var theta = Math.random() * Math.PI * 2;
          var phi = Math.acos(Math.random() * 2 - 1);
          positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta);
          positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta) * 0.6;
          positions[i * 3 + 2] = radius * Math.cos(phi) - 260;
          var c = new THREE.Color(palette[Math.floor(Math.random() * palette.length)]);
          colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
        }
        var geo = new THREE.BufferGeometry();
        geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        var mat = new THREE.PointsMaterial({
          size: 1.5 + depth * 0.35,
          vertexColors: true,
          transparent: true,
          opacity: 0.8,
          sizeAttenuation: true,
          depthWrite: false
        });
        var points = new THREE.Points(geo, mat);
        scene.add(points);
        groups.push({ points: points, speed: 0.00007 * depth });
      });

      var running = true;
      function animate() {
        if (!running) return;
        groups.forEach(function (g, i) {
          g.points.rotation.y += g.speed * (1 + targetTilt * 0.6);
        });
        // Smoothly ease the camera toward its scroll-driven target — a gentle
        // "flying through the stars" feel as the hero scrolls out of view.
        camera.position.z += (targetCameraZ - camera.position.z) * 0.06;
        camera.position.y += (targetCameraY - camera.position.y) * 0.06;
        renderer.render(scene, camera);
        requestAnimationFrame(animate);
      }
      animate();

      // Pause rendering while the hero is off-screen to save battery/CPU
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (entries) {
          running = entries[0].isIntersecting;
          if (running) animate();
        }, { threshold: 0 }).observe(hero);
      }

      // Scroll-driven parallax: as the sticky hero scrolls through its pinned
      // range, the camera eases closer through the starfield and drifts
      // slightly upward — purely passive, no scroll hijacking.
      function updateScrollTarget() {
        var heroHeight = hero.offsetHeight || 1;
        var vh = window.innerHeight || 1;
        var scrollable = Math.max(heroHeight - vh, 1);
        var scrolled = Math.min(Math.max(-hero.getBoundingClientRect().top, 0), scrollable);
        var progress = scrolled / scrollable;
        targetCameraZ = baseZ - progress * 220;
        targetCameraY = progress * 26;
        targetTilt = progress;
      }
      window.addEventListener('scroll', updateScrollTarget, { passive: true });
      updateScrollTarget();

      window.addEventListener('resize', function () {
        var w = stage.clientWidth, h = stage.clientHeight;
        if (!w || !h) return;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
        updateScrollTarget();
      });
    } catch (err) {
      // WebGL unsupported/blocked — hide the canvas, rest of the hero is unaffected
      canvas.style.display = 'none';
    }
  })();

  /* ---------- Scroll progress bar ---------- */
  (function () {
    var bar = document.querySelector('.scroll-progress');
    if (!bar) return;
    function update() {
      var h = document.documentElement;
      var scrollTop = h.scrollTop || document.body.scrollTop;
      var scrollHeight = (h.scrollHeight || document.body.scrollHeight) - h.clientHeight;
      var pct = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
      bar.style.width = pct + '%';
    }
    window.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    update();
  })();

  /* ---------- Selected work hover preview ---------- */
  (function () {
    var list = document.getElementById('workList');
    var preview = document.getElementById('workPreview');
    if (!list || !preview || !window.matchMedia('(pointer: fine)').matches) return;
    var img = preview.querySelector('img');
    var rows = list.querySelectorAll('.work-row');

    rows.forEach(function (row) {
      row.addEventListener('mouseenter', function () {
        var src = row.getAttribute('data-img');
        if (src) img.src = src;
        preview.classList.add('show');
      });
      row.addEventListener('mouseleave', function () {
        preview.classList.remove('show');
      });
    });
    document.addEventListener('mousemove', function (e) {
      preview.style.left = e.clientX + 'px';
      preview.style.top = e.clientY + 'px';
    });
  })();

  /* ---------- Current year ---------- */
  document.querySelectorAll('.year').forEach(function (el) { el.textContent = new Date().getFullYear(); });
});
