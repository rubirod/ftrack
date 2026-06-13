# Калории — PWA дневник питания

Персональное приложение для подсчёта КБЖУ. Тап по сохранённому блюду или фото →
подтверждение → запись в Airtable. Тёмная тема, работает как PWA на iPhone.

## Стек
React + TypeScript + Vite · Airtable REST API · Anthropic Vision (`claude-sonnet-4-6`) ·
vite-plugin-pwa · GitHub Pages.

## Локальный запуск
```bash
npm install
npm run dev        # дев-сервер
npm run typecheck  # проверка типов (tsc -b)
npm run build      # tsc -b + vite build
```

## Настройка (вводится в приложении, ⚙️)
Ключи не хранятся в коде — только в `localStorage` под префиксом `kcal_`.

| Ключ | Что это |
|---|---|
| `ANTHROPIC_API_KEY` | для анализа фото (опционально) |
| `AIRTABLE_TOKEN` | Personal Access Token со scope на нужную базу, права `data.records:read` + `data.records:write` |
| ID базы Airtable | `app...` |
| ID таблицы «Лог питания» | `tbl...` |
| ID таблицы «Сохранённые блюда» | `tbl...` |
| Дневная норма | ккал, по умолчанию 2000 |

### Таблицы Airtable
**Лог питания:** Блюдо (text, primary), Дата (date YYYY-MM-DD), Время (text),
Ккал (number), Белки/Жиры/Углеводы (number), Источник (singleSelect: фото /
сохранённое / вручную).

**Сохранённые блюда:** Название (text, primary), Эмодзи (text), Ккал (number),
Белки/Жиры/Углеводы (number), Использований (number).

5 дефолтных блюд создаются автоматически при первом запуске, если таблица пуста.

## Деплой (GitHub Pages)
`base` в `vite.config.js` = `/ftrack/`. В Settings → Pages выбрать источник
**GitHub Actions**. Пуш в `main` запускает `.github/workflows/deploy.yml`.

## Реализовано (MVP)
Настройки, Airtable CRUD, вкладки Сегодня / Сохранённые / История, фото-анализ,
оптимистичные обновления, офлайн-очередь, PWA-манифест + service worker, CI.

## Заметки по архитектуре
- iPhone-фото ужимаются и переэнкодятся в JPEG (`services/image.js`) — решает
  HEIC и большой вес перед отправкой в Anthropic.
- Запись в лог оптимистична: сразу в UI, затем в Airtable; при офлайне — в
  очередь `kcal_offline_queue`, досыл при восстановлении сети.
- `ANTHROPIC_API_KEY` уходит из браузера напрямую в API
  (`anthropic-dangerous-direct-browser-access`). Для персонального девайса ок,
  но ключ виден в devtools этого устройства.
