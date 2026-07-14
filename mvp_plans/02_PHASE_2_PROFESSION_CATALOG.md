# Phase 2: Minimal Profession Catalog

## Goal

Introduce a controlled profession-first layer without making the project too large.

The user selects interests. The system should reason about profession families first, then map those profession families to real NCT specialties and codes.

The goal is not to create a perfect labor-market ontology. The goal is to create a small, trusted routing layer that prevents random or repetitive NCT results.

## Core Principle

AI may choose only from professions that exist in the local catalog.

AI must not create:

- new profession keys
- new clusters
- new NCT codes
- new institutions
- new cities

## Recommended Data Files

Create a compact catalog under:

- `backend/src/data/recommendation/`

Recommended MVP files:

- `profession-catalog.json`
- `profession-specialty-links.json`
- `profession-aliases.json`
- `scoring-config.json`
- `catalog-version.json`

Do not create too many files in the first version. The original larger plan listed many data files; keep the MVP small.

## Recommended Code Files

Create focused modules under:

- `backend/src/lib/recommendation/`

Recommended MVP modules:

- `types.ts`
- `catalog-loader.ts`
- `normalize-interest-profile.ts`
- `profession-score.ts`
- `profession-candidate-builder.ts`
- `specialty-linker.ts`
- `explanation-builder.ts`
- `diagnostics.ts`

Avoid creating 15-20 modules before the MVP proves itself.

## Data Types

### Profession Catalog Entry

```ts
export type ProfessionRouteAvailability =
  | "direct"
  | "adjacent"
  | "foundation"
  | "unmapped"

export interface ProfessionCatalogEntry {
  key: string
  title: string
  description: string
  interestWeights: Record<string, number>
  professionFamilyKey: string
  allowedClusterIds: number[]
  tags: string[]
  aliases: string[]
  dataQuality: number
  catalogStatus: "active" | "draft" | "disabled"
}
```

Rules:

- production uses only `catalogStatus = "active"`
- `interestWeights` must be `0..1`
- `dataQuality` must be `0..1`
- `allowedClusterIds` must exist in local NCT data
- `unmapped` professions are not shown as confirmed routes

### Profession Specialty Link

```ts
export type ProfessionSpecialtyRelation =
  | "direct"
  | "adjacent"
  | "foundation"

export interface ProfessionSpecialtyLink {
  professionKey: string
  specialtyFamilyKey: string
  relationType: ProfessionSpecialtyRelation
  confidence: number
  evidence: {
    source: "local_catalog" | "title_match" | "tag_match" | "manual"
    note?: string
  }
}
```

Rules:

- a specialty is eligible only if there is a link or a validated title/tag match
- `direct` beats `adjacent`
- `adjacent` beats `foundation`
- `foundation` can be shown only with honest explanation

## Minimum Catalog Coverage

Start with the professions needed for common user paths.

Medicine:

- `doctor`
- `nurse`
- `pharmacist`
- `lab_diagnostics_specialist`
- `dentist`
- `public_health_specialist`

IT:

- `software_developer`
- `information_systems_specialist`
- `data_analyst`
- `cybersecurity_specialist`
- `network_specialist`

Pedagogy:

- `informatics_teacher`
- `primary_teacher`
- `language_teacher`
- `education_technology_specialist`

Economics/business:

- `accountant`
- `economist`
- `business_manager`
- `marketing_specialist`
- `logistics_specialist`

Law:

- `lawyer`
- `law_enforcement_specialist`
- `international_law_specialist`

Engineering/construction:

- `civil_engineer`
- `electrical_engineer`
- `mechanical_engineer`
- `construction_specialist`

Design/media:

- `graphic_designer`
- `journalist`
- `media_specialist`

Other families can remain fallback/other until manually validated.

## Scoring Model

Use a transparent local formula.

Suggested profession score:

```text
final =
  harmonicInterestFit * 0.35 +
  coverage * 0.20 +
  synergy * 0.15 +
  routeAvailability * 0.15 +
  dataQuality * 0.10 +
  localDemandOrAdmissionSignal * 0.05
```

Important:

- use harmonic fit so one strong interest cannot hide one weak interest
- apply partial coverage penalty
- apply fallback cap for weak routes
- keep weights in `scoring-config.json`

## Multi-Interest Behavior

The catalog must reward combined routes.

Examples:

- `IT + pedagogy` should prefer `informatics_teacher` or `education_technology_specialist`.
- `medicine + chemistry` should prefer `pharmacist` or `lab_diagnostics_specialist`.
- `law + communication` should prefer legal routes with communication relevance, not generic management.
- `IT + economics` should prefer information systems/business analytics when supported by local data.

If a combined route is not locally supported:

- do not invent it
- mark `catalog_gap`
- use the best honest `adjacent` or `foundation` route

## Integration With Phase 1

Phase 2 must consume Phase 1 normalized records:

- canonical city
- education level
- specialty family
- hard-filtered candidate set

Profession routing happens before final NCT result selection, but NCT hard filters still cannot be bypassed.

Recommended flow:

```text
profile
-> normalize interests
-> profession shortlist
-> profession score
-> map profession to specialty families
-> hard-filter NCT records
-> link filtered NCT records to profession routes
-> route score
-> dedupe/diversify
```

## Acceptance Criteria

Phase 2 is complete when:

- there is a local active profession catalog
- AI is not required for local profession scoring
- common single-interest and combined-interest cases produce profession shortlists
- profession keys are stable and validated
- unknown interests produce controlled fallback, not random professions
- profession-specialty links are enforced before final NCT output
- `IT + pedagogy` has a deterministic local route if local NCT data supports it
- `medicine + chemistry` avoids duplicate pharmacy spam in top 3 when alternatives exist
- `npm.cmd run build` passes

## Do Not Do In Phase 2

- Do not let AI edit the catalog at runtime.
- Do not treat catalog gaps as confirmed recommendations.
- Do not remove Phase 1 hard filters.
- Do not add many new UI concepts unless the response data requires a small label/explanation change.

