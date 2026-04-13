// src/renderer/lib/patterns/la-classical.ts
// Classical Latin hyphenation patterns.
//
// Decision: Using the `hyphen` npm package (hyphen/la-x-classic) for classical
// and modern patterns, as documented in RESEARCH.md §Strategy B.
// The gregorio-project TeX .txt pattern files require complex conversion tooling
// that is not available in this environment. The `hyphen` package (v1.14.1)
// provides actively-maintained pre-converted patterns from the same source.
//
// This module re-exports the hyphenateSync function from hyphen/la-x-classic
// as an adapter so syllabify.ts can treat it uniformly with the Hypher engine.
export { hyphenateSync } from 'hyphen/la-x-classic';
