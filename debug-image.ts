// Check image properties
import { fromMarkdown } from "mdast-util-from-markdown";

const markdown = "![alt text](image.png)";
const mdast = fromMarkdown(markdown);
const imageNode = mdast.children[0].children[0];

console.log("Image node:");
console.log(JSON.stringify(imageNode, null, 2));