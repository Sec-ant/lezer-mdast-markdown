// Debug emphasis failures
import { fromMarkdown } from "mdast-util-from-markdown";
import { parser } from "./dist/es/index.js";
import fs from 'fs';

interface CommonMarkTest {
  markdown: string;
  html: string;
  example: number;
  start_line: number;
  end_line: number;
  section: string;
}

// Test a few emphasis cases
const emphasisTests = JSON.parse(fs.readFileSync('./tests/fixtures/emphasis-and-strong-emphasis.json', 'utf-8')) as CommonMarkTest[];

console.log("Testing first 5 emphasis cases:");

for (let i = 0; i < 5; i++) {
  const test = emphasisTests[i];
  console.log(`\n=== Example ${test.example}: ${JSON.stringify(test.markdown)} ===`);
  
  try {
    // MDAST structure
    const mdast = fromMarkdown(test.markdown);
    console.log("MDAST children:", mdast.children.map((c: any) => c.type));
    if (mdast.children[0] && mdast.children[0].children) {
      console.log("First child children:", mdast.children[0].children.map((c: any) => c.type));
    }
    
    // Lezer structure
    const lezerTree = parser.parse(test.markdown);
    console.log("Lezer tree:", lezerTree.toString());
    
    // Detailed structure
    const cursor = lezerTree.cursor();
    function collectTypes(cursor: any): string[] {
      const types = [cursor.name];
      if (cursor.firstChild()) {
        do {
          types.push(...collectTypes(cursor));
        } while (cursor.nextSibling());
        cursor.parent();
      }
      return types;
    }
    console.log("Lezer types:", collectTypes(cursor));
    
  } catch (error) {
    console.log("Error:", error);
  }
}