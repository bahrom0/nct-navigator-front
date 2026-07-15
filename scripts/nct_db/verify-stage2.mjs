import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");

async function json(relativePath) {
  return JSON.parse(await readFile(path.join(ROOT, relativePath), "utf8"));
}

async function jsonl(relativePath) {
  return (await readFile(path.join(ROOT, relativePath), "utf8")).trim().split(/\r?\n/).map(JSON.parse);
}

async function sha256(relativePath) {
  return createHash("sha256").update(await readFile(path.join(ROOT, relativePath))).digest("hex");
}

const [staging, core, evidence, reviews, quality, inventory, khujand] = await Promise.all([
  jsonl("data/staging/ntc/staging_rows.jsonl"),
  json("data/core/ntc/draft_core.json"),
  json("data/reports/ntc/field_evidence.json"),
  json("data/reports/ntc/review_issues.json"),
  json("data/reports/ntc/quality_report.json"),
  json("data/reports/ntc/source_inventory.json"),
  json("data/reports/ntc/khujand_report.json"),
]);

const offers = core.admission_offers;
assert.equal(core.status, "draft_not_published");
assert.equal(staging.length, offers.length, "Raw -> Staging -> draft Core row count must be explained");
assert.equal(new Set(offers.map((offer) => offer.stable_key)).size, offers.length, "stable_key must be unique");
assert.equal(new Set(offers.map((offer) => `${offer.source.source_document_id}|${offer.source.source_row_id}`)).size, offers.length, "source document + row must be unique");
assert.ok(offers.every((offer) => offer.source.source_kind !== "legacy_json"), "legacy rows must never enter draft Core");
assert.ok(offers.every((offer) => offer.source.raw_text), "every offer must retain source raw text");
assert.equal(evidence.length, offers.reduce((sum, offer) => sum + Object.keys(offer.fields).length, 0), "every normalized field must have evidence");
assert.ok(evidence.every((item) => item.source_row_id && item.source_document_id));

const reviewIssues = reviews.issues;
for (const item of evidence.filter((entry) => entry.confidence < 0.5)) {
  assert.ok(reviewIssues.some((review) => review.source_row_id === item.source_row_id && review.field_name === item.field_name), `low-confidence ${item.field_name} lacks review issue`);
}
assert.ok(Object.values(quality.quality_gates).every(Boolean), "all Stage 2 quality gates must pass");
assert.equal(khujand.confirmed_by_official_location.length, khujand.summary.confirmed_by_official_location);
assert.ok(khujand.confirmed_by_official_location.every((item) => item.city === "Khujand"));

const institutionKeys = new Set((await json("data/core/ntc/reference/institutions.json")).map((item) => item.institution_key));
const campusKeys = new Set((await json("data/core/ntc/reference/institution_campuses.json")).map((item) => item.campus_key));
const specialtyKeys = new Set((await json("data/core/ntc/reference/specialties.json")).map((item) => item.specialty_key));
assert.ok(offers.every((offer) => !offer.fields.institution.normalized_value || institutionKeys.has(offer.fields.campus.normalized_value.institution_key)));
assert.ok(offers.every((offer) => !offer.campus_key || campusKeys.has(offer.campus_key)));
assert.ok(offers.every((offer) => !offer.specialty_key || specialtyKeys.has(offer.specialty_key)));

for (const source of inventory.sources.filter((item) => item.source_type === "legacy_json")) {
  assert.equal(await sha256(source.local_path), source.checksum, `${source.local_path} changed after inventory`);
}

const summary = {
  staging_rows: staging.length,
  draft_core_offers: offers.length,
  unique_stable_keys: new Set(offers.map((offer) => offer.stable_key)).size,
  field_evidence: evidence.length,
  review_issues: reviewIssues.length,
  all_quality_gates_passed: true,
  legacy_rows_in_core: 0,
  khujand_confirmed: khujand.summary.confirmed_by_official_location,
};

console.log(JSON.stringify(summary, null, 2));
