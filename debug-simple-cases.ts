#!/usr/bin/env npx tsx

// Simple test to debug what we're actually generating
import { parseMicromark } from "./src/micromark-integration";

// Simple cases that should generate paragraphs
const testCases = [
  "Hello",
  "Simple text",
  "\\*escaped\\*",
  "*emphasis*",
  "**strong**",
  "`code`",
];

for (const text of testCases) {
  console.log(`\n=== ${text} ===`);

  try {
    const result = parseMicromark(text);
    console.log("Generated tokens:");
    if (result.tokens.length === 0) {
      console.log("  (no tokens generated)");
    }
    for (const token of result.tokens) {
      console.log(
        `  ${token.type} [${token.start}-${token.end}] "${token.value}"`,
      );
    }
  } catch (error) {
    console.error("Error:", error);
  }
}
