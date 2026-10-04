/* ПРЯМО — общая библиотека генерации docx (рецепты R1/R2, палитры, таблицы, TOC)
 * Кириллическая адаптация calcTitleLayout: ширина символа ~ pt * 12.5 twips. */
const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  Header, Footer, PageNumber, NumberFormat, AlignmentType, HeadingLevel,
  WidthType, BorderStyle, ShadingType, TableLayoutType, SectionType,
  LevelFormat, TableOfContents, PageBreak,
} = require("docx");
const fs = require("fs");

/* ── Палитры (из design-system) ── */
const PALETTES = {
  "GO-1": { // Graphite Orange — стратегии, предложения
    bg: "1A2330", accent: "D4875A", headingColor: "1A2330", secondary: "5A6470",
    cover: { titleColor: "FFFFFF", subtitleColor: "B0B8C0", metaColor: "90989F", footerColor: "687078" },
    table: { headerBg: "D4875A", headerText: "FFFFFF", accentLine: "D4875A", innerLine: "DDD0C8", surface: "F8F0EB" },
  },
  "IG-1": { // Ink Gold — финансы, инвестиции
    bg: "1A1A1A", accent: "C9A84C", headingColor: "1A1A1A", secondary: "5A5A5A",
    cover: { titleColor: "FFFFFF", subtitleColor: "B0B8C0", metaColor: "90989F", footerColor: "687078" },
    table: { headerBg: "C9A84C", headerText: "1A1A1A", accentLine: "C9A84C", innerLine: "DDD5C0", surface: "F5F2E8" },
  },
  "MIN-1": { // Warm Gold — консалтинг, лёгкие документы
    bg: "F3F1ED", accent: "C9A84C", headingColor: "000000", secondary: "606060",
    cover: { titleColor: "000000", subtitleColor: "606060", metaColor: "707070", footerColor: "A0A0A0" },
    table: { headerBg: "D6C096", headerText: "1A1A1A", accentLine: "9A8560", innerLine: "DDD8CC", surface: "F5F3ED" },
  },
};

/* ── Границы ── */
const NB = { style: BorderStyle.NONE, size: 0, color: "FFFFFF" };
const noBorders = { top: NB, bottom: NB, left: NB, right: NB };
const allNoBorders = { top: NB, bottom: NB, left: NB, right: NB, insideHorizontal: NB, insideVertical: NB };

/* ── Заголовок обложки: динамический кегль + смысловые переносы (кириллица) ── */
function splitTitleLines(title, charsPerLine) {
  if (title.length <= charsPerLine) return [title];
  const breakAfter = new Set([..."，。、；：！？", ..."-_—–·/", ..." \t"]);
  const lines = [];
  let remaining = title;
  while (remaining.length > charsPerLine) {
    let breakAt = -1;
    for (let i = charsPerLine; i >= Math.floor(charsPerLine * 0.6); i--) {
      if (i < remaining.length && breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
    }
    if (breakAt === -1) {
      const limit = Math.min(remaining.length, Math.ceil(charsPerLine * 1.3));
      for (let i = charsPerLine + 1; i < limit; i++) {
        if (breakAfter.has(remaining[i - 1])) { breakAt = i; break; }
      }
    }
    if (breakAt === -1) breakAt = charsPerLine;
    lines.push(remaining.slice(0, breakAt).trim());
    remaining = remaining.slice(breakAt).trim();
  }
  if (remaining) lines.push(remaining);
  if (lines.length > 1 && lines[lines.length - 1].length <= 2) {
    const last = lines.pop();
    lines[lines.length - 1] += " " + last;
  }
  return lines;
}

function calcTitleLayout(title, maxWidthTwips, preferredPt = 40, minPt = 24) {
  const charWidth = (pt) => pt * 12.5; // кириллица ≈ 0.62 em
  const charsPerLine = (pt) => Math.floor(maxWidthTwips / charWidth(pt));
  let titlePt = preferredPt, lines;
  while (titlePt >= minPt) {
    const cpl = charsPerLine(titlePt);
    if (cpl < 2) { titlePt -= 2; continue; }
    lines = splitTitleLines(title, cpl);
    if (lines.length <= 3) break;
    titlePt -= 2;
  }
  if (!lines || lines.length > 3) {
    lines = splitTitleLines(title, charsPerLine(minPt));
    titlePt = minPt;
  }
  return { titlePt, titleLines: lines };
}

function calcCoverSpacing(params) {
  const {
    titleLineCount = 1, titlePt = 36, hasSubtitle = false,
    hasEnglishLabel = false, metaLineCount = 0,
    fixedHeight = 800, pageHeight = 16838,
    marginTop = 0, marginBottom = 0,
  } = params;
  const SAFETY = 1200;
  const usableHeight = pageHeight - marginTop - marginBottom - SAFETY;
  const titleHeight = titleLineCount * (titlePt * 23 + 200);
  const subtitleHeight = hasSubtitle ? (12 * 23 + 600) : 0;
  const englishLabelHeight = hasEnglishLabel ? (9 * 23 + 600) : 0;
  const metaHeight = metaLineCount * (10 * 23 + 100);
  const implicitParaHeight = 3 * 300;
  const contentHeight = titleHeight + subtitleHeight + englishLabelHeight + metaHeight + fixedHeight + implicitParaHeight;
  const remainingSpace = usableHeight - contentHeight;
  const safeRemaining = Math.max(remainingSpace, 400);
  const FOOTER_MIN = 800;
  const rawTop = Math.floor(safeRemaining * 0.45);
  const rawBottom = Math.floor(safeRemaining * 0.45);
  const bottomSpacing = Math.max(rawBottom, FOOTER_MIN);
  const topSpacing = Math.max(rawTop - Math.max(0, FOOTER_MIN - rawBottom), 400);
  const midSpacing = Math.max(safeRemaining - topSpacing - bottomSpacing, 0);
  return { topSpacing, midSpacing, bottomSpacing };
}

const CYR = { ascii: "Arial", hAnsi: "Arial" };
const CYR_BODY = { ascii: "Calibri", hAnsi: "Calibri" };

/* ── Рецепт R1: чистый левый край на тёмном фоне ── */
function buildCoverR1(config) {
  const P = config.palette;
  const padL = 1200, padR = 800;
  const availableWidth = 11906 - padL - padR - 300;
  const { titlePt, titleLines } = calcTitleLayout(config.title, availableWidth, 40, 24);
  const titleSize = titlePt * 2;
  const spacing = calcCoverSpacing({
    titleLineCount: titleLines.length, titlePt,
    hasSubtitle: !!config.subtitle, hasEnglishLabel: !!config.englishLabel,
    metaLineCount: (config.metaLines || []).length, fixedHeight: 400,
  });
  const accentLeft = { style: BorderStyle.SINGLE, size: 8, color: P.accent, space: 12 };
  const children = [];
  children.push(new Paragraph({ spacing: { before: spacing.topSpacing } }));
  if (config.englishLabel) {
    children.push(new Paragraph({
      indent: { left: padL, right: padR }, spacing: { after: 500 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: P.accent, space: 8 } },
      children: [new TextRun({ text: config.englishLabel.split("").join(" "), size: 18, color: P.accent, font: CYR, characterSpacing: 40 })],
    }));
  }
  for (let i = 0; i < titleLines.length; i++) {
    children.push(new Paragraph({
      indent: { left: padL },
      spacing: { after: i < titleLines.length - 1 ? 100 : 300, line: Math.ceil(titlePt * 23), lineRule: "atLeast" },
      children: [new TextRun({ text: titleLines[i], size: titleSize, bold: true, color: P.cover.titleColor, font: CYR })],
    }));
  }
  if (config.subtitle) {
    children.push(new Paragraph({
      indent: { left: padL, right: padR }, spacing: { after: 800 },
      children: [new TextRun({ text: config.subtitle, size: 24, color: P.cover.subtitleColor, font: CYR_BODY })],
    }));
  }
  for (const line of (config.metaLines || [])) {
    children.push(new Paragraph({
      indent: { left: padL + 200 }, spacing: { after: 80 },
      border: { left: accentLeft },
      children: [new TextRun({ text: line, size: 24, color: P.cover.metaColor, font: CYR_BODY })],
    }));
  }
  children.push(new Paragraph({ spacing: { before: spacing.bottomSpacing } }));
  children.push(new Paragraph({
    indent: { left: padL, right: padR },
    border: { top: { style: BorderStyle.SINGLE, size: 2, color: P.accent, space: 8 } },
    spacing: { before: 200 },
    children: [
      new TextRun({ text: config.footerLeft || "", size: 16, color: P.cover.footerColor, font: CYR }),
      new TextRun({ text: "                                        " }),
      new TextRun({ text: config.footerRight || "", size: 16, color: P.cover.footerColor, font: CYR }),
    ],
  }));
  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: P.bg }, borders: noBorders,
        verticalAlign: "top",
        children,
      })],
    })],
  })];
}

/* ── Рецепт R2: двойная рамка по центру ── */
function buildCoverR2(config) {
  const P = config.palette;
  const padL = 1400, padR = 1400;
  const { titlePt, titleLines } = calcTitleLayout(config.title, 11906 - padL - padR, 40, 24);
  const titleSize = titlePt * 2;
  const thickBorder = { style: BorderStyle.SINGLE, size: 18, color: P.accent, space: 20 };
  const children = [];
  children.push(new Paragraph({
    indent: { left: padL - 400, right: padR - 400 }, spacing: { before: 1200, after: 200 },
    border: { top: thickBorder }, children: [],
  }));
  children.push(new Paragraph({ spacing: { before: 1800 } }));
  if (config.englishLabel) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 500 },
      children: [new TextRun({ text: config.englishLabel.split("").join("  "), size: 18, color: P.accent, font: CYR, characterSpacing: 40 })],
    }));
  }
  for (let i = 0; i < titleLines.length; i++) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: i < titleLines.length - 1 ? 80 : 300, line: Math.ceil(titlePt * 23), lineRule: "atLeast" },
      children: [new TextRun({ text: titleLines[i], size: titleSize, bold: true, color: P.cover.titleColor, font: CYR })],
    }));
  }
  if (config.subtitle) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER, spacing: { after: 400 },
      children: [new TextRun({ text: config.subtitle, size: 24, color: P.cover.subtitleColor, font: CYR_BODY })],
    }));
  }
  children.push(new Paragraph({ spacing: { before: 1200 } }));
  for (const line of (config.metaLines || [])) {
    children.push(new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100, line: Math.ceil(18 * 23), lineRule: "atLeast" },
      children: [new TextRun({ text: line, size: 36, color: P.cover.metaColor, font: CYR_BODY })],
    }));
  }
  children.push(new Paragraph({ spacing: { before: 2000 } }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    indent: { left: padL - 400, right: padR - 400 }, spacing: { before: 200 },
    border: { bottom: thickBorder },
    children: [new TextRun({ text: config.footerRight || "", size: 18, color: P.cover.footerColor, font: CYR })],
  }));
  return [new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: allNoBorders,
    rows: [new TableRow({
      height: { value: 16838, rule: "exact" },
      children: [new TableCell({
        shading: { type: ShadingType.CLEAR, fill: P.bg }, borders: noBorders,
        verticalAlign: "top",
        children,
      })],
    })],
  })];
}

/* ── Тело документа: заголовки, абзацы, таблицы ── */
function h1(text, P) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 400, after: 160, line: 312 },
    children: [new TextRun({ text, bold: true, size: 32, color: P.headingColor, font: CYR })],
  });
}
function h2(text, P) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 120, line: 312 },
    children: [new TextRun({ text, bold: true, size: 26, color: P.headingColor, font: CYR })],
  });
}
function h3(text, P) {
  return new Paragraph({
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 220, after: 100, line: 312 },
    children: [new TextRun({ text, bold: true, size: 24, color: P.headingColor, font: CYR })],
  });
}
function body(text, opts = {}) {
  const runs = Array.isArray(text)
    ? text.map((r) => new TextRun({ text: r.t, bold: !!r.b, size: opts.size || 24, color: r.c || "000000", font: CYR_BODY }))
    : [new TextRun({ text, size: opts.size || 24, color: "000000", font: CYR_BODY })];
  return new Paragraph({
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: opts.after != null ? opts.after : 120, before: opts.before || 0, line: 312 },
    children: runs,
  });
}
function bullet(text, P, opts = {}) {
  return new Paragraph({
    bullet: { level: opts.level || 0 },
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 80, line: 312 },
    children: [new TextRun({ text, size: opts.size || 24, color: "000000", font: CYR_BODY })],
  });
}
function numbered(text, reference, opts = {}) {
  return new Paragraph({
    numbering: { reference, level: 0 },
    alignment: AlignmentType.JUSTIFIED,
    spacing: { after: 80, line: 312 },
    children: [new TextRun({ text, size: 24, color: "000000", font: CYR_BODY })],
  });
}

/* Таблица: заголовок + шапка + зебра, горизонтальные линии, проценты ширины */
function makeTable(P, { caption, headers, rows, widths, aligns, headerSize = 20, cellSize = 20 }) {
  const t = P.table;
  const out = [];
  if (caption) {
    out.push(new Paragraph({
      keepNext: true, spacing: { before: 200, after: 80, line: 312 },
      children: [new TextRun({ text: caption, bold: true, size: 21, color: P.secondary, font: CYR_BODY })],
    }));
  }
  const mkCell = (text, i, isHeader, rowIdx) => new TableCell({
    width: { size: widths ? widths[i] : Math.floor(100 / headers.length), type: WidthType.PERCENTAGE },
    margins: { top: 70, bottom: 70, left: 110, right: 110 },
    shading: isHeader
      ? { type: ShadingType.CLEAR, fill: t.headerBg }
      : (rowIdx % 2 === 1 ? { type: ShadingType.CLEAR, fill: t.surface } : undefined),
    children: [new Paragraph({
      alignment: aligns && aligns[i] === "r" ? AlignmentType.RIGHT : AlignmentType.LEFT,
      spacing: { line: 276 },
      children: [new TextRun({
        text: String(text), bold: isHeader, size: isHeader ? headerSize : cellSize,
        color: isHeader ? t.headerText : "000000", font: CYR_BODY,
      })],
    })],
  });
  out.push(new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    layout: TableLayoutType.FIXED,
    borders: {
      top: { style: BorderStyle.SINGLE, size: 8, color: t.accentLine },
      bottom: { style: BorderStyle.SINGLE, size: 8, color: t.accentLine },
      left: NB, right: NB,
      insideHorizontal: { style: BorderStyle.SINGLE, size: 2, color: t.innerLine },
      insideVertical: NB,
    },
    rows: [
      new TableRow({ tableHeader: true, cantSplit: true, children: headers.map((x, i) => mkCell(x, i, true, 0)) }),
      ...rows.map((r, ri) => new TableRow({ cantSplit: true, children: r.map((x, i) => mkCell(x, i, false, ri)) })),
    ],
  }));
  out.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
  return out;
}

/* ── TOC-блок (титул без Heading, поле, подсказка, разрыв) ── */
function tocBlock() {
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 480, after: 360 },
      children: [new TextRun({ text: "Содержание", bold: true, size: 32, font: CYR })],
    }),
    new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-2" }),
    new Paragraph({
      spacing: { before: 200 },
      children: [new TextRun({
        text: "Примечание: содержание построено на кодах полей. После редактирования документа обновите номера страниц: щёлкните по содержанию правой кнопкой мыши и выберите «Обновить поле».",
        italics: true, size: 18, color: "888888", font: CYR_BODY,
      })],
    }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

/* ── Колонтитулы ── */
function runningHeader(title) {
  return new Header({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      border: { bottom: { style: BorderStyle.SINGLE, size: 2, color: "C8C8C8", space: 4 } },
      children: [new TextRun({ text: title, size: 18, color: "808080", font: CYR_BODY })],
    })],
  });
}
function pageFooter() {
  return new Footer({
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ children: [PageNumber.CURRENT], size: 18, color: "808080", font: CYR_BODY })],
    })],
  });
}

/* ── Сборка документа: обложка / фронт-matter (римские) / тело (арабские) ── */
function buildDocument({ coverChildren, bodyChildren, runningTitle, numberingRefs = [] }) {
  const pgSize = { width: 11906, height: 16838 };
  const pgMargin = { top: 1440, bottom: 1440, left: 1701, right: 1417 };
  const numberingConfig = numberingRefs.map((ref) => ({
    reference: ref,
    levels: [{
      level: 0, format: LevelFormat.DECIMAL, text: "%1.", alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 720, hanging: 360 } } },
    }],
  }));
  return new Document({
    creator: "ПРЯМО",
    title: runningTitle,
    styles: {
      default: {
        document: {
          run: { font: CYR_BODY, size: 24, color: "000000" },
          paragraph: { spacing: { line: 312 } },
        },
      },
    },
    numbering: { config: numberingConfig },
    sections: [
      { // 1. Обложка — поля 0, без колонтитулов
        properties: { page: { size: pgSize, margin: { top: 0, bottom: 0, left: 0, right: 0 } } },
        children: coverChildren,
      },
      { // 2. Содержание — римские
        properties: {
          type: SectionType.NEXT_PAGE,
          page: { size: pgSize, margin: pgMargin, pageNumbers: { start: 1, formatType: NumberFormat.UPPER_ROMAN } },
        },
        headers: { default: runningHeader(runningTitle) },
        footers: { default: pageFooter() },
        children: tocBlock(),
      },
      { // 3. Тело — арабские с 1
        properties: {
          type: SectionType.NEXT_PAGE,
          page: { size: pgSize, margin: pgMargin, pageNumbers: { start: 1, formatType: NumberFormat.DECIMAL } },
        },
        headers: { default: runningHeader(runningTitle) },
        footers: { default: pageFooter() },
        children: bodyChildren,
      },
    ],
  });
}

async function writeDocx(doc, outPath) {
  const buf = await Packer.toBuffer(doc);
  fs.writeFileSync(outPath, buf);
  console.log("OK:", outPath, buf.length, "bytes");
}

module.exports = {
  PALETTES, buildCoverR1, buildCoverR2, h1, h2, h3, body, bullet, numbered,
  makeTable, tocBlock, buildDocument, writeDocx, CYR, CYR_BODY,
};
