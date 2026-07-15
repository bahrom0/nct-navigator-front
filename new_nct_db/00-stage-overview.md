# Новый план действий для базы НЦТ

Дата: 2026-07-15

## Главный принцип

Сначала строим воспроизводимый локальный pipeline, который умеет:

1. сохранять официальные источники;
2. парсить PDF/HTML в staging;
3. нормализовать поля;
4. находить ошибки и спорные записи;
5. собирать опубликованный экспорт;
6. сравнивать результат со старой базой.

Supabase подключаем последним, когда структура данных уже подтверждена реальными строками НЦТ и отчётами качества.

## Что не делаем в начале

- Не заменяем сразу `src/data/new_db.json`.
- Не используем старую базу как источник истины.
- Не отправляем данные в Supabase до прохождения локальных проверок.
- Не исправляем официальные поля нейросетью без источника.
- Не объединяем разные предложения поступления только потому, что у них одинаковый код специальности.

## Рабочие Stage-файлы

1. `01-stage-source-and-pdf-parsing.md`
   - источники;
   - raw snapshots;
   - HTML parser;
   - координатный PDF parser;
   - staging schema;
   - функции извлечения полей из PDF.

2. `02-stage-normalization-and-quality.md`
   - нормализация городов, вузов, филиалов, специальностей;
   - восстановление потерянных колонок;
   - confidence/evidence;
   - отчёт проблем;
   - отдельный отчёт по Худжанду.

3. `03-stage-core-search-and-product.md`
   - Core-модель;
   - stable keys;
   - search layer;
   - профессии, направления, keywords, synonyms;
   - функции продукта, связанные с НЦТ/ММТ;
   - локальный JSON/CSV export.

4. `04-stage-supabase-and-integration.md`
   - миграции Supabase;
   - RLS и доступы;
   - API приложения;
   - импорт опубликованного release;
   - переключение приложения с JSON на Supabase;
   - откат и обновления.

## Целевая структура папки

```text
new_nct_db/
  00-stage-overview.md
  01-stage-source-and-pdf-parsing.md
  02-stage-normalization-and-quality.md
  03-stage-core-search-and-product.md
  04-stage-supabase-and-integration.md
```

## Минимальный результат первой итерации

Первая полноценная итерация должна дать не Supabase, а проверенный локальный результат:

```text
data/raw/ntc/
data/staging/ntc/
data/core/ntc/
data/reports/ntc/
data/exports/ntc/
```

И файлы:

```text
data/reports/ntc/source_inventory.json
data/reports/ntc/parsing_quality.json
data/reports/ntc/normalization_issues.json
data/reports/ntc/khujand_report.json
data/reports/ntc/legacy_compare.json
data/exports/ntc/nct_admission_offers.published.json
```

## Общий порядок реализации

1. Stage 1: собрать источники и staging.
2. Stage 2: нормализовать и проверить качество.
3. Stage 3: собрать Core/Search/export и продуктовые улучшения.
4. Stage 4: только после этого перенести опубликованный release в Supabase.

## Критерии, что можно переходить к Supabase

- У каждой опубликованной записи есть источник.
- Нет смешения 2025/2026-2027 и разных периодов регистрации.
- Все пустые или спорные поля попали в отчёт.
- Худжанд проверен отдельно.
- Старый `new_db.json` использован только для comparison.
- Локальный export повторно собирается с теми же stable keys.
- Приложение может временно читать published JSON export до подключения Supabase.
