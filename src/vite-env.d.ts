/// <reference types="vite/client" />

// Type declaration for Lezer grammar files
declare module "*.grammar" {
  import type { LRParser } from "@lezer/lr";
  export const parser: LRParser;
}

declare module "*.grammar.terms";
