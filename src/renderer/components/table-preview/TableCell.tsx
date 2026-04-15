// src/renderer/components/table-preview/TableCell.tsx

import { useState, useRef } from 'react';
import type { CellState } from '../../lib/tableUtils';

export interface TableCellProps {
  state: CellState;
  /** If true, renders 2px right border (word boundary, D-05). Otherwise 1px. */
  isWordBoundary: boolean;
  /** Column width in pixels — cells are uniform (D-11). */
  colWidthPx: number;
  /** Row height in pixels — uniform (D-10). */
  rowHeightPx: number;
  /** Called when cell is clicked — opens context menu (D-06). */
  onClick: (e: React.MouseEvent) => void;
}

export function TableCell({
  state,
  isWordBoundary,
  colWidthPx,
  rowHeightPx,
  onClick,
}: TableCellProps) {
  const [showTooltip, setShowTooltip] = useState(false);
  const cellRef = useRef<HTMLDivElement>(null);

  // Sanity check for filled state: reject invalid boxes and missing image
  const filledOk =
    state.kind === 'filled' &&
    !!state.image &&
    !!state.image.dataUrl &&
    state.image.dataUrl.startsWith('data:') &&
    state.box.w > 0 &&
    state.box.h > 0;

  // Word border: 2px solid gray-400 | intra-word: 1px solid gray-200 (D-05)
  const borderRight = isWordBoundary
    ? '2px solid #9ca3af'   // gray-400
    : '1px solid #e5e7eb';  // gray-200

  return (
    <div
      ref={cellRef}
      className="relative flex-shrink-0 flex items-center justify-center cursor-pointer select-none border-b border-gray-200"
      style={{
        width: colWidthPx,
        height: rowHeightPx,
        borderRight,
      }}
      onClick={onClick}
      onMouseEnter={() => state.kind === 'filled' && setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
      title={
        state.kind === 'gap'      ? 'Sem neuma neste manuscrito' :
        state.kind === 'unfilled' ? 'Recorte pendente'           : undefined
      }
    >
      {/* ── Filled: <img> scaled and positioned to show only the box region ── */}
      {state.kind === 'filled' && filledOk && (
        <div className="w-full h-full overflow-hidden relative">
          <img
            src={state.image.dataUrl}
            alt=""
            draggable={false}
            className="absolute pointer-events-none"
            style={{
              // Image scaled so that the box occupies the full cell.
              // box fractions are 0-1 of the full image.
              width: `${100 / state.box.w}%`,
              height: `${100 / state.box.h}%`,
              left: `${(-state.box.x / state.box.w) * 100}%`,
              top: `${(-state.box.y / state.box.h) * 100}%`,
              maxWidth: 'none',
            }}
          />
        </div>
      )}
      {/* Fallback when filled state is malformed — show error indicator */}
      {state.kind === 'filled' && !filledOk && (
        <span className="text-orange-400 text-xs">?</span>
      )}

      {/* ── Gap: em dash in gray (D-04) ── */}
      {state.kind === 'gap' && (
        <span className="text-gray-400 text-sm font-medium select-none">—</span>
      )}

      {/* ── Unfilled: dashed border + plus icon (D-04) ── */}
      {state.kind === 'unfilled' && (
        <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-sm m-1">
          <span className="text-gray-300 text-lg leading-none">+</span>
        </div>
      )}

      {/* ── Hover tooltip: enlarged crop (D-07) ── */}
      {showTooltip && state.kind === 'filled' && filledOk && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 rounded shadow-lg border border-gray-200 bg-white p-1 pointer-events-none"
          style={{ width: 240, height: 180 }}
        >
          <div className="w-full h-full overflow-hidden relative">
            <img
              src={state.image.dataUrl}
              alt=""
              className="absolute"
              style={{
                width: `${100 / state.box.w}%`,
                height: `${100 / state.box.h}%`,
                left: `${(-state.box.x / state.box.w) * 100}%`,
                top: `${(-state.box.y / state.box.h) * 100}%`,
                maxWidth: 'none',
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
