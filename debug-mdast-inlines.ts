// Check how MDAST handles other inline elements
import { fromMarkdown } from "mdast-util-from-markdown";

const tests = [
  "`code`",
  "[link](url)",
  "![image](url)",
  "<http://example.com>",
  "*emphasis*",
  "**strong**"
];

for (const markdown of tests) {
  console.log(`\n=== ${markdown} ===`);
  const mdast = fromMarkdown(markdown);
  const inlineNode = mdast.children[0].children[0];
  console.log(`Type: ${inlineNode.type}`);
  console.log(`Has children: ${!!inlineNode.children}`);
  console.log(`Has value: ${!!inlineNode.value}`);
  if (inlineNode.value) console.log(`Value: "${inlineNode.value}"`);
  if (inlineNode.children) console.log(`Children: ${inlineNode.children.length}`);
}