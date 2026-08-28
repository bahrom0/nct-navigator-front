import { Info } from "lucide-react"

interface CompetitionMeterProps {
  admissionPlan?: number
}

export function CompetitionMeter({ admissionPlan }: CompetitionMeterProps) {
  const hasPublishedPlaces = Number.isInteger(admissionPlan) && (admissionPlan ?? 0) >= 0

  return (
    <div className="mt-3 rounded-[12px] border border-border bg-background/55 p-3">
      <div className="flex items-center gap-2">
        <Info className="h-4 w-4 text-text-muted" aria-hidden="true" />
        <span className="text-xs font-semibold text-foreground">Конкурс не опубликован</span>
        {hasPublishedPlaces ? (
          <span className="ml-auto text-xs font-medium text-text-secondary">{admissionPlan} мест</span>
        ) : null}
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-text-secondary">
        {hasPublishedPlaces
          ? `В опубликованной записи НЦТ указано мест: ${admissionPlan}. `
          : "В опубликованной записи НЦТ нет числа мест. "}
        Число заявлений и проходной балл отсутствуют, поэтому процент сложности не рассчитывается.
      </p>
    </div>
  )
}
