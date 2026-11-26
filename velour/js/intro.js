/* =========================================================================
   Заставка: рисуется кальян → идёт пар (Canvas) → белая дымка заполняет
   экран → рассеивается и открывает сайт.
   Показывается при каждом заходе; повторить — кнопкой в подвале.
   При prefers-reduced-motion — короткая статичная версия без частиц.
   Скорость: меняйте TIMING ниже (миллисекунды).
   ========================================================================= */
(function () {
  const root = document.documentElement;
  const intro = document.getElementById('intro');
  const skipBtn = document.getElementById('introSkip');
  const canvas = intro.querySelector('.intro__smoke');
  const veil = intro.querySelector('.intro__veil');
  const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  const TIMING = {
    smokeStart: 1400,   // кальян дорисован — пошёл пар
    fill: 3100,         // дымка заполняет экран
    clear: 4700,        // дымка рассеивается
    end: 6600,          // заставка убрана
  };

  let timers = [];
  let raf = 0;
  let running = false;
  let ctx, sprite, particles = [], emitting = false, emitter = { x: 0, y: 0 }, last = 0, spawnAcc = 0;
  let maxParticles = 70;

  const at = (ms, fn) => timers.push(setTimeout(fn, ms));
  const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

  function makeSprite() {
    const s = document.createElement('canvas');
    const size = 128;
    s.width = s.height = size;
    const c = s.getContext('2d');
    const g = c.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    g.addColorStop(0, 'rgba(255,255,255,0.9)');
    g.addColorStop(0.4, 'rgba(248,244,238,0.45)');
    g.addColorStop(1, 'rgba(248,244,238,0)');
    c.fillStyle = g;
    c.fillRect(0, 0, size, size);
    return s;
  }

  function setupCanvas() {
    const w = window.innerWidth, h = window.innerHeight;
    const small = w < 720;
    // На телефонах — меньше частиц и без ретина-разрешения: дым мягкий, детали не нужны
    const dpr = small ? 1 : Math.min(window.devicePixelRatio || 1, 1.5);
    maxParticles = small ? 38 : 72;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    sprite = sprite || makeSprite();

    const coals = intro.querySelector('.intro__coals').getBoundingClientRect();
    emitter = { x: coals.left + coals.width / 2, y: coals.top };
    veil.style.setProperty('--vy', emitter.y + 'px');
  }

  function spawn() {
    particles.push({
      x: emitter.x + (Math.random() - 0.5) * 10,
      y: emitter.y,
      vx: (Math.random() - 0.5) * 34,
      vy: -(42 + Math.random() * 52),
      r: 8 + Math.random() * 8,
      gr: 42 + Math.random() * 52,      // скорость роста радиуса
      life: 0,
      ttl: 3 + Math.random() * 1.8,
      a: 0.22 + Math.random() * 0.18,
      seed: Math.random() * 6.28,
    });
  }

  function tick(t) {
    const dt = Math.min(0.05, (t - (last || t)) / 1000);
    last = t;
    const w = canvas.width, h = canvas.height;
    ctx.clearRect(0, 0, w, h);

    if (emitting && particles.length < maxParticles) {
      spawnAcc += dt * (maxParticles / 2.9);
      while (spawnAcc >= 1) { spawn(); spawnAcc -= 1; }
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const p = particles[i];
      p.life += dt;
      if (p.life >= p.ttl) { particles.splice(i, 1); continue; }
      p.x += (p.vx + Math.sin(p.life * 1.6 + p.seed) * 18) * dt;
      p.y += p.vy * dt;
      p.vy *= 0.992;
      p.vx *= 0.995;
      p.r += p.gr * dt;
      const k = p.life / p.ttl;
      ctx.globalAlpha = p.a * Math.sin(Math.PI * k);
      ctx.drawImage(sprite, p.x - p.r, p.y - p.r, p.r * 2, p.r * 2);
    }
    ctx.globalAlpha = 1;
    raf = requestAnimationFrame(tick);
  }

  function play() {
    if (running) return;
    running = true;
    clearTimers();
    root.classList.remove('no-intro');
    root.classList.add('intro-active');
    root.classList.remove('hero-ready');
    intro.className = 'intro';
    void intro.offsetWidth; // перезапуск CSS-анимаций при повторе

    if (reduceMQ.matches) {
      intro.classList.add('is-reduced');
      skipBtn.focus({ preventScroll: true });
      at(1300, () => intro.classList.add('is-filling'));
      at(1800, () => intro.classList.add('is-clearing'));
      at(2400, end);
      return;
    }

    intro.classList.add('is-playing');
    skipBtn.focus({ preventScroll: true });
    setupCanvas();
    particles = []; last = 0; spawnAcc = 0;
    raf = requestAnimationFrame(tick);

    at(TIMING.smokeStart, () => { emitting = true; });
    at(TIMING.fill, () => intro.classList.add('is-filling'));          // пар заполняет экран
    at(TIMING.clear, () => { emitting = false; intro.classList.add('is-clearing'); }); // дымка рассеивается
    at(TIMING.clear + 250, () => root.classList.add('hero-ready'));
    at(TIMING.end, end);
  }

  function skip() {
    if (!running) return;
    clearTimers();
    emitting = false;
    intro.classList.add('is-fast', 'is-filling');
    at(320, () => { intro.classList.add('is-clearing'); root.classList.add('hero-ready'); });
    at(950, end);
  }

  function end() {
    clearTimers();
    cancelAnimationFrame(raf);
    raf = 0;
    particles = [];
    emitting = false;
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    const hadFocus = intro.contains(document.activeElement);
    root.classList.remove('intro-active');
    root.classList.add('no-intro', 'hero-ready');
    intro.className = 'intro';
    running = false;
    if (hadFocus) document.getElementById('heroTitle').focus({ preventScroll: true });
    document.dispatchEvent(new CustomEvent('intro:done'));
  }

  skipBtn.addEventListener('click', skip);
  document.addEventListener('keydown', (e) => {
    if (running && e.key === 'Escape') skip();
  });

  window.VelourIntro = { play, skip, isRunning: () => running };

  if (root.classList.contains('intro-active')) {
    // Запускаем после первой отрисовки, чтобы не задерживать загрузку страницы
    requestAnimationFrame(() => requestAnimationFrame(play));
  } else {
    root.classList.add('hero-ready');
  }
})();
