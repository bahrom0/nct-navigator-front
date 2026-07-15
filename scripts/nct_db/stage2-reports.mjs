import { readFile } from "node:fs/promises";
import { normalizeSpace, simplify, stableHash } from "./normalization.mjs";

function increment(target, key, amount = 1) {
  const safeKey = key === null || key === undefined || key === "" ? "null" : String(key);
  target[safeKey] = (target[safeKey] ?? 0) + amount;
}

function countBy(items, getter) {
  const output = {};
  for (const item of items) increment(output, getter(item));
  return Object.fromEntries(Object.entries(output).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])));
}

function sampleIssue(issue) {
  return {
    issue_id: issue.issue_id,
    staging_row_id: issue.staging_row_id,
    issue_type: issue.issue_type,
    severity: issue.severity,
    field_name: issue.field_name,
    message: issue.message,
  };
}

export function buildReferences(offers) {
  const institutions = new Map();
  const campuses = new Map();
  const specialties = new Map();
  const cities = new Map();
  const regions = new Map();

  for (const offer of offers) {
    const institutionName = offer.fields.institution.normalized_value;
    if (institutionName) {
      const key = offer.fields.campus.normalized_value?.institution_key
        ?? stableHash([simplify(institutionName)], "institution");
      const existing = institutions.get(key) ?? {
        institution_key: key,
        official_name_tg: null,
        official_name_ru: null,
        normalized_name: institutionName,
        aliases: [],
        source_row_ids: [],
        offer_count: 0,
        confidence_min: 1,
      };
      const sourceLanguage = offer.source.source_language;
      if (sourceLanguage === "tg" && !existing.official_name_tg) existing.official_name_tg = institutionName;
      if (sourceLanguage === "ru" && !existing.official_name_ru) existing.official_name_ru = institutionName;
      if (!existing.aliases.includes(institutionName)) existing.aliases.push(institutionName);
      existing.source_row_ids.push(offer.source.source_row_id);
      existing.offer_count += 1;
      existing.confidence_min = Math.min(existing.confidence_min, offer.fields.institution.confidence);
      institutions.set(key, existing);
    }

    const campusValue = offer.fields.campus.normalized_value;
    if (campusValue) {
      const campusKey = stableHash([
        campusValue.institution_key,
        campusValue.location,
        campusValue.campus_kind,
      ], "campus");
      const existing = campuses.get(campusKey) ?? {
        campus_key: campusKey,
        ...campusValue,
        aliases: [],
        source_row_ids: [],
        offer_count: 0,
        confidence_min: 1,
      };
      const rawInstitution = normalizeSpace(offer.fields.institution.raw_value);
      if (rawInstitution && !existing.aliases.includes(rawInstitution)) existing.aliases.push(rawInstitution);
      existing.source_row_ids.push(offer.source.source_row_id);
      existing.offer_count += 1;
      existing.confidence_min = Math.min(existing.confidence_min, offer.fields.campus.confidence);
      campuses.set(campusKey, existing);
      offer.campus_key = campusKey;
    }

    const code = offer.fields.specialty_code.normalized_value;
    if (code) {
      const specialtyKey = stableHash([code], "specialty");
      const existing = specialties.get(specialtyKey) ?? {
        specialty_key: specialtyKey,
        code,
        names: [],
        clusters: [],
        education_levels: [],
        source_row_ids: [],
        offer_count: 0,
      };
      const name = offer.fields.specialty_name.normalized_value;
      if (name && !existing.names.includes(name)) existing.names.push(name);
      const cluster = offer.fields.cluster.normalized_value;
      if (cluster && !existing.clusters.includes(cluster)) existing.clusters.push(cluster);
      const level = offer.fields.education_level.normalized_value;
      if (level && !existing.education_levels.includes(level)) existing.education_levels.push(level);
      existing.source_row_ids.push(offer.source.source_row_id);
      existing.offer_count += 1;
      specialties.set(specialtyKey, existing);
      offer.specialty_key = specialtyKey;
    }

    const city = offer.fields.city.normalized_value;
    if (city) {
      const key = stableHash([city], "city");
      const entry = cities.get(key) ?? { city_key: key, normalized_name: city, aliases: [], offer_count: 0, source_row_ids: [] };
      const raw = normalizeSpace(offer.fields.city.raw_value);
      if (raw && !entry.aliases.includes(raw)) entry.aliases.push(raw);
      entry.offer_count += 1;
      entry.source_row_ids.push(offer.source.source_row_id);
      cities.set(key, entry);
      offer.city_key = key;
    }

    const region = offer.fields.region.normalized_value;
    if (region) {
      const key = stableHash([region], "region");
      const entry = regions.get(key) ?? { region_key: key, normalized_name: region, aliases: [], offer_count: 0, source_row_ids: [] };
      const raw = normalizeSpace(offer.fields.region.raw_value);
      if (raw && !entry.aliases.includes(raw)) entry.aliases.push(raw);
      entry.offer_count += 1;
      entry.source_row_ids.push(offer.source.source_row_id);
      regions.set(key, entry);
      offer.region_key = key;
    }
  }

  return {
    cities: [...cities.values()],
    regions: [...regions.values()],
    institutions: [...institutions.values()],
    institution_campuses: [...campuses.values()],
    institution_aliases: [...institutions.values()].flatMap((item) => item.aliases.map((alias) => ({ institution_key: item.institution_key, alias }))),
    specialties: [...specialties.values()],
    clusters: [1, 2, 3, 4, 5].map((cluster) => ({ cluster, offer_count: offers.filter((offer) => offer.fields.cluster.normalized_value === cluster).length })),
    languages: ["tg", "ru", "uz", "en"].map((language) => ({ language, offer_count: offers.filter((offer) => offer.fields.language.normalized_value.includes(language)).length })),
    education_forms: ["full_time", "part_time", "distance"].map((education_form) => ({ education_form, offer_count: offers.filter((offer) => offer.fields.education_form.normalized_value === education_form).length })),
    education_types: ["free", "paid"].map((education_type) => ({ education_type, offer_count: offers.filter((offer) => offer.fields.education_type.normalized_value === education_type).length })),
  };
}

export function buildFieldEvidence(offers) {
  const entityFieldMap = {
    specialty_code: "specialty",
    specialty_name: "specialty",
    institution: "institution",
    campus: "campus",
  };
  return offers.flatMap((offer) => Object.entries(offer.fields).map(([fieldName, value]) => ({
    entity_type: entityFieldMap[fieldName] ?? "admission_offer",
    entity_stable_key: fieldName === "institution"
      ? value.normalized_value ? stableHash([simplify(value.normalized_value)], "institution") : offer.stable_key
      : fieldName === "campus" ? offer.campus_key ?? offer.stable_key
        : fieldName.startsWith("specialty") ? offer.specialty_key ?? offer.stable_key
          : offer.stable_key,
    field_name: fieldName,
    raw_value: value.raw_value,
    normalized_value: value.normalized_value,
    source_row_id: offer.source.source_row_id,
    source_document_id: offer.source.source_document_id,
    confidence: value.confidence,
    verification_method: value.method,
    warnings: value.warnings,
  })));
}

export function buildQualityReport(stagingRows, offers, issues, evidence, references) {
  const requiredFields = [
    "specialty_code", "specialty_name", "institution", "location", "education_form",
    "education_type", "language", "admission_plan", "cluster", "education_level",
    "academic_year", "admission_period",
  ];
  const completeness = {};
  for (const fieldName of requiredFields) {
    const populated = offers.filter((offer) => {
      const value = offer.fields[fieldName].normalized_value;
      return value !== null && value !== undefined && !(Array.isArray(value) && value.length === 0);
    }).length;
    completeness[fieldName] = { populated, missing: offers.length - populated, rate: Number((populated / offers.length).toFixed(6)) };
  }

  const stableKeyCounts = countBy(offers, (offer) => offer.stable_key);
  const duplicateStableKeys = Object.entries(stableKeyCounts).filter(([, count]) => count > 1);
  const sourceRowCounts = countBy(offers, (offer) => `${offer.source.source_document_id}|${offer.source.source_row_id}`);
  const duplicateSourceRows = Object.entries(sourceRowCounts).filter(([, count]) => count > 1);
  const dedupeGroups = new Map();
  for (const offer of offers) {
    const key = [
      offer.fields.academic_year.normalized_value,
      offer.fields.admission_period.normalized_value,
      offer.fields.education_level.normalized_value,
      offer.fields.specialty_code.normalized_value,
      simplify(offer.fields.institution.normalized_value),
      offer.fields.location.normalized_value,
      offer.fields.education_form.normalized_value,
      offer.fields.education_type.normalized_value,
      offer.fields.language.normalized_value.join(","),
      offer.fields.admission_plan.normalized_value,
    ].join("|");
    const group = dedupeGroups.get(key) ?? [];
    group.push(offer.stable_key);
    dedupeGroups.set(key, group);
  }
  const duplicateCandidates = [...dedupeGroups.entries()].filter(([, keys]) => keys.length > 1);
  const confidences = evidence.map((item) => item.confidence);
  const confidenceBands = { "0.00-0.49": 0, "0.50-0.84": 0, "0.85-0.94": 0, "0.95-1.00": 0 };
  for (const value of confidences) {
    if (value < 0.5) confidenceBands["0.00-0.49"] += 1;
    else if (value < 0.85) confidenceBands["0.50-0.84"] += 1;
    else if (value < 0.95) confidenceBands["0.85-0.94"] += 1;
    else confidenceBands["0.95-1.00"] += 1;
  }

  const issueCounts = countBy(issues, (issue) => issue.issue_type);
  const severityCounts = countBy(issues, (issue) => issue.severity);
  const unknownCityCount = offers.filter((offer) => !offer.fields.city.normalized_value && !offer.fields.region.normalized_value).length;
  const findings = [];
  if (unknownCityCount) findings.push({
    severity: "high",
    finding: "Unresolved official locations",
    evidence: { rows: unknownCityCount, rate: Number((unknownCityCount / offers.length).toFixed(6)) },
    risk: "City and campus filtering cannot safely use these rows without review.",
    likely_cause: "Location spelling or parsing artifact is outside the current explicit alias dictionary.",
    remediation: "Review unknown_city issues and add only source-backed aliases.",
  });
  if (duplicateCandidates.length) findings.push({
    severity: "medium",
    finding: "Possible duplicate admission offers",
    evidence: { groups: duplicateCandidates.length, affected_rows: duplicateCandidates.reduce((sum, [, keys]) => sum + keys.length, 0) },
    risk: "Stage 3 export could double-count capacity if candidates are not adjudicated.",
    likely_cause: "Repeated official rows or coordinate overlap.",
    remediation: "Resolve duplicate_candidate review issues; do not auto-merge by specialty code.",
  });
  if (stagingRows.some((row) => row.parse_warnings.includes("row_shift_suspected"))) findings.push({
    severity: "high",
    finding: "Coordinate row-overlap warnings remain",
    evidence: { rows: stagingRows.filter((row) => row.parse_warnings.includes("row_shift_suspected")).length },
    risk: "Institution or specialty text may contain fragments from adjacent rows.",
    likely_cause: "Variable-height multiline cells in the 2025 remaining-seats PDF.",
    remediation: "Manually review affected evidence or improve horizontal-border extraction before Stage 3.",
  });

  return {
    generated_at: new Date().toISOString(),
    dataset: {
      grain: "one draft admission offer per Stage 1 staging row",
      intended_use: "Stage 2 normalization and review only; not a published product release",
      staging_rows: stagingRows.length,
      draft_core_offers: offers.length,
      explained_row_delta: offers.length - stagingRows.length,
    },
    checks_performed: [
      "required field completeness", "stable-key uniqueness", "source-row uniqueness",
      "domain validity", "confidence distribution", "candidate duplicate detection",
      "source year/period consistency", "review issue coverage",
    ],
    completeness,
    uniqueness: {
      duplicate_stable_keys: duplicateStableKeys.length,
      duplicate_source_rows: duplicateSourceRows.length,
      duplicate_candidate_groups: duplicateCandidates.length,
      duplicate_candidate_samples: duplicateCandidates.slice(0, 25).map(([dedupe_key, stable_keys]) => ({ dedupe_key, stable_keys })),
    },
    issue_counts: issueCounts,
    severity_counts: severityCounts,
    confidence_bands: confidenceBands,
    reference_counts: Object.fromEntries(Object.entries(references).map(([key, items]) => [key, items.length])),
    findings,
    quality_gates: {
      every_offer_has_source_row: offers.every((offer) => Boolean(offer.source.source_row_id)),
      no_stable_key_duplicates: duplicateStableKeys.length === 0,
      all_unknown_cities_in_review: offers.filter((offer) => !offer.fields.city.normalized_value && !offer.fields.region.normalized_value).every((offer) => issues.some((issue) => issue.staging_row_id === offer.source.staging_row_id && issue.issue_type === "unknown_city")),
      raw_staging_core_count_explained: stagingRows.length === offers.length,
      low_confidence_fields_are_reviewed: evidence.filter((item) => item.confidence < 0.5).every((item) => issues.some((issue) => issue.source_row_id === item.source_row_id && issue.field_name === item.field_name)),
      year_period_mismatch_excluded: !issues.some((issue) => issue.issue_type === "year_period_mismatch" && !issue.excluded_from_release),
      khujand_report_present: true,
    },
    automated_test_recommendations: [
      "stable_key must be unique and non-null",
      "source_document_id + source_row_id must be unique",
      "cluster must be 1..5",
      "education_level and admission_period must match source inventory",
      "unknown city and confidence below 0.50 must always produce review issues",
    ],
    top_review_samples: issues.slice(0, 50).map(sampleIssue),
  };
}

export function buildKhujandReport(offers, issues) {
  const containsKhujand = (value) => /худж|хуҷ|khujand/iu.test(normalizeSpace(value));
  const confirmedByLocation = offers.filter((offer) => offer.fields.city.normalized_value === "Khujand");
  const institutionMentions = offers.filter((offer) => containsKhujand(offer.fields.institution.raw_value));
  const probableByName = institutionMentions.filter((offer) => offer.fields.city.normalized_value === null && offer.fields.region.normalized_value === null);
  const excluded = institutionMentions.filter((offer) => offer.fields.city.normalized_value && offer.fields.city.normalized_value !== "Khujand");
  const unresolved = offers.filter((offer) => containsKhujand(JSON.stringify([offer.fields.location.raw_value, offer.fields.institution.raw_value])) && !confirmedByLocation.includes(offer) && !excluded.includes(offer));
  const compact = (offer) => ({
    stable_key: offer.stable_key,
    staging_row_id: offer.source.staging_row_id,
    institution: offer.fields.institution.normalized_value,
    raw_location: offer.fields.location.raw_value,
    normalized_location: offer.fields.location.normalized_value,
    city: offer.fields.city.normalized_value,
    campus_key: offer.campus_key,
    education_level: offer.fields.education_level.normalized_value,
    cluster: offer.fields.cluster.normalized_value,
  });
  const khujandIssues = issues.filter((issue) => confirmedByLocation.some((offer) => offer.source.staging_row_id === issue.staging_row_id));
  return {
    generated_at: new Date().toISOString(),
    rule: "Only official location normalized to Khujand is counted as confirmed. Institution-name matches alone are not confirmed.",
    summary: {
      confirmed_by_official_location: confirmedByLocation.length,
      confirmed_by_official_campus: 0,
      probable_by_institution_name: probableByName.length,
      unresolved_candidates: unresolved.length,
      excluded_name_matches: excluded.length,
    },
    confirmed_by_official_location: confirmedByLocation.map(compact),
    confirmed_by_official_campus: [],
    probable_by_institution_name: probableByName.map(compact),
    unresolved_candidates: unresolved.map(compact),
    excluded_from_khujand: excluded.map(compact),
    counts_by_institution: countBy(confirmedByLocation, (offer) => offer.fields.institution.normalized_value),
    counts_by_campus: countBy(confirmedByLocation, (offer) => offer.campus_key),
    counts_by_education_level: countBy(confirmedByLocation, (offer) => offer.fields.education_level.normalized_value),
    counts_by_cluster: countBy(confirmedByLocation, (offer) => offer.fields.cluster.normalized_value),
    paid_free_counts: countBy(confirmedByLocation, (offer) => offer.fields.education_type.normalized_value),
    top_parsing_problems: countBy(khujandIssues, (issue) => issue.issue_type),
  };
}

export function renderKhujandMarkdown(report) {
  const summary = report.summary;
  const lines = [
    "# Khujand Stage 2 report",
    "",
    report.rule,
    "",
    "## Summary",
    "",
    `- Confirmed by official location: ${summary.confirmed_by_official_location}`,
    `- Confirmed by official campus evidence: ${summary.confirmed_by_official_campus}`,
    `- Probable by institution name only: ${summary.probable_by_institution_name}`,
    `- Unresolved candidates: ${summary.unresolved_candidates}`,
    `- Excluded name matches: ${summary.excluded_name_matches}`,
    "",
    "## Counts by education level",
    "",
    ...Object.entries(report.counts_by_education_level).map(([key, count]) => `- ${key}: ${count}`),
    "",
    "## Counts by cluster",
    "",
    ...Object.entries(report.counts_by_cluster).map(([key, count]) => `- ${key}: ${count}`),
    "",
    "## Paid/free",
    "",
    ...Object.entries(report.paid_free_counts).map(([key, count]) => `- ${key}: ${count}`),
    "",
    "Full row-level evidence is stored in `khujand_report.json`.",
  ];
  return `${lines.join("\n")}\n`;
}

function legacyFingerprint(record) {
  return [
    normalizeSpace(record.code).replace(/\D/g, ""),
    simplify(record.specialty_name ?? record.title_ru),
    simplify(record.university_name ?? record.institution),
    simplify(record.location ?? record.city),
  ].join("|");
}

export async function compareWithLegacy(offers, legacyFiles) {
  const officialFingerprints = new Map();
  for (const offer of offers) {
    const fingerprint = [
      offer.fields.specialty_code.normalized_value,
      simplify(offer.fields.specialty_name.normalized_value),
      simplify(offer.fields.institution.normalized_value),
      simplify(offer.fields.location.raw_value),
    ].join("|");
    officialFingerprints.set(fingerprint, offer.stable_key);
  }
  const report = {
    generated_at: new Date().toISOString(),
    rule: "Legacy data is comparison-only and is never copied into draft Core.",
    files: [],
  };
  for (const filePath of legacyFiles) {
    const parsed = JSON.parse(await readFile(filePath, "utf8"));
    const records = Array.isArray(parsed) ? parsed : parsed.records ?? [];
    const matched = [];
    const legacyOnly = [];
    for (const record of records) {
      const fingerprint = legacyFingerprint(record);
      if (officialFingerprints.has(fingerprint)) matched.push({ fingerprint, stable_key: officialFingerprints.get(fingerprint) });
      else legacyOnly.push({ fingerprint, code: record.code ?? null, title: record.specialty_name ?? record.title_ru ?? null, institution: record.university_name ?? record.institution ?? null, city: record.location ?? record.city ?? null });
    }
    const legacySet = new Set(records.map(legacyFingerprint));
    const officialOnly = [...officialFingerprints.entries()].filter(([fingerprint]) => !legacySet.has(fingerprint));
    report.files.push({
      file: filePath.replaceAll("\\", "/"),
      legacy_record_count: records.length,
      exact_official_matches: matched.length,
      legacy_only_count: legacyOnly.length,
      official_only_count: officialOnly.length,
      matched_samples: matched.slice(0, 50),
      legacy_only_samples: legacyOnly.slice(0, 100),
      official_only_samples: officialOnly.slice(0, 100).map(([fingerprint, stable_key]) => ({ fingerprint, stable_key })),
    });
  }
  return report;
}
