/**
 * Direct micromark-to-Lezer parser implementation
 * Following @lezer/markdown approach - no LR grammar, direct tree generation
 */
import {
  type Input,
  NodeSet,
  NodeType,
  Parser,
  type PartialParse,
  Tree,
  type TreeFragment,
} from "@lezer/common";
import { parse, postprocess, preprocess } from "micromark";

// Define node types that match mdast structure
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
  NodeType.define({ id: 17, name: "HardBreak" }),
  NodeType.define({ id: 18, name: "SoftBreak" }),
] as const;

const nodeSet = new NodeSet(nodeTypes);

interface MicromarkEvent {
  type: "enter" | "exit";
  token: {
    type: string;
    start: { offset: number };
    end?: { offset: number };
  };
}

interface Element {
  type: number; // NodeType id
  from: number;
  to: number;
  children: Element[];
}

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
 * Convert micromark token type to our NodeType
 */
function getNodeType(tokenType: string): NodeType {
  const typeMap: Record<string, number> = {
    // Block types
    paragraph: 2, // Paragraph
    atxHeading: 4, // Heading
    setextHeading: 4, // Heading
    codeFenced: 5, // Code
    codeIndented: 5, // Code
    htmlFlow: 6, // Html
    thematicBreak: 7, // ThematicBreak
    blockQuote: 8, // Blockquote
    listOrdered: 9, // List
    listUnordered: 9, // List
    listItem: 10, // ListItem

    // Inline types
    emphasis: 11, // Emphasis
    strong: 12, // Strong
    codeText: 13, // InlineCode
    link: 14, // Link
    autolink: 14, // Link
    image: 15, // Image
    characterEscape: 16, // CharacterEscape
    hardBreakEscape: 17, // HardBreak
    hardBreakTrailing: 17, // HardBreak

    // Text content - all map to Text
    data: 3, // Text
    codeTextData: 3, // Text
  };

  const typeId = typeMap[tokenType] ?? 3; // Default to Text
  return nodeTypes[typeId];
}

/**
 * Determine if we should skip this token type
 */
function skipToken(tokenType: string): boolean {
  const skipList = [
    // Document structure tokens
    "chunkDocument",
    "content",

    // Markup tokens that don't create nodes
    "atxHeadingSequence", // The "#" markers
    "emphasisSequence", // The "*" markers
    "strongSequence", // The "**" markers
    "codeTextSequence", // The "`" markers
    "escapeMarker", // The "\" in escapes
    "characterEscapeValue", // The escaped character (parent handles it)

    // Container tokens - skip so children become direct children
    "atxHeadingText",
    "emphasisText",
    "strongText",
    "codeTextData", // Actually keep this one
    "linkText",
    "imageText",

    // Whitespace - usually not needed as separate nodes
    "whitespace",
  ];

  return skipList.includes(tokenType);
}

/**
 * Parse micromark events into a hierarchical tree structure that matches mdast
 */
function parseEventsToTree(events: MicromarkEvent[], text: string): Element {
  const stack: Element[] = [];
  const root: Element = {
    type: 1, // Root
    from: 0,
    to: text.length,
    children: [],
  };

  stack.push(root);

  for (const event of events) {
    const { type: eventType, token } = event;
    const tokenType = token.type;
    const start = token.start.offset;
    const end = token.end?.offset ?? start;

    if (eventType === "enter") {
      // Skip tokens that shouldn't create nodes
      if (skipToken(tokenType)) {
        continue;
      }

      // Create new element
      const element: Element = {
        type: getNodeType(tokenType).id,
        from: start,
        to: end, // Will be updated on exit
        children: [],
      };

      // Add to current parent and push to stack
      const parent = stack[stack.length - 1];
      parent.children.push(element);
      stack.push(element);
    } else if (eventType === "exit") {
      // Skip the same tokens
      if (skipToken(tokenType)) {
        continue;
      }

      // Update element and pop from stack
      if (stack.length > 1) {
        const current = stack.pop();
        if (!current) continue;
        current.to = end;

        // Ensure leaf text nodes have no children
        if (tokenType === "data" || tokenType === "codeTextData") {
          current.type = 3; // Text
          current.children = [];
        }
      }
    }
  }

  return root;
}

/**
 * Convert Element tree to Lezer Tree
 */
function elementsToTree(element: Element): Tree {
  const children: Tree[] = [];
  const positions: number[] = [];

  for (const child of element.children) {
    const childTree = elementsToTree(child);
    children.push(childTree);
    positions.push(child.from - element.from);
  }

  return new Tree(
    nodeTypes[element.type],
    children,
    positions,
    element.to - element.from,
  );
}

/**
 * Main parser class that implements Lezer Parser interface
 */
export class DirectCommonMarkParser extends Parser {
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

        // Use micromark to parse the input
        const parser = parse();
        const chunks = preprocess()(inputText, undefined, true);
        const events = parser.document().write(chunks);
        const processed = postprocess(events);

        // Convert micromark events to our format
        const micromarkEvents: MicromarkEvent[] = processed.map((event) => ({
          type: event[0] as "enter" | "exit",
          token: {
            type: event[1].type,
            start: { offset: event[1].start.offset },
            end: event[1].end ? { offset: event[1].end.offset } : undefined,
          },
        }));

        // Parse events into hierarchical structure
        const rootElement = parseEventsToTree(micromarkEvents, inputText);

        // Convert to Lezer Tree
        tree = elementsToTree(rootElement);
        finished = true;
        return tree;
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
export const parser = new DirectCommonMarkParser();
