// Count single vs mixed emphasis cases
import { fromMarkdown } from "mdast-util-from-markdown";
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

let singleElementCases = 0;
let mixedContentCases = 0;
let totalEmphasisStrong = 0;

for (const test of emphasisTests) {
  try {
    const mdast = fromMarkdown(test.markdown);
    
    // Check if this has emphasis or strong
    const hasEmphasisOrStrong = JSON.stringify(mdast).includes('"emphasis"') || JSON.stringify(mdast).includes('"strong"');
    
    if (hasEmphasisOrStrong) {
      totalEmphasisStrong++;
      
      // Check if paragraph has only one child (single element)
      if (mdast.children.length === 1 && mdast.children[0].children) {
        if (mdast.children[0].children.length === 1) {
          singleElementCases++;
        } else {
          mixedContentCases++;
        }
      } else {
        mixedContentCases++; // Multiple paragraphs or complex structure
      }
    }
  } catch (error) {
    // Skip errors
  }
}

console.log(`Total emphasis/strong cases: ${totalEmphasisStrong}`);
console.log(`Single element cases: ${singleElementCases} (${(singleElementCases/totalEmphasisStrong*100).toFixed(1)}%)`);
console.log(`Mixed content cases: ${mixedContentCases} (${(mixedContentCases/totalEmphasisStrong*100).toFixed(1)}%)`);
console.log(`If single element cases work perfectly, potential pass rate: ${(singleElementCases/132*100).toFixed(1)}%`);