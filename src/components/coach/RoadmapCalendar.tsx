"use client"

import { useMemo, useState } from "react"
import { Check, ChevronLeft, ChevronRight, Sparkles } from "lucide-react"
import type { DailyPlanRecord } from "@/types/admission"
import type { CoachRoadmap } from "@/types/coach"
import { getRoadmapEndDate, getRoadmapStartDate, isDateWithinRoadmap } from "@/lib/coach/daily-plan-schedule"

const MONTHS = ["Январь", "Февраль", "Март", "Апрель", "Май", "Июнь", "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь"]
const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"]

type CalendarStatus = "outside" | "planned" | "created" | "completed"

interface RoadmapCalendarProps {
  roadmap: CoachRoadmap
  history: DailyPlanRecord[]
  onSelectDate: (date: string) => void
}

export function RoadmapCalendar({ roadmap, history, onSelectDate }: RoadmapCalendarProps) {
  const startDate = getRoadmapStartDate(roadmap)
  const endDate = getRoadmapEndDate(roadmap)
  const initialDate = startDate ? parseIso(startDate) : new Date()
  const [visibleMonth, setVisibleMonth] = useState(() => new Date(initialDate.getFullYear(), initialDate.getMonth(), 1))
  const plansByDate = useMemo(
    () => new Set(history.filter((plan) => !plan.isDraft && plan.tasks.length > 0).map((plan) => plan.planDate)),
    [history],
  )

  if (!startDate || !endDate) return null

  const days = buildCalendarDays(visibleMonth)
  const today = isoToday()

  return (
    <section className="dashboard-feature-card overflow-hidden rounded-[20px] border border-border bg-card-bg p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">Календарь Roadmap</p>
          <h2 className="mt-2 text-lg font-semibold text-foreground">Ваш ритм подготовки</h2>
          <p className="mt-1 text-sm text-text-secondary">{formatRange(startDate, endDate)}</p>
        </div>
        <div className="inline-flex rounded-xl border border-border bg-background p-1">
          <button type="button" onClick={() => setVisibleMonth((date) => shiftMonth(date, -1))} aria-label="Предыдущий месяц" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-card-bg hover:text-foreground">
            <ChevronLeft className="h-4 w-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => setVisibleMonth(new Date(initialDate.getFullYear(), initialDate.getMonth(), 1))} className="min-w-28 rounded-lg px-2 text-xs font-semibold text-foreground transition-colors hover:bg-card-bg">
            К началу
          </button>
          <button type="button" onClick={() => setVisibleMonth((date) => shiftMonth(date, 1))} aria-label="Следующий месяц" className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-text-secondary transition-colors hover:bg-card-bg hover:text-foreground">
            <ChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-x-4 gap-y-2 text-xs text-text-secondary">
        <LegendItem tone="bg-amber-300" label="Входит в Roadmap" />
        <LegendItem tone="bg-emerald-500" label="План создан" />
        <LegendItem tone="bg-emerald-700" label="День завершён" check />
      </div>

      <div className="mt-5 rounded-2xl border border-border bg-background p-3 sm:p-4">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-base font-semibold text-foreground">{MONTHS[visibleMonth.getMonth()]} {visibleMonth.getFullYear()}</p>
          <p className="hidden text-xs text-text-muted sm:block">Нажмите на день, чтобы открыть его план</p>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center">
          {WEEKDAYS.map((weekday) => <span key={weekday} className="py-1 text-[11px] font-semibold text-text-muted">{weekday}</span>)}
          {days.map((date) => {
            const iso = formatIso(date)
            const status = getStatus(roadmap, iso, plansByDate, today)
            const inCurrentMonth = date.getMonth() === visibleMonth.getMonth()
            const selectable = status !== "outside"
            const isToday = iso === today

            return (
              <button
                key={iso}
                type="button"
                disabled={!selectable}
                onClick={() => onSelectDate(iso)}
                aria-label={`${date.getDate()} ${MONTHS[date.getMonth()]}: ${statusLabel(status)}`}
                className={`relative mx-auto inline-flex h-9 w-9 items-center justify-center rounded-xl text-xs font-semibold transition-all sm:h-10 sm:w-10 ${calendarClass(status, inCurrentMonth, isToday)}`}
              >
                {status === "completed" ? <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" /> : date.getDate()}
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-4 flex items-start gap-2 rounded-xl bg-primary/8 px-3 py-2.5 text-xs leading-5 text-text-secondary">
        <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <p>Зелёный день означает, что для него уже подготовлен план. После наступления следующего дня он отмечается галочкой.</p>
      </div>
    </section>
  )
}

function LegendItem({ tone, label, check }: { tone: string; label: string; check?: boolean }) {
  return <span className="inline-flex items-center gap-1.5"><span className={`inline-flex h-3.5 w-3.5 items-center justify-center rounded-full ${tone}`}>{check ? <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} /> : null}</span>{label}</span>
}

function getStatus(roadmap: CoachRoadmap, date: string, plansByDate: Set<string>, today: string): CalendarStatus {
  if (!isDateWithinRoadmap(roadmap, date)) return "outside"
  if (plansByDate.has(date) && date < today) return "completed"
  if (plansByDate.has(date)) return "created"
  return "planned"
}

function calendarClass(status: CalendarStatus, inCurrentMonth: boolean, isToday: boolean) {
  const currentMonthClass = inCurrentMonth ? "" : "opacity-35"
  const todayRing = isToday ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""
  if (status === "completed") return `bg-emerald-700 text-white shadow-sm hover:bg-emerald-800 ${currentMonthClass} ${todayRing}`
  if (status === "created") return `bg-emerald-500 text-white shadow-sm hover:bg-emerald-600 ${currentMonthClass} ${todayRing}`
  if (status === "planned") return `bg-amber-200 text-amber-950 hover:bg-amber-300 ${currentMonthClass} ${todayRing}`
  return `cursor-default text-text-muted ${currentMonthClass}`
}

function statusLabel(status: CalendarStatus) {
  if (status === "completed") return "день завершён"
  if (status === "created") return "план создан"
  if (status === "planned") return "входит в Roadmap"
  return "вне Roadmap"
}

function buildCalendarDays(month: Date) {
  const first = new Date(month.getFullYear(), month.getMonth(), 1)
  const startOffset = (first.getDay() + 6) % 7
  const start = new Date(first)
  start.setDate(first.getDate() - startOffset)
  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start)
    date.setDate(start.getDate() + index)
    return date
  })
}

function shiftMonth(month: Date, offset: number) {
  return new Date(month.getFullYear(), month.getMonth() + offset, 1)
}

function parseIso(iso: string) {
  const [year, month, day] = iso.split("-").map(Number)
  return new Date(year, month - 1, day)
}

function formatIso(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function isoToday() {
  return formatIso(new Date())
}

function formatRange(start: string, end: string) {
  const startDate = parseIso(start)
  const endDate = parseIso(end)
  return `${startDate.getDate()} ${MONTHS[startDate.getMonth()].toLowerCase()} — ${endDate.getDate()} ${MONTHS[endDate.getMonth()].toLowerCase()} ${endDate.getFullYear()}`
}
