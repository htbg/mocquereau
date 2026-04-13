// Type declarations for third-party packages without @types definitions

declare module 'hypher' {
  interface HypherPattern {
    id?: string | string[];
    leftmin?: number;
    rightmin?: number;
    patterns: Record<number | string, string>;
  }

  class Hypher {
    constructor(pattern: HypherPattern);
    hyphenate(word: string): string[];
    hyphenateText(text: string, leftmin?: number, rightmin?: number): string;
  }

  export = Hypher;
}

declare module 'hyphen/la-x-classic' {
  interface HyphenOptions {
    hyphenChar?: string;
    minWordLength?: number;
    exceptions?: string[];
  }
  export function hyphenateSync(text: string, options?: HyphenOptions): string;
  export function hyphenate(text: string, options?: HyphenOptions): Promise<string>;
}

declare module 'hyphen/la' {
  interface HyphenOptions {
    hyphenChar?: string;
    minWordLength?: number;
    exceptions?: string[];
  }
  export function hyphenateSync(text: string, options?: HyphenOptions): string;
  export function hyphenate(text: string, options?: HyphenOptions): Promise<string>;
}

declare module 'hyphen/la-x-liturgic' {
  interface HyphenOptions {
    hyphenChar?: string;
    minWordLength?: number;
    exceptions?: string[];
  }
  export function hyphenateSync(text: string, options?: HyphenOptions): string;
  export function hyphenate(text: string, options?: HyphenOptions): Promise<string>;
}
