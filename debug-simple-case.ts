// Debug simple case
import { fromMarkdown } from "mdast-util-from-markdown";
import { parser } from "./dist/es/index.js";

const markdown = "# Hello";

console.log("=== MDAST ===");
const mdast = fromMarkdown(markdown);
console.log(JSON.stringify(mdast, null, 2));

console.log("\n=== LEZER ===");
const lezerTree = parser.parse(markdown);
console.log("Raw tree:", lezerTree.toString());

const cursor = lezerTree.cursor();
function printCursor(cursor: any, depth = 0) {
  const indent = "  ".repeat(depth);
  console.log(`${indent}${cursor.name} [${cursor.from}-${cursor.to}]: "${markdown.slice(cursor.from, cursor.to)}"`);
  
  if (cursor.firstChild()) {
    do {
      printCursor(cursor, depth + 1);
    } while (cursor.nextSibling());
    cursor.parent();
  }
}
printCursor(cursor);