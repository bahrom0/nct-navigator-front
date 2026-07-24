import {
  BrainCircuit,
  Code2,
  Database,
  FileCode2,
  Filter,
  GraduationCap,
  Layers3,
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
  { id: "problem", shortLabel: "Проблема", title: "Тысячи вариантов" },
  { id: "solution", shortLabel: "Решение", title: "От интересов к коду" },
  { id: "algorithm", shortLabel: "Алгоритм", title: "Как работает система" },
  { id: "architecture", shortLabel: "Архитектура", title: "Что внутри" },
  { id: "result", shortLabel: "Итог", title: "Следующий шаг" },
] as const;

export const PROBLEM_CARDS: Array<{
  title: string;
  text: string;
  icon: LucideIcon;
  tone: "light" | "dark";
}> = [
  {
    title: "Информации много",
    text: "Статьи, советы, списки вузов и сотни кодов. Но почти нигде нет персонального ответа.",
    icon: Search,
    tone: "light",
  },
  {
    title: "Маршрута нет",
    text: "Абитуриент готовится ко всему сразу и не понимает, на чём сфокусироваться.",
    icon: Route,
    tone: "light",
  },
  {
    title: "Цена ошибки",
    text: "Потерянное время, деньги и ощущение, что решение снова принято вслепую.",
    icon: Target,
    tone: "light",
  },
  {
    title: "Как понять, что этот выбор действительно мой?",
    text: "Главный вопрос выпускника перед поступлением.",
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
    text: "Учитывает город, образование, интересы и выбранные направления.",
    icon: Target,
  },
  {
    title: "Объясняет выбор",
    text: "Показывает, какие сигналы совпали и почему вариант попал в выдачу.",
    icon: BrainCircuit,
  },
  {
    title: "Строит план",
    text: "Превращает направление в конкретные следующие шаги подготовки.",
    icon: Route,
  },
];

export const ALGORITHM_STEPS: Array<{
  number: string;
  title: string;
  text: string;
  icon: LucideIcon;
  kind: "input" | "ai" | "local" | "output";
}> = [
  {
    number: "01",
    title: "Профиль",
    text: "Город, уровень образования и реальные интересы.",
    icon: Users,
    kind: "input",
  },
  {
    number: "02",
    title: "AI-анализ",
    text: "Профессии, направления и поисковые намерения.",
    icon: BrainCircuit,
    kind: "ai",
  },
  {
    number: "03",
    title: "Жёсткий фильтр",
    text: "Город и образование отсекаются до подсчёта баллов.",
    icon: Filter,
    kind: "local",
  },
  {
    number: "04",
    title: "Локальный поиск",
    text: "Только существующие варианты из базы НЦТ.",
    icon: Database,
    kind: "local",
  },
  {
    number: "05",
    title: "Ранжирование",
    text: "Совпадения, качество данных и разнообразие вариантов.",
    icon: Layers3,
    kind: "local",
  },
  {
    number: "06",
    title: "AI rerank",
    text: "ИИ меняет порядок только внутри валидного shortlist.",
    icon: Sparkles,
    kind: "ai",
  },
  {
    number: "07",
    title: "Результат",
    text: "Код, объяснение и персональный план.",
    icon: GraduationCap,
    kind: "output",
  },
];

export const TECHNOLOGIES: Array<{
  title: string;
  role: string;
  icon: LucideIcon;
}> = [
  { title: "Next.js 16", role: "страницы, API и серверная логика", icon: Code2 },
  { title: "React 19", role: "интерактивный интерфейс", icon: Layers3 },
  { title: "TypeScript", role: "контроль типов и ошибок", icon: ShieldCheck },
  { title: "Tailwind CSS 4", role: "адаптивная визуальная система", icon: Sparkles },
  { title: "Zustand", role: "клиентское состояние", icon: MapPin },
  { title: "Supabase", role: "профили, планы и история", icon: Database },
  { title: "DeepSeek", role: "анализ, rerank и объяснение", icon: BrainCircuit },
  { title: "Framer Motion", role: "переходы интерфейса", icon: Route },
];

export const ARCHITECTURE_FILES = [
  "analyze-interest-profile.ts",
  "nct-match.ts",
  "rank-nct.ts",
  "finalize-recommendations.ts",
  "generate-plan.ts",
] as const;

export const FILE_ICON = FileCode2;

export const RESULT_METRICS = [
  { value: "1 562", label: "записи в текущей базе" },
  { value: "0", label: "новых кодов, которые может придумать AI" },
  { value: "5+", label: "этапов поиска и проверки" },
  { value: "24/7", label: "доступ через браузер" },
] as const;
