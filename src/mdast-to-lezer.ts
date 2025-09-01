/**
 * MDAST to Lezer Tree transformer
 * Complete rewrite using unified/unist/mdast ecosystem
 */
import {
  NodeSet,
  NodeType,
  Parser,
  Tree,
  type Input,
  type PartialParse,
  type TreeFragment,
} from "@lezer/common";
import { fromMarkdown } from "mdast-util-from-markdown";
import type { Root } from "mdast";

// Define node types that match mdast exactly
const nodeTypes = [
  NodeType.define({ id: 0, name: "⚠", error: true }),
  NodeType.define({ id: 1, name: "Root", top: true }),
  NodeType.define({ id: 2, name: "Paragraph" }),
  NodeType.define({ id: 3, name: "Text" }),
  NodeType.define({ id: 4, name: "Heading" }),
  NodeType.define({ id: 5, name: "Code" }),
  NodeType.define({ id: 6, name: "Html" }),
  NodeType.define({ id: 7, name: "ThematicBreak" }),
  NodeType.define({ id: 8, name: "Blockquote" }),
  NodeType.define({ id: 9, name: "List" }),
  NodeType.define({ id: 10, name: "ListItem" }),
  NodeType.define({ id: 11, name: "Emphasis" }),
  NodeType.define({ id: 12, name: "Strong" }),
  NodeType.define({ id: 13, name: "InlineCode" }),
  NodeType.define({ id: 14, name: "Link" }),
  NodeType.define({ id: 15, name: "Image" }),
  NodeType.define({ id: 16, name: "CharacterEscape" }),
  NodeType.define({ id: 17, name: "Break" }), // Changed from "HardBreak" to "Break" to match mdast
  NodeType.define({ id: 18, name: "SoftBreak" }),
  NodeType.define({ id: 19, name: "LinkReference" }),
  NodeType.define({ id: 20, name: "ImageReference" }),
  NodeType.define({ id: 21, name: "Definition" }),
] as const;

const nodeSet = new NodeSet(nodeTypes);

/**
 * Convert Input to string
 */
function inputToString(input: Input): string {
  let result = "";
  let pos = 0;
  while (pos < input.length) {
    const chunk = input.chunk(pos);
    result += chunk;
    pos += chunk.length;
  }
  return result;
}

/**
 * Get NodeType from mdast node type
 */
function getNodeTypeFromMdast(nodeType: string): NodeType {
  const typeMap: Record<string, number> = {
    root: 1, // Root
    paragraph: 2, // Paragraph
    text: 3, // Text
    heading: 4, // Heading
    code: 5, // Code
    html: 6, // Html
    thematicBreak: 7, // ThematicBreak
    blockquote: 8, // Blockquote
    list: 9, // List
    listItem: 10, // ListItem
    emphasis: 11, // Emphasis
    strong: 12, // Strong
    inlineCode: 13, // InlineCode
    link: 14, // Link
    image: 15, // Image
    break: 17, // Break (mdast uses "break" for hard line breaks)
    linkReference: 19, // LinkReference
    imageReference: 20, // ImageReference
    definition: 21, // Definition
  };

  const typeId = typeMap[nodeType] ?? 3; // Default to Text for unknown types
  return nodeTypes[typeId];
}

/**
 * Convert mdast node to Lezer Tree
 */
function mdastToLezerTree(node: any, originalText: string): Tree {
  const nodeType = getNodeTypeFromMdast(node.type);
  const children: Tree[] = [];
  const positions: number[] = [];

  // Handle position - mdast uses position.start.offset and position.end.offset
  let from = 0;
  let to = originalText.length;
  
  if (node.position) {
    from = node.position.start?.offset ?? 0;
    to = node.position.end?.offset ?? originalText.length;
  }

  // Process children if they exist
  if (node.children) {
    for (const child of node.children) {
      const childTree = mdastToLezerTree(child, originalText);
      children.push(childTree);
      
      // Position relative to parent
      const childFrom = child.position?.start?.offset ?? from;
      positions.push(Math.max(0, childFrom - from));
    }
  }

  return new Tree(
    nodeType,
    children,
    positions,
    Math.max(0, to - from)
  );
}

/**
 * MDAST-based CommonMark parser
 */
export class MdastCommonMarkParser extends Parser {
  nodeSet = nodeSet;

  createParse(
    input: Input,
    _fragments: readonly TreeFragment[],
    _ranges: readonly { from: number; to: number }[],
  ): PartialParse {
    const inputText = inputToString(input);
    let finished = false;
    let tree: Tree | null = null;

    return {
      advance(): Tree | null {
        if (finished) return tree;

        try {
          // Parse markdown to mdast using unified ecosystem
          const mdastRoot = fromMarkdown(inputText) as Root;
          
          // Convert mdast to Lezer tree
          tree = mdastToLezerTree(mdastRoot, inputText);
          finished = true;
          return tree;
        } catch (error) {
          console.error("Error parsing markdown:", error);
          // Return empty tree on error
          tree = new Tree(nodeTypes[1], [], [], inputText.length); // Root with no children
          finished = true;
          return tree;
        }
      },
      get parsedPos() {
        return finished ? inputText.length : 0;
      },
      get stoppedAt() {
        return null;
      },
      stopAt: () => {},
    };
  }

  parse(input: Input | string): Tree {
    const inputObj: Input =
      typeof input === "string"
        ? {
            length: input.length,
            chunk: (from: number) => input.slice(from),
            lineChunks: false,
            read: (from: number, to: number) => input.slice(from, to),
          }
        : input;

    const parseObj = this.createParse(inputObj, [], []);
    return parseObj.advance() || new Tree(nodeTypes[0], [], [], 0);
  }
}

// Export the parser instance
export const parser = new MdastCommonMarkParser();