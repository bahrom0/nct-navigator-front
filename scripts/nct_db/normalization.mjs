import { createHash } from "node:crypto";

export const NORMALIZER_VERSION = "nct-stage2-normalization-v1.0.0";

export function normalizeSpace(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

export function simplify(value) {
  return normalizeSpace(value)
    .toLocaleLowerCase()
    .replace(/[«»“”„"'`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export function slug(value) {
  const ascii = simplify(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\p{L}]+/gu, "-")
    .replace(/^-|-$/g, "");
  return ascii || "unknown";
}

export function stableHash(parts, prefix) {
  const value = parts.map((part) => normalizeSpace(part)).join("\u001f");
  return `${prefix}_${createHash("sha256").update(value).digest("hex").slice(0, 24)}`;
}

function field(rawValue, normalizedValue, confidence, method, context, warnings = []) {
  return {
    raw_value: rawValue ?? null,
    normalized_value: normalizedValue ?? null,
    confidence,
    method,
    source_row_id: context.source_row_id,
    warnings: [...new Set(warnings)],
  };
}

const PLACE_ALIASES = new Map(Object.entries({
  "душанбе": ["Dushanbe", "city"],
  "худжанд": ["Khujand", "city"],
  "хуҷанд": ["Khujand", "city"],
  "бохтар": ["Bokhtar", "city"],
  "куляб": ["Kulob", "city"],
  "кӯлоб": ["Kulob", "city"],
  "турсунзаде": ["Tursunzoda", "city"],
  "турсунзода": ["Tursunzoda", "city"],
  "пенджикент": ["Panjakent", "city"],
  "панҷакент": ["Panjakent", "city"],
  "гиссар": ["Hisor", "city"],
  "ҳисор": ["Hisor", "city"],
  "вахдат": ["Vahdat", "city"],
  "ваҳдат": ["Vahdat", "city"],
  "хорог": ["Khorog", "city"],
  "канибадам": ["Konibodom", "city"],
  "конибодом": ["Konibodom", "city"],
  "истаравшан": ["Istaravshan", "city"],
  "исфара": ["Isfara", "city"],
  "левакант": ["Levakant", "city"],
  "бустон": ["Buston", "city"],
  "бӯстон": ["Buston", "city"],
  "рогун": ["Rogun", "city"],
  "роғун": ["Rogun", "city"],
  "дангара": ["Danghara", "district"],
  "данғара": ["Danghara", "district"],
  "рашт": ["Rasht", "district"],
  "рудаки": ["Rudaki", "district"],
  "рӯдакӣ": ["Rudaki", "district"],
  "матчинский": ["Mastchoh", "district"],
  "матчинского": ["Mastchoh", "district"],
  "мастчоҳ": ["Mastchoh", "district"],
  "зафаробод": ["Zafarobod", "district"],
  "джаббора расулова": ["Jabbor Rasulov", "district"],
  "ҷаббор расулов": ["Jabbor Rasulov", "district"],
  "нурабад": ["Nurobod", "district"],
  "нуробод": ["Nurobod", "district"],
  "кубодиён": ["Qubodiyon", "district"],
  "қубодиён": ["Qubodiyon", "district"],
  "шахритус": ["Shahritus", "district"],
  "шаҳритус": ["Shahritus", "district"],
  "джайхун": ["Jayhun", "district"],
  "ҷайҳун": ["Jayhun", "district"],
  "кушониён": ["Kushoniyon", "district"],
  "кушониён": ["Kushoniyon", "district"],
  "лахш": ["Lakhsh", "district"],
  "хамадони": ["Hamadoni", "district"],
  "ҳамадонӣ": ["Hamadoni", "district"],
  "джалолиддина балхи": ["Jaloliddin Balkhi", "district"],
  "джалолид дина балхи": ["Jaloliddin Balkhi", "district"],
  "ҷалолиддини балхӣ": ["Jaloliddin Balkhi", "district"],
  "ёвoн": ["Yovon", "district"],
  "ёвон": ["Yovon", "district"],
  "дӯсти": ["Dusti", "district"],
  "дусти": ["Dusti", "district"],
  "дӯстӣ": ["Dusti", "district"],
  "тоҷикобод": ["Tojikobod", "district"],
  "бобоҷон ғафуров": ["Bobojon Ghafurov", "district"],
  "гулистон": ["Guliston", "city"],
  "панҷ": ["Panj", "district"],
  "ховалинг": ["Khovaling", "district"],
  "фархор": ["Farkhor", "district"],
  "норак": ["Nurek", "city"],
  "темурмалик": ["Temurmalik", "district"],
  "вахш": ["Vakhsh", "district"],
  "восеъ": ["Vose", "district"],
  "муъминобод": ["Muminobod", "district"],
}));

function cleanLocation(raw) {
  let value = normalizeSpace(raw);
  const warnings = [];
  const original = value;
  value = value
    .replace(/(?:от образовательных|аз муассисаҳои).*$/iu, "")
    .replace(/(?:заочная|дистанционная|рӯзона|ғоибона).*$/iu, "")
    .replace(/^расположения\s+/iu, "")
    .replace(/\b(?:город|район)\s+(?=(?:город|район)\b)/iu, "")
    .replace(/\s+вобастагӣ$/iu, "")
    .trim();
  if (value !== original) warnings.push("location_artifact_removed");
  return { value, warnings };
}

function placeToken(value) {
  return simplify(value)
    .replace(/^(?:город|шаҳр|район|ноҳия)\s+/u, "")
    .replace(/\s+(?:район|шаҳр|город)$/u, "")
    .trim();
}

export function normalizeCity(raw, context) {
  if (!normalizeSpace(raw)) return field(raw, null, 0, "unknown", context, ["unknown_city"]);
  const cleaned = cleanLocation(raw);
  const token = placeToken(cleaned.value);
  const match = PLACE_ALIASES.get(token);
  if (!match) return field(raw, null, 0.25, "unknown", context, [...cleaned.warnings, "unknown_city"]);
  const [canonical, placeType] = match;
  const explicitCity = /^(?:город|шаҳр)\b/iu.test(cleaned.value) || placeType === "city";
  const confidence = explicitCity ? 0.98 : 0.88;
  const warnings = [...cleaned.warnings];
  if (placeType !== "city") warnings.push("location_is_district_not_city");
  return field(raw, placeType === "city" ? canonical : null, confidence, "alias", context, warnings);
}

export function normalizeRegion(raw, context) {
  if (!normalizeSpace(raw)) return field(raw, null, 0, "unknown", context, ["unknown_region"]);
  const cleaned = cleanLocation(raw);
  const token = placeToken(cleaned.value);
  const match = PLACE_ALIASES.get(token);
  if (match && match[1] !== "district") return field(raw, null, 1, "direct", context);
  if (!match) return field(raw, null, 0.25, "unknown", context, ["unknown_region"]);
  return field(raw, match[0], 0.95, "alias", context, cleaned.warnings);
}

export function normalizeLocation(raw, context) {
  if (!normalizeSpace(raw)) return field(raw, null, 0, "unknown", context, ["missing_location"]);
  const cleaned = cleanLocation(raw);
  const token = placeToken(cleaned.value);
  const match = PLACE_ALIASES.get(token);
  if (!match) return field(raw, cleaned.value || null, 0.45, "parsed", context, [...cleaned.warnings, "unknown_location"]);
  return field(raw, match[0], cleaned.warnings.length ? 0.86 : 0.98, "alias", context, cleaned.warnings);
}

export function normalizeInstitution(raw, context) {
  const value = normalizeSpace(raw);
  if (!value) return field(raw, null, 0, "unknown", context, ["missing_institution"]);
  const warnings = [];
  let confidence = 0.96;
  if (context.parse_warnings.includes("row_shift_suspected")) {
    warnings.push("institution_may_contain_shifted_text");
    confidence = 0.62;
  }
  if (/\b(?:страница|примечание|изменение суммы|саҳифа)\b/iu.test(value)) {
    warnings.push("institution_contains_footer_text");
    confidence = Math.min(confidence, 0.45);
  }
  return field(raw, value, confidence, "direct", context, warnings);
}

export function normalizeCampus(institution, location, context) {
  if (!institution.normalized_value) return field(null, null, 0, "unknown", context, ["missing_institution"]);
  const institutionText = institution.normalized_value;
  const branchMarker = /\b(?:филиал|филиали|дар шаҳри|в городе|дар ноҳияи|в районе)\b/iu.test(institutionText);
  const locationValue = location.normalized_value;
  const stableValue = {
    institution_key: stableHash([simplify(institutionText)], "institution"),
    location: locationValue,
    campus_kind: branchMarker ? "branch_or_named_campus" : "main_or_unspecified",
  };
  const confidence = branchMarker && !locationValue ? 0.5 : Math.min(institution.confidence, location.confidence || 0.5);
  const warnings = [];
  if (branchMarker) warnings.push("campus_marker_present");
  if (!locationValue) warnings.push("campus_location_unresolved");
  return field({ institution: institution.raw_value, location: location.raw_value }, stableValue, confidence, branchMarker ? "parsed" : "inferred", context, warnings);
}

export function normalizeSpecialtyCode(raw, context) {
  const value = normalizeSpace(raw).replace(/[^0-9]/g, "");
  if (!value) return field(raw, null, 0, "unknown", context, ["missing_specialty_code"]);
  const valid = /^\d{7,11}$/.test(value);
  return field(raw, value, valid ? 0.99 : 0.45, valid ? "parsed" : "unknown", context, valid ? [] : ["invalid_specialty_code_format"]);
}

export function normalizeSpecialtyName(raw, context) {
  const value = normalizeSpace(raw);
  if (!value) return field(raw, null, 0, "unknown", context, ["missing_specialty_name"]);
  const shifted = context.parse_warnings.includes("row_shift_suspected");
  return field(raw, value, shifted ? 0.65 : 0.98, shifted ? "parsed" : "direct", context, shifted ? ["specialty_from_shifted_row"] : []);
}

export function normalizeEducationForm(raw, context) {
  const value = simplify(raw);
  if (!value) return field(raw, null, 0, "unknown", context, ["missing_education_form"]);
  const matches = [];
  if (/рӯзона|(?:^|\s)очная(?:\s|$)|дневная/u.test(value)) matches.push("full_time");
  if (/заочная|ғоибона/u.test(value)) matches.push("part_time");
  if (/дистанционная|фосилав/u.test(value)) matches.push("distance");
  const unique = [...new Set(matches)];
  if (unique.length !== 1) return field(raw, unique.length ? unique : null, 0.4, "parsed", context, [unique.length ? "conflicting_education_forms" : "unknown_education_form"]);
  const artifact = value.split(" ").length > 2;
  return field(raw, unique[0], artifact ? 0.82 : 0.99, "dictionary", context, artifact ? ["education_form_has_extra_text"] : []);
}

export function normalizeEducationType(raw, context) {
  const value = simplify(raw);
  if (!value) return field(raw, null, 0, "unknown", context, ["missing_education_type"]);
  const free = /бесплат|ройгон/u.test(value);
  const paid = /(?:^|\s)(?:платный|пулакӣ)(?:\s|$|\()/u.test(value);
  if (free === paid) return field(raw, null, 0.35, "unknown", context, [free ? "conflicting_education_types" : "unknown_education_type"]);
  return field(raw, free ? "free" : "paid", 0.99, "dictionary", context);
}

export function normalizeTuitionFee(raw, context) {
  const value = normalizeSpace(raw);
  if (!value) return field(raw, null, 0.9, "direct", context);
  const numbers = value.match(/\d+/g) ?? [];
  if (numbers.length !== 1) return field(raw, null, value.includes("*") ? 0.5 : 0.3, "unknown", context, [value.includes("*") ? "tuition_fee_not_numeric" : "ambiguous_tuition_fee"]);
  const amount = Number(numbers[0]);
  return field(raw, amount, amount > 0 ? 0.99 : 0.4, "parsed", context, amount > 0 ? [] : ["invalid_tuition_fee"]);
}

export function normalizeLanguage(raw, context) {
  const value = simplify(raw);
  if (!value) return field(raw, [], 0, "unknown", context, ["missing_language"]);
  const languages = [];
  if (/таджик|тоҷик/u.test(value)) languages.push("tg");
  if (/русск|русӣ/u.test(value)) languages.push("ru");
  if (/узбек|ӯзбек/u.test(value)) languages.push("uz");
  if (/англи|англис/u.test(value)) languages.push("en");
  const unique = [...new Set(languages)];
  return field(raw, unique, unique.length ? 0.98 : 0.2, unique.length ? "dictionary" : "unknown", context, unique.length ? [] : ["unrecognized_language"]);
}

export function normalizeAdmissionPlan(raw, context) {
  const value = normalizeSpace(raw);
  const numbers = value.match(/\d+/g) ?? [];
  if (numbers.length !== 1) return field(raw, null, 0.25, "unknown", context, [numbers.length ? "multiple_admission_plan_values" : "missing_admission_plan"]);
  const plan = Number(numbers[0]);
  return field(raw, plan, plan > 0 ? 0.99 : 0.35, "parsed", context, plan > 0 ? [] : ["invalid_admission_plan"]);
}

export function normalizeCluster(raw, context) {
  const value = Number(normalizeSpace(raw));
  const valid = Number.isInteger(value) && value >= 1 && value <= 5;
  return field(raw, valid ? value : null, valid ? 1 : 0.2, valid ? "direct" : "unknown", context, valid ? [] : ["invalid_cluster"]);
}

export function normalizeDirectField(raw, context, allowed = null) {
  const value = normalizeSpace(raw) || null;
  const valid = value !== null && (!allowed || allowed.includes(value));
  return field(raw, valid ? value : null, valid ? 1 : 0.2, valid ? "direct" : "unknown", context, valid ? [] : ["invalid_or_missing_value"]);
}

export function repairShiftedColumns(row) {
  const proposed = {};
  const warnings = [];
  let confidence = 1;
  const location = normalizeSpace(row.parsed_fields.location);
  const formMatch = location.match(/\b(заочная|дистанционная|рӯзона|ғоибона)\b/iu);
  if (formMatch) {
    proposed.location = normalizeSpace(location.slice(0, formMatch.index));
    proposed.education_form = formMatch[1];
    warnings.push("education_form_extracted_from_location");
    confidence = 0.9;
  }
  if (row.parse_warnings.includes("row_shift_suspected")) {
    warnings.push("vertical_row_overlap_requires_review");
    confidence = Math.min(confidence, 0.65);
  }
  const planNumbers = normalizeSpace(row.parsed_fields.admission_plan).match(/\d+/g) ?? [];
  if (planNumbers.length > 1) {
    warnings.push("multiple_admission_plan_values");
    confidence = Math.min(confidence, 0.4);
  }
  return {
    staging_row_id: row.staging_row_id,
    proposed_fields: proposed,
    confidence,
    warnings,
    requires_review: confidence < 0.85 || Object.keys(proposed).length > 0 || warnings.length > 0,
  };
}

export function normalizedFieldWarnings(fields) {
  return Object.entries(fields).flatMap(([fieldName, value]) =>
    (value?.warnings ?? []).map((warning) => ({ field_name: fieldName, warning, confidence: value.confidence })),
  );
}
