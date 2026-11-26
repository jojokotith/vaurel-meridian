/* =========================================================================
   «Солёный свет» — взаимодействия. Данные — в js/data.js.
   Бронирование демонстрационное: ничего не отправляется и не сохраняется.
   ========================================================================= */
(function () {
  'use strict';

  const SITE = window.SITE, MENU = window.MENU, SCENES = window.SCENES;
  const root = document.documentElement;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => `${n.toLocaleString('ru-RU')} ${SITE.currency}`;
  const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const pad = (n) => String(n).padStart(2, '0');

  /* ---------------------------- Вступление ---------------------------- */
  const INTRO_MS = 2900;
  let introTimer = null;
  function endIntro() {
    clearTimeout(introTimer);
    root.classList.remove('intro-play');
    root.classList.add('intro-done');
    const skip = $('#introSkip');
    if (document.activeElement === skip) $('#heroTitle').focus({ preventScroll: true });
  }
  if (root.classList.contains('intro-play')) {
    introTimer = setTimeout(endIntro, INTRO_MS);
    $('#introSkip').addEventListener('click', endIntro);
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && root.classList.contains('intro-play')) endIntro(); });
  }

  /* ---------------------------- Кадрирование панорамы ----------------------------
     Подбираем видимую часть сцены под размер экрана: на широких экранах маяк
     и павильон стоят правее заголовка, на узких — по центру. */
  const pano = $('.panorama');
  function framePanorama() {
    const box = pano.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const aspect = box.width / box.height;
    let vw = 1000 * aspect, vh = 1000, y0 = 0;
    if (vw < 620) { vw = 620; vh = 620 / aspect; y0 = Math.max(0, 640 - vh); }
    const wide = aspect > 1.15;
    const x0 = wide ? 760 - vw * 0.68 : 875 - vw / 2;
    pano.setAttribute('viewBox', `${x0.toFixed(0)} ${y0.toFixed(0)} ${vw.toFixed(0)} ${vh.toFixed(0)}`);
  }
  framePanorama();
  window.addEventListener('resize', framePanorama);

  /* ---------------------------- Тексты из data.js ---------------------------- */
  $$('[data-site]').forEach((el) => { el.textContent = SITE[el.dataset.site]; });
  $$('[data-contact]').forEach((el) => { el.textContent = SITE.contacts[el.dataset.contact] || ''; });
  $$('[data-max-guests]').forEach((el) => { el.textContent = SITE.booking.maxGuests; });
  document.title = `${SITE.name} — ${SITE.tagline}`;

  /* ---------------------------- График ---------------------------- */
  const DAYS = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const fmt = (m) => `${pad(Math.floor(((m % 1440) + 1440) % 1440 / 60))}:${pad(((m % 1440) + 1440) % 1440 % 60)}`;
  function session(day) {
    const s = SITE.schedule[day];
    if (!s) return null;
    const open = toMin(s[0]);
    let close = toMin(s[1]);
    if (close <= open) close += 1440;
    return { open, close };
  }

  function renderHours() {
    const order = [1, 2, 3, 4, 5, 6, 0];
    const groups = [];
    order.forEach((d) => {
      const s = SITE.schedule[d];
      const label = s ? `${s[0]}–${s[1]}` : 'выходной';
      const g = groups[groups.length - 1];
      if (g && g.label === label) g.days.push(d); else groups.push({ label, days: [d] });
    });
    const today = new Date().getDay();
    $$('[data-hours]').forEach((dl) => {
      dl.innerHTML = groups.map((g) => {
        const name = g.days.length > 1 ? `${DAYS[g.days[0]]}–${DAYS[g.days[g.days.length - 1]]}` : DAYS[g.days[0]];
        const cls = g.days.includes(today) ? ' class="is-today"' : '';
        return `<dt${cls}>${name}</dt><dd${cls}>${g.label}</dd>`;
      }).join('');
    });

    const now = new Date();
    const min = now.getHours() * 60 + now.getMinutes();
    const prev = session((today + 6) % 7);
    const cur = session(today);
    let open = false, text;
    if (prev && min + 1440 < prev.close) { open = true; text = `Открыто до ${fmt(prev.close)}`; }
    else if (cur && min >= cur.open && min < cur.close) { open = true; text = `${fmt(cur.open)}–${fmt(cur.close)} · открыто`; }
    else if (cur && min < cur.open) text = `Откроемся в ${fmt(cur.open)}`;
    else text = 'Сегодня уже закрыто';
    $$('[data-today]').forEach((el) => { el.textContent = text; });
    $$('[data-open-dot]').forEach((el) => el.classList.toggle('is-open', open));
  }
  renderHours();
  setInterval(renderHours, 60000);

  /* ---------------------------- Шапка и навигация ---------------------------- */
  const header = $('#header');
  const burger = $('#burger');
  const navList = $('#navList');
  const setSolid = () => header.classList.toggle('is-solid', window.scrollY > 40);
  let raf = 0;
  window.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { setSolid(); raf = 0; }); }, { passive: true });
  setSolid();

  function setNav(open) {
    burger.setAttribute('aria-expanded', open);
    $('#burgerLabel').textContent = open ? 'Закрыть меню' : 'Открыть меню';
    navList.classList.toggle('is-open', open);
    header.classList.toggle('is-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', () => setNav(burger.getAttribute('aria-expanded') !== 'true'));
  navList.addEventListener('click', (e) => { if (e.target.closest('a')) setNav(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && burger.getAttribute('aria-expanded') === 'true') { setNav(false); burger.focus(); }
  });
  window.matchMedia('(min-width: 961px)').addEventListener('change', (e) => { if (e.matches) setNav(false); });

  // Кнопки «Забронировать» / «Найти столик»: прокрутка и фокус на первое поле
  document.addEventListener('click', (e) => {
    const b = e.target.closest('[data-book]');
    if (!b) return;
    e.preventDefault();
    const sec = $('#booking');
    sec.scrollIntoView({ behavior: reduced() ? 'auto' : 'smooth' });
    history.replaceState(null, '', '#booking');
    const target = $('#bookingForm').hidden ? $('#bookAgain') : $('#fName');
    setTimeout(() => target.focus({ preventScroll: true }), reduced() ? 0 : 650);
  });

  if ('IntersectionObserver' in window) {
    const links = $$('a:not(.btn)', navList);
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => {
          if (a.getAttribute('href') === '#' + en.target.id) a.setAttribute('aria-current', 'true');
          else a.removeAttribute('aria-current');
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['top', 'story', 'menu', 'place', 'booking', 'contacts'].forEach((id) => spy.observe(document.getElementById(id)));

    const rv = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); rv.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .08 });
    $$('.reveal').forEach((el) => rv.observe(el));
  } else {
    $$('.reveal').forEach((el) => el.classList.add('is-in'));
  }

  /* ---------------------------- Меню ---------------------------- */
  const tabs = $('#menuTabs');
  const panel = $('#menuPanel');
  let current = 0;
  const TAG = {
    sign: '<span class="tag tag--sign" title="Фирменное">★<span class="sr-only"> фирменное</span></span>',
    veg: '<span class="tag tag--veg" title="Вегетарианское">V<span class="sr-only">: вегетарианское</span></span>',
    hot: '<span class="tag tag--hot" title="Острое">🌶<span class="sr-only"> острое</span></span>',
    age: '<span class="tag tag--age" title="Алкоголь, 18+">18+<span class="sr-only">, алкоголь</span></span>',
  };

  tabs.innerHTML = MENU.map((c, i) => `<button class="tab" type="button" role="tab" id="tab-${c.id}"
      aria-controls="menuPanel" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}">
      <small>${pad(i + 1)}</small>${esc(c.label)}</button>`).join('');

  function panelHTML(c) {
    return `<div>
        <p class="menu__note">${esc(c.note)}</p>
        <ul class="dishes">${c.items.map((d) => `
          <li class="dish">
            <div class="dish__top">
              <h3 class="dish__name">${esc(d.name)}${d.tags.length ? `<span class="dish__tags">${d.tags.map((t) => TAG[t] || '').join('')}</span>` : ''}</h3>
              <span class="dish__lead" aria-hidden="true"></span>
              <span class="dish__price">${money(d.price)}</span>
            </div>
            <p class="dish__desc">${esc(d.desc)}</p>
          </li>`).join('')}
        </ul>
      </div>
      <figure class="feature">
        <img src="${esc(c.image)}" alt="${esc(c.imageAlt)}" width="1000" height="800" loading="lazy" decoding="async">
        <figcaption>${esc(c.feature)}</figcaption>
      </figure>`;
  }

  function selectTab(i, focus) {
    if (i === current && panel.innerHTML.trim()) { if (focus) $$('.tab', tabs)[i].focus(); return; }
    current = i;
    $$('.tab', tabs).forEach((t, k) => {
      t.setAttribute('aria-selected', k === i);
      t.tabIndex = k === i ? 0 : -1;
    });
    const btn = $$('.tab', tabs)[i];
    panel.setAttribute('aria-labelledby', btn.id);
    if (focus) btn.focus();
    // Прокручиваем только строку вкладок (на телефоне), не всю страницу
    const left = btn.offsetLeft - tabs.offsetLeft;
    if (left < tabs.scrollLeft || left + btn.offsetWidth > tabs.scrollLeft + tabs.clientWidth) {
      tabs.scrollTo({ left: Math.max(0, left - 16), behavior: reduced() ? 'auto' : 'smooth' });
    }
    const draw = () => { panel.innerHTML = panelHTML(MENU[i]); panel.classList.remove('is-leaving'); };
    if (reduced() || !panel.innerHTML.trim()) draw();
    else { panel.classList.add('is-leaving'); setTimeout(draw, 220); }
  }
  tabs.addEventListener('click', (e) => {
    const t = e.target.closest('.tab');
    if (t) selectTab($$('.tab', tabs).indexOf(t), false);
  });
  tabs.addEventListener('keydown', (e) => {
    const n = MENU.length;
    let i = null;
    if (e.key === 'ArrowRight') i = (current + 1) % n;
    if (e.key === 'ArrowLeft') i = (current - 1 + n) % n;
    if (e.key === 'Home') i = 0;
    if (e.key === 'End') i = n - 1;
    if (i !== null) { e.preventDefault(); selectTab(i, true); }
  });
  current = -1;
  selectTab(0, false);

  /* ---------------------------- Галерея ---------------------------- */
  const track = $('#scenes');
  track.innerHTML = SCENES.map((s, i) => `<li class="scene scene--${s.size}">
      <button class="scene__btn" type="button" data-scene="${i}" aria-label="Открыть крупно: ${esc(s.title)}, ${s.time}">
        <img src="${esc(s.image)}" alt="${esc(s.alt)}" loading="lazy" decoding="async">
        <span class="scene__cap">
          <span class="scene__time">${esc(s.time)}</span>
          <span class="scene__title">${esc(s.title)}</span>
          <span class="scene__text">${esc(s.text)}</span>
        </span>
      </button>
    </li>`).join('');

  const prevBtn = $('#scenePrev'), nextBtn = $('#sceneNext'), bar = $('#timelineBar');
  function updateTrack() {
    const max = track.scrollWidth - track.clientWidth;
    const p = max > 0 ? track.scrollLeft / max : 1;
    bar.style.width = `${Math.max(8, p * 100)}%`;
    prevBtn.disabled = track.scrollLeft < 8;
    nextBtn.disabled = track.scrollLeft > max - 8;
  }
  function stepTrack(dir) {
    const items = $$('.scene', track);
    const pl = parseFloat(getComputedStyle(track).scrollPaddingLeft) || 0;
    const x = track.scrollLeft + pl;
    let target;
    if (dir > 0) target = items.find((li) => li.offsetLeft > x + 10);
    else target = [...items].reverse().find((li) => li.offsetLeft < x - 10);
    if (target) track.scrollTo({ left: target.offsetLeft - pl, behavior: reduced() ? 'auto' : 'smooth' });
  }
  prevBtn.addEventListener('click', () => stepTrack(-1));
  nextBtn.addEventListener('click', () => stepTrack(1));
  track.addEventListener('scroll', () => requestAnimationFrame(updateTrack), { passive: true });
  window.addEventListener('resize', updateTrack);
  updateTrack();

  // Просмотр крупно
  const lb = $('#lightbox');
  let lbIndex = 0, lbOpener = null;
  function showScene(i) {
    lbIndex = (i + SCENES.length) % SCENES.length;
    const s = SCENES[lbIndex];
    const img = $('#lbImg');
    img.src = s.image; img.alt = s.alt;
    $('#lbTime').textContent = s.time;
    $('#lbTitle').textContent = s.title;
    $('#lbText').textContent = s.text;
    $('#lbCount').textContent = `${lbIndex + 1} из ${SCENES.length}`;
  }
  track.addEventListener('click', (e) => {
    const b = e.target.closest('[data-scene]');
    if (!b) return;
    lbOpener = b;
    showScene(Number(b.dataset.scene));
    lb.showModal();
    $('[data-lb="close"]', lb).focus();
  });
  lb.addEventListener('click', (e) => {
    const a = e.target.closest('[data-lb]');
    if (a) {
      if (a.dataset.lb === 'close') lb.close();
      if (a.dataset.lb === 'prev') showScene(lbIndex - 1);
      if (a.dataset.lb === 'next') showScene(lbIndex + 1);
    } else if (e.target === lb) lb.close();
  });
  lb.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') showScene(lbIndex - 1);
    if (e.key === 'ArrowRight') showScene(lbIndex + 1);
  });
  lb.addEventListener('close', () => {
    if (lbOpener) {
      // возвращаем фокус на ту же сцену, на которой остановились
      const btn = $(`[data-scene="${lbIndex}"]`, track) || lbOpener;
      btn.focus({ preventScroll: true });
      btn.closest('.scene').scrollIntoView({ inline: 'start', block: 'nearest', behavior: 'auto' });
    }
  });
  // Свайп в просмотре
  let sx = null;
  lb.addEventListener('touchstart', (e) => { sx = e.touches[0].clientX; }, { passive: true });
  lb.addEventListener('touchend', (e) => {
    if (sx === null) return;
    const dx = e.changedTouches[0].clientX - sx;
    if (Math.abs(dx) > 50) showScene(lbIndex + (dx < 0 ? 1 : -1));
    sx = null;
  });

  /* ---------------------------- Бронирование ---------------------------- */
  const form = $('#bookingForm');
  const dateIn = $('#fDate'), timeSel = $('#fTime'), guestsIn = $('#fGuests');
  const B = SITE.booking;
  const iso = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const parseISO = (s) => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };

  function newTicketNo() { $('#ticketNo').textContent = 'СС-' + String(Math.floor(1000 + Math.random() * 9000)); }
  newTicketNo();

  function setupDate() {
    const today = new Date();
    const max = new Date(); max.setDate(max.getDate() + B.daysAhead);
    dateIn.min = iso(today);
    dateIn.max = iso(max);
    // по умолчанию — сегодня, если ещё можно успеть, иначе завтра
    dateIn.value = iso(today);
    if (!slotsFor(today).length) { const t = new Date(); t.setDate(t.getDate() + 1); dateIn.value = iso(t); }
  }

  function slotsFor(date) {
    const s = session(date.getDay());
    if (!s) return [];
    const now = new Date();
    const isToday = iso(date) === iso(now);
    const earliest = isToday ? now.getHours() * 60 + now.getMinutes() + 30 : 0;
    const out = [];
    for (let m = s.open; m <= s.close - B.lastBeforeClose; m += B.stepMinutes) if (m >= earliest) out.push(m);
    return out;
  }

  function fillTimes() {
    const prev = timeSel.value;
    const hint = $('#fTimeHint');
    if (!dateIn.value) { timeSel.innerHTML = '<option value="">Сначала выберите дату</option>'; hint.textContent = ''; return; }
    const d = parseISO(dateIn.value);
    const slots = slotsFor(d);
    const s = SITE.schedule[d.getDay()];
    if (!slots.length) {
      timeSel.innerHTML = '<option value="">Нет свободного времени</option>';
      hint.textContent = s ? 'На сегодня бронирование уже закрыто — выберите другую дату.' : 'В этот день мы закрыты.';
      return;
    }
    timeSel.innerHTML = '<option value="">Выберите время</option>' + slots.map((m) => `<option value="${fmt(m)}">${fmt(m)}</option>`).join('');
    hint.textContent = s ? `В этот день открыто ${s[0]}–${s[1]}` : '';
    if (slots.some((m) => fmt(m) === prev)) timeSel.value = prev;
    else {
      const evening = slots.find((m) => m >= 19 * 60);
      timeSel.value = fmt(evening !== undefined ? evening : slots[0]);
    }
  }
  setupDate();
  fillTimes();
  dateIn.addEventListener('change', () => { fillTimes(); clearErr(timeSel); });

  function setGuests(n) {
    const v = Math.max(1, Math.min(B.maxGuests + 1, n || 1));
    guestsIn.value = v;
    $('[data-guests="-1"]').disabled = v <= 1;
    $('[data-guests="1"]').disabled = v > B.maxGuests;
  }
  form.addEventListener('click', (e) => {
    const b = e.target.closest('[data-guests]');
    if (!b) return;
    setGuests(Number(guestsIn.value) + Number(b.dataset.guests));
    if (guestsIn.getAttribute('aria-invalid') === 'true') validate('guests', true);
  });
  guestsIn.addEventListener('change', () => setGuests(parseInt(guestsIn.value, 10)));
  setGuests(2);

  const phoneOk = (v) => { const d = v.replace(/\D/g, ''); return /^380\d{9}$/.test(d) || /^0\d{9}$/.test(d); };

  function check(name) {
    const v = (form.elements[name].value || '').trim();
    switch (name) {
      case 'name': return !v ? 'Как к вам обращаться? Укажите имя' : v.length < 2 ? 'Имя слишком короткое' : '';
      case 'phone': return !v ? 'Укажите телефон — по нему подтверждают бронь' : !phoneOk(v) ? 'Проверьте номер: например, +380 67 123 45 67' : '';
      case 'date': {
        if (!v) return 'Выберите дату';
        if (v < dateIn.min) return 'Эта дата уже прошла';
        if (v > dateIn.max) return `Бронируем не дальше чем на ${B.daysAhead} дней вперёд`;
        if (!SITE.schedule[parseISO(v).getDay()]) return 'В этот день ресторан закрыт';
        return '';
      }
      case 'time': {
        if (!v) return slotsFor(parseISO(dateIn.value || iso(new Date()))).length ? 'Выберите время' : 'На эту дату нет свободного времени — выберите другой день';
        // время могло пройти, пока форма была открыта
        if (dateIn.value === iso(new Date()) && !slotsFor(new Date()).some((m) => fmt(m) === v)) return 'Это время уже недоступно — выберите более позднее';
        return '';
      }
      case 'guests': {
        const n = Number(v);
        if (!Number.isInteger(n) || n < 1) return 'Укажите количество гостей';
        if (n > B.maxGuests) return `Для компании больше ${B.maxGuests} гостей позвоните нам: ${SITE.contacts.phone}`;
        return '';
      }
      default: return '';
    }
  }
  function setErr(field, msg) {
    field.setAttribute('aria-invalid', msg ? 'true' : 'false');
    const err = document.getElementById(field.id + 'Err');
    if (err) err.textContent = msg;
  }
  function clearErr(field) { setErr(field, ''); }
  function validate(name, quiet) {
    const f = form.elements[name];
    const msg = check(name);
    if (!quiet || !msg) setErr(f, msg);
    return msg;
  }
  form.addEventListener('input', (e) => {
    const f = e.target;
    if (f.name && f.getAttribute('aria-invalid') === 'true') validate(f.name, true);
  });
  form.addEventListener('change', (e) => {
    const f = e.target;
    if (f.name && f.getAttribute('aria-invalid') === 'true') validate(f.name, true);
  });

  const submitBtn = $('#bookSubmit');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const names = ['name', 'phone', 'date', 'time', 'guests'];
    const errors = names.map((n) => ({ n, msg: validate(n) })).filter((x) => x.msg);
    const box = $('#formErrors');
    if (errors.length) {
      box.innerHTML = `<strong>Не получилось отправить — проверьте ${errors.length === 1 ? 'поле' : 'поля'}:</strong>
        <ul>${errors.map((x) => `<li><a href="#${form.elements[x.n].id}" data-focus="${form.elements[x.n].id}">${esc(x.msg)}</a></li>`).join('')}</ul>`;
      box.hidden = false;
      box.focus();
      return;
    }
    box.hidden = true;

    // Демо-«отправка»: только имитация задержки, без сети
    submitBtn.classList.add('is-loading');
    submitBtn.setAttribute('aria-disabled', 'true');
    $('.btn__label', submitBtn).textContent = 'Проверяем свободные столики…';
    setTimeout(showSuccess, reduced() ? 300 : 1300);
  });

  $('#formErrors').addEventListener('click', (e) => {
    const a = e.target.closest('[data-focus]');
    if (!a) return;
    e.preventDefault();
    const el = document.getElementById(a.dataset.focus);
    el.scrollIntoView({ block: 'center', behavior: reduced() ? 'auto' : 'smooth' });
    el.focus({ preventScroll: true });
  });

  function showSuccess() {
    const fd = new FormData(form);
    const d = parseISO(fd.get('date'));
    const dateText = d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
    const zoneLabel = { any: 'Где свободно', window: 'У окна', terrace: 'Терраса', bar: 'Бар' }[fd.get('zone')];
    const rows = [
      ['Номер', $('#ticketNo').textContent],
      ['Имя', fd.get('name').trim()],
      ['Телефон', fd.get('phone').trim()],
      ['Когда', `${dateText}, ${fd.get('time')}`],
      ['Гостей', fd.get('guests')],
      ['Место', zoneLabel],
    ];
    if (fd.get('comment').trim()) rows.push(['Комментарий', fd.get('comment').trim()]);
    $('#successList').innerHTML = rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('');

    // Данные никуда не уходят: очищаем форму сразу
    form.reset();
    $$('[aria-invalid]', form).forEach((f) => f.setAttribute('aria-invalid', 'false'));
    $$('.field__err', form).forEach((p) => { p.textContent = ''; });
    submitBtn.classList.remove('is-loading');
    submitBtn.removeAttribute('aria-disabled');
    $('.btn__label', submitBtn).textContent = 'Отправить заявку';

    form.hidden = true;
    const ok = $('#bookingSuccess');
    ok.hidden = false;
    ok.focus();
    toast('Демо: заявка оформлена, но никуда не отправлена');
  }

  $('#bookAgain').addEventListener('click', () => {
    $('#bookingSuccess').hidden = true;
    form.hidden = false;
    newTicketNo();
    setupDate();
    fillTimes();
    setGuests(2);
    $('#fName').focus();
  });

  /* ---------------------------- Контакты ---------------------------- */
  const ICONS = {
    maps: '<path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z"/><circle cx="12" cy="10" r="2.5"/>',
    instagram: '<rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.6"/><circle cx="16.8" cy="7.2" r=".8" fill="currentColor"/>',
    telegram: '<path d="M20 5 3.8 11.3c-.9.4-.9 1.4 0 1.7l4 1.3 1.6 4.8c.2.6 1 .8 1.4.3l2.3-2.3 4.2 3c.6.4 1.4.1 1.5-.6L21 6.1c.2-.8-.4-1.4-1-1.1Z"/><path d="m8 14 9-6"/>',
    facebook: '<path d="M14 21v-7h3l.5-3.5H14V8.6c0-1 .3-1.7 1.8-1.7h1.8V3.8A23 23 0 0 0 15 3.6c-2.6 0-4.3 1.6-4.3 4.4v2.5H8V14h2.7v7"/>',
  };
  $('#links').innerHTML = SITE.links.map((l) => {
    const icon = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICONS[l.id] || ''}</svg>`;
    return l.url
      ? `<a class="link-btn" href="${esc(l.url)}" target="_blank" rel="noopener">${icon}${esc(l.label)}</a>`
      : `<button class="link-btn" type="button" data-demo-link="${esc(l.label)}">${icon}${esc(l.label)} <small>демо</small></button>`;
  }).join('');
  $('#links').addEventListener('click', (e) => {
    const b = e.target.closest('[data-demo-link]');
    if (b) toast(`Демо-ссылка «${b.dataset.demoLink}»: адрес добавляется в js/data.js`);
  });

  $$('[data-copy-phone]').forEach((b) => b.addEventListener('click', async () => {
    const num = SITE.contacts.phone;
    try { await navigator.clipboard.writeText(num); toast('Номер скопирован'); }
    catch (err) { toast(`Телефон: ${num}`); }
  }));

  /* ---------------------------- Тост ---------------------------- */
  let tt;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('is-on');
    clearTimeout(tt);
    tt = setTimeout(() => t.classList.remove('is-on'), 3200);
  }
})();
