# MVP Context And Execution Order

## Purpose

This folder is the handoff plan for replacing the NCT recommendation/search logic with a production-safe MVP.

When starting from a fresh AI context, read these files in order:

1. `00_MVP_CONTEXT_AND_EXECUTION_ORDER.md`
2. `01_PHASE_1_HARD_FILTERS_AND_DEDUPE.md`
3. `02_PHASE_2_PROFESSION_CATALOG.md`
4. `03_PHASE_3_AI_RERANK_EVALUATION_AND_ROLLOUT.md`

Do not jump straight into coding before reading all four files.

## Current Product Problem

The current search can show wrong-city results and repeated specialty-family cards.

Known root cause from current code inspection:

- `backend/src/lib/recommendations/service.ts` passes `studyCity` into the first candidate search.
- The expanded fallback search then sets `studyCity: undefined`.
- That means a user can select Khujand and still see Dushanbe if the fallback expands silently.

This must be treated as a pipeline contract bug, not a UI bug.

## Production Contract

The new MVP must follow this contract:

- AI may analyze interests and rerank a shortlist.
- AI must never invent NCT codes, institutions, clusters, cities, or profession keys.
- City and education level are hard filters.
- Hard filters must run before scoring and before AI reranking.
- Wrong-city candidates must be impossible unless the user explicitly enables city expansion.
- The system must not send the whole NCT database to AI.
- The existing API shape should remain compatible unless a file explicitly says otherwise.
- The existing canonical recommendation flow must stay intact:
  - onboarding/categories
  - `/api/recommendations`
  - recommendation cards
  - goal selection
  - plan/coach context

## MVP Scope

This MVP is intentionally smaller than the full profession-first roadmap.

The MVP includes:

- canonical city normalization
- strict city and education hard filters
- no hidden fallback to another city
- specialty-family dedupe
- minimal profession catalog
- profession-to-specialty linking
- AI rerank only over allowed local candidates
- golden evaluation cases
- diagnostics for debugging recommendation quality

The MVP does not include:

- Supabase pgvector
- external vector DB
- internet search
- scraping
- ML model training
- salary prediction
- automatic generation of production catalog entries
- many AI calls per request

## Existing Files To Inspect First

Before implementation, inspect the current files:

- `backend/src/lib/recommendations/service.ts`
- `backend/src/lib/ai/analyze-interest-profile.ts`
- `backend/src/lib/ai/finalize-recommendations.ts`
- `backend/src/lib/ai/nct-match.ts`
- `backend/src/lib/ai/rank-nct.ts`
- `backend/src/lib/search/engine.ts`
- `backend/src/lib/search/normalize.ts`
- `backend/src/lib/search/taxonomy.ts`
- `backend/src/lib/db/nct-db.ts`
- `backend/src/lib/db/indexer.ts`
- `backend/src/lib/db/types.ts`
- `backend/src/types/nct.ts`
- `backend/src/types/api/recommendations.ts`
- `backend/src/types/recommendations.ts`
- recommendation card UI files that consume `ranked` and `matches`

Use the actual current paths in the repo. If files have moved, adapt while preserving the same responsibilities.

## Migration Rule

Do not create a second product flow.

The new MVP should replace the internals of the recommendation pipeline while preserving the outer API contract where possible.

Recommended migration style:

1. Add new small modules.
2. Wire them into `buildRecommendations`.
3. Preserve response shape through a mapper.
4. Add diagnostics to `decisionContext.pipeline` or a dev-only debug field.
5. Keep old engine only as explicit rollback/comparison, not as a silent fallback.

## Definition Of Done For The MVP

The MVP is done only when:

- Khujand input cannot produce Dushanbe results under strict city mode.
- Education level filtering happens before scoring.
- Top results avoid duplicate specialty families when alternatives exist.
- AI receives only a local shortlist.
- AI unknown keys/candidates are rejected.
- Local fallback works if AI fails.
- Golden evaluation cases pass.
- `npm.cmd run build` passes.

