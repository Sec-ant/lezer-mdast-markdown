// Test just emphasis
import { parser } from "./dist/es/index.js";

const tests = ["*emphasis*", "foo*bar*"];

for (const markdown of tests) {
  console.log(`\nTesting: ${markdown}`);
  const lezerTree = parser.parse(markdown);
  console.log("Lezer tree:", lezerTree.toString());

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
}