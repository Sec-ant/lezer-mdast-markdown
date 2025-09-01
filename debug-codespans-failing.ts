// Debug specific code span failures
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

// Test first few code span cases
const codeSpanTests = JSON.parse(fs.readFileSync('./tests/fixtures/code-spans.json', 'utf-8')) as CommonMarkTest[];

console.log("Testing first 3 failing code span cases:");

for (let i = 0; i < 3; i++) {
  const test = codeSpanTests[i];
  console.log(`\n=== Example ${test.example}: ${JSON.stringify(test.markdown)} ===`);
  
  // MDAST
  const mdast = fromMarkdown(test.markdown);
  console.log("MDAST:");
  console.log(JSON.stringify(mdast, null, 2));
  
  // Lezer
  const lezerTree = parser.parse(test.markdown);
  console.log("Lezer tree:", lezerTree.toString());
}