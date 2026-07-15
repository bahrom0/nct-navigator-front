import { createHash } from "node:crypto";
import { simplify } from "./normalization.mjs";

export const SEARCH_SCHEMA_VERSION = "nct-search-v1";

const TRANSLIT = {
  а: "a", б: "b", в: "v", г: "g", ғ: "gh", д: "d", е: "e", ё: "yo", ж: "zh",
  з: "z", и: "i", ӣ: "i", й: "y", к: "k", қ: "q", л: "l", м: "m", н: "n",
  о: "o", п: "p", р: "r", с: "s", т: "t", у: "u", ӯ: "u", ф: "f", х: "kh",
  ҳ: "h", ч: "ch", ҷ: "j", ш: "sh", ъ: "", э: "e", ю: "yu", я: "ya", ы: "y",
  ь: "", ц: "ts", щ: "shch",
};

const DERIVED_RULES = [
  { id: "medicine", label: "Медицина и здоровье", professions: ["врач", "медицинский специалист"], patterns: ["медицин", "лечеб", "фарма", "стомат", "сестрин", "педиатр"] },
  { id: "it", label: "Информационные технологии", professions: ["разработчик", "системный аналитик"], patterns: ["информат", "программ", "компьют", "кибер", "системы связи"] },
  { id: "engineering", label: "Инженерия и технологии", professions: ["инженер", "технолог"], patterns: ["инженер", "технолог", "энергет", "электр", "строитель", "механик", "транспорт"] },
  { id: "education", label: "Образование", professions: ["учитель", "преподаватель"], patterns: ["педагог", "образован", "учитель", "дошколь"] },
  { id: "economics", label: "Экономика и управление", professions: ["экономист", "менеджер"], patterns: ["эконом", "финанс", "бухгалтер", "менедж", "маркет", "банков"] },
  { id: "law", label: "Право и общество", professions: ["юрист", "специалист государственного управления"], patterns: ["право", "юрис", "государствен", "политолог", "социолог"] },
  { id: "languages", label: "Языки и коммуникации", professions: ["переводчик", "филолог"], patterns: ["филолог", "язык", "перевод", "журналист"] },
  { id: "agriculture", label: "Сельское хозяйство", professions: ["агроном", "специалист сельского хозяйства"], patterns: ["агро", "сельск", "ветерин", "землеустр", "растениевод"] },
  { id: "arts", label: "Искусство и культура", professions: ["дизайнер", "специалист культуры"], patterns: ["искусств", "дизайн", "музык", "культур", "хореограф"] },
];

function hash(value, length = 20) {
  return createHash("sha256").update(String(value)).digest("hex").slice(0, length);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function searchableName(offer) {
  return offer.specialty_name_ru ?? offer.specialty_name_tg ?? offer.specialty_name_original;
}

function tokens(value) {
  return simplify(value).split(/[^\p{L}\p{N}]+/u).filter((token) => token.length >= 2);
}

export function generateTransliterations(value) {
  const normalized = simplify(value);
  const transliteration = [...normalized].map((character) => TRANSLIT[character] ?? character).join("");
  return transliteration && transliteration !== normalized ? [transliteration] : [];
}

export function generateSpecialtyKeywords(offer) {
  return unique([
    ...tokens(searchableName(offer)),
    offer.specialty_code,
    `кластер ${offer.cluster_number}`,
    `cluster ${offer.cluster_number}`,
  ]);
}

export function generateInstitutionSynonyms(institutionName) {
  if (!institutionName) return [];
  const words = tokens(institutionName);
  const acronym = words.filter((word) => word.length > 2).map((word) => word[0]).join("");
  return unique([institutionName, simplify(institutionName), acronym.length >= 3 ? acronym : null]);
}

export function generateCitySynonyms(cityName) {
  if (!cityName) return [];
  return unique([cityName, simplify(cityName), ...generateTransliterations(cityName)]);
}

function matchingRule(offer) {
  // Institution names must not influence specialty classification. For example,
  // "государственный университет" is not evidence that an offer belongs to law.
  const haystack = simplify(searchableName(offer));
  return DERIVED_RULES.find((rule) => rule.patterns.some((pattern) => haystack.includes(pattern))) ?? null;
}

export function mapSpecialtyToTaxonomy(offer) {
  const rule = matchingRule(offer);
  return {
    offer_stable_key: offer.stable_key,
    taxonomy_id: rule?.id ?? `cluster_${offer.cluster_number}`,
    taxonomy_label: rule?.label ?? `Кластер ${offer.cluster_number}`,
    mapping_score: rule ? 0.8 : 0.55,
    mapping_method: "rule",
    review_status: "needs_review",
    is_official: false,
  };
}

export function mapSpecialtyToProfessions(offer) {
  const rule = matchingRule(offer);
  return {
    offer_stable_key: offer.stable_key,
    professions: rule?.professions ?? [],
    mapping_score: rule ? 0.7 : 0,
    mapping_method: "rule",
    review_status: "needs_review",
    is_official: false,
  };
}

export function buildSearchDocuments(offers) {
  const taxonomyMappings = [];
  const professionMappings = [];
  const documents = offers.map((offer) => {
    const taxonomy = mapSpecialtyToTaxonomy(offer);
    const professions = mapSpecialtyToProfessions(offer);
    taxonomyMappings.push(taxonomy);
    professionMappings.push(professions);
    const specialtyTransliterations = generateTransliterations(searchableName(offer));
    const institutionSynonyms = generateInstitutionSynonyms(offer.institution_name);
    const citySynonyms = generateCitySynonyms(offer.city_name);
    const keywords = unique([
      ...generateSpecialtyKeywords(offer),
      ...specialtyTransliterations,
      ...institutionSynonyms,
      ...citySynonyms,
      ...professions.professions,
      taxonomy.taxonomy_label,
    ]);
    return {
      document_id: `search_${hash(offer.stable_key)}`,
      offer_stable_key: offer.stable_key,
      release_id: offer.release_id,
      title: searchableName(offer),
      institution_name: offer.institution_name,
      city_name: offer.city_name,
      specialty_code: offer.specialty_code,
      cluster_number: offer.cluster_number,
      education_level: offer.education_level,
      education_form: offer.education_form,
      education_type: offer.education_type,
      languages: offer.languages,
      tuition_fee: offer.tuition_fee,
      admission_plan: offer.admission_plan,
      keywords,
      specialty_transliterations: specialtyTransliterations,
      institution_synonyms: institutionSynonyms,
      city_synonyms: citySynonyms,
      taxonomy: { id: taxonomy.taxonomy_id, label: taxonomy.taxonomy_label },
      professions: professions.professions,
      searchable_text: unique([
        searchableName(offer), offer.specialty_code, offer.institution_name, offer.city_name,
        offer.region_name, ...keywords,
      ]).join(" "),
    };
  });
  return { documents, taxonomyMappings, professionMappings };
}
