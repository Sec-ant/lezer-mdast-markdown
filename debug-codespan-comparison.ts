// Test specific comparison issue
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
    // Keep root lowercase to match normalized Lezer output
    type: node.type === 'root' ? 'root' : capitalizeFirst(node.type),
    from: node.position?.start?.offset || 0,
    to: node.position?.end?.offset || 0,
    content: markdown.slice(
      node.position?.start?.offset || 0,
      node.position?.end?.offset || 0,
    ),
    children: [],
  };

  // Special handling for inlineCode - convert value to Text child to match Lezer structure
  if (node.type === 'inlineCode' && node.value !== undefined) {
    normalized.children = [{
      type: 'Text',
      from: normalized.from + 1, // Skip opening backtick
      to: normalized.to - 1,     // Skip closing backtick  
      content: node.value,
      children: []
    }];
  } else if (node.children) {
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

// Test simple code span
const markdown = "`foo`\n";
console.log(`Testing: ${JSON.stringify(markdown)}`);

const mdast = fromMarkdown(markdown);
const lezerTree = parser.parse(markdown);
const cursor = lezerTree.cursor();

const mdastNormalized = collectMdast(mdast, markdown);
const lezerNormalized = normalizeTree(collectLezer(cursor, markdown));

console.log("\n=== MDAST NORMALIZED ===");
console.log(JSON.stringify(mdastNormalized, null, 2));

console.log("\n=== LEZER NORMALIZED ===");
console.log(JSON.stringify(lezerNormalized, null, 2));

function compare(mdastNode: NormalizedNode, lezerNode: NormalizedNode, path = ""): boolean {
  let matches = true;

  if (mdastNode.type !== lezerNode.type) {
    console.log(`${path}: type mismatch - mdast: ${mdastNode.type}, lezer: ${lezerNode.type}`);
    matches = false;
  }

  if (mdastNode.children.length !== lezerNode.children.length) {
    console.log(`${path}: children count mismatch - mdast: ${mdastNode.children.length}, lezer: ${lezerNode.children.length}`);
    matches = false;
  }

  const minChildren = Math.min(mdastNode.children.length, lezerNode.children.length);
  for (let i = 0; i < minChildren; i++) {
    if (!compare(mdastNode.children[i], lezerNode.children[i], `${path}.children[${i}]`)) {
      matches = false;
    }
  }

  return matches;
}

const matches = compare(mdastNormalized, lezerNormalized);
console.log("\n=== COMPARISON ===");
console.log("Matches:", matches);