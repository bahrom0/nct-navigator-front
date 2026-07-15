# Stage 3. Core, Search и продуктовые улучшения

## Цель

Собрать локальную опубликованную версию базы, поисковый слой и список продуктовых функций, которые делают проект ближе к НЦТ/ММТ. На этом этапе приложение ещё может читать JSON export, Supabase всё ещё не является источником.

## Вход

```text
data/core/ntc/draft_core.json
data/reports/ntc/field_evidence.json
data/reports/ntc/review_issues.json
data/reports/ntc/quality_report.json
```

## Выход

```text
data/core/ntc/releases/
data/search/ntc/
data/exports/ntc/
data/reports/ntc/product_features.md
```

## Core-модель

Основная сущность - `admission_offer`.

```ts
type AdmissionOffer = {
  id: string
  stable_key: string
  dedupe_key: string
  release_id: string
  source_row_ids: string[]
  academic_year: string
  admission_period: string
  education_level: "after_9" | "after_11"
  cluster_number: 1 | 2 | 3 | 4 | 5
  cluster_name_tg: string | null
  cluster_name_ru: string | null
  specialty_code: string
  specialty_name_tg: string | null
  specialty_name_ru: string | null
  specialty_name_original: string
  institution_id: string
  institution_name: string
  campus_id: string
  campus_name: string | null
  city_id: string | null
  city_name: string | null
  region_id: string | null
  education_form: "очная" | "заочная" | "дистанционная" | null
  education_type: "бесплатный" | "платный" | null
  tuition_fee: number | null
  languages: string[]
  admission_plan: number | null
  official_status: "published" | "needs_review" | "excluded"
  confidence_summary: {
    min_field_confidence: number
    source_count: number
    has_conflicts: boolean
  }
}
```

## Stable key

UUID можно использовать для внутреннего ID, но для повторной сборки нужен стабильный ключ.

Правило:

1. Если есть официальный `nct_row_id`, stable key:

```text
nct:<academic_year>:<period>:<nct_row_id>
```

2. Если official row id нет:

```text
nct:<academic_year>:<period>:<level>:<cluster>:<code>:<campus_key>:<form>:<type>:<language_set_hash>
```

`dedupe_key` строится отдельно и нужен только для поиска дублей.

## Release

Создать локальный release manifest:

```ts
type DataRelease = {
  release_id: string
  academic_year: string
  admission_period: string
  status: "draft" | "validation" | "published" | "rejected"
  source_document_ids: string[]
  record_count: number
  review_issue_count: number
  quality_report_path: string
  created_at: string
  published_at: string | null
}
```

Публиковать можно только строки:

- с `official_status = published`;
- без критических review issues;
- с источником;
- с валидным stable key.

## Export

Сформировать:

```text
data/exports/ntc/nct_admission_offers.published.json
data/exports/ntc/nct_admission_offers.published.csv
data/exports/ntc/nct_reference_tables.json
data/exports/ntc/nct_release_manifest.json
```

JSON export нужен, чтобы приложение можно было подключить до Supabase.

## Search layer

Search пересобирается из Core и не меняет официальные данные.

Создать:

```ts
buildSearchDocuments(offers: AdmissionOffer[], references: ReferenceData): SearchDocument[]
```

Search document:

```ts
type SearchDocument = {
  admission_offer_id: string
  stable_key: string
  code: string
  title: string
  institution: string
  campus: string | null
  city: string | null
  cluster: number
  education_level: "after_9" | "after_11"
  education_form: string | null
  education_type: string | null
  languages: string[]
  admission_plan: number | null
  search_text: string
  normalized_text: string
  keywords: string[]
  synonyms: string[]
  profession_ids: string[]
  taxonomy_node_ids: string[]
  source_confidence: number
}
```

## Keywords и synonyms

Создать функции:

```ts
generateSpecialtyKeywords(offer: AdmissionOffer): string[]
generateInstitutionSynonyms(institution: Institution): string[]
generateCitySynonyms(city: City): string[]
generateTransliterations(text: string): string[]
```

Правила:

- official fields не менять;
- keywords/synonyms хранить как производные данные;
- AI может предлагать keywords, но они должны быть помечены `mapping_method = ai_suggested`;
- пользовательский поиск не должен отправлять весь список кодов в LLM.

## Профессии и направления

Создать:

```ts
mapSpecialtyToTaxonomy(specialty: Specialty): TaxonomyMapping[]
mapSpecialtyToProfessions(specialty: Specialty): ProfessionMapping[]
```

Каждая связь:

- `relevance_score`;
- `mapping_method`: `rule`, `taxonomy`, `ai_suggested`, `manual`;
- `review_status`.

Важно:

- Связь с профессиями не является официальным фактом НЦТ.
- Она нужна только для рекомендаций и объяснений.

## Улучшения продукта

Добавить в roadmap проекта:

1. НЦТ-карта поступления:
   - кластер;
   - экзамены;
   - код;
   - вуз;
   - город;
   - форма;
   - бюджет/платно;
   - план.

2. Фильтр "реально доступно мне":
   - после 9/11;
   - город;
   - язык;
   - форма обучения;
   - бюджет/платно;
   - кластер;
   - стоимость.

3. Объяснение рекомендации:
   - почему выбран код;
   - какие экзамены;
   - какие источники;
   - какой уровень confidence;
   - какие есть спорные поля.

4. Симулятор комбинаций:
   - список выбранных кодов;
   - запасные варианты;
   - риск по городу/стоимости/плану;
   - похожие варианты в других городах.

5. ММТ/НЦТ timeline:
   - регистрация;
   - приглашение;
   - экзамены;
   - результаты;
   - апелляция;
   - конкурс распределения.

6. "Худро бисанҷ":
   - мини-диагностика по предметам кластера;
   - связь слабых предметов с планом подготовки;
   - рекомендации кодов с учётом предметов.

7. Страница источника записи:
   - открыть source row;
   - показать PDF page/HTML row;
   - показать evidence и confidence.

8. Админ-аудит:
   - список `review_issues`;
   - фильтры по типу ошибки;
   - подтверждение/отклонение исправлений.

## Локальная интеграция приложения

До Supabase можно сделать временный адаптер:

```ts
loadPublishedNctDataset(): Promise<AdmissionOffer[]>
searchPublishedNctOffers(input: SearchInput): Promise<SearchResult[]>
getNctOfferSource(stableKey: string): Promise<FieldEvidence[]>
```

Цель - проверить, что новая база улучшает рекомендации, не ломая приложение.

## Проверки Stage 3

- published export не содержит `needs_review`.
- Search documents пересобираются из Core.
- Stable keys не меняются при повторной сборке.
- Приложение может читать export без Supabase.
- Legacy compare показывает, что старые записи не потеряны без объяснения.
- Отчёт по Худжанду доступен рядом с export.

## Критерии готовности Stage 3

- Есть опубликованный локальный release.
- Есть JSON/CSV export.
- Есть search index.
- Есть список продуктовых функций.
- Есть адаптер приложения к published export.
- Можно переходить к Supabase без изменения смысла данных.
