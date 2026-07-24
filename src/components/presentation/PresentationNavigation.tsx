"use client";

import {
  ExternalLink,
  Maximize2,
  Minimize2,
} from "lucide-react";
import Image from "next/image";
import { PRESENTATION_SLIDES } from "@/lib/presentation-content";
import styles from "./presentation.module.css";

export function PresentationNavigation({
  activeIndex,
  isFullscreen,
  onGoTo,
  onToggleFullscreen,
}: {
  activeIndex: number;
  isFullscreen: boolean;
  onGoTo: (index: number) => void;
  onToggleFullscreen: () => void;
}) {
  return (
    <>
      <div className={styles.progress} aria-hidden="true">
        <span style={{ transform: `scaleX(${(activeIndex + 1) / PRESENTATION_SLIDES.length})` }} />
      </div>

      <header className={styles.deckHeader}>
        <button className={styles.brandButton} type="button" onClick={() => onGoTo(0)} aria-label="Первый слайд">
          <Image src="/presentation/icon-nct-light.png" alt="" width={38} height={24} draggable={false} />
          <span>NCT Navigator</span>
        </button>

        <nav className={styles.slideTabs} aria-label="Слайды презентации">
          {PRESENTATION_SLIDES.map((slide, index) => (
            <button
              type="button"
              key={slide.id}
              onClick={() => onGoTo(index)}
              className={index === activeIndex ? styles.slideTabActive : styles.slideTab}
              aria-label={`Слайд ${index + 1}: ${slide.title}`}
              aria-current={index === activeIndex ? "step" : undefined}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              <em>{slide.shortLabel}</em>
            </button>
          ))}
        </nav>

        <div className={styles.headerActions}>
          <span className={styles.slideCounter} aria-live="polite">
            {String(activeIndex + 1).padStart(2, "0")} / {String(PRESENTATION_SLIDES.length).padStart(2, "0")}
          </span>
          <a href="https://mmtai.xyz" target="_blank" rel="noreferrer" className={styles.projectLink}>
            <span>Открыть проект</span>
            <ExternalLink size={15} />
          </a>
          <button
            className={styles.iconButton}
            type="button"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? "Выйти из полноэкранного режима" : "Полноэкранный режим"}
            title="Полноэкранный режим (F)"
          >
            {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          </button>
        </div>
      </header>

    </>
  );
}
