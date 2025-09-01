// Debug emphasis failures in detail
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

const emphasisTests = JSON.parse(fs.readFileSync('./tests/fixtures/emphasis-and-strong-emphasis.json', 'utf-8')) as CommonMarkTest[];

// Find a few failing cases
let found = 0;
for (let i = 0; i < emphasisTests.length && found < 3; i++) {
  const test = emphasisTests[i];
  
  try {
    const mdast = fromMarkdown(test.markdown);
    const lezerTree = parser.parse(test.markdown);
    
    // Simple structure comparison
    const mdastHasEmphasis = JSON.stringify(mdast).includes('"emphasis"');
    const mdastHasStrong = JSON.stringify(mdast).includes('"strong"');
    const lezerHasEmphasis = lezerTree.toString().includes('Emphasis');
    const lezerHasStrong = lezerTree.toString().includes('Strong');
    
    // Check if this looks like a mismatch
    if ((mdastHasEmphasis !== lezerHasEmphasis) || (mdastHasStrong !== lezerHasStrong)) {
      found++;
      console.log(`\n=== Mismatch Example ${test.example}: ${JSON.stringify(test.markdown)} ===`);
      console.log(`MDAST has emphasis: ${mdastHasEmphasis}, strong: ${mdastHasStrong}`);  
      console.log(`Lezer has emphasis: ${lezerHasEmphasis}, strong: ${lezerHasStrong}`);
      console.log("Lezer tree:", lezerTree.toString());
      
      // Show what MDAST expects
      if (mdast.children[0] && mdast.children[0].children) {
        console.log("MDAST children types:", mdast.children[0].children.map((c: any) => c.type));
      }
    }
  } catch (error) {
    // Skip errors
  }
}

console.log(`\nFound ${found} potential mismatches to investigate.`);