"use client"

import { useState, type ReactNode } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { Flame, Map, Menu, MessageCircle, Target, TrendingUp, X } from "lucide-react"
import { useCoachStore } from "@/stores/coach-store"
import { useProfileStore } from "@/stores/profile-store"
import type { CoachActiveTab } from "@/types/coach"

interface TabConfig {
  id: CoachActiveTab
  label: string
  description: string
  icon: typeof Map
}

const TABS: TabConfig[] = [
  { id: "roadmap", label: "Roadmap", description: "Маршрут подготовки", icon: Map },
  { id: "today", label: "Сегодня", description: "План на день", icon: Target },
  { id: "chat", label: "Чат", description: "Помощь Coach", icon: MessageCircle },
  { id: "progress", label: "Прогресс", description: "Ваши результаты", icon: TrendingUp },
]

interface CoachShellProps {
  children: ReactNode
}

export function CoachShell({ children }: CoachShellProps) {
  const goal = useCoachStore((s) => s.goal)
  const profileGoal = useProfileStore((s) => s.activeGoal)
  const streak = useCoachStore((s) => s.progress.currentStreak)
  const activeTab = useCoachStore((s) => s.activeTab)
  const setActiveTab = useCoachStore((s) => s.setActiveTab)
  const [mobileOpen, setMobileOpen] = useState(false)
  const resolvedGoal = goal ?? profileGoal

  const changeTab = (tab: CoachActiveTab) => {
    setActiveTab(tab)
    setMobileOpen(false)
  }

  return (
    <div
      className={`dashboard-shell coach-shell ${
        activeTab === "chat"
          ? "flex h-[calc(100dvh-6rem)] max-h-[calc(100dvh-6rem)] overflow-hidden sm:h-[calc(100dvh-7rem)] sm:max-h-[calc(100dvh-7rem)]"
          : "min-h-[calc(100dvh-3.5rem)]"
      }`}
    >
      <button
        type="button"
        onClick={() => setMobileOpen(true)}
        aria-label="Открыть разделы Coach"
        className="fixed left-4 top-[5.5rem] z-40 inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_18px_40px_rgba(42,34,25,0.24)] transition-transform duration-200 hover:scale-[1.03] focus-visible:outline-none lg:hidden"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <AnimatePresence>
        {mobileOpen ? (
          <motion.div
            aria-label="Закрыть меню Coach"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="fixed inset-0 z-30 bg-black/45 lg:hidden"
          />
        ) : null}
      </AnimatePresence>

      <aside
        aria-label="Разделы Coach"
        className={`dashboard-sidebar fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-3rem)] w-[min(18rem,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-1/2 flex-col transition-[transform,opacity] duration-300 ease-out lg:left-6 lg:top-1/2 lg:max-h-[calc(100dvh-3rem)] lg:translate-x-0 lg:-translate-y-1/2 ${mobileOpen ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0 lg:pointer-events-auto lg:scale-100 lg:opacity-100"}`}
      >
        <div className="flex items-start justify-between border-b border-border px-5 py-5">
          <div className="min-w-0">
            {/* <p className="dashboard-eyebrow">Личный Coach</p> */}
            <p className="mt-3 truncate text-sm font-semibold text-foreground">
              {resolvedGoal?.nctTitle ?? "Цель подготовки"}
            </p>
            <p className="mt-1 truncate text-xs text-text-muted">
              {resolvedGoal?.nctCode ?? "Выберите направление"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Закрыть меню"
            className="-mr-2 -mt-1 rounded-xl p-2 text-text-secondary hover:bg-foreground/5 lg:hidden"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto p-3" role="tablist">
          {TABS.map((tab) => (
            <CoachNavButton key={tab.id} tab={tab} active={activeTab === tab.id} onSelect={changeTab} />
          ))}
        </nav>

        <div className="m-3 rounded-2xl border border-border bg-background p-4">
          <div className="flex items-center gap-2 text-warning">
            <Flame className="h-4 w-4" aria-hidden="true" />
            <span className="text-sm font-semibold tabular-nums">{streak} {pluralDays(streak)}</span>
          </div>
          <p className="mt-2 text-xs leading-5 text-text-muted">Сохраняйте ритм: один завершённый день укрепляет вашу серию.</p>
        </div>
      </aside>

      <main
        className={`coach-main min-w-0 flex-1 ${
          activeTab === "chat"
            ? "flex h-full min-h-0 flex-col overflow-hidden px-0 py-0 lg:px-0 lg:py-7 lg:pl-[22rem] lg:pr-10"
            : "px-4 py-5 sm:px-6 sm:py-7 lg:pl-[22rem] lg:pr-10"
        }`}
      >
        <div className={`mx-auto w-full ${activeTab === "chat" ? "flex h-full min-h-0 flex-1 flex-col overflow-hidden lg:max-w-6xl" : "max-w-6xl"}`}>
          {activeTab !== "chat" ? <CoachHeading goalTitle={resolvedGoal?.nctTitle} activeTab={activeTab} /> : null}
          {activeTab === "chat" ? (
            children
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              {children}
            </motion.div>
          )}
        </div>
      </main>
    </div>
  )
}

function CoachNavButton({ tab, active, onSelect }: { tab: TabConfig; active: boolean; onSelect: (tab: CoachActiveTab) => void }) {
  const Icon = tab.icon
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={() => onSelect(tab.id)}
      className={`flex min-h-14 w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-left transition-all duration-200 ${active ? "bg-primary text-white shadow-[0_12px_24px_rgba(42,34,25,0.16)]" : "text-text-secondary hover:translate-x-0.5 hover:bg-foreground/5 hover:text-foreground"}`}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{tab.label}</span>
        <span className={`mt-0.5 block text-xs ${active ? "text-white/70" : "text-text-muted"}`}>{tab.description}</span>
      </span>
    </button>
  )
}

function CoachHeading({ goalTitle, activeTab }: { goalTitle?: string; activeTab: CoachActiveTab }) {
  const heading = TABS.find((item) => item.id === activeTab)
  return (
    <header className="dashboard-feature-card mb-6 overflow-hidden rounded-[20px] border border-border bg-card-bg p-5 sm:p-6">
      <p className="dashboard-eyebrow">Coach · {heading?.label}</p>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-text-secondary">{goalTitle ?? "Соберите персональный маршрут и двигайтесь по нему шаг за шагом."}</p>
          <h1 className="text-2xl font-semibold tracking-[-0.035em] text-foreground sm:text-3xl">{heading?.label}</h1>
        </div>
      </div>
    </header>
  )
}

function pluralDays(n: number): string {
  const mod10 = n % 10
  const mod100 = n % 100
  if (mod10 === 1 && mod100 !== 11) return "день"
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return "дня"
  return "дней"
}
