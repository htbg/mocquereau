// src/renderer/components/slice-editor/LineSidebar.tsx

import type { ManuscriptLine, SyllabifiedWord } from '../../lib/models';
import { flattenSyllables } from '../../lib/sliceUtils';

// ── Props ─────────────────────────────────────────────────────────────────────

interface LineSidebarProps {
  lines: ManuscriptLine[];
  activeLineId: string | null;
  words: SyllabifiedWord[];           // for range label (syllable text)
  totalSyllableCount: number;
  onSelectLine: (lineId: string) => void;
  onAddLine: () => void;
  onRemoveLine: (lineId: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Shows first and last syllable text of the line's range (e.g., "San- … na").
 */
function rangeLabel(line: ManuscriptLine, words: SyllabifiedWord[]): string {
  const allSyllables = flattenSyllables(words);
  const { start, end } = line.syllableRange;
  if (allSyllables.length === 0) return `${start}–${end}`;
  const startText = allSyllables[start] ?? String(start);
  const endText = allSyllables[end] ?? String(end);
  if (startText === endText) return startText;
  return `${startText} … ${endText}`;
}

/**
 * Counts unique syllable indices confirmed across all confirmed lines.
 */
function coveredCount(lines: ManuscriptLine[]): number {
  const covered = new Set<number>();
  for (const line of lines) {
    if (!line.confirmed) continue;
    for (let i = line.syllableRange.start; i <= line.syllableRange.end; i++) {
      covered.add(i);
    }
  }
  return covered.size;
}

// ── Component ─────────────────────────────────────────────────────────────────

export function LineSidebar({
  lines,
  activeLineId,
  words,
  totalSyllableCount,
  onSelectLine,
  onAddLine,
  onRemoveLine,
}: LineSidebarProps) {
  const total = coveredCount(lines);
  const progressPct = Math.round((total / Math.max(1, totalSyllableCount)) * 100);

  return (
    <div className="w-48 flex-shrink-0 flex flex-col border-r border-gray-200 bg-gray-50">
      {/* Header */}
      <div className="px-3 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-200">
        Linhas
      </div>

      {/* Progress bar */}
      <div className="px-3 py-1.5 border-b border-gray-100">
        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
          <span>{total}/{totalSyllableCount} síl.</span>
          <span>{progressPct}%</span>
        </div>
        <div className="h-1 bg-gray-200 rounded">
          <div
            className="h-1 bg-green-400 rounded transition-all"
            style={{ width: `${progressPct}%` }}
          />
        </div>
      </div>

      {/* Line list */}
      <ul className="flex-1 overflow-y-auto">
        {lines.map((line, idx) => {
          const isActive = line.id === activeLineId;
          const statusIcon = line.confirmed ? '✓' : isActive ? '◯' : '○';
          const statusColor = line.confirmed
            ? 'text-green-600'
            : isActive
            ? 'text-amber-500'
            : 'text-gray-400';

          return (
            <li key={line.id} className="group relative">
              <button
                type="button"
                className={[
                  'w-full px-3 py-2 flex flex-row items-center text-left',
                  'border-l-2',
                  isActive
                    ? 'bg-blue-50 border-blue-500'
                    : 'hover:bg-gray-100 border-transparent',
                ].join(' ')}
                onClick={() => onSelectLine(line.id)}
              >
                {/* Thumbnail */}
                <img
                  src={line.image.dataUrl}
                  alt={`Linha ${idx + 1}`}
                  className="w-8 h-8 object-cover rounded flex-shrink-0"
                />

                {/* Text column */}
                <div className="ml-2 flex-1 min-w-0">
                  <div className="text-xs font-medium text-gray-700 truncate">
                    {rangeLabel(line, words)}
                  </div>
                  <div className={`text-xs font-semibold ${statusColor}`}>
                    {statusIcon} {line.confirmed ? 'Confirmada' : isActive ? 'Em edição' : 'Pendente'}
                  </div>
                </div>
              </button>

              {/* Remove button — only visible on hover, not for confirmed lines */}
              {!line.confirmed && (
                <button
                  type="button"
                  aria-label="Remover linha"
                  className="absolute right-1 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 text-xs px-1"
                  onClick={(e) => { e.stopPropagation(); onRemoveLine(line.id); }}
                >
                  ×
                </button>
              )}
            </li>
          );
        })}
      </ul>

      {/* Add line button */}
      <div className="p-2 border-t border-gray-200">
        <button
          type="button"
          className="w-full py-1.5 text-xs text-blue-600 hover:bg-blue-50 rounded border border-dashed border-blue-300"
          onClick={onAddLine}
        >
          + Adicionar linha
        </button>
      </div>
    </div>
  );
}
