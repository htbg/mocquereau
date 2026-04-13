// src/renderer/lib/syllabify.ts
// Syllabification engine for all four Latin hyphenation modes.
//
// Liturgical mode: Hypher with bundled gregorio-project patterns (la-liturgical.ts)
// Classical/Modern modes: `hyphen` npm package (Strategy B, per RESEARCH.md §Strategy B)
// Manual mode: parses user-typed hyphens directly — no Hypher involved.

import Hypher from 'hypher';
import liturgicalPatterns from './patterns/la-liturgical';
import { hyphenateSync as classicalHyphenate } from './patterns/la-classical';
import { hyphenateSync as modernHyphenate } from './patterns/la-modern';
import type { SyllabifiedWord } from './models';

export type HyphenationMode = 'liturgical' | 'classical' | 'modern' | 'manual';

// Instantiate the Hypher engine once at module load (not per call).
const liturgicalEngine = new Hypher(liturgicalPatterns);

/** Normalize Latin ligatures so Hypher patterns match (æ→ae, œ→oe). */
function normalizeLigatures(word: string): string {
  return word
    .replace(/æ/g, 'ae')
    .replace(/œ/g, 'oe')
    .replace(/Æ/g, 'Ae')
    .replace(/Œ/g, 'Oe');
}

/**
 * Split a single word using the hyphen package's hyphenateSync.
 * hyphenateSync returns a string with soft-hyphen characters (U+00AD) at
 * break points. We split on those to get syllables.
 */
function splitWithHyphen(
  word: string,
  fn: (w: string, opts: { hyphenChar: string }) => string
): string[] {
  const HYPHEN_CHAR = '\u00AD'; // soft hyphen
  const result = fn(word, { hyphenChar: HYPHEN_CHAR });
  const parts = result.split(HYPHEN_CHAR).filter(Boolean);
  // If the function returned no splits, return the word as a single syllable.
  return parts.length > 0 ? parts : [word];
}

/**
 * Syllabify a raw Latin text string for the given mode.
 *
 * - liturgical: Hypher with gregorio-project bundled patterns
 * - classical: `hyphen/la-x-classic` package
 * - modern: `hyphen/la` package
 * - manual: parses user-typed hyphens (e.g. "Sanc-tus" → ['Sanc', 'tus'])
 *
 * Returns an empty array for blank/whitespace-only input.
 */
export function syllabifyText(
  raw: string,
  mode: HyphenationMode
): SyllabifiedWord[] {
  if (!raw.trim()) return [];
  const words = raw.trim().split(/\s+/);

  if (mode === 'manual') {
    return words.map((w) => ({
      original: w.replace(/-/g, ''),
      syllables: w.split('-').filter(Boolean),
    }));
  }

  return words.map((w) => {
    let syllables: string[];
    if (mode === 'liturgical') {
      syllables = liturgicalEngine.hyphenate(normalizeLigatures(w));
    } else if (mode === 'classical') {
      syllables = splitWithHyphen(w, classicalHyphenate);
    } else {
      // mode === 'modern'
      syllables = splitWithHyphen(w, modernHyphenate);
    }
    return { original: w, syllables };
  });
}
