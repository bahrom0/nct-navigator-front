"use client";

import type { AnalysisStep } from "@/types/analysis";
import { STEPS as STEP_LIST } from "@/types/analysis";
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";

const STEP_CHIPS: Record<AnalysisStep, string> = {
  submitting_request: "Профессии",
  analyzing_interests: "Интересы",
  searching_nct_codes: "Программы",
  forming_recommendations: "Проверка",
};

const SUBTITLES: Record<AnalysisStep, string> = {
  submitting_request: "Собираем shortlist профессий по вашим интересам",
  analyzing_interests: "Сверяем ваши интересы с каталогом профессий",
  searching_nct_codes: "Ищем связанные программы и коды НЦТ",
  forming_recommendations: "Проверяем кандидатов и ранжируем рекомендации",
};

type ChipState = "done" | "active" | "pending";

function pluralDirections(count: number): string {
  const mod10 = count % 10;
  const mod100 = count % 100;
  if (mod10 === 1 && mod100 !== 11) return `${count} направление интересов`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${count} направления интересов`;
  return `${count} направлений интересов`;
}

function AnalysisOrb({ active }: { active: boolean }) {
  return (
    <div className="relative h-36 w-36 shrink-0 sm:h-44 sm:w-44" aria-hidden="true">
      <motion.div
        className="absolute inset-[-12%] rounded-full bg-[radial-gradient(circle_at_50%_58%,rgba(148,178,255,0.32),rgba(148,178,255,0.12)_48%,transparent_72%)] blur-lg"
        animate={{
          scale: active ? [1, 1.07, 1, 1.09, 1] : [1, 1.07, 1],
          opacity: active ? [0.75, 1, 0.8, 1, 0.75] : [0.75, 1, 0.75],
        }}
        transition={
          active
            ? { duration: 1.6, repeat: Infinity, ease: "easeInOut" }
            : { duration: 4.2, repeat: Infinity, ease: "easeInOut" }
        }
      />
      <motion.div
        className="absolute inset-0"
        animate={active ? { scale: [1, 1.035, 1, 1.05, 1] } : { scale: 1 }}
        transition={
          active
            ? { duration: 1.6, repeat: Infinity, times: [0, 0.16, 0.32, 0.52, 0.68], ease: "easeInOut" }
            : { duration: 0.3 }
        }
      >
        <motion.div
          className="absolute inset-[16%] rounded-full bg-[radial-gradient(circle_at_38%_30%,#ffffff_0%,#e3e9ff_26%,#b7c8ff_58%,#8ba6ff_100%)] shadow-[0_0_56px_rgba(96,141,255,0.4)]"
          animate={{ scale: active ? [1, 1.02, 1] : [1, 1.035, 1] }}
          transition={{ duration: active ? 1.6 : 3.4, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute left-[37%] top-[32%] h-3 w-3 rounded-full bg-white shadow-[0_0_16px_6px_rgba(255,255,255,0.95),0_0_38px_16px_rgba(125,157,255,0.55)]"
          animate={{ opacity: active ? [0.7, 1, 0.8, 1, 0.7] : [0.7, 1, 0.7] }}
          transition={{ duration: active ? 1.6 : 2.6, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
      {active ? (
        <>
          <motion.span
            className="absolute inset-[12%] rounded-full border border-[var(--primary)]/30"
            animate={{ scale: [1, 1.45], opacity: [0.55, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut" }}
          />
          <motion.span
            className="absolute inset-[12%] rounded-full border border-[var(--primary)]/20"
            animate={{ scale: [1, 1.45], opacity: [0.45, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeOut", delay: 1.1 }}
          />
        </>
      ) : null}
      <motion.div
        className="absolute inset-[-4%] rounded-full border border-[var(--primary)]/20"
        animate={{ rotate: 360 }}
        transition={{ duration: 26, repeat: Infinity, ease: "linear" }}
      >
        <span className="absolute left-1/2 top-0 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[var(--primary)]/50" />
        <span className="absolute bottom-[10%] right-[12%] h-1 w-1 rounded-full bg-[var(--primary)]/35" />
      </motion.div>
      <motion.div
        className="absolute inset-[-13%] rounded-full border border-[var(--primary)]/10"
        animate={{ rotate: -360 }}
        transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
      >
        <span className="absolute left-[14%] top-[24%] text-[10px] leading-none text-[var(--primary)]/45">+</span>
        <span className="absolute bottom-[16%] left-[38%] text-[8px] leading-none text-[var(--primary)]/35">+</span>
        <span className="absolute right-[10%] top-[46%] h-1 w-1 rounded-full bg-[var(--primary)]/30" />
      </motion.div>
    </div>
  );
}

function ProgressBar({ ratio }: { ratio: number }) {
  const width = `${Math.round(Math.min(1, Math.max(0.04, ratio)) * 100)}%`;

  return (
    <div className="relative h-[3px] w-full rounded-full bg-[var(--primary)]/12">
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-[#a9c0ff] via-[var(--primary)] to-[var(--primary)]"
        initial={{ width: "4%" }}
        animate={{ width }}
        transition={{ type: "spring", stiffness: 60, damping: 20 }}
      />
      <motion.div
        className="absolute top-1/2 z-10"
        initial={{ left: "4%" }}
        animate={{ left: width }}
        transition={{ type: "spring", stiffness: 60, damping: 20 }}
      >
        <motion.span
          className="block h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_0_4px_rgba(37,99,235,0.22),0_0_14px_5px_rgba(37,99,235,0.45)]"
          animate={{ scale: [1, 1.25, 1] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
        />
      </motion.div>
    </div>
  );
}

function StageBadge({ index, total, className }: { index: number; total: number; className?: string }) {
  return (
    <span
      className={`shrink-0 items-center rounded-full bg-[var(--primary)]/10 px-3.5 py-1.5 text-sm font-semibold text-[var(--primary)] ${className ?? ""}`}
    >
      Этап {Math.min(index + 1, total)}/{total}
    </span>
  );
}

function StepChip({ label, state, vertical }: { label: string; state: ChipState; vertical?: boolean }) {
  return (
    <div className={vertical ? "flex min-w-0 flex-col items-center gap-2 text-center" : "flex items-center gap-2.5"}>
      <div className="flex h-6 w-6 shrink-0 items-center justify-center">
        {state === "done" ? (
          <motion.span
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 20 }}
            className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--primary)] text-white shadow-[0_6px_16px_rgba(37,99,235,0.32)]"
          >
            <Check className="h-3.5 w-3.5" strokeWidth={3} />
          </motion.span>
        ) : state === "active" ? (
          <span className="relative flex h-6 w-6 items-center justify-center">
            <motion.span
              className="absolute inset-0 rounded-full border border-[var(--primary)]/45"
              animate={{ scale: [1, 1.55], opacity: [0.8, 0] }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }}
            />
            <span className="h-3.5 w-3.5 rounded-full bg-[var(--primary)] shadow-[0_0_12px_2px_rgba(37,99,235,0.45)]" />
          </span>
        ) : (
          <span className="h-[18px] w-[18px] rounded-full border-2 border-[var(--primary)]/25" />
        )}
      </div>
      <span
        className={
          vertical
            ? `block w-full px-0.5 text-center text-[clamp(9px,2.6vw,11px)] font-semibold leading-tight tracking-[-0.02em] ${
                state === "pending" ? "text-[var(--marketing-muted)]" : "text-[var(--marketing-foreground)]"
              }`
            : `text-sm font-semibold ${
                state === "pending" ? "font-medium text-[var(--marketing-muted)]" : "text-[var(--marketing-foreground)]"
              }`
        }
      >
        {label}
      </span>
    </div>
  );
}

export function AnalysisTimeline({
  currentStep,
  status,
  city,
  interestsCount,
}: {
  currentStep: AnalysisStep;
  status: "idle" | "running" | "success" | "error";
  city?: string;
  interestsCount: number;
}) {
  const safeIndex = Math.max(0, STEP_LIST.findIndex((step) => step.key === currentStep));
  const currentIndex = status === "success" ? STEP_LIST.length - 1 : safeIndex;
  const finished = status === "success";
  const ratio = finished ? 1 : (currentIndex + 0.5) / STEP_LIST.length;
  const subtitle = finished ? "Готово — открываем рекомендации" : SUBTITLES[currentStep];

  const chipStates = STEP_LIST.map(
    (step, index): ChipState =>
      index < currentIndex || finished ? "done" : status === "running" && index === currentIndex ? "active" : "pending",
  );

  const meta = `${city?.trim() ? city.trim() : "Ваш город"} · ${pluralDirections(interestsCount)} · реальные кандидаты НЦТ`;

  return (
    <div className="w-full">
      <div className="flex flex-col items-center md:grid md:grid-cols-[auto_minmax(0,1fr)] md:items-start md:gap-9">
        <div className="flex justify-center md:block">
          <AnalysisOrb active={status === "running"} />
        </div>

        <div className="mt-7 w-full md:mt-1.5">
          <div className="flex items-start justify-between gap-4 md:justify-start">
            <h1 className="text-center text-xl font-semibold tracking-[-0.03em] text-[var(--marketing-foreground)] sm:text-2xl md:text-left md:text-[1.75rem] md:leading-tight">
              Собираем рекомендации НЦТ
            </h1>
            <StageBadge index={currentIndex} total={STEP_LIST.length} className="hidden md:inline-flex" />
          </div>

          <div className="flex min-h-[3.5rem] items-start justify-center md:min-h-0 md:justify-start">
            <AnimatePresence initial={false} mode="wait">
              <motion.p
                key={subtitle}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.24, ease: "easeOut" }}
                className="mt-2.5 text-center text-[15px] font-medium leading-6 text-[var(--primary)] md:mt-3 md:text-left md:text-base"
              >
                {subtitle}
              </motion.p>
            </AnimatePresence>
          </div>

          <p className="mt-1.5 text-center text-sm text-[var(--marketing-muted)] md:mt-2 md:text-left">
            {meta}
          </p>

          <div className="mt-6 md:mt-7">
            <ProgressBar ratio={ratio} />
          </div>

          <p className="mt-4 text-center text-sm font-semibold text-[var(--primary)] md:hidden">
            Этап {Math.min(currentIndex + 1, STEP_LIST.length)} из {STEP_LIST.length}
          </p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-4 gap-1.5 sm:gap-3 md:hidden">
        {STEP_LIST.map((step, index) => (
          <StepChip key={step.key} label={STEP_CHIPS[step.key]} state={chipStates[index]} vertical />
        ))}
      </div>

      <div className="mt-9 hidden items-center justify-between gap-6 md:flex">
        {STEP_LIST.map((step, index) => (
          <StepChip key={step.key} label={STEP_CHIPS[step.key]} state={chipStates[index]} />
        ))}
      </div>
    </div>
  );
}
