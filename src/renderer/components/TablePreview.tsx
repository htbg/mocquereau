// src/renderer/components/TablePreview.tsx

import { useState, useContext, useCallback } from 'react';
import { ProjectContext } from '../hooks/useProject';
import { flattenSyllables } from '../lib/sliceUtils';
import { resolveCellState, isWordBoundary } from '../lib/tableUtils';
import { TableCell } from './table-preview/TableCell';
import { ContextMenu } from './table-preview/ContextMenu';
import type { ManuscriptSource, SyllabifiedWord } from '../lib/models';

// ── Layout constants (D-10, D-11) ───────────────────────────────────────────
const METADATA_COL_WIDTH = 160;
const COL_WIDTH = 64;
const ROW_HEIGHT = 80;
const ACCENT_ROW_HEIGHT = 24;
const SYLLABLE_ROW_HEIGHT = 28;

// ── Accent heuristic (D-02, Claude's discretion) ─────────────────────────────
// Mark penultimate syllable of words with ≥2 syllables as accented.
function buildAccentedSet(words: SyllabifiedWord[]): Set<number> {
  const accented = new Set<number>();
  let cursor = 0;
  for (const word of words) {
    const n = word.syllables.length;
    if (n >= 2) {
      accented.add(cursor + n - 2); // penultimate
    }
    cursor += n;
  }
  return accented;
}

// ── Screen props (matches App.tsx ScreenProps) ───────────────────────────────
interface ScreenProps {
  onNext: () => void;
  onPrev: () => void;
  canGoNext: boolean;
  canGoPrev: boolean;
  onNavigateToEditor?: (sourceId: string) => void;
}

// ── Context menu state ────────────────────────────────────────────────────────
interface MenuState {
  x: number;
  y: number;
  sourceId: string;
  syllableIdx: number;
}

export function TablePreview({ onNext, onPrev, canGoNext, canGoPrev, onNavigateToEditor }: ScreenProps) {
  const { state, dispatch } = useContext(ProjectContext)!;
  const [menu, setMenu] = useState<MenuState | null>(null);

  const project = state.project;

  // ── Empty state ─────────────────────────────────────────────────────────────
  if (!project || project.sources.length === 0) {
    return (
      <div className="flex flex-col h-full p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Tabela Comparativa</h1>
        <p className="text-gray-400 text-sm">Nenhuma fonte adicionada ao projeto.</p>
        <div className="flex-1" />
        <div className="flex justify-between">
          <button
            onClick={onPrev}
            disabled={!canGoPrev}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded disabled:opacity-40 hover:bg-gray-300"
          >Anterior</button>
          <button
            onClick={onNext}
            disabled={!canGoNext}
            className="px-4 py-2 bg-blue-600 text-white rounded disabled:opacity-40 hover:bg-blue-700"
          >Próximo</button>
        </div>
      </div>
    );
  }

  const syllables = flattenSyllables(project.text.words);
  const totalSyllables = syllables.length;
  const accented = buildAccentedSet(project.text.words);

  // Sources sorted by order
  const sources = [...project.sources].sort((a, b) => a.order - b.order);

  // ── Context menu handlers ────────────────────────────────────────────────────
  const handleCellClick = useCallback((e: React.MouseEvent, sourceId: string, syllableIdx: number) => {
    e.stopPropagation();
    setMenu({ x: e.clientX, y: e.clientY, sourceId, syllableIdx });
  }, []);

  const closeMenu = useCallback(() => setMenu(null), []);

  function getMenuSource(): ManuscriptSource | undefined {
    if (!menu) return undefined;
    return sources.find(s => s.id === menu.sourceId);
  }

  function handleEditInEditor() {
    if (!menu) return;
    onNavigateToEditor?.(menu.sourceId);
  }

  function handleRemoveCrop() {
    if (!menu) return;
    const source = getMenuSource();
    if (!source) return;
    // Remove from syllableCuts and from syllableBoxes on all lines
    const newCuts = { ...source.syllableCuts };
    delete newCuts[menu.syllableIdx];
    const newLines = source.lines.map(line => {
      if (!line.syllableBoxes) return line;
      const boxes = { ...line.syllableBoxes };
      delete boxes[menu.syllableIdx];
      return { ...line, syllableBoxes: boxes };
    });
    dispatch({ type: 'UPDATE_SOURCE', payload: { ...source, syllableCuts: newCuts, lines: newLines } });
  }

  function handleMarkAsGap() {
    if (!menu) return;
    const source = getMenuSource();
    if (!source) return;
    // Find the line covering this syllable and toggle its box to null (explicit gap)
    const newLines = source.lines.map(line => {
      const { start, end } = line.syllableRange;
      if (menu.syllableIdx < start || menu.syllableIdx > end) return line;
      const boxes = { ...(line.syllableBoxes ?? {}) };
      // If currently a gap (null), unmark it (remove key → unfilled)
      if (boxes[menu.syllableIdx] === null) {
        delete boxes[menu.syllableIdx];
      } else {
        boxes[menu.syllableIdx] = null;
      }
      return { ...line, syllableBoxes: boxes };
    });
    // Also update syllableCuts: null = gap
    const newCuts = { ...source.syllableCuts };
    const wasGap = newCuts[menu.syllableIdx] === null;
    if (wasGap) {
      delete newCuts[menu.syllableIdx];
    } else {
      newCuts[menu.syllableIdx] = null;
    }
    dispatch({ type: 'UPDATE_SOURCE', payload: { ...source, lines: newLines, syllableCuts: newCuts } });
  }

  // ── Sticky layout: outer div clips, inner div scrolls ───────────────────────
  // Total table width: metadata col + N syllable cols
  const tableWidth = METADATA_COL_WIDTH + totalSyllables * COL_WIDTH;

  return (
    <div className="flex flex-col h-full">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200 bg-white flex-shrink-0">
        <h1 className="text-lg font-semibold text-gray-900">Tabela Comparativa</h1>
        <div className="flex gap-2">
          <button
            onClick={onPrev}
            disabled={!canGoPrev}
            className="px-3 py-1.5 text-sm bg-gray-200 text-gray-700 rounded disabled:opacity-40 hover:bg-gray-300"
          >Anterior</button>
          <button
            onClick={onNext}
            disabled={!canGoNext}
            className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded disabled:opacity-40 hover:bg-blue-700"
          >Próximo</button>
        </div>
      </div>

      {/* ── Scrollable table area ── */}
      <div className="flex-1 overflow-auto">
        <div style={{ width: tableWidth, minWidth: '100%' }}>

          {/* ═══════════════════════════════════════════════════════
              HEADER ROW 1: Accents (D-02)
          ═══════════════════════════════════════════════════════ */}
          <div className="flex sticky top-0 z-20 bg-gray-50 border-b border-gray-300">
            {/* Metadata corner cell */}
            <div
              className="flex-shrink-0 sticky left-0 z-30 bg-gray-50 border-r-2 border-gray-400"
              style={{ width: METADATA_COL_WIDTH, height: ACCENT_ROW_HEIGHT }}
            />
            {/* Accent markers per syllable */}
            {syllables.map((_, idx) => {
              const wb = isWordBoundary(project.text.words, idx);
              return (
                <div
                  key={idx}
                  className="flex-shrink-0 flex items-center justify-center"
                  style={{
                    width: COL_WIDTH,
                    height: ACCENT_ROW_HEIGHT,
                    borderRight: wb ? '2px solid #9ca3af' : '1px solid #e5e7eb',
                  }}
                >
                  {accented.has(idx) && (
                    <span className="text-blue-500 text-xs leading-none" title="Acento principal">&#9679;</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* ═══════════════════════════════════════════════════════
              HEADER ROW 2: Syllable text (D-02)
          ═══════════════════════════════════════════════════════ */}
          <div className="flex sticky z-20 bg-white border-b-2 border-gray-400" style={{ top: ACCENT_ROW_HEIGHT }}>
            {/* Metadata col label */}
            <div
              className="flex-shrink-0 sticky left-0 z-30 bg-white border-r-2 border-gray-400 flex items-center px-2"
              style={{ width: METADATA_COL_WIDTH, height: SYLLABLE_ROW_HEIGHT }}
            >
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wide">Fonte</span>
            </div>
            {/* Syllable text cells */}
            {syllables.map((syl, idx) => {
              const wb = isWordBoundary(project.text.words, idx);
              return (
                <div
                  key={idx}
                  className="flex-shrink-0 flex items-center justify-center overflow-hidden"
                  style={{
                    width: COL_WIDTH,
                    height: SYLLABLE_ROW_HEIGHT,
                    borderRight: wb ? '2px solid #9ca3af' : '1px solid #e5e7eb',
                  }}
                >
                  <span
                    className="text-xs font-mono text-gray-700 truncate px-0.5 select-none"
                    title={syl}
                  >
                    {syl}
                  </span>
                </div>
              );
            })}
          </div>

          {/* ═══════════════════════════════════════════════════════
              DATA ROWS: one per source (D-01, D-04, D-05)
          ═══════════════════════════════════════════════════════ */}
          {sources.map(source => (
            <div key={source.id} className="flex border-b border-gray-200 hover:bg-gray-50/30">

              {/* ── Sticky metadata cell (D-01, D-08) ── */}
              <div
                className="flex-shrink-0 sticky left-0 z-10 bg-white border-r-2 border-gray-400 flex flex-col justify-center px-2 py-1 gap-0.5"
                style={{ width: METADATA_COL_WIDTH, height: ROW_HEIGHT }}
              >
                <span className="text-sm font-semibold text-gray-900 truncate" title={source.metadata.siglum}>
                  {source.metadata.siglum}
                </span>
                <span className="text-xs text-gray-500 truncate" title={source.metadata.city}>
                  {source.metadata.city}
                </span>
                <span className="text-xs text-gray-400 truncate">
                  {source.metadata.century}
                </span>
                {source.metadata.folio && (
                  <span className="text-xs text-gray-400 truncate" title={`Fólio ${source.metadata.folio}`}>
                    f. {source.metadata.folio}
                  </span>
                )}
              </div>

              {/* ── Syllable cells ── */}
              {syllables.map((_, idx) => {
                const cellState = resolveCellState(source, idx);
                const wb = isWordBoundary(project.text.words, idx);
                return (
                  <TableCell
                    key={idx}
                    state={cellState}
                    isWordBoundary={wb}
                    colWidthPx={COL_WIDTH}
                    rowHeightPx={ROW_HEIGHT}
                    onClick={e => handleCellClick(e, source.id, idx)}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* ── Context menu (D-06) ── */}
      {menu && (() => {
        const src = getMenuSource();
        if (!src) return null;
        const cellState = resolveCellState(src, menu.syllableIdx);
        return (
          <ContextMenu
            x={menu.x}
            y={menu.y}
            hasCrop={cellState.kind === 'filled'}
            isGap={cellState.kind === 'gap'}
            onEditInEditor={handleEditInEditor}
            onRemoveCrop={handleRemoveCrop}
            onMarkAsGap={handleMarkAsGap}
            onClose={closeMenu}
          />
        );
      })()}
    </div>
  );
}
