/**
 * lezer-mdast-markdown: Markdown parser for CodeMirror 6
 * Leverages the mdast ecosystem for extensible Markdown support
 * 100% compliant with CommonMark specification
 */

// ============================================================================
// Core API - CodeMirror Integration
// ============================================================================

export { markdownHighlighting } from "./highlight";
export { markdown, markdownLanguage } from "./language";

// ============================================================================
// Parser API
// ============================================================================

export type { ParserOptions } from "./parser";
export { createParser, MarkdownParser, parser } from "./parser";

// ============================================================================
// Extension API - For Custom Node Properties
// ============================================================================

export type {
  NodeAttributes,
  NodePropMaps,
  PropConfig,
} from "./node-definitions";
export {
  collectNodeProps,
  collectProps,
  createNodePropConfig,
} from "./node-definitions";

// ============================================================================
// Built-in NodeProp Instances - For Reuse in Extensions
// ============================================================================

export {
  alignProp,
  altProp,
  checkedProp,
  depthProp,
  identifierProp,
  labelProp,
  langProp,
  metaProp,
  orderedProp,
  referenceTypeProp,
  spreadProp,
  startProp,
  titleProp,
  urlProp,
} from "./node-definitions";
