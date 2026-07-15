import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildPublishedStableKey } from "./stage3-core.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const fromRoot = (...parts) => path.join(ROOT, ...parts);

async function readJson(...parts) {
  return JSON.parse(await readFile(fromRoot(...parts), "utf8"));
}

async function sha256(...parts) {
  const bytes = await readFile(fromRoot(...parts));
  return createHash("sha256").update(bytes).digest("hex");
}

function parseCsv(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"' && quoted && text[index + 1] === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') quoted = !quoted;
    else if (character === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if (character === "\n" && !quoted) {
      row.push(cell.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      cell = "";
    } else cell += character;
  }
  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }
  return rows;
}

const [draft, published, search, taxonomy, professions, manifest, exclusions, inventory, references] = await Promise.all([
  readJson("data", "core", "ntc", "draft_core.json"),
  readJson("data", "exports", "ntc", "nct_admission_offers.published.json"),
  readJson("data", "search", "ntc", "search_documents.json"),
  readJson("data", "search", "ntc", "taxonomy_mappings.json"),
  readJson("data", "search", "ntc", "profession_mappings.json"),
  readJson("data", "exports", "ntc", "nct_release_manifest.json"),
  readJson("data", "reports", "ntc", "stage3_exclusions.json"),
  readJson("data", "reports", "ntc", "source_inventory.json"),
  readJson("data", "exports", "ntc", "nct_reference_tables.json"),
]);
const csv = parseCsv(await readFile(fromRoot("data", "exports", "ntc", "nct_admission_offers.published.csv"), "utf8"));
const draftByStagingId = new Map(draft.admission_offers.map((offer) => [offer.source.staging_row_id, offer]));
const publishedKeys = published.offers.map((offer) => offer.stable_key);
const searchKeys = search.documents.map((document) => document.offer_stable_key);
const excludedIds = new Set(exclusions.exclusions.map((item) => item.staging_row_id));
const stage2ReviewIds = new Set(draft.admission_offers.filter((offer) => offer.review_status !== "ready_for_stage3_review").map((offer) => offer.source.staging_row_id));

assert.equal(published.record_count, published.offers.length, "published record_count mismatch");
assert.equal(exclusions.excluded_record_count, exclusions.exclusions.length, "exclusion count mismatch");
assert.equal(published.offers.length + exclusions.exclusions.length, draft.admission_offer_count, "draft rows are not fully accounted for");
assert.equal(new Set(publishedKeys).size, publishedKeys.length, "published stable keys are not unique");
assert.ok(published.offers.every((offer) => offer.official_status === "published"), "non-published status leaked into export");
assert.ok(published.offers.every((offer) => offer.confidence_summary.has_conflicts === false), "conflicted row leaked into export");
assert.ok(published.offers.every((offer) => offer.source.source_id.startsWith("ntc_pdf_")), "non-official or legacy source leaked into export");
assert.ok(published.offers.every((offer) => !stage2ReviewIds.has(offer.source.staging_row_id)), "Stage 2 review row leaked into export");
assert.ok([...stage2ReviewIds].every((id) => excludedIds.has(id)), "Stage 2 review row is missing from exclusions");

for (const offer of published.offers) {
  const sourceDraft = draftByStagingId.get(offer.source.staging_row_id);
  assert.ok(sourceDraft, `draft source missing for ${offer.stable_key}`);
  assert.equal(offer.stable_key, buildPublishedStableKey(sourceDraft), `unstable key for ${offer.stable_key}`);
  assert.ok(offer.source.source_document_id && offer.source.source_row_id && offer.source.source_checksum, `incomplete provenance for ${offer.stable_key}`);
}

assert.equal(search.record_count, published.record_count, "search and published counts differ");
assert.deepEqual([...searchKeys].sort(), [...publishedKeys].sort(), "search documents are not derived one-to-one from published offers");
assert.equal(csv.length - 1, published.record_count, "CSV and JSON row counts differ");
assert.deepEqual(csv.slice(1).map((row) => row[1]).sort(), [...publishedKeys].sort(), "CSV and JSON stable keys differ");

assert.equal(manifest.release_count, 2, "expected two independent releases");
assert.equal(manifest.releases.reduce((sum, release) => sum + release.record_count, 0), published.record_count, "release counts do not sum to published count");
assert.equal(new Set(manifest.releases.map((release) => `${release.academic_year}:${release.admission_period}:${release.education_level}`)).size, 2, "release boundaries collapsed");
for (const release of manifest.releases) {
  const releaseFile = await readJson("data", "core", "ntc", "releases", `${release.release_id}.json`);
  assert.equal(releaseFile.manifest.release_id, release.release_id, "release file manifest mismatch");
  assert.equal(releaseFile.offers.length, release.record_count, "release file row count mismatch");
}

assert.equal(taxonomy.mappings.length, published.record_count, "taxonomy mapping count mismatch");
assert.equal(professions.mappings.length, published.record_count, "profession mapping count mismatch");
assert.ok([...taxonomy.mappings, ...professions.mappings].every((mapping) =>
  mapping.mapping_method === "rule" && mapping.review_status === "needs_review" && mapping.is_official === false),
"derived mappings are not clearly marked as non-official review data");
assert.ok(Object.keys(references.tables).length >= 10, "reference export is incomplete");

const legacySources = inventory.sources.filter((source) => source.source_type === "legacy_json");
assert.equal(legacySources.length, 2, "legacy inventory must contain two comparison files");
for (const source of legacySources) {
  assert.equal(await sha256(...source.local_path.split("/")), source.checksum, `legacy input changed: ${source.local_path}`);
}
assert.equal(
  await sha256("data", "reports", "ntc", "khujand_report.json"),
  await sha256("data", "exports", "ntc", "khujand_report.json"),
  "Khujand JSON export differs from reviewed report",
);
assert.equal(
  await sha256("data", "reports", "ntc", "khujand_report.md"),
  await sha256("data", "exports", "ntc", "khujand_report.md"),
  "Khujand Markdown export differs from reviewed report",
);

const result = {
  status: "ok",
  draft: draft.admission_offer_count,
  published: published.record_count,
  excluded: exclusions.excluded_record_count,
  releases: Object.fromEntries(manifest.releases.map((release) => [release.release_id, release.record_count])),
  search_documents: search.record_count,
  stable_key_collisions_excluded: exclusions.exclusions.filter((item) => item.reason === "stable_key_collision").length,
  legacy_inputs_unchanged: legacySources.map((source) => source.local_path),
};
console.log(JSON.stringify(result, null, 2));
