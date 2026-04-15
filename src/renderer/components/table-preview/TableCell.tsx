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

  // CSS background-position formula (same as SlicePreviewCell, D-04 / per Phase 5.1 pattern)
  let bgSize = '';
  let bgPos = '';
  let bgUrl = '';
  if (state.kind === 'filled') {
    const { box, image } = state;
    const bgSizeX = (1 / box.w) * 100;
    const bgSizeY = (1 / box.h) * 100;
    const bgPosX  = (-box.x / box.w) * 100;
    const bgPosY  = (-box.y / box.h) * 100;
    bgSize = `${bgSizeX}% ${bgSizeY}%`;
    bgPos  = `${bgPosX}% ${bgPosY}%`;
    bgUrl  = image.dataUrl;
  }

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
      {/* ── Filled: CSS background-position crop (D-04) ── */}
      {state.kind === 'filled' && (
        <div
          className="w-full h-full bg-no-repeat"
          style={{
            backgroundImage: `url(${bgUrl})`,
            backgroundSize: bgSize,
            backgroundPosition: bgPos,
          }}
        />
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
      {showTooltip && state.kind === 'filled' && (
        <div
          className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 rounded shadow-lg border border-gray-200 bg-white p-1 pointer-events-none"
          style={{ width: 160, height: 120 }}
        >
          <div
            className="w-full h-full bg-no-repeat"
            style={{
              backgroundImage: `url(${bgUrl})`,
              backgroundSize: bgSize,
              backgroundPosition: bgPos,
            }}
          />
        </div>
      )}
    </div>
  );
}
