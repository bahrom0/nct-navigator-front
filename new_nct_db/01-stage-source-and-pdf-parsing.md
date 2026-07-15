# Stage 1. Источники и парсинг PDF/HTML

## Цель

Построить локальный, воспроизводимый слой Raw + Staging. На этом этапе мы ничего не нормализуем окончательно и не исправляем данные вручную. Задача - достать максимум фактов из официальных источников и сохранить доказательства происхождения каждой строки.

## Входные источники

Локальные PDF:

- `pdf/11_class_all.pdf`
- `pdf/9_class.pdf`

Официальные источники:

- `https://ntc.tj/tj/ba-dovtalab/nakshai-kabul.html`
- `https://stat.ntc.tj/Y26/RPlan`
- `https://spec.ntc.tj/`
- `https://ntc.tj/tj/elon1-3.html`
- `https://ntc.tj/tj/ba-dovtalab/muassisaho.html`
- `https://ntc.tj/tj/ba-dovtalab/rohnamoi-dovtalab.html`

Старые базы:

- `src/data/new_db.json`
- `src/data/nct-codes.json`

Старые базы читаются только в режиме `legacy_compare`.

## Выходные папки

```text
data/raw/ntc/
data/staging/ntc/
data/reports/ntc/
```

## Source inventory

Создать функцию:

```ts
inventorySources(input: SourceInput[]): SourceInventory
```

Она должна собрать:

- `source_id`;
- `source_type`: `official_html`, `official_pdf`, `local_pdf`, `legacy_json`;
- `title`;
- `url`;
- `local_path`;
- `academic_year`;
- `admission_period`;
- `education_level`;
- `language`;
- `page_count`;
- `checksum`;
- `downloaded_at`;
- `is_official`;
- `completeness`: `full_plan`, `period_plan`, `remaining_seats`, `guide`, `institution_list`, `unknown`;
- `notes`.

Особое правило:

- `pdf/11_class_all.pdf` пометить как `academic_year = 2025`, `admission_period = fourth_or_remaining_seats`, `completeness = remaining_seats`.
- `pdf/9_class.pdf` пометить как `academic_year = 2026-2027`, `admission_period = first`, `education_level = after_9`.

## Raw snapshots

Создать функции:

```ts
saveRawPdfSnapshot(source: SourceInventoryItem): RawDocument
saveRawHtmlSnapshot(source: SourceInventoryItem): RawDocument
saveLegacySnapshot(path: string): RawDocument
```

Каждый snapshot сохраняет:

- исходный файл/HTML без изменений;
- checksum;
- дату загрузки;
- HTTP metadata, если источник онлайн;
- ссылку на локальный файл.

Raw-файлы после сохранения не редактировать.

## HTML parser

Основная цель HTML parser - официальный `stat.ntc.tj/Y26/RPlan`.

Создать функцию:

```ts
parseOfficialStatPlan(rawHtml: RawDocument): StagingRow[]
```

Ожидаемые поля строки:

- `nct_row_id`;
- `cluster_raw`;
- `institution_raw`;
- `specialty_code_raw`;
- `specialty_name_raw`;
- `education_form_raw`;
- `education_type_raw`;
- `tuition_fee_raw`;
- `language_raw`;
- `admission_plan_raw`;
- `education_level_raw`;
- `source_row_id`;
- `parse_status`.

Важно:

- HTML parser считается приоритетнее PDF parser, если данные структурированы.
- Если страница пагинированная, parser должен пройти все страницы и сохранить номер страницы HTML.
- Если есть фильтры/скрипты, сначала определить, есть ли скрытый JSON/API endpoint. Если нет - парсить HTML таблицу.

## PDF parser: общий подход

Обычный `extract_text()` нельзя использовать как основной метод для таблиц. Он нужен только для диагностики.

Основной parser должен работать через координаты:

1. получить слова/блоки с координатами;
2. определить границы колонок по заголовку;
3. определить строки по y-координатам;
4. собрать многострочные ячейки;
5. проверить порядок колонок;
6. сохранить raw text и confidence parsing.

Создать функции:

```ts
extractPdfPageWords(pdfPath: string, pageNumber: number): PdfWord[]
detectPdfTableLayout(words: PdfWord[], profile: PdfLayoutProfile): PdfTableLayout
extractPdfRows(words: PdfWord[], layout: PdfTableLayout): PdfRawRow[]
mergeMultilineCells(rows: PdfRawRow[], layout: PdfTableLayout): PdfRawRow[]
parsePdfAdmissionRows(source: RawDocument): StagingRow[]
```

## PDF layout profiles

Нужны отдельные профили, потому что PDF отличаются языком и форматом.

```ts
type PdfLayoutProfile =
  | "after_11_ru_remaining_seats_2025"
  | "after_9_tg_full_plan_2026"
  | "unknown"
```

Для каждого profile хранить:

- ожидаемые заголовки;
- порядок колонок;
- диапазон страниц с таблицами;
- страницы, которые являются содержанием/справочником и не парсятся как admission rows;
- признаки начала нового кластера;
- признаки смены типа учреждения.

## Поля, которые должен извлекать PDF parser

Минимум:

- `source_document_id`;
- `source_page`;
- `source_row_number`;
- `raw_text`;
- `raw_fields`;
- `cluster_raw`;
- `institution_raw`;
- `location_raw`;
- `specialty_code_raw`;
- `specialty_name_raw`;
- `education_form_raw`;
- `education_type_raw`;
- `tuition_fee_raw`;
- `language_raw`;
- `admission_plan_raw`;
- `education_level_raw`;
- `parse_warnings`.

## Правила для склеенных строк

Parser не должен молча исправлять строки. Он должен:

1. сохранить исходный raw текст;
2. попытаться разложить по колонкам;
3. если видит склейку, поставить warning;
4. сохранить вероятное исправление отдельно в `parsed_fields`;
5. передать строку в Stage 2 для нормализации и review.

Примеры warning:

- `location_contains_education_form`;
- `institution_contains_location`;
- `specialty_split_into_institution`;
- `missing_location`;
- `missing_admission_plan`;
- `unrecognized_language`;
- `row_shift_suspected`;
- `page_layout_changed`.

## Staging schema

Локальный staging-файл:

```text
data/staging/ntc/staging_rows.jsonl
```

Одна строка:

```ts
type StagingRow = {
  staging_row_id: string
  source_document_id: string
  source_row_id: string
  source_kind: "official_html" | "official_pdf" | "local_pdf" | "legacy_json"
  academic_year: string | null
  admission_period: string | null
  education_level: "after_9" | "after_11" | null
  source_page: number | null
  source_row_number: number | null
  raw_text: string
  raw_fields: Record<string, unknown>
  parsed_fields: {
    nct_row_id?: string | null
    cluster?: string | null
    institution?: string | null
    location?: string | null
    specialty_code?: string | null
    specialty_name?: string | null
    education_form?: string | null
    education_type?: string | null
    tuition_fee?: string | null
    language?: string | null
    admission_plan?: string | null
  }
  parse_status: "ok" | "warning" | "incomplete" | "error"
  parse_warnings: string[]
  parser_version: string
  processed_at: string
}
```

## Отчёты Stage 1

Создать:

```text
data/reports/ntc/source_inventory.json
data/reports/ntc/parser_coverage.json
data/reports/ntc/parser_warnings.json
data/reports/ntc/pdf_page_samples/
```

`parser_coverage.json` должен показывать:

- сколько строк извлечено из каждого источника;
- сколько строк `ok`, `warning`, `incomplete`, `error`;
- какие страницы PDF дали больше всего warning;
- сколько строк после 9 и после 11 класса;
- сколько строк по каждому кластеру.

## Критерии готовности Stage 1

- Все источники имеют checksum и metadata.
- PDF parser сохраняет координатный raw/staging, а не только plain text.
- HTML parser извлекает official stat rows или явно пишет, почему не смог.
- Все ошибки парсинга сохранены в staging, а не потеряны.
- Есть отчёт покрытия по источникам и страницам.
