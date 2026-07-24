"use client";

import {
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { PRESENTATION_SLIDES } from "@/lib/presentation-content";
import styles from "./presentation.module.css";

export function PresentationNavigation({
  activeIndex,
  isFullscreen,
  onGoTo,
  onNext,
  onPrevious,
  onToggleFullscreen,
}: {
  activeIndex: number;
  isFullscreen: boolean;
  onGoTo: (index: number) => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleFullscreen: () => void;
}) {
  return (
    <>
      <div className={styles.progress} aria-hidden="true">
        <span
          style={{
            width: `${((activeIndex + 1) / PRESENTATION_SLIDES.length) * 100}%`,
          }}
        />
      </div>

      <header className={styles.deckHeader}>
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
          <span className={styles.slideCounter}>
            {String(activeIndex + 1).padStart(2, "0")} / {String(PRESENTATION_SLIDES.length).padStart(2, "0")}
          </span>
          <a href="https://mmtai.xyz" target="_blank" rel="noreferrer">
            <span>Открыть проект</span>
            <ExternalLink size={15} />
          </a>
          <button
            type="button"
            onClick={onToggleFullscreen}
            aria-label={isFullscreen ? "Выйти из полноэкранного режима" : "Полноэкранный режим"}
            title="Полноэкранный режим (F)"
          >
            {isFullscreen ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
          </button>
        </div>
      </header>

      <div className={styles.deckControls} aria-label="Переключение слайдов">
        <button
          type="button"
          onClick={onPrevious}
          disabled={activeIndex === 0}
          aria-label="Предыдущий слайд"
        >
          <ArrowLeft size={21} />
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={activeIndex === PRESENTATION_SLIDES.length - 1}
          aria-label="Следующий слайд"
        >
          <ArrowRight size={21} />
        </button>
      </div>
    </>
  );
}
