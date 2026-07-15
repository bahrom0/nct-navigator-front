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

export const RecommendationsRequestSchema = z.object({
  categories: z.array(
      z.object({
        id: z.string(),
        name: z.string(),
        description: z.string().optional(),
    }),
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
    matches: z.array(
      z.object({
        code: z.string(),
        title_ru: z.string(),
        institution: z.string(),
        city: z.string(),
        confidence: z.number(),
        career_matches: z.array(z.string()),
        matchScore: z.number(),
        matchedKeywords: z.array(z.string()),
        finalScore: z.number(),
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
        professionRoutes: z
          .array(
            z.object({
              professionKey: z.string(),
              professionTitle: z.string(),
              relationType: z.enum(["direct", "adjacent", "foundation"]),
              confidence: z.number(),
              routeScore: z.number(),
            }),
          )
          .optional(),
        selectedProfessionKey: z.string().optional(),
        professionRouteRelation: z.enum(["direct", "adjacent", "foundation"]).optional(),
        routeScore: z.number().optional(),
      }),
    ),
    ranked: z.array(
      z.object({
        code: z.string(),
        title_ru: z.string(),
        institution: z.string(),
        city: z.string(),
        confidence: z.number(),
        career_matches: z.array(z.string()),
        matchScore: z.number(),
        matchedKeywords: z.array(z.string()),
        rank: z.number(),
        finalScore: z.number(),
        reasoning: z.string(),
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
        professionRoutes: z
          .array(
            z.object({
              professionKey: z.string(),
              professionTitle: z.string(),
              relationType: z.enum(["direct", "adjacent", "foundation"]),
              confidence: z.number(),
              routeScore: z.number(),
            }),
          )
          .optional(),
        selectedProfessionKey: z.string().optional(),
        professionRouteRelation: z.enum(["direct", "adjacent", "foundation"]).optional(),
        routeScore: z.number().optional(),
        matchedInterests: z.array(z.string()).optional(),
        matchedCareers: z.array(z.string()).optional(),
      }),
    ),
    overallConfidence: z.number(),
    decisionContext: z.object({
      categories: z.array(z.object({ id: z.string(), name: z.string() })),
      keywords: z.array(z.string()),
      onboarding: OnboardingSchema.nullable(),
      overallConfidence: z.number(),
      generatedAt: z.string(),
      pipeline: z.object({
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
            }),
          )
          .optional(),
        professionRouting: z
          .object({
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
            }),
          })
          .optional(),
        diagnostics: z
          .object({
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
            }),
            ai: z.object({
              professionRerankUsed: z.boolean(),
              nctRerankUsed: z.boolean(),
              fallbackUsed: z.boolean(),
              rejectedKeys: z.array(z.string()),
            }),
            violations: z.object({
              wrongCity: z.number(),
              hardFilter: z.number(),
              unknownCode: z.number(),
              unknownProfessionKey: z.number(),
            }),
          })
          .optional(),
      }),
    }),
  }),
  error: z.string().optional(),
})

export type RecommendationsResponse = z.infer<
  typeof RecommendationsResponseSchema
>
