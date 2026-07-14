# Phase 1: Hard Filters And Dedupe

## Goal

Fix the dangerous retrieval behavior first:

- wrong city results
- hidden city expansion
- weak city normalization
- repeated specialty-family cards in the top results

Do this before adding the profession catalog.

## Why This Phase Comes First

If the database filter is not strict, AI and scoring improvements will only rearrange bad candidates.

The first production invariant is:

> A candidate that violates hard filters must never reach scoring or AI reranking.

## Tasks

### 1. Add Canonical City Normalization

Create a focused city utility, recommended path:

- `backend/src/lib/search/city.ts`

Responsibilities:

- normalize raw city strings from user input and NCT records
- map known aliases to stable ids
- expose display labels
- detect unknown or ambiguous city values

Minimum city ids:

- `dushanbe`
- `khujand`
- `bokhtar`
- `kulob`
- `istaravshan`
- `panjakent`
- `vahdat`
- `tursunzoda`
- `hisor`
- `konibodom`
- `isfara`
- `unknown`

The alias map must include Russian, Tajik/Cyrillic, Latin, and common prefixes:

- `г. Худжанд`
- `ш. Хуҷанд`
- `Худжанд`
- `Хуҷанд`
- `Хучанд`
- `Khujand`
- `г. Душанбе`
- `ш. Душанбе`
- `Душанбе`
- `Dushanbe`

Do not use raw `includes` as the primary city check.

### 2. Make Search Filters Hard Gates

Current search scoring uses `facetScore`, but for city and education this is not enough.

Change the local search flow so that hard filters remove candidates before scoring.

Target behavior:

```ts
if (filters.city?.length) {
  docs = docs.filter((doc) => filters.city!.includes(doc.canonicalCityId))
}

if (filters.educationLevel?.length) {
  docs = docs.filter((doc) => filters.educationLevel!.includes(doc.educationLevel))
}
```

Keep soft scoring for non-hard preferences.

Hard by default:

- city
- education level
- valid NCT code
- non-empty specialty title
- non-empty institution

Soft by default:

- taxonomy branch
- interest tags
- admission plan
- language
- study form
- study type, unless the UI later makes it explicit

### 3. Remove Hidden City Expansion

Inspect `backend/src/lib/recommendations/service.ts`.

The expanded fallback currently must not set `studyCity: undefined` unless city expansion is explicitly requested.

Target rule:

- default `allowCityExpansion = false`
- if false, all candidate passes keep selected city
- if true, strict search runs first, then expanded search is labeled clearly

No candidate from another city may appear without an explicit diagnostic flag:

```ts
cityExpansion: {
  requested: true,
  reason: "not_enough_strict_candidates",
  originalCity: "khujand"
}
```

For MVP, do not expose city expansion unless the existing UI already supports it.

### 4. Add Specialty-Family Dedupe

Add normalized specialty family keys.

Recommended module:

- `backend/src/lib/search/specialty-family.ts`

Minimum families:

- `pharmacy`
- `nursing`
- `general_medicine`
- `dentistry`
- `lab_diagnostics`
- `public_health`
- `software`
- `information_systems`
- `informatics_teacher`
- `law`
- `economics`
- `accounting`
- `management`
- `engineering`
- `construction`
- `other`

Family should be derived from:

- specialty title
- taxonomy node
- aliases
- cluster

Top-result policy:

- max 1 item per family in top 3 when alternatives exist
- max 2 items per family in top 8
- exact duplicate key remains `code + institution + city`

### 5. Add Phase 1 Golden Tests

Add a lightweight evaluation script.

Recommended path:

- `backend/scripts/evaluate-recommendation-mvp.ts`

Minimum cases:

1. Medicine + Khujand:
   - `wrongCityRate = 0`
   - no Dushanbe result
   - no duplicate pharmacy family in top 3 if alternatives exist
2. Medicine + Dushanbe:
   - all results are Dushanbe
3. Unknown city:
   - controlled empty/validation result
   - no random fallback city
4. After 9:
   - no `after_11` records
5. After 11:
   - no `after_9` records

## Acceptance Criteria

Phase 1 is complete when:

- `studyCity` is never silently removed from fallback candidate search.
- city matching uses canonical ids, not loose raw string includes.
- wrong-city candidates are filtered before scoring.
- duplicate specialty-family cards are controlled.
- evaluation cases prove `wrongCityRate = 0`.
- `npm.cmd run build` passes.

## Do Not Do In Phase 1

- Do not build the full profession catalog yet.
- Do not add external embeddings.
- Do not change the UI flow unless required by response compatibility.
- Do not add internet search.
- Do not create a second recommendation endpoint unless it is temporary and clearly marked for comparison.

