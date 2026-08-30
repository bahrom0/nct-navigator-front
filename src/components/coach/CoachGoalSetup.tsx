"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  ChevronRight,
  Code2,
  Compass,
  Sparkles,
  Wand2,
} from "lucide-react";
import { CoachGoalManualForm } from "./CoachGoalManualForm";
import { CoachGoalRecommendationList } from "./CoachGoalRecommendationList";

export interface CoachRecommendation {
  nctCode: string;
  nctTitle: string;
  institution?: string;
  city?: string;
  matchScore?: number;
}

export interface CoachGoalDraft {
  nctCode: string;
  nctTitle: string;
  university?: string;
}

interface CoachGoalSetupProps {
  recommendations?: CoachRecommendation[];
  loading?: boolean;
  submitting?: boolean;
  errorMessage?: string | null;
  defaultUniversity?: string;
  onSubmit: (draft: CoachGoalDraft) => void;
}

type Mode = "recommended" | "manual";

export function CoachGoalSetup({
  recommendations = [],
  loading = false,
  submitting = false,
  errorMessage = null,
  defaultUniversity,
  onSubmit,
}: CoachGoalSetupProps) {
  const [mode, setMode] = useState<Mode>(
    recommendations.length > 0 ? "recommended" : "manual",
  );
  const [pickedIndex, setPickedIndex] = useState<number | null>(
    recommendations.length > 0 ? 0 : null,
  );
  const [nctCode, setNctCode] = useState("");
  const [nctTitle, setNctTitle] = useState("");
  const [university, setUniversity] = useState(defaultUniversity ?? "");

  const picked = pickedIndex !== null ? recommendations[pickedIndex] : null;
  const recommendedValid = !!picked && !loading;
  const manualValid =
    nctCode.trim().length > 0 && nctTitle.trim().length > 0 && !loading;
  const canSubmit = recommendedValid || (mode === "manual" && manualValid);

  const handleSubmit = () => {
    if (!canSubmit) return;
    if (mode === "recommended" && picked) {
      onSubmit({
        nctCode: picked.nctCode,
        nctTitle: picked.nctTitle,
        university: university.trim() || picked.institution || undefined,
      });
      return;
    }
    onSubmit({
      nctCode: nctCode.trim(),
      nctTitle: nctTitle.trim(),
      university: university.trim() || undefined,
    });
  };

  const modeOptions = useMemo(
    () => {
      const opts: { id: Mode; label: string; icon: typeof Compass }[] = [
        { id: "manual", label: "Ввести вручную", icon: Code2 },
      ];
      if (recommendations.length > 0) {
        opts.unshift({
          id: "recommended",
          label: "Из рекомендаций",
          icon: Sparkles,
        });
      }
      return opts;
    },
    [recommendations.length],
  );

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="mx-auto flex w-full max-w-md flex-col items-stretch rounded-[2rem] border border-[var(--marketing-border)] bg-[linear-gradient(165deg,var(--marketing-surface-strong),var(--marketing-soft))] p-6 shadow-[0_30px_90px_rgba(31,27,22,0.1)] sm:p-7"
    >
      <header className="flex flex-col items-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-[20px] border border-[var(--marketing-border)] bg-[image:var(--marketing-cta-bg)] text-[#f0e1cf] shadow-[0_16px_36px_rgba(42,34,25,0.28)]">
          <Compass className="h-8 w-8" aria-hidden="true" />
        </div>
        <h1 className="mt-5 text-[1.35rem] font-semibold tracking-[-0.03em] text-[var(--marketing-foreground)]">
          Какая у тебя цель?
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-[var(--marketing-muted)]">
          Coach будет сопровождать тебя до поступления: построит маршрут,
          подберёт задачи и адаптирует план каждый день.
        </p>
      </header>

      {modeOptions.length > 1 ? (
        <div
          role="tablist"
          aria-label="Способ выбора цели"
          className="mt-6 grid grid-cols-2 gap-1.5 rounded-[16px] border border-[var(--marketing-border)] bg-[var(--marketing-soft)] p-1.5"
        >
          {modeOptions.map((option) => {
            const Icon = option.icon;
            const active = mode === option.id;
            return (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setMode(option.id)}
                className={`inline-flex h-11 items-center justify-center gap-1.5 rounded-[12px] text-[13px] font-semibold transition-all duration-200 ${
                  active
                    ? "bg-[image:var(--marketing-cta-bg)] text-white shadow-[0_10px_22px_rgba(42,34,25,0.22)]"
                    : "text-[var(--marketing-muted)] hover:text-[var(--marketing-foreground)]"
                }`}
              >
                <Icon className="h-4 w-4" aria-hidden="true" />
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}

      {mode === "recommended" ? (
        <CoachGoalRecommendationList
          recommendations={recommendations}
          loading={loading}
          pickedIndex={pickedIndex}
          onPick={setPickedIndex}
        />
      ) : (
        <CoachGoalManualForm
          nctCode={nctCode}
          nctTitle={nctTitle}
          university={university}
          onChangeCode={setNctCode}
          onChangeTitle={setNctTitle}
          onChangeUniversity={setUniversity}
        />
      )}

      {errorMessage ? (
        <p
          role="alert"
          className="mt-4 rounded-[14px] border border-error/30 bg-error/10 px-3.5 py-2.5 text-[13px] font-medium text-error"
        >
          {errorMessage}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!canSubmit || submitting}
        className="mt-6 inline-flex h-[3.25rem] items-center justify-center gap-2 rounded-[16px] bg-[image:var(--marketing-cta-bg)] px-4 text-[0.95rem] font-semibold text-white shadow-[0_16px_36px_rgba(42,34,25,0.24)] transition-all duration-200 hover:bg-[image:var(--marketing-cta-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgba(42,34,25,0.35)] disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none"
      >
        <Wand2 className="h-4 w-4" aria-hidden="true" />
        {submitting ? "Готовим Coach…" : "Начать подготовку"}
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </motion.section>
  );
}
