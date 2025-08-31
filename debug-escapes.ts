#!/usr/bin/env npx tsx

// Test character escape support
import { parseMicromark } from "./src/micromark-integration";

const text = "\\*not emphasized\\*";

console.log(`Text: ${JSON.stringify(text)}`);

try {
  const result = parseMicromark(text);
  console.log("Generated tokens:");
  for (const token of result.tokens) {
    console.log(
      `  ${token.type} [${token.start}-${token.end}] "${token.value}"`,
    );
  }
} catch (error) {
  console.error("Error:", error);
}
