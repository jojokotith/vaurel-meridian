/* =========================================================================
   НАСТРОЙКИ ЗАВЕДЕНИЯ И МЕНЮ
   Это единственный файл, который нужно править, чтобы сменить название,
   контакты, график работы, цены и позиции меню.
   ========================================================================= */

window.SITE = {
  brand: {
    name: 'VELOUR',
    suffix: 'lounge & bar',
    tagline: 'Медленный дым. Тёплый свет. Долгие разговоры.',
  },

  // demo: true — телефон показывается с кнопкой «Скопировать» вместо звонка,
  // а форма заказа никуда не отправляется.
  demo: true,

  contacts: {
    phone: '+380 00 000 00 00',       // демо-номер
    phoneHref: 'tel:+380000000000',   // используется, если demo: false
    address: 'ул. Демонстрационная, 7, Киев',
    addressNote: 'Демо-адрес. Замените на настоящий.',
  },

  // График по дням недели: 0 — воскресенье, 1 — понедельник … 6 — суббота.
  // Если закрытие позже полуночи — просто укажите время, например '02:00'.
  // null — выходной.
  schedule: {
    1: ['16:00', '02:00'],
    2: ['16:00', '02:00'],
    3: ['16:00', '02:00'],
    4: ['16:00', '02:00'],
    5: ['16:00', '03:00'],
    6: ['14:00', '03:00'],
    0: ['14:00', '02:00'],
  },

  currency: '₴',
};

/* ---------------------------------------------------------------------------
   МЕНЮ
   Позиция:
     id        — уникальный идентификатор (латиница)
     category  — hookah | food | drinks | desserts
     name, desc, price (в гривнах)
     image     — путь к картинке (можно заменить на фото, например 'assets/menu/my.jpg')
     age       — true для позиций 18+ (кальян, алкоголь)
     tags      — короткие метки на карточке
     options   — настройки: { id, label, type: 'single' | 'multi', max, hint,
                              choices: [{ id, label, price (доплата) }] }
   --------------------------------------------------------------------------- */

(function () {
  const flavors = [
    { id: 'apple', label: 'Двойное яблоко' },
    { id: 'mint', label: 'Мята' },
    { id: 'grape', label: 'Виноград' },
    { id: 'watermelon', label: 'Арбуз' },
    { id: 'peach', label: 'Персик' },
    { id: 'blueberry', label: 'Черника' },
    { id: 'citrus', label: 'Цитрусовый микс' },
    { id: 'berry', label: 'Лесные ягоды' },
  ];

  const strength = {
    id: 'strength',
    label: 'Крепость',
    type: 'single',
    choices: [
      { id: 'light', label: 'Лёгкая' },
      { id: 'medium', label: 'Средняя' },
      { id: 'strong', label: 'Насыщенная' },
    ],
  };

  const flask = {
    id: 'flask',
    label: 'Колба',
    type: 'single',
    choices: [
      { id: 'water', label: 'Вода' },
      { id: 'ice', label: 'Вода со льдом', price: 40 },
    ],
  };

  window.MENU = {
    categories: [
      { id: 'hookah', label: 'Кальяны' },
      { id: 'food', label: 'Еда' },
      { id: 'drinks', label: 'Напитки' },
      { id: 'desserts', label: 'Десерты' },
    ],

    items: [
      /* ---------- КАЛЬЯНЫ ---------- */
      {
        id: 'hookah-classic', category: 'hookah', age: true,
        name: 'Классический',
        desc: 'Одна чаша, один вкус. Мастер подготовит кальян под выбранную крепость.',
        price: 650, image: 'assets/menu/hookah.svg', tags: ['Хит вечера'],
        options: [
          { id: 'flavor', label: 'Вкус', type: 'single', choices: flavors },
          strength, flask,
        ],
      },
      {
        id: 'hookah-mix', category: 'hookah', age: true,
        name: 'Авторский микс',
        desc: 'Сочетание до трёх вкусов. Подскажем пары, которые хорошо звучат вместе.',
        price: 750, image: 'assets/menu/hookah-mix.svg', tags: ['До 3 вкусов'],
        options: [
          { id: 'flavor', label: 'Вкусы', type: 'multi', max: 3, min: 1, hint: 'Выберите от 1 до 3', choices: flavors },
          strength, flask,
        ],
      },
      {
        id: 'hookah-grapefruit', category: 'hookah', age: true,
        name: 'На грейпфруте',
        desc: 'Чаша из свежего грейпфрута добавляет к вкусу яркую цитрусовую ноту.',
        price: 950, image: 'assets/menu/hookah-fruit.svg', tags: ['Фруктовая чаша'],
        options: [
          { id: 'flavor', label: 'Вкус', type: 'single', choices: flavors.filter(f => ['citrus', 'berry', 'mint', 'peach'].includes(f.id)) },
          strength, flask,
        ],
      },
      {
        id: 'hookah-signature', category: 'hookah', age: true,
        name: 'Signature «Медь»',
        desc: 'Фирменная композиция: чёрная смородина, кардамон и мягкая ванильная нота.',
        price: 890, image: 'assets/menu/hookah-mix.svg', tags: ['Фирменный'],
        options: [strength, flask],
      },
      {
        id: 'hookah-pineapple', category: 'hookah', age: true,
        name: 'На ананасе',
        desc: 'Подача в половинке ананаса — для большой компании и особого повода.',
        price: 1100, image: 'assets/menu/hookah-fruit.svg', tags: ['Для компании'],
        options: [
          { id: 'flavor', label: 'Вкус', type: 'single', choices: flavors.filter(f => ['citrus', 'peach', 'watermelon', 'mint'].includes(f.id)) },
          strength, flask,
        ],
      },
      {
        id: 'hookah-refill', category: 'hookah', age: true,
        name: 'Замена чаши',
        desc: 'Новая чаша к уже поданному кальяну — можно сменить вкус и крепость.',
        price: 350, image: 'assets/menu/hookah.svg', tags: [],
        options: [
          { id: 'flavor', label: 'Вкус', type: 'single', choices: flavors },
          strength,
        ],
      },

      /* ---------- ЕДА ---------- */
      {
        id: 'tartare', category: 'food',
        name: 'Тартар из говядины',
        desc: 'Рубленая вырезка, желток, каперсы и копчёный майонез.',
        price: 340, image: 'assets/menu/food-plate.svg', tags: [],
        options: [
          { id: 'side', label: 'Подача', type: 'single', choices: [
            { id: 'toast', label: 'С тостами' },
            { id: 'chips', label: 'С картофельными чипсами' },
          ] },
        ],
      },
      {
        id: 'salmon-bowl', category: 'food',
        name: 'Боул с лососем',
        desc: 'Слабосолёный лосось, авокадо, эдамаме, огурец и кунжут.',
        price: 360, image: 'assets/menu/food-bowl.svg', tags: [],
        options: [
          { id: 'base', label: 'Основа', type: 'single', choices: [
            { id: 'rice', label: 'Рис' },
            { id: 'quinoa', label: 'Киноа', price: 20 },
          ] },
          { id: 'sauce', label: 'Соус', type: 'single', choices: [
            { id: 'unagi', label: 'Унаги' },
            { id: 'spicy', label: 'Спайси' },
            { id: 'ponzu', label: 'Понзу' },
          ] },
        ],
      },
      {
        id: 'wings', category: 'food',
        name: 'Крылья BBQ',
        desc: 'Запечённые крылья в дымном соусе, сельдерей и соус блю-чиз.',
        price: 290, image: 'assets/menu/food-plate.svg', tags: [],
        options: [
          { id: 'portion', label: 'Порция', type: 'single', choices: [
            { id: '6', label: '6 шт.' },
            { id: '12', label: '12 шт.', price: 250 },
          ] },
          { id: 'spice', label: 'Острота', type: 'single', choices: [
            { id: 'mild', label: 'Мягко' },
            { id: 'mid', label: 'Средне' },
            { id: 'hot', label: 'Остро' },
          ] },
        ],
      },
      {
        id: 'sliders', category: 'food',
        name: 'Слайдеры с говядиной',
        desc: 'Три мини-бургера с чеддером, маринованным луком и соусом на выбор.',
        price: 380, image: 'assets/menu/food-burger.svg', tags: ['Сытно'],
        options: [
          { id: 'side', label: 'Гарнир', type: 'single', choices: [
            { id: 'fries', label: 'Картофель фри' },
            { id: 'sweet', label: 'Батат фри', price: 40 },
          ] },
        ],
      },
      {
        id: 'cheese-board', category: 'food',
        name: 'Сырная тарелка',
        desc: 'Четыре сыра, мёд, орехи, виноград и хрустящие крекеры.',
        price: 420, image: 'assets/menu/food-board.svg', tags: ['На компанию'],
        options: [],
      },
      {
        id: 'bruschetta', category: 'food',
        name: 'Брускетты трио',
        desc: 'С томатами и базиликом, с паштетом, с рикоттой и инжиром.',
        price: 260, image: 'assets/menu/food-board.svg', tags: [],
        options: [],
      },
      {
        id: 'truffle-pasta', category: 'food',
        name: 'Паста с трюфельным кремом',
        desc: 'Тальятелле, сливочный соус с трюфельным маслом и пармезан.',
        price: 330, image: 'assets/menu/food-bowl.svg', tags: [],
        options: [
          { id: 'extra', label: 'Добавить', type: 'multi', max: 2, choices: [
            { id: 'chicken', label: 'Курица', price: 60 },
            { id: 'mushroom', label: 'Белые грибы', price: 70 },
          ] },
        ],
      },
      {
        id: 'hummus', category: 'food',
        name: 'Хумус с питой',
        desc: 'Нутовый хумус, зелёное масло, паприка и тёплая пита.',
        price: 210, image: 'assets/menu/food-plate.svg', tags: ['Вегетарианское'],
        options: [],
      },

      /* ---------- НАПИТКИ ---------- */
      {
        id: 'lemonade', category: 'drinks',
        name: 'Лимонад «Медь»',
        desc: 'Домашний лимонад на газированной воде.',
        price: 160, image: 'assets/menu/drink-tall.svg', tags: ['Без алкоголя'],
        options: [
          { id: 'flavor', label: 'Вкус', type: 'single', choices: [
            { id: 'ginger', label: 'Имбирь и груша' },
            { id: 'passion', label: 'Маракуйя и базилик' },
            { id: 'straw', label: 'Клубника и мята' },
          ] },
          { id: 'size', label: 'Объём', type: 'single', choices: [
            { id: '04', label: '0,4 л' },
            { id: '1', label: 'Кувшин 1 л', price: 170 },
          ] },
        ],
      },
      {
        id: 'tea', category: 'drinks',
        name: 'Чай в чайнике',
        desc: 'Листовой чай, заваренный при правильной температуре.',
        price: 180, image: 'assets/menu/drink-tea.svg', tags: ['Без алкоголя'],
        options: [
          { id: 'sort', label: 'Сорт', type: 'single', choices: [
            { id: 'oolong', label: 'Молочный улун' },
            { id: 'puer', label: 'Шу пуэр' },
            { id: 'sencha', label: 'Сенча' },
            { id: 'assam', label: 'Ассам' },
          ] },
          { id: 'size', label: 'Объём', type: 'single', choices: [
            { id: '06', label: '0,6 л' },
            { id: '1', label: '1 л', price: 80 },
          ] },
        ],
      },
      {
        id: 'matcha', category: 'drinks',
        name: 'Матча-латте',
        desc: 'Японская матча, мягкое молоко и капля ванили.',
        price: 140, image: 'assets/menu/drink-cup.svg', tags: ['Без алкоголя'],
        options: [
          { id: 'milk', label: 'Молоко', type: 'single', choices: [
            { id: 'cow', label: 'Классическое' },
            { id: 'oat', label: 'Овсяное', price: 20 },
            { id: 'coco', label: 'Кокосовое', price: 20 },
          ] },
        ],
      },
      {
        id: 'espresso-tonic', category: 'drinks',
        name: 'Эспрессо-тоник',
        desc: 'Двойной эспрессо поверх тоника со льдом и апельсиновой цедрой.',
        price: 120, image: 'assets/menu/drink-tall.svg', tags: ['Без алкоголя'],
        options: [],
      },
      {
        id: 'smoky-sour', category: 'drinks',
        name: 'Smoky Sour 0%',
        desc: 'Безалкогольный сауэр: копчёный чай, лимон, мёд и аквафаба.',
        price: 190, image: 'assets/menu/drink-coupe.svg', tags: ['Без алкоголя'],
        options: [],
      },
      {
        id: 'negroni', category: 'drinks', age: true,
        name: 'Негрони',
        desc: 'Джин, красный вермут и биттер. Подаётся с апельсиновой цедрой.',
        price: 280, image: 'assets/menu/drink-tumbler.svg', tags: ['Классика'],
        options: [],
      },
      {
        id: 'old-fashioned', category: 'drinks', age: true,
        name: 'Old Fashioned',
        desc: 'Бурбон, тростниковый сироп и ароматный биттер на большом кубе льда.',
        price: 300, image: 'assets/menu/drink-tumbler.svg', tags: [],
        options: [],
      },
      {
        id: 'spritz', category: 'drinks', age: true,
        name: 'Апероль спритц',
        desc: 'Апероль, просекко, содовая и долька апельсина.',
        price: 290, image: 'assets/menu/drink-coupe.svg', tags: [],
        options: [],
      },

      /* ---------- ДЕСЕРТЫ ---------- */
      {
        id: 'basque', category: 'desserts',
        name: 'Баскский чизкейк',
        desc: 'Карамелизированная корочка и нежная кремовая середина.',
        price: 190, image: 'assets/menu/dessert-cake.svg', tags: [],
        options: [
          { id: 'sauce', label: 'Соус', type: 'single', choices: [
            { id: 'none', label: 'Без соуса' },
            { id: 'berry', label: 'Ягодный', price: 20 },
            { id: 'caramel', label: 'Солёная карамель', price: 20 },
          ] },
        ],
      },
      {
        id: 'fondant', category: 'desserts',
        name: 'Шоколадный фондан',
        desc: 'Тёплый кекс с жидкой серединой из тёмного шоколада.',
        price: 210, image: 'assets/menu/dessert-cake.svg', tags: ['Подаётся тёплым'],
        options: [
          { id: 'extra', label: 'Добавить', type: 'multi', max: 1, choices: [
            { id: 'icecream', label: 'Шарик ванильного мороженого', price: 40 },
          ] },
        ],
      },
      {
        id: 'tiramisu', category: 'desserts',
        name: 'Тирамису',
        desc: 'Маскарпоне, савоярди и крепкий эспрессо.',
        price: 200, image: 'assets/menu/dessert-cake.svg', tags: [],
        options: [],
      },
      {
        id: 'mochi', category: 'desserts',
        name: 'Моти ассорти',
        desc: 'Три японских рисовых пирожных с мороженым внутри.',
        price: 220, image: 'assets/menu/dessert-sweets.svg', tags: [],
        options: [
          { id: 'flavors', label: 'Вкусы', type: 'multi', max: 3, min: 1, hint: 'Выберите до 3 вкусов', choices: [
            { id: 'mango', label: 'Манго' },
            { id: 'passion', label: 'Маракуйя' },
            { id: 'straw', label: 'Клубника' },
            { id: 'matcha', label: 'Матча' },
            { id: 'coco', label: 'Кокос' },
          ] },
        ],
      },
    ],
  };
})();
