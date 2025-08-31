#!/usr/bin/env npx tsx

// Debug script to understand what tokens are generated for specific examples
import { parseMicromark } from "./src/micromark-integration";

const testCases = [
  {
    name: "Simple emphasis",
    text: "*Hello*",
  },
  {
    name: "Strong text",
    text: "**Hello**",
  },
  {
    name: "Inline code",
    text: "`code`",
  },
  {
    name: "Mix emphasis in paragraph",
    text: "This is *emphasized* text",
  },
];

for (const testCase of testCases) {
  console.log(`\n=== ${testCase.name} ===`);
  console.log(`Text: ${JSON.stringify(testCase.text)}`);

  try {
    const result = parseMicromark(testCase.text);
    console.log("Generated tokens:");
    for (const token of result.tokens) {
      console.log(
        `  ${token.type} [${token.start}-${token.end}] "${token.value}"`,
      );
    }
  } catch (error) {
    console.error("Error:", error);
  }
}
