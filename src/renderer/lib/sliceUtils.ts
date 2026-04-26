// src/renderer/lib/sliceUtils.ts

import type { SyllabifiedWord, StoredImage, SyllableBox, ImageAdjustments } from './models';
import { buildImageFilter } from './image-adjustments';

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
 * When `adjustments` is provided, the canvas bakes the visual adjustments into the
 * PNG output (so DOCX export reflects what the user sees in SliceEditor/TablePreview):
 *   - Color filter (brightness/contrast/saturation/grayscale/invert) via `ctx.filter`.
 *   - Geometric transform (rotation any angle + flipH + flipV) via `ctx` transforms;
 *     output canvas dimensions = AABB of the rotated source rectangle (Phase 12 / DOCX-08).
 * The stored `SyllableBox` coords stay canonical (Phase 10 D-04); adjustments are
 * purely applied at render/crop time, never mutating the source `image.dataUrl`.
 *
 * @param image        Full source image
 * @param syllableBoxes Record keyed by global syllable index; null value = explicit gap
 * @param syllableRange Range of indices to process [start, end] inclusive
 * @param adjustments  Optional per-line image adjustments (Phase 10 / IMG-06)
 */
export async function computeSyllableCuts(
  image: StoredImage,
  syllableBoxes: Record<number, SyllableBox | null>,
  syllableRange: { start: number; end: number },
  adjustments?: ImageAdjustments,
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

  // Pre-compute adjustment flags
  const hasAdj = adjustments !== undefined;
  const rot = hasAdj ? adjustments!.rotation : 0;
  const flipH = hasAdj ? adjustments!.flipH : false;
  const flipV = hasAdj ? adjustments!.flipV : false;
  const needsGeometric = rot !== 0 || flipH || flipV;
  const filterStr = hasAdj ? buildImageFilter(adjustments) : undefined;
  // AABB factors for arbitrary rotation: rotated rect (sw × sh) by θ has bounding
  // box (sw·|cos θ| + sh·|sin θ|, sw·|sin θ| + sh·|cos θ|). Reduces to identity
  // for cardinals (0°/180° → sw×sh; 90°/270° → sh×sw).
  const θ = (rot * Math.PI) / 180;
  const absCos = Math.abs(Math.cos(θ));
  const absSin = Math.abs(Math.sin(θ));

  for (const globalIdx of cropIndices) {
    const box = syllableBoxes[globalIdx] as SyllableBox;  // non-null guaranteed above

    // Convert canonical fractions to pixels
    const sx = Math.round(box.x * image.width);
    const sy = Math.round(box.y * image.height);
    const sw = Math.max(1, Math.round(box.w * image.width));
    const sh = Math.max(1, Math.round(box.h * image.height));

    // Output dimensions: AABB of the rotated source rect (works for any θ,
    // including cardinals where it reduces to sw×sh or sh×sw).
    const outW = needsGeometric && rot !== 0
      ? Math.max(1, Math.ceil(sw * absCos + sh * absSin))
      : sw;
    const outH = needsGeometric && rot !== 0
      ? Math.max(1, Math.ceil(sw * absSin + sh * absCos))
      : sh;

    const canvas = document.createElement('canvas');
    canvas.width = outW;
    canvas.height = outH;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      cuts[globalIdx] = null;
      continue;
    }

    // Apply color filter (brightness/contrast/saturate/grayscale/invert)
    if (filterStr) ctx.filter = filterStr;

    if (needsGeometric) {
      // Translate to output center, apply rotation + flips, then draw centered
      // using the canonical crop dimensions (sw × sh). Output dims (outW × outH)
      // already account for rotation swap.
      ctx.translate(outW / 2, outH / 2);
      if (rot !== 0) ctx.rotate((rot * Math.PI) / 180);
      ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
      ctx.drawImage(imgEl, sx, sy, sw, sh, -sw / 2, -sh / 2, sw, sh);
    } else {
      ctx.drawImage(imgEl, sx, sy, sw, sh, 0, 0, sw, sh);
    }

    cuts[globalIdx] = {
      dataUrl: canvas.toDataURL(image.mimeType ?? 'image/png', 0.92),
      width: outW,
      height: outH,
      mimeType: image.mimeType ?? 'image/png',
    };
  }

  return cuts;
}
