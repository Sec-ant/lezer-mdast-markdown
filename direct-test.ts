// Test using built files
import { fromMarkdown } from "mdast-util-from-markdown";
import { parser } from "./dist/es/index.js";

// Test a simple case first
const markdown = "# Hello";
const tree = parser.parse(markdown);
console.log("Lezer tree:", tree.toString());

const mdast = fromMarkdown(markdown);
console.log("MDAST:", JSON.stringify(mdast, null, 2));