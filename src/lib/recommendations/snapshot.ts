import type {
  CanonicalRecommendation,
  RecommendationDecisionContext,
  RecommendationSnapshot,
} from "@/types/recommendations"

export function createRecommendationSnapshot(
  recommendation: CanonicalRecommendation,
  context: RecommendationDecisionContext,
  filters: RecommendationSnapshot["filters"] = {},
  relatedCodes: string[] = [],
): RecommendationSnapshot {
  const selectedCity = context.onboarding?.studyCity || recommendation.city
  const selectedEducationLevel = context.onboarding?.educationLevel
  const matchedInterests = recommendation.matchedInterests ?? []
  const matchedCareers = recommendation.matchedCareers ?? recommendation.career_matches
  const diagnostics = context.pipeline.diagnostics

  return {
    version: 1,
    selectedAt: new Date().toISOString(),
    inputs: {
      categories: context.categories,
      keywords: context.keywords,
      onboarding: context.onboarding,
      selectedCity,
      selectedEducationLevel,
    },
    selection: {
      code: recommendation.code,
      title: recommendation.title_ru,
      rank: recommendation.rank,
      confidence: recommendation.confidence,
      finalScore: recommendation.finalScore,
      explanation: recommendation.reasoning,
      matchedInterests,
      matchedCareers,
      relatedCodes,
      selectedProfessionKey: recommendation.selectedProfessionKey,
      professionRouteRelation: recommendation.professionRouteRelation,
      routeScore: recommendation.routeScore,
      professionRoutes: recommendation.professionRoutes,
      scoreBreakdown: {
        matchScore: recommendation.matchScore,
        finalScore: recommendation.finalScore,
        confidence: recommendation.confidence,
        lexicalScore: recommendation.lexicalScore,
        semanticScore: recommendation.semanticScore,
        taxonomyScore: recommendation.taxonomyScore,
        facetScore: recommendation.facetScore,
        qualityScore: recommendation.qualityScore,
      },
      explanationFacts: {
        selectedCity,
        selectedEducationLevel,
        institution: recommendation.institution,
        specialtyFamilyKey: recommendation.specialtyFamilyKey,
        taxonomyPath: recommendation.taxonomyPath ?? [],
        matchedKeywords: recommendation.matchedKeywords,
        matchedInterests,
        matchedCareers,
        selectedProfessionKey: recommendation.selectedProfessionKey,
        professionRouteRelation: recommendation.professionRouteRelation,
        routeScore: recommendation.routeScore,
      },
    },
    diagnostics: {
      catalogVersion: diagnostics?.catalogVersion,
      aiFallbackUsed: diagnostics?.ai.fallbackUsed ?? context.pipeline.usedFallbacks.length > 0,
      usedFallbacks: context.pipeline.usedFallbacks,
      rejectedKeys: diagnostics?.ai.rejectedKeys ?? [],
      violations: diagnostics?.violations,
    },
    filters,
    overallConfidence: context.overallConfidence,
  }
}
