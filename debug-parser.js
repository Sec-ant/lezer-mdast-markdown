// Quick debugging script
import { parser } from "./dist/es/index.js";

const test = "# foo *bar* \\*baz\\*";
const tree = parser.parse(test);

console.log("Input:", JSON.stringify(test));
console.log("Tree:");
tree.iterate({
  enter(node) {
    console.log(
      `  ${node.type.name}: [${node.from}, ${node.to}] "${test.slice(node.from, node.to)}"`,
    );
  },
  leave() {},
});

// Also test mdast for comparison
import { fromMarkdown } from "mdast-util-from-markdown";

const mdast = fromMarkdown(test);
console.log("\nMdast:");
console.log(JSON.stringify(mdast, null, 2));
