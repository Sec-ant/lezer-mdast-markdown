// Debug one failing case in detail
import { fromMarkdown } from "mdast-util-from-markdown";
import { parser } from "./dist/es/index.js";

// This one should fail: "a * foo bar*\n"
const markdown = "a * foo bar*\n";

console.log(`Testing: ${JSON.stringify(markdown)}`);

// MDAST
const mdast = fromMarkdown(markdown);
console.log("\n=== MDAST ===");
console.log(JSON.stringify(mdast, null, 2));

// Lezer
const lezerTree = parser.parse(markdown);
console.log("\n=== LEZER ===");
console.log("Tree:", lezerTree.toString());

const cursor = lezerTree.cursor();
function printDetail(cursor: any, depth = 0) {
  const indent = "  ".repeat(depth);
  const content = markdown.slice(cursor.from, cursor.to).replace(/\n/g, '\\n');
  console.log(`${indent}${cursor.name} [${cursor.from}-${cursor.to}]: "${content}"`);
  
  if (cursor.firstChild()) {
    do {
      printDetail(cursor, depth + 1);
    } while (cursor.nextSibling());
    cursor.parent();
  }
}
printDetail(cursor);