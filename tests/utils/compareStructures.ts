// Direct structure comparison - Lezer nodes now match mdast types directly
import { fromMarkdown } from "mdast-util-from-markdown";
import { parser } from "../../src";

export interface NormalizedNode {
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
    // Convert mdast type to expected Lezer capitalized format
    type: capitalizeFirst(node.type),
    from: node.position?.start?.offset || 0,
    to: node.position?.end?.offset || 0,
    content:
      node.value ||
      markdown.slice(
        node.position?.start?.offset || 0,
        node.position?.end?.offset || 0,
      ),
    children: [],
  };

  if (node.children && Array.isArray(node.children)) {
    normalized.children = node.children.map((child) =>
      collectMdast(child as typeof node, markdown),
    );
  }

  return normalized;
}

interface LezerNode {
  type: { name: string };
  from: number;
  to: number;
}

interface LezerTree {
  iterate: (opts: {
    enter: (node: LezerNode) => void;
    leave: (node: LezerNode) => void;
  }) => void;
}

function collectLezer(tree: LezerTree, markdown: string): NormalizedNode {
  const result: NormalizedNode = {
    type: "Root", // Top level should be "Root" to match mdast
    from: 0,
    to: markdown.length,
    content: markdown,
    children: [],
  };

  const stack: NormalizedNode[] = [result];

  tree.iterate({
    enter(node: { type: { name: string }; from: number; to: number }) {
      // Skip the top-level Root node to avoid double nesting
      if (node.type.name === "Root") {
        return;
      }

      // Skip error nodes
      if (node.type.name === "⚠") {
        return;
      }

      const normalized: NormalizedNode = {
        type: node.type.name,
        from: node.from,
        to: node.to,
        content: markdown.slice(node.from, node.to),
        children: [],
      };

      const parent = stack[stack.length - 1];
      parent.children.push(normalized);
      stack.push(normalized);
    },
    leave(node: { type: { name: string } }) {
      if (node.type.name !== "Root" && node.type.name !== "⚠") {
        stack.pop();
      }
    },
  });

  return result;
}

function compareNodes(
  lezerNode: NormalizedNode,
  mdastNode: NormalizedNode,
  path = "",
): { passed: boolean; details: string } {
  const issues: string[] = [];

  if (lezerNode.type !== mdastNode.type) {
    issues.push(
      `${path}: type mismatch - lezer: ${lezerNode.type}, mdast: ${mdastNode.type}`,
    );
  }

  if (lezerNode.from !== mdastNode.from || lezerNode.to !== mdastNode.to) {
    issues.push(
      `${path}: position mismatch - lezer: [${lezerNode.from}, ${lezerNode.to}], mdast: [${mdastNode.from}, ${mdastNode.to}]`,
    );
  }

  // Content comparison - normalize whitespace
  const lezerContent = lezerNode.content.trim();
  const mdastContent = mdastNode.content.trim();
  if (lezerContent !== mdastContent) {
    issues.push(
      `${path}: content mismatch - lezer: "${lezerContent}", mdast: "${mdastContent}"`,
    );
  }

  if (lezerNode.children.length !== mdastNode.children.length) {
    issues.push(
      `${path}: children count mismatch - lezer: ${lezerNode.children.length}, mdast: ${mdastNode.children.length}`,
    );
  }

  // Compare children
  const maxChildren = Math.max(
    lezerNode.children.length,
    mdastNode.children.length,
  );
  for (let i = 0; i < maxChildren; i++) {
    const lezerChild = lezerNode.children[i];
    const mdastChild = mdastNode.children[i];
    const childPath = path ? `${path}[${i}]` : `node[${i}]`;

    if (lezerChild && mdastChild) {
      const childResult = compareNodes(lezerChild, mdastChild, childPath);
      if (!childResult.passed) {
        issues.push(childResult.details);
      }
    } else if (lezerChild) {
      issues.push(`${childPath}: extra lezer node - ${lezerChild.type}`);
    } else if (mdastChild) {
      issues.push(`${childPath}: missing lezer node - ${mdastChild.type}`);
    }
  }

  return {
    passed: issues.length === 0,
    details: issues.join("; "),
  };
}

export function compareStructures(markdown: string): {
  matches: boolean;
  differences: string[];
} {
  try {
    const mdastTree = fromMarkdown(markdown);
    const lezerTree = parser.parse(markdown);

    // Convert both to normalized format
    const mdastNode = collectMdast(mdastTree, markdown);
    const lezerNode = collectLezer(lezerTree, markdown);

    const result = compareNodes(lezerNode, mdastNode, "root");

    return {
      matches: result.passed,
      differences: result.passed ? [] : [result.details],
    };
  } catch (error) {
    return {
      matches: false,
      differences: [
        `Error: ${error instanceof Error ? error.message : String(error)}`,
      ],
    };
  }
}
