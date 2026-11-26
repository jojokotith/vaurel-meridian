/* =========================================================================
   «Латунный якорь» — взаимодействия. Данные — в js/data.js.
   Заказ демонстрационный: ничего не отправляется и не сохраняется
   (в браузере хранится только состав корзины).
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
  const pad = (n) => String(n).padStart(2, '0');
  const ITEMS = new Map();
  MENU.forEach((c) => c.items.forEach((i) => ITEMS.set(i.id, i)));

  /* ---------------------------- Заставка ---------------------------- */
  const intro = $('#intro');
  const INTRO_KEY = 'brass-anchor:intro-seen';
  let introTimers = [];
  const later = (ms, fn) => introTimers.push(setTimeout(fn, ms));

  function playIntro() {
    introTimers.forEach(clearTimeout); introTimers = [];
    root.classList.remove('intro-off', 'ready');
    root.classList.add('intro-on');
    intro.className = 'intro';
    void intro.offsetWidth;
    $('#introSkip').focus({ preventScroll: true });
    later(60, () => intro.classList.add('is-go'));        // проявляется якорь
    later(1300, () => intro.classList.add('is-lit'));     // на него падает луч
    later(1900, () => intro.classList.add('is-named'));   // название и фраза
    later(3200, () => intro.classList.add('is-foam'));    // морская пена
    later(3800, () => { intro.classList.add('is-out'); root.classList.add('ready'); });
    later(4700, finishIntro);
  }
  function skipIntro() {
    introTimers.forEach(clearTimeout); introTimers = [];
    intro.classList.add('is-go', 'is-named', 'is-foam');
    later(250, () => { intro.classList.add('is-out'); root.classList.add('ready'); });
    later(1000, finishIntro);
  }
  function finishIntro() {
    introTimers.forEach(clearTimeout); introTimers = [];
    const hadFocus = intro.contains(document.activeElement);
    root.classList.remove('intro-on');
    root.classList.add('intro-off', 'ready');
    intro.className = 'intro';
    try { localStorage.setItem(INTRO_KEY, '1'); } catch (e) { /* приватный режим */ }
    if (hadFocus) $('#heroTitle').focus({ preventScroll: true });
  }
  $('#introSkip').addEventListener('click', skipIntro);
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && root.classList.contains('intro-on')) skipIntro(); });
  $('#replayIntro').addEventListener('click', () => { window.scrollTo(0, 0); playIntro(); });
  if (root.classList.contains('intro-on')) requestAnimationFrame(playIntro);
  else requestAnimationFrame(() => root.classList.add('ready'));

  /* ---------------------------- Тексты ---------------------------- */
  $$('[data-cafe]').forEach((el) => { el.textContent = CAFE[el.dataset.cafe]; });
  $$('[data-contact]').forEach((el) => { el.textContent = CAFE.contacts[el.dataset.contact] || ''; });

  /* ---------------------------- Часы работы ---------------------------- */
  const DAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  function renderHours() {
    const groups = [];
    [1, 2, 3, 4, 5, 6, 0].forEach((d) => {
      const s = CAFE.schedule[d];
      const label = s ? `${s[0]}–${s[1]}` : 'выходной';
      const g = groups[groups.length - 1];
      if (g && g.label === label) g.days.push(d); else groups.push({ label, days: [d] });
    });
    const now = new Date(), today = now.getDay();
    $$('[data-hours]').forEach((dl) => {
      dl.innerHTML = groups.map((g) => {
        const n = g.days.length > 1 ? `${DAYS[g.days[0]]}–${DAYS[g.days[g.days.length - 1]]}` : DAYS[g.days[0]];
        const c = g.days.includes(today) ? ' class="today"' : '';
        return `<dt${c}>${n}</dt><dd${c}>${g.label}</dd>`;
      }).join('');
    });
    const s = CAFE.schedule[today];
    const m = now.getHours() * 60 + now.getMinutes();
    let open = false, text = 'Сегодня выходной';
    if (s) {
      if (m < toMin(s[0])) text = `Сегодня откроемся в ${s[0]}`;
      else if (m < toMin(s[1])) { open = true; text = `Открыто до ${s[1]} — заходите`; }
      else text = `Уже закрыто · завтра с ${(CAFE.schedule[(today + 1) % 7] || ['—'])[0]}`;
    }
    $$('[data-today]').forEach((el) => { el.textContent = text; });
    $$('[data-open-dot]').forEach((el) => el.classList.toggle('is-open', open));
  }
  renderHours();
  setInterval(renderHours, 60000);

  /* ---------------------------- Шапка ---------------------------- */
  const header = $('#header'), burger = $('#burger'), navList = $('#navList');
  const solid = () => header.classList.toggle('is-solid', window.scrollY > 30);
  let raf = 0;
  window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { solid(); raf = 0; }); }, { passive: true });
  solid();
  function setNav(open) {
    burger.setAttribute('aria-expanded', open);
    $('#burgerText').textContent = open ? 'Закрыть меню' : 'Открыть меню';
    navList.classList.toggle('is-open', open);
    header.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', () => setNav(burger.getAttribute('aria-expanded') !== 'true'));
  navList.addEventListener('click', (e) => { if (e.target.closest('a')) setNav(false); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { setNav(false); burger.focus(); } });
  window.matchMedia('(min-width: 1021px)').addEventListener('change', (e) => { if (e.matches) setNav(false); });

  if ('IntersectionObserver' in window) {
    const links = $$('a', navList);
    const spy = new IntersectionObserver((en) => en.forEach((x) => {
      if (!x.isIntersecting) return;
      links.forEach((a) => { if (a.getAttribute('href') === '#' + x.target.id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    }), { rootMargin: '-45% 0px -50% 0px' });
    ['top', 'story', 'menu', 'showcase', 'gallery', 'contacts'].forEach((id) => spy.observe(document.getElementById(id)));
    const rv = new IntersectionObserver((en) => en.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('in'); rv.unobserve(x.target); } }), { rootMargin: '0px 0px -8% 0px', threshold: .06 });
    $$('.reveal').forEach((el) => rv.observe(el));
  } else $$('.reveal').forEach((el) => el.classList.add('in'));

  /* ---------------------------- Меню ---------------------------- */
  const tabs = $('#tabs'), panel = $('#menuPanel');
  let cur = -1;
  const MARK = {
    sign: '<span class="mark mark--sign" title="Фирменное">★<span class="sr-only"> фирменное</span></span>',
    veg: '<span class="mark mark--veg" title="Вегетарианское">V<span class="sr-only">: вегетарианское</span></span>',
    new: '<span class="mark mark--new" title="Новинка">new<span class="sr-only">: новинка</span></span>',
  };
  tabs.innerHTML = MENU.map((c, i) => `<button class="tab" type="button" role="tab" id="tab-${c.id}" aria-controls="menuPanel" aria-selected="false" tabindex="-1">
      <small>${esc(c.sign)}</small><span>${esc(c.label)}</span></button>`).join('');

  const addBtn = (id, name) => `<button class="add" type="button" data-add="${id}" aria-label="Добавить в заказ: ${esc(name)}"><span class="add__plus" aria-hidden="true">+</span><span class="add__t">В заказ</span></button>`;

  function panelHTML(c) {
    return `<p class="menu__note">${esc(c.note)}</p><ul class="items">${c.items.map((it) => `
      <li class="item${it.photo ? '' : ' no-ph'}">
        ${it.photo ? `<img class="item__ph" src="${esc(it.photo)}" alt="${esc(it.alt || it.name)}" width="72" height="72" loading="lazy" decoding="async">` : ''}
        <div>
          <h3 class="item__name">${esc(it.name)}${(it.tags || []).map((t) => MARK[t] || '').join('')}</h3>
          <p class="item__desc">${esc(it.desc)}</p>
        </div>
        <div class="item__side"><span class="price">${money(it.price)}</span>${addBtn(it.id, it.name)}</div>
      </li>`).join('')}</ul>`;
  }
  function selectTab(i, focus) {
    const btns = $$('.tab', tabs);
    if (i === cur) { if (focus) btns[i].focus(); return; }
    const first = cur === -1;
    cur = i;
    btns.forEach((b, k) => { b.setAttribute('aria-selected', k === i); b.tabIndex = k === i ? 0 : -1; });
    panel.setAttribute('aria-labelledby', btns[i].id);
    if (focus) btns[i].focus({ preventScroll: true });
    // прокручиваем только строку вкладок, не страницу
    const b = btns[i];
    if (b.offsetLeft < tabs.scrollLeft || b.offsetLeft + b.offsetWidth > tabs.scrollLeft + tabs.clientWidth) {
      tabs.scrollTo({ left: Math.max(0, b.offsetLeft - 20), behavior: reduced() ? 'auto' : 'smooth' });
    }
    const draw = () => { panel.innerHTML = panelHTML(MENU[i]); panel.classList.remove('out'); };
    if (first || reduced()) draw(); else { panel.classList.add('out'); setTimeout(draw, 200); }
  }
  tabs.addEventListener('click', (e) => { const t = e.target.closest('.tab'); if (t) selectTab($$('.tab', tabs).indexOf(t), false); });
  tabs.addEventListener('keydown', (e) => {
    const n = MENU.length; let i = null;
    if (e.key === 'ArrowRight') i = (cur + 1) % n;
    if (e.key === 'ArrowLeft') i = (cur - 1 + n) % n;
    if (e.key === 'Home') i = 0;
    if (e.key === 'End') i = n - 1;
    if (i !== null) { e.preventDefault(); selectTab(i, true); }
  });
  selectTab(0, false);

  /* ---------------------------- Витрина дня ---------------------------- */
  $('#showGrid').innerHTML = SHOWCASE.map((s, i) => {
    const it = ITEMS.get(s.id);
    return `<article class="show reveal" style="transition-delay:${i * 90}ms">
      <img src="${esc(s.photo)}" alt="${esc(s.alt)}" loading="lazy" decoding="async">
      <div class="show__body">
        <span class="show__label">${esc(s.label)}</span>
        <h3 class="show__title">${esc(s.title)}</h3>
        <p class="show__text">${esc(s.text)}</p>
        <div class="show__row"><span class="price">${money(it.price)}</span>${addBtn(it.id, it.name)}</div>
      </div>
    </article>`;
  }).join('');
  if ('IntersectionObserver' in window) {
    const rv2 = new IntersectionObserver((en) => en.forEach((x) => { if (x.isIntersecting) { x.target.classList.add('in'); rv2.unobserve(x.target); } }), { threshold: .1 });
    $$('#showGrid .reveal').forEach((el) => rv2.observe(el));
  }

  /* ---------------------------- Галерея ---------------------------- */
  const gal = $('#gal');
  gal.innerHTML = GALLERY.map((g, i) => `<li>
      <button class="gal__btn" type="button" data-gal="${i}" aria-label="Открыть фото: ${esc(g.caption)}">
        <img src="assets/photos/${g.photo}-700.jpg" srcset="assets/photos/${g.photo}-700.jpg 700w, assets/photos/${g.photo}-1400.jpg 1400w"
             sizes="(max-width: 640px) 82vw, (max-width: 900px) 50vw, 40vw" alt="${esc(g.alt)}" loading="lazy" decoding="async">
        <span class="gal__cap"><strong>${esc(g.caption)}</strong><span>${esc(g.text)}</span></span>
      </button></li>`).join('');
  const dots = document.createElement('div');
  dots.className = 'gal-dots';
  dots.setAttribute('aria-hidden', 'true');
  dots.innerHTML = GALLERY.map((_, i) => `<span class="${i === 0 ? 'on' : ''}"></span>`).join('');
  gal.after(dots);
  gal.addEventListener('scroll', () => {
    const w = gal.firstElementChild.offsetWidth + 12;
    const i = Math.round(gal.scrollLeft / w);
    $$('span', dots).forEach((d, k) => d.classList.toggle('on', k === i));
  }, { passive: true });

  const lb = $('#lightbox');
  let lbI = 0;
  function showPhoto(i) {
    lbI = (i + GALLERY.length) % GALLERY.length;
    const g = GALLERY[lbI];
    const img = $('#lbImg');
    img.src = `assets/photos/${g.photo}-1400.jpg`;
    img.alt = g.alt;
    $('#lbCap').textContent = g.caption;
    $('#lbText').textContent = g.text;
    $('#lbN').textContent = `${lbI + 1} из ${GALLERY.length}`;
  }
  gal.addEventListener('click', (e) => {
    const b = e.target.closest('[data-gal]');
    if (!b) return;
    showPhoto(Number(b.dataset.gal));
    lb.showModal();
    $('[data-lb="close"]', lb).focus();
  });
  lb.addEventListener('click', (e) => {
    const a = e.target.closest('[data-lb]');
    if (a) { if (a.dataset.lb === 'close') lb.close(); if (a.dataset.lb === 'prev') showPhoto(lbI - 1); if (a.dataset.lb === 'next') showPhoto(lbI + 1); }
    else if (e.target === lb) lb.close();
  });
  lb.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') showPhoto(lbI - 1); if (e.key === 'ArrowRight') showPhoto(lbI + 1); });
  lb.addEventListener('close', () => {
    const b = $(`[data-gal="${lbI}"]`, gal);
    if (b) { b.focus({ preventScroll: true }); b.scrollIntoView({ block: 'nearest', inline: 'start' }); }
  });
  let tx = null;
  lb.addEventListener('touchstart', (e) => { tx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => { if (tx === null) return; const dx = e.changedTouches[0].clientX - tx; if (Math.abs(dx) > 50) showPhoto(lbI + (dx < 0 ? 1 : -1)); tx = null; });

  /* ---------------------------- Корзина ---------------------------- */
  const CART_KEY = 'brass-anchor:cart';
  let cart = (() => {
    try { const c = JSON.parse(localStorage.getItem(CART_KEY) || '[]'); return Array.isArray(c) ? c.filter((l) => ITEMS.has(l.id) && l.qty > 0) : []; } catch (e) { return []; }
  })();
  const save = () => { try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* ignore */ } };
  const count = () => cart.reduce((s, l) => s + l.qty, 0);
  const total = () => cart.reduce((s, l) => s + ITEMS.get(l.id).price * l.qty, 0);
  const drawer = $('#cart');

  function add(id) {
    const l = cart.find((x) => x.id === id);
    if (l) l.qty = Math.min(20, l.qty + 1); else cart.push({ id, qty: 1 });
    save(); renderCart();
    $$('[data-cart-count]').forEach((b) => { b.classList.remove('bump'); void b.offsetWidth; b.classList.add('bump'); });
    toast(`«${ITEMS.get(id).name}» — в заказе`);
  }

  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-add]');
    if (!a) return;
    add(a.dataset.add);
    a.classList.add('added');
    $('.add__t', a).textContent = 'Добавлено';
    clearTimeout(a._t);
    a._t = setTimeout(() => { a.classList.remove('added'); $('.add__t', a).textContent = 'В заказ'; }, 1400);
  });

  function renderCart() {
    const n = count(), t = money(total());
    $$('[data-cart-count]').forEach((b) => { b.textContent = n; if (b.classList.contains('badge')) b.hidden = n === 0; });
    $$('[data-cart-total]').forEach((b) => { b.textContent = t; });
    const fab = $('.cart-fab');
    fab.hidden = n === 0 || drawer.open;
    fab.setAttribute('aria-label', `Открыть заказ: ${n} шт. на ${t}`);
    $('.header__order').setAttribute('aria-label', n ? `Заказать — в корзине ${n} шт. на ${t}` : 'Заказать — корзина пуста');
    $('#empty').hidden = n > 0;
    $('#cartFoot').hidden = n === 0;
    $('#lines').innerHTML = cart.map((l) => {
      const it = ITEMS.get(l.id);
      const ph = it.photo
        ? `<img class="line__ph" src="${esc(it.photo)}" alt="" width="56" height="56">`
        : '<span class="line__ph line__ph--none" aria-hidden="true"><svg><use href="#anchor"/></svg></span>';
      return `<li class="line" data-id="${it.id}">${ph}
        <div><p class="line__name">${esc(it.name)}</p><p class="line__unit">${money(it.price)} за шт.</p></div>
        <div class="line__row">
          <div class="line__left">
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
      toast(`«${name}» удалено из заказа`);
      const next = $$('#lines [data-del]')[Math.min(idx, cart.length - 1)];
      (next || $('[data-goto-menu]')).focus();
    }
  });

  let opener = null;
  function setView(v) {
    $$('.view', drawer).forEach((x) => { x.hidden = x.dataset.view !== v; });
    $('#cartBack').hidden = v !== 'checkout';
    $('#cartTitle').textContent = { cart: 'Ваш заказ', checkout: 'Оформление', done: 'Готово' }[v];
    drawer.dataset.view = v;
  }
  function openCart(v = 'cart') {
    opener = document.activeElement;
    setView(v);
    renderCart();
    if (!drawer.open) drawer.showModal();
    $('.cart-fab').hidden = true;
    $('#cartTitle').focus();
  }
  document.addEventListener('click', (e) => {
    if (e.target.closest('[data-open-cart]')) { setNav(false); openCart('cart'); }
    if (e.target.closest('[data-goto-menu]')) {
      drawer.close();
      $('#menu').scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
      setTimeout(() => $$('.tab')[cur].focus({ preventScroll: true }), reduced() ? 0 : 600);
    }
  });
  drawer.addEventListener('click', (e) => { if (e.target.closest('[data-close]') || e.target === drawer) drawer.close(); });
  drawer.addEventListener('close', () => {
    if (drawer.dataset.view === 'done') setView('cart');
    renderCart();
    if (opener && document.contains(opener) && opener.offsetParent !== null) opener.focus({ preventScroll: true });
  });
  $('#toCheckout').addEventListener('click', () => { setView('checkout'); $('#cartTitle').focus(); });
  $('#cartBack').addEventListener('click', () => { setView('cart'); $('#cartTitle').focus(); });

  /* ---------------------------- Оформление ---------------------------- */
  const form = $('#orderForm');
  const phoneOk = (v) => { const d = v.replace(/\D/g, ''); return /^380\d{9}$/.test(d) || /^0\d{9}$/.test(d); };
  function check(name) {
    const v = (form.elements[name].value || '').trim();
    if (name === 'name') return !v ? 'Укажите имя — так бариста позовёт вас' : v.length < 2 ? 'Имя слишком короткое' : '';
    if (name === 'phone') return !v ? 'Укажите телефон' : !phoneOk(v) ? 'Проверьте номер, например: +380 67 123 45 67' : '';
    return '';
  }
  function setErr(f, msg) {
    f.setAttribute('aria-invalid', msg ? 'true' : 'false');
    $('#' + f.id + 'Err').textContent = msg;
  }
  form.addEventListener('input', (e) => {
    const f = e.target;
    if (f.getAttribute('aria-invalid') === 'true' && !check(f.name)) setErr(f, '');
  });
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    if (!cart.length) { setView('cart'); return; }
    const errs = ['name', 'phone'].map((n) => { const m = check(n); setErr(form.elements[n], m); return m ? { id: form.elements[n].id, m } : null; }).filter(Boolean);
    const box = $('#formErrors');
    if (errs.length) {
      box.innerHTML = `<strong>Заказ не отправлен — проверьте:</strong><ul>${errs.map((x) => `<li><a href="#${x.id}" data-focus="${x.id}">${esc(x.m)}</a></li>`).join('')}</ul>`;
      box.hidden = false; box.focus();
      return;
    }
    box.hidden = true;
    const btn = $('#submitBtn');
    btn.classList.add('is-busy');
    btn.setAttribute('aria-disabled', 'true');
    $('.btn__t', btn).textContent = 'Отправляем на камбуз…';
    setTimeout(done, reduced() ? 250 : 1200); // имитация, без сети
  });
  $('#formErrors').addEventListener('click', (e) => {
    const a = e.target.closest('[data-focus]');
    if (a) { e.preventDefault(); document.getElementById(a.dataset.focus).focus(); }
  });

  function done() {
    const fd = new FormData(form);
    const rows = [
      ['Имя', fd.get('name').trim()],
      ['Телефон', fd.get('phone').trim()],
      ['Получение', fd.get('how') === 'togo' ? 'С собой' : 'В кафе'],
    ];
    if (fd.get('comment').trim()) rows.push(['Комментарий', fd.get('comment').trim()]);
    $('#doneNum').textContent = 'ЛЯ-' + String(Math.floor(100 + Math.random() * 900));
    $('#doneSum').innerHTML = `<dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
      <ul>${cart.map((l) => { const it = ITEMS.get(l.id); return `<li><span>${esc(it.name)} × ${l.qty}</span><span>${money(it.price * l.qty)}</span></li>`; }).join('')}
      <li><strong>Итого</strong><strong>${money(total())}</strong></li></ul>`;
    // данные никуда не уходят: очищаем форму и корзину
    form.reset();
    $$('[aria-invalid]', form).forEach((f) => f.setAttribute('aria-invalid', 'false'));
    $$('.err', form).forEach((p) => { p.textContent = ''; });
    const btn = $('#submitBtn');
    btn.classList.remove('is-busy'); btn.removeAttribute('aria-disabled');
    $('.btn__t', btn).textContent = 'Отправить заказ';
    cart = []; save(); renderCart();
    setView('done');
    $('#cartTitle').focus();
  }

  /* ---------------------------- Контакты ---------------------------- */
  const ICON = {
    instagram: '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.6"/><circle cx="16.8" cy="7.2" r=".9" fill="currentColor"/>',
    telegram: '<path d="M20 5 3.8 11.3c-.9.4-.9 1.4 0 1.7l4 1.3 1.6 4.8c.2.6 1 .8 1.4.3l2.3-2.3 4.2 3c.6.4 1.4.1 1.5-.6L21 6.1c.2-.8-.4-1.4-1-1.1Z"/>',
    facebook: '<path d="M14 21v-7h3l.5-3.5H14V8.6c0-1 .3-1.7 1.8-1.7h1.8V3.8A23 23 0 0 0 15 3.6c-2.6 0-4.3 1.6-4.3 4.4v2.5H8V14h2.7v7"/>',
  };
  $('#socials').innerHTML = CAFE.socials.map((s) => {
    const ic = `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true">${ICON[s.id] || ''}</svg>`;
    return s.url
      ? `<a class="social" href="${esc(s.url)}" target="_blank" rel="noopener">${ic}${esc(s.label)}</a>`
      : `<button class="social" type="button" data-demo="${esc(s.label)}">${ic}${esc(s.label)} <small>демо</small></button>`;
  }).join('');
  $('#socials').addEventListener('click', (e) => {
    const b = e.target.closest('[data-demo]');
    if (b) toast(`Демо-ссылка «${b.dataset.demo}»: адрес добавляется в js/data.js`);
  });
  $$('[data-copy-phone]').forEach((b) => b.addEventListener('click', async () => {
    try { await navigator.clipboard.writeText(CAFE.contacts.phone); toast('Номер скопирован'); }
    catch (e) { toast(`Телефон: ${CAFE.contacts.phone}`); }
  }));

  /* ---------------------------- Тост ---------------------------- */
  let tt;
  function toast(m) {
    const t = $('#toast');
    t.textContent = m;
    t.classList.add('on');
    clearTimeout(tt);
    tt = setTimeout(() => t.classList.remove('on'), 2600);
  }

  renderCart();
})();
