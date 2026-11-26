/* =========================================================================
   VELOUR — меню, корзина и демонстрационное оформление заказа.
   Данные — в js/config.js. Заявки никуда не отправляются.
   ========================================================================= */
(function () {
  'use strict';

  const SITE = window.SITE;
  const MENU = window.MENU;
  const CUR = SITE.currency || '₴';
  const CART_KEY = 'velour:cart';
  const PLACEHOLDER = 'assets/menu/placeholder.svg';
  const reduceMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = (n) => `${Math.round(n).toLocaleString('ru-RU')} ${CUR}`;
  const itemsById = new Map(MENU.items.map((i) => [i.id, i]));

  /* ---------------------------- Бренд и контакты ---------------------------- */
  function fillBrand() {
    $$('[data-brand]').forEach((el) => {
      const v = SITE.brand[el.dataset.brand];
      if (v) el.textContent = v;
    });
    $$('[data-contact]').forEach((el) => { el.textContent = SITE.contacts[el.dataset.contact] || ''; });
    $$('[data-year]').forEach((el) => { el.textContent = new Date().getFullYear(); });
    document.title = `${SITE.brand.name} lounge`;

    $$('[data-phone-slot]').forEach((slot) => {
      if (SITE.demo) {
        slot.innerHTML = `<span class="phone"><span class="phone__num">${esc(SITE.contacts.phone)}</span>
          <button class="phone__copy" type="button" data-action="copy-phone" aria-label="Скопировать номер ${esc(SITE.contacts.phone)}">Скопировать</button></span>`;
      } else {
        slot.innerHTML = `<a class="phone__num" href="${esc(SITE.contacts.phoneHref)}">${esc(SITE.contacts.phone)}</a>`;
      }
    });
  }

  /* ---------------------------- График работы ---------------------------- */
  const DAY_SHORT = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
  const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };
  const fromMin = (min) => { const m = ((min % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`; };

  // Возвращает {open, close} в минутах от полуночи дня `day`; close может быть > 1440
  function session(day) {
    const s = SITE.schedule[day];
    if (!s) return null;
    const open = toMin(s[0]);
    let close = toMin(s[1]);
    if (close <= open) close += 1440;
    return { open, close };
  }

  // Текущее состояние: открыто ли и до/с какого времени
  function openState(now = new Date()) {
    const day = now.getDay();
    const min = now.getHours() * 60 + now.getMinutes();
    const prev = session((day + 6) % 7);
    if (prev && min + 1440 < prev.close) return { open: true, until: prev.close - 1440, nowMin: min, base: -1440 };
    const today = session(day);
    if (today && min >= today.open && min < today.close) return { open: true, until: today.close, nowMin: min, base: 0 };
    if (today && min < today.open) return { open: false, opensAt: today.open, nowMin: min, today: true };
    for (let i = 1; i <= 7; i++) {
      const s = session((day + i) % 7);
      if (s) return { open: false, opensAt: s.open, nowMin: min, today: false, dayOffset: i };
    }
    return { open: false, nowMin: min };
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
        const name = g.days.length > 1 ? `${DAY_SHORT[g.days[0]]}–${DAY_SHORT[g.days[g.days.length - 1]]}` : DAY_SHORT[g.days[0]];
        const cls = g.days.includes(today) ? ' class="is-today"' : '';
        return `<dt${cls}>${name}</dt><dd${cls}>${g.label}</dd>`;
      }).join('');
    });

    const st = openState();
    const s = SITE.schedule[today];
    let txt;
    if (st.open) txt = `Открыто до ${fromMin(st.until)}`;
    else if (st.opensAt != null) txt = st.today ? `Откроемся в ${fromMin(st.opensAt)}` : `Закрыто · откроемся ${st.dayOffset === 1 ? 'завтра' : ''} в ${fromMin(st.opensAt)}`;
    else txt = 'Закрыто';
    $$('[data-today]').forEach((el) => { el.textContent = s ? `${s[0]}–${s[1]} · ${txt}` : txt; });
    $$('[data-open-dot]').forEach((el) => el.classList.toggle('is-open', st.open));
  }

  // Слоты времени для заказа (шаг 30 минут, минимум +30 минут от текущего времени)
  function timeSlots() {
    const st = openState();
    const slots = [];
    if (st.open) {
      slots.push({ v: 'asap', t: 'Как можно скорее' });
      let m = Math.ceil((st.nowMin + 30) / 30) * 30;
      while (m <= st.until - 30 && slots.length < 16) { slots.push({ v: fromMin(m), t: fromMin(m) }); m += 30; }
    } else if (st.opensAt != null) {
      const prefix = st.today ? 'Сегодня' : (st.dayOffset === 1 ? 'Завтра' : 'В ближайший день');
      for (let i = 0, m = st.opensAt; i < 12; i++, m += 30) slots.push({ v: fromMin(m), t: `${prefix}, ${fromMin(m)}` });
    }
    return slots;
  }

  /* ---------------------------- Меню ---------------------------- */
  let filter = 'all';

  function minPrice(item) {
    // «от» показываем, если есть опции, которые меняют цену
    const hasExtra = (item.options || []).some((o) => o.choices.some((c) => c.price));
    return { price: item.price, from: hasExtra };
  }

  function renderFilters() {
    const wrap = $('#filters');
    const all = [{ id: 'all', label: 'Всё меню' }, ...MENU.categories];
    wrap.innerHTML = all.map((c) => {
      const count = c.id === 'all' ? MENU.items.length : MENU.items.filter((i) => i.category === c.id).length;
      return `<button type="button" class="filter" data-filter="${c.id}" aria-pressed="${c.id === filter}">${esc(c.label)} <small>${count}</small></button>`;
    }).join('');
  }

  function cardHTML(item) {
    const p = minPrice(item);
    const badges = [
      item.age ? '<span class="badge badge--age">18+</span>' : '',
      ...(item.tags || []).slice(0, 2).map((t) => `<span class="badge">${esc(t)}</span>`),
    ].join('');
    return `<article class="card">
      <div class="card__media">
        <img src="${esc(item.image || PLACEHOLDER)}" alt="" width="400" height="300" loading="lazy" decoding="async">
        <div class="card__badges">${badges}</div>
      </div>
      <div class="card__body">
        <h3 class="card__title">${esc(item.name)}</h3>
        <p class="card__desc">${esc(item.desc)}</p>
        <div class="card__foot">
          <span class="price">${p.from ? '<small>от</small>' : ''}${money(p.price)}</span>
          <button class="btn btn--primary btn--sm" type="button" data-open-item="${item.id}" aria-label="Выбрать: ${esc(item.name)}">Выбрать</button>
        </div>
      </div>
    </article>`;
  }

  function renderMenu(animate) {
    const grid = $('#menuGrid');
    const items = MENU.items.filter((i) => filter === 'all' || i.category === filter);
    const draw = () => {
      grid.innerHTML = items.map(cardHTML).join('');
      $$('img', grid).forEach(fixImage);
      grid.classList.remove('is-switching');
    };
    $('#hookahNote').hidden = !(filter === 'all' || filter === 'hookah');
    if (animate && !reduceMotion()) {
      grid.classList.add('is-switching');
      setTimeout(draw, 200);
    } else draw();
  }

  // Если картинку удалили или путь неверный — показываем заглушку, а не «битую» иконку
  function fixImage(img) {
    img.addEventListener('error', () => {
      if (!img.src.endsWith(PLACEHOLDER)) img.src = PLACEHOLDER;
    }, { once: true });
  }

  /* ---------------------------- Окно позиции ---------------------------- */
  const dlg = $('#itemDialog');
  const form = $('#itemForm');
  let current = null; // { item, qty }

  function defaultSel(item) {
    const sel = {};
    (item.options || []).forEach((o) => { sel[o.id] = o.type === 'single' ? [o.choices[0].id] : []; });
    return sel;
  }

  function unitPrice(item, sel) {
    let p = item.price;
    (item.options || []).forEach((o) => {
      (sel[o.id] || []).forEach((cid) => {
        const c = o.choices.find((x) => x.id === cid);
        if (c && c.price) p += c.price;
      });
    });
    return p;
  }

  function optionsText(item, sel) {
    return (item.options || []).map((o) => {
      const labels = (sel[o.id] || []).map((cid) => (o.choices.find((c) => c.id === cid) || {}).label).filter(Boolean);
      return labels.length ? `${o.label}: ${labels.join(', ')}` : '';
    }).filter(Boolean).join(' · ');
  }

  function openItem(id, opener) {
    const item = itemsById.get(id);
    if (!item) return;
    current = { item, qty: 1, opener };
    const img = $('#itemImg');
    img.src = item.image || PLACEHOLDER;
    fixImage(img);
    $('#itemTitle').textContent = item.name;
    $('#itemDesc').textContent = item.desc;

    $('#itemAgeNote').innerHTML = item.age
      ? `<div class="age-callout"><span class="age-badge age-badge--sm" aria-hidden="true">18+</span>
         <p>${item.category === 'hookah'
            ? 'Кальян подаётся только совершеннолетним гостям. Курение вредит вашему здоровью.'
            : 'Алкогольный напиток. Подаётся только совершеннолетним гостям.'}</p></div>`
      : '';

    const sel = defaultSel(item);
    $('#itemOptions').innerHTML = (item.options || []).map((o) => {
      const type = o.type === 'single' ? 'radio' : 'checkbox';
      const hint = o.hint || (o.type === 'multi' && o.max ? `до ${o.max}` : '');
      return `<fieldset class="opt" data-opt="${o.id}">
        <legend>${esc(o.label)} ${hint ? `<small>${esc(hint)}</small>` : ''}</legend>
        <div class="chips">
          ${o.choices.map((c) => `<label class="chip">
            <input type="${type}" name="opt-${o.id}" value="${c.id}" ${sel[o.id].includes(c.id) ? 'checked' : ''}>
            <span>${esc(c.label)}${c.price ? ` <em>+${money(c.price)}</em>` : ''}</span>
          </label>`).join('')}
        </div>
        <p class="field-error" id="err-${o.id}"></p>
      </fieldset>`;
    }).join('');

    $('#itemAgeConfirm').innerHTML = item.age
      ? `<div class="field"><label class="check" id="ageCheckLabel">
           <input type="checkbox" id="itemAge" aria-describedby="itemAgeErr">
           <span>Подтверждаю, что мне исполнилось 18 лет</span>
         </label><p class="field-error" id="itemAgeErr"></p></div>`
      : '';

    updateItem();
    dlg.showModal();
    dlg.querySelector('.modal__inner').scrollTop = 0;
  }

  function readSel() {
    const sel = {};
    (current.item.options || []).forEach((o) => {
      sel[o.id] = $$(`input[name="opt-${o.id}"]:checked`, form).map((i) => i.value);
    });
    return sel;
  }

  function updateItem() {
    const { item } = current;
    const sel = readSel();
    // ограничение количества вариантов в «multi»
    (item.options || []).forEach((o) => {
      if (o.type !== 'multi' || !o.max) return;
      const inputs = $$(`input[name="opt-${o.id}"]`, form);
      const full = sel[o.id].length >= o.max;
      inputs.forEach((i) => { i.disabled = full && !i.checked; });
    });
    const total = unitPrice(item, sel) * current.qty;
    $('#itemQty').textContent = current.qty;
    $('[data-qty="-1"]', form).disabled = current.qty <= 1;
    $('[data-qty="1"]', form).disabled = current.qty >= 20;
    $('#itemAdd').textContent = `Добавить · ${money(total)}`;
  }

  function validateItem() {
    const { item } = current;
    const sel = readSel();
    let firstBad = null;
    (item.options || []).forEach((o) => {
      const err = $(`#err-${o.id}`);
      const fs = $(`[data-opt="${o.id}"]`, form);
      const min = o.min || (o.type === 'single' ? 1 : 0);
      const bad = sel[o.id].length < min;
      err.textContent = bad ? `Выберите вариант: ${o.label.toLowerCase()}` : '';
      fs.classList.toggle('has-error', bad);
      if (bad && !firstBad) firstBad = $('input', fs);
    });
    if (item.age) {
      const cb = $('#itemAge');
      const err = $('#itemAgeErr');
      const bad = !cb.checked;
      cb.setAttribute('aria-invalid', bad);
      err.textContent = bad ? 'Подтвердите, что вам исполнилось 18 лет' : '';
      $('#ageCheckLabel').classList.toggle('has-error', bad);
      if (bad && !firstBad) firstBad = cb;
    }
    if (firstBad) { firstBad.focus(); return null; }
    return sel;
  }

  form.addEventListener('change', (e) => {
    if (e.target.matches('input[name^="opt-"]')) {
      const fs = e.target.closest('.opt');
      fs.classList.remove('has-error');
      $('.field-error', fs).textContent = '';
    }
    if (e.target.id === 'itemAge' && e.target.checked) {
      $('#itemAgeErr').textContent = '';
      e.target.setAttribute('aria-invalid', 'false');
      $('#ageCheckLabel').classList.remove('has-error');
    }
    updateItem();
  });

  form.addEventListener('click', (e) => {
    const q = e.target.closest('[data-qty]');
    if (q) {
      current.qty = Math.min(20, Math.max(1, current.qty + Number(q.dataset.qty)));
      updateItem();
    }
    if (e.target.closest('[data-close]')) dlg.close();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const sel = validateItem();
    if (!sel) return;
    addToCart(current.item.id, sel, current.qty);
    dlg.close();
    toast(`«${current.item.name}» — в корзине`);
  });

  dlg.addEventListener('close', () => {
    if (current && current.opener && document.contains(current.opener)) current.opener.focus();
  });

  // Закрытие по клику на фон
  [dlg, $('#cartDialog')].forEach((d) => {
    d.addEventListener('click', (e) => {
      if (e.target === d) d.close();
    });
  });

  /* ---------------------------- Корзина ---------------------------- */
  let cart = loadCart();

  function loadCart() {
    try {
      const raw = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
      return Array.isArray(raw) ? raw.filter((l) => itemsById.has(l.id) && l.qty > 0) : [];
    } catch (e) { return []; }
  }
  function saveCart() {
    // Храним только состав корзины — никаких персональных данных
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch (e) { /* ignore */ }
  }
  const lineKey = (id, sel) => id + '|' + Object.keys(sel).sort().map((k) => `${k}:${[...sel[k]].sort().join(',')}`).join(';');
  const linePrice = (l) => unitPrice(itemsById.get(l.id), l.sel);
  const cartTotal = () => cart.reduce((s, l) => s + linePrice(l) * l.qty, 0);
  const cartCount = () => cart.reduce((s, l) => s + l.qty, 0);
  const cartHasAge = () => cart.some((l) => itemsById.get(l.id).age);

  function addToCart(id, sel, qty) {
    const key = lineKey(id, sel);
    const ex = cart.find((l) => l.key === key);
    if (ex) ex.qty = Math.min(99, ex.qty + qty);
    else cart.push({ key, id, sel, qty });
    saveCart();
    renderCart();
    $$('.cart-count').forEach((el) => { el.classList.remove('bump'); void el.offsetWidth; el.classList.add('bump'); });
  }

  function renderCart() {
    const count = cartCount();
    const total = money(cartTotal());
    $$('[data-cart-count]').forEach((el) => { el.textContent = count; });
    $$('.cart-count').forEach((el) => { el.hidden = count === 0; });
    $$('[data-cart-total]').forEach((el) => { el.textContent = total; });
    $$('[data-action="open-cart"]').forEach((b) => {
      if (b.classList.contains('cart-btn')) b.setAttribute('aria-label', count ? `Открыть корзину: ${count} шт. на ${total}` : 'Открыть корзину, она пуста');
    });
    const fab = $('.cart-fab');
    fab.hidden = count === 0 || cartDlg.open;
    fab.setAttribute('aria-label', `Открыть корзину: ${count} шт. на ${total}`);

    const list = $('#cartList');
    $('#cartEmpty').hidden = count > 0;
    $('#cartFoot').hidden = count === 0;
    list.innerHTML = cart.map((l) => {
      const item = itemsById.get(l.id);
      const opts = optionsText(item, l.sel);
      return `<li class="cart-item" data-key="${esc(l.key)}">
        <img src="${esc(item.image || PLACEHOLDER)}" alt="" width="64" height="64">
        <div>
          <p class="cart-item__title">${esc(item.name)}${item.age ? ' <span class="badge badge--age">18+</span>' : ''}</p>
          ${opts ? `<p class="cart-item__opts">${esc(opts)}</p>` : ''}
          <p class="cart-item__opts">${money(linePrice(l))} за шт.</p>
        </div>
        <div class="cart-item__row">
          <div class="cart-item__ctrl">
            <div class="stepper stepper--sm" role="group" aria-label="Количество: ${esc(item.name)}">
              <button type="button" class="stepper__btn" data-line-qty="-1" aria-label="Уменьшить: ${esc(item.name)}" ${l.qty <= 1 ? 'disabled' : ''}>−</button>
              <span class="stepper__val" aria-live="polite">${l.qty}</span>
              <button type="button" class="stepper__btn" data-line-qty="1" aria-label="Увеличить: ${esc(item.name)}">+</button>
            </div>
            <button type="button" class="cart-item__remove" data-remove aria-label="Удалить из корзины: ${esc(item.name)}">Удалить</button>
          </div>
          <span class="cart-item__price">${money(linePrice(l) * l.qty)}</span>
        </div>
      </li>`;
    }).join('');
    $$('img', list).forEach(fixImage);
    $('#ageField').hidden = !cartHasAge();
  }

  $('#cartList').addEventListener('click', (e) => {
    const li = e.target.closest('.cart-item');
    if (!li) return;
    const idx = cart.findIndex((l) => l.key === li.dataset.key);
    if (idx < 0) return;
    const q = e.target.closest('[data-line-qty]');
    if (q) {
      const d = Number(q.dataset.lineQty);
      cart[idx].qty = Math.min(99, Math.max(1, cart[idx].qty + d));
      saveCart(); renderCart();
      // сохраняем фокус на той же кнопке после перерисовки
      const again = $(`.cart-item[data-key="${CSS.escape(li.dataset.key)}"] [data-line-qty="${d}"]`);
      if (again && !again.disabled) again.focus();
      else { const other = $(`.cart-item[data-key="${CSS.escape(li.dataset.key)}"] [data-line-qty="${-d}"]`); if (other) other.focus(); }
      return;
    }
    if (e.target.closest('[data-remove]')) {
      const name = itemsById.get(cart[idx].id).name;
      cart.splice(idx, 1);
      saveCart(); renderCart();
      toast(`«${name}» удалено из корзины`);
      const next = $$('.cart-item [data-remove]')[Math.min(idx, cart.length - 1)];
      (next || $('[data-action="goto-menu"]') || $('#cartTitle')).focus();
    }
  });

  /* ---------------------------- Окно корзины ---------------------------- */
  const cartDlg = $('#cartDialog');
  let cartOpener = null;

  function setView(view) {
    $$('.drawer__view', cartDlg).forEach((v) => { v.hidden = v.dataset.view !== view; });
    $('#cartBack').hidden = view !== 'checkout';
    $('#cartTitle').textContent = { cart: 'Ваш заказ', checkout: 'Оформление', done: 'Готово' }[view];
    cartDlg.dataset.view = view;
  }

  function openCart(view = 'cart', opener) {
    cartOpener = opener || document.activeElement;
    if (view === 'checkout' && !cart.length) view = 'cart';
    if (view === 'checkout') prepareCheckout();
    setView(view);
    renderCart();
    if (!cartDlg.open) cartDlg.showModal();
    $('.cart-fab').hidden = true;
    $('#cartTitle').focus();
  }

  cartDlg.addEventListener('close', () => {
    if (cartDlg.dataset.view === 'done') setView('cart');
    renderCart();
    if (cartOpener && document.contains(cartOpener) && !cartOpener.closest('[hidden]')) cartOpener.focus();
  });
  cartDlg.addEventListener('click', (e) => {
    if (e.target.closest('[data-close]')) cartDlg.close();
  });

  $('#toCheckout').addEventListener('click', () => {
    prepareCheckout();
    setView('checkout');
    $('#cartTitle').focus();
    $('.drawer__view[data-view="checkout"] .drawer__scroll').scrollTop = 0;
  });
  $('#cartBack').addEventListener('click', () => { setView('cart'); $('#cartTitle').focus(); });

  /* ---------------------------- Оформление ---------------------------- */
  const co = $('#checkoutForm');

  function prepareCheckout() {
    const sel = $('#fTime');
    const prev = sel.value;
    const slots = timeSlots();
    sel.innerHTML = slots.length
      ? slots.map((s) => `<option value="${s.v}">${esc(s.t)}</option>`).join('')
      : '<option value="asap">Уточнит администратор</option>';
    if (slots.some((s) => s.v === prev)) sel.value = prev;
    syncMethod();
  }

  function method() { return (co.querySelector('input[name="method"]:checked') || {}).value || 'pickup'; }

  function syncMethod() {
    const m = method();
    $$('[data-for]', co).forEach((el) => { el.hidden = !el.dataset.for.split(' ').includes(m); });
  }
  co.addEventListener('change', (e) => {
    if (e.target.name === 'method') syncMethod();
  });

  // Живое снятие ошибки при исправлении поля
  co.addEventListener('input', (e) => {
    const f = e.target;
    if (f.getAttribute('aria-invalid') === 'true') {
      const msg = checkField(f.name);
      if (!msg) setError(f, '');
    }
  });

  function phoneDigits(v) { return v.replace(/\D/g, ''); }
  function phoneValid(v) {
    const d = phoneDigits(v);
    return (/^380\d{9}$/.test(d)) || (/^0\d{9}$/.test(d));
  }

  function checkField(name) {
    const v = (co.elements[name] && co.elements[name].value || '').trim();
    switch (name) {
      case 'name':
        if (!v) return 'Укажите имя';
        if (v.length < 2) return 'Имя слишком короткое';
        return '';
      case 'phone':
        if (!v) return 'Укажите номер телефона';
        if (!phoneValid(v)) return 'Проверьте номер: нужен украинский формат, например +380 67 123 45 67';
        return '';
      case 'guests': {
        if (method() !== 'dinein') return '';
        const n = Number(v);
        if (!v || !Number.isInteger(n) || n < 1 || n > 20) return 'Укажите количество гостей от 1 до 20';
        return '';
      }
      case 'address':
        if (method() !== 'delivery') return '';
        if (v.length < 5) return 'Укажите адрес доставки: улица, дом, квартира';
        return '';
      case 'age':
        if (!cartHasAge()) return '';
        return co.elements.age.checked ? '' : 'Подтвердите, что вам исполнилось 18 лет — в заказе есть позиции 18+';
      default: return '';
    }
  }

  function setError(field, msg) {
    const err = document.getElementById(field.id + 'Err');
    field.setAttribute('aria-invalid', msg ? 'true' : 'false');
    if (err) err.textContent = msg;
  }

  co.addEventListener('submit', (e) => {
    e.preventDefault();
    const fields = ['name', 'phone', 'guests', 'address', 'age'];
    const errors = [];
    fields.forEach((n) => {
      const f = co.elements[n];
      const msg = checkField(n);
      setError(f, msg);
      if (msg) errors.push({ f, msg });
    });

    // Демо: доставка кальянов и алкоголя не предусмотрена
    if (method() === 'delivery' && cartHasAge()) {
      errors.push({ f: co.querySelector('input[value="delivery"]'), msg: 'Позиции 18+ (кальяны, алкоголь) нельзя оформить с доставкой — выберите самовывоз или заказ в заведении' });
    }

    const box = $('#formErrors');
    if (errors.length) {
      box.innerHTML = `<strong>Проверьте форму:</strong><ul>${errors.map((x) => `<li><a href="#${x.f.id}" data-focus="${x.f.id}">${esc(x.msg)}</a></li>`).join('')}</ul>`;
      box.hidden = false;
      box.focus();
      return;
    }
    box.hidden = true;
    finishOrder();
  });

  $('#formErrors').addEventListener('click', (e) => {
    const a = e.target.closest('[data-focus]');
    if (!a) return;
    e.preventDefault();
    const el = document.getElementById(a.dataset.focus);
    if (el) { el.focus(); el.scrollIntoView({ block: 'center', behavior: reduceMotion() ? 'auto' : 'smooth' }); }
  });

  function finishOrder() {
    const fd = new FormData(co);
    const m = method();
    const mLabel = { pickup: 'Самовывоз', dinein: 'В заведении', delivery: 'Доставка (демо)' }[m];
    const timeSel = $('#fTime');
    const timeLabel = timeSel.options[timeSel.selectedIndex] ? timeSel.options[timeSel.selectedIndex].text : '';
    const num = 'VL-' + String(Math.floor(1000 + Math.random() * 9000));

    const rows = [
      ['Имя', fd.get('name').trim()],
      ['Телефон', fd.get('phone').trim()],
      ['Получение', mLabel],
    ];
    if (m !== 'delivery') rows.push(['Время', timeLabel]);
    if (m === 'dinein') rows.push(['Гостей', fd.get('guests')]);
    if (m === 'delivery') rows.push(['Адрес', fd.get('address').trim()]);
    if (fd.get('comment').trim()) rows.push(['Комментарий', fd.get('comment').trim()]);

    $('#doneNum').textContent = num;
    $('#doneSummary').innerHTML = `<dl>${rows.map(([k, v]) => `<dt>${k}</dt><dd>${esc(v)}</dd>`).join('')}</dl>
      <ul>${cart.map((l) => {
        const it = itemsById.get(l.id);
        return `<li><span>${esc(it.name)} × ${l.qty}</span><span>${money(linePrice(l) * l.qty)}</span></li>`;
      }).join('')}
      <li><strong>Итого</strong><strong>${money(cartTotal())}</strong></li></ul>`;

    // Ничего не отправляем и не сохраняем: очищаем форму и корзину
    co.reset();
    $$('[aria-invalid]', co).forEach((f) => f.setAttribute('aria-invalid', 'false'));
    $$('.field-error', co).forEach((p) => { p.textContent = ''; });
    cart = [];
    saveCart();
    renderCart();
    setView('done');
    $('.drawer__view[data-view="done"] .drawer__scroll').scrollTop = 0;
    $('#cartTitle').focus();
  }

  /* ---------------------------- Навигация ---------------------------- */
  const header = $('#header');
  const navToggle = $('#navToggle');
  const navList = $('#navList');

  function setNav(open) {
    navToggle.setAttribute('aria-expanded', open);
    navToggle.setAttribute('aria-label', open ? 'Закрыть меню навигации' : 'Открыть меню навигации');
    navList.classList.toggle('is-open', open);
    header.classList.toggle('is-open', open);
  }
  navToggle.addEventListener('click', () => setNav(navToggle.getAttribute('aria-expanded') !== 'true'));
  navList.addEventListener('click', (e) => { if (e.target.closest('a')) setNav(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && navToggle.getAttribute('aria-expanded') === 'true') { setNav(false); navToggle.focus(); }
  });
  document.addEventListener('click', (e) => {
    if (navList.classList.contains('is-open') && !e.target.closest('#nav') && !e.target.closest('#navToggle')) setNav(false);
  });
  window.matchMedia('(min-width: 821px)').addEventListener('change', (e) => { if (e.matches) setNav(false); });

  let ticking = false;
  window.addEventListener('scroll', () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => { header.classList.toggle('is-scrolled', window.scrollY > 10); ticking = false; });
  }, { passive: true });
  header.classList.toggle('is-scrolled', window.scrollY > 10);

  // Подсветка активного пункта меню
  if ('IntersectionObserver' in window) {
    const links = $$('a', navList);
    const io = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        links.forEach((a) => a.toggleAttribute('aria-current', a.getAttribute('href') === '#' + en.target.id));
        links.forEach((a) => { if (a.hasAttribute('aria-current')) a.setAttribute('aria-current', 'true'); });
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['about', 'menu', 'order-info', 'contacts'].forEach((id) => { const s = document.getElementById(id); if (s) io.observe(s); });

    const rv = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-visible'); rv.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.05 });
    $$('.reveal').forEach((el) => rv.observe(el));
  } else {
    $$('.reveal').forEach((el) => el.classList.add('is-visible'));
  }

  /* ---------------------------- Тост ---------------------------- */
  let toastTimer;
  function toast(msg) {
    const t = $('#toast');
    t.textContent = msg;
    t.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('is-visible'), 2600);
  }

  async function copyPhone() {
    const num = SITE.contacts.phone;
    try {
      await navigator.clipboard.writeText(num);
      toast('Номер скопирован');
    } catch (e) {
      const ta = document.createElement('textarea');
      ta.value = num; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0';
      document.body.appendChild(ta); ta.select();
      let ok = false;
      try { ok = document.execCommand('copy'); } catch (err) { ok = false; }
      ta.remove();
      toast(ok ? 'Номер скопирован' : `Номер: ${num}`);
    }
  }

  /* ---------------------------- Глобальные действия ---------------------------- */
  document.addEventListener('click', (e) => {
    const f = e.target.closest('[data-filter]');
    if (f) {
      if (f.dataset.filter === filter) return;
      filter = f.dataset.filter;
      $$('[data-filter]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.filter === filter));
      renderMenu(true);
      return;
    }
    const oi = e.target.closest('[data-open-item]');
    if (oi) { openItem(oi.dataset.openItem, oi); return; }

    const a = e.target.closest('[data-action]');
    if (!a) return;
    switch (a.dataset.action) {
      case 'open-cart': openCart('cart', a); break;
      case 'checkout':
        if (cart.length) openCart('checkout', a);
        else {
          toast('Сначала добавьте позиции из меню');
          goToMenu();
        }
        break;
      case 'goto-menu':
        if (cartDlg.open) cartDlg.close();
        goToMenu();
        break;
      case 'copy-phone': copyPhone(); break;
    }
  });

  function goToMenu() {
    const m = document.getElementById('menu');
    m.scrollIntoView({ behavior: reduceMotion() ? 'auto' : 'smooth' });
    const first = $('#filters [aria-pressed="true"]');
    if (first) setTimeout(() => first.focus({ preventScroll: true }), reduceMotion() ? 0 : 500);
  }

  $('#replayIntro').addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'auto' });
    if (window.VelourIntro) window.VelourIntro.play();
  });

  /* ---------------------------- Запуск ---------------------------- */
  fillBrand();
  renderHours();
  renderFilters();
  renderMenu(false);
  renderCart();
  setInterval(renderHours, 60 * 1000);
})();
