// src/renderer/components/slice-editor/SlicePreview.tsx

import { SlicePreviewCell } from './SlicePreviewCell';
import { flattenSyllables, getActiveSyllables } from '../../lib/sliceUtils';
import type { StoredImage, SyllabifiedWord } from '../../lib/models';

interface SlicePreviewProps {
  image: StoredImage | null;
  words: SyllabifiedWord[];
  dividers: number[];          // fractions 0.0–1.0
  syllableRange: { start: number; end: number } | null;
  gaps: number[];
  hoveredSyllableIdx: number | null;
  onHover: (idx: number | null) => void;
}

export function SlicePreview({
  image,
  words,
  dividers,
  syllableRange,
  gaps,
  hoveredSyllableIdx,
  onHover,
}: SlicePreviewProps) {
  const allSyllables = flattenSyllables(words);

  // Build word boundary set: global indices that are the LAST syllable of a word
  const wordBoundarySet = new Set<number>();
  let offset = 0;
  for (const w of words) {
    offset += w.syllables.length;
    wordBoundarySet.add(offset - 1);
  }

  const activeSyllables = syllableRange ? getActiveSyllables(syllableRange, gaps) : [];
  // Full boundary fractions: [0, div0, div1, ..., divN-1, 1]
  const boundaries = [0, ...dividers, 1];
  const gapSet = new Set(gaps);

  const cells: React.ReactNode[] = [];

  if (syllableRange && image) {
    for (let globalIdx = syllableRange.start; globalIdx <= syllableRange.end; globalIdx++) {
      const isGap = gapSet.has(globalIdx);
      const sliceIdxAmongActive = activeSyllables.indexOf(globalIdx);
      const syllableText = allSyllables[globalIdx] ?? '?';
      const isWordBoundaryRight = wordBoundarySet.has(globalIdx);
      const isHovered = globalIdx === hoveredSyllableIdx;

      if (isGap) {
        cells.push(
          <div
            key={globalIdx}
            className={[
              'flex flex-col items-center flex-shrink-0',
              isWordBoundaryRight ? 'border-r-2 border-gray-500' : 'border-r border-gray-300',
            ].join(' ')}
            style={{ minWidth: 40 }}
          >
            <div className="text-xs px-1 py-0.5 font-mono text-gray-400">{syllableText}</div>
            <div className="w-full h-14 bg-gray-100 flex items-center justify-center text-gray-400 text-sm">—</div>
          </div>
        );
      } else if (sliceIdxAmongActive >= 0) {
        const sliceLeftFrac = boundaries[sliceIdxAmongActive] ?? 0;
        const sliceRightFrac = boundaries[sliceIdxAmongActive + 1] ?? 1;
        cells.push(
          <SlicePreviewCell
            key={globalIdx}
            syllableText={syllableText}
            globalIdx={globalIdx}
            image={image}
            sliceLeftFrac={sliceLeftFrac}
            sliceRightFrac={sliceRightFrac}
            isHovered={isHovered}
            isWordBoundaryRight={isWordBoundaryRight}
            onHover={onHover}
          />
        );
      }
    }
  }

  return (
    <div className="flex flex-col border-t border-gray-200 bg-white">
      <div className="px-3 py-1 text-xs font-semibold text-gray-500 uppercase tracking-wide border-b border-gray-100">
        Preview dos recortes
      </div>
      <div className="flex flex-row overflow-x-auto py-1 px-2 min-h-[5rem]">
        {cells.length > 0 ? cells : (
          <div className="flex items-center text-xs text-gray-400 px-2">
            Defina o range de sílabas para ver o preview.
          </div>
        )}
      </div>
    </div>
  );
}
