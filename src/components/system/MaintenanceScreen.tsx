"use client"

import { motion } from "framer-motion"
import { AlertTriangle, RadioTower, RefreshCcw } from "lucide-react"

type MaintenanceScreenProps = {
  message: string
  variant?: "standard" | "blackout"
  updatedAt?: string | null
  compact?: boolean
}

export function MaintenanceScreen({
  message,
  variant = "standard",
  updatedAt,
  compact = false,
}: MaintenanceScreenProps) {
  const formattedUpdatedAt = updatedAt
    ? new Date(updatedAt).toLocaleString("ru-RU")
    : null

  if (variant === "blackout") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 py-10 text-white">
        <motion.section
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="w-full max-w-3xl rounded-[32px] border border-white/10 bg-white/5 p-8 text-center shadow-[0_40px_120px_rgba(0,0,0,0.45)] backdrop-blur sm:p-12"
        >
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-red-400">
            Emergency Stop
          </p>
          <h1 className="mt-6 text-4xl font-black tracking-[-0.05em] sm:text-6xl">
            Server are Stopped
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-8 text-white/70 sm:text-lg">
            {message}
          </p>
          {formattedUpdatedAt ? (
            <p className="mt-8 text-xs uppercase tracking-[0.2em] text-white/35">
              Last update: {formattedUpdatedAt}
            </p>
          ) : null}
        </motion.section>
      </main>
    )
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(37,99,235,0.18),transparent_26%),radial-gradient(circle_at_80%_18%,rgba(14,165,233,0.12),transparent_20%),linear-gradient(180deg,#f8fbff_0%,#edf4ff_46%,#e8eef9_100%)]" />
      <div className="absolute inset-0 opacity-60 [background-image:linear-gradient(rgba(148,163,184,0.12)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.12)_1px,transparent_1px)] [background-size:30px_30px]" />
      <motion.section
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-10 w-full max-w-3xl overflow-hidden rounded-[32px] border border-white/60 bg-white/82 p-6 shadow-[0_28px_80px_rgba(15,23,42,0.14)] backdrop-blur-xl sm:p-10"
      >
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-amber-700">
            <AlertTriangle className="h-3.5 w-3.5" />
            Maintenance Mode
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-medium text-slate-600">
            <RadioTower className="h-3.5 w-3.5" />
            Backend paused by admin
          </span>
        </div>

        <div className="mt-8 grid gap-8 md:grid-cols-[1.1fr_0.9fr] md:items-end">
          <div>
            <h1 className="text-4xl font-black tracking-[-0.04em] text-slate-950 sm:text-5xl">
              Сайт временно не работает
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              {message}
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition-transform hover:-translate-y-0.5"
              >
                <RefreshCcw className="h-4 w-4" />
                Обновить страницу
              </button>
              {!compact ? (
                <div className="inline-flex items-center rounded-full border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-500">
                  Мы вернём сайт сразу после включения сервера.
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200/80 bg-[linear-gradient(180deg,rgba(248,250,252,0.98),rgba(241,245,249,0.92))] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              Status Snapshot
            </p>
            <div className="mt-4 space-y-4">
              <div className="rounded-2xl border border-rose-100 bg-rose-50/80 p-4">
                <p className="text-sm font-semibold text-rose-700">Server state</p>
                <p className="mt-1 text-2xl font-black tracking-[-0.03em] text-rose-950">
                  Disabled
                </p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white/90 p-4">
                <p className="text-sm font-semibold text-slate-700">What users see</p>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  Любой основной frontend flow получает контролируемую остановку вместо случайных ошибок.
                </p>
              </div>
              {formattedUpdatedAt ? (
                <p className="text-xs text-slate-400">
                  Last updated: {formattedUpdatedAt}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      </motion.section>
    </main>
  )
}
