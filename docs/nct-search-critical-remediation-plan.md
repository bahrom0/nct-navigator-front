# Critical NCT Search Remediation Plan

## Objective

Stop the recommendation pipeline from manufacturing relevance. A result may be ranked only after it passes deterministic eligibility based on the selected education level, city, NCT cluster, specialty title/code, and an explicit profession-to-specialty link.

## Non-negotiable invariants

1. `Doctor`, nursing, pharmacy, dentistry and diagnostics routes use NCT cluster 5.
2. Economics routes use cluster 2, pedagogy routes cluster 3, law routes cluster 4, and IT/engineering routes cluster 1.
3. A cluster may define a broad search boundary, but must never assign a concrete specialty family by itself.
4. A profession with zero positive interest evidence has score `0` and cannot enter the shortlist.
5. City, education level and selected category clusters are hard filters. Ranking and AI cannot relax them.
6. Specialty taxonomy is derived from the specialty title/code, never from institution or location text.
7. The UI must collect `after_9` or `after_11`; `applicant` is not an education level.
8. Visible recommendations are unique by education level + official specialty code.
9. AI may rerank only deterministic eligible candidates and cannot rescue an ineligible candidate.
10. Empty accurate output is preferable to unrelated filler.

## Work order

### P0 — Stop false routes

- Correct all active profession cluster mappings.
- Correct specialty-family cluster metadata.
- Remove cluster-to-specific-family fallback.
- Require positive evidence in profession scoring.
- Enforce category cluster ids in the hard-filter gate.
- Classify taxonomy from specialty text only.

Acceptance:

- Medicine never returns clusters 1–4.
- Economics is never labeled `Doctor`.
- Cluster 5 is never labeled `Lawyer` merely because of its cluster.
- Mathematics is never labeled `Software Developer` without a title/family link.

### P0 — Fix education-level truth

- Require applicants and schoolchildren to choose `after_9` or `after_11`.
- Remove implicit `applicant -> after_11` conversion in the backend.
- Reject/neutralize stale `applicant` values from persisted state.

Acceptance:

- The analysis page never says “level not selected” while the backend silently filters to after 11.

### P1 — Normalize code-level results

- Deduplicate candidates by `education_level + official_code` before final ranking.
- Keep the best offer as the representative card and preserve merged evidence.
- Later product work may expose all campus/form/type offers beneath the code.

Acceptance:

- A visible shortlist contains no duplicate official code for the same education level.

### P1 — Test production behavior

- Replace evaluation-only scoring copies with imports/calls to production functions where possible.
- Add semantic cluster assertions and golden recommendation cases.
- Add a real Medicine + Dushanbe regression check.

Acceptance:

- Tests fail if doctor maps to cluster 2 or lawyer maps to cluster 5.
- Tests fail if an unrelated profile produces profession routes.
- Tests fail on wrong city, wrong education level, wrong category cluster, unknown code or duplicate code.

### Data limitation — Do not fake coverage

- Keep using verified local data only.
- The after-11 2025 PDF is a remaining-seats document, not a complete medical catalog.
- Import the official full after-11 plan as a new Stage 1 source before claiming complete medical coverage.
- Stage 3 published export remains the target read model; legacy JSON remains comparison/fallback until the controlled application cutover.

Acceptance:

- When no confirmed clinical medicine offer exists for the selected release/city/level, return a factual empty state instead of unrelated codes.

## Final gates

- Backend build passes.
- Frontend build passes.
- Production evaluator exercises the corrected invariants.
- Live browser scenario Medicine + Dushanbe contains only cluster 5 and medically linked specialty families, or a controlled empty result.
