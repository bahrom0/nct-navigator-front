import type { Metadata } from "next";
import { PresentationShell } from "@/components/presentation/PresentationShell";

export const metadata: Metadata = {
  title: "NCT Navigator — презентация",
  description: "Интерактивная презентация проекта NCT Navigator.",
};

export default function PresentationPage() {
  return <PresentationShell />;
}
