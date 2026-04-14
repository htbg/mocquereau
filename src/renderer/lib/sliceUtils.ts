// src/renderer/lib/sliceUtils.ts

import type { SyllabifiedWord, StoredImage, SyllableBox } from './models';

// ── flattenSyllables ─────────────────────────────────────────────────────────

/**
 * Returns a flat array of all syllable strings in text order.
 */
export function flattenSyllables(words: SyllabifiedWord[]): string[] {
  return words.flatMap(w => w.syllables);
}

// ── getActiveSyllables ───────────────────────────────────────────────────────

/**
 * Returns sorted array of global syllable indices within range that are NOT gaps.
 */
export function getActiveSyllables(
  range: { start: number; end: number },
  gaps: number[],
): number[] {
  const gapSet = new Set(gaps);
  const result: number[] = [];
  for (let i = range.start; i <= range.end; i++) {
    if (!gapSet.has(i)) result.push(i);
  }
  return result;
}

// ── computeSyllableCuts ──────────────────────────────────────────────────────

/**
 * Crops each syllable's bounding box from the source image using an offscreen canvas.
 * Returns a record mapping global syllable indices → cropped StoredImage or null (gap/absent).
 *
 * @param image        Full source image
 * @param syllableBoxes Record keyed by global syllable index; null value = explicit gap
 * @param syllableRange Range of indices to process [start, end] inclusive
 */
export async function computeSyllableCuts(
  image: StoredImage,
  syllableBoxes: Record<number, SyllableBox | null>,
  syllableRange: { start: number; end: number },
): Promise<Record<number, StoredImage | null>> {
  const cuts: Record<number, StoredImage | null> = {};

  // Collect indices in range that have a box entry (including null = gap)
  const indicesToProcess: number[] = [];
  for (let i = syllableRange.start; i <= syllableRange.end; i++) {
    indicesToProcess.push(i);
  }

  // Identify indices that need actual canvas crops (have a non-null box)
  const cropIndices = indicesToProcess.filter(
    i => i in syllableBoxes && syllableBoxes[i] !== null,
  );

  // Mark all null/absent entries as null (gap) upfront
  for (const i of indicesToProcess) {
    if (!(i in syllableBoxes) || syllableBoxes[i] === null) {
      cuts[i] = null;
    }
  }

  if (cropIndices.length === 0) return cuts;

  // Pre-load image element once (same pattern as before)
  const imgEl = new Image();
  await new Promise<void>((resolve, reject) => {
    imgEl.onload = () => resolve();
    imgEl.onerror = reject;
    imgEl.src = image.dataUrl;
  });

  for (const globalIdx of cropIndices) {
    const box = syllableBoxes[globalIdx] as SyllableBox;  // non-null guaranteed above

    // Convert fractions to pixels
    const sx = Math.round(box.x * image.width);
    const sy = Math.round(box.y * image.height);
    const sw = Math.max(1, Math.round(box.w * image.width));
    const sh = Math.max(1, Math.round(box.h * image.height));

    const canvas = document.createElement('canvas');
    canvas.width = sw;
    canvas.height = sh;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      cuts[globalIdx] = null;
      continue;
    }

    ctx.drawImage(imgEl, sx, sy, sw, sh, 0, 0, sw, sh);

    cuts[globalIdx] = {
      dataUrl: canvas.toDataURL(image.mimeType ?? 'image/png', 0.92),
      width: sw,
      height: sh,
      mimeType: image.mimeType ?? 'image/png',
    };
  }

  return cuts;
}
