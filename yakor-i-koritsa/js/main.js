/* =========================================================================
   «Якорь и корица» — взаимодействия. Данные — в js/data.js.
   Заказ демонстрационный: ничего не отправляется и не сохраняется
   (в браузере хранится только состав корзины и отметка о заставке).
   ========================================================================= */
(function () {
  'use strict';

  const CAFE = window.CAFE, MENU = window.MENU, SHOWCASE = window.SHOWCASE, GALLERY = window.GALLERY;
  const root = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => `${n.toLocaleString('ru-RU')} ${CAFE.currency}`;
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ITEMS = new Map();
  MENU.forEach((c) => c.items.forEach((i) => ITEMS.set(i.id, i)));

  /* ---------------------------- Заставка ---------------------------- */
  const intro = $('#intro');
  let timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));
  const clear = () => { timers.forEach(clearTimeout); timers = []; };

  function play() {
    clear();
    root.classList.remove('intro-off', 'ready');
    root.classList.add('intro-on');
    intro.className = 'intro';
    void intro.offsetWidth;
    $('#introSkip').focus({ preventScroll: true });
    at(50, () => intro.classList.add('s1'));     // море и якорь
    at(1350, () => intro.classList.add('s2'));   // луч света
    at(1950, () => intro.classList.add('s3'));   // название и фраза
    at(3300, () => intro.classList.add('s4'));   // поднимается пена
    at(4250, () => { intro.classList.add('s5'); root.classList.add('ready'); }); // пена уходит, видна страница
    at(5300, finish);
  }
  function skip() {
    clear();
    intro.classList.add('s4');
    at(500, () => { intro.classList.add('s5'); root.classList.add('ready'); });
    at(1500, finish);
  }
  function finish() {
    clear();
    const hadFocus = intro.contains(document.activeElement);
    root.classList.remove('intro-on');
    root.classList.add('intro-off', 'ready');
    intro.className = 'intro';
    try { localStorage.setItem('anchor-cinnamon:intro', '1'); } catch (e) { /* приватный режим */ }
    if (hadFocus) $('#heroTitle').focus({ preventScroll: true });
  }
  $('#introSkip').addEventListener('click', skip);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && root.classList.contains('intro-on')) skip(); });
  $('#replayIntro').addEventListener('click', () => { window.scrollTo(0, 0); play(); });
  if (root.classList.contains('intro-on')) requestAnimationFrame(play);
  else requestAnimationFrame(() => root.classList.add('ready'));

  /* ---------------------------- Тексты ---------------------------- */
  $$('[data-cafe]').forEach((el) => { el.textContent = CAFE[el.dataset.cafe]; });
  $$('[data-contact]').forEach((el) => { el.textContent = CAFE.contacts[el.dataset.contact] || ''; });

  /* ---------------------------- Часы ---------------------------- */
  const DAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const mins = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  function hours() {
    const groups = [];
    [1, 2, 3, 4, 5, 6, 0].forEach((d) => {
      const s = CAFE.schedule[d];
      const label = s ? `${s[0]}–${s[1]}` : 'выходной';
      const g = groups[groups.length - 1];
      if (g && g.label === label) g.days.push(d); else groups.push({ label, days: [d] });
    });
    const now = new Date(), d = now.getDay();
    $$('[data-hours]').forEach((dl) => {
      dl.innerHTML = groups.map((g) => {
        const n = g.days.length > 1 ? `${DAYS[g.days[0]]}–${DAYS[g.days[g.days.length - 1]]}` : DAYS[g.days[0]];
        const c = g.days.includes(d) ? ' class="today"' : '';
        return `<dt${c}>${n}</dt><dd${c}>${g.label}</dd>`;
      }).join('');
    });
    const s = CAFE.schedule[d];
    const m = now.getHours() * 60 + now.getMinutes();
    let open = false, state = 'Сегодня выходной';
    if (s) {
      if (m < mins(s[0])) state = `Откроемся в ${s[0]}`;
      else if (m < mins(s[1])) { open = true; state = 'Сейчас открыто'; }
      else state = 'Уже закрыто';
    }
    $$('[data-today]').forEach((el) => { el.textContent = s ? `${s[0]} – ${s[1]}` : '—'; });
    $$('[data-state]').forEach((el) => { el.textContent = state; });
    $$('[data-open-dot]').forEach((el) => el.classList.toggle('open', open));
  }
  hours();
  setInterval(hours, 60000);

  /* ---------------------------- Шапка ---------------------------- */
  const header = $('#header'), burger = $('#burger'), navList = $('#navList');
  const solid = () => header.classList.toggle('solid', window.scrollY > 20);
  let raf = 0;
  window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { solid(); raf = 0; }); }, { passive: true });
  solid();
  function setNav(open) {
    burger.setAttribute('aria-expanded', open);
    $('#burgerText').textContent = open ? 'Закрыть меню' : 'Открыть меню';
    navList.classList.toggle('open', open);
    header.classList.toggle('open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', () => setNav(burger.getAttribute('aria-expanded') !== 'true'));
  navList.addEventListener('click', (e) => { if (e.target.closest('a')) setNav(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { setNav(false); burger.focus(); } });
  window.matchMedia('(min-width: 981px)').addEventListener('change', (e) => { if (e.matches) setNav(false); });

  let reveal = null;
  if ('IntersectionObserver' in window) {
    const links = $$('a', navList);
    const spy = new IntersectionObserver((en) => en.forEach((x) => {
      if (!x.isIntersecting) return;
      links.forEach((a) => { if (a.getAttribute('href') === '#' + x.target.id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    }), { rootMargin: '-45% 0px -50% 0px' });
    ['top', 'story', 'menu', 'showcase', 'gallery', 'contacts'].forEach((id) => spy.observe(document.getElementById(id)));
    reveal = new IntersectionObserver((en) => en.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('in'); reveal.unobserve(x.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .06 });
  }
  const watch = (scope = document) => $$('.reveal:not(.in)', scope).forEach((el) => (reveal ? reveal.observe(el) : el.classList.add('in')));

  /* ---------------------------- Меню ---------------------------- */
  const ICONS = {
    cup: '<path d="M5 9h11v5a5 5 0 0 1-5 5h-1a5 5 0 0 1-5-5Z"/><path d="M16 11h1.5a2.5 2.5 0 0 1 0 5H16"/><path d="M9 3c-1 1.5 1 2.5 0 4M12 3c-1 1.5 1 2.5 0 4"/>',
    sun: '<circle cx="12" cy="14" r="4"/><path d="M3 18h18M12 5v2M5.6 7.6l1.4 1.4M18.4 7.6 17 9M3 14h2M19 14h2"/>',
    roll: '<circle cx="12" cy="12" r="8"/><path d="M12 12c0-1.5 2-1.5 2 0s-1 3-3 3-4-2-4-4 2-5 5-5 6 2.5 6 6"/>',
    plate: '<circle cx="12" cy="13" r="7"/><circle cx="12" cy="13" r="3.5"/><path d="M3 4v5a2 2 0 0 0 2 2V20M21 4c-1.5 1-2 3-2 5v2h2v9"/>',
    cake: '<path d="M4 20V12h16v8Z"/><path d="M4 15c2 1.5 4 1.5 6 0s4-1.5 6 0 4 1.5 4 0"/><path d="M8 12V9M12 12V9M16 12V9M8 6.5v-1M12 6.5v-1M16 6.5v-1"/>',
    glass: '<path d="M6 4h12l-1.5 15a2 2 0 0 1-2 1.8h-5a2 2 0 0 1-2-1.8Z"/><path d="M7 9h10"/><path d="M14 4l2-2"/>',
  };
  const BADGE = {
    sign: '<span class="badge badge--sign" title="Фирменное">★<span class="sr-only"> фирменное</span></span>',
    veg: '<span class="badge badge--veg" title="Вегетарианское">вег<span class="sr-only">етарианское</span></span>',
    new: '<span class="badge badge--new" title="Новинка">new<span class="sr-only">: новинка</span></span>',
  };
  const cats = $('#cats'), panel = $('#menuPanel');
  let cur = -1;
  cats.innerHTML = MENU.map((c) => `<button class="cat" type="button" role="tab" id="cat-${c.id}" aria-controls="menuPanel" aria-selected="false" tabindex="-1">
      <svg viewBox="0 0 24 24" aria-hidden="true">${ICONS[c.icon] || ''}</svg>${esc(c.label)}<small>${c.items.length}</small></button>`).join('');

  const plusBtn = (it) => `<button class="plus" type="button" data-add="${it.id}" aria-label="Добавить в заказ: ${esc(it.name)}, ${money(it.price)}">+</button>`;
  function panelHTML(c) {
    return `<p class="panel__note">${esc(c.note)}</p><ul class="dishes">${c.items.map((it) => `
      <li class="dish${it.photo ? ' has-ph' : ''}">
        ${it.photo ? `<img class="dish__ph" src="${esc(it.photo)}" alt="${esc(it.alt)}" width="120" height="90" loading="lazy" decoding="async">` : ''}
        <div>
          <div class="dish__top"><h3 class="dish__name">${esc(it.name)}${(it.tags || []).map((t) => BADGE[t] || '').join('')}</h3><span class="dish__dots" aria-hidden="true"></span><span class="dish__price">${money(it.price)}</span></div>
          <p class="dish__desc">${esc(it.desc)}</p>
        </div>
        ${plusBtn(it)}
      </li>`).join('')}</ul>`;
  }
  function select(i, focus) {
    const btns = $$('.cat', cats);
    if (i === cur) { if (focus) btns[i].focus(); return; }
    const first = cur === -1;
    cur = i;
    btns.forEach((b, k) => { b.setAttribute('aria-selected', k === i); b.tabIndex = k === i ? 0 : -1; });
    panel.setAttribute('aria-labelledby', btns[i].id);
    if (focus) btns[i].focus({ preventScroll: true });
    const b = btns[i];
    // на телефоне категории — горизонтальная лента: прокручиваем только её
    if (cats.scrollWidth > cats.clientWidth && (b.offsetLeft < cats.scrollLeft || b.offsetLeft + b.offsetWidth > cats.scrollLeft + cats.clientWidth)) {
      cats.scrollTo({ left: Math.max(0, b.offsetLeft - 24), behavior: reduced() ? 'auto' : 'smooth' });
    }
    const draw = () => { panel.innerHTML = panelHTML(MENU[i]); panel.classList.remove('leave'); };
    if (first || reduced()) draw(); else { panel.classList.add('leave'); setTimeout(draw, 200); }
  }
  cats.addEventListener('click', (e) => { const t = e.target.closest('.cat'); if (t) select($$('.cat', cats).indexOf(t), false); });
  cats.addEventListener('keydown', (e) => {
    const n = MENU.length; let i = null;
    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') i = (cur + 1) % n;
    if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') i = (cur - 1 + n) % n;
    if (e.key === 'Home') i = 0;
    if (e.key === 'End') i = n - 1;
    if (i !== null) { e.preventDefault(); select(i, true); }
  });
  select(0, false);

  /* ---------------------------- Витрина дня ---------------------------- */
  $('#shelf').innerHTML = SHOWCASE.map((s, k) => {
    const it = ITEMS.get(s.id);
    return `<article class="item-card reveal" style="transition-delay:${k * 100}ms">
      <div class="item-card__arch">
        <img src="${esc(s.photo)}" alt="${esc(s.alt)}" width="800" height="1000" loading="lazy" decoding="async">
        <span class="item-card__label">${esc(s.label)}</span>
      </div>
      <div class="item-card__body">
        <h3 class="item-card__title">${esc(s.title)}</h3>
        <p class="item-card__text">${esc(s.text)}</p>
        <div class="item-card__foot">
          <span class="price-tag">${money(it.price)}</span>
          <button class="btn btn--sea" type="button" data-add="${it.id}" aria-label="Добавить в заказ: ${esc(it.name)}">В заказ</button>
        </div>
      </div>
    </article>`;
  }).join('');

  /* ---------------------------- Галерея ---------------------------- */
  const GROUP = { outside: 'Снаружи', inside: 'Внутри', details: 'Детали' };
  const masonry = $('#masonry');
  let shown = GALLERY.map((_, i) => i);
  const hint = document.createElement('p');
  hint.className = 'swipe-hint';
  hint.textContent = '← листайте пальцем →';
  masonry.after(hint);

  function drawGallery(filter) {
    shown = GALLERY.map((g, i) => ({ g, i })).filter((x) => filter === 'all' || x.g.group === filter).map((x) => x.i);
    masonry.innerHTML = shown.map((i, k) => {
      const g = GALLERY[i];
      return `<li style="animation-delay:${reduced() ? 0 : k * 60}ms">
        <button class="tile${g.tall ? ' tile--tall' : ''}" type="button" data-gal="${i}" aria-label="Открыть фото: ${esc(g.caption)}">
          <img src="assets/photos/${g.photo}-700.jpg" srcset="assets/photos/${g.photo}-700.jpg 700w, assets/photos/${g.photo}-1400.jpg 1400w"
               sizes="(max-width: 560px) 80vw, (max-width: 900px) 46vw, 31vw" alt="${esc(g.alt)}" loading="lazy" decoding="async">
          <span class="tile__cap"><span class="tile__group">${GROUP[g.group]}</span><b>${esc(g.caption)}</b><span>${esc(g.text)}</span></span>
        </button></li>`;
    }).join('');
    masonry.scrollLeft = 0;
  }
  $('#galFilters').addEventListener('click', (e) => {
    const b = e.target.closest('[data-f]');
    if (!b) return;
    $$('[data-f]').forEach((x) => x.setAttribute('aria-pressed', x === b));
    drawGallery(b.dataset.f);
  });
  drawGallery('all');

  const lb = $('#lightbox');
  let pos = 0;
  function show(p) {
    pos = (p + shown.length) % shown.length;
    const g = GALLERY[shown[pos]];
    const img = $('#lbImg');
    img.src = `assets/photos/${g.photo}-1400.jpg`;
    img.alt = g.alt;
    $('#lbCap').textContent = g.caption;
    $('#lbText').textContent = g.text;
    $('#lbN').textContent = `${GROUP[g.group]} · ${pos + 1} из ${shown.length}`;
  }
  masonry.addEventListener('click', (e) => {
    const b = e.target.closest('[data-gal]');
    if (!b) return;
    show(shown.indexOf(Number(b.dataset.gal)));
    lb.showModal();
    $('[data-lb="close"]', lb).focus();
  });
  lb.addEventListener('click', (e) => {
    const a = e.target.closest('[data-lb]');
    if (a) { if (a.dataset.lb === 'close') lb.close(); if (a.dataset.lb === 'prev') show(pos - 1); if (a.dataset.lb === 'next') show(pos + 1); }
    else if (e.target === lb) lb.close();
  });
  lb.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') show(pos - 1); if (e.key === 'ArrowRight') show(pos + 1); });
  lb.addEventListener('close', () => {
    const b = $(`[data-gal="${shown[pos]}"]`, masonry);
    if (b) { b.focus({ preventScroll: true }); b.scrollIntoView({ block: 'nearest', inline: 'nearest' }); }
  });
  let tx = null;
  lb.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => { if (tx === null) return; const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) show(pos + (dx < 0 ? 1 : -1)); tx = null; });

  watch();

  /* ---------------------------- Корзина ---------------------------- */
  const KEY = 'anchor-cinnamon:cart';
  let cart = (() => {
    try { const c = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(c) ? c.filter((l) => ITEMS.has(l.id) && l.qty > 0) : []; } catch (e) { return []; }
  })();
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(cart)); } catch (e) { /* ignore */ } };
  const count = () => cart.reduce((s, l) => s + l.qty, 0);
  const total = () => cart.reduce((s, l) => s + ITEMS.get(l.id).price * l.qty, 0);
  const drawer = $('#cart');

  function add(id) {
    const l = cart.find((x) => x.id === id);
    if (l) l.qty = Math.min(20, l.qty + 1); else cart.push({ id, qty: 1 });
    save(); renderCart();
    $$('.count').forEach((b) => { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); });
    toast(`«${ITEMS.get(id).name}» — в заказе`);
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-add]');
    if (!a) return;
    add(a.dataset.add);
    if (a.classList.contains('plus')) {
      a.classList.add('ok'); a.textContent = '✓';
      clearTimeout(a._t); a._t = setTimeout(() => { a.classList.remove('ok'); a.textContent = '+'; }, 1200);
    } else {
      const old = a.textContent; a.textContent = 'Добавлено ✓';
      clearTimeout(a._t); a._t = setTimeout(() => { a.textContent = old === 'Добавлено ✓' ? 'В заказ' : old; }, 1200);
    }
  });

  function renderCart() {
    const n = count(), t = money(total());
    $$('[data-cart-count]').forEach((b) => { b.textContent = n; if (b.classList.contains('count')) b.hidden = n === 0; });
    $$('[data-cart-total]').forEach((b) => { b.textContent = t; });
    const fab = $('.fab');
    fab.hidden = n === 0 || drawer.open;
    fab.setAttribute('aria-label', `Открыть заказ: ${n} шт. на ${t}`);
    $('.header__order').setAttribute('aria-label', n ? `Заказать — в корзине ${n} шт. на ${t}` : 'Заказать — корзина пуста');
    $('#empty').hidden = n > 0;
    $('#cartFoot').hidden = n === 0;
    $('#lines').innerHTML = cart.map((l) => {
      const it = ITEMS.get(l.id);
      const ph = it.photo ? `<img class="line__ph" src="${esc(it.photo)}" alt="" width="58" height="58">`
        : '<span class="line__ph line__ph--none" aria-hidden="true"><svg><use href="#anchor"/></svg></span>';
      return `<li class="line" data-id="${it.id}">${ph}
        <div><p class="line__name">${esc(it.name)}</p><p class="line__unit">${money(it.price)} × ${l.qty}</p></div>
        <div class="line__row">
          <div class="line__ctrl">
            <div class="qty" role="group" aria-label="Количество: ${esc(it.name)}">
              <button type="button" data-q="-1" aria-label="Уменьшить: ${esc(it.name)}" ${l.qty <= 1 ? 'disabled' : ''}>−</button>
              <output aria-live="polite">${l.qty}</output>
              <button type="button" data-q="1" aria-label="Увеличить: ${esc(it.name)}" ${l.qty >= 20 ? 'disabled' : ''}>+</button>
            </div>
            <button type="button" class="line__del" data-del aria-label="Удалить из заказа: ${esc(it.name)}">Удалить</button>
          </div>
          <span class="line__sum">${money(it.price * l.qty)}</span>
        </div></li>`;
    }).join('');
  }
  $('#lines').addEventListener('click', (e) => {
    const li = e.target.closest('.line');
    if (!li) return;
    const idx = cart.findIndex((l) => l.id === li.dataset.id);
    const q = e.target.closest('[data-q]');
    if (q) {
      const d = Number(q.dataset.q);
      cart[idx].qty = Math.max(1, Math.min(20, cart[idx].qty + d));
      save(); renderCart();
      const again = $(`.line[data-id="${li.dataset.id}"] [data-q="${d}"]`);
      (again && !again.disabled ? again : $(`.line[data-id="${li.dataset.id}"] [data-q="${-d}"]`)).focus();
      return;
    }
    if (e.target.closest('[data-del]')) {
      const name = ITEMS.get(cart[idx].id).name;
      cart.splice(idx, 1);
      save(); renderCart();
      toast(`«${name}» убрано из заказа`);
      const next = $$('#lines [data-del]')[Math.min(idx, cart.length - 1)];
      (next || $('[data-goto-menu]')).focus();
    }
  });

  let opener = null;
  function view(v) {
    $$('.view', drawer).forEach((x) => { x.hidden = x.dataset.view !== v; });
    $('#cartBack').hidden = v !== 'checkout';
    $('#cartTitle').textContent = { cart: 'Ваш заказ', checkout: 'Оформление', done: 'Готово' }[v];
    drawer.dataset.view = v;
  }
  function openCart() {
    opener = document.activeElement;
    setNav(false);
    view('cart'); renderCart();
    if (!drawer.open) drawer.showModal();
    $('.fab').hidden = true;
    $('#cartTitle').focus();
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-cart]')) openCart();
    if (e.target.closest('[data-goto-menu]')) {
      drawer.close();
      $('#menu').scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
      setTimeout(() => $$('.cat')[cur].focus({ preventScroll: true }), reduced() ? 0 : 600);
    }
  });
  drawer.addEventListener('click', (e) => { if (e.target.closest('[data-close]') || e.target === drawer) drawer.close(); });
  drawer.addEventListener('close', () => {
    if (drawer.dataset.view === 'done') view('cart');
    renderCart();
    if (opener && document.contains(opener) && opener.offsetParent !== null) opener.focus({ preventScroll: true });
  });
  $('#toCheckout').addEventListener('click', () => { view('checkout'); $('#cartTitle').focus(); });
  $('#cartBack').addEventListener('click', () => { view('cart'); $('#cartTitle').focus(); });

  /* ---------------------------- Оформление ---------------------------- */
  const form = $('#orderForm');
  const phoneOk = (v) => { const d = v.replace(/\D/g, ''); return /^380\d{9}$/.test(d) || /^0\d{9}$/.test(d); };
  function check(n) {
    const v = (form.elements[n].value || '').trim();
    if (n === 'name') return !v ? 'Укажите имя — так бариста позовёт вас' : v.length < 2 ? 'Имя слишком короткое' : '';
    if (n === 'phone') return !v ? 'Укажите телефон' : !phoneOk(v) ? 'Проверьте номер, например: +380 67 123 45 67' : '';
    return '';
  }
  function setErr(f, msg) { f.setAttribute('aria-invalid', msg ? 'true' : 'false'); $('#' + f.id + 'Err').textContent = msg; }
  form.addEventListener('input', (e) => { const f = e.target; if (f.getAttribute('aria-invalid') === 'true' && !check(f.name)) setErr(f, ''); });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!cart.length) { view('cart'); return; }
    const errs = ['name', 'phone'].map((n) => { const m = check(n); setErr(form.elements[n], m); return m ? { id: form.elements[n].id, m } : null; }).filter(Boolean);
    const box = $('#errors');
    if (errs.length) {
      box.innerHTML = `<b>Заказ не отправлен — проверьте:</b><ul>${errs.map((x) => `<li><a href="#${x.id}" data-focus="${x.id}">${esc(x.m)}</a></li>`).join('')}</ul>`;
      box.hidden = false; box.focus();
      return;
    }
    box.hidden = true;
    const btn = $('#submitBtn');
    btn.classList.add('busy'); btn.setAttribute('aria-disabled', 'true');
    $('.btn__t', btn).textContent = 'Передаём на камбуз…';
    setTimeout(done, reduced() ? 250 : 1200); // имитация ожидания, без сети
  });
  $('#errors').addEventListener('click', (e) => { const a = e.target.closest('[data-focus]'); if (a) { e.preventDefault(); document.getElementById(a.dataset.focus).focus(); } });

  function done() {
    const fd = new FormData(form);
    const rows = [['Имя', fd.get('name').trim()], ['Телефон', fd.get('phone').trim()]];
    if (fd.get('comment').trim()) rows.push(['Комментарий', fd.get('comment').trim()]);
    $('#doneNum').textContent = 'ЯК-' + String(Math.floor(100 + Math.random() * 900));
    $('#doneSum').innerHTML = `<dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
      <ul>${cart.map((l) => { const it = ITEMS.get(l.id); return `<li><span>${esc(it.name)} × ${l.qty}</span><span>${money(it.price * l.qty)}</span></li>`; }).join('')}
      <li><b>Итого</b><b>${money(total())}</b></li></ul>`;
    // данные никуда не уходят: очищаем форму и корзину
    form.reset();
    $$('[aria-invalid]', form).forEach((f) => f.setAttribute('aria-invalid', 'false'));
    $$('.err', form).forEach((p) => { p.textContent = ''; });
    const btn = $('#submitBtn');
    btn.classList.remove('busy'); btn.removeAttribute('aria-disabled');
    $('.btn__t', btn).textContent = 'Отправить заказ';
    cart = []; save(); renderCart();
    view('done');
    $('#cartTitle').focus();
  }

  /* ---------------------------- Контакты ---------------------------- */
  const SOC = {
    instagram: '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.6"/><circle cx="16.8" cy="7.2" r=".9" fill="currentColor"/>',
    telegram: '<path d="M20 5 3.8 11.3c-.9.4-.9 1.4 0 1.7l4 1.3 1.6 4.8c.2.6 1 .8 1.4.3l2.3-2.3 4.2 3c.6.4 1.4.1 1.5-.6L21 6.1c.2-.8-.4-1.4-1-1.1Z"/>',
    tiktok: '<path d="M14 4v10.5a3.5 3.5 0 1 1-3.5-3.5"/><path d="M14 4c.5 2.5 2.5 4 5 4"/>',
  };
  $('#socials').innerHTML = CAFE.socials.map((s) => {
    const ic = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${SOC[s.id] || ''}</svg>`;
    return s.url
      ? `<a class="social" href="${esc(s.url)}" target="_blank" rel="noopener">${ic}${esc(s.label)}</a>`
      : `<button class="social" type="button" data-demo="${esc(s.label)}">${ic}${esc(s.label)} <small>демо</small></button>`;
  }).join('');
  $('#socials').addEventListener('click', (e) => { const b = e.target.closest('[data-demo]'); if (b) toast(`Демо-ссылка «${b.dataset.demo}»: адрес добавляется в js/data.js`); });
  $$('[data-copy-phone]').forEach((b) => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(CAFE.contacts.phone); toast('Номер скопирован'); }
    catch (e) { toast(`Телефон: ${CAFE.contacts.phone}`); }
  }));

  /* ---------------------------- Тост ---------------------------- */
  let tt;
  function toast(m) {
    const t = $('#toast');
    // если открыта корзина или просмотр фото, показываем подсказку поверх них
    const host = document.querySelector('dialog[open]') || document.body;
    if (t.parentElement !== host) host.appendChild(t);
    t.textContent = m; t.classList.add('on');
    clearTimeout(tt); tt = setTimeout(() => t.classList.remove('on'), 2600);
  }

  renderCart();
})();
