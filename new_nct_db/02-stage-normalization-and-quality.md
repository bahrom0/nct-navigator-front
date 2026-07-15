# Stage 2. Нормализация и проверка качества

## Цель

Преобразовать staging rows в проверяемые нормализованные сущности, не теряя исходные значения и не придумывая отсутствующие данные. Все спорные места должны попасть в `review_issues`.

## Вход

```text
data/staging/ntc/staging_rows.jsonl
data/reports/ntc/source_inventory.json
```

## Выход

```text
data/core/ntc/draft_core.json
data/reports/ntc/normalization_issues.json
data/reports/ntc/field_evidence.json
data/reports/ntc/khujand_report.json
data/reports/ntc/quality_report.json
```

## Нормализация справочников

Создать справочники:

- `cities`;
- `regions`;
- `institutions`;
- `institution_campuses`;
- `institution_aliases`;
- `specialties`;
- `clusters`;
- `languages`;
- `education_forms`;
- `education_types`.

Локально они могут храниться как JSON до Supabase:

```text
data/core/ntc/reference/cities.json
data/core/ntc/reference/institutions.json
data/core/ntc/reference/institution_campuses.json
data/core/ntc/reference/specialties.json
```

## Функции нормализации

```ts
normalizeCity(raw: string | null, context: NormalizationContext): NormalizedField
normalizeInstitution(raw: string | null, context: NormalizationContext): NormalizedField
normalizeCampus(institution: NormalizedField, location: NormalizedField, context: NormalizationContext): NormalizedField
normalizeSpecialtyCode(raw: string | null): NormalizedField
normalizeSpecialtyName(raw: string | null, context: NormalizationContext): NormalizedField
normalizeEducationForm(raw: string | null): NormalizedField
normalizeEducationType(raw: string | null): NormalizedField
normalizeTuitionFee(raw: string | null): NormalizedField
normalizeLanguage(raw: string | null): NormalizedField<string[]>
normalizeAdmissionPlan(raw: string | null): NormalizedField<number | null>
normalizeCluster(raw: string | null, context: NormalizationContext): NormalizedField
```

`NormalizedField`:

```ts
type NormalizedField<T = string | number | null> = {
  raw_value: unknown
  normalized_value: T
  confidence: number
  method: "direct" | "dictionary" | "alias" | "parsed" | "inferred" | "manual" | "unknown"
  source_row_id: string
  warnings: string[]
}
```

## Правила городов

Приоритет:

1. официальное поле места обучения;
2. официальный филиал/кампус;
3. адрес из официального перечня учреждений;
4. город в названии учреждения;
5. старый JSON только для сравнения, не для подтверждения.

Город из названия учреждения получает `confidence <= 0.50` и `review_status = needs_review`.

Примеры:

- `Донишкадаи ... дар шаҳри Хуҷанд` - город найден в названии, но требуется подтверждение кампуса.
- `Коллеҷи тиббии шаҳри Хуҷанд ба номи Ю. Б. Исҳоқӣ Хуҷанд` - вероятно Худжанд, но нужно отделить город от названия.
- `город Турсунзаде заочная` - это ошибка сдвига колонок; город = `Турсунзаде`, форма = `заочная`, запись в review.

## Правила учреждений и филиалов

- Главный вуз и филиал не объединять в одну сущность.
- Если источник говорит `дар шаҳри Хуҷанд`, это отдельный campus/branch.
- Если город приписан в конец названия, не удалять его без evidence.
- Хранить `official_name_tg`, `official_name_ru`, `normalized_name`, `aliases`.

## Правила специальностей

- Код специальности не уникален для предложения поступления.
- Одинаковая специальность в разных вузах, городах, формах, языках или периодах - разные `admission_offers`.
- Разные коды одной похожей специальности не объединять.
- Переносы строк внутри названия исправлять только как нормализованное поле, сохраняя original.

## Восстановление потерянных колонок

Создать функцию:

```ts
repairShiftedColumns(row: StagingRow): RepairCandidate
```

Она должна искать типовые ошибки:

- форма обучения попала в `location`;
- стоимость попала в `education_type`;
- язык и план попали в `university_name`;
- часть specialty попала в `institution`;
- город стоит в конце `institution`.

Результат:

```ts
type RepairCandidate = {
  staging_row_id: string
  proposed_fields: Record<string, unknown>
  confidence: number
  warnings: string[]
  requires_review: boolean
}
```

Правило:

- Если `confidence < 0.85`, автоматом не публиковать без review.
- Если исправление меняет город, вуз, код, план, цену или язык - создать `review_issue`.

## Evidence

Создать `field_evidence` для каждого важного поля:

- code;
- specialty_name;
- institution;
- campus/location;
- city;
- education_form;
- education_type;
- tuition_fee;
- language;
- admission_plan;
- cluster;
- education_level;
- academic_year;
- admission_period.

Формат локального файла:

```ts
type FieldEvidence = {
  entity_type: "admission_offer" | "institution" | "campus" | "specialty"
  entity_stable_key: string
  field_name: string
  raw_value: unknown
  normalized_value: unknown
  source_row_id: string
  source_document_id: string
  confidence: number
  verification_method: string
  warnings: string[]
}
```

## Review issues

Создать:

```text
data/reports/ntc/review_issues.json
```

Типы issues:

- `missing_required_field`;
- `unknown_city`;
- `city_inferred_from_name`;
- `institution_location_conflict`;
- `shifted_columns`;
- `specialty_split`;
- `duplicate_candidate`;
- `source_conflict`;
- `year_period_mismatch`;
- `legacy_only_record`;
- `low_confidence_field`.

## Отчёт по Худжанду

Создать:

```text
data/reports/ntc/khujand_report.json
data/reports/ntc/khujand_report.md
```

Секции:

1. confirmed Khujand by official location;
2. confirmed Khujand by official campus;
3. probable Khujand by institution name;
4. unresolved Khujand candidates;
5. records excluded from Khujand because city was not confirmed;
6. count by institution/campus;
7. count by education level;
8. count by cluster;
9. paid/free counts;
10. top parsing problems affecting Khujand.

Записи, где Худжанд найден только в тексте названия, не считать подтверждёнными.

## Legacy compare

Создать функцию:

```ts
compareWithLegacy(coreDraft: CoreDraft, legacyFiles: string[]): LegacyCompareReport
```

Она должна показать:

- записи, которые были в старой базе и подтверждены официальным источником;
- записи, которые были в старой базе, но не найдены в новых источниках;
- записи, которых не было в старой базе;
- где старый город/вуз/специальность расходятся с официальным источником;
- почему Худжанд в старой базе мог быть недосчитан.

Важно:

- legacy compare не переносит данные в Core.
- Он только создаёт отчёт.

## Quality gates

Перед Stage 3 должны пройти проверки:

- нет опубликованных записей без source row;
- нет published строк с `confidence < 0.50` для официальных полей;
- все `unknown_city` вынесены в review;
- все строки с year/period mismatch исключены из текущего release;
- количество строк Raw -> Staging -> Core объяснимо;
- у каждого `admission_offer` есть stable key;
- нет точных дублей по stable/dedupe key;
- есть отдельный отчёт по Худжанду.

## Критерии готовности Stage 2

- Нормализаторы работают по справочникам и алиасам.
- Исправления склеенных строк сохраняют original + evidence.
- Неуверенные значения не публикуются молча.
- Старые базы использованы только для отчёта сравнения.
- Сформирован draft Core и полный quality report.
