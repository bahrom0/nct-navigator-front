"use client";

import {
  BookOpen,
  Building2,
  Code2,
} from "lucide-react";

interface CoachGoalManualFormProps {
  nctCode: string;
  nctTitle: string;
  university: string;
  onChangeCode: (value: string) => void;
  onChangeTitle: (value: string) => void;
  onChangeUniversity: (value: string) => void;
}

const TITLE_MAX = 200;
const UNIVERSITY_MAX = 200;

export function CoachGoalManualForm({
  nctCode,
  nctTitle,
  university,
  onChangeCode,
  onChangeTitle,
  onChangeUniversity,
}: CoachGoalManualFormProps) {
  return (
    <div className="mt-6 space-y-4">
      <LabeledField
        label="Код НЦТ"
        icon={Code2}
        placeholder="Например, 6B06101"
        value={nctCode}
        onChange={onChangeCode}
        maxLength={20}
      />
      <LabeledField
        label="Название специальности"
        icon={BookOpen}
        placeholder="Например, Программная инженерия"
        value={nctTitle}
        onChange={onChangeTitle}
        maxLength={TITLE_MAX}
      />
      <LabeledField
        label="Университет (опционально)"
        icon={Building2}
        placeholder="Например, Назарбаев Университет"
        value={university}
        onChange={onChangeUniversity}
        maxLength={UNIVERSITY_MAX}
      />
  </div>
  );
}

interface LabeledFieldProps {
  label: string;
  icon: typeof Code2;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  maxLength?: number;
}

function LabeledField({
  label,
  icon: Icon,
  value,
  onChange,
  placeholder,
  maxLength,
}: LabeledFieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-[13px] font-semibold text-[var(--marketing-muted)]">
        {label}
    </span>
      <span className="relative block">
        <Icon
          className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--marketing-muted)]"
          aria-hidden="true"
        />
        <input
          type="text"
          value={value}
          maxLength={maxLength}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          className="h-12 w-full rounded-[14px] border border-[var(--marketing-border-strong)] bg-[var(--marketing-surface)] pl-10 pr-3 text-sm text-[var(--marketing-foreground)] transition-colors placeholder:text-[color-mix(in_srgb,var(--marketing-muted)_72%,transparent)] focus-visible:border-[var(--marketing-accent)] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-[rgba(42,34,25,0.12)]"
        />
    </span>
  </label>
  );
}
