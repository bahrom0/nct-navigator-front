"use client";

import { useCallback, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
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

      const finishWithResult = (resultSet: RecommendationResultSet) => {
        if (!Array.isArray(resultSet.ranked)) {
          throw new Error("Ответ анализа не содержит список рекомендаций");
        }

        cacheResults({
          ...resultSet,
          categories: payload.categories,
        });
        setStatus("success");
        goToResults();
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

          finishWithResult(event.data);
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

        finishWithResult(event.data);
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
    <main className="relative -mt-24 flex min-h-[100dvh] items-center justify-center overflow-hidden bg-[var(--marketing-bg)] px-4 pt-24 pb-10 text-[var(--marketing-foreground)] sm:-mt-28 sm:px-6 sm:pt-28 sm:pb-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[34rem] bg-[radial-gradient(circle_at_top,rgba(236,227,215,0.72),transparent_58%)] dark:bg-[radial-gradient(circle_at_top,rgba(88,99,125,0.18),transparent_58%)]" />
      <div className="pointer-events-none absolute inset-0 opacity-70 [background-image:radial-gradient(circle_at_1px_1px,rgba(91,78,64,0.08)_1px,transparent_0)] [background-size:22px_22px] dark:[background-image:radial-gradient(circle_at_1px_1px,rgba(221,216,209,0.08)_1px,transparent_0)]" />
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: "spring", stiffness: 180, damping: 24 }}
        className="relative w-full max-w-6xl rounded-[2.5rem] border border-[var(--marketing-border)] bg-[var(--marketing-surface)] p-5 shadow-[0_30px_90px_rgba(31,27,22,0.08)] backdrop-blur-xl sm:p-8 lg:p-10 dark:shadow-[0_30px_90px_rgba(0,0,0,0.3)]"
      >
        <AnalysisTimeline
          currentStep={currentStep}
          status={status}
          city={onboardingData.studyCity}
          interestsCount={categories.length}
        />
      </motion.div>
    </main>
  );
}
