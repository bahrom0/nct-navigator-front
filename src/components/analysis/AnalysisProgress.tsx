"use client";

import { useEffect, useState } from "react";
import type { AnalysisStep } from "@/types/analysis";
import { STEPS as STEP_LIST } from "@/types/analysis";
import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  Check,
  FileText,
  SearchCode,
  SendHorizonal,
  Sparkles,
} from "lucide-react";

const ICONS: Record<AnalysisStep, typeof Sparkles> = {
  submitting_request: SendHorizonal,
  analyzing_interests: Brain,
  searching_nct_codes: SearchCode,
  forming_recommendations: FileText,
};

const SUBTITLES: Record<AnalysisStep, string> = {
  submitting_request: "Запрос успешно отправлен на сервер",
  analyzing_interests: "Интересы проанализированы",
  searching_nct_codes: "Ищем релевантные коды в базе НЦТ",
  forming_recommendations: "Формируем список и объяснения",
};

function StageIcon({
  step,
  active,
  completed,
}: {
  step: AnalysisStep;
  active: boolean;
  completed: boolean;
}) {
  const Icon = ICONS[step];

  return (
    <motion.div
      layout
      className={`relative flex shrink-0 items-center justify-center rounded-full transition-colors duration-300 ${
        active
          ? "h-16 w-16 bg-[var(--primary)] text-white shadow-[0_0_0_10px_rgb(37_99_235_/_0.12),0_14px_34px_rgb(37_99_235_/_0.28)]"
          : completed
            ? "h-12 w-12 bg-[var(--primary)] text-white shadow-[0_8px_24px_rgb(37_99_235_/_0.2)]"
            : "h-12 w-12 border border-[var(--marketing-border-strong)] bg-[var(--marketing-surface)] text-[var(--marketing-muted)]"
      }`}
    >
      {active ? (
        <>
          <motion.span
            aria-hidden="true"
            className="absolute inset-[-10px] rounded-full border border-[var(--primary)]/35"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          />
          <motion.span
            aria-hidden="true"
            className="absolute inset-[-5px] rounded-full border border-dashed border-[var(--primary)]/40"
            animate={{ rotate: -360 }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          />
          <Icon className="relative h-7 w-7" />
        </>
      ) : completed ? (
        <Check className="h-5 w-5" strokeWidth={2.5} />
      ) : (
        <Icon className="h-5 w-5" />
      )}
    </motion.div>
  );
}

function StageLabel({
  step,
  index,
  active,
  completed,
  compact = false,
}: {
  step: (typeof STEP_LIST)[number];
  index: number;
  active: boolean;
  completed: boolean;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "mt-0" : active ? "mt-5" : "mt-4"}>
      <p
        className={`text-sm font-semibold tracking-[-0.01em] ${
          active
            ? "text-[var(--marketing-foreground)]"
            : completed
              ? "text-[var(--primary)]"
              : "text-[var(--marketing-muted)]"
        }`}
      >
        {index + 1}. {step.label}
      </p>
      <AnimatePresence initial={false} mode="wait">
        {active ? (
          <motion.p
            key={`${step.key}-active`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="mt-2 text-xs leading-5 text-[var(--marketing-muted)] sm:text-sm"
          >
            {SUBTITLES[step.key]}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function ActiveStageFrame({
  active,
  children,
  className = "",
  radius = "rounded-[2rem]",
}: {
  active: boolean;
  children: React.ReactNode;
  className?: string;
  radius?: string;
}) {
  return (
    <div className={`relative overflow-visible ${radius} ${className}`}>
      {children}
      <motion.div
        aria-hidden="true"
        className={`pointer-events-none absolute inset-0 z-20 border-2 border-[var(--primary)] ${radius}`}
        initial={{ opacity: 0, scale: 0.985 }}
        animate={{
          opacity: active ? 1 : 0,
          scale: active ? 1 : 0.985,
        }}
        transition={{ duration: 0.72, ease: [0.22, 1, 0.36, 1] }}
      />
    </div>
  );
}

function DesktopTimeline({ currentIndex, status }: { currentIndex: number; status: string }) {
  return (
    <div className="relative hidden min-h-[18rem] items-center md:flex">
      <div className="absolute left-[12%] right-[12%] top-[4.3rem] h-px bg-[var(--marketing-border-strong)]" />
      <motion.div
        className="absolute left-[12%] top-[4.3rem] h-px origin-left bg-[var(--primary)]"
        animate={{ width: `${Math.max(0, Math.min(currentIndex, STEP_LIST.length - 1)) * (76 / (STEP_LIST.length - 1))}%` }}
        transition={{ type: "spring", stiffness: 80, damping: 18 }}
      />

      <div className="relative grid w-full grid-cols-4 gap-3">
        {STEP_LIST.map((step, index) => {
          const active = status === "running" && index === currentIndex;
          const completed = index < currentIndex || status === "success";

          return (
            <motion.div
              key={step.key}
              layout
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.06, duration: 0.3, ease: "easeOut" }}
              className={`relative flex min-w-0 flex-col items-center text-center ${active ? "z-10" : "z-0"}`}
            >
              <ActiveStageFrame
                active={active}
                className={active ? "w-full max-w-[15rem]" : "w-full"}
                radius="rounded-[2rem]"
              >
              <motion.div
                layout
                className={active ? "flex min-h-[15rem] w-full max-w-[15rem] flex-col items-center justify-start rounded-[2rem] bg-[var(--marketing-surface)] px-4 py-5 shadow-[0_20px_50px_rgb(37_99_235_/_0.14)]" : "flex min-h-[15rem] w-full flex-col items-center justify-start px-2 py-5"}
              >
                <StageIcon step={step.key} active={active} completed={completed} />
                <StageLabel step={step} index={index} active={active} completed={completed} />
              </motion.div>
              </ActiveStageFrame>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

function MobileTimeline({ currentIndex, status }: { currentIndex: number; status: string }) {
  return (
    <div className="relative pl-3 md:hidden">
      <div className="absolute bottom-10 left-[2.75rem] top-6 z-0 w-px bg-[var(--marketing-border-strong)]" />
      <motion.div
        className="absolute left-[2.75rem] top-6 z-0 w-px origin-top bg-[var(--primary)]"
        animate={{ height: `${Math.max(0, Math.min(currentIndex, STEP_LIST.length - 1)) * 33.333}%` }}
        transition={{ type: "spring", stiffness: 80, damping: 18 }}
      />

      <div className="relative space-y-3">
        {STEP_LIST.map((step, index) => {
          const active = status === "running" && index === currentIndex;
          const completed = index < currentIndex || status === "success";

          return (
            <motion.div
              key={step.key}
              layout
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.06, duration: 0.3, ease: "easeOut" }}
              className="relative z-10 grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-4 py-3 pr-2 pl-0"
            >
              <ActiveStageFrame
                active={active}
                className={`col-span-2 grid grid-cols-[4rem_minmax(0,1fr)] items-center gap-4 overflow-visible rounded-[1.35rem] py-3 ${active ? "-ml-3 bg-[var(--marketing-surface)] py-4 pr-4 pl-3 shadow-[0_16px_36px_rgb(37_99_235_/_0.12)]" : ""}`}
                radius="rounded-[1.35rem]"
              >
                <div className="flex items-center justify-center">
                  <StageIcon step={step.key} active={active} completed={completed} />
                </div>
                <div className="min-w-0">
                  <StageLabel step={step} index={index} active={active} completed={completed} compact />
                </div>
              </ActiveStageFrame>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

export function AnalysisTimeline({
  currentStep,
  status,
}: {
  currentStep: AnalysisStep;
  status: "idle" | "running" | "success" | "error";
}) {
  const targetIndex = Math.max(0, STEP_LIST.findIndex((step) => step.key === currentStep));
  const [displayedIndex, setDisplayedIndex] = useState(targetIndex);

  useEffect(() => {
    if (targetIndex <= displayedIndex) return;

    const timer = window.setTimeout(() => {
      setDisplayedIndex((index) => Math.min(index + 1, targetIndex));
    }, 820);

    return () => window.clearTimeout(timer);
  }, [displayedIndex, targetIndex]);

  return (
    <div className="w-full">
      <DesktopTimeline currentIndex={displayedIndex} status={status} />
      <MobileTimeline currentIndex={displayedIndex} status={status} />
    </div>
  );
}
