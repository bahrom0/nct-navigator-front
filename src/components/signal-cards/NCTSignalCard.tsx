"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronUp, ExternalLink, FlaskConical, GraduationCap, Medal } from "lucide-react"
import { BookmarkButton } from "@/components/signal-cards/BookmarkButton"
import { CompetitionMeter } from "@/components/strategy/CompetitionMeter"
import { useRouter } from "next/navigation"
import { logActivityEvent } from "@/lib/activity-logger"
import { CLUSTER_NAMES, CLUSTER_EXAMS, EDUCATION_LEVEL_LABELS } from "@/lib/db/types"
import {
  COMPACT_INTEREST_COVERAGE_LIMIT,
  coveragePercent,
  sortInterestCoverage,
} from "@/lib/recommendations/interest-coverage"
import type { RecommendationInterestCoverage, RecommendationRelationType } from "@/types/nct"

interface NCTSignalCardProps {
  code: string
  title_ru: string
  institution: string
  city: string
  admissionPlan?: number
  confidence: number
  reasoning?: string
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

function interestCountLabel(count: number): string {
  const lastTwoDigits = count % 100
  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) return "интересов"

  switch (count % 10) {
    case 1:
      return "интерес"
    case 2:
    case 3:
    case 4:
      return "интереса"
    default:
      return "интересов"
  }
}

export function NCTSignalCard({
  code,
  title_ru,
  institution,
  city,
  admissionPlan,
  confidence,
  reasoning,
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
  const [reasonExpanded, setReasonExpanded] = useState(false)
  const [reasonOverflows, setReasonOverflows] = useState(false)
  const reasonRef = useRef<HTMLParagraphElement | null>(null)

  const clusterName = cluster !== undefined ? CLUSTER_NAMES[cluster] : taxonomy?.cluster_name_ru
  const exams = cluster !== undefined ? CLUSTER_EXAMS[educationLevel]?.[cluster] ?? [] : []
  const rankTone = rank === 1 ? "gold" : rank === 2 ? "silver" : rank === 3 ? "bronze" : null

  const compactInterestCoverage = useMemo(
    () => sortInterestCoverage(interestCoverage ?? []).slice(0, COMPACT_INTEREST_COVERAGE_LIMIT),
    [interestCoverage],
  )
  const hiddenInterestCoverageCount = Math.max(0, (interestCoverage?.length ?? 0) - compactInterestCoverage.length)
  const hiddenInterestLabel = interestCountLabel(hiddenInterestCoverageCount)
  const trimmedReasoning = reasoning?.trim() ?? ""
  const isReasonExpanded = reasonExpanded && reasonOverflows

  const measureReasonOverflow = useCallback(() => {
    const element = reasonRef.current
    if (!element) return
    setReasonOverflows(element.scrollHeight > 72)
  }, [])

  useEffect(() => {
    if (!trimmedReasoning) return

    measureReasonOverflow()

    if (typeof ResizeObserver === "undefined" || !reasonRef.current) return
    const observer = new ResizeObserver(measureReasonOverflow)
    observer.observe(reasonRef.current)
    return () => observer.disconnect()
  }, [measureReasonOverflow, trimmedReasoning])

  const handleExplain = (section?: "coverage") => {
    logActivityEvent("view_recommendation", `Подробнее: ${code} - ${title_ru}`)
    const sectionQuery = section ? "&section=coverage" : ""
    router.push(`/explain?code=${encodeURIComponent(code)}&title=${encodeURIComponent(title_ru)}${sectionQuery}`)
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
        isReasonExpanded ? "navigator-recommendation-card--reason-expanded" : "",
        rankTone ? `navigator-recommendation-card--rank-${rankTone}` : "",
      ].filter(Boolean).join(" ")}
    >
      <div className="navigator-recommendation-card-content flex h-full flex-col p-6">
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

        {compactInterestCoverage.length > 0 && (
          <div
            className={[
              "navigator-interest-coverage relative mt-5 overflow-hidden rounded-[16px] border border-border bg-background/40 p-4",
              hiddenInterestCoverageCount > 0 ? "pb-14" : "",
            ].filter(Boolean).join(" ")}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">Покрытие интересов</p>
            <div className="mt-3 space-y-3">
              {compactInterestCoverage.map((coverage, index) => {
                const percent = coveragePercent(coverage.score)

                return (
                  <div key={`${coverage.interestId}-${index}`}>
                    <div className="flex items-start justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate font-medium text-foreground" title={coverage.interest}>{coverage.interest}</span>
                      <span className="shrink-0 font-semibold text-primary">{percent}%</span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-border/60" aria-hidden="true">
                      <span className="block h-full rounded-full" style={{ width: `${percent}%`, backgroundColor: accentColor }} />
                    </div>
                  </div>
                )
              })}
            </div>

            {hiddenInterestCoverageCount > 0 && (
              <div className="navigator-interest-coverage-fade">
                <button
                  type="button"
                  onClick={() => handleExplain("coverage")}
                  aria-label={`Открыть все интересы в подробностях. Скрыто интересов: ${hiddenInterestCoverageCount}`}
                  title={`Ещё ${hiddenInterestCoverageCount} ${hiddenInterestLabel} в подробностях`}
                  className="navigator-interest-coverage-trigger"
                >
                  <ChevronDown className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            )}
          </div>
        )}

        <CompetitionMeter admissionPlan={admissionPlan} />

        {trimmedReasoning && (
          <section className="navigator-recommendation-reason mt-3" aria-label="Почему выбрано это направление">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">Почему выбрано</p>
            <div className="navigator-recommendation-reason-viewport relative mt-2">
              <p
                ref={reasonRef}
                className={[
                  "navigator-recommendation-reason-copy text-sm leading-6 text-text-secondary",
                  !isReasonExpanded ? "navigator-recommendation-reason-copy--clamped" : "",
                ].filter(Boolean).join(" ")}
              >
                {trimmedReasoning}
              </p>

              {reasonOverflows && !isReasonExpanded && (
                <div className="navigator-recommendation-reason-fade">
                  <button
                    type="button"
                    onClick={() => setReasonExpanded(true)}
                    aria-expanded="false"
                    aria-label="Раскрыть полное объяснение выбора направления"
                    title="Показать полное объяснение"
                    className="navigator-recommendation-reason-trigger"
                  >
                    <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>

            {isReasonExpanded && (
              <button
                type="button"
                onClick={() => setReasonExpanded(false)}
                aria-expanded="true"
                className="navigator-recommendation-reason-collapse"
              >
                <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                Свернуть объяснение
              </button>
            )}
          </section>
        )}

        <footer className="navigator-recommendation-actions mt-auto flex flex-nowrap items-center gap-2 border-t border-border pt-4">
          <span className="shrink-0">
            <BookmarkButton nctCode={code} nctTitle={title_ru} institution={institution} city={city} />
          </span>
          {variant !== "compact" && (
            <>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => handleExplain()}
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
