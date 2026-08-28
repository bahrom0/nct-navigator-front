import fs from "node:fs/promises";
import { Presentation, PresentationFile } from "@oai/artifact-tool";

const ROOT = "C:/Users/bahro/Desktop/nct-navigator-front";
const TMP_DIR = `${ROOT}/.tmp/nct-olympiad-2026`;
const FINAL_PPTX = `${ROOT}/output/NCT-Navigator-Olympiad-2026.pptx`;
const DARK_LOGO = `${ROOT}/public/presentation/icon-nct-dark.png`;
const LIGHT_LOGO = `${ROOT}/public/presentation/icon-nct-light.png`;

const W = 1280;
const H = 720;
const FONT = "Arial";

const C = {
  ink: "#0E1114",
  ink2: "#15191F",
  ink3: "#20242B",
  cream: "#F5F0E7",
  cream2: "#E9E0D1",
  paper: "#F7F4EE",
  paper2: "#EEE7DC",
  slate: "#697078",
  slate2: "#9AA0A5",
  bronze: "#B49770",
  bronze2: "#D5BC95",
  blue: "#2A8EF0",
  blue2: "#79B9FF",
  green: "#5FA68D",
  red: "#C1786D",
  white: "#FFFFFF",
};

const noLine = { style: "solid", fill: "none", width: 0 };

async function readImageBlob(imagePath) {
  const bytes = await fs.readFile(imagePath);
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
}

function addShape(slide, name, geometry, x, y, width, height, fill = "none", line = noLine, extra = {}) {
  return slide.shapes.add({
    geometry,
    name,
    position: { left: x, top: y, width, height },
    fill,
    line,
    ...extra,
  });
}

function addBox(slide, name, x, y, width, height, fill, lineFill = "none", lineWidth = 0, extra = {}) {
  return addShape(
    slide,
    name,
    "roundRect",
    x,
    y,
    width,
    height,
    fill,
    { style: "solid", fill: lineFill, width: lineWidth },
    { borderRadius: "rounded-2xl", ...extra },
  );
}

function addText(slide, name, text, x, y, width, height, style = {}) {
  const shape = addShape(slide, name, "textbox", x, y, width, height, "none", noLine);
  shape.text = text;
  shape.text.style = {
    typeface: FONT,
    fontSize: 20,
    color: C.cream,
    alignment: "left",
    verticalAlignment: "top",
    lineSpacing: 1.08,
    ...style,
  };
  return shape;
}

function addRule(slide, name, x, y, width, color, height = 1) {
  return addShape(slide, name, "rect", x, y, width, height, color, noLine);
}

function addDot(slide, name, x, y, size, fill) {
  return addShape(slide, name, "ellipse", x, y, size, size, fill, noLine);
}

function addOrbit(slide, name, x, y, size, color, dotColor = C.blue) {
  addShape(slide, `${name}-outer`, "ellipse", x, y, size, size * 0.66, "none", { style: "solid", fill: color, width: 1 });
  addShape(slide, `${name}-inner`, "ellipse", x + size * 0.14, y + size * 0.14, size * 0.72, size * 0.38, "none", { style: "solid", fill: color, width: 1 });
  addDot(slide, `${name}-dot`, x + size * 0.76, y + size * 0.1, 7, dotColor);
}

function addLogo(slide, imageBlob, name, x, y, width, height) {
  return slide.images.add({
    blob: imageBlob,
    contentType: "image/png",
    alt: "Логотип NCT",
    fit: "contain",
    position: { left: x, top: y, width, height },
    geometry: "rect",
    name,
  });
}

function addSlideChrome(slide, number, dark = true) {
  const textColor = dark ? C.cream2 : C.ink;
  const muted = dark ? C.slate2 : C.slate;
  addText(slide, `chrome-label-${number}`, "NCT NAVIGATOR", 72, 26, 220, 22, {
    fontSize: 16,
    bold: true,
    color: muted,
    alignment: "left",
  });
  addText(slide, `chrome-number-${number}`, `${String(number).padStart(2, "0")} / 07`, 1104, 668, 104, 24, {
    fontSize: 16,
    bold: true,
    color: textColor,
    alignment: "right",
  });
  addRule(slide, `chrome-rule-${number}`, 72, 650, 1136, dark ? "#FFFFFF/14" : "#0E1114/14", 1);
}

function addTitle(slide, kicker, title, dark = true, titleWidth = 920) {
  const titleColor = dark ? C.cream : C.ink;
  const kickerColor = dark ? C.bronze2 : C.blue;
  addText(slide, `kicker-${title}`, kicker.toUpperCase(), 72, 76, 700, 26, {
    fontSize: 17,
    bold: true,
    color: kickerColor,
  });
  addText(slide, `title-${title}`, title, 72, 108, titleWidth, 68, {
    fontSize: 40,
    bold: true,
    color: titleColor,
    lineSpacing: 0.98,
  });
}

function addNotes(slide, lines) {
  slide.speakerNotes.textFrame.setText(["[Sources]", ...lines]);
  slide.speakerNotes.setVisible(true);
}

function buildDeck(darkLogo, lightLogo) {
  const presentation = Presentation.create({ slideSize: { width: W, height: H } });

  // Slide 1 — title
  {
    const slide = presentation.slides.add();
    slide.background.fill = "linear(135deg, #0C0F13 0%, #15191F 58%, #241D17 100%)";
    addOrbit(slide, "title-orbit", 812, 126, 360, "#D5BC95/26", C.blue);
    addDot(slide, "title-dot-1", 748, 260, 5, C.bronze2);
    addDot(slide, "title-dot-2", 1180, 498, 6, C.blue);
    addText(slide, "title-kicker", "NCT / НАВИГАТОР ПОСТУПЛЕНИЯ", 96, 156, 560, 28, {
      fontSize: 18,
      bold: true,
      color: C.blue2,
    });
    addText(slide, "title-main", "NCT Navigator", 96, 206, 700, 92, {
      fontSize: 64,
      bold: true,
      color: C.cream,
      lineSpacing: 0.94,
    });
    addText(slide, "title-subtitle", "От интересов и условий поступления —\nк конкретному коду НЦТ и плану действий.", 100, 318, 620, 84, {
      fontSize: 28,
      color: C.cream2,
      lineSpacing: 1.04,
    });
    addRule(slide, "title-accent-rule", 100, 438, 84, C.blue, 4);
    addText(slide, "title-context", "Проект для абитуриентов Таджикистана", 100, 460, 560, 32, {
      fontSize: 20,
      color: C.bronze2,
    });
    addLogo(slide, darkLogo, "title-logo", 818, 250, 350, 142);
    addText(slide, "title-footer", "ОЛИМПИАДА  •  2026", 100, 614, 320, 24, {
      fontSize: 17,
      bold: true,
      color: C.slate2,
    });
    addText(slide, "title-page", "01 / 07", 1104, 668, 104, 24, {
      fontSize: 16,
      bold: true,
      color: C.cream2,
      alignment: "right",
    });
    addNotes(slide, [
      "Asset: local project logo C:/Users/bahro/Desktop/nct-navigator-front/public/presentation/icon-nct-dark.png.",
      "The title and product description are based on the current repository flow in src/app/recommendations/page.tsx and src/lib/recommendations/service.ts.",
    ]);
  }

  // Slide 2 — problem
  {
    const slide = presentation.slides.add();
    slide.background.fill = "linear(135deg, #0E1114 0%, #161A20 68%, #211C17 100%)";
    addSlideChrome(slide, 2, true);
    addTitle(slide, "Проблема", "Вариантов много, но маршрута нет", true, 900);
    addText(slide, "problem-lead", "Абитуриенту нужно не больше\nинформации. Ему нужен следующий шаг.", 72, 210, 500, 96, {
      fontSize: 31,
      bold: true,
      color: C.cream,
      lineSpacing: 1.0,
    });
    addRule(slide, "problem-lead-rule", 72, 338, 70, C.blue, 4);
    const items = [
      ["01", "Списки и коды разбросаны", "Данные есть, но они не собраны вокруг конкретного человека."],
      ["02", "Условия меняют выбор", "Город, уровень образования и форма обучения отсекают часть вариантов."],
      ["03", "После выбора нет плана", "Специальность не связана с понятной подготовкой."],
    ];
    let y = 198;
    items.forEach(([num, heading, body], i) => {
      const x = 650;
      addText(slide, `problem-num-${i}`, num, x, y, 64, 42, { fontSize: 24, bold: true, color: C.blue2 });
      addText(slide, `problem-heading-${i}`, heading, x + 76, y - 2, 450, 32, { fontSize: 22, bold: true, color: C.cream });
      addText(slide, `problem-body-${i}`, body, x + 76, y + 36, 470, 46, { fontSize: 17, color: C.cream2, lineSpacing: 1.02 });
      if (i < items.length - 1) addRule(slide, `problem-rule-${i}`, x, y + 94, 510, "#FFFFFF/16", 1);
      y += 112;
    });
    addBox(slide, "problem-bottom", 72, 520, 1072, 78, "#B49770/16", "#B49770/34", 1);
    addText(slide, "problem-bottom-text", "Проблема не в отсутствии данных — проблема в отсутствии навигации.", 104, 542, 1000, 34, {
      fontSize: 23,
      bold: true,
      color: C.bronze2,
      alignment: "center",
    });
    addNotes(slide, [
      "Internal product framing based on the current recommendations flow in src/app/recommendations/page.tsx and data/reports/ntc/product_features.md.",
      "No external statistics are used on this slide.",
    ]);
  }

  // Slide 3 — solution flow
  {
    const slide = presentation.slides.add();
    slide.background.fill = "linear(135deg, #F7F4EE 0%, #EEE7DC 100%)";
    addSlideChrome(slide, 3, false);
    addTitle(slide, "Решение", "Один маршрут — от профиля до цели", false, 900);
    addText(slide, "solution-sub", "Navigator собирает контекст, сужает выбор и сразу показывает, что делать дальше.", 72, 184, 970, 34, {
      fontSize: 21,
      color: C.slate,
    });
    const steps = [
      ["01", "Профиль", "город\nкласс\nинтересы"],
      ["02", "Подбор", "поиск\nфильтры\nНЦТ-коды"],
      ["03", "Объяснение", "почему\nподходит\nэтот вариант"],
      ["04", "План", "интервью\nцель\nCoach"],
    ];
    const startX = 72;
    const boxW = 238;
    const gap = 40;
    steps.forEach(([num, heading, body], i) => {
      const x = startX + i * (boxW + gap);
      addBox(slide, `solution-box-${i}`, x, 260, boxW, 205, i === 3 ? C.ink : C.white, i === 3 ? C.ink : "#0E1114/12", 1);
      addText(slide, `solution-num-${i}`, num, x + 24, 286, 54, 30, { fontSize: 24, bold: true, color: i === 3 ? C.blue2 : C.blue });
      addText(slide, `solution-heading-${i}`, heading, x + 24, 328, boxW - 48, 34, { fontSize: 24, bold: true, color: i === 3 ? C.cream : C.ink });
      addText(slide, `solution-body-${i}`, body, x + 24, 376, boxW - 48, 84, { fontSize: 18, color: i === 3 ? C.cream2 : C.slate, lineSpacing: 1.02 });
      if (i < steps.length - 1) {
        addText(slide, `solution-arrow-${i}`, "→", x + boxW + 8, 328, 28, 48, { fontSize: 36, bold: true, color: C.blue, alignment: "center" });
      }
    });
    addBox(slide, "solution-bottom", 72, 510, 1072, 76, C.ink, C.ink, 0);
    addText(slide, "solution-bottom-text", "Navigator не заменяет выбор — он делает его обоснованным.", 100, 530, 1016, 36, {
      fontSize: 25,
      bold: true,
      color: C.cream,
      alignment: "center",
    });
    addNotes(slide, [
      "Internal product flow based on src/app/recommendations/page.tsx (recommendations, filters, selection -> interview) and routes in src/app/plan, src/app/coach, src/app/interview.",
      "No external statistics are used on this slide.",
    ]);
  }

  // Slide 4 — project description and dataset proof
  {
    const slide = presentation.slides.add();
    slide.background.fill = "linear(135deg, #0F1317 0%, #171B21 72%, #241F18 100%)";
    addSlideChrome(slide, 4, true);
    addTitle(slide, "Описание проекта", "НЦТ-данные превращаются в понятный продукт", true, 1080);
    addText(slide, "description-lead", "Navigator соединяет НЦТ Core, персональные фильтры и маршрут поступления — в одном интерфейсе.", 72, 186, 1000, 42, {
      fontSize: 23,
      color: C.cream2,
    });
    addBox(slide, "description-metric-band", 72, 258, 1072, 152, "#FFFFFF/06", "#FFFFFF/16", 1);
    addText(slide, "description-metric-value", "1 389", 106, 286, 250, 62, { fontSize: 58, bold: true, color: C.blue2 });
    addText(slide, "description-metric-label", "опубликованных\nпредложений", 106, 354, 270, 48, { fontSize: 19, color: C.cream2, lineSpacing: 1.02 });
    addRule(slide, "description-metric-divider-1", 410, 282, 1, "#FFFFFF/18", 104);
    addText(slide, "description-metric-2", "2", 466, 292, 92, 50, { fontSize: 46, bold: true, color: C.bronze2 });
    addText(slide, "description-metric-2-label", "релиза данных", 466, 354, 180, 28, { fontSize: 19, color: C.cream2 });
    addRule(slide, "description-metric-divider-2", 660, 282, 1, "#FFFFFF/18", 104);
    addText(slide, "description-metric-3", "140", 718, 292, 150, 50, { fontSize: 46, bold: true, color: C.bronze2 });
    addText(slide, "description-metric-3-label", "строк оставлены\nна ручную проверку", 718, 354, 250, 48, { fontSize: 19, color: C.cream2, lineSpacing: 1.02 });
    addText(slide, "description-metric-date", "локальный release · 15.07.2026", 1000, 362, 112, 36, { fontSize: 16, color: C.slate2, alignment: "right" });
    const features = [
      ["Ищет", "по коду, специальности, вузу, городу и ключевым словам"],
      ["Фильтрует", "по уровню, форме обучения, оплате и языку"],
      ["Ведёт дальше", "от результата к источнику, цели, интервью и плану"],
    ];
    features.forEach(([heading, body], i) => {
      const x = 90 + i * 360;
      addDot(slide, `description-dot-${i}`, x, 478, 9, i === 1 ? C.bronze2 : C.blue);
      addText(slide, `description-feature-heading-${i}`, heading, x + 24, 466, 260, 34, { fontSize: 22, bold: true, color: C.cream });
      addText(slide, `description-feature-body-${i}`, body, x + 24, 506, 288, 62, { fontSize: 18, color: C.cream2, lineSpacing: 1.04 });
    });
    addNotes(slide, [
      "Internal data sources: data/exports/ntc/nct_release_manifest.json, data/reports/ntc/stage3_quality.json, and data/reports/ntc/product_features.md.",
      "The 1,389 figure is a count of published admission offers, not a count of applicants. The 140 figure is excluded rows pending review.",
      "The release snapshot is dated 2026-07-15.",
    ]);
  }

  // Slide 5 — architecture
  {
    const slide = presentation.slides.add();
    slide.background.fill = "linear(135deg, #0E1114 0%, #151A20 66%, #211C17 100%)";
    addSlideChrome(slide, 5, true);
    addTitle(slide, "Архитектура проекта", "База ограничивает, AI объясняет", true, 920);
    addText(slide, "architecture-sub", "Критический принцип: модель не придумывает новые коды — она работает только поверх проверенного shortlist.", 72, 184, 1020, 40, {
      fontSize: 22,
      color: C.cream2,
    });
    const blocks = [
      ["Интерфейс", "Next.js + React\nZustand\nпрофиль и фильтры", C.ink3, C.blue2],
      ["Сервис", "POST /api/reco\nZod\nlocal service", "#25221F", C.bronze2],
      ["NCT Core", "published JSON/CSV\nSearch index\nhard filters + local rank", C.ink3, C.blue2],
      ["AI-слой", "interest analysis\nshortlist rerank\nstructured fallback", "#25221F", C.bronze2],
      ["Результат", "Top-K вариантов\nwhy it fits\ngoal → plan → Coach", C.ink3, C.blue2],
    ];
    const boxW = 192;
    const gap = 37;
    blocks.forEach(([heading, body, fill, accent], i) => {
      const x = 72 + i * (boxW + gap);
      addBox(slide, `architecture-box-${i}`, x, 274, boxW, 212, fill, "#FFFFFF/18", 1);
      addRule(slide, `architecture-accent-${i}`, x + 22, 298, 52, accent, 4);
      addText(slide, `architecture-heading-${i}`, heading, x + 22, 322, boxW - 44, 32, { fontSize: 22, bold: true, color: C.cream });
      addText(slide, `architecture-body-${i}`, body, x + 22, 370, boxW - 44, 92, { fontSize: 17, color: C.cream2, lineSpacing: 1.05 });
      if (i < blocks.length - 1) addText(slide, `architecture-arrow-${i}`, "→", x + boxW + 6, 354, 26, 44, { fontSize: 30, bold: true, color: C.blue, alignment: "center" });
    });
    addBox(slide, "architecture-guardrail", 72, 536, 1072, 72, "#2A8EF0/12", "#2A8EF0/38", 1);
    addText(slide, "architecture-guardrail-text", "Если AI недоступен, локальное ранжирование продолжает работу.", 100, 557, 1016, 30, { fontSize: 23, bold: true, color: C.blue2, alignment: "center" });
    addNotes(slide, [
      "Internal implementation sources: src/app/recommendations/page.tsx; src/lib/recommendations/service.ts; src/lib/search/engine.ts; src/lib/ai/analyze-interest-profile.ts; src/lib/ai/finalize-recommendations.ts.",
      "buildRecommendations runs interest analysis, builds a local candidate pool, locally ranks NCT results, then applies AI final ranking. AI is given a shortlist and the code falls back to local ranking when the AI step fails.",
      "The diagram is intentionally simplified to the critical path for an olympiad audience.",
    ]);
  }

  // Slide 6 — applicant statistics
  {
    const slide = presentation.slides.add();
    slide.background.fill = "linear(135deg, #F7F4EE 0%, #EEE7DC 100%)";
    addSlideChrome(slide, 6, false);
    addTitle(slide, "Статистика абитуриентов", "ЦВЭ / ИМД-2026 — это масштабная задача навигации", false, 1080);
    addText(slide, "stats-date", "официальные данные НЦТ · публикации 01 и 15 июля 2026", 72, 184, 720, 28, { fontSize: 18, color: C.slate });
    addText(slide, "stats-main-value", "139 163", 72, 232, 450, 78, { fontSize: 68, bold: true, color: C.ink, lineSpacing: 0.92 });
    addText(slide, "stats-main-label", "зарегистрированы в основном периоде\n2 марта — 30 апреля 2026", 78, 322, 440, 54, { fontSize: 20, color: C.slate, lineSpacing: 1.04 });
    addRule(slide, "stats-main-rule", 78, 402, 120, C.blue, 4);
    addText(slide, "stats-split-label", "Кто вошёл в основной поток", 620, 232, 500, 30, { fontSize: 22, bold: true, color: C.ink });
    addText(slide, "stats-after-11-value", "116 560", 620, 284, 250, 52, { fontSize: 45, bold: true, color: C.blue });
    addText(slide, "stats-after-11-label", "после 11 класса /\nначального и среднего проф. образования", 620, 338, 340, 52, { fontSize: 18, color: C.slate, lineSpacing: 1.03 });
    addText(slide, "stats-after-9-value", "22 603", 930, 284, 210, 52, { fontSize: 45, bold: true, color: C.bronze });
    addText(slide, "stats-after-9-label", "после 9 класса", 930, 338, 220, 30, { fontSize: 18, color: C.slate });
    addRule(slide, "stats-bar-bg", 620, 410, 520, "#0E1114/12", 20);
    addRule(slide, "stats-bar-after-11", 620, 410, 436, C.blue, 20);
    addRule(slide, "stats-bar-after-9", 1056, 410, 84, C.bronze, 20);
    addText(slide, "stats-bar-caption", "84%", 1002, 444, 58, 26, { fontSize: 18, bold: true, color: C.blue, alignment: "right" });
    addText(slide, "stats-bar-caption-2", "16%", 1082, 444, 58, 26, { fontSize: 18, bold: true, color: C.bronze, alignment: "right" });
    const bottom = [
      ["10 394", "второй период регистрации"],
      ["55", "экзаменационных центров"],
      ["22", "города и района"],
      ["1 527", "аудиторий"],
    ];
    bottom.forEach(([value, label], i) => {
      const x = 72 + i * 276;
      addRule(slide, `stats-bottom-rule-${i}`, x, 514, 190, i === 0 ? C.bronze : C.blue, 3);
      addText(slide, `stats-bottom-value-${i}`, value, x, 534, 220, 42, { fontSize: 31, bold: true, color: C.ink });
      addText(slide, `stats-bottom-label-${i}`, label, x, 582, 230, 34, { fontSize: 16, color: C.slate, lineSpacing: 1.0 });
    });
    addNotes(slide, [
      "Official source: https://www.ntc.tj/tj/hamai-khabarho/o-ozi-asosii-imd-2026.html — 139,163 main-period registrants; 116,560 after grade 11/professional education; 22,603 after grade 9; 55 exam sites in 22 cities/districts; 1,527 classrooms.",
      "Official source: https://www.ntc.tj/tj/hamai-khabarho/davri-duyumi-imd-2026-ism-oi-a-va-b.html — 10,394 registrants in the second period, including 7,245 after grade 11/professional education and 3,149 after grade 9.",
      "Visible percentages are calculated from the official main-period breakdown and rounded to whole percentages. Separate registration periods are not summed as unique people.",
    ]);
  }

  // Slide 7 — conclusion
  {
    const slide = presentation.slides.add();
    slide.background.fill = "linear(135deg, #0C0F13 0%, #15191F 58%, #241D17 100%)";
    addSlideChrome(slide, 7, true);
    addOrbit(slide, "closing-orbit", 1010, 198, 180, "#D5BC95/18", C.blue);
    addTitle(slide, "Заключение", "Абитуриенту нужен не список, а маршрут", true, 1040);
    addText(slide, "closing-lead", "NCT Navigator превращает выбор\nв обоснованную цель и первые шаги.", 72, 212, 660, 92, {
      fontSize: 32,
      bold: true,
      color: C.cream,
      lineSpacing: 1.0,
    });
    addRule(slide, "closing-rule", 72, 324, 84, C.blue, 4);
    const outcomes = [
      ["01", "Данные НЦТ", "источник остаётся источником"],
      ["02", "Понятный выбор", "вариант объясняется человеческим языком"],
      ["03", "Следующий шаг", "цель превращается в план и Coach"],
    ];
    outcomes.forEach(([num, heading, body], i) => {
      const y = 214 + i * 108;
      addDot(slide, `closing-dot-${i}`, 794, y + 8, 10, i === 1 ? C.bronze2 : C.blue);
      addText(slide, `closing-num-${i}`, num, 820, y, 54, 30, { fontSize: 20, bold: true, color: C.blue2 });
      addText(slide, `closing-heading-${i}`, heading, 882, y - 2, 260, 32, { fontSize: 22, bold: true, color: C.cream });
      addText(slide, `closing-body-${i}`, body, 882, y + 38, 290, 28, { fontSize: 17, color: C.cream2 });
    });
    addLogo(slide, darkLogo, "closing-logo", 72, 500, 260, 105);
    addText(slide, "closing-footer", "Профиль  →  выбор  →  план", 790, 546, 380, 34, { fontSize: 23, bold: true, color: C.bronze2, alignment: "right" });
    addText(slide, "closing-tagline", "Сделать следующий шаг понятным.", 790, 588, 380, 28, { fontSize: 18, color: C.slate2, alignment: "right" });
    addNotes(slide, [
      "Internal conclusion based on the product flow in src/app/recommendations/page.tsx, src/app/interview/page.tsx, src/app/plan/page.tsx, and src/app/coach/page.tsx.",
      "Asset: local project logo C:/Users/bahro/Desktop/nct-navigator-front/public/presentation/icon-nct-dark.png.",
    ]);
  }

  return presentation;
}

async function writeBlob(path, blob) {
  await fs.writeFile(path, new Uint8Array(await blob.arrayBuffer()));
}

async function main() {
  await fs.mkdir(TMP_DIR, { recursive: true });
  await fs.mkdir(`${ROOT}/output`, { recursive: true });
  const darkLogo = await readImageBlob(DARK_LOGO);
  const lightLogo = await readImageBlob(LIGHT_LOGO);
  const presentation = buildDeck(darkLogo, lightLogo);

  for (const [index, slide] of presentation.slides.items.entries()) {
    const stem = `slide-${String(index + 1).padStart(2, "0")}`;
    await writeBlob(`${TMP_DIR}/${stem}.png`, await presentation.export({ slide, format: "png", scale: 1 }));
    const layout = await slide.export({ format: "layout" });
    await fs.writeFile(`${TMP_DIR}/${stem}.layout.json`, await layout.text(), "utf8");
  }
  await writeBlob(`${TMP_DIR}/deck-montage.webp`, await presentation.export({ format: "webp", montage: true, scale: 1 }));
  const inspection = await presentation.inspect({ kind: "slide,textbox,shape,image,notes", maxChars: 50000 });
  await fs.writeFile(`${TMP_DIR}/inspection.ndjson`, inspection.ndjson ?? JSON.stringify(inspection, null, 2), "utf8");
  const pptx = await PresentationFile.exportPptx(presentation);
  await pptx.save(FINAL_PPTX);
  console.log(`WROTE ${FINAL_PPTX}`);
  console.log(`SLIDES ${presentation.slides.items.length}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
