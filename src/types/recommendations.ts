import type { NCTMatchResult, RankedNCT } from "@/types/nct"
import type { AnalysisStep } from "@/types/analysis"

export type { RecommendationInterestCoverage, RecommendationRelationType } from "@/types/nct"

export interface RecommendationOnboardingContext {
  userCity?: string
  studyCity?: string
  userType?: string
  educationLevel?: "after_9" | "after_11" | "applicant" | ""
  interests?: string[]
}

export interface RecommendationResultSummary {
  directCount: number
  bridgeCount: number
  adjacentCount: number
  totalCount: number
  noDirectMessage?: string
}

export interface InterestSignal {
  id: string
  label: string
  weight: number
}

export interface InterestRelationship {
  id: string
  interestIds: string[]
  relationType: "direct" | "bridge" | "adjacent"
  strength: number
  rationale: string
}

export interface SearchHypothesis {
  id: string
  interestIds: string[]
  relationType: "direct" | "bridge" | "adjacent"
  query: string
  searchTerms: string[]
  requiredConcepts: string[]
  optionalConcepts: string[]
  excludedConcepts: string[]
}

export interface InterestSynthesis {
  version: 2
  interests: InterestSignal[]
  relationships: InterestRelationship[]
  hypotheses: SearchHypothesis[]
  profileSummary: string
  clarifyingQuestion?: string
  reasoning: string
}

export interface RecommendationDiagnostics {
  [key: string]: unknown
}

export interface RecommendationAICallDiagnostics extends RecommendationDiagnostics {
  stage?: "interest_synthesis" | "candidate_judge" | "knowledge_enrichment"
  provider?: string
  model?: string
  attempts?: number
  usedFallbackProvider?: boolean
  latencyMs?: number
  parseFailures?: number
  cacheHit?: boolean
}

export interface RecommendationDecisionPipeline {
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
  pipelineVersion?: "ai_v2"
  interestSynthesis?: InterestSynthesis
  retrieval?: {
    diagnostics?: RecommendationDiagnostics
  }
  aiCalls?: {
    diagnostics: RecommendationAICallDiagnostics[]
  }
  resultSummary?: RecommendationResultSummary
}

export interface RecommendationDecisionContext {
  categories: { id: string; name: string }[]
  keywords: string[]
  onboarding: RecommendationOnboardingContext | null
  overallConfidence: number
  generatedAt: string
  pipeline: RecommendationDecisionPipeline
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
  resultSummary?: RecommendationResultSummary
}

export interface RecommendationSnapshot {
  version: 1 | 2
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
    relationType?: "direct" | "bridge" | "adjacent"
    interestCoverage?: Array<{
      interestId: string
      interest: string
      score: number
      evidence: string[]
    }>
    limitations?: string[]
    evidence?: string[]
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
    pipelineVersion?: "ai_v2"
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
    aiCalls?: RecommendationAICallDiagnostics[]
  }
  pipelineVersion?: "ai_v2"
  resultSummary?: RecommendationResultSummary
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
