# NCT Navigator — базовая информация для олимпиады "Илм Фуруги Маърифат"

## Общие данные
- Название проекта: mmt-navigator (NCT Navigator)
- Версия: 0.1.0
- Язык: TypeScript (типизированный JavaScript)
- Публикация: Vercel (devDependencies содержит `vercel`; README с ссылкой на Vercel deploy)
- Лицензия/репозиторий: приватный (`"private": true` в package.json), Git-репо
- Дата сбора информации: 2026-07-19

## Технологический стек (веб-версия)
- Фреймворк: Next.js 16.2.7 (App Router)
- UI-библиотека: React 19.2.4
- Стили: Tailwind CSS 4 (`@tailwindcss/postcss`), PostCSS
- Состояние: Zustand 5.0.14
- Формы/валидация: React Hook Form 7.78.0, Zod 4.4.3
- Анимации: Framer Motion 12.40.0
- Иконки: Lucide React 1.17.0
- Уведомления: Sonner 2.0.7
- PDF-обработка: pdfjs-dist 6.1.200 (в devDependencies)
- Типы: TypeScript 5
- Линтер: ESLint 9 (`eslint-config-next`)
- Форматирование: Prettier 3.8.4 (`prettier-plugin-tailwindcss`)
- Деплой: Vercel CLI 54.14.0

## Размеры и метрики кода
- Всего строк в репозитории: ~53 639
- Фронтенд (`src/`): ~1 243 строки
- Файлов в `src/app/`: ~16 страниц/маршрутов + `layout.tsx`, `globals.css`, `error.tsx`, `favicon.ico`
- Компонентов в `src/components/`: минимум (`app-shell.tsx`, `coach/CoachShell.tsx`, `coach/CoachRoadmap.tsx`)
- Зависимостей в `package.json`: 10 основных + 14 devDependencies
- Бэкенд: отдельная директория `backend/` (не анализировался по заданию)

## Архитектура (только веб-часть)
- `src/app/` — App Router (Next.js 16):
  - `recommendations/page.tsx` — подбор вузов
  - `interview/page.tsx` — интервью/подготовка
  - `plan/page.tsx` — план поступления
  - `coach/page.tsx` — коучинг
  - `dashboard/page.tsx` — панель
  - `auth/page.tsx` — авторизация
  - `categories/page.tsx` — категории
  - `features/page.tsx`, `fit-score/`, `how-it-works/`, `strategy/`, `teacher/`, `chat/`, `explain/`, `analyze/`, `onboarding/`
- `src/components/app-shell.tsx` — общий каркас приложения
- `src/components/coach/` — компоненты коуча (`CoachShell`, `CoachRoadmap`)
- `public/` — статические файлы
- `data/`, `pdf/` — источники данных NCT (национальные тесты Таджикистана)
- `scripts/nct_db/` — пайплайн обработки NCT данных: `stage1.mjs`, `stage2.mjs`, `stage3.mjs` + верификация
- Исключено из анализа: `mobile_version_md/` (не доработано) и `new_nct_db/` (по заданию)

## Суть проекта
NCT Navigator — веб-приложение для абитуриентов Таджикистана, которое:
1. Анализирует результаты национальных тестов (NCT — National Center for Testing)
2. Подбирает подходящие вузы и специальности (`recommendations`)
3. Формирует индивидуальный план поступления (`plan`)
4. Предоставляет коучинг и подготовку к интервью (`coach`, `interview`)
5. Показывает стратегию и анализ (`strategy`, `analyze`, `fit-score`)

## Новизна / отличие
- Использование реальных данных таджикских национальных тестов (NCT) в открытом веб-интерфейсе
- Интеграция подбора вузов + план поступления + коучинг в едином приложении
- Наличие специализированного пайплайна (`scripts/nct_db/`) для обработки официальных NCT-документов (PDF) и построения базы данных
- Фокус на таджикский образовательный контекст (не универсальный западный аналог)

## Публикация и доступ
- Локальный запуск: `npm run dev` (Next.js dev server на `localhost:3000`)
- Деплой: Vercel (рекомендуемый в README и через `vercel` CLI)
- Бэкенд запускается отдельно: `npm --prefix backend run dev`
- Полный пайплайн NCT-обработки запускается через npm scripts (`nct:stage1`, `nct:stage2`, `nct:stage3`)

## Примечания для выступления
- Не включать мобильную версию (`mobile_version_md/`) в презентацию — она не доработана
- Не ссылаться на `new_nct_db/` — это отдельный недоработанный компонент
- Основной акцент: веб-приложение подбора вузов на базе реальных NCT-данных
- Для вопросов по архитектуре готов ответить по `App Router`, `Zustand`, `Tailwind CSS 4`, `pdfjs-dist`
