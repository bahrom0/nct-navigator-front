import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  NORMALIZER_VERSION,
  normalizeAdmissionPlan,
  normalizeCampus,
  normalizeCity,
  normalizeCluster,
  normalizeDirectField,
  normalizeEducationForm,
  normalizeEducationType,
  normalizeInstitution,
  normalizeLanguage,
  normalizeLocation,
  normalizeRegion,
  normalizeSpecialtyCode,
  normalizeSpecialtyName,
  normalizeTuitionFee,
  normalizedFieldWarnings,
  repairShiftedColumns,
  simplify,
  stableHash,
} from "./normalization.mjs";
import {
  buildFieldEvidence,
  buildKhujandReport,
  buildQualityReport,
  buildReferences,
  compareWithLegacy,
  renderKhujandMarkdown,
} from "./stage2-reports.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const STAGING_PATH = path.join(ROOT, "data/staging/ntc/staging_rows.jsonl");
const INVENTORY_PATH = path.join(ROOT, "data/reports/ntc/source_inventory.json");
const CORE_DIR = path.join(ROOT, "data/core/ntc");
const REFERENCE_DIR = path.join(CORE_DIR, "reference");
const REPORT_DIR = path.join(ROOT, "data/reports/ntc");

function isoNow() {
  return new Date().toISOString();
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function readJsonl(filePath) {
  const content = (await readFile(filePath, "utf8")).trim();
  return content ? content.split(/\r?\n/).map((line) => JSON.parse(line)) : [];
}

function sourceIdFromRow(row) {
  return row.staging_row_id.split(":p")[0];
}

function issue(row, issueType, severity, fieldName, message, details = {}) {
  return {
    issue_id: stableHash([row.staging_row_id, issueType, fieldName, JSON.stringify(details)], "review"),
    staging_row_id: row.staging_row_id,
    source_row_id: row.source_row_id,
    source_document_id: row.source_document_id,
    issue_type: issueType,
    severity,
    field_name: fieldName,
    message,
    details,
    review_status: "open",
    excluded_from_release: issueType === "year_period_mismatch",
  };
}

function normalizeOffer(row, source) {
  const context = {
    source_row_id: row.source_row_id,
    staging_row_id: row.staging_row_id,
    source_document_id: row.source_document_id,
    parse_warnings: row.parse_warnings,
    source,
  };
  const repair = repairShiftedColumns(row);
  // Repair candidates stay separate from official raw values. Stage 2 may
  // normalize them for review, but never overwrites source evidence.
  const locationRaw = row.parsed_fields.location;
  const formRaw = row.parsed_fields.education_form;
  const institution = normalizeInstitution(row.parsed_fields.institution, context);
  const location = normalizeLocation(locationRaw, context);
  const fields = {
    specialty_code: normalizeSpecialtyCode(row.parsed_fields.specialty_code, context),
    specialty_name: normalizeSpecialtyName(row.parsed_fields.specialty_name, context),
    institution,
    location,
    city: normalizeCity(locationRaw, context),
    region: normalizeRegion(locationRaw, context),
    campus: normalizeCampus(institution, location, context),
    education_form: normalizeEducationForm(formRaw, context),
    education_type: normalizeEducationType(row.parsed_fields.education_type, context),
    tuition_fee: normalizeTuitionFee(row.parsed_fields.tuition_fee, context),
    language: normalizeLanguage(row.parsed_fields.language, context),
    admission_plan: normalizeAdmissionPlan(row.parsed_fields.admission_plan, context),
    cluster: normalizeCluster(row.parsed_fields.cluster, context),
    education_level: normalizeDirectField(row.education_level, context, ["after_9", "after_11"]),
    academic_year: normalizeDirectField(row.academic_year, context),
    admission_period: normalizeDirectField(row.admission_period, context),
  };
  const sourceId = source.source_id;
  const stableKey = stableHash([
    sourceId,
    row.source_row_id,
    row.academic_year,
    row.admission_period,
    row.education_level,
  ], "offer");
  return {
    stable_key: stableKey,
    review_status: "pending_quality_checks",
    fields,
    repair_candidate: repair,
    parser_version: row.parser_version,
    normalizer_version: NORMALIZER_VERSION,
    source: {
      staging_row_id: row.staging_row_id,
      source_id: sourceId,
      source_document_id: row.source_document_id,
      source_row_id: row.source_row_id,
      source_page: row.source_page,
      source_row_number: row.source_row_number,
      source_kind: row.source_kind,
      source_language: source.language,
      source_checksum: source.checksum,
      raw_text: row.raw_text,
      parse_status: row.parse_status,
      parse_warnings: row.parse_warnings,
    },
  };
}

function buildReviewIssues(stagingRows, offers, sourceMap) {
  const issues = [];
  const requiredFields = [
    "specialty_code", "specialty_name", "institution", "location", "education_form",
    "education_type", "language", "admission_plan", "cluster", "education_level",
    "academic_year", "admission_period",
  ];
  for (const [index, offer] of offers.entries()) {
    const row = stagingRows[index];
    for (const fieldName of requiredFields) {
      const normalized = offer.fields[fieldName];
      const missing = normalized.normalized_value === null
        || normalized.normalized_value === undefined
        || (Array.isArray(normalized.normalized_value) && normalized.normalized_value.length === 0);
      if (missing) issues.push(issue(row, "missing_required_field", "high", fieldName, `Required normalized field ${fieldName} is missing.`, { raw_value: normalized.raw_value }));
    }
    if (!offer.fields.city.normalized_value && !offer.fields.region.normalized_value) {
      issues.push(issue(row, "unknown_city", "high", "city", "Official location could not be mapped to a reviewed city or district alias.", { raw_location: offer.fields.location.raw_value }));
    }
    if (offer.repair_candidate.requires_review) {
      issues.push(issue(row, "shifted_columns", "high", "row", "A coordinate or column repair candidate requires review.", offer.repair_candidate));
    }
    if (row.parse_warnings.includes("specialty_split_into_institution") || /\d{7,11}\s*[-–—]/u.test(String(row.parsed_fields.institution ?? ""))) {
      issues.push(issue(row, "specialty_split", "high", "specialty_name", "Specialty content may have been split into the institution cell."));
    }
    const institutionText = String(offer.fields.institution.raw_value ?? "");
    const mentionsKhujand = /худж|хуҷ/iu.test(institutionText);
    if (mentionsKhujand && offer.fields.city.normalized_value && offer.fields.city.normalized_value !== "Khujand") {
      issues.push(issue(row, "institution_location_conflict", "high", "city", "Institution name mentions Khujand but the official location field resolves elsewhere.", {
        institution: institutionText,
        official_location: offer.fields.location.raw_value,
        normalized_city: offer.fields.city.normalized_value,
      }));
    }
    for (const [fieldName, normalized] of Object.entries(offer.fields)) {
      if (normalized.confidence < 0.85) {
        issues.push(issue(row, "low_confidence_field", normalized.confidence < 0.5 ? "high" : "medium", fieldName, `Field confidence is ${normalized.confidence}.`, {
          warnings: normalized.warnings,
          confidence: normalized.confidence,
          raw_value: normalized.raw_value,
        }));
      }
    }
    const source = sourceMap.get(sourceIdFromRow(row));
    if (!source || row.academic_year !== source.academic_year || row.admission_period !== source.admission_period || row.education_level !== source.education_level) {
      issues.push(issue(row, "year_period_mismatch", "critical", "source_metadata", "Row metadata does not match its source inventory entry.", {
        row: { academic_year: row.academic_year, admission_period: row.admission_period, education_level: row.education_level },
        source: source ? { academic_year: source.academic_year, admission_period: source.admission_period, education_level: source.education_level } : null,
      }));
    }
  }
  return issues;
}

function addDuplicateIssues(stagingRows, offers, issues) {
  const groups = new Map();
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
    const group = groups.get(key) ?? [];
    group.push(offer);
    groups.set(key, group);
  }
  const rowMap = new Map(stagingRows.map((row) => [row.staging_row_id, row]));
  for (const [dedupeKey, group] of groups) {
    if (group.length < 2) continue;
    for (const offer of group) {
      const row = rowMap.get(offer.source.staging_row_id);
      issues.push(issue(row, "duplicate_candidate", "medium", "offer", "Offer has the same conservative dedupe fingerprint as another official row; no automatic merge was performed.", {
        dedupe_key: dedupeKey,
        candidate_stable_keys: group.map((item) => item.stable_key),
      }));
    }
  }
}

function finalizeReviewStatuses(offers, issues) {
  const byRow = new Map();
  for (const item of issues) {
    const rowIssues = byRow.get(item.staging_row_id) ?? [];
    rowIssues.push(item);
    byRow.set(item.staging_row_id, rowIssues);
  }
  for (const offer of offers) {
    const rowIssues = byRow.get(offer.source.staging_row_id) ?? [];
    offer.review_issue_ids = rowIssues.map((item) => item.issue_id);
    offer.review_status = rowIssues.some((item) => item.severity === "critical")
      ? "excluded_from_release"
      : rowIssues.length ? "needs_review" : "ready_for_stage3_review";
  }
}

function normalizationIssues(offers) {
  return offers.flatMap((offer) => {
    const entries = normalizedFieldWarnings(offer.fields).map((warning) => ({
      staging_row_id: offer.source.staging_row_id,
      source_row_id: offer.source.source_row_id,
      stable_key: offer.stable_key,
      ...warning,
    }));
    if (offer.repair_candidate.warnings.length) entries.push({
      staging_row_id: offer.source.staging_row_id,
      source_row_id: offer.source.source_row_id,
      stable_key: offer.stable_key,
      field_name: "row",
      warning: "repair_candidate",
      confidence: offer.repair_candidate.confidence,
      repair_candidate: offer.repair_candidate,
    });
    return entries;
  });
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

export async function runStage2() {
  await Promise.all([mkdir(CORE_DIR, { recursive: true }), mkdir(REFERENCE_DIR, { recursive: true }), mkdir(REPORT_DIR, { recursive: true })]);
  const [stagingRows, inventoryReport] = await Promise.all([readJsonl(STAGING_PATH), readJson(INVENTORY_PATH)]);
  const sources = inventoryReport.sources.filter((source) => source.source_type === "local_pdf" || source.source_type === "official_pdf" || source.source_type === "official_html");
  const sourceMap = new Map(sources.map((source) => [source.source_id, source]));
  const offers = stagingRows.map((row) => {
    const source = sourceMap.get(sourceIdFromRow(row));
    if (!source) throw new Error(`Source inventory entry missing for ${row.staging_row_id}`);
    return normalizeOffer(row, source);
  });
  const references = buildReferences(offers);
  const issues = buildReviewIssues(stagingRows, offers, sourceMap);
  addDuplicateIssues(stagingRows, offers, issues);
  finalizeReviewStatuses(offers, issues);
  const evidence = buildFieldEvidence(offers);
  const normIssues = normalizationIssues(offers);
  const quality = buildQualityReport(stagingRows, offers, issues, evidence, references);
  const khujand = buildKhujandReport(offers, issues);
  const legacyCompare = await compareWithLegacy(offers, [
    path.join(ROOT, "src/data/new_db.json"),
    path.join(ROOT, "src/data/nct-codes.json"),
  ]);
  const generatedAt = isoNow();
  const draftCore = {
    generated_at: generatedAt,
    normalizer_version: NORMALIZER_VERSION,
    status: "draft_not_published",
    grain: "one admission offer per Stage 1 staging row",
    source_row_count: stagingRows.length,
    admission_offer_count: offers.length,
    reference_counts: Object.fromEntries(Object.entries(references).map(([key, items]) => [key, items.length])),
    admission_offers: offers,
  };
  await Promise.all([
    writeJson(path.join(CORE_DIR, "draft_core.json"), draftCore),
    writeJson(path.join(REPORT_DIR, "normalization_issues.json"), { generated_at: generatedAt, count: normIssues.length, issues: normIssues }),
    writeJson(path.join(REPORT_DIR, "field_evidence.json"), evidence),
    writeJson(path.join(REPORT_DIR, "review_issues.json"), { generated_at: generatedAt, count: issues.length, issues }),
    writeJson(path.join(REPORT_DIR, "quality_report.json"), quality),
    writeJson(path.join(REPORT_DIR, "khujand_report.json"), khujand),
    writeFile(path.join(REPORT_DIR, "khujand_report.md"), renderKhujandMarkdown(khujand), "utf8"),
    writeJson(path.join(REPORT_DIR, "legacy_compare.json"), legacyCompare),
    ...Object.entries(references).map(([name, values]) => writeJson(path.join(REFERENCE_DIR, `${name}.json`), values)),
  ]);
  return {
    generated_at: generatedAt,
    staging_rows: stagingRows.length,
    draft_core_offers: offers.length,
    review_issues: issues.length,
    normalization_issues: normIssues.length,
    field_evidence: evidence.length,
    review_status_counts: offers.reduce((counts, offer) => {
      counts[offer.review_status] = (counts[offer.review_status] ?? 0) + 1;
      return counts;
    }, {}),
    quality_gates: quality.quality_gates,
    khujand_summary: khujand.summary,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runStage2()
    .then((summary) => console.log(JSON.stringify(summary, null, 2)))
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
