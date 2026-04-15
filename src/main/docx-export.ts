import {
  Document,
  Packer,
  Table,
  TableRow,
  TableCell,
  Paragraph,
  TextRun,
  ImageRun,
  PageOrientation,
  WidthType,
  BorderStyle,
  AlignmentType,
  VerticalAlign,
  TableLayoutType,
  HeightRule,
} from 'docx';
import { dialog, ipcMain } from 'electron';
import { writeFile } from 'node:fs/promises';
import type { DocxExportPayload, DocxCellData } from '../renderer/lib/models';

// ── Page dimensions ────────────────────────────────────────────────────────────
// A4 landscape: 297mm × 210mm in twentieths-of-a-point (TWIPs)
// 1 inch = 1440 TWIPs; 1 mm ≈ 56.7 TWIPs
const PAGE_WIDTH_TWIPS  = 16838; // 297mm
const PAGE_HEIGHT_TWIPS = 11906; // 210mm
const MARGIN_TWIPS      = 720;   // 12.7mm (~0.5 inch) all sides

// ── Column & row dimensions ───────────────────────────────────────────────────
const META_COL_WIDTH_TWIPS = 1800; // ~32mm — siglum + city + century + folio
const DATA_COL_WIDTH_TWIPS = 680;  // ~12mm per syllable — fits ~20 syllables in landscape A4
const ROW_HEIGHT_TWIPS     = 1008; // ~18mm — uniform for all data rows (D-05)
const HEADER_ROW_HEIGHT    = 360;  // ~6mm for syllable text + accent rows

// ── EMU targets for image scaling ────────────────────────────────────────────
// EMU = English Metric Unit; 1 inch = 914400 EMU; 1 TWIP = 635 EMU
const TARGET_W_EMU = Math.round((DATA_COL_WIDTH_TWIPS / 1440) * 914400);
const TARGET_H_EMU = Math.round((ROW_HEIGHT_TWIPS / 1440) * 914400);

// ── Border helpers ────────────────────────────────────────────────────────────
function wordBorder(): { style: typeof BorderStyle[keyof typeof BorderStyle]; size: number; color: string } {
  return { style: BorderStyle.SINGLE, size: 12, color: '000000' }; // ~1.5pt
}

function innerBorder(): { style: typeof BorderStyle[keyof typeof BorderStyle]; size: number; color: string } {
  return { style: BorderStyle.SINGLE, size: 4, color: '999999' }; // ~0.5pt
}

function cellBorders(isWordBoundary: boolean) {
  const right = isWordBoundary ? wordBorder() : innerBorder();
  const thin = innerBorder();
  return { top: thin, bottom: thin, left: thin, right };
}

// ── Image scaling (object-fit contain) ───────────────────────────────────────
function scaleToFit(cropW: number, cropH: number): { width: number; height: number } {
  if (cropW === 0 || cropH === 0) return { width: TARGET_W_EMU, height: TARGET_H_EMU };
  const scaleW = TARGET_W_EMU / cropW;
  const scaleH = TARGET_H_EMU / cropH;
  const scale  = Math.min(scaleW, scaleH);
  return { width: Math.round(cropW * scale), height: Math.round(cropH * scale) };
}

// ── Meta cell (first column) ──────────────────────────────────────────────────
function buildMetaCell(meta: { siglum: string; city: string; century: string; folio: string }): TableCell {
  return new TableCell({
    children: [
      new Paragraph({
        children: [
          new TextRun({ text: meta.siglum, bold: true, size: 16 }),
          new TextRun({ text: '\n' + meta.city, size: 14, break: 1 }),
          new TextRun({ text: meta.century, size: 14, break: 1 }),
          new TextRun({ text: meta.folio, size: 14, break: 1 }),
        ],
      }),
    ],
    width: { size: META_COL_WIDTH_TWIPS, type: WidthType.DXA },
    verticalAlign: VerticalAlign.TOP,
    borders: cellBorders(false),
    margins: { top: 60, bottom: 60, left: 80, right: 80 },
  });
}

// ── Data cell (syllable column) ───────────────────────────────────────────────
function buildDataCell(cell: DocxCellData): TableCell {
  const isWordBoundary = cell.isWordBoundary;
  let children: Paragraph[];

  if (cell.pngBuffer !== null && !cell.isGap) {
    // Image cell — convert ArrayBuffer (may arrive as Uint8Array via IPC
    // structured clone) to Node Buffer for docx's ImageRun.
    const buf = cell.pngBuffer as ArrayBuffer | Uint8Array | Buffer;
    const nodeBuffer = Buffer.isBuffer(buf)
      ? buf
      : buf instanceof Uint8Array
      ? Buffer.from(buf)
      : Buffer.from(new Uint8Array(buf));
    const dims = scaleToFit(cell.cropWidth, cell.cropHeight);
    children = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new ImageRun({
            type: 'png',
            data: nodeBuffer,
            transformation: {
              width: dims.width,
              height: dims.height,
            },
          }),
        ],
      }),
    ];
  } else if (cell.isGap) {
    // Gap cell — em dash, centered, gray
    children = [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text: '—', color: 'AAAAAA', size: 18 }),
        ],
      }),
    ];
  } else {
    // Unfilled cell — empty
    children = [new Paragraph({ children: [] })];
  }

  return new TableCell({
    children,
    width: { size: DATA_COL_WIDTH_TWIPS, type: WidthType.DXA },
    verticalAlign: VerticalAlign.CENTER,
    borders: cellBorders(isWordBoundary),
    margins: { top: 40, bottom: 40, left: 40, right: 40 },
  });
}

// ── Header rows ───────────────────────────────────────────────────────────────

/** Determine which syllable indices are accented (penultimate syllable of each word ≥2 syllables). */
function buildAccentSet(syllables: string[], wordBoundaries: boolean[]): Set<number> {
  const accentSet = new Set<number>();
  const n = syllables.length;

  // Walk through syllables, collecting words by looking at wordBoundaries.
  // A word ends where wordBoundaries[i] === true (last syllable of word i).
  let wordStart = 0;
  for (let i = 0; i < n; i++) {
    const isEnd = wordBoundaries[i];
    if (isEnd) {
      const wordLen = i - wordStart + 1;
      if (wordLen >= 2) {
        // penultimate syllable = i - 1
        accentSet.add(i - 1);
      }
      wordStart = i + 1;
    }
  }
  // Handle last word if not terminated by a boundary
  if (wordStart < n) {
    const wordLen = n - wordStart;
    if (wordLen >= 2) {
      accentSet.add(n - 2);
    }
  }

  return accentSet;
}

function buildHeaderAccentRow(syllables: string[], wordBoundaries: boolean[]): TableRow {
  const accentSet = buildAccentSet(syllables, wordBoundaries);

  // First cell: empty meta cell
  const metaCell = new TableCell({
    children: [new Paragraph({ children: [] })],
    width: { size: META_COL_WIDTH_TWIPS, type: WidthType.DXA },
    borders: cellBorders(false),
  });

  const syllableCells = syllables.map((_syl, idx) => {
    const isAccent = accentSet.has(idx);
    return new TableCell({
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: isAccent ? [new TextRun({ text: '•', size: 14 })] : [],
        }),
      ],
      width: { size: DATA_COL_WIDTH_TWIPS, type: WidthType.DXA },
      borders: cellBorders(wordBoundaries[idx] ?? false),
    });
  });

  return new TableRow({
    children: [metaCell, ...syllableCells],
    height: { value: HEADER_ROW_HEIGHT, rule: HeightRule.ATLEAST },
    tableHeader: true,
  });
}

function buildHeaderTextRow(syllables: string[], wordBoundaries: boolean[]): TableRow {
  const metaCell = new TableCell({
    children: [new Paragraph({ children: [] })],
    width: { size: META_COL_WIDTH_TWIPS, type: WidthType.DXA },
    borders: cellBorders(false),
  });

  const syllableCells = syllables.map((syl, idx) => {
    return new TableCell({
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [new TextRun({ text: syl, size: 14 })],
        }),
      ],
      width: { size: DATA_COL_WIDTH_TWIPS, type: WidthType.DXA },
      borders: cellBorders(wordBoundaries[idx] ?? false),
    });
  });

  return new TableRow({
    children: [metaCell, ...syllableCells],
    height: { value: HEADER_ROW_HEIGHT, rule: HeightRule.ATLEAST },
    tableHeader: true,
  });
}

// ── Document builder ──────────────────────────────────────────────────────────
function buildDocument(payload: DocxExportPayload): Document {
  const { title, author, rawText, syllables, rows, wordBoundaries } = payload;

  // Header paragraphs (D-02, D-03)
  const titlePara = new Paragraph({
    children: [
      new TextRun({ text: `${title} — ${author}`, bold: true, size: 28 }),
    ],
    spacing: { after: 120 },
  });

  const rawTextPara = new Paragraph({
    children: [
      new TextRun({ text: rawText, italics: true, size: 22 }),
    ],
    spacing: { after: 240 },
  });

  // Table header rows
  const headerAccentRow = buildHeaderAccentRow(syllables, wordBoundaries);
  const headerTextRow   = buildHeaderTextRow(syllables, wordBoundaries);

  // Data rows
  const dataRows = rows.map((row) => {
    const metaCell = buildMetaCell(row.meta);
    const dataCells = row.cells.map((cell) => buildDataCell(cell));
    return new TableRow({
      children: [metaCell, ...dataCells],
      height: { value: ROW_HEIGHT_TWIPS, rule: HeightRule.ATLEAST },
    });
  });

  // Column widths array: first = META, rest = DATA × syllables.length
  const columnWidths = [META_COL_WIDTH_TWIPS, ...Array(syllables.length).fill(DATA_COL_WIDTH_TWIPS)];

  const table = new Table({
    rows: [headerAccentRow, headerTextRow, ...dataRows],
    layout: TableLayoutType.FIXED,
    columnWidths,
    width: { size: 100, type: WidthType.PERCENTAGE },
  });

  // Document: pass portrait dimensions + orientation flag (docx library swaps internally)
  return new Document({
    sections: [
      {
        properties: {
          page: {
            size: {
              width: PAGE_HEIGHT_TWIPS,  // note: swapped — docx requires portrait w/h + orientation
              height: PAGE_WIDTH_TWIPS,
              orientation: PageOrientation.LANDSCAPE,
            },
            margin: {
              top: MARGIN_TWIPS,
              bottom: MARGIN_TWIPS,
              left: MARGIN_TWIPS,
              right: MARGIN_TWIPS,
            },
          },
        },
        children: [titlePara, rawTextPara, table],
      },
    ],
  });
}

// ── IPC handler ───────────────────────────────────────────────────────────────
export function registerDocxExportHandler(): void {
  ipcMain.handle('export:docx', async (_event, payload: DocxExportPayload) => {
    try {
      const doc = buildDocument(payload);
      const buffer = await Packer.toBuffer(doc);

      const { filePath, canceled } = await dialog.showSaveDialog({
        title: 'Exportar tabela neumática',
        defaultPath: `${payload.title || 'tabela'}.docx`,
        filters: [{ name: 'Word Document', extensions: ['docx'] }],
      });

      if (canceled || !filePath) return null;

      await writeFile(filePath, buffer);
      return { filePath };
    } catch (err) {
      console.error('[export:docx]', err);
      return null;
    }
  });
}
