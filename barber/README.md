# ГРАНЬ — hero барбершопа

Один файл `index.html`: чистый HTML, CSS и JS без библиотек.

## Запуск
Откройте `index.html` в браузере или выложите файл на любой хостинг (GitHub Pages, Netlify).
Видео грузятся по ссылкам Pexels, поэтому нужен интернет.

## Как заменить видео
В конце `index.html` есть два места с настройками:

- `CLIPS` — клипы фона. В каждом:
  - `mp4` — горизонтальный H.264;
  - `webm` — необязательный;
  - `mobile` — вертикальный клип для телефона;
  - `start` — секунда, с которой начинается фрагмент.
- `PREVIEW` — видео для карточки и модального окна.

Тайминги задаются там же:
- `CLIP_MS = 3500` — длина одного клипа на экране;
- `FADE_MS = 800` — длительность crossfade;
- `PREVIEW_DELAY = 3000` — задержка перед появлением карточки.

Если ссылка не загрузилась, клип пропускается. Если не загрузился ни один, остаётся постер.

## Как уложиться в 5 МБ
Оригиналы Pexels в Full HD весят больше. Перед продакшном нарежьте и сожмите их с помощью ffmpeg.
Каждый клип выходит примерно на 0,6–1,2 МБ, а 4 клипа вместе — меньше 5 МБ.

```
ffmpeg -ss 1 -t 4 -i haircut.mp4 -vf "scale=1280:-2,fps=25" -an -c:v libx264 -profile:v high -crf 28 -preset slow -movflags +faststart video/haircut.mp4
ffmpeg -ss 1 -t 4 -i haircut.mp4 -vf "scale=1280:-2,fps=25" -an -c:v libvpx-vp9 -crf 38 -b:v 0 video/haircut.webm
```

Для вертикальных версий замените `scale=1280:-2` на `scale=720:-2`.

После сжатия:
1. Укажите в `CLIPS` пути к своим файлам, например `mp4: 'video/haircut.mp4'`, `webm: 'video/haircut.webm'`.
2. Поставьте `start: 0`.

## Источники (Pexels, бесплатная лицензия)
| Клип | Автор | Страница |
|---|---|---|
| Стрижка в кресле | RDNE Stock project | https://www.pexels.com/video/barber-shop-7697073/ |
| Стрижка, вертикальная версия | RDNE Stock project | https://www.pexels.com/video/haircut-at-barber-shop-7697084/ |
| Бритьё опасной бритвой | Pavel Danilyuk | https://www.pexels.com/video/a-man-shaving-customer-s-beard-7426308/ |
| Бритьё, вертикальная версия | Los Muertos Crew | https://www.pexels.com/video/a-barber-shaving-a-client-at-a-barber-shop-8867529/ |
| Интерьер, превью | Aghyad Najjar | https://www.pexels.com/video/young-men-working-in-a-barbershop-6113143/ |
| Интерьер, вертикальная версия | Pavel Danilyuk | https://www.pexels.com/video/a-man-having-a-haircut-4177893/ |
| Вывеска у входа | Giant Asparagus | https://www.pexels.com/video/classic-barber-shop-pole-on-urban-street-37650977/ |
| Вывеска, вертикальная версия | cottonbro studio | https://www.pexels.com/video/a-barber-pole-on-the-side-of-a-building-4543510/ |

Название «ГРАНЬ», тексты и город указаны для демо. Отзывов, адреса и телефона нет намеренно.
