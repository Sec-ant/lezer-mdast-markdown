#!/usr/bin/env tsx

import { fromMarkdown } from "mdast-util-from-markdown";
import { parser } from "./dist/es";
import { compareStructures } from "./tests/utils/compareStructures";

// Test cases for analysis
const testCases = [
  // Simple emphasis
  "*foo*",
  "**foo**",
  // Simple links
  "[foo](/url)",
  // Fenced code blocks
  "```\nfoo\n```",
  // HTML blocks
  "<div>\nfoo\n</div>",
  // Complex list
  "- foo\n- bar",
  // Setext headings
  "foo\n===",
];

console.log("=== Analysis of failing patterns ===\n");

testCases.forEach((markdown, i) => {
  console.log(`\n--- Test ${i + 1}: ${JSON.stringify(markdown)} ---`);

  try {
    const result = compareStructures(markdown);
    console.log("Matches:", result.matches);

    if (!result.matches) {
      console.log("Issues:", result.differences.join("; "));

      // Show expected vs actual structure
      const mdastTree = fromMarkdown(markdown);
      const lezerTree = parser.parse(markdown);

      console.log(
        "\nExpected (mdast):",
        JSON.stringify(mdastTree, null, 2).substring(0, 500),
      );

      // Print lezer tree structure
      console.log("\nActual (lezer):");
      let depth = 0;
      lezerTree.iterate({
        enter(node) {
          const indent = "  ".repeat(depth);
          console.log(
            `${indent}${node.type.name} [${node.from}-${node.to}]: "${markdown.slice(node.from, node.to).replace(/\n/g, "\\n")}"`,
          );
          depth++;
        },
        leave() {
          depth--;
        },
      });
    }
  } catch (error) {
    console.log("Error:", error.message);
  }
});
