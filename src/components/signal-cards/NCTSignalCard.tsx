"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, ExternalLink, FlaskConical, GraduationCap, Medal } from "lucide-react"
import { BookmarkButton } from "@/components/signal-cards/BookmarkButton"
import { CompetitionMeter } from "@/components/strategy/CompetitionMeter"
import { evaluateCompetitionForCode } from "@/features/strategy/competition-meter"
import { useRouter } from "next/navigation"
import { logActivityEvent } from "@/lib/activity-logger"
import { CLUSTER_NAMES, CLUSTER_EXAMS, EDUCATION_LEVEL_LABELS } from "@/lib/db/types"

interface NCTSignalCardProps {
  code: string
  title_ru: string
  institution: string
  city: string
  confidence: number
  career_matches: string[]
  whyItFits: string
  matchedInterests: string[]
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
const COLLAPSED_REASON_HEIGHT = 120

export function NCTSignalCard({
  code,
  title_ru,
  institution,
  city,
  confidence,
  career_matches,
  whyItFits,
  matchedInterests,
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
  const [isReasonExpanded, setIsReasonExpanded] = useState(false)
  const [canExpandReason, setCanExpandReason] = useState(false)
  const reasonTextRef = useRef<HTMLParagraphElement>(null)

  const clusterName = cluster !== undefined ? CLUSTER_NAMES[cluster] : taxonomy?.cluster_name_ru
  const exams = cluster !== undefined ? CLUSTER_EXAMS[educationLevel]?.[cluster] ?? [] : []
  const rankTone = rank === 1 ? "gold" : rank === 2 ? "silver" : rank === 3 ? "bronze" : null

  const competition = useMemo(() => evaluateCompetitionForCode(code, confidence), [code, confidence])

  useEffect(() => {
    const measureReason = () => {
      const height = reasonTextRef.current?.scrollHeight ?? 0
      setCanExpandReason(height > COLLAPSED_REASON_HEIGHT + 1)
    }

    const frame = window.requestAnimationFrame(measureReason)
    window.addEventListener("resize", measureReason)
    return () => {
      window.cancelAnimationFrame(frame)
      window.removeEventListener("resize", measureReason)
    }
  }, [whyItFits])

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
        isReasonExpanded ? "navigator-recommendation-card--expanded" : "",
      ].filter(Boolean).join(" ")}
    >
      <div className="flex h-full flex-col p-6">
        <header className="flex items-start justify-between gap-4">
          <div className="flex min-w-0 items-center gap-2">
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

        {career_matches.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {career_matches.slice(0, 4).map((career) => (
              <span key={career} className="rounded-[8px] border border-border bg-background px-2.5 py-1 text-xs text-text-secondary">
                {career}
              </span>
            ))}
            {career_matches.length > 4 && <span className="rounded-[8px] px-2.5 py-1 text-xs text-text-muted">+{career_matches.length - 4}</span>}
          </div>
        )}

        <CompetitionMeter level={competition.level} score={competition.score} reason={competition.reason} />

        {whyItFits && (
          <div className="navigator-recommendation-reason mt-5 rounded-[16px] border border-border p-4">
            <motion.div
              animate={{ maxHeight: isReasonExpanded ? 1200 : COLLAPSED_REASON_HEIGHT }}
              transition={{ duration: 0.28, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <p ref={reasonTextRef} className="text-sm leading-relaxed text-text-secondary">{whyItFits}</p>
            </motion.div>
            {matchedInterests.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {matchedInterests.map((interest) => (
                  <span
                    key={interest}
                    className="rounded-full px-2.5 py-1 text-xs font-medium"
                    style={{ backgroundColor: `${accentColor}18`, color: accentColor }}
                  >
                    {interest}
                  </span>
                ))}
              </div>
            )}
            {canExpandReason && (
              <button
              type="button"
              aria-expanded={isReasonExpanded}
              onClick={() => setIsReasonExpanded((expanded) => !expanded)}
              className="mt-3 inline-flex min-h-9 items-center gap-1.5 rounded-full px-2 text-xs font-semibold text-primary transition-colors hover:bg-primary-light/60"
            >
              {isReasonExpanded ? "Свернуть" : "Показать полностью"}
              <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isReasonExpanded ? "rotate-180" : ""}`} />
              </button>
            )}
          </div>
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
