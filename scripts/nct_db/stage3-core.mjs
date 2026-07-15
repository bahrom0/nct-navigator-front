import { createHash } from "node:crypto";
import { normalizeSpace, simplify, stableHash } from "./normalization.mjs";

export const STAGE3_VERSION = "nct-stage3-release-v1.0.0";

const CLUSTER_NAMES = {
  1: { ru: "Естественный и технический", tg: "Табиӣ ва техникӣ" },
  2: { ru: "Экономика и география", tg: "Иқтисод ва география" },
  3: { ru: "Филология, педагогика и искусство", tg: "Филология, педагогика ва санъат" },
  4: { ru: "Обществознание и право", tg: "Ҷомеашиносӣ ва ҳуқуқ" },
  5: { ru: "Медицина, биология и спорт", tg: "Тиб, биология ва варзиш" },
};

const FORM_LABELS = {
  full_time: "очная",
  part_time: "заочная",
  distance: "дистанционная",
};

const TYPE_LABELS = {
  free: "бесплатный",
  paid: "платный",
};

function hash(value, length = 16) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, length);
}

function normalizedValue(draft, fieldName) {
  return draft.fields[fieldName]?.normalized_value ?? null;
}

function isOfficialNctRowId(draft) {
  return normalizedValue(draft, "education_level") === "after_9" && /^\d{4}$/.test(draft.source.source_row_id);
}

export function buildPublishedStableKey(draft) {
  const academicYear = normalizedValue(draft, "academic_year");
  const admissionPeriod = normalizedValue(draft, "admission_period");
  if (isOfficialNctRowId(draft)) {
    return `nct:${academicYear}:${admissionPeriod}:${draft.source.source_row_id}`;
  }
  const languages = [...normalizedValue(draft, "language")].sort().join(",");
  const languageSetHash = hash(languages, 12);
  return [
    "nct",
    academicYear,
    admissionPeriod,
    normalizedValue(draft, "education_level"),
    normalizedValue(draft, "cluster"),
    normalizedValue(draft, "specialty_code"),
    draft.campus_key,
    normalizedValue(draft, "education_form"),
    normalizedValue(draft, "education_type"),
    languageSetHash,
  ].join(":");
}

export function buildDedupeKey(draft) {
  return stableHash([
    normalizedValue(draft, "academic_year"),
    normalizedValue(draft, "admission_period"),
    normalizedValue(draft, "education_level"),
    normalizedValue(draft, "specialty_code"),
    simplify(normalizedValue(draft, "specialty_name")),
    draft.campus_key,
    normalizedValue(draft, "location"),
    normalizedValue(draft, "education_form"),
    normalizedValue(draft, "education_type"),
    [...normalizedValue(draft, "language")].sort().join(","),
    normalizedValue(draft, "admission_plan"),
  ], "dedupe");
}

export function releaseIdForDraft(draft) {
  return [
    "nct",
    normalizedValue(draft, "academic_year"),
    normalizedValue(draft, "admission_period").replaceAll("_", "-"),
    normalizedValue(draft, "education_level").replaceAll("_", "-"),
    "v1",
  ].join("-");
}

function confidenceSummary(draft) {
  const confidences = Object.values(draft.fields).map((field) => field.confidence);
  return {
    min_field_confidence: Math.min(...confidences),
    source_count: 1,
    has_conflicts: false,
  };
}

export function buildAdmissionOffer(draft, stableKey = buildPublishedStableKey(draft)) {
  const sourceLanguage = draft.source.source_language;
  const cluster = normalizedValue(draft, "cluster");
  const originalName = normalizeSpace(draft.fields.specialty_name.raw_value ?? normalizedValue(draft, "specialty_name"));
  const normalizedName = normalizedValue(draft, "specialty_name");
  const institutionName = normalizedValue(draft, "institution");
  const releaseId = releaseIdForDraft(draft);
  return {
    id: `offer_${hash(stableKey, 24)}`,
    stable_key: stableKey,
    dedupe_key: buildDedupeKey(draft),
    release_id: releaseId,
    source_row_ids: [draft.source.source_row_id],
    academic_year: normalizedValue(draft, "academic_year"),
    admission_period: normalizedValue(draft, "admission_period"),
    education_level: normalizedValue(draft, "education_level"),
    cluster_number: cluster,
    cluster_name_tg: sourceLanguage === "tg" ? CLUSTER_NAMES[cluster]?.tg ?? null : null,
    cluster_name_ru: sourceLanguage === "ru" ? CLUSTER_NAMES[cluster]?.ru ?? null : null,
    specialty_code: normalizedValue(draft, "specialty_code"),
    specialty_name_tg: sourceLanguage === "tg" ? normalizedName : null,
    specialty_name_ru: sourceLanguage === "ru" ? normalizedName : null,
    specialty_name_original: originalName,
    institution_id: draft.fields.campus.normalized_value.institution_key,
    institution_name: institutionName,
    campus_id: draft.campus_key,
    campus_name: draft.fields.campus.normalized_value.campus_kind === "branch_or_named_campus" ? institutionName : null,
    city_id: draft.city_key ?? null,
    city_name: normalizedValue(draft, "city"),
    region_id: draft.region_key ?? null,
    region_name: normalizedValue(draft, "region"),
    education_form: FORM_LABELS[normalizedValue(draft, "education_form")] ?? null,
    education_type: TYPE_LABELS[normalizedValue(draft, "education_type")] ?? null,
    tuition_fee: normalizedValue(draft, "tuition_fee"),
    languages: [...normalizedValue(draft, "language")].sort(),
    admission_plan: normalizedValue(draft, "admission_plan"),
    official_status: "published",
    confidence_summary: confidenceSummary(draft),
    source: {
      source_id: draft.source.source_id,
      source_document_id: draft.source.source_document_id,
      source_row_id: draft.source.source_row_id,
      source_page: draft.source.source_page,
      source_row_number: draft.source.source_row_number,
      source_checksum: draft.source.source_checksum,
      staging_row_id: draft.source.staging_row_id,
    },
  };
}

export function partitionDraftOffers(draftOffers, reviewIssueById) {
  const exclusions = [];
  const candidates = [];
  for (const draft of draftOffers) {
    if (draft.review_status !== "ready_for_stage3_review") {
      const issues = (draft.review_issue_ids ?? []).map((id) => reviewIssueById.get(id)).filter(Boolean);
      exclusions.push({
        staging_row_id: draft.source.staging_row_id,
        stage2_stable_key: draft.stable_key,
        proposed_stage3_stable_key: null,
        release_id: releaseIdForDraft(draft),
        reason: "stage2_needs_review",
        review_issue_ids: draft.review_issue_ids ?? [],
        issue_types: [...new Set(issues.map((item) => item.issue_type))],
        source: draft.source,
      });
      continue;
    }
    candidates.push({ draft, stableKey: buildPublishedStableKey(draft) });
  }

  const byStableKey = new Map();
  for (const candidate of candidates) {
    const group = byStableKey.get(candidate.stableKey) ?? [];
    group.push(candidate);
    byStableKey.set(candidate.stableKey, group);
  }
  const publishedDrafts = [];
  for (const [stableKey, group] of byStableKey) {
    if (group.length === 1) {
      publishedDrafts.push(group[0]);
      continue;
    }
    for (const candidate of group) {
      exclusions.push({
        staging_row_id: candidate.draft.source.staging_row_id,
        stage2_stable_key: candidate.draft.stable_key,
        proposed_stage3_stable_key: stableKey,
        release_id: releaseIdForDraft(candidate.draft),
        reason: "stable_key_collision",
        collision_group: group.map((item) => ({
          staging_row_id: item.draft.source.staging_row_id,
          specialty_name: normalizedValue(item.draft, "specialty_name"),
          admission_plan: normalizedValue(item.draft, "admission_plan"),
        })),
        review_issue_ids: [],
        issue_types: ["source_conflict"],
        source: candidate.draft.source,
      });
    }
  }
  return { publishedDrafts, exclusions };
}

export function buildReleaseManifests(offers, exclusions, generatedAt) {
  const releaseIds = [...new Set([
    ...offers.map((offer) => offer.release_id),
    ...exclusions.map((item) => item.release_id),
  ])].sort();
  return releaseIds.map((releaseId) => {
    const releaseOffers = offers.filter((offer) => offer.release_id === releaseId);
    const releaseExclusions = exclusions.filter((item) => item.release_id === releaseId);
    const seed = releaseOffers[0] ?? releaseExclusions[0]?.source;
    const academicYear = releaseOffers[0]?.academic_year ?? releaseId.split("-")[1];
    const admissionPeriod = releaseOffers[0]?.admission_period
      ?? (releaseId.includes("fourth-or-remaining-seats") ? "fourth_or_remaining_seats" : "first");
    const educationLevel = releaseOffers[0]?.education_level
      ?? (releaseId.includes("after-11") ? "after_11" : "after_9");
    const sourceDocumentIds = [...new Set([
      ...releaseOffers.map((offer) => offer.source.source_document_id),
      ...releaseExclusions.map((item) => item.source.source_document_id),
    ])];
    return {
      release_id: releaseId,
      academic_year: academicYear,
      admission_period: admissionPeriod,
      education_level: educationLevel,
      status: "published",
      source_document_ids: sourceDocumentIds,
      record_count: releaseOffers.length,
      excluded_record_count: releaseExclusions.length,
      review_issue_count: releaseExclusions.reduce((sum, item) => sum + item.review_issue_ids.length + (item.reason === "stable_key_collision" ? 1 : 0), 0),
      quality_report_path: "data/reports/ntc/quality_report.json",
      exclusions_report_path: "data/reports/ntc/stage3_exclusions.json",
      created_at: generatedAt,
      published_at: generatedAt,
      source_seed_present: Boolean(seed),
    };
  });
}

function csvCell(value) {
  const string = Array.isArray(value) ? value.join("|") : value === null || value === undefined ? "" : String(value);
  return `"${string.replaceAll('"', '""')}"`;
}

export function offersToCsv(offers) {
  const fields = [
    "id", "stable_key", "dedupe_key", "release_id", "academic_year", "admission_period",
    "education_level", "cluster_number", "specialty_code", "specialty_name_original",
    "institution_id", "institution_name", "campus_id", "campus_name", "city_id", "city_name",
    "region_id", "region_name", "education_form", "education_type", "tuition_fee", "languages",
    "admission_plan", "official_status",
  ];
  return `${[
    fields.map(csvCell).join(","),
    ...offers.map((offer) => fields.map((field) => csvCell(offer[field])).join(",")),
  ].join("\n")}\n`;
}
