import { z } from "zod"

const OptionalStringSchema = z.preprocess(
  (value) => (value === null ? undefined : value),
  z.string().optional(),
)

const OptionalStringArraySchema = z.preprocess(
  (value) => (value === null ? undefined : value),
  z.array(z.string()).optional(),
)

const OnboardingSchema = z.object({
  userCity: OptionalStringSchema,
  studyCity: OptionalStringSchema,
  userType: OptionalStringSchema,
  educationLevel: z.enum(["after_9", "after_11", "applicant", ""]).optional(),
  interests: OptionalStringArraySchema,
})

const RelationTypeSchema = z.enum(["direct", "bridge", "adjacent"])
const ProfessionRelationTypeSchema = z.enum(["direct", "adjacent", "foundation"])

const InterestCoverageSchema = z.object({
  interestId: z.string(),
  interest: z.string(),
  score: z.number(),
  evidence: z.array(z.string()),
}).passthrough()

const RecommendationResultSummarySchema = z.object({
  directCount: z.number(),
  bridgeCount: z.number(),
  adjacentCount: z.number(),
  totalCount: z.number(),
  noDirectMessage: OptionalStringSchema,
}).passthrough()

const InterestRelationshipSchema = z.object({
  id: z.string(),
  interestIds: z.array(z.string()),
  relationType: RelationTypeSchema,
  strength: z.number(),
  rationale: z.string(),
}).passthrough()

const InterestSignalSchema = z.object({
  id: z.string(),
  label: z.string(),
  weight: z.number(),
}).passthrough()

const SearchHypothesisSchema = z.object({
  id: z.string(),
  interestIds: z.array(z.string()),
  relationType: RelationTypeSchema,
  query: z.string(),
  searchTerms: z.array(z.string()),
  requiredConcepts: z.array(z.string()),
  optionalConcepts: z.array(z.string()),
  excludedConcepts: z.array(z.string()),
}).passthrough()

const InterestSynthesisSchema = z.object({
  version: z.literal(2),
  interests: z.array(InterestSignalSchema),
  profileSummary: z.string(),
  relationships: z.array(InterestRelationshipSchema),
  hypotheses: z.array(SearchHypothesisSchema),
  clarifyingQuestion: OptionalStringSchema,
  reasoning: z.string(),
}).passthrough()

const PipelineDiagnosticsRecordSchema = z.record(z.string(), z.unknown())

const AICallDiagnosticsSchema = z.object({
  stage: z.enum(["interest_synthesis", "candidate_judge", "knowledge_enrichment"]).optional(),
  provider: z.string().optional(),
  model: z.string().optional(),
  attempts: z.number().optional(),
  usedFallbackProvider: z.boolean().optional(),
  latencyMs: z.number().optional(),
  parseFailures: z.number().optional(),
  cacheHit: z.boolean().optional(),
}).catchall(z.unknown())

const ProfessionRouteSchema = z.object({
  professionKey: z.string(),
  professionTitle: z.string(),
  relationType: ProfessionRelationTypeSchema,
  confidence: z.number(),
  routeScore: z.number(),
}).passthrough()

const SharedRecommendationFields = {
  code: z.string(),
  title_ru: z.string(),
  institution: z.string(),
  city: z.string(),
  admissionPlan: z.number().int().min(0).optional(),
  confidence: z.number(),
  career_matches: z.array(z.string()),
  matchScore: z.number(),
  matchedKeywords: z.array(z.string()),
  finalScore: z.number(),
  relationType: RelationTypeSchema.optional(),
  candidateKey: z.string().optional(),
  interestCoverage: z.array(InterestCoverageSchema).optional(),
  limitations: z.array(z.string()).optional(),
  evidence: z.array(z.string()).optional(),
  cluster: z.number().optional(),
  cluster_name_ru: z.string().optional(),
  study_form: z.array(z.string()).optional(),
  study_type: z.array(z.string()).optional(),
  taxonomyPath: z.array(z.string()).optional(),
  matchedTaxonomyNodeIds: z.array(z.string()).optional(),
  primaryTaxonomyNodeId: z.string().optional(),
  rootTaxonomyNodeIds: z.array(z.string()).optional(),
  branchKey: z.string().optional(),
  specialtyFamilyKey: z.string().optional(),
  lexicalScore: z.number().optional(),
  semanticScore: z.number().optional(),
  taxonomyScore: z.number().optional(),
  facetScore: z.number().optional(),
  qualityScore: z.number().optional(),
  education_level: z.enum(["after_9", "after_11"]).optional(),
  searchIntent: z
    .enum(["broad", "narrow", "facet", "code", "comparison"])
    .optional(),
  professionRoutes: z.array(ProfessionRouteSchema).optional(),
  selectedProfessionKey: z.string().optional(),
  professionRouteRelation: ProfessionRelationTypeSchema.optional(),
  routeScore: z.number().optional(),
}

const MatchSchema = z.object(SharedRecommendationFields).passthrough()

const RankedSchema = MatchSchema.extend({
  rank: z.number(),
  reasoning: z.string(),
  matchedInterests: z.array(z.string()).optional(),
  matchedCareers: z.array(z.string()).optional(),
}).passthrough()

const ProfessionRoutingSchema = z.object({
  catalogVersion: z.string(),
  activeProfessionCount: z.number(),
  scoredProfessionCount: z.number(),
  selectedProfessionKeys: z.array(z.string()),
  catalogGaps: z.array(z.string()),
  linkedSpecialtyFamilies: z.array(z.string()),
  allowedClusterIds: z.array(z.number()),
  candidateCounts: z.object({
    beforeProfessionRoute: z.number(),
    afterProfessionRoute: z.number(),
  }).passthrough(),
}).passthrough()

const LegacyPipelineDiagnosticsSchema = z.object({
  catalogVersion: z.string(),
  selectedCityId: z.string(),
  selectedEducationLevel: z.string(),
  candidateCounts: z.object({
    rawNct: z.number(),
    afterCity: z.number(),
    afterEducation: z.number(),
    afterProfessionRoute: z.number(),
    afterDedupe: z.number(),
    final: z.number(),
  }).passthrough(),
  ai: z.object({
    professionRerankUsed: z.boolean(),
    nctRerankUsed: z.boolean(),
    fallbackUsed: z.boolean(),
    rejectedKeys: z.array(z.string()),
  }).passthrough(),
  violations: z.object({
    wrongCity: z.number(),
    hardFilter: z.number(),
    unknownCode: z.number(),
    unknownProfessionKey: z.number(),
  }).passthrough(),
}).passthrough()

const DecisionPipelineSchema = z.object({
  completedSteps: z.array(
    z.enum([
      "submitting_request",
      "analyzing_interests",
      "searching_nct_codes",
      "forming_recommendations",
    ]),
  ),
  usedFallbacks: z.array(z.string()),
  professions: z.array(z.string()),
  directions: z.array(z.string()),
  searchIntents: z.array(z.string()),
  professionRoutes: z
    .array(
      z.object({
        professionKey: z.string(),
        title: z.string(),
        score: z.number(),
        relationTypes: z.array(z.string()),
        matchedInterests: z.array(z.string()),
      }).passthrough(),
    )
    .optional(),
  professionRouting: ProfessionRoutingSchema.optional(),
  diagnostics: LegacyPipelineDiagnosticsSchema.optional(),
  pipelineVersion: z.literal("ai_v2").optional(),
  interestSynthesis: InterestSynthesisSchema.optional(),
  retrieval: z.object({
    diagnostics: PipelineDiagnosticsRecordSchema.optional(),
  }).passthrough().optional(),
  aiCalls: z.object({
    diagnostics: z.array(AICallDiagnosticsSchema),
  }).passthrough().optional(),
  resultSummary: RecommendationResultSummarySchema.optional(),
}).passthrough()

const DecisionContextSchema = z.object({
  categories: z.array(z.object({ id: z.string(), name: z.string() }).passthrough()),
  keywords: z.array(z.string()),
  onboarding: OnboardingSchema.nullable(),
  overallConfidence: z.number(),
  generatedAt: z.string(),
  pipeline: DecisionPipelineSchema,
}).passthrough()

export const RecommendationsRequestSchema = z.object({
  categories: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      description: z.string().optional(),
    }).passthrough(),
  ),
  keywords: z.array(z.string()).optional(),
  topK: z.coerce.number().int().min(1).max(20).default(8),
  minConfidence: z.coerce.number().min(0).max(1).default(0.5),
  onboarding: OnboardingSchema.optional(),
})

export type RecommendationsRequest = z.infer<
  typeof RecommendationsRequestSchema
>

export const RecommendationsResponseSchema = z.object({
  status: z.enum(["success", "error"]),
  data: z.object({
    matches: z.array(MatchSchema),
    ranked: z.array(RankedSchema),
    overallConfidence: z.number(),
    decisionContext: DecisionContextSchema,
    resultSummary: RecommendationResultSummarySchema.optional(),
  }).passthrough().nullable().optional(),
  code: z.string().optional(),
  retryable: z.boolean().optional(),
  error: z.string().optional(),
}).passthrough()

export type RecommendationsResponse = z.infer<
  typeof RecommendationsResponseSchema
>
