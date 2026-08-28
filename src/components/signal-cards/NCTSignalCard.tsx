"use client"

import { useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ExternalLink, FlaskConical, GraduationCap, Medal } from "lucide-react"
import { BookmarkButton } from "@/components/signal-cards/BookmarkButton"
import { CompetitionMeter } from "@/components/strategy/CompetitionMeter"
import { evaluateCompetitionForCode } from "@/features/strategy/competition-meter"
import { useRouter } from "next/navigation"
import { logActivityEvent } from "@/lib/activity-logger"
import { CLUSTER_NAMES, CLUSTER_EXAMS, EDUCATION_LEVEL_LABELS } from "@/lib/db/types"
import type { RecommendationInterestCoverage, RecommendationRelationType } from "@/types/nct"

interface NCTSignalCardProps {
  code: string
  title_ru: string
  institution: string
  city: string
  confidence: number
  relationType?: RecommendationRelationType
  interestCoverage?: RecommendationInterestCoverage[]
  cluster?: number
  educationLevel?: "after_9" | "after_11"
  taxonomy?: {
    cluster_name_ru?: string
    study_form?: string[]
    study_type?: string[]
  }
  rank?: number
  variant?: "default" | "compact" | "featured"
  onSelect?: () => void
}

const ACCENT_COLOR = "#315fca"
const RELATION_LABELS: Record<RecommendationRelationType, string> = {
  direct: "Прямой путь",
  bridge: "Связующий путь",
  adjacent: "Смежный путь",
}

function coveragePercent(score: number): number {
  return Math.round(Math.max(0, Math.min(1, score)) * 100)
}

export function NCTSignalCard({
  code,
  title_ru,
  institution,
  city,
  confidence,
  relationType,
  interestCoverage,
  cluster,
  educationLevel = "after_11",
  taxonomy,
  rank,
  variant = "default",
  onSelect,
}: NCTSignalCardProps) {
  const accentColor = ACCENT_COLOR
  const router = useRouter()
  const confidencePercent = Math.round(confidence * 100)
  const [showTooltip, setShowTooltip] = useState(false)

  const clusterName = cluster !== undefined ? CLUSTER_NAMES[cluster] : taxonomy?.cluster_name_ru
  const exams = cluster !== undefined ? CLUSTER_EXAMS[educationLevel]?.[cluster] ?? [] : []
  const rankTone = rank === 1 ? "gold" : rank === 2 ? "silver" : rank === 3 ? "bronze" : null

  const competition = useMemo(() => evaluateCompetitionForCode(code, confidence), [code, confidence])

  const handleExplain = () => {
    logActivityEvent("view_recommendation", `Подробнее: ${code} - ${title_ru}`)
    router.push(`/explain?code=${encodeURIComponent(code)}&title=${encodeURIComponent(title_ru)}`)
  }

  const handleSelectGoal = () => {
    if (onSelect) {
      onSelect()
      return
    }
    router.push(`/plan?code=${encodeURIComponent(code)}&title=${encodeURIComponent(title_ru)}`)
  }

  const springHover = { type: "spring" as const, stiffness: 250, damping: 18 }

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      transition={springHover}
      className={[
        "navigator-recommendation-card group relative overflow-hidden rounded-[24px]",
        variant === "featured" ? "navigator-recommendation-card--featured" : "",
        variant === "compact" ? "navigator-recommendation-card--compact" : "",
        rankTone ? `navigator-recommendation-card--rank-${rankTone}` : "",
      ].filter(Boolean).join(" ")}
    >
      <div className="flex h-full flex-col p-6">
        <header className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            {rankTone && (
              <span className={`navigator-recommendation-rank navigator-recommendation-rank--${rankTone}`}>
                <span className="text-[0.65rem] uppercase tracking-[0.12em]">Топ</span>
                <Medal className="h-3.5 w-3.5" aria-hidden="true" />
                <strong className="text-base">{rank}</strong>
              </span>
            )}
            <motion.span
              whileHover={{ scale: 1.05 }}
              transition={springHover}
              className="inline-flex rounded-full border px-3 py-1 text-[0.68rem] font-bold uppercase tracking-[0.12em]"
              style={{ backgroundColor: `${accentColor}14`, color: accentColor }}
            >
              {code}
            </motion.span>

            {relationType && (
              <motion.span
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.06 }}
                className="inline-flex max-w-full items-center rounded-full border border-primary/25 bg-primary-light px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.08em] text-primary"
                aria-label={`Тип связи: ${RELATION_LABELS[relationType]}`}
              >
                {RELATION_LABELS[relationType]}
              </motion.span>
            )}

            {cluster !== undefined && (
              <div
                className="relative"
                onMouseEnter={() => setShowTooltip(true)}
                onMouseLeave={() => setShowTooltip(false)}
              >
                <motion.span
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20, delay: 0.1 }}
                className="inline-flex cursor-default items-center gap-1 rounded-full border border-border bg-transparent px-2.5 py-1 text-xs font-medium text-text-secondary"
                  aria-label={clusterName ? `${clusterName}: экзамены ${EDUCATION_LEVEL_LABELS[educationLevel]}` : undefined}
                >
                  <GraduationCap className="h-3 w-3" />
                  Кластер {cluster}
                </motion.span>

                <AnimatePresence>
                  {showTooltip && exams.length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 6, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 4, scale: 0.95 }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        className="absolute left-0 top-full z-20 mt-2 w-72 rounded-[16px] border border-border bg-card-bg p-3 shadow-lg"
                    >
                      <p className="text-xs font-semibold text-foreground">Экзамены НЦТ</p>
                      <p className="mt-1 text-[11px] leading-snug text-text-muted">
                        {clusterName ?? `Кластер ${cluster}`} • {EDUCATION_LEVEL_LABELS[educationLevel]}
                      </p>
                      <ul className="mt-2 space-y-1">
                        {exams.map((exam) => (
                          <li key={exam} className="flex items-center gap-2 text-xs text-text-secondary">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: accentColor }} />
                            {exam}
                          </li>
                        ))}
                      </ul>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
          <div
            className="hidden"
            style={{
              backgroundColor:
                confidencePercent >= 80 ? "#10B98114" : confidencePercent >= 60 ? "#F59E0B14" : "#EF444414",
              color: confidencePercent >= 80 ? "#10B981" : confidencePercent >= 60 ? "#F59E0B" : "#EF4444",
            }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: "currentColor" }} />
            {confidencePercent}% совпадение
          </div>
        </header>

        <div className="mt-4">
          <h3 className="text-2xl font-semibold leading-[1.12] tracking-[-0.025em] text-foreground sm:text-[2rem]">{title_ru}</h3>
          <div className="mt-1.5 flex items-center gap-2 text-sm text-text-secondary">
            <span className="font-medium">{institution}</span>
            <span className="text-text-muted">В·</span>
            <span>{city}</span>
          </div>
        </div>

        {interestCoverage && interestCoverage.length > 0 && (
          <div className="mt-5 rounded-[16px] border border-border bg-background/40 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">Покрытие интересов</p>
            <div className="mt-3 space-y-3">
              {interestCoverage.map((coverage, index) => {
                const percent = coveragePercent(coverage.score)

                return (
                  <div key={`${coverage.interestId}-${index}`}>
                    <div className="flex items-start justify-between gap-3 text-sm">
                      <span className="min-w-0 font-medium text-foreground">{coverage.interest}</span>
                      <span className="shrink-0 font-semibold text-primary">{percent}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border/60" aria-hidden="true">
                      <span className="block h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: accentColor }} />
                    </div>
                    {coverage.evidence.length > 0 && (
                      <p className="mt-1.5 text-xs leading-relaxed text-text-muted">{coverage.evidence.join(" · ")}</p>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <CompetitionMeter level={competition.level} score={competition.score} reason={competition.reason} />

        <footer className="navigator-recommendation-actions mt-auto flex flex-nowrap items-center gap-2 border-t border-border pt-4">
          <span className="shrink-0">
            <BookmarkButton nctCode={code} nctTitle={title_ru} institution={institution} city={city} />
          </span>
          {variant !== "compact" && (
            <>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleExplain}
                className="inline-flex h-11 min-w-0 shrink items-center gap-2 whitespace-nowrap rounded-full border border-border bg-transparent px-3 text-sm font-medium text-foreground transition-colors hover:bg-background"
              >
                <ExternalLink className="h-4 w-4 text-text-muted" />
                Подробнее
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={handleSelectGoal}
                className="inline-flex h-11 min-w-0 shrink items-center gap-2 whitespace-nowrap rounded-full bg-[image:var(--marketing-cta-bg)] px-3 text-sm font-semibold text-white transition-colors hover:bg-[image:var(--marketing-cta-hover)]"
              >
                <FlaskConical className="h-4 w-4" />
                Выбрать цель
              </motion.button>
            </>
          )}
        </footer>
      </div>
    </motion.article>
  )
}
