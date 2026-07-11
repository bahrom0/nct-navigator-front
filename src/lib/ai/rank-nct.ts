import type { NCTMatchResult, RankedNCT } from "@/types/nct"

export interface RankingOptions {
  topK?: number
  minConfidence?: number
  diversify?: boolean
  maxPerCluster?: number
}

function extractCluster(match: NCTMatchResult): number {
  return (match as unknown as Record<string, number>).cluster ?? 0
}

function extractDiversificationKey(match: NCTMatchResult): string {
  const branchKey = (match as unknown as { branchKey?: string }).branchKey
  if (branchKey && branchKey.length > 0) {
    return branchKey
  }

  const taxonomyPath = (match as unknown as { taxonomyPath?: string[] }).taxonomyPath
  if (taxonomyPath && taxonomyPath.length > 0) {
    return taxonomyPath.join(" > ")
  }

  const primaryTaxonomyNodeId = (match as unknown as { primaryTaxonomyNodeId?: string }).primaryTaxonomyNodeId
  if (primaryTaxonomyNodeId && primaryTaxonomyNodeId.length > 0) {
    return primaryTaxonomyNodeId
  }

  return `cluster:${extractCluster(match)}`
}

export function rankNCTResults(
  matches: NCTMatchResult[],
  options: RankingOptions = {},
): RankedNCT[] {
  const {
    topK = 8,
    minConfidence = 0.5,
    diversify = true,
    maxPerCluster = 2,
  } = options

  let filtered = matches.filter((m) => m.confidence >= minConfidence)

  if (diversify && filtered.length > 1) {
    filtered = diversifyByCluster(filtered, maxPerCluster)
  }

  const ranked: RankedNCT[] = filtered
    .sort((a, b) => b.finalScore - a.finalScore)
    .slice(0, topK)
    .map((match, index) => ({
      ...match,
      rank: index + 1,
      finalScore: match.finalScore,
      reasoning: buildReasoning(match, index),
    }))

  return ranked
}

function diversifyByCluster(
  matches: NCTMatchResult[],
  maxPerCluster: number,
): NCTMatchResult[] {
  const clusterCount = new Map<string, number>()
  const result: NCTMatchResult[] = []

  for (const match of matches) {
    const cluster = extractDiversificationKey(match)
    const count = clusterCount.get(cluster) ?? 0

    if (count < maxPerCluster) {
      result.push(match)
      clusterCount.set(cluster, count + 1)
    }
  }

  return result
}

function buildReasoning(match: NCTMatchResult, rank: number): string {
  const taxonomyPath = (match as unknown as { taxonomyPath?: string[] }).taxonomyPath ?? []
  const taxonomyHint = taxonomyPath.slice(0, 2).join(" → ")
  const careerHint = match.career_matches.slice(0, 2).join(", ")

  if (rank === 0) {
    const details = [
      `${match.matchedKeywords.length} ключевых слов`,
      `степень уверенности ${(match.confidence * 100).toFixed(0)}%`,
    ]
    if (taxonomyHint) {
      details.push(`таксономия ${taxonomyHint}`)
    } else if (careerHint) {
      details.push(careerHint)
    }

    return `Наилучшее совпадение: ${details.join(", ")}`
  }

  const keywordCount = match.matchedKeywords.length
  if (keywordCount > 0) {
    return `Совпадение по ${keywordCount} ключевым словам; ${taxonomyHint || careerHint}`
  }

  return `Уровень уверенности ${(match.confidence * 100).toFixed(0)}%${taxonomyHint ? `; ${taxonomyHint}` : ""}`
}

export function getTopMatchesByCluster(
  ranked: RankedNCT[],
  topPerCluster: number = 2,
): Map<number, RankedNCT[]> {
  const grouped = new Map<number, RankedNCT[]>()

  for (const item of ranked) {
    const cluster = extractCluster(item)
    const list = grouped.get(cluster) ?? []
    if (list.length < topPerCluster) {
      list.push(item)
      grouped.set(cluster, list)
    }
  }

  return grouped
}

export function calculateOverallConfidence(ranked: RankedNCT[]): number {
  if (ranked.length === 0) return 0
  const avg = ranked.reduce((sum, r) => sum + r.confidence, 0) / ranked.length
  const topBonus = ranked[0].finalScore > 0.7 ? 0.1 : 0
  return Math.min(avg + topBonus, 1)
}

/**
 * Converts the internal ranking score into a more useful user-facing match
 * percentage. The raw score is intentionally conservative and is not a
 * probability; this calibration keeps the result evidence-based while making
 * meaningful differences between shortlisted recommendations visible.
 */
export function recalibrateRecommendationConfidence(ranked: RankedNCT[]): RankedNCT[] {
  if (ranked.length === 0) return ranked

  const scores = ranked.map((item) => item.finalScore)
  const minimum = Math.min(...scores)
  const maximum = Math.max(...scores)
  const spread = maximum - minimum

  return ranked.map((item, index) => {
    const relativePosition = spread > 0.015
      ? clamp01((item.finalScore - minimum) / spread)
      : 1 - index / Math.max(ranked.length - 1, 1)
    const componentEvidence = weightedEvidence(item)
    const calibrated = clamp01(0.24 + componentEvidence * 0.56 + relativePosition * 0.2)

    return {
      ...item,
      confidence: Number(calibrated.toFixed(3)),
    }
  })
}

function weightedEvidence(item: RankedNCT): number {
  const fallback = clamp01(item.finalScore)
  return clamp01(
    fallback * 0.55 +
      clamp01(item.semanticScore ?? fallback) * 0.15 +
      clamp01(item.taxonomyScore ?? fallback) * 0.15 +
      clamp01(item.lexicalScore ?? fallback) * 0.1 +
      clamp01(item.facetScore ?? fallback) * 0.05,
  )
}

function clamp01(value: number): number {
  return Math.min(1, Math.max(0, Number.isFinite(value) ? value : 0))
}
