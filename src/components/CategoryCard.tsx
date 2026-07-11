"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check } from "lucide-react";
import type { Category } from "@/types/categories";

interface CategoryCardProps {
  category: Category;
  selected: boolean;
  onClick: () => void;
}

export function CategoryCard({ category, selected, onClick }: CategoryCardProps) {
  const Icon = category.icon;

  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      aria-pressed={selected}
      className={`group relative flex min-h-[11.5rem] flex-col items-center justify-center gap-3 overflow-hidden rounded-[1.75rem] border p-5 text-center shadow-[0_18px_50px_rgba(31,27,22,0.05)] backdrop-blur-xl transition-[border-color,background-color,box-shadow] duration-200 dark:shadow-[0_18px_50px_rgba(0,0,0,0.22)] ${
        selected
          ? "border-[var(--marketing-border-strong)] bg-[var(--marketing-surface-contrast)] shadow-[0_20px_55px_rgba(31,27,22,0.1)] ring-2 ring-[var(--marketing-accent)]/15 dark:shadow-[0_20px_55px_rgba(0,0,0,0.35)]"
          : "border-[var(--marketing-border)] bg-[var(--marketing-surface)] hover:border-[var(--marketing-border-strong)] hover:bg-[var(--marketing-surface-strong)]"
      }`}
    >
      <span className="pointer-events-none absolute inset-x-8 top-0 h-20 rounded-full bg-white/45 blur-2xl transition-opacity duration-200 group-hover:opacity-80 dark:bg-white/5" />
      <AnimatePresence>
        {selected && (
          <motion.span
            key="check"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-[var(--marketing-accent)] text-white shadow-[0_8px_20px_rgba(31,27,22,0.18)] dark:bg-[var(--marketing-surface-contrast)] dark:text-[var(--marketing-foreground)]"
          >
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
          </motion.span>
        )}
      </AnimatePresence>
      {Icon && (
        <Icon
          className={`relative h-7 w-7 shrink-0 transition-colors duration-200 ${selected ? "text-[var(--marketing-accent)]" : "text-[var(--marketing-muted)] group-hover:text-[var(--marketing-foreground)]"}`}
        />
      )}
      <span className="relative text-base font-semibold tracking-[-0.02em] text-[var(--marketing-foreground)]">{category.name}</span>
      <span className="relative max-w-[15rem] text-sm leading-6 text-[var(--marketing-muted)]">{category.description}</span>
    </motion.button>
  );
}
