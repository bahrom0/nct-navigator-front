"use client";

import {
  ArrowDown,
  ArrowRight,
  BrainCircuit,
  Check,
  Code2,
  Database,
  ExternalLink,
  Filter,
  GraduationCap,
  Layers3,
  MousePointer2,
  Route,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState, type TouchEvent, type WheelEvent } from "react";
import {
  ALGORITHM_STEPS,
  ARCHITECTURE_FILES,
  FILE_ICON,
  PRESENTATION_SLIDES,
  PROBLEM_CARDS,
  RESULT_METRICS,
  SOLUTION_FEATURES,
  TECHNOLOGIES,
} from "@/lib/presentation-content";
import { BrandMark } from "./BrandMark";
import { PhotoFrame } from "./PhotoFrame";
import { PresentationNavigation } from "./PresentationNavigation";
import styles from "./presentation.module.css";

const LAST_SLIDE_INDEX = PRESENTATION_SLIDES.length - 1;

function isInteractiveTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    Boolean(target.closest("a, button, input, textarea, select, [contenteditable='true']"))
  );
}

export function PresentationShell() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [isFullscreen, setIsFullscreen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const wheelLockRef = useRef(false);
  const touchStartRef = useRef<number | null>(null);

  const goTo = useCallback(
    (nextIndex: number) => {
      const safeIndex = Math.max(0, Math.min(LAST_SLIDE_INDEX, nextIndex));
      if (safeIndex === activeIndex) return;
      setDirection(safeIndex > activeIndex ? "forward" : "backward");
      setActiveIndex(safeIndex);
    },
    [activeIndex],
  );

  const goNext = useCallback(() => goTo(activeIndex + 1), [activeIndex, goTo]);
  const goPrevious = useCallback(() => goTo(activeIndex - 1), [activeIndex, goTo]);

  const toggleFullscreen = useCallback(async () => {
    if (!document.fullscreenElement) {
      await rootRef.current?.requestFullscreen();
    } else {
      await document.exitFullscreen();
    }
  }, []);

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (isInteractiveTarget(event.target) && [" ", "Enter"].includes(event.key)) return;

      if (["ArrowRight", "ArrowDown", "PageDown", " "].includes(event.key)) {
        event.preventDefault();
        goNext();
        return;
      }

      if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) {
        event.preventDefault();
        goPrevious();
        return;
      }

      if (event.key === "Home") {
        event.preventDefault();
        goTo(0);
        return;
      }

      if (event.key === "End") {
        event.preventDefault();
        goTo(LAST_SLIDE_INDEX);
        return;
      }

      if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        void toggleFullscreen();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrevious, goTo, toggleFullscreen]);

  const handleWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      if (wheelLockRef.current || Math.abs(event.deltaY) < 26) return;
      wheelLockRef.current = true;
      if (event.deltaY > 0) goNext();
      else goPrevious();
      window.setTimeout(() => {
        wheelLockRef.current = false;
      }, 650);
    },
    [goNext, goPrevious],
  );

  const handleTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
    touchStartRef.current = event.touches[0]?.clientY ?? null;
  }, []);

  const handleTouchEnd = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      const startY = touchStartRef.current;
      const endY = event.changedTouches[0]?.clientY;
      touchStartRef.current = null;
      if (startY == null || endY == null) return;
      const distance = startY - endY;
      if (Math.abs(distance) < 56) return;
      if (distance > 0) goNext();
      else goPrevious();
    },
    [goNext, goPrevious],
  );

  const FileIcon = FILE_ICON;

  return (
    <div
      ref={rootRef}
      className={styles.presentationRoot}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      <PresentationNavigation
        activeIndex={activeIndex}
        isFullscreen={isFullscreen}
        onGoTo={goTo}
        onNext={goNext}
        onPrevious={goPrevious}
        onToggleFullscreen={() => void toggleFullscreen()}
      />

      <main className={styles.deck}>
        <section
          className={`${styles.slide} ${styles.slideBlack} ${activeIndex === 0 ? styles.slideActive : styles.slideHidden} ${direction === "forward" ? styles.enterForward : styles.enterBackward}`}
          aria-hidden={activeIndex !== 0}
        >
          <div className={styles.coverGrid}>
            <div className={styles.coverCopy}>
              <div className={styles.coverBrandWrap}>
                <BrandMark variant="dark" />
              </div>
              <span className={styles.eyebrowDark}>
                <GraduationCap size={14} /> Для абитуриентов Таджикистана
              </span>
              <h1>
                Выбор кода НЦТ,
                <br />который можно объяснить.
              </h1>
              <p>
                Интересы пользователя превращаются в конкретный вариант поступления и понятный маршрут подготовки.
              </p>
              <div className={styles.coverMeta}>
                <span><Check size={15} /> Рабочий продукт</span>
                <span><MousePointer2 size={15} /> Управление стрелками</span>
              </div>
            </div>

            <div className={styles.coverVisual}>
              <div className={styles.coverVisualHeader}>
                <span>NCT Navigator</span>
                <em>mmtai.xyz</em>
              </div>
              <PhotoFrame
                src="/photos/hero.png"
                alt="Интерфейс NCT Navigator"
                fileLabel="public/photos/hero.png"
                className={styles.coverPhoto}
              />
              <div className={styles.coverVisualFooter}>
                <strong>Профиль → локальный поиск → AI rerank</strong>
                <ArrowRight size={19} />
              </div>
            </div>
          </div>
          <button type="button" className={styles.firstNext} onClick={goNext} aria-label="Следующий слайд">
            <ArrowDown size={22} />
          </button>
        </section>

        <section
          className={`${styles.slide} ${styles.slidePaper} ${activeIndex === 1 ? styles.slideActive : styles.slideHidden} ${direction === "forward" ? styles.enterForward : styles.enterBackward}`}
          aria-hidden={activeIndex !== 1}
        >
          <div className={styles.sectionHeader}>
            <span className={styles.eyebrowLight}><Users size={14} /> Проблема</span>
            <h2>Тысячи вариантов.<br />Ни одного уверенного ответа.</h2>
          </div>
          <div className={styles.problemGrid}>
            {PROBLEM_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <article
                  key={card.title}
                  className={card.tone === "dark" ? styles.problemCardDark : styles.problemCard}
                >
                  <div className={styles.cardIcon}><Icon size={22} /></div>
                  <div>
                    <h3>{card.title}</h3>
                    <p>{card.text}</p>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        <section
          className={`${styles.slide} ${styles.slideTeal} ${activeIndex === 2 ? styles.slideActive : styles.slideHidden} ${direction === "forward" ? styles.enterForward : styles.enterBackward}`}
          aria-hidden={activeIndex !== 2}
        >
          <div className={styles.sectionHeaderDark}>
            <span className={styles.eyebrowDark}><Sparkles size={14} /> Решение</span>
            <h2>От интересов пользователя<br />до конкретного кода НЦТ.</h2>
          </div>

          <div className={styles.solutionPanel}>
            <div className={styles.solutionImageWrap}>
              <PhotoFrame
                src="/photos/product-main.png"
                alt="Экран анализа NCT Navigator"
                fileLabel="public/photos/product-main.png"
                className={styles.solutionPhoto}
              />
              <span className={styles.liveBadge}>Рабочий интерфейс</span>
            </div>
            <div className={styles.solutionFeatures}>
              {SOLUTION_FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article key={feature.title}>
                    <Icon size={22} />
                    <h3>{feature.title}</h3>
                    <p>{feature.text}</p>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section
          className={`${styles.slide} ${styles.slidePaper} ${activeIndex === 3 ? styles.slideActive : styles.slideHidden} ${direction === "forward" ? styles.enterForward : styles.enterBackward}`}
          aria-hidden={activeIndex !== 3}
        >
          <div className={styles.algorithmHeading}>
            <div>
              <span className={styles.eyebrowLight}><BrainCircuit size={14} /> Алгоритм</span>
              <h2>ИИ понимает намерение.<br />База сохраняет правду.</h2>
            </div>
            <p>
              AI не получает право свободно выбирать код. Сначала система строит валидный список, и только потом модель помогает его упорядочить и объяснить.
            </p>
          </div>

          <div className={styles.algorithmTrack}>
            {ALGORITHM_STEPS.map((step, index) => {
              const Icon = step.icon;
              return (
                <div className={styles.algorithmItemWrap} key={step.number}>
                  <article className={`${styles.algorithmItem} ${styles[`algorithm_${step.kind}`]}`}>
                    <span>{step.number}</span>
                    <Icon size={22} />
                    <h3>{step.title}</h3>
                    <p>{step.text}</p>
                  </article>
                  {index < ALGORITHM_STEPS.length - 1 ? <ArrowRight className={styles.algorithmArrow} size={18} /> : null}
                </div>
              );
            })}
          </div>

          <div className={styles.guardRail}>
            <ShieldCheck size={22} />
            <strong>ИИ не может придумать код, изменить город или выйти за пределы найденного shortlist.</strong>
          </div>
        </section>

        <section
          className={`${styles.slide} ${styles.slideBlack} ${activeIndex === 4 ? styles.slideActive : styles.slideHidden} ${direction === "forward" ? styles.enterForward : styles.enterBackward}`}
          aria-hidden={activeIndex !== 4}
        >
          <div className={styles.architectureHeading}>
            <span className={styles.eyebrowDark}><Code2 size={14} /> Архитектура</span>
            <h2>Интерфейс, данные<br />и интеллект работают вместе.</h2>
          </div>

          <div className={styles.architectureGrid}>
            <article className={styles.technologyPanel}>
              <div className={styles.panelHeading}>
                <span>Технологический слой</span>
                <em>8 инструментов</em>
              </div>
              <div className={styles.technologyGrid}>
                {TECHNOLOGIES.map((technology) => {
                  const Icon = technology.icon;
                  return (
                    <div key={technology.title}>
                      <Icon size={19} />
                      <strong>{technology.title}</strong>
                      <span>{technology.role}</span>
                    </div>
                  );
                })}
              </div>
            </article>

            <article className={styles.filePanel}>
              <div className={styles.panelHeading}>
                <span>Мозг системы</span>
                <em>service.ts управляет цепочкой</em>
              </div>
              <div className={styles.fileFlow}>
                {ARCHITECTURE_FILES.map((file, index) => (
                  <div key={file} className={styles.fileFlowRow}>
                    <div className={styles.fileNode}>
                      <FileIcon size={18} />
                      <span>{file}</span>
                    </div>
                    {index < ARCHITECTURE_FILES.length - 1 ? <ArrowDown size={16} /> : null}
                  </div>
                ))}
              </div>
            </article>
          </div>
        </section>

        <section
          className={`${styles.slide} ${styles.slidePaper} ${activeIndex === 5 ? styles.slideActive : styles.slideHidden} ${direction === "forward" ? styles.enterForward : styles.enterBackward}`}
          aria-hidden={activeIndex !== 5}
        >
          <div className={styles.resultGrid}>
            <div className={styles.resultCopy}>
              <span className={styles.eyebrowLight}><Check size={14} /> Итог</span>
              <h2>Выбор становится<br />следующим шагом.</h2>
              <p>
                NCT Navigator уменьшает неопределённость, сохраняет реальные ограничения НЦТ и показывает, что делать дальше.
              </p>
              <div className={styles.metricsGrid}>
                {RESULT_METRICS.map((metric) => (
                  <article key={metric.label}>
                    <strong>{metric.value}</strong>
                    <span>{metric.label}</span>
                  </article>
                ))}
              </div>
            </div>

            <aside className={styles.qrPanel}>
              <div className={styles.qrTopline}>
                <BrandMark variant="dark" compact />
                <span>Попробовать проект</span>
              </div>
              <div className={styles.qrWrap}>
                <img src="/presentation/mmtai-qr.png" alt="QR-код, ведущий на mmtai.xyz" draggable={false} />
              </div>
              <a href="https://mmtai.xyz" target="_blank" rel="noreferrer">
                <span>mmtai.xyz</span>
                <ExternalLink size={22} />
              </a>
              <p>Откройте сайт или отсканируйте QR-код камерой телефона.</p>
            </aside>
          </div>
        </section>
      </main>

      <div className={styles.keyboardHint} aria-hidden="true">
        <span>←</span><span>→</span><em>переключение</em><span>F</span><em>полный экран</em>
      </div>
    </div>
  );
}
