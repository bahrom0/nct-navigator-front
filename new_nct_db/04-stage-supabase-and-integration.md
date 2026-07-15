# Stage 4. Supabase и интеграция приложения

## Цель

Перенести уже проверенный published release в Supabase/PostgreSQL, не меняя смысл данных. Supabase - финальный слой хранения и API, а не место, где мы впервые выясняем структуру базы.

## Перед началом Stage 4

Должно быть готово:

```text
data/exports/ntc/nct_admission_offers.published.json
data/exports/ntc/nct_reference_tables.json
data/exports/ntc/nct_release_manifest.json
data/reports/ntc/quality_report.json
data/reports/ntc/khujand_report.json
```

И должны пройти gates:

- нет критических `review_issues` в published release;
- все записи имеют source/evidence;
- stable keys повторяемые;
- приложение может читать локальный export;
- старый JSON использован только для compare.

## Supabase schema

Создать миграции только после проверки локального Core.

Основные таблицы:

- `nct_data_releases`;
- `nct_source_documents`;
- `nct_source_rows`;
- `nct_regions`;
- `nct_cities`;
- `nct_institutions`;
- `nct_institution_campuses`;
- `nct_institution_aliases`;
- `nct_specialties`;
- `nct_clusters`;
- `nct_languages`;
- `nct_admission_offers`;
- `nct_admission_offer_languages`;
- `nct_record_evidence`;
- `nct_field_evidence`;
- `nct_review_issues`;
- `nct_professions`;
- `nct_taxonomy_nodes`;
- `nct_specialty_professions`;
- `nct_search_documents`.

Префикс `nct_` нужен, чтобы не смешивать новую базу с существующими таблицами проекта.

## Важные поля Supabase

`nct_admission_offers`:

- `id uuid primary key`;
- `stable_key text unique not null`;
- `dedupe_key text not null`;
- `release_id uuid not null`;
- `specialty_id uuid not null`;
- `institution_campus_id uuid not null`;
- `cluster_id uuid not null`;
- `academic_year text not null`;
- `admission_period text not null`;
- `education_level text not null`;
- `education_form text`;
- `education_type text`;
- `tuition_fee integer`;
- `admission_plan integer`;
- `nct_row_id text`;
- `status text not null`;
- `confidence_summary jsonb not null`;
- `created_at timestamptz not null default now()`;
- `updated_at timestamptz not null default now()`.

Уникальность:

- `stable_key` - стабильная уникальность опубликованной записи;
- `dedupe_key + release_id` - проверка потенциальных дублей;
- `nct_row_id + release_id` - если `nct_row_id` есть.

## RLS и безопасность

В Supabase все таблицы в exposed schema должны иметь RLS.

Правило доступа:

- публичное приложение читает только published release;
- raw/staging/evidence/review доступно только admin/server;
- draft/validation releases не доступны публичному клиенту;
- frontend не получает service role key.

Минимальные политики:

1. Public read для published read-model/view.
2. Admin read/write для `review_issues`.
3. Server-only import для raw/staging/evidence.

Для views использовать `security_invoker = true`, если view доступна через API.

## Read models

Публичное приложение не должно читать raw/staging напрямую.

Создать read-model:

```sql
nct_public_admission_offers
```

Он должен возвращать только:

- published release;
- published offers;
- поля для поиска/фильтров/рекомендаций;
- source summary без внутренних raw payload.

Отдельно:

```sql
nct_public_filters
nct_public_cities
nct_public_institutions
nct_public_release_status
```

## Import pipeline

Создать локальную функцию:

```ts
importPublishedReleaseToSupabase(exportPath: string, options: ImportOptions): Promise<ImportReport>
```

Шаги:

1. проверить manifest;
2. создать `draft` release в Supabase;
3. импортировать справочники;
4. импортировать source documents/source rows;
5. импортировать specialties/institutions/campuses;
6. импортировать admission offers;
7. импортировать languages/evidence/search documents;
8. запустить validation queries;
9. если всё прошло - перевести release в `published`;
10. предыдущий release перевести в `archived`.

Важно:

- импорт должен быть идемпотентным по `stable_key`;
- нельзя публиковать release при критических ошибках;
- должен быть dry-run режим.

## API приложения

Публичные методы:

- `GET /api/nct/release`
- `GET /api/nct/offers`
- `GET /api/nct/filters`
- `GET /api/nct/cities`
- `GET /api/nct/institutions`
- `GET /api/nct/offers/:stableKey`
- `GET /api/nct/offers/:stableKey/source`
- `POST /api/nct/search`

Админские методы:

- `GET /api/admin/nct/review-issues`
- `PATCH /api/admin/nct/review-issues/:id`
- `GET /api/admin/nct/releases`
- `POST /api/admin/nct/releases/import`
- `POST /api/admin/nct/releases/:id/publish`
- `POST /api/admin/nct/releases/:id/archive`

## Переключение приложения

Порядок:

1. Добавить новый API рядом со старым JSON-путём.
2. Добавить feature flag:

```text
NCT_DATA_SOURCE=json_export|supabase
```

3. Сравнить результаты поиска по старому и новому источнику.
4. Проверить рекомендации по городам, особенно Худжанд.
5. Переключить production на Supabase только после сравнения.
6. Оставить JSON export как fallback.

## Проверки после импорта

SQL/автоматические проверки:

- количество offers в Supabase = количество published export;
- все offers имеют release;
- нет orphan language/evidence/search rows;
- public API не видит draft releases;
- public API не видит review issues;
- фильтр по Худжанду возвращает подтверждённые записи;
- source endpoint показывает evidence для записи;
- поиск по коду работает как exact/code query;
- поиск по профессии работает через search layer.

## Rollback

Rollback должен быть логическим:

1. выбрать предыдущий published release;
2. новый release перевести в `archived` или `rejected`;
3. public view/read model снова указывает на предыдущий release.

Физически удалять опубликованные данные нельзя без отдельного решения.

## Критерии готовности Stage 4

- Миграции созданы и применяются без ручных правок.
- RLS включён для всех таблиц в exposed schema.
- Public API видит только published data.
- Admin API видит review/draft data только с авторизацией.
- Import idempotent и поддерживает dry-run.
- Приложение переключается через feature flag.
- Есть fallback на JSON export.
- Supabase содержит тот же published release, что локальный export.
