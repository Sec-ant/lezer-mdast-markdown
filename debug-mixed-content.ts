#!/usr/bin/env npx tsx

// Debug script to understand expected mdast structure for mixed content
import { fromMarkdown } from "mdast-util-from-markdown";

const testCases = [
  "foo*bar*", // Text + Emphasis
  "*foo*bar", // Emphasis + Text
  "a*b*c*d*e", // Mixed Text + Emphasis
  "**strong**", // Just Strong
  "text `code` more", // Text + InlineCode + Text
];

for (const text of testCases) {
  console.log(`\n=== ${text} ===`);

  // Show expected mdast structure
  const mdast = fromMarkdown(text);
  console.log("Expected mdast structure:");
  console.log(JSON.stringify(mdast, null, 2));
}
