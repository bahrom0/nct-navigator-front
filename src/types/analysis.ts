export type AnalysisStep =
  | "submitting_request"
  | "analyzing_interests"
  | "searching_nct_codes"
  | "forming_recommendations";

export type AnalysisStatus = "idle" | "running" | "success" | "error";

export const STEPS: { key: AnalysisStep; label: string }[] = [
  { key: "submitting_request", label: "Составляем список профессий" },
  { key: "analyzing_interests", label: "Сверяем интересы с каталогом" },
  { key: "searching_nct_codes", label: "Ищем коды из НЦТ" },
  { key: "forming_recommendations", label: "Проверяем shortlist и ранжируем" },
];
