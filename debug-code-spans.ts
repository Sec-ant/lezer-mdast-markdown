// Debug code spans
import { fromMarkdown } from "mdast-util-from-markdown";
import { parser } from "./dist/es/index.js";

const codeTests = [
  "`foo`",
  "`foo bar`",
  "`` foo ` bar ``"
];

for (const markdown of codeTests) {
  console.log(`\n=== Testing: ${markdown} ===`);
  
  // MDAST
  const mdast = fromMarkdown(markdown);
  console.log("MDAST structure:");
  if (mdast.children[0] && mdast.children[0].children) {
    console.log("  Paragraph children:", mdast.children[0].children.map((c: any) => `${c.type}: "${c.value || 'N/A'}"`));
  }
  
  // Lezer
  const lezerTree = parser.parse(markdown);
  console.log("Lezer tree:", lezerTree.toString());
  
  const cursor = lezerTree.cursor();
  function printStructure(cursor: any, depth = 0) {
    const indent = "  ".repeat(depth);
    const content = markdown.slice(cursor.from, cursor.to);
    console.log(`${indent}${cursor.name} [${cursor.from}-${cursor.to}]: "${content}"`);
    
    if (cursor.firstChild()) {
      do {
        printStructure(cursor, depth + 1);
      } while (cursor.nextSibling());
      cursor.parent();
    }
  }
  printStructure(cursor);
}