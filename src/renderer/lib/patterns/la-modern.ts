// src/renderer/lib/patterns/la-modern.ts
// Modern Latin hyphenation patterns.
//
// Decision: Using the `hyphen` npm package (hyphen/la) for modern patterns.
// See la-classical.ts for rationale.
export { hyphenateSync } from 'hyphen/la';
