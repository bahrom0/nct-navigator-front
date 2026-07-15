import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  STAGE3_VERSION,
  buildAdmissionOffer,
  buildReleaseManifests,
  offersToCsv,
  partitionDraftOffers,
} from "./stage3-core.mjs";
import { SEARCH_SCHEMA_VERSION, buildSearchDocuments } from "./stage3-search.mjs";

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(SCRIPT_DIR, "../..");
const CORE_DIR = path.join(ROOT, "data/core/ntc");
const RELEASE_DIR = path.join(CORE_DIR, "releases");
const SEARCH_DIR = path.join(ROOT, "data/search/ntc");
const EXPORT_DIR = path.join(ROOT, "data/exports/ntc");
const REPORT_DIR = path.join(ROOT, "data/reports/ntc");
const REFERENCE_DIR = path.join(CORE_DIR, "reference");

const REFERENCE_FILES = [
  "cities.json", "clusters.json", "education_forms.json", "education_types.json",
  "institutions.json", "institution_aliases.json", "institution_campuses.json",
  "languages.json", "regions.json", "specialties.json",
];

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function writeJson(filePath, value) {
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function loadReferenceTables() {
  const tables = {};
  for (const fileName of REFERENCE_FILES) {
    tables[path.basename(fileName, ".json")] = await readJson(path.join(REFERENCE_DIR, fileName));
  }
  return tables;
}

function countBy(items, selector) {
  return Object.fromEntries([...items.reduce((map, item) => {
    const key = selector(item) ?? "null";
    map.set(key, (map.get(key) ?? 0) + 1);
    return map;
  }, new Map())].sort(([a], [b]) => String(a).localeCompare(String(b))));
}

function productFeaturesMarkdown({ offers, releases, exclusions, searchDocuments }) {
  return `# Возможности продукта на базе опубликованного NCT Core

Stage 3 подготовил чистый локальный read-model. Это описание возможностей, а не реализация нового UI и не подключение Supabase.

## Что уже доступно через данные и локальный адаптер

- Поиск опубликованных предложений по специальности, коду, учреждению, городу и производным ключевым словам.
- Фильтры по учебному году, периоду набора, уровню образования, кластеру, форме, типу оплаты и языку.
- Переход от результата к официальному источнику: документ, страница, строка и checksum.
- Отдельные релизы для разных годов, периодов и уровней образования.
- JSON и CSV для локальной проверки и последующей интеграции.

## Покрытие текущего релиза

- Опубликовано предложений: ${offers.length}.
- Поисковых документов: ${searchDocuments.length}.
- Релизов: ${releases.length}.
- Исключено до ручной проверки: ${exclusions.length}.

## Что намеренно не сделано

- Существующий пользовательский поиск не переключён автоматически с legacy JSON.
- Supabase, публичные API, RLS и миграции относятся к Stage 4.
- Таксономия и профессии являются производными rule-based подсказками, имеют статус \`needs_review\` и не считаются официальными данными НЦТ.
- Строки с конфликтами или незавершённой нормализацией не опубликованы; они сохранены в \`stage3_exclusions.json\`.
`;
}

export async function runStage3() {
  await Promise.all([RELEASE_DIR, SEARCH_DIR, EXPORT_DIR, REPORT_DIR].map((directory) => mkdir(directory, { recursive: true })));

  const [draftCore, reviewIssues, qualityReport, khujandReport, khujandMarkdown, referenceTables] = await Promise.all([
    readJson(path.join(CORE_DIR, "draft_core.json")),
    readJson(path.join(REPORT_DIR, "review_issues.json")),
    readJson(path.join(REPORT_DIR, "quality_report.json")),
    readJson(path.join(REPORT_DIR, "khujand_report.json")),
    readFile(path.join(REPORT_DIR, "khujand_report.md"), "utf8"),
    loadReferenceTables(),
  ]);
  const generatedAt = draftCore.generated_at;
  const reviewIssueById = new Map(reviewIssues.issues.map((issue) => [issue.issue_id, issue]));
  const { publishedDrafts, exclusions } = partitionDraftOffers(draftCore.admission_offers, reviewIssueById);
  const offers = publishedDrafts.map(({ draft, stableKey }) => buildAdmissionOffer(draft, stableKey))
    .sort((a, b) => a.stable_key.localeCompare(b.stable_key));
  const releases = buildReleaseManifests(offers, exclusions, generatedAt);
  const { documents, taxonomyMappings, professionMappings } = buildSearchDocuments(offers);

  for (const release of releases) {
    await writeJson(path.join(RELEASE_DIR, `${release.release_id}.json`), {
      manifest: release,
      offers: offers.filter((offer) => offer.release_id === release.release_id),
    });
  }

  const publishedDataset = {
    generated_at: generatedAt,
    stage3_version: STAGE3_VERSION,
    status: "published",
    record_count: offers.length,
    release_ids: releases.map((release) => release.release_id),
    offers,
  };
  const searchDataset = {
    generated_at: generatedAt,
    schema_version: SEARCH_SCHEMA_VERSION,
    source: "data/exports/ntc/nct_admission_offers.published.json",
    record_count: documents.length,
    documents,
  };
  const releaseManifest = {
    generated_at: generatedAt,
    stage3_version: STAGE3_VERSION,
    release_count: releases.length,
    published_record_count: offers.length,
    excluded_record_count: exclusions.length,
    releases,
  };
  const exclusionsReport = {
    generated_at: generatedAt,
    stage3_version: STAGE3_VERSION,
    draft_record_count: draftCore.admission_offer_count,
    published_record_count: offers.length,
    excluded_record_count: exclusions.length,
    counts_by_reason: countBy(exclusions, (item) => item.reason),
    counts_by_release: countBy(exclusions, (item) => item.release_id),
    exclusions: exclusions.sort((a, b) => a.staging_row_id.localeCompare(b.staging_row_id)),
  };
  const stage3Quality = {
    generated_at: generatedAt,
    stage3_version: STAGE3_VERSION,
    source_stage2_quality_gates: qualityReport.quality_gates ?? qualityReport.gates ?? null,
    counts: {
      draft: draftCore.admission_offer_count,
      published: offers.length,
      excluded: exclusions.length,
      search_documents: documents.length,
      releases: releases.length,
    },
    published_by_release: countBy(offers, (offer) => offer.release_id),
    published_by_education_level: countBy(offers, (offer) => offer.education_level),
    exclusions_by_reason: exclusionsReport.counts_by_reason,
    checks: {
      all_draft_rows_accounted_for: offers.length + exclusions.length === draftCore.admission_offer_count,
      stable_keys_unique: new Set(offers.map((offer) => offer.stable_key)).size === offers.length,
      search_matches_published: documents.length === offers.length,
      published_rows_have_no_conflicts: offers.every((offer) => !offer.confidence_summary.has_conflicts),
    },
  };

  await Promise.all([
    writeJson(path.join(EXPORT_DIR, "nct_admission_offers.published.json"), publishedDataset),
    writeFile(path.join(EXPORT_DIR, "nct_admission_offers.published.csv"), offersToCsv(offers), "utf8"),
    writeJson(path.join(EXPORT_DIR, "nct_reference_tables.json"), { generated_at: generatedAt, tables: referenceTables }),
    writeJson(path.join(EXPORT_DIR, "nct_release_manifest.json"), releaseManifest),
    writeJson(path.join(EXPORT_DIR, "khujand_report.json"), khujandReport),
    writeFile(path.join(EXPORT_DIR, "khujand_report.md"), khujandMarkdown, "utf8"),
    writeJson(path.join(SEARCH_DIR, "search_documents.json"), searchDataset),
    writeJson(path.join(SEARCH_DIR, "search_manifest.json"), {
      generated_at: generatedAt,
      schema_version: SEARCH_SCHEMA_VERSION,
      record_count: documents.length,
      source_record_count: offers.length,
      derived_fields: ["keywords", "transliterations", "synonyms", "taxonomy", "professions"],
    }),
    writeJson(path.join(SEARCH_DIR, "taxonomy_mappings.json"), { generated_at: generatedAt, mappings: taxonomyMappings }),
    writeJson(path.join(SEARCH_DIR, "profession_mappings.json"), { generated_at: generatedAt, mappings: professionMappings }),
    writeJson(path.join(REPORT_DIR, "stage3_exclusions.json"), exclusionsReport),
    writeJson(path.join(REPORT_DIR, "stage3_quality.json"), stage3Quality),
    writeFile(path.join(REPORT_DIR, "product_features.md"), productFeaturesMarkdown({ offers, releases, exclusions, searchDocuments: documents }), "utf8"),
  ]);

  return stage3Quality;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await runStage3();
  console.log(JSON.stringify(result, null, 2));
}
