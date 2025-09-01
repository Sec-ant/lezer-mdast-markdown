// Debug comparison 
import { fromMarkdown } from "mdast-util-from-markdown";
import { parser } from "./dist/es/index.js";

interface NormalizedNode {
  type: string;
  from: number;
  to: number;
  content: string;
  children: NormalizedNode[];
}

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

function collectMdast(
  node: {
    type: string;
    position?: { start?: { offset?: number }; end?: { offset?: number } };
    value?: string;
    children?: unknown[];
  },
  markdown: string,
): NormalizedNode {
  const normalized: NormalizedNode = {
    type: capitalizeFirst(node.type),
    from: node.position?.start?.offset || 0,
    to: node.position?.end?.offset || 0,
    content: markdown.slice(
      node.position?.start?.offset || 0,
      node.position?.end?.offset || 0,
    ),
    children: [],
  };

  if (node.children) {
    normalized.children = node.children.map((child) =>
      collectMdast(child as any, markdown),
    );
  }

  return normalized;
}

function collectLezer(
  cursor: any,
  markdown: string,
): NormalizedNode {
  const node: NormalizedNode = {
    type: cursor.name,
    from: cursor.from,
    to: cursor.to,
    content: markdown.slice(cursor.from, cursor.to),
    children: [],
  };

  if (cursor.firstChild()) {
    do {
      node.children.push(collectLezer(cursor, markdown));
    } while (cursor.nextSibling());
    cursor.parent();
  }

  return node;
}

function normalizeTree(tree: NormalizedNode): NormalizedNode {
  // Convert Root to root to match mdast
  if (tree.type === "Root") {
    tree.type = "root";
  }

  const filtered = tree.children.filter((child) => {
    return !child.type.endsWith("Marker") && 
           !child.type.endsWith("Open") && 
           !child.type.endsWith("Close") &&
           child.type !== "⚠";
  });

  return {
    ...tree,
    children: filtered.map(normalizeTree),
  };
}

// Test with simple case
const markdown = "# Hello";
const mdast = fromMarkdown(markdown);
const lezerTree = parser.parse(markdown);
const cursor = lezerTree.cursor();

console.log("=== MDAST NORMALIZED ===");
const mdastNormalized = collectMdast(mdast, markdown);
console.log(JSON.stringify(mdastNormalized, null, 2));

console.log("\n=== LEZER NORMALIZED ===");
const lezerNormalized = normalizeTree(collectLezer(cursor, markdown));
console.log(JSON.stringify(lezerNormalized, null, 2));

console.log("\n=== COMPARISON ===");
console.log("MDAST root type:", mdastNormalized.type);
console.log("Lezer root type:", lezerNormalized.type);
console.log("Types match:", mdastNormalized.type === lezerNormalized.type);

if (mdastNormalized.children.length > 0 && lezerNormalized.children.length > 0) {
  console.log("MDAST child type:", mdastNormalized.children[0].type);
  console.log("Lezer child type:", lezerNormalized.children[0].type);
  console.log("Child types match:", mdastNormalized.children[0].type === lezerNormalized.children[0].type);
}