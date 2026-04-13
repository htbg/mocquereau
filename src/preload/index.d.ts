import type { MocquereauAPI } from "../renderer/lib/models";

declare global {
  interface Window {
    mocquereau: MocquereauAPI;
  }
}

export {};
