import { createHash } from "node:crypto";
import { copyFile, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export const PARSER_VERSION = "nct-stage1-coordinate-v1.0.0";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const RAW_DIR = path.join(ROOT, "data/raw/ntc");
const STAGING_DIR = path.join(ROOT, "data/staging/ntc");
const REPORT_DIR = path.join(ROOT, "data/reports/ntc");

const WARNING_TYPES = [
  "location_contains_education_form",
  "institution_contains_location",
  "specialty_split_into_institution",
  "missing_location",
  "missing_admission_plan",
  "unrecognized_language",
  "row_shift_suspected",
  "page_layout_changed",
];

const SOURCE_DEFINITIONS = [
  {
    source_id: "ntc_pdf_after_11_remaining_2025",
    source_type: "local_pdf",
    title: "Перечень оставшихся мест, база 11 классов, четвертый период",
    local_path: "pdf/11_class_all.pdf",
    academic_year: "2025",
    admission_period: "fourth_or_remaining_seats",
    education_level: "after_11",
    language: "ru",
    is_official: true,
    completeness: "remaining_seats",
    layout_profile: "after_11_ru_remaining_seats_2025",
    notes: ["Официальный локальный PDF; не является полным планом 2026-2027."],
  },
  {
    source_id: "ntc_pdf_after_9_plan_2026_2027",
    source_type: "local_pdf",
    title: "План приема 2026-2027, база 9 классов, первый период",
    local_path: "pdf/9_class.pdf",
    academic_year: "2026-2027",
    admission_period: "first",
    education_level: "after_9",
    language: "tg",
    is_official: true,
    completeness: "full_plan",
    layout_profile: "after_9_tg_full_plan_2026",
    notes: ["Официальный локальный PDF."],
  },
  {
    source_id: "legacy_new_db_json",
    source_type: "legacy_json",
    title: "Legacy new_db.json",
    local_path: "src/data/new_db.json",
    academic_year: null,
    admission_period: null,
    education_level: null,
    language: "mixed",
    is_official: false,
    completeness: "unknown",
    notes: ["Только legacy_compare/inventory; не источник истины и не вход staging."],
  },
  {
    source_id: "legacy_nct_codes_json",
    source_type: "legacy_json",
    title: "Legacy nct-codes.json",
    local_path: "src/data/nct-codes.json",
    academic_year: null,
    admission_period: null,
    education_level: null,
    language: "mixed",
    is_official: false,
    completeness: "unknown",
    notes: ["Только legacy_compare/inventory; не источник истины и не вход staging."],
  },
  ...[
    ["ntc_admission_plan_page", "План приема НЦТ", "https://ntc.tj/tj/ba-dovtalab/nakshai-kabul.html", "unknown"],
    ["stat_ntc_y26_rplan", "Статистический план приема Y26", "https://stat.ntc.tj/Y26/RPlan", "full_plan"],
    ["spec_ntc", "Справочник специальностей НЦТ", "https://spec.ntc.tj/", "guide"],
    ["ntc_announcements", "Объявления НЦТ", "https://ntc.tj/tj/elon1-3.html", "unknown"],
    ["ntc_institutions", "Учреждения НЦТ", "https://ntc.tj/tj/ba-dovtalab/muassisaho.html", "institution_list"],
    ["ntc_applicant_guide", "Руководство абитуриента НЦТ", "https://ntc.tj/tj/ba-dovtalab/rohnamoi-dovtalab.html", "guide"],
  ].map(([source_id, title, url, completeness]) => ({
    source_id,
    source_type: "official_html",
    title,
    url,
    local_path: null,
    academic_year: source_id === "stat_ntc_y26_rplan" ? "2026-2027" : null,
    admission_period: null,
    education_level: null,
    language: "tg",
    is_official: true,
    completeness,
    notes: ["HTML snapshot будет добавлен при доступности сети."],
  })),
];

const LAYOUT_PROFILES = {
  after_11_ru_remaining_seats_2025: {
    profile: "after_11_ru_remaining_seats_2025",
    columns: [
      ["specialty", 38, 260],
      ["institution", 260, 489],
      ["location", 489, 567],
      ["education_form", 567, 638],
      ["education_type", 638, 709],
      ["language", 709, 771],
      ["admission_plan", 771, 820],
    ],
    anchor: (word) => word.x0 < 105 && /^\d{7,10}$/.test(word.text),
    tableEvidence: (words) => hasAny(words, ["заочная", "дистанционная"]) && hasAny(words, ["таджикский", "русский"]),
  },
  after_9_tg_full_plan_2026: {
    profile: "after_9_tg_full_plan_2026",
    columns: [
      ["nct_row_id", 38, 70],
      ["specialty", 70, 281],
      ["institution", 281, 551],
      ["location", 551, 613],
      ["education_form", 613, 654],
      ["education_type", 654, 718],
      ["language", 718, 771],
      ["admission_plan", 771, 820],
    ],
    anchor: (word) => word.x0 < 70 && /^\d{4}$/.test(word.text),
    tableEvidence: (words) => hasAny(words, ["рӯзона", "ғоибона"]) && hasAny(words, ["тоҷикӣ", "русӣ"]),
  },
};

function hasAny(words, values) {
  const text = words.map((word) => word.text.toLocaleLowerCase()).join(" ");
  return values.some((value) => text.includes(value));
}

function isoNow() {
  return new Date().toISOString();
}

function normalizeSpace(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

async function sha256File(filePath) {
  return createHash("sha256").update(await readFile(filePath)).digest("hex");
}

async function ensureDirectories() {
  await Promise.all([
    mkdir(path.join(RAW_DIR, "pdf"), { recursive: true }),
    mkdir(path.join(RAW_DIR, "html"), { recursive: true }),
    mkdir(path.join(RAW_DIR, "legacy"), { recursive: true }),
    mkdir(STAGING_DIR, { recursive: true }),
    mkdir(path.join(REPORT_DIR, "pdf_page_samples"), { recursive: true }),
  ]);
}

async function inspectPdf(relativePath) {
  const bytes = new Uint8Array(await readFile(path.join(ROOT, relativePath)));
  const pdf = await getDocument({ data: bytes, useSystemFonts: true }).promise;
  const pageCount = pdf.numPages;
  await pdf.cleanup?.();
  return pageCount;
}

export async function inventorySources(inputs = SOURCE_DEFINITIONS) {
  const items = [];
  for (const source of inputs) {
    const item = {
      source_id: source.source_id,
      source_type: source.source_type,
      title: source.title,
      url: source.url ?? null,
      local_path: source.local_path ?? null,
      academic_year: source.academic_year ?? null,
      admission_period: source.admission_period ?? null,
      education_level: source.education_level ?? null,
      language: source.language ?? null,
      page_count: null,
      checksum: null,
      downloaded_at: null,
      is_official: source.is_official,
      completeness: source.completeness,
      availability: source.url ? "not_attempted" : "available_local",
      notes: [...source.notes],
      layout_profile: source.layout_profile ?? null,
    };
    if (source.local_path) {
      const absolutePath = path.join(ROOT, source.local_path);
      item.checksum = await sha256File(absolutePath);
      if (source.source_type === "local_pdf") item.page_count = await inspectPdf(source.local_path);
    }
    items.push(item);
  }
  return items;
}

export async function saveRawPdfSnapshot(source) {
  const inputPath = path.join(ROOT, source.local_path);
  const outputPath = path.join(RAW_DIR, "pdf", `${source.source_id}.pdf`);
  await copyFile(inputPath, outputPath);
  const rawDocument = {
    source_document_id: `${source.source_id}_${source.checksum.slice(0, 12)}`,
    source_id: source.source_id,
    source_kind: source.source_type,
    original_path: source.local_path,
    local_path: path.relative(ROOT, outputPath).replaceAll("\\", "/"),
    checksum: source.checksum,
    downloaded_at: isoNow(),
    http_metadata: null,
  };
  await writeFile(`${outputPath}.metadata.json`, `${JSON.stringify(rawDocument, null, 2)}\n`, "utf8");
  return rawDocument;
}

export async function saveRawHtmlSnapshot(source, html, httpMetadata = {}) {
  if (typeof html !== "string") throw new Error(`HTML content is required for ${source.source_id}`);
  const outputPath = path.join(RAW_DIR, "html", `${source.source_id}.html`);
  await writeFile(outputPath, html, "utf8");
  const checksum = createHash("sha256").update(html).digest("hex");
  const rawDocument = {
    source_document_id: `${source.source_id}_${checksum.slice(0, 12)}`,
    source_id: source.source_id,
    source_kind: source.source_type,
    original_url: source.url,
    local_path: path.relative(ROOT, outputPath).replaceAll("\\", "/"),
    checksum,
    downloaded_at: isoNow(),
    http_metadata: httpMetadata,
  };
  await writeFile(`${outputPath}.metadata.json`, `${JSON.stringify(rawDocument, null, 2)}\n`, "utf8");
  return rawDocument;
}

export async function saveLegacySnapshot(sourceOrPath) {
  const source = typeof sourceOrPath === "string"
    ? SOURCE_DEFINITIONS.find((item) => item.local_path === sourceOrPath)
    : sourceOrPath;
  if (!source) throw new Error(`Unknown legacy source: ${sourceOrPath}`);
  const inputPath = path.join(ROOT, source.local_path);
  const checksum = await sha256File(inputPath);
  const outputPath = path.join(RAW_DIR, "legacy", `${source.source_id}.json`);
  await copyFile(inputPath, outputPath);
  const rawDocument = {
    source_document_id: `${source.source_id}_${checksum.slice(0, 12)}`,
    source_id: source.source_id,
    source_kind: "legacy_json",
    usage: "legacy_compare_only",
    original_path: source.local_path,
    local_path: path.relative(ROOT, outputPath).replaceAll("\\", "/"),
    checksum,
    downloaded_at: isoNow(),
  };
  await writeFile(`${outputPath}.metadata.json`, `${JSON.stringify(rawDocument, null, 2)}\n`, "utf8");
  return rawDocument;
}

async function fetchHtmlSnapshots(inventory) {
  const rawDocuments = [];
  for (const source of inventory.filter((item) => item.source_type === "official_html")) {
    try {
      const response = await fetch(source.url, { signal: AbortSignal.timeout(12_000) });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const html = await response.text();
      const raw = await saveRawHtmlSnapshot(source, html, {
        status: response.status,
        content_type: response.headers.get("content-type"),
        last_modified: response.headers.get("last-modified"),
      });
      source.availability = "downloaded";
      source.checksum = raw.checksum;
      source.downloaded_at = raw.downloaded_at;
      source.local_path = raw.local_path;
      rawDocuments.push(raw);
    } catch (error) {
      source.availability = "unavailable";
      source.notes.push(`Snapshot error: ${error.message}`);
    }
  }
  return rawDocuments;
}

function decodeHtml(value) {
  return value
    .replace(/<br\s*\/?\s*>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&#39;/gi, "'")
    .replace(/&quot;/gi, '"');
}

export async function parseOfficialStatPlan(rawHtml, sourceMetadata = {}) {
  const html = await readFile(path.join(ROOT, rawHtml.local_path), "utf8");
  const rows = [...html.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)];
  const output = [];
  let sourceRowNumber = 0;
  for (const match of rows) {
    const cells = [...match[1].matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)]
      .map((cell) => normalizeSpace(decodeHtml(cell[1])));
    if (cells.length < 5 || cells.every((cell) => !cell)) continue;
    sourceRowNumber += 1;
    const parsedFields = {
      nct_row_id: cells[0] ?? null,
      cluster: cells[1] ?? null,
      institution: cells[2] ?? null,
      specialty_code: cells[3] ?? null,
      specialty_name: cells[4] ?? null,
      education_form: cells[5] ?? null,
      education_type: cells[6] ?? null,
      tuition_fee: cells[7] ?? null,
      language: cells[8] ?? null,
      admission_plan: cells[9] ?? null,
    };
    const warnings = [];
    if (!parsedFields.institution || !parsedFields.specialty_code) warnings.push("row_shift_suspected");
    if (!parsedFields.admission_plan) warnings.push("missing_admission_plan");
    output.push(makeStagingRow({
      rawDocument: rawHtml,
      sourceMetadata,
      sourcePage: null,
      sourceRowNumber,
      sourceRowId: parsedFields.nct_row_id || `html-row-${sourceRowNumber}`,
      rawText: cells.join(" | "),
      rawFields: { cells },
      parsedFields,
      warnings,
    }));
  }
  return output;
}

function splitTextItem(item, pageHeight) {
  const text = normalizeSpace(item.str);
  if (!text) return [];
  const tokens = text.split(" ");
  const totalCharacters = Math.max(1, tokens.reduce((sum, token) => sum + token.length, 0) + tokens.length - 1);
  let cursor = item.transform[4];
  const unit = item.width / totalCharacters;
  return tokens.map((token) => {
    const word = {
      text: token,
      x0: Number(cursor.toFixed(3)),
      x1: Number((cursor + unit * token.length).toFixed(3)),
      top: Number((pageHeight - item.transform[5] - Math.abs(item.height || item.transform[3])).toFixed(3)),
      bottom: Number((pageHeight - item.transform[5]).toFixed(3)),
    };
    cursor += unit * (token.length + 1);
    return word;
  });
}

export async function extractPdfPageWords(pdfPath, pageNumber, loadedPdf = null) {
  const ownsPdf = !loadedPdf;
  const pdf = loadedPdf ?? await getDocument({ data: new Uint8Array(await readFile(pdfPath)), useSystemFonts: true }).promise;
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  const content = await page.getTextContent({ disableNormalization: false });
  const words = content.items
    .flatMap((item) => splitTextItem(item, viewport.height))
    .sort((a, b) => a.top - b.top || a.x0 - b.x0);
  const result = { page_number: pageNumber, width: viewport.width, height: viewport.height, words };
  if (ownsPdf) await pdf.cleanup?.();
  return result;
}

export function detectPdfTableLayout(pageWords, profileName) {
  const profile = LAYOUT_PROFILES[profileName] ?? null;
  if (!profile) return { profile: "unknown", is_table_page: false, columns: [], anchors: [], layout_changed: true };
  const anchors = pageWords.words.filter(profile.anchor);
  const isTablePage = anchors.length > 0 && profile.tableEvidence(pageWords.words);
  const expectedAnchorX = profileName.startsWith("after_9") ? 48 : 45;
  const medianAnchorX = anchors.length ? anchors.map((word) => word.x0).sort((a, b) => a - b)[Math.floor(anchors.length / 2)] : null;
  const layoutChanged = isTablePage && Math.abs(medianAnchorX - expectedAnchorX) > 8;
  return {
    profile: profile.profile,
    is_table_page: isTablePage,
    columns: profile.columns.map(([name, x0, x1]) => ({ name, x0, x1 })),
    anchors,
    median_anchor_x: medianAnchorX,
    layout_changed: layoutChanged,
  };
}

function wordsToText(words) {
  const lines = [];
  for (const word of [...words].sort((a, b) => a.top - b.top || a.x0 - b.x0)) {
    const current = lines.at(-1);
    if (!current || Math.abs(current.top - word.top) > 3.2) lines.push({ top: word.top, words: [word] });
    else current.words.push(word);
  }
  return normalizeSpace(lines.map((line) => line.words.sort((a, b) => a.x0 - b.x0).map((word) => word.text).join(" ")).join(" "));
}

export function extractPdfRows(pageWords, layout) {
  if (!layout.is_table_page) return [];
  const anchors = [...layout.anchors].sort((a, b) => a.top - b.top);
  return anchors.map((anchor, index) => {
    const previous = anchors[index - 1];
    const next = anchors[index + 1];
    const top = previous ? (previous.top + anchor.top) / 2 : Math.max(95, anchor.top - (next ? (next.top - anchor.top) / 2 : 10));
    const bottom = next ? (anchor.top + next.top) / 2 : Math.min(pageWords.height - 25, anchor.bottom + (previous ? (anchor.top - previous.top) / 2 : 14));
    const rowWords = pageWords.words.filter((word) => word.top >= top && word.top < bottom && word.top > 95);
    const cells = {};
    const coordinateCells = {};
    for (const column of layout.columns) {
      const cellWords = rowWords.filter((word) => {
        const center = (word.x0 + word.x1) / 2;
        return center >= column.x0 && center < column.x1;
      });
      cells[column.name] = wordsToText(cellWords);
      coordinateCells[column.name] = cellWords;
    }
    return {
      anchor,
      top,
      bottom,
      raw_text: wordsToText(rowWords),
      cells,
      coordinate_cells: coordinateCells,
    };
  });
}

export function mergeMultilineCells(rows) {
  return rows.map((row) => ({
    ...row,
    cells: Object.fromEntries(Object.entries(row.cells).map(([key, value]) => [key, normalizeSpace(value)])),
  }));
}

function detectCluster(words, previousCluster) {
  const heading = words.filter((word) => word.top < 125).map((word) => word.text).join(" ");
  const ru = heading.match(/([1-5])\s*-?\s*(?:ЫЙ|ОЙ|ИЙ)\s+КЛАСТЕР/i);
  const tg = heading.match(/ГУРӮҲИ[^\d]{0,100}([1-5])\s*[-–—]/iu);
  return (ru ?? tg)?.[1] ?? previousCluster ?? null;
}

function parseSpecialtyCell(value, anchorCode) {
  const normalized = normalizeSpace(value);
  const anchorIndex = normalized.indexOf(anchorCode);
  const relevant = anchorIndex >= 0 ? normalized.slice(anchorIndex) : normalized;
  const match = relevant.match(/^(\d{7,10})\s*[-–—:]?\s*(.*)$/u);
  return { specialty_code: match?.[1] ?? anchorCode ?? null, specialty_name: normalizeSpace(match?.[2]) || null };
}

function parseTuition(value) {
  const match = value.match(/\(([^)]+)\)/);
  return match?.[1] ?? null;
}

function buildWarnings(cells, parsedFields, layoutChanged, specialtyAnchorText) {
  const warnings = [];
  const formPattern = /заоч|дистанц|рӯзона|ғоибона|фосилав/iu;
  const locationPattern = /(?:город|район|шаҳр|ноҳия)\s+[\p{L}-]+/iu;
  if (formPattern.test(cells.location)) warnings.push("location_contains_education_form");
  if (!cells.location) warnings.push("missing_location");
  if (!cells.location && locationPattern.test(cells.institution)) warnings.push("institution_contains_location");
  if (/\d{7,10}\s*[-–—]/u.test(cells.institution)) warnings.push("specialty_split_into_institution");
  if (!parsedFields.admission_plan || !/\d/u.test(parsedFields.admission_plan)) warnings.push("missing_admission_plan");
  if (parsedFields.language && !/(?:таджик|русск|узбек|англи|тоҷик|русӣ|ӯзбек|англис)/iu.test(parsedFields.language)) warnings.push("unrecognized_language");
  if (specialtyAnchorText && !normalizeSpace(cells.specialty).startsWith(specialtyAnchorText)) warnings.push("row_shift_suspected");
  if (!parsedFields.specialty_code || !parsedFields.specialty_name || !parsedFields.institution || !parsedFields.education_form || !parsedFields.education_type) {
    warnings.push("row_shift_suspected");
  }
  if (layoutChanged) warnings.push("page_layout_changed");
  return [...new Set(warnings)];
}

function makeStagingRow({ rawDocument, sourceMetadata, sourcePage, sourceRowNumber, sourceRowId, rawText, rawFields, parsedFields, warnings, error = null }) {
  const missingCritical = !parsedFields.specialty_code || !parsedFields.institution || !parsedFields.admission_plan;
  const parseStatus = error ? "error" : missingCritical ? "incomplete" : warnings.length ? "warning" : "ok";
  return {
    staging_row_id: `${rawDocument.source_id}:p${sourcePage ?? "html"}:r${sourceRowNumber}`,
    source_document_id: rawDocument.source_document_id,
    source_row_id: String(sourceRowId),
    source_kind: rawDocument.source_kind,
    academic_year: sourceMetadata.academic_year ?? null,
    admission_period: sourceMetadata.admission_period ?? null,
    education_level: sourceMetadata.education_level ?? null,
    source_page: sourcePage,
    source_row_number: sourceRowNumber,
    raw_text: rawText,
    raw_fields: rawFields,
    parsed_fields: parsedFields,
    parse_status: parseStatus,
    parse_warnings: warnings,
    parser_version: PARSER_VERSION,
    processed_at: isoNow(),
    ...(error ? { parse_error: error } : {}),
  };
}

export async function parsePdfAdmissionRows(rawDocument, sourceMetadata) {
  const absolutePath = path.join(ROOT, rawDocument.local_path);
  const pdf = await getDocument({ data: new Uint8Array(await readFile(absolutePath)), useSystemFonts: true }).promise;
  const stagingRows = [];
  const pageDiagnostics = [];
  let currentCluster = null;
  try {
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
      try {
        const pageWords = await extractPdfPageWords(absolutePath, pageNumber, pdf);
        currentCluster = detectCluster(pageWords.words, currentCluster);
        const layout = detectPdfTableLayout(pageWords, sourceMetadata.layout_profile);
        pageDiagnostics.push({
          page: pageNumber,
          word_count: pageWords.words.length,
          admission_anchor_count: layout.anchors.length,
          is_table_page: layout.is_table_page,
          layout_changed: layout.layout_changed,
          cluster: currentCluster,
        });
        if (!layout.is_table_page) continue;
        const rawRows = mergeMultilineCells(extractPdfRows(pageWords, layout), layout);
        for (const [index, rawRow] of rawRows.entries()) {
          const specialtyAnchorText = sourceMetadata.layout_profile === "after_11_ru_remaining_seats_2025"
            ? rawRow.anchor.text
            : null;
          const specialty = parseSpecialtyCell(rawRow.cells.specialty, specialtyAnchorText);
          const parsedFields = {
            nct_row_id: rawRow.cells.nct_row_id || null,
            cluster: currentCluster,
            institution: rawRow.cells.institution || null,
            location: rawRow.cells.location || null,
            specialty_code: specialty.specialty_code,
            specialty_name: specialty.specialty_name,
            education_form: rawRow.cells.education_form || null,
            education_type: rawRow.cells.education_type || null,
            tuition_fee: parseTuition(rawRow.cells.education_type),
            language: rawRow.cells.language || null,
            admission_plan: rawRow.cells.admission_plan || null,
          };
          const warnings = buildWarnings(rawRow.cells, parsedFields, layout.layout_changed, specialtyAnchorText);
          const sourceRowNumber = index + 1;
          stagingRows.push(makeStagingRow({
            rawDocument,
            sourceMetadata,
            sourcePage: pageNumber,
            sourceRowNumber,
            sourceRowId: parsedFields.nct_row_id || `${pageNumber}-${sourceRowNumber}`,
            rawText: rawRow.raw_text,
            rawFields: { ...rawRow.cells, coordinate_cells: rawRow.coordinate_cells },
            parsedFields,
            warnings,
          }));
        }
        if (pageDiagnostics.filter((page) => page.is_table_page).length === 1 || layout.layout_changed) {
          const samplePath = path.join(REPORT_DIR, "pdf_page_samples", `${sourceMetadata.source_id}_page_${pageNumber}.json`);
          await writeFile(samplePath, `${JSON.stringify({ source_id: sourceMetadata.source_id, page: pageNumber, layout, words: pageWords.words }, null, 2)}\n`, "utf8");
        }
      } catch (error) {
        pageDiagnostics.push({ page: pageNumber, is_table_page: null, error: error.message });
        stagingRows.push(makeStagingRow({
          rawDocument,
          sourceMetadata,
          sourcePage: pageNumber,
          sourceRowNumber: 0,
          sourceRowId: `${pageNumber}-page-error`,
          rawText: "",
          rawFields: {},
          parsedFields: {},
          warnings: ["page_layout_changed"],
          error: error.message,
        }));
      }
    }
  } finally {
    await pdf.cleanup?.();
  }
  return { stagingRows, pageDiagnostics };
}

function increment(record, key) {
  const safeKey = key ?? "null";
  record[safeKey] = (record[safeKey] ?? 0) + 1;
}

function buildReports(rows, inventory, pageDiagnosticsBySource, onlineAttempted) {
  const coverage = {
    generated_at: isoNow(),
    parser_version: PARSER_VERSION,
    total_rows: rows.length,
    counts_by_source: {},
    counts_by_source_and_status: {},
    counts_by_status: {},
    counts_by_page: {},
    counts_by_cluster: {},
    counts_by_education_level: {},
    page_diagnostics_by_source: pageDiagnosticsBySource,
  };
  const warnings = {
    generated_at: isoNow(),
    parser_version: PARSER_VERSION,
    known_warning_types: WARNING_TYPES,
    total_rows_with_warnings: 0,
    counts_by_warning: {},
    counts_by_source: {},
    examples_by_warning: {},
  };
  for (const row of rows) {
    const sourceId = inventory.find((source) => row.source_document_id.startsWith(source.source_id))?.source_id ?? row.source_document_id;
    increment(coverage.counts_by_source, sourceId);
    coverage.counts_by_source_and_status[sourceId] ??= {};
    increment(coverage.counts_by_source_and_status[sourceId], row.parse_status);
    increment(coverage.counts_by_status, row.parse_status);
    increment(coverage.counts_by_education_level, row.education_level);
    increment(coverage.counts_by_cluster, row.parsed_fields.cluster);
    coverage.counts_by_page[sourceId] ??= {};
    increment(coverage.counts_by_page[sourceId], row.source_page);
    if (row.parse_warnings.length) warnings.total_rows_with_warnings += 1;
    for (const warning of row.parse_warnings) {
      increment(warnings.counts_by_warning, warning);
      warnings.counts_by_source[sourceId] ??= {};
      increment(warnings.counts_by_source[sourceId], warning);
      warnings.examples_by_warning[warning] ??= [];
      if (warnings.examples_by_warning[warning].length < 10) {
        warnings.examples_by_warning[warning].push({ staging_row_id: row.staging_row_id, raw_text: row.raw_text });
      }
    }
  }
  const sourceInventory = {
    generated_at: isoNow(),
    online_access_attempted: onlineAttempted,
    online_access_summary: onlineAttempted
      ? "See availability and notes for each official_html source. Local PDFs and legacy inventory continue independently."
      : "Not attempted. Run with --fetch-html when network access is available; local Stage 1 is complete without HTML snapshots.",
    sources: inventory,
  };
  return { coverage, warnings, sourceInventory };
}

export async function runStage1({ fetchHtml = false } = {}) {
  await ensureDirectories();
  const inventory = await inventorySources();
  const pdfRawDocuments = [];
  for (const source of inventory.filter((item) => item.source_type === "local_pdf")) {
    const raw = await saveRawPdfSnapshot(source);
    source.downloaded_at = raw.downloaded_at;
    pdfRawDocuments.push(raw);
  }
  for (const source of inventory.filter((item) => item.source_type === "legacy_json")) {
    const raw = await saveLegacySnapshot(source);
    source.downloaded_at = raw.downloaded_at;
  }
  const htmlRawDocuments = fetchHtml ? await fetchHtmlSnapshots(inventory) : [];
  const allRows = [];
  const pageDiagnosticsBySource = {};
  for (const rawDocument of pdfRawDocuments) {
    const source = inventory.find((item) => item.source_id === rawDocument.source_id);
    const parsed = await parsePdfAdmissionRows(rawDocument, source);
    allRows.push(...parsed.stagingRows);
    pageDiagnosticsBySource[source.source_id] = parsed.pageDiagnostics;
  }
  for (const rawDocument of htmlRawDocuments.filter((item) => item.source_id === "stat_ntc_y26_rplan")) {
    const source = inventory.find((item) => item.source_id === rawDocument.source_id);
    allRows.push(...await parseOfficialStatPlan(rawDocument, source));
  }
  await writeFile(path.join(STAGING_DIR, "staging_rows.jsonl"), `${allRows.map((row) => JSON.stringify(row)).join("\n")}\n`, "utf8");
  const reports = buildReports(allRows, inventory, pageDiagnosticsBySource, fetchHtml);
  await Promise.all([
    writeFile(path.join(REPORT_DIR, "source_inventory.json"), `${JSON.stringify(reports.sourceInventory, null, 2)}\n`, "utf8"),
    writeFile(path.join(REPORT_DIR, "parser_coverage.json"), `${JSON.stringify(reports.coverage, null, 2)}\n`, "utf8"),
    writeFile(path.join(REPORT_DIR, "parser_warnings.json"), `${JSON.stringify(reports.warnings, null, 2)}\n`, "utf8"),
  ]);
  return reports.coverage;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const fetchHtml = process.argv.includes("--fetch-html");
  runStage1({ fetchHtml })
    .then((coverage) => console.log(JSON.stringify(coverage, null, 2)))
    .catch((error) => {
      console.error(error);
      process.exitCode = 1;
    });
}
