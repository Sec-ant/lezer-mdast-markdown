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
      node.value !== undefined
        ? node.value
        : markdown.slice(
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

  const stack: { node: NormalizedNode; type: string }[] = [
    { node: result, type: "Root" },
  ];

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

      // Extract content based on node type
      let content = markdown.slice(node.from, node.to);

      // Get parent context
      const parentContext = stack[stack.length - 1];
      const isInsideLink = parentContext?.type === "Link";

      // For nodes that contain processed content, we need to re-process
      if (node.type.name === "InlineCode") {
        // Remove surrounding backticks (can be multiple) and process content
        const match = content.match(/^(`+)(.+?)\1$/s);
        if (match) {
          content = match[2];
        } else {
          // Fallback for edge cases - try to find content between balanced backticks
          let start = 0;
          let end = content.length;
          while (start < content.length && content[start] === "`") start++;
          while (end > 0 && content[end - 1] === "`") end--;
          if (start < end) {
            content = content.slice(start, end);
          }
        }
      } else if (node.type.name === "Code") {
        // Handle both fenced and indented code blocks
        const lines = content.split("\n");
        if (lines.length >= 1) {
          const firstLine = lines[0];

          // Check if it's a fenced code block first
          const fenceMatch = firstLine.match(/^(\s{0,3})(`{3,}|~{3,})/);
          if (fenceMatch) {
            // Fenced code block handling
            const indent = fenceMatch[1];
            const fenceType = fenceMatch[2][0]; // '`' or '~'
            const fenceLength = fenceMatch[2].length;

            // Look for matching closing fence (must be same type, at least same length)
            const closeFencePattern = new RegExp(
              `^\\s{0,3}${fenceType.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}{${fenceLength},}\\s*$`,
            );

            // Find the first line that matches the closing pattern (not last - first match wins)
            let closeIndex = -1;
            for (let i = 1; i < lines.length; i++) {
              if (closeFencePattern.test(lines[i])) {
                closeIndex = i;
                break;
              }
            }

            if (closeIndex > 0) {
              // Extract content between fences
              content = lines.slice(1, closeIndex).join("\n");
            } else {
              // No matching close fence found - include everything after opening fence
              content = lines.slice(1).join("\n");
            }
          } else {
            // Indented code block - remove common leading whitespace (4 spaces minimum)
            // CommonMark: indented code blocks have each line indented by at least 4 spaces
            const processedLines = lines.map(line => {
              // Remove up to 4 leading spaces/tabs (each tab counts as up to 4 spaces)
              let processed = line;
              let removed = 0;
              
              for (let i = 0; i < line.length && removed < 4; i++) {
                if (line[i] === ' ') {
                  removed++;
                  processed = line.slice(i + 1);
                } else if (line[i] === '\t') {
                  removed = 4; // Tab counts as 4 spaces
                  processed = line.slice(i + 1);
                  break;
                } else {
                  break;
                }
              }
              
              return processed;
            });
            
            content = processedLines.join("\n");
          }
        }
      } else if (node.type.name === "Text") {
        // Process backslash escapes only if NOT inside a Link (autolinks preserve backslashes)
        if (!isInsideLink) {
          content = content
            .replace(/\\!/g, "!")
            .replace(/\\"/g, '"')
            .replace(/\\#/g, "#")
            .replace(/\\\$/g, "$")
            .replace(/\\%/g, "%")
            .replace(/\\&/g, "&")
            .replace(/\\'/g, "'")
            .replace(/\\\(/g, "(")
            .replace(/\\\)/g, ")")
            .replace(/\\\*/g, "*")
            .replace(/\\\+/g, "+")
            .replace(/\\,/g, ",")
            .replace(/\\-/g, "-")
            .replace(/\\\./g, ".")
            .replace(/\\\//g, "/")
            .replace(/\\:/g, ":")
            .replace(/\\;/g, ";")
            .replace(/\\</g, "<")
            .replace(/\\=/g, "=")
            .replace(/\\>/g, ">")
            .replace(/\\\?/g, "?")
            .replace(/\\@/g, "@")
            .replace(/\\\[/g, "[")
            .replace(/\\\\/g, "\\")
            .replace(/\\\]/g, "]")
            .replace(/\\\^/g, "^")
            .replace(/\\_/g, "_")
            .replace(/\\`/g, "`")
            .replace(/\\\{/g, "{")
            .replace(/\\\|/g, "|")
            .replace(/\\\}/g, "}")
            .replace(/\\~/g, "~");
        }

        // Process HTML entities
        content = content
          // Numeric character references (decimal)
          .replace(/&#(\d+);/g, (match, num) => {
            const code = parseInt(num, 10);
            return code === 0 ? "�" : String.fromCharCode(code);
          })
          // Numeric character references (hexadecimal)
          .replace(/&#[xX]([0-9a-fA-F]+);/g, (match, hex) => {
            const code = parseInt(hex, 16);
            return code === 0 ? "�" : String.fromCharCode(code);
          })
          // Named entities (basic common ones)
          .replace(/&nbsp;/g, " ")
          .replace(/&amp;/g, "&")
          .replace(/&lt;/g, "<")
          .replace(/&gt;/g, ">")
          .replace(/&quot;/g, '"')
          .replace(/&apos;/g, "'")
          .replace(/&copy;/g, "©")
          .replace(/&reg;/g, "®")
          .replace(/&trade;/g, "™")
          .replace(/&AElig;/g, "Æ")
          .replace(/&Dcaron;/g, "Ď")
          .replace(/&frac34;/g, "¾")
          .replace(/&HilbertSpace;/g, "ℋ")
          .replace(/&DifferentialD;/g, "ⅆ")
          .replace(/&ClockwiseContourIntegral;/g, "∲")
          .replace(/&ngE;/g, "≧̸");
      }

      const normalized: NormalizedNode = {
        type: node.type.name,
        from: node.from,
        to: node.to,
        content: content,
        children: [],
      };

      const parent = stack[stack.length - 1].node;
      parent.children.push(normalized);
      stack.push({ node: normalized, type: node.type.name });
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

  // Content comparison - normalize whitespace and tabs
  const normalizeContent = (content: string) => {
    return content
      .trim()
      // Convert tabs to 4 spaces for comparison (CommonMark tab expansion)
      .replace(/\t/g, "    ")
      // Normalize line endings
      .replace(/\r\n/g, "\n")
      .replace(/\r/g, "\n");
  };

  const lezerContent = normalizeContent(lezerNode.content);
  const mdastContent = normalizeContent(mdastNode.content);
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
