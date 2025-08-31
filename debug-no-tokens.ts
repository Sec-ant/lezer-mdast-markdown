#!/usr/bin/env npx tsx

// Debug cases that generate no tokens
import { parseMicromark } from "./src/micromark-integration";

// Test cases that might generate no tokens
const testCases = [
  "Simple text",
  "Text with\nline break",
  "Multiple\n\nlines",
  "", // Empty
  "\n", // Just newline
  "   ", // Just spaces
];

for (const text of testCases) {
  console.log(`\n=== ${JSON.stringify(text)} ===`);

  try {
    const result = parseMicromark(text);
    console.log(`Generated ${result.tokens.length} tokens:`);
    for (const token of result.tokens) {
      console.log(
        `  ${token.type} [${token.start}-${token.end}] ${JSON.stringify(token.value)}`,
      );
    }
  } catch (error) {
    console.error("Error:", error);
  }
}
