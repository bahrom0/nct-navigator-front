"use client";

import {
  ArrowRight,
  Check,
  Database,
  ExternalLink,
  GraduationCap,
  ShieldCheck,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type TouchEvent, type WheelEvent } from "react";
import {
  ALGORITHM_STEPS,
  ARCHITECTURE_FILES,
  PRESENTATION_SLIDES,
  PROBLEM_CARDS,
  RESULT_METRICS,
  RESULT_POINTS,
  SOLUTION_FEATURES,
  TECHNOLOGIES,
} from "@/lib/presentation-content";
import { PresentationNavigation } from "./PresentationNavigation";
import { ProductVisual } from "./ProductVisual";
import styles from "./presentation.module.css";

const LAST_SLIDE_INDEX = PRESENTATION_SLIDES.length - 1;

function isInteractiveTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    Boolean(target.closest("a, button, input, textarea, select, [contenteditable='true']"))
  );
}

function stateFor(index: number, activeIndex: number) {
  if (index === activeIndex) return "active";
  return index < activeIndex ? "before" : "after";
}

export function PresentationShell() {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const wheelLockRef = useRef(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const goTo = useCallback((nextIndex: number) => {
    setActiveIndex(Math.max(0, Math.min(LAST_SLIDE_INDEX, nextIndex)));
  }, []);

  const goNext = useCallback(() => setActiveIndex((index) => Math.min(LAST_SLIDE_INDEX, index + 1)), []);
  const goPrevious = useCallback(() => setActiveIndex((index) => Math.max(0, index - 1)), []);

  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) await rootRef.current?.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      // Browsers and projector policies can reject fullscreen.
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
      } else if (["ArrowLeft", "ArrowUp", "PageUp"].includes(event.key)) {
        event.preventDefault();
        goPrevious();
      } else if (event.key === "Home") {
        event.preventDefault();
        goTo(0);
      } else if (event.key === "End") {
        event.preventDefault();
        goTo(LAST_SLIDE_INDEX);
      } else if (event.key.toLowerCase() === "f") {
        event.preventDefault();
        void toggleFullscreen();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrevious, goTo, toggleFullscreen]);

  const handleWheel = useCallback(
    (event: WheelEvent<HTMLDivElement>) => {
      if (isInteractiveTarget(event.target) || wheelLockRef.current || Math.abs(event.deltaY) < 34) return;
      event.preventDefault();
      wheelLockRef.current = true;
      if (event.deltaY > 0) goNext();
      else goPrevious();
      window.setTimeout(() => {
        wheelLockRef.current = false;
      }, 720);
    },
    [goNext, goPrevious],
  );

  const handleTouchStart = useCallback((event: TouchEvent<HTMLDivElement>) => {
    if (isInteractiveTarget(event.target)) return;
    const touch = event.touches[0];
    if (touch) touchStartRef.current = { x: touch.clientX, y: touch.clientY };
  }, []);

  const handleTouchEnd = useCallback(
    (event: TouchEvent<HTMLDivElement>) => {
      const start = touchStartRef.current;
      const touch = event.changedTouches[0];
      touchStartRef.current = null;
      if (!start || !touch) return;

      const deltaX = start.x - touch.clientX;
      const deltaY = start.y - touch.clientY;
      const distance = Math.abs(deltaX) > Math.abs(deltaY) ? deltaX : deltaY;
      if (Math.abs(distance) < 52) return;
      if (distance > 0) goNext();
      else goPrevious();
    },
    [goNext, goPrevious],
  );

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
        onToggleFullscreen={() => void toggleFullscreen()}
      />

      <main className={styles.deck}>
        <section
          className={`${styles.slide} ${styles.introSlide}`}
          data-state={stateFor(0, activeIndex)}
          aria-hidden={activeIndex !== 0}
        >
          <div className={styles.slideCanvas}>
            <div className={styles.introCopy}>
              <span className={styles.eyebrow}>
                <GraduationCap size={15} /> Для абитуриентов Таджикистана
              </span>
              <h1>NCT<br />Navigator</h1>
              <p>
                Превращает интересы абитуриента в конкретный код НЦТ и понятный маршрут подготовки.
              </p>
              <button type="button" className={styles.primaryButton} onClick={goNext}>
                Начать презентацию <ArrowRight size={16} />
              </button>

              <div className={styles.introStats}>
                <article>
                  <strong>1 562</strong>
                  <span>записи в базе</span>
                </article>
                <article>
                  <strong>5+</strong>
                  <span>этапов проверки</span>
                </article>
                <article>
                  <strong>1</strong>
                  <span>понятный маршрут</span>
                </article>
              </div>
            </div>

            <div className={styles.introVisual}>
              <ProductVisual
                src="/photos/hero.png"
                alt="Интерфейс NCT Navigator: профиль и анализ интересов"
                label="hero.png"
                className={styles.heroVisual}
              />
              <div className={styles.workingBadge}>
                <span />
                Рабочий продукт
              </div>
              <div className={styles.visualNote}>
                <span>Профиль</span>
                <ArrowRight size={15} />
                <span>Поиск</span>
                <ArrowRight size={15} />
                <span>План</span>
              </div>
            </div>
          </div>
        </section>

        <section
          className={styles.slide}
          data-state={stateFor(1, activeIndex)}
          aria-hidden={activeIndex !== 1}
        >
          <div className={`${styles.slideCanvas} ${styles.problemCanvas}`}>
            <div className={styles.sectionHeading}>
              <span className={styles.eyebrow}>01 · Проблема выбора</span>
              <h2>Тысячи вариантов.<br />Ни одного уверенного ответа.</h2>
            </div>

            <div className={styles.problemGrid}>
              {PROBLEM_CARDS.map((card) => {
                const Icon = card.icon;
                return (
                  <article key={card.number} className={card.tone === "dark" ? styles.problemCardDark : styles.problemCard}>
                    <div className={styles.cardTopline}>
                      <span>{card.number}</span>
                      <Icon size={21} strokeWidth={1.5} />
                    </div>
                    {card.number === "01" ? (
                      <div className={styles.informationMap} aria-hidden="true">
                        <span>Статьи</span>
                        <span>Вузы</span>
                        <span>Коды НЦТ</span>
                        <strong>?</strong>
                      </div>
                    ) : null}
                    {card.number === "02" ? (
                      <div className={styles.routeMap} aria-hidden="true">
                        <span>Интересы</span>
                        <i />
                        <span>Подготовка</span>
                        <i />
                        <strong>Фокус не найден</strong>
                      </div>
                    ) : null}
                    {card.number === "03" ? (
                      <div className={styles.choiceMap} aria-hidden="true">
                        <span>Город</span>
                        <span>Уровень</span>
                        <span>Интересы</span>
                        <strong>?</strong>
                      </div>
                    ) : null}
                    <h3>{card.title}</h3>
                    <p>{card.text}</p>
                  </article>
                );
              })}
            </div>

            <div className={styles.problemQuestion}>
              <span>Главный вопрос абитуриента</span>
              <strong>«Как понять, что этот выбор действительно мой?»</strong>
            </div>
          </div>
        </section>

        <section
          className={styles.slide}
          data-state={stateFor(2, activeIndex)}
          aria-hidden={activeIndex !== 2}
        >
          <div className={`${styles.slideCanvas} ${styles.solutionCanvas}`}>
            <div className={styles.solutionHeading}>
              <span className={styles.eyebrow}>02 · Решение</span>
              <h2>От интересов<br />до конкретного кода НЦТ.</h2>
              <p>Пользователь задаёт ограничения один раз. Система сохраняет их на всём пути поиска.</p>
            </div>

            <div className={styles.solutionShowcase}>
              <ProductVisual
                src="/photos/product-main.png"
                alt="Интерфейс анализа NCT Navigator"
                label="product-main.png"
                className={styles.solutionPrimaryVisual}
              />
              <ProductVisual
                src="/photos/results.png"
                alt="Результаты подбора NCT Navigator"
                label="results.png"
                className={styles.solutionSecondaryVisual}
              />
            </div>

            <div className={styles.solutionFeatures}>
              {SOLUTION_FEATURES.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article key={feature.title}>
                    <Icon size={20} strokeWidth={1.5} />
                    <div>
                      <h3>{feature.title}</h3>
                      <p>{feature.text}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section
          className={styles.slide}
          data-state={stateFor(3, activeIndex)}
          aria-hidden={activeIndex !== 3}
        >
          <div className={`${styles.slideCanvas} ${styles.algorithmCanvas}`}>
            <div className={styles.algorithmHeading}>
              <div>
                <span className={styles.eyebrow}>03 · Как работает система</span>
                <h2>AI понимает намерение.<br />База сохраняет правду.</h2>
              </div>
              <p>
                Сначала — жёсткие ограничения и локальный поиск. Только потом — AI rerank короткого списка.
              </p>
            </div>

            <div className={styles.pipeline}>
              {ALGORITHM_STEPS.map((step, index) => {
                const Icon = step.icon;
                return (
                  <div className={styles.pipelineNodeWrap} key={step.number}>
                    <article className={styles.pipelineNode} data-kind={step.kind}>
                      <span className={styles.pipelineNumber}>{step.number}</span>
                      <Icon size={20} strokeWidth={1.5} />
                      <h3>{step.title}</h3>
                      <p>{step.caption}</p>
                    </article>
                    {index < ALGORITHM_STEPS.length - 1 ? <ArrowRight className={styles.pipelineArrow} size={17} /> : null}
                  </div>
                );
              })}
            </div>

            <div className={styles.algorithmRule}>
              <ShieldCheck size={24} strokeWidth={1.5} />
              <div>
                <span>Архитектурное правило</span>
                <strong>AI не может придумать код, изменить город или выйти за пределы shortlist.</strong>
              </div>
            </div>
          </div>
        </section>

        <section
          className={styles.slide}
          data-state={stateFor(4, activeIndex)}
          aria-hidden={activeIndex !== 4}
        >
          <div className={`${styles.slideCanvas} ${styles.architectureCanvas}`}>
            <div className={styles.sectionHeading}>
              <span className={styles.eyebrow}>04 · Система</span>
              <h2>Интерфейс, данные<br />и интеллект работают вместе.</h2>
            </div>

            <div className={styles.architectureGrid}>
              <article className={styles.stackPanel}>
                <div className={styles.panelTopline}>
                  <span>Технологический слой</span>
                  <em>{TECHNOLOGIES.length} инструментов</em>
                </div>
                <div className={styles.techGrid}>
                  {TECHNOLOGIES.map((technology, index) => (
                    <div key={technology.title}>
                      <span>{String(index + 1).padStart(2, "0")}</span>
                      <strong>{technology.title}</strong>
                      <em>{technology.role}</em>
                    </div>
                  ))}
                </div>
              </article>

              <article className={styles.systemPanel}>
                <div className={styles.panelTopline}>
                  <span>Проверяемые модули</span>
                  <em>backend / recommendation</em>
                </div>
                <div className={styles.systemFlow}>
                  {ARCHITECTURE_FILES.map((file, index) => (
                    <div className={styles.systemRow} key={file.name}>
                      <div className={styles.fileIcon}><Database size={17} strokeWidth={1.5} /></div>
                      <div>
                        <strong>{file.name}</strong>
                        <span>{file.role}</span>
                      </div>
                      <em>{String(index + 1).padStart(2, "0")}</em>
                    </div>
                  ))}
                </div>
              </article>
            </div>
          </div>
        </section>

        <section
          className={styles.slide}
          data-state={stateFor(5, activeIndex)}
          aria-hidden={activeIndex !== 5}
        >
          <div className={`${styles.slideCanvas} ${styles.resultCanvas}`}>
            <div className={styles.resultCopy}>
              <span className={styles.eyebrow}>05 · Итог</span>
              <h2>Выбор становится<br />следующим шагом.</h2>
              <p>
                NCT Navigator уменьшает неопределённость и показывает, что делать после выбора направления.
              </p>

              <div className={styles.resultPoints}>
                {RESULT_POINTS.map((point) => (
                  <span key={point}><Check size={16} /> {point}</span>
                ))}
              </div>

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
              <div className={styles.qrPanelTop}>
                <Image src="/presentation/icon-nct-dark.png" alt="NCT" width={58} height={30} draggable={false} />
                <span>Попробовать проект</span>
              </div>
              <div className={styles.qrCode}>
                <Image
                  src="/presentation/mmtai-qr.png"
                  alt="QR-код на сайт mmtai.xyz"
                  width={220}
                  height={220}
                  draggable={false}
                />
              </div>
              <a href="https://mmtai.xyz" target="_blank" rel="noreferrer">
                <span>mmtai.xyz</span>
                <ExternalLink size={22} />
              </a>
              <p>Отсканируйте QR-код или откройте проект в браузере.</p>
            </aside>
          </div>
        </section>
      </main>

    </div>
  );
}
