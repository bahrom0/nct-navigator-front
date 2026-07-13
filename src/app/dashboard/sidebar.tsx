"use client"

import { usePathname } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import {
  LayoutDashboard, ClipboardList, GraduationCap, History, Mic, Bookmark, Activity, Award, Menu, X, ArrowLeft,
} from "lucide-react"
import { useDashboardMobileNavStore } from "@/stores/dashboard-mobile-nav-store"

const NAV_ITEMS = [
  { href: "/dashboard", label: "Обзор", icon: LayoutDashboard },
  { href: "/dashboard/plans", label: "Планы", icon: ClipboardList },
  { href: "/coach", label: "Coach", icon: GraduationCap },
  { href: "/dashboard/history", label: "История", icon: History },
  { href: "/dashboard/interviews", label: "Интервью", icon: Mic },
  { href: "/dashboard/bookmarks", label: "Закладки", icon: Bookmark },
  { href: "/dashboard/activity", label: "Активность", icon: Activity },
  { href: "/dashboard/achievements", label: "Достижения", icon: Award },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  const mobileOpen = useDashboardMobileNavStore((s) => s.isOpen)
  const openMobileNav = useDashboardMobileNavStore((s) => s.open)
  const closeMobileNav = useDashboardMobileNavStore((s) => s.close)

  return (
    <>
      <button
        onClick={openMobileNav}
        className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_18px_40px_rgba(42,34,25,0.24)] transition-transform duration-200 hover:scale-[1.03] md:hidden"
        aria-label="Меню"
      >
        <Menu className="h-5 w-5" />
      </button>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-black/45 lg:hidden"
            onClick={closeMobileNav}
          />
        )}
      </AnimatePresence>

      <aside
        className={`
          dashboard-sidebar fixed left-1/2 top-1/2 z-50 flex max-h-[calc(100dvh-3rem)] w-[min(18rem,calc(100vw-1.5rem))] -translate-x-1/2 -translate-y-1/2 flex-col
          transition-[transform,opacity] duration-300 ease-out
          lg:left-6 lg:top-1/2 lg:max-h-[calc(100dvh-3rem)] lg:translate-x-0 lg:-translate-y-1/2
          ${mobileOpen ? "scale-100 opacity-100" : "pointer-events-none scale-95 opacity-0 lg:pointer-events-auto lg:scale-100 lg:opacity-100"}
        `}
      >
        <div className="flex min-h-[4.25rem] items-center justify-between border-b border-border px-4">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-2xl px-3 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-foreground/5 hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            На главную
          </Link>
          <button onClick={closeMobileNav} className="rounded-xl p-2 md:hidden" aria-label="Закрыть">
            <X className="h-4 w-4 text-text-secondary" />
          </button>
        </div>

        <nav className="flex-1 space-y-1.5 overflow-y-auto p-3 pb-4">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobileNav}
                className={`
                  flex items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-medium transition-all duration-200
                  ${isActive ? "bg-primary text-white shadow-[0_12px_24px_rgba(42,34,25,0.16)]" : "text-text-secondary hover:translate-x-0.5 hover:bg-foreground/5 hover:text-foreground"}
                `}
              >
                <item.icon className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

      </aside>
    </>
  )
}
