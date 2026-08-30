"use client";

import { BookOpen } from "lucide-react";
import type { CoachRecommendation } from "./CoachGoalSetup";

interface CoachGoalRecommendationListProps {
  recommendations: CoachRecommendation[];
  loading?: boolean;
  pickedIndex: number | null;
  onPick: (index: number) => void;
}

export function CoachGoalRecommendationList({
  recommendations,
  loading = false,
  pickedIndex,
  onPick,
}: CoachGoalRecommendationListProps) {
  if (loading) {
    return (
      <div className="mt-5 space-y-2" aria-busy="true">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-[16px] bg-[var(--marketing-soft)]"
          />
        ))}
   </div>
    );
  }

  if (recommendations.length === 0) {
    return (
      <p className="mt-5 rounded-[16px] border border-[var(--marketing-border)] bg-[var(--marketing-soft)] px-4 py-6 text-center text-sm text-[var(--marketing-muted)]">
        У нас пока нет рекомендаций для тебя.
        <br />
        Введите код НЦТ вручную — Coach подстроится.
   </p>
    );
  }

  return (
    <ul
      className="mt-5 space-y-2"
      role="radiogroup"
      aria-label="Рекомендации"
    >
      {recommendations.slice(0, 6).map((rec, index) => {
        const active = pickedIndex === index;
        return (
          <li key={`${rec.nctCode}-${index}`}>
            <button
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => onPick(index)}
              className={`flex w-full items-start gap-3 rounded-[16px] border px-3.5 py-3.5 text-left transition-all duration-200 ${
                active
                  ? "border-[var(--marketing-accent)] bg-[var(--marketing-surface-contrast)] shadow-[0_12px_28px_rgba(42,34,25,0.14)]"
                  : "border-[var(--marketing-border)] bg-[var(--marketing-surface)] hover:border-[var(--marketing-border-strong)]"
              }`}
            >
              <BookOpen
                className={`mt-0.5 h-4 w-4 shrink-0 ${
                  active ? "text-[var(--marketing-accent)]" : "text-[var(--marketing-muted)]"
                }`}
                aria-hidden="true"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-[var(--marketing-foreground)]">
                  {rec.nctTitle}
             </p>
                <p className="truncate text-xs text-[var(--marketing-muted)]">
                  {rec.nctCode}
                  {rec.institution ? ` · ${rec.institution}` : ""}
             </p>
           </div>
              {active ? (
                <span className="shrink-0 rounded-full bg-[image:var(--marketing-cta-bg)] px-2.5 py-1 text-[11px] font-semibold text-white">
                  Выбрано
             </span>
              ) : null}
         </button>
       </li>
        );
      })}
 </ul>
  );
}
