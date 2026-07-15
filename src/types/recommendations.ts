import type { NCTMatchResult, RankedNCT } from "@/types/nct"
import type { AnalysisStep } from "@/types/analysis"

export interface RecommendationOnboardingContext {
  userCity?: string
  studyCity?: string
  userType?: string
  educationLevel?: "after_9" | "after_11" | "applicant" | ""
  interests?: string[]
}

export interface RecommendationDecisionContext {
  categories: { id: string; name: string }[]
  keywords: string[]
  onboarding: RecommendationOnboardingContext | null
  overallConfidence: number
  generatedAt: string
  pipeline: {
    completedSteps: AnalysisStep[]
    usedFallbacks: string[]
    professions: string[]
    directions: string[]
    searchIntents: string[]
    professionRoutes?: Array<{
      professionKey: string
      title: string
      score: number
      relationTypes: string[]
      matchedInterests: string[]
    }>
    professionRouting?: {
      catalogVersion: string
      activeProfessionCount: number
      scoredProfessionCount: number
      selectedProfessionKeys: string[]
      catalogGaps: string[]
      linkedSpecialtyFamilies: string[]
      allowedClusterIds: number[]
      candidateCounts: {
        beforeProfessionRoute: number
        afterProfessionRoute: number
      }
    }
    diagnostics?: {
      catalogVersion: string
      selectedCityId: string
      selectedEducationLevel: string
      candidateCounts: {
        rawNct: number
        afterCity: number
        afterEducation: number
        afterProfessionRoute: number
        afterDedupe: number
        final: number
      }
      ai: {
        professionRerankUsed: boolean
        nctRerankUsed: boolean
        fallbackUsed: boolean
        rejectedKeys: string[]
      }
      violations: {
        wrongCity: number
        hardFilter: number
        unknownCode: number
        unknownProfessionKey: number
      }
    }
  }
}

export interface CanonicalRecommendation extends RankedNCT {
  matchedInterests?: string[]
  matchedCareers?: string[]
}

export interface RecommendationResultSet {
  matches: NCTMatchResult[]
  ranked: CanonicalRecommendation[]
  overallConfidence: number
  decisionContext: RecommendationDecisionContext
}

export interface RecommendationSnapshot {
  version: 1
  selectedAt: string
  inputs: {
    categories: { id: string; name: string }[]
    keywords: string[]
    onboarding: RecommendationOnboardingContext | null
    selectedCity?: string
    selectedEducationLevel?: "after_9" | "after_11" | "applicant" | ""
  }
  selection: {
    code: string
    title: string
    rank: number
    confidence: number
    finalScore: number
    explanation: string
    matchedInterests: string[]
    matchedCareers: string[]
    relatedCodes: string[]
    selectedProfessionKey?: string
    professionRouteRelation?: "direct" | "adjacent" | "foundation"
    routeScore?: number
    professionRoutes?: Array<{
      professionKey: string
      professionTitle: string
      relationType: "direct" | "adjacent" | "foundation"
      confidence: number
      routeScore: number
    }>
    scoreBreakdown?: {
      matchScore: number
      finalScore: number
      confidence: number
      lexicalScore?: number
      semanticScore?: number
      taxonomyScore?: number
      facetScore?: number
      qualityScore?: number
    }
    explanationFacts?: {
      selectedCity?: string
      selectedEducationLevel?: "after_9" | "after_11" | "applicant" | ""
      institution: string
      specialtyFamilyKey?: string
      taxonomyPath: string[]
      matchedKeywords: string[]
      matchedInterests: string[]
      matchedCareers: string[]
      selectedProfessionKey?: string
      professionRouteRelation?: "direct" | "adjacent" | "foundation"
      routeScore?: number
    }
  }
  diagnostics?: {
    catalogVersion?: string
    aiFallbackUsed: boolean
    usedFallbacks: string[]
    rejectedKeys: string[]
    violations?: {
      wrongCity: number
      hardFilter: number
      unknownCode: number
      unknownProfessionKey: number
    }
  }
  filters: {
    city?: string
    studyForm?: string
    sortBy?: "confidence" | "institution"
    sortDir?: "asc" | "desc"
  }
  overallConfidence: number
}

export interface RecommendationCacheData extends RecommendationResultSet {
  categories: { id: string; name: string; description?: string }[]
}
