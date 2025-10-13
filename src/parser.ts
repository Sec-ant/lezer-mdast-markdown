/**
 * Markdown Parser for Lezer
 * Supports CommonMark specification with extensible mdast plugin support
 * Uses mdast-util-from-markdown internally for 100% compliance
 */
import {
  type Input,
  type NodeSet,
  Parser,
  type PartialParse,
  type Tree,
  type TreeFragment,
} from "@lezer/common";
import type { Options as FromMarkdownOptions } from "mdast-util-from-markdown";
import { fromMarkdown } from "mdast-util-from-markdown";
import type { NodePropMaps } from "./node-definitions";
import { createNodeSet } from "./node-definitions";
import { mdastToLezerTree } from "./transform";

/**
 * Parser configuration options
 */
export interface ParserOptions extends FromMarkdownOptions {
  /**
   * Additional node property configurations for custom MDAST node types.
   * Keys should be PascalCase node type names (following Lezer convention).
   *
   * @example
   * ```ts
   * import { createParser, metaProp } from 'lezer-mdast-markdown';
   * import { NodeProp } from '@lezer/common';
   * import { directive, directiveFromMarkdown } from 'micromark-extension-directive';
   *
   * const directiveNameProp = new NodeProp<string>({ perNode: true });
   *
   * const parser = createParser({
   *   extensions: [directive()],
   *   mdastExtensions: [directiveFromMarkdown()],
   *   nodeProps: {
   *     TextDirective: {
   *       name: directiveNameProp,
   *     },
   *     Math: {
   *       meta: metaProp,
   *     },
   *   },
   * });
   * ```
   */
  nodeProps?: NodePropMaps;
}

/**
 * Markdown Parser implementation
 * Supports CommonMark specification with extensible mdast plugin support
 */
export class MarkdownParser extends Parser {
  readonly nodeSet: NodeSet;
  private encoder: (type: string) => number;
  private options: ParserOptions;
  private nodeTypeIds: Record<string, number>;

  constructor(
    nodeSet: NodeSet,
    encoder: (type: string) => number,
    nodeTypeIds: Record<string, number>,
    options: ParserOptions = {},
  ) {
    super();
    this.nodeSet = nodeSet;
    this.encoder = encoder;
    this.nodeTypeIds = nodeTypeIds;
    this.options = options;
  }

  /**
   * Create a parse instance
   */
  createParse(
    input: Input,
    _fragments: readonly TreeFragment[],
    _ranges: readonly { from: number; to: number }[],
  ): PartialParse {
    const text = inputToString(input);

    // Parse markdown to MDAST
    const mdast = fromMarkdown(text, {
      extensions: this.options.extensions,
      mdastExtensions: this.options.mdastExtensions,
    });

    // Convert MDAST to Lezer Tree with custom properties
    const tree = mdastToLezerTree(
      mdast,
      text,
      this.nodeSet,
      this.encoder,
      this.options.nodeProps,
    );

    // Return completed parse
    return new ImmediateParse(tree);
  }

  /**
   * Create a new parser with updated options
   */
  configure(options: ParserOptions): MarkdownParser {
    return new MarkdownParser(this.nodeSet, this.encoder, this.nodeTypeIds, {
      ...this.options,
      ...options,
    });
  }

  /**
   * Get NodeType ID by name
   */
  getNodeTypeId(name: string): number {
    return this.nodeTypeIds[name] ?? 0;
  }

  /**
   * Get all NodeType IDs
   */
  get nodeTypes(): Record<string, number> {
    return { ...this.nodeTypeIds };
  }
}

/**
 * Immediate parse result (non-incremental)
 */
class ImmediateParse implements PartialParse {
  stoppedAt: number | null = null;
  private tree: Tree;

  constructor(tree: Tree) {
    this.tree = tree;
  }

  get parsedPos(): number {
    return this.tree.length;
  }

  stopAt(): void {
    // No-op for non-incremental parsing
  }

  advance(): Tree {
    return this.tree;
  }
}

/**
 * Convert Input to string
 */
function inputToString(input: Input): string {
  if (typeof input === "string") {
    return input;
  }

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
 * Create a parser with custom configuration
 */
export function createParser(options: ParserOptions = {}): MarkdownParser {
  // Extract node types from nodeProps if provided
  const additionalNodeTypes = options.nodeProps
    ? Object.keys(options.nodeProps)
    : undefined;

  const { nodeSet, encoder, nodeTypeIds } = createNodeSet(additionalNodeTypes);
  return new MarkdownParser(nodeSet, encoder, nodeTypeIds, options);
}

/**
 * Default Markdown parser instance
 * Supports CommonMark specification only
 * For GFM or other extensions, use createParser() or parser.configure()
 */
export const parser = createParser();
