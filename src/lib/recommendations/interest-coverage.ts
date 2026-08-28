import type { RecommendationInterestCoverage } from "@/types/nct"

export const COMPACT_INTEREST_COVERAGE_LIMIT = 3

export function coveragePercent(score: number): number {
  const safeScore = Number.isFinite(score) ? score : 0
  return Math.round(Math.max(0, Math.min(1, safeScore)) * 100)
}

export function sortInterestCoverage(
  coverage: readonly RecommendationInterestCoverage[],
): RecommendationInterestCoverage[] {
  return coverage
    .map((item, index) => ({ item, index }))
    .sort((left, right) => {
      const rightScore = Number.isFinite(right.item.score) ? right.item.score : 0
      const leftScore = Number.isFinite(left.item.score) ? left.item.score : 0
      const scoreDifference = rightScore - leftScore
      return scoreDifference || left.index - right.index
    })
    .map(({ item }) => item)
}
