// Debug link parsing
import { fromMarkdown } from "mdast-util-from-markdown";
import { parser } from "./dist/es/index.js";

const linkTests = [
  "[link](url)",
  "[foo](/url)",
  "[link](url \"title\")",
  "[link text](url)"
];

for (const markdown of linkTests) {
  console.log(`\n=== Testing: ${markdown} ===`);
  
  // MDAST
  const mdast = fromMarkdown(markdown);
  console.log("MDAST structure:");
  if (mdast.children[0] && mdast.children[0].children) {
    console.log("  Children:", mdast.children[0].children.map((c: any) => `${c.type}(${c.children?.length || 0} children)`));
  }
  
  // Lezer
  const lezerTree = parser.parse(markdown);
  console.log("Lezer tree:", lezerTree.toString());
}