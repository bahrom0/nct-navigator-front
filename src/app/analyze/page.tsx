"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Stethoscope } from "lucide-react";
import { AnalysisTimeline } from "@/components/analysis/AnalysisProgress";
import { CATEGORIES } from "@/constants/categories";
import { logActivityEvent } from "@/lib/activity-logger";
import { useAnalysisStore } from "@/stores/analysis-store";
import {
  hydrateCategoryStore,
  persistCategories,
  useCategoryStore,
} from "@/stores/category-store";
import {
  hydrateOnboardingStore,
  useOnboardingStore,
} from "@/stores/onboarding-store";
import type { AnalysisStep } from "@/types/analysis";
import type { Category } from "@/types/categories";
import type { RecommendationResultSet } from "@/types/recommendations";

const STEP_ORDER: AnalysisStep[] = [
  "submitting_request",
  "analyzing_interests",
  "searching_nct_codes",
  "forming_recommendations",
];

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0 ? value : undefined;
}

function stringList(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  const values = value.filter((item): item is string => typeof item === "string" && item.trim().length > 0);
  return values.length > 0 ? values : undefined;
}

function ProgressSummary({ progress, stageNumber }: { progress: number; stageNumber: number }) {
  const percentage = Math.round(progress * 100);
  const circumference = 2 * Math.PI * 17;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="flex w-full items-center justify-between gap-3 rounded-full border border-[var(--marketing-border)] bg-[var(--marketing-surface)] px-3 py-2 shadow-[0_12px_28px_rgba(31,27,22,0.06)] sm:w-auto sm:min-w-[18rem] sm:justify-start dark:shadow-[0_12px_28px_rgba(0,0,0,0.2)]">
      <span className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--marketing-soft)]">
        <svg aria-hidden="true" className="absolute inset-0 h-10 w-10 -rotate-90" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="17" fill="none" stroke="var(--border)" strokeWidth="2.5" opacity="0.45" />
          <motion.circle
            cx="20"
            cy="20"
            r="17"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            animate={{ strokeDashoffset: dashOffset }}
            transition={{ type: "spring", stiffness: 80, damping: 18 }}
          />
        </svg>
      </span>
      <span className="text-sm font-semibold text-[var(--marketing-foreground)]"><span className="text-[var(--primary)]">{percentage}%</span> по реальным этапам</span>
      <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1.5 text-sm font-semibold text-[var(--primary)]">{stageNumber} / {STEP_ORDER.length}</span>
    </div>
  );
}

export default function AnalyzePage() {
  const router = useRouter();
  const status = useAnalysisStore((state) => state.status);
  const currentStep = useAnalysisStore((state) => state.currentStep);
  const startAnalysis = useAnalysisStore((state) => state.startAnalysis);
  const setStep = useAnalysisStore((state) => state.setStep);
  const setError = useAnalysisStore((state) => state.setError);
  const setStatus = useAnalysisStore((state) => state.setStatus);
  const cacheResults = useAnalysisStore((state) => state.cacheResults);
  const reset = useAnalysisStore((state) => state.reset);
  const [progress, setProgress] = useState(0);
  const onboardingLoaded = useOnboardingStore((state) => state._loaded);
  const onboardingData = useOnboardingStore((state) => state.data);
  const selectedIds = useCategoryStore((state) => state.selected);
  const analysisFiredRef = useRef(false);

  const categories: Category[] = useMemo(
    () =>
      selectedIds
        .map((id) => CATEGORIES.find((category) => category.id === id))
        .filter(Boolean) as Category[],
    [selectedIds],
  );
  const currentStepIndex = Math.max(0, STEP_ORDER.indexOf(currentStep));

  const goToResults = useCallback(
    () => router.replace("/recommendations"),
    [router],
  );

  useEffect(() => {
    hydrateOnboardingStore();
  }, []);

  useEffect(() => {
    return () => {
      reset();
      analysisFiredRef.current = false;
    };
  }, [reset]);

  useEffect(() => {
    if (analysisFiredRef.current || !onboardingLoaded) return;

    const restored = hydrateCategoryStore();
    if (categories.length === 0 && !restored) {
      router.replace("/categories");
      return;
    }

    if (categories.length === 0) return;

    analysisFiredRef.current = true;
    persistCategories();
    void runAnalysis();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categories.length, onboardingLoaded]);

  const updateStep = useCallback(
    (step: AnalysisStep) => {
      const nextIndex = STEP_ORDER.indexOf(step);
      if (nextIndex === -1) return;
      setStep(step, nextIndex);
      setProgress(nextIndex / (STEP_ORDER.length - 1));
    },
    [setStep],
  );

  async function runAnalysis() {
    try {
      startAnalysis();
      updateStep("submitting_request");

      const payload = {
        categories: categories.map((category) => ({
          id: category.id,
          name: category.name,
          description: category.description ?? "",
        })),
        topK: 8,
        minConfidence: 0.3,
        onboarding: {
          userCity: optionalString(onboardingData.userCity),
          studyCity: optionalString(onboardingData.studyCity),
          userType: optionalString(onboardingData.userType),
          educationLevel: onboardingData.educationLevel ?? "",
          interests: stringList(onboardingData.interests),
        },
      };

      logActivityEvent(
        "start_analysis",
        `Анализ направлений: ${categories.map((category) => category.name).join(", ")}`,
      );

      const response = await fetch("/api/recommendations/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok || !response.body) {
        throw new Error("Не удалось запустить поток анализа рекомендаций");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.trim()) continue;
          const event = JSON.parse(line) as
            | { type: "stage"; step: AnalysisStep }
            | { type: "result"; data: RecommendationResultSet }
            | { type: "error"; error: string };

          if (event.type === "stage") {
            updateStep(event.step);
            continue;
          }

          if (event.type === "error") {
            throw new Error(event.error || "Ошибка анализа");
          }

          cacheResults({
            ...event.data,
            categories: payload.categories,
          });
          setStatus("success");
          setProgress(1);
          goToResults();
          return;
        }
      }

      if (buffer.trim()) {
        const event = JSON.parse(buffer) as
          | { type: "result"; data: RecommendationResultSet }
          | { type: "error"; error: string };

        if (event.type === "error") {
          throw new Error(event.error || "Ошибка анализа");
        }

        cacheResults({
          ...event.data,
          categories: payload.categories,
        });
        setStatus("success");
        setProgress(1);
        goToResults();
        return;
      }

      throw new Error("Поток анализа завершился без результата");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Ошибка сети";
      setError(message);
    }
  }

  if (!onboardingLoaded) {
    return (
      <main className="flex flex-1 items-center justify-center bg-[var(--marketing-bg)] px-6 py-24 text-[var(--marketing-foreground)]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </main>
    );
  }

  if (status === "error") {
    return (
      <main className="flex flex-1 flex-col items-center justify-center bg-[var(--marketing-bg)] px-6 py-24 text-[var(--marketing-foreground)]">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 20 }}
          className="max-w-md rounded-[2rem] border border-[var(--marketing-border)] bg-[var(--marketing-surface)] px-8 py-10 text-center shadow-[0_24px_80px_rgba(31,27,22,0.08)] backdrop-blur-xl dark:shadow-[0_24px_80px_rgba(0,0,0,0.3)]"
        >
          <p className="text-sm font-medium text-error">
            Ошибка при выполнении анализа
          </p>
          <p className="mt-2 text-sm text-text-secondary">
            {useAnalysisStore.getState().error}
          </p>
          <button
            onClick={() => void runAnalysis()}
            className="mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-[14px] bg-primary px-6 text-base font-medium text-white hover:bg-primary-hover"
          >
            Попробовать снова
          </button>
          <button
            onClick={() => router.push("/categories")}
            className="mt-3 inline-flex h-11 items-center justify-center rounded-[14px] px-6 text-base font-medium text-text-secondary hover:text-foreground"
          >
            Вернуться назад
          </button>
        </motion.div>
      </main>
    );
  }

  return (
    <main className="relative flex min-h-[calc(100dvh-6rem)] flex-1 items-center justify-center overflow-hidden bg-[var(--marketing-bg)] px-4 py-10 text-[var(--marketing-foreground)] sm:px-6 sm:py-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top,rgba(236,227,215,0.72),transparent_58%)] dark:bg-[radial-gradient(circle_at_top,rgba(88,99,125,0.18),transparent_58%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_1px_1px,rgba(91,78,64,0.08)_1px,transparent_0)] [background-size:22px_22px] dark:[background-image:radial-gradient(circle_at_1px_1px,rgba(221,216,209,0.08)_1px,transparent_0)]" />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 24 }}
        className="relative w-full max-w-6xl rounded-[2.5rem] border border-[var(--marketing-border)] bg-[var(--marketing-surface)] p-5 shadow-[0_30px_90px_rgba(31,27,22,0.08)] backdrop-blur-xl sm:p-8 lg:p-10 dark:shadow-[0_30px_90px_rgba(0,0,0,0.3)]"
      >
        <div className="flex flex-col gap-6">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-soft)] text-[var(--marketing-accent)]">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--marketing-muted)]">
                Живой pipeline рекомендаций
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--marketing-foreground)] sm:text-3xl">
                Собираем рекомендации НЦТ по локальным фактам
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--marketing-muted)] sm:text-base">
                Сначала строим profession shortlist, потом ищем коды НЦТ с жёсткими фильтрами по городу и уровню.
                AI подключается только к валидному локальному shortlist и не может добавить свои коды.
              </p>
            </div>
          </div>

          <div className="rounded-[2rem] border border-[var(--marketing-border)] bg-[var(--marketing-surface-muted)] p-5 sm:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--marketing-muted)]">
                  Учитываем в подборе
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {[
                    onboardingData.studyCity ? `Город: ${onboardingData.studyCity}` : "Город не выбран",
                    onboardingData.educationLevel ? `Уровень: ${onboardingData.educationLevel}` : "Уровень не выбран",
                    `${categories.length} направл. интересов`,
                    "local shortlist",
                    "allowlist validation",
                  ].map((item) => (
                    <span
                      key={item}
                      className="rounded-full border border-[var(--marketing-border)] bg-[var(--marketing-surface)] px-3 py-1.5 text-xs font-semibold text-[var(--marketing-foreground)]"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
              <ProgressSummary progress={progress} stageNumber={Math.min(currentStepIndex + 1, STEP_ORDER.length)} />
            </div>

            <div className="mt-6 sm:mt-8">
              <AnalysisTimeline currentStep={currentStep} status={status} />
            </div>
          </div>
        </div>
      </motion.div>
    </main>
  );
}
