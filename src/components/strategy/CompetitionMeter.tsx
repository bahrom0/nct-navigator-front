import { Info } from "lucide-react"

interface CompetitionMeterProps {
  admissionPlan?: number
}

export function CompetitionMeter({ admissionPlan }: CompetitionMeterProps) {
  const hasPublishedPlaces = Number.isInteger(admissionPlan) && (admissionPlan ?? 0) >= 0

  return (
    <div className="mt-4 flex items-start gap-2 rounded-[12px] border border-border bg-background/55 px-3 py-2.5">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-muted" aria-hidden="true" />
      <p className="text-xs leading-relaxed text-text-secondary">
        <span className="font-semibold text-foreground">Конкурс не опубликован.</span>{" "}
        {hasPublishedPlaces
          ? `В записи НЦТ указано ${admissionPlan} мест, однако заявления и проходной балл неизвестны.`
          : "В записи НЦТ нет числа мест, заявления и проходной балл неизвестны."}
      </p>
    </div>
  )
}
