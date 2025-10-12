/**
 * Markdown syntax highlighting definitions for Lezer
 * Comprehensive tags covering all MDAST node types
 */
import { styleTags, tags as t } from "@lezer/highlight";

export const markdownHighlighting = styleTags({
  // Block-level elements
  "Heading/...": t.heading,
  "Code/...": t.monospace,
  Html: t.meta,
  ThematicBreak: t.contentSeparator,
  "Blockquote/...": t.quote,
  List: t.list,

  // Table elements (GFM)
  // Note: Table itself has no style, only structure

  // Inline elements
  "Emphasis/...": t.emphasis,
  "Strong/...": t.strong,
  "InlineCode/...": t.monospace,
  "Link/...": t.link,
  "Image/...": t.link,
  Break: t.processingInstruction,
  "LinkReference/...": t.link,
  "ImageReference/...": t.link,

  // References and definitions
  Definition: t.meta,
  FootnoteDefinition: t.meta,
  FootnoteReference: t.link,

  // Extended elements
  "Delete/...": t.strikethrough,
  Yaml: t.meta,
});
