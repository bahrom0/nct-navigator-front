# NCT Search Rebuild Plan

## Problem

The current recommendation pipeline already has the right high-level idea:

1. Analyze interests with AI.
2. Build a local NCT candidate pool.
3. Let AI rerank only the shortlist.

But the implementation still leaks bad candidates because hard constraints are mixed with soft ranking.

Confirmed current issue:

- `backend/src/lib/recommendations/service.ts` passes `studyCity` into the first NCT search pass.
- The expanded fallback pass explicitly sets `studyCity: undefined`.
- Result: when the first pass does not find enough candidates, the fallback can pull another city, such as Dushanbe, even when the user selected Khujand.

This is not a UI bug. It is a retrieval contract bug.

## Production Rule

Separate constraints from preferences:

- Hard constraints must never be relaxed silently.
- Soft preferences can influence scoring.
- AI can explain and rerank, but must not override hard filters or invent codes.

Hard constraints:

- study city, unless user explicitly chooses "any city"
- education level
- active admission year / verified dataset
- valid code and institution fields

Soft preferences:

- interests
- category names
- profession guesses
- taxonomy branch
- admission plan / competition level
- language, form, and study type unless explicitly selected as filters

## Target Pipeline

### Stage 0: Data Canonicalization

Create a normalized NCT catalog at startup/build time.

Each record should get derived fields:

- `canonicalCity`: controlled city id, for example `khujand`, `dushanbe`, `bokhtar`.
- `cityDisplay`: original safe display label.
- `canonicalEducationLevel`: `after_9` or `after_11`.
- `canonicalSpecialtyKey`: normalized specialty family, for example `pharmacy`, `nursing`, `dentistry`.
- `professionTags`: curated/local tags extracted from title, cluster, taxonomy, and aliases.
- `searchDocument`: compact text used only for local retrieval.
- `qualityFlags`: missing city, suspicious city, missing title, duplicate code, etc.

City matching should use a controlled dictionary, not raw includes:

- `Худжанд`, `Хуҷанд`, `Хучанд`, `Khujand`, `г. Худжанд`, `ш. Хуҷанд` -> `khujand`
- `Душанбе`, `Dushanbe`, `г. Душанбе`, `ш. Душанбе` -> `dushanbe`

Unknown or ambiguous cities should be quarantined from strict city searches unless explicitly allowed.

### Stage 1: AI Interest-to-Profession Planner

AI should not see NCT codes here.

Input:

- selected categories
- free interests
- user type
- education level
- selected city

Output must be strict JSON:

- `targetProfessions`: 5-10 profession families
- `positiveTags`: semantic tags
- `negativeTags`: things to avoid
- `preferredBranches`: taxonomy ids
- `mustHaveSignals`: short list of important signals
- `reasoning`: brief internal-facing explanation

Example for medicine:

- target professions: doctor, nurse, pharmacist, lab diagnostics, dentist, public health
- positive tags: biology, chemistry, care, diagnostics, pharmacy
- negative tags: unrelated law/economics unless user selected them

### Stage 2: Hard Filter Gate

Before scoring, reduce the database with strict filters:

```ts
records
  .filter(record => record.canonicalCity === selectedCity)
  .filter(record => record.canonicalEducationLevel === selectedEducationLevel)
  .filter(record => !record.qualityFlags.includes("invalid_city"))
```

If no candidates remain:

- do not silently switch city
- return a controlled empty-state result
- optionally show "No exact matches in Khujand; expand to nearby cities?" as an explicit user action

### Stage 3: Local Hybrid Retrieval

Run local scoring only inside the hard-filtered candidate set.

Use a weighted score:

- taxonomy score: 30-40%
- title/profession score: 25-30%
- semantic hash/vector score: 15-25%
- quality/admission score: 5-15%
- exact interest/tag hits: 10-15%

The current `backend/src/lib/search/engine.ts` can be reused, but filters must become candidate gates, not just facet-score inputs.

Important change:

- `collectCandidateIds` or `scoreDocument` should exclude non-matching hard filters before scoring.
- A wrong city should have score `0` and be removed, not just get lower `facetScore`.

### Stage 4: Diversity and Duplicate Control

Prevent the "two pharmacy cards" problem.

Use two levels of dedupe:

1. Exact candidate key: `code + institution + city`.
2. Specialty-family key: `canonicalSpecialtyKey + canonicalCity`.

Policy for top results:

- max 1 item per specialty family in top 3
- max 2 items per specialty family in top 8
- allow duplicates only when institution difference is the user-visible reason

For pharmacy in Khujand:

- one pharmacy card can appear high
- the second card should be replaced by nursing, lab diagnostics, dentistry, biology, or another adjacent medical route if available

### Stage 5: AI Shortlist Rerank

Send only 12-20 local candidates to AI.

AI receives:

- candidate key
- title
- institution
- city
- taxonomy path
- profession tags
- local score breakdown

AI must return:

- ranked candidate keys only
- fit score
- explanation
- matched interests
- risk notes

AI must not:

- add new codes
- change city
- select candidates outside shortlist
- override hard constraints

### Stage 6: Explanation Guard

Explanations should be generated from structured facts, not free hallucination.

Bad current-style explanation:

- "city is not specified, which reduces relevance"

Better explanation:

- "This option is in Khujand and matches your medicine/pharmacy interests. It is shown as the best pharmacy route, while other medical options are kept diverse."

If a candidate survives fallback because the user expanded city scope, the explanation must say that explicitly.

## Radical Options

### Option A: Strict Local Engine Plus AI Rerank

Best immediate production option.

Keep the current local engine, but replace city/filter/dedupe logic and make AI only a reranker.

Pros:

- cheapest
- stable at 1000 users/month
- no new external infra
- easy to test

Cons:

- search intelligence depends on hand-built taxonomy and aliases

### Option B: Offline Embeddings Index

Generate embeddings for all NCT records offline and commit/store a compact index.

Runtime:

- hard filter by city/education
- vector search within filtered candidates
- local rerank
- AI final rerank

Pros:

- better semantic matching than hash vectors
- runtime can stay cheap if embeddings are precomputed

Cons:

- requires an embedding generation workflow
- index must be regenerated when NCT data changes

### Option C: Supabase pgvector Search

Move NCT catalog to Supabase with normalized columns and vector embeddings.

Runtime query:

- SQL hard filters
- vector similarity
- full-text search
- rerank in app

Pros:

- clean production data model
- observable and admin-editable
- scales beyond the JSON file

Cons:

- more setup
- filtered vector search must be benchmarked carefully

### Option D: Two-Step Profession Catalog

Create a small canonical profession catalog separate from NCT records.

Flow:

1. AI maps user interests to profession families.
2. Local engine maps profession families to NCT codes.
3. AI reranks final code shortlist.

Pros:

- best user experience
- very controllable
- prevents "pharmacy pharmacy pharmacy" behavior

Cons:

- requires maintaining profession-to-code mappings

Recommended long-term path:

- implement Option A now
- add the profession catalog from Option D
- only move to Option B/C if relevance remains weak after evaluation

## Implementation Plan

### Phase 1: Stop Wrong-City Results

- Add `backend/src/lib/search/city.ts`.
- Replace all city normalization with canonical city ids.
- Make search filters hard gates inside `searchSpecialties`.
- Remove `studyCity: undefined` from expanded fallback.
- Add explicit `allowCityExpansion: false` default.

### Phase 2: Replace Candidate Pool Builder

- Replace `buildCandidatePool` with:
  - `analyzeInterestProfile`
  - `buildStrictCandidateSet`
  - `scoreCandidateSet`
  - `dedupeAndDiversify`
  - `finalizeRecommendationsWithAI`

### Phase 3: Specialty-Family Dedupe

- Add `canonicalSpecialtyKey`.
- Enforce family diversity in `rankNCTResults`.
- Add score penalty for repeated family in the visible top results.

### Phase 4: Evaluation Harness

Add a local script with golden cases:

- medicine + Khujand -> no Dushanbe results
- medicine + Khujand -> no duplicate pharmacy in top 2
- IT + Dushanbe -> programming/software should beat unrelated technical records
- law + Khujand -> law cluster should beat generic management
- unknown city -> controlled empty-state, not random city

Metrics:

- `wrongCityRate` must be 0
- `duplicateFamilyTop3` must be 0
- `hardFilterViolation` must be 0
- `topResultHasInterestSignal` should be high

### Phase 5: Observability

Store debug metadata in development/admin only:

- selected city canonical id
- candidate count after hard filter
- candidate count after scoring
- fallback used or not
- AI used or local fallback used
- score breakdown per visible card

This makes future complaints diagnosable without guessing.

## Decision

Use this production rule:

> AI chooses profession intent. Local engine chooses valid NCT candidates under hard constraints. AI only reranks the valid shortlist.

This gives the user a visible AI-quality experience without letting the model break city, education level, or database truth.
