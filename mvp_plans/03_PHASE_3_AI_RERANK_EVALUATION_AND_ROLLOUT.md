# Phase 3: AI Rerank, Evaluation, And Rollout

## Goal

Use AI for the parts where it helps:

- interpreting the user's combined interests
- reranking a small approved shortlist
- writing concise explanations

AI must remain inside local constraints.

## AI Contract

AI receives only local, allowed options.

Allowed AI inputs:

- user interest summary
- selected city display/id
- education level
- local profession shortlist
- local NCT candidate shortlist
- score breakdown
- route relation: `direct`, `adjacent`, `foundation`

Forbidden AI inputs:

- the full NCT database
- secret/internal env values
- unrelated user data

Forbidden AI outputs:

- unknown profession keys
- unknown candidate keys
- new NCT codes
- new institutions
- changed city
- changed education level

Every AI response must be validated with schema and allowlists.

## Recommended AI Steps

### Step 1: Profession Rerank

Input:

- top 20-30 profession catalog candidates
- normalized interest profile
- score breakdown

Output:

```ts
interface AIProfessionRerankItem {
  professionKey: string
  fitScore: number
  reasoning: string
  matchedInterests: string[]
  cautions: string[]
}
```

Validation:

- `professionKey` must exist in local catalog shortlist
- duplicate keys are removed
- unknown keys are rejected and logged
- invalid JSON falls back to local ranking

### Step 2: NCT Candidate Rerank

Input:

- top 12-20 hard-filtered NCT candidates
- chosen profession routes
- score breakdown

Output:

```ts
interface AINCTRerankItem {
  candidateKey: string
  fitScore: number
  whyItFits: string
  matchedInterests: string[]
  matchedCareers: string[]
  riskNotes: string[]
}
```

Validation:

- `candidateKey` must exist in the local shortlist
- wrong-city candidate cannot exist in shortlist
- unknown candidate is rejected
- AI ranking cannot resurrect filtered-out candidates

## Local Fallback

The system must work without AI.

Fallback behavior:

- use local profession score
- use local route score
- use deterministic explanation templates
- set diagnostic flag `aiFallbackUsed = true`

No request should fail only because AI failed.

## Explanation Guard

Explanations must be fact-backed.

Allowed explanation facts:

- selected city
- selected education level
- matched interests
- profession route type
- specialty title
- institution
- local taxonomy/specialty family
- whether route is direct, adjacent, or foundation
- whether fallback/city expansion was explicitly used

Forbidden explanation claims:

- guaranteed admission
- salary promise
- invented job market claims
- unverified competition claims
- saying route is direct when it is adjacent/foundation
- saying city was not specified when it was specified

Use templates first. Let AI polish only if validation keeps the facts intact.

## Golden Evaluation

Create or extend a local evaluation script.

Recommended path:

- `backend/scripts/evaluate-recommendation-mvp.ts`

The script should run without external AI by using mock AI responses.

Minimum cases:

### Case 1: Medicine + Khujand

Expected:

- no Dushanbe results
- all results match selected education level
- no duplicate pharmacy family in top 3 if alternatives exist
- top result has medicine/pharmacy/diagnostics signal

### Case 2: Medicine + Chemistry

Expected:

- pharmacist, lab diagnostics, or chemistry/health-adjacent route ranks high
- generic unrelated chemistry does not beat locally supported medical route

### Case 3: IT + Pedagogy

Expected:

- informatics teacher or education technology route ranks above pure software when supported
- pure IT route is allowed only as fallback/adjacent/foundation

### Case 4: IT + Economics

Expected:

- information systems, data/business analytics, or business technology route ranks above random programming if supported

### Case 5: Law + Communication

Expected:

- law route remains primary
- generic management does not dominate

### Case 6: Unknown City

Expected:

- validation or controlled empty state
- no random fallback city
- `wrongCityRate = 0`

### Case 7: AI Invalid JSON

Expected:

- local fallback
- no crash
- diagnostic flag

### Case 8: AI Unknown Key

Expected:

- unknown key rejected
- violation logged
- final response still valid

## Required Metrics

Hard metrics:

```text
wrongCityRate = 0
hardFilterViolation = 0
unknownCodeRate = 0
unknownProfessionKeyRate = 0
explanationFactViolationRate = 0
aiFailureRecoveryRate = 1.00
```

Target metrics:

```text
duplicateFamilyTop3 = 0 when alternatives exist
topResultHasInterestSignal >= 0.95
directOrAdjacentRouteTop3Rate >= 0.90
combinedInterestTop1Rate >= 0.85 after catalog coverage improves
```

## Diagnostics

Add debug metadata for development/admin inspection.

Recommended fields:

```ts
interface RecommendationDiagnostics {
  catalogVersion: string
  selectedCityId: string
  selectedEducationLevel: string
  candidateCounts: {
    rawNct: number
    afterCity: number
    afterEducation: number
    afterProfessionRoute: number
    afterDedupe: number
    final: number
  }
  ai: {
    professionRerankUsed: boolean
    nctRerankUsed: boolean
    fallbackUsed: boolean
    rejectedKeys: string[]
  }
  violations: {
    wrongCity: number
    hardFilter: number
    unknownCode: number
    unknownProfessionKey: number
  }
}
```

Diagnostics should not expose secrets and should not clutter the normal user UI.

## Rollout Plan

1. Implement behind a local feature flag or internal toggle.
2. Run old/new comparison mode for golden cases.
3. Preserve the current API response shape through a mapper.
4. Store profession-route context in recommendation snapshot if downstream plan/coach needs it.
5. Run evaluation script.
6. Run tests/typecheck/build.
7. Enable the new pipeline as default only after hard metrics pass.
8. Keep old engine as explicit rollback only, not silent fallback.

## Snapshot Compatibility

The recommendation decision context should preserve:

- selected city
- selected education level
- selected profession route
- route relation type
- candidate score breakdown
- final explanation facts
- fallback flags

This matters because recommendation selection flows into:

- active goal
- general plan
- coach/today
- future recovery from `/api/plan/full`

Do not store only UI text. Store structured facts.

## Acceptance Criteria

Phase 3 is complete when:

- AI reranks only allowed local profession and NCT shortlists.
- invalid AI output cannot break the pipeline.
- local fallback returns valid recommendations.
- explanations are fact-backed.
- diagnostics reveal candidate counts and fallback reasons.
- golden evaluation passes.
- current recommendation API remains compatible or has a documented mapper.
- recommendation snapshot keeps enough structured context for downstream flows.
- `npm.cmd run build` passes.

## Final Report Requirements

After implementation, the final report should include:

- changed files
- architecture summary
- catalog files and modules added
- scoring weights
- golden evaluation results
- build/test results
- known catalog gaps
- next recommended catalog expansion

