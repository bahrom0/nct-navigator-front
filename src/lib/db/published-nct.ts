import "server-only";

import publishedJson from "../../../data/exports/ntc/nct_admission_offers.published.json";
import searchJson from "../../../data/search/ntc/search_documents.json";
import fieldEvidenceJson from "../../../data/reports/ntc/field_evidence.json";

export interface PublishedNctOffer {
  id: string;
  stable_key: string;
  dedupe_key: string;
  release_id: string;
  academic_year: string;
  admission_period: string;
  education_level: "after_9" | "after_11";
  cluster_number: number;
  specialty_code: string;
  specialty_name_tg: string | null;
  specialty_name_ru: string | null;
  specialty_name_original: string;
  institution_id: string;
  institution_name: string;
  campus_id: string;
  campus_name: string | null;
  city_id: string | null;
  city_name: string | null;
  region_id: string | null;
  region_name: string | null;
  education_form: string;
  education_type: string;
  tuition_fee: number | null;
  languages: string[];
  admission_plan: number;
  official_status: "published";
  source: PublishedNctSource;
}

export interface PublishedNctSource {
  source_id: string;
  source_document_id: string;
  source_row_id: string;
  source_page: number;
  source_row_number: number;
  source_checksum: string;
  staging_row_id: string;
}

interface SearchDocument {
  offer_stable_key: string;
  searchable_text: string;
  keywords: string[];
}

interface FieldEvidence {
  entity_type: string;
  entity_stable_key: string;
  field_name: string;
  raw_value: unknown;
  normalized_value: unknown;
  source_row_id: string;
  source_document_id: string;
  confidence: number;
  verification_method: string;
  warnings: string[];
}

export interface PublishedNctSearchInput {
  query?: string;
  academicYear?: string;
  admissionPeriod?: string;
  educationLevel?: "after_9" | "after_11";
  clusterNumber?: number;
  city?: string;
  educationForm?: string;
  educationType?: string;
  language?: string;
  maxTuitionFee?: number;
  limit?: number;
}

export interface PublishedNctSearchResult {
  offer: PublishedNctOffer;
  score: number;
}

const published = publishedJson as unknown as { offers: PublishedNctOffer[] };
const search = searchJson as unknown as { documents: SearchDocument[] };
const fieldEvidence = fieldEvidenceJson as unknown as FieldEvidence[];
const offerByStableKey = new Map(published.offers.map((offer) => [offer.stable_key, offer]));

function normalize(value: string | null | undefined) {
  return (value ?? "")
    .normalize("NFKD")
    .toLocaleLowerCase("ru")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

export async function loadPublishedNctDataset(): Promise<PublishedNctOffer[]> {
  return published.offers;
}

export async function searchPublishedNctOffers(
  input: PublishedNctSearchInput,
): Promise<PublishedNctSearchResult[]> {
  const query = normalize(input.query);
  const queryTokens = query.split(" ").filter(Boolean);
  const limit = Math.max(1, Math.min(input.limit ?? 50, 200));

  return search.documents
    .map((document) => {
      const offer = offerByStableKey.get(document.offer_stable_key);
      if (!offer) return null;
      if (input.academicYear && offer.academic_year !== input.academicYear) return null;
      if (input.admissionPeriod && offer.admission_period !== input.admissionPeriod) return null;
      if (input.educationLevel && offer.education_level !== input.educationLevel) return null;
      if (input.clusterNumber && offer.cluster_number !== input.clusterNumber) return null;
      if (input.city && normalize(offer.city_name) !== normalize(input.city)) return null;
      if (input.educationForm && normalize(offer.education_form) !== normalize(input.educationForm)) return null;
      if (input.educationType && normalize(offer.education_type) !== normalize(input.educationType)) return null;
      if (input.language && !offer.languages.includes(input.language)) return null;
      if (input.maxTuitionFee !== undefined && (offer.tuition_fee === null || offer.tuition_fee > input.maxTuitionFee)) return null;

      if (!queryTokens.length) return { offer, score: 1 };
      const haystack = normalize(document.searchable_text);
      const matchedTokens = queryTokens.filter((token) => haystack.includes(token));
      if (!matchedTokens.length) return null;
      let score = matchedTokens.length / queryTokens.length;
      if (normalize(offer.specialty_code) === query) score += 3;
      if (normalize(offer.specialty_name_original) === query) score += 2;
      if (normalize(offer.specialty_name_original).startsWith(query)) score += 1;
      return { offer, score };
    })
    .filter((result): result is PublishedNctSearchResult => result !== null)
    .sort((a, b) => b.score - a.score || a.offer.stable_key.localeCompare(b.offer.stable_key))
    .slice(0, limit);
}

export async function getNctOfferSource(stableKey: string): Promise<{
  source: PublishedNctSource;
  fieldEvidence: FieldEvidence[];
} | null> {
  const offer = offerByStableKey.get(stableKey);
  if (!offer) return null;
  return {
    source: offer.source,
    fieldEvidence: fieldEvidence.filter((evidence) =>
      evidence.source_document_id === offer.source.source_document_id
      && evidence.source_row_id === offer.source.source_row_id),
  };
}
