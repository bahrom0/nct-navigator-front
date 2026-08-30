"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ChevronUp, ExternalLink, FlaskConical, GraduationCap, MapPin, Medal } from "lucide-react"
import { BookmarkButton } from "@/components/signal-cards/BookmarkButton"
import { CompetitionMeter } from "@/components/strategy/CompetitionMeter"
import { useRouter } from "next/navigation"
import { logActivityEvent } from "@/lib/activity-logger"
import { cityLabel } from "@/lib/city-label"
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
  const [reasonFullHeight, setReasonFullHeight] = useState<number | null>(null)
  const [reasonMaskHeld, setReasonMaskHeld] = useState(false)
  const reasonRef = useRef<HTMLParagraphElement | null>(null)
  const reasonMaskTimeoutRef = useRef<number | null>(null)

  const collapseReason = useCallback(() => {
    setReasonExpanded(false)
    // Маска обрезки возвращается только после того, как доиграет анимация высоты,
    // иначе текст резко «проедает» градиент в конце закрытия.
    setReasonMaskHeld(true)
    if (reasonMaskTimeoutRef.current) window.clearTimeout(reasonMaskTimeoutRef.current)
    reasonMaskTimeoutRef.current = window.setTimeout(() => setReasonMaskHeld(false), 470)
  }, [])

  useEffect(() => {
    return () => {
      if (reasonMaskTimeoutRef.current) window.clearTimeout(reasonMaskTimeoutRef.current)
    }
  }, [])

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
    setReasonFullHeight(element.scrollHeight)
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
      <div className="navigator-recommendation-card-content flex h-full flex-col p-5 sm:p-6">
        <header className="flex flex-wrap items-center gap-2">
          {rankTone && (
            <span className={`navigator-recommendation-rank navigator-recommendation-rank--${rankTone}`}>
              <span className="text-[0.65rem] uppercase tracking-[0.12em]">Топ</span>
              <Medal className="h-3.5 w-3.5" aria-hidden="true" />
              <strong className="text-base">{rank}</strong>
            </span>
          )}
          <span
            className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums"
            style={{ backgroundColor: "rgb(113 97 77 / 0.08)", color: "var(--text-secondary)" }}
          >
            {code}
          </span>
          {relationType && (
            <span
              className="ml-auto inline-flex max-w-full items-center rounded-full px-2.5 py-1 text-[0.68rem] font-bold uppercase tracking-[0.08em]"
              style={{ backgroundColor: `${accentColor}14`, color: accentColor }}
              aria-label={`Тип связи: ${RELATION_LABELS[relationType]}`}
            >
              {RELATION_LABELS[relationType]}
            </span>
          )}
        </header>

        <h3 className="mt-3.5 text-[1.15rem] font-semibold leading-snug tracking-[-0.02em] text-foreground sm:text-xl">
          {title_ru}
        </h3>

        {institution.trim() ? (
          <p className="mt-1.5 text-sm leading-snug text-text-secondary">{institution}</p>
        ) : null}

        <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[13px] text-text-muted">
          {city.trim() ? (
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
              {cityLabel(city)}
            </span>
          ) : null}
          {cluster !== undefined && (
            <div
              className="relative inline-flex items-center gap-2.5"
              onMouseEnter={() => setShowTooltip(true)}
              onMouseLeave={() => setShowTooltip(false)}
            >
              {city.trim() ? <span className="h-1 w-1 rounded-full bg-border" aria-hidden="true" /> : null}
              <span
                className="inline-flex cursor-default items-center gap-1 transition-colors hover:text-text-secondary"
                aria-label={clusterName ? `${clusterName}: экзамены ${EDUCATION_LEVEL_LABELS[educationLevel]}` : undefined}
              >
                <GraduationCap className="h-3.5 w-3.5" aria-hidden="true" />
                Кластер {cluster}
              </span>

              {showTooltip && exams.length > 0 && (
                <div className="absolute left-0 top-full z-20 mt-2 w-72 rounded-[16px] border border-border bg-card-bg p-3 shadow-lg">
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
                </div>
              )}
            </div>
          )}
          <span className="ml-auto hidden shrink-0 font-medium tabular-nums text-text-muted sm:inline">
            {confidencePercent}%
          </span>
        </div>

        {compactInterestCoverage.length > 0 && (
          <div
            className={[
              "navigator-interest-coverage relative mt-4 overflow-hidden rounded-[16px] border border-border bg-background/40 p-4",
              hiddenInterestCoverageCount > 0 ? "pb-14" : "",
            ].filter(Boolean).join(" ")}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-text-muted">Покрытие интересов</p>
            <div className={[
              "mt-3 space-y-3",
              hiddenInterestCoverageCount > 0 ? "navigator-interest-coverage-list-fade" : "",
            ].filter(Boolean).join(" ")}>
              {compactInterestCoverage.map((coverage, index) => {
                const percent = coveragePercent(coverage.score)

                return (
                  <div key={`${coverage.interestId}-${index}`}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="min-w-0 truncate font-medium text-foreground" title={coverage.interest}>{coverage.interest}</span>
                      <span className="shrink-0 font-semibold tabular-nums text-primary">{percent}%</span>
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
                style={isReasonExpanded && reasonFullHeight ? { maxHeight: `${reasonFullHeight}px` } : undefined}
                className={[
                  "navigator-recommendation-reason-copy text-sm leading-6 text-text-secondary",
                  !isReasonExpanded ? "navigator-recommendation-reason-copy--clamped" : "",
                  !isReasonExpanded && !reasonMaskHeld ? "navigator-recommendation-reason-copy--clamped-mask" : "",
                ].filter(Boolean).join(" ")}
              >
                {trimmedReasoning}
              </p>

              <AnimatePresence initial={false}>
                {reasonOverflows && !isReasonExpanded && !reasonMaskHeld && (
                  <motion.div
                    key="reason-fade"
                    className="navigator-recommendation-reason-fade"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.28, ease: "easeOut" }}
                  >
                    <button
                      type="button"
                      onClick={() => setReasonExpanded(true)}
                      aria-expanded={false}
                      aria-label="Раскрыть полное объяснение выбора направления"
                      title="Показать полное объяснение"
                      className="navigator-recommendation-reason-trigger"
                    >
                      <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <AnimatePresence initial={false}>
              {isReasonExpanded && (
                <motion.button
                  key="reason-collapse"
                  type="button"
                  onClick={collapseReason}
                  aria-expanded={true}
                  className="navigator-recommendation-reason-collapse"
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.24, ease: "easeOut" }}
                >
                  <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                  Свернуть объяснение
                </motion.button>
              )}
            </AnimatePresence>
          </section>
        )}

        <div aria-hidden="true" className="h-5" />

        <footer className="mt-auto flex flex-wrap items-center gap-2 border-t border-border pt-4">          <span className="shrink-0">
            <BookmarkButton nctCode={code} nctTitle={title_ru} institution={institution} city={city} />
          </span>
          {variant !== "compact" && (
            <>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={() => handleExplain()}
                className="flex h-10 min-w-[7.5rem] flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full border border-border bg-transparent px-3 text-sm font-medium text-foreground transition-colors hover:bg-background"
              >
                <ExternalLink className="h-4 w-4 text-text-muted" aria-hidden="true" />
                Подробнее
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.97 }}
                onClick={handleSelectGoal}
                className="flex h-10 min-w-[8.5rem] flex-[1.3] items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[image:var(--marketing-cta-bg)] px-3 text-sm font-semibold text-white transition-colors hover:bg-[image:var(--marketing-cta-hover)]"
              >
                <FlaskConical className="h-4 w-4" aria-hidden="true" />
                Выбрать цель
              </motion.button>
            </>
          )}
        </footer>
      </div>
    </motion.article>
  )
}
