import {
  BrainCircuit,
  Database,
  FileCode2,
  Filter,
  GraduationCap,
  MapPin,
  Route,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  type LucideIcon,
} from "lucide-react";

export const PRESENTATION_SLIDES = [
  { id: "intro", shortLabel: "Проект", title: "NCT Navigator" },
  { id: "problem", shortLabel: "Проблема", title: "Слишком много вариантов" },
  { id: "solution", shortLabel: "Решение", title: "От интересов к коду" },
  { id: "algorithm", shortLabel: "Алгоритм", title: "AI понимает, база проверяет" },
  { id: "architecture", shortLabel: "Система", title: "Что работает внутри" },
  { id: "result", shortLabel: "Итог", title: "Конкретный следующий шаг" },
] as const;

export const PROBLEM_CARDS: Array<{
  title: string;
  text: string;
  number: string;
  icon: LucideIcon;
  tone: "light" | "dark";
}> = [
  {
    number: "01",
    title: "Информации много",
    text: "Статьи, списки вузов и сотни кодов — но почти нигде нет ответа именно для этого абитуриента.",
    icon: Search,
    tone: "light",
  },
  {
    number: "02",
    title: "Маршрута нет",
    text: "Подготовка идёт сразу по всем направлениям. Время тратится, а фокус так и не появляется.",
    icon: Route,
    tone: "light",
  },
  {
    number: "03",
    title: "Выбор вслепую",
    text: "Главный вопрос остаётся без ответа: «Как понять, что этот выбор действительно мой?»",
    icon: Users,
    tone: "dark",
  },
];

export const SOLUTION_FEATURES: Array<{
  title: string;
  text: string;
  icon: LucideIcon;
}> = [
  {
    title: "Подбирает код",
    text: "Учитывает город, уровень образования и интересы.",
    icon: Target,
  },
  {
    title: "Объясняет выбор",
    text: "Показывает, почему вариант оказался в выдаче.",
    icon: BrainCircuit,
  },
  {
    title: "Строит план",
    text: "Превращает направление в следующие шаги подготовки.",
    icon: Route,
  },
];

export const ALGORITHM_STEPS: Array<{
  number: string;
  title: string;
  caption: string;
  icon: LucideIcon;
  kind: "input" | "ai" | "local" | "output";
}> = [
  { number: "01", title: "Профиль", caption: "город · образование · интересы", icon: Users, kind: "input" },
  { number: "02", title: "AI-анализ", caption: "профессии и намерение", icon: Sparkles, kind: "ai" },
  { number: "03", title: "Hard filters", caption: "ограничения до ранжирования", icon: Filter, kind: "local" },
  { number: "04", title: "Локальный поиск", caption: "только существующие записи", icon: Database, kind: "local" },
  { number: "05", title: "Ранжирование", caption: "совпадение и качество данных", icon: Target, kind: "local" },
  { number: "06", title: "AI rerank", caption: "порядок внутри shortlist", icon: BrainCircuit, kind: "ai" },
  { number: "07", title: "План", caption: "код · объяснение · действия", icon: GraduationCap, kind: "output" },
];

export const TECHNOLOGIES = [
  { title: "Next.js 16", role: "приложение и сервер" },
  { title: "React 19", role: "интерактивный интерфейс" },
  { title: "TypeScript", role: "типизированные контракты" },
  { title: "Tailwind CSS 4", role: "адаптивная система" },
  { title: "Zustand", role: "состояние клиента" },
  { title: "Supabase", role: "профиль и история" },
  { title: "DeepSeek", role: "анализ и объяснение" },
] as const;

export const ARCHITECTURE_FILES = [
  { name: "service.ts", role: "оркестрация" },
  { name: "engine.ts", role: "поиск и фильтры" },
  { name: "profession-score.ts", role: "оценка профессий" },
  { name: "specialty-linker.ts", role: "связь со специальностями" },
  { name: "scoring-config.json", role: "веса ранжирования" },
] as const;

export const RESULT_METRICS = [
  { value: "1 562", label: "записи в текущей базе" },
  { value: "0", label: "новых кодов может добавить AI" },
  { value: "5+", label: "этапов поиска и проверки" },
] as const;

export const RESULT_POINTS = [
  "Сохраняет город и уровень образования",
  "Работает с реальными записями НЦТ",
  "Объясняет результат человеческим языком",
] as const;

export const SYSTEM_ICONS = {
  file: FileCode2,
  database: Database,
  shield: ShieldCheck,
  location: MapPin,
};
