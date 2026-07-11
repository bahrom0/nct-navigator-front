"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BentoGrid } from "@/components/BentoGrid";
import { BentoCard } from "@/components/BentoCard";
import { CategoryCard } from "@/components/CategoryCard";
import { Button } from "@/components/Button";
import { CATEGORIES } from "@/constants/categories";
import { persistCategories, useCategoryStore } from "@/stores/category-store";
import { hydrateOnboardingStore, useOnboardingStore } from "@/stores/onboarding-store";
import { Sparkles, GitCompare, BookOpen, Plus, X } from "lucide-react";
import type { Category } from "@/types/categories";
import { logActivityEvent } from "@/lib/activity-logger";

export default function CategoriesPage() {
  const router = useRouter();
  const selected = useCategoryStore((s) => s.selected);
  const toggle = useCategoryStore((s) => s.toggle);
  const addCustom = useCategoryStore((s) => s.addCustom);
  const onboardingLoaded = useOnboardingStore((s) => s._loaded);
  const [showModal, setShowModal] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customDesc, setCustomDesc] = useState("");
  const [customCategories, setCustomCategories] = useState<Category[]>([]);

  useEffect(() => {
    hydrateOnboardingStore();
  }, []);

  const allCategories = [...CATEGORIES, ...customCategories];

  const handleAddCustom = () => {
    const trimmed = customName.trim();
    if (!trimmed) return;
    const id = `custom-${Date.now()}`;
    const description = customDesc.trim() || "Пользовательское направление";
    const newCat: Category = {
      id,
      name: trimmed,
      description,
      icon: Plus,
      custom: true,
    };
    setCustomCategories((prev) => [...prev, newCat]);
    addCustom({ id, name: trimmed, description });
    logActivityEvent("choose_category", `Добавлено направление: ${trimmed}`);
    setCustomName("");
    setCustomDesc("");
    setShowModal(false);
  };

  const handleContinue = () => {
    if (selected.length > 0) {
      const interestNames = selected
        .map((id) => allCategories.find((c) => c.id === id))
        .filter(Boolean)
        .map((c) => c!.name)
      persistCategories()
      useOnboardingStore.getState().setInterests(interestNames)
      logActivityEvent("open_app", `Запуск анализа для ${selected.length} направлений`);
      router.push("/analyze");
    }
  };

  if (!onboardingLoaded) {
    return (
      <main className="flex min-h-[60vh] flex-1 items-center justify-center px-6 py-24">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </main>
    );
  }

  return (
    <main className="relative isolate min-h-[calc(100dvh-3.5rem)] overflow-hidden bg-[var(--marketing-bg)] px-4 py-10 text-[var(--marketing-foreground)] sm:px-6 sm:py-14 lg:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem] bg-[radial-gradient(circle_at_top,rgba(236,227,215,0.72),transparent_58%)] dark:bg-[radial-gradient(circle_at_top,rgba(88,99,125,0.18),transparent_58%)]" />
      <div className="pointer-events-none absolute inset-0 -z-10 opacity-70 [background-image:radial-gradient(circle_at_1px_1px,rgba(91,78,64,0.08)_1px,transparent_0)] [background-size:22px_22px] dark:[background-image:radial-gradient(circle_at_1px_1px,rgba(221,216,209,0.08)_1px,transparent_0)]" />

      <div className="mx-auto max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="mx-auto mb-10 max-w-3xl text-center sm:mb-12"
        >
          <span className="navigator-kicker">Core flow · interests</span>
          <h1 className="mt-5 text-4xl font-semibold tracking-[-0.06em] text-[var(--marketing-foreground)] sm:text-5xl lg:text-6xl">
            Выберите направления
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-[var(--marketing-muted)] sm:text-lg">
            Можно выбрать несколько. Это поможет точнее подобрать специальности НЦТ.
          </p>
        </motion.div>

        <BentoGrid cols={4} className="gap-4 sm:gap-5 lg:gap-6">
          {allCategories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              selected={selected.includes(category.id)}
              onClick={() => {
                const isSelecting = !selected.includes(category.id)
                toggle(category.id)
                logActivityEvent("choose_category", `${isSelecting ? "Выбрано" : "Убрано"}: ${category.name}`)
              }}
            />
          ))}
          <motion.button
            type="button"
            onClick={() => setShowModal(true)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="group flex min-h-[11.5rem] flex-col items-center justify-center gap-3 rounded-[1.75rem] border border-dashed border-[var(--marketing-border-strong)] bg-[var(--marketing-surface-muted)] p-6 text-center text-[var(--marketing-muted)] shadow-[0_18px_50px_rgba(31,27,22,0.04)] backdrop-blur-xl transition duration-200 hover:-translate-y-1 hover:border-[var(--marketing-accent)] hover:bg-[var(--marketing-surface)] hover:text-[var(--marketing-foreground)]"
          >
            <Plus className="h-8 w-8 transition-transform duration-200 group-hover:rotate-90" />
            <span className="font-semibold">Добавить направление</span>
          </motion.button>
        </BentoGrid>

        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:mt-10 sm:flex-row">
          <Button size="lg" disabled={selected.length === 0} onClick={handleContinue} className="min-w-52 rounded-2xl bg-[var(--marketing-foreground)] px-7 text-white shadow-[0_18px_40px_rgba(31,27,22,0.16)] hover:bg-[var(--marketing-accent)] disabled:cursor-not-allowed disabled:opacity-45 dark:bg-[var(--marketing-surface-contrast)] dark:text-[var(--marketing-foreground)] dark:hover:bg-[var(--marketing-surface-strong)]">
            Продолжить {selected.length > 0 && `(${selected.length})`}
          </Button>
          <span className="text-sm text-[var(--marketing-muted)]">{selected.length === 0 ? "Выберите хотя бы одно направление" : "Можно выбрать несколько"}</span>
        </div>

        <div className="mt-16 sm:mt-20">
          <BentoGrid cols={3} className="gap-4 sm:gap-5">
            <BentoCard span={1} className="border-[var(--marketing-border)] bg-[var(--marketing-surface)] shadow-[0_18px_50px_rgba(31,27,22,0.05)] dark:shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
              <div className="flex flex-col gap-3">
                <Sparkles className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Как это работает</h3>
                <p className="text-sm text-text-secondary">
                  Система анализирует ваш выбор и сопоставляет его с базой кодов НЦТ.
                </p>
              </div>
            </BentoCard>
            <BentoCard span={1} className="border-[var(--marketing-border)] bg-[var(--marketing-surface)] shadow-[0_18px_50px_rgba(31,27,22,0.05)] dark:shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
              <div className="flex flex-col gap-3">
                <GitCompare className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Преимущества</h3>
                <p className="text-sm text-text-secondary">
                  Ранжирование по релевантности, объяснения выбора и университеты.
                </p>
              </div>
            </BentoCard>
            <BentoCard span={1} className="border-[var(--marketing-border)] bg-[var(--marketing-surface)] shadow-[0_18px_50px_rgba(31,27,22,0.05)] dark:shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
              <div className="flex flex-col gap-3">
                <BookOpen className="h-6 w-6 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Без регистрации</h3>
                <p className="text-sm text-text-secondary">
                  Получите полный результат сразу, регистрация нужна только для сохранения.
                </p>
              </div>
            </BentoCard>
          </BentoGrid>
        </div>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
                className="w-full max-w-md rounded-[2rem] border border-[var(--marketing-border)] bg-[var(--marketing-surface-strong)] p-6 text-[var(--marketing-foreground)] shadow-[0_30px_90px_rgba(30,24,19,0.18)] backdrop-blur-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-foreground">Новое направление</h2>
                <button
                  onClick={() => setShowModal(false)}
                  type="button"
                  className="rounded-full p-2 text-[var(--marketing-muted)] transition hover:bg-[var(--marketing-soft)] hover:text-[var(--marketing-foreground)]"
                >
                  <X className="h-5 w-5 text-text-secondary" />
                </button>
              </div>

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-foreground">Название</label>
                  <input
                    autoFocus
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    placeholder="Например, Робототехника"
                    className="h-11 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-surface-muted)] px-4 text-base outline-none transition focus:border-[var(--marketing-border-strong)] focus:ring-2 focus:ring-[var(--marketing-accent)]/15"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-text-secondary">Описание (необязательно)</label>
                  <input
                    value={customDesc}
                    onChange={(e) => setCustomDesc(e.target.value)}
                    placeholder="Кратко о направлении"
                    className="h-11 rounded-2xl border border-[var(--marketing-border)] bg-[var(--marketing-surface-muted)] px-4 text-base outline-none transition focus:border-[var(--marketing-border-strong)] focus:ring-2 focus:ring-[var(--marketing-accent)]/15"
                  />
                </div>
                <Button
                  onClick={handleAddCustom}
                  disabled={!customName.trim()}
                  className="mt-2"
                >
                  Добавить
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
