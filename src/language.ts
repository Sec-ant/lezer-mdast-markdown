/**
 * CodeMirror 6 Language Support for Markdown
 * Supports CommonMark and GFM specifications
 */
import {
  defineLanguageFacet,
  Language,
  LanguageSupport,
} from "@codemirror/language";
import { type ParserOptions, parser } from "./parser";

/**
 * Create a Markdown language instance with the given parser configuration
 */
function createMarkdownLanguage(options?: ParserOptions): Language {
  const configuredParser = options ? parser.configure(options) : parser;

  // Create a language data facet with Markdown-specific settings
  const data = defineLanguageFacet({
    commentTokens: { block: { open: "<!--", close: "-->" } },
    closeBrackets: { brackets: ["(", "[", "{", "'", '"', "`"] },
  });

  // Create language with our parser
  // The parser's nodeSet already includes the highlighting via markdownHighlighting
  return new Language(data, configuredParser, [], "markdown");
}

/**
 * Markdown language definition for CodeMirror 6
 * Supports CommonMark and GFM specifications
 */
export const markdownLanguage = createMarkdownLanguage();

/**
 * Markdown language support for CodeMirror 6
 * Includes parser and syntax highlighting from markdownHighlighting
 * Supports CommonMark and GFM specifications
 *
 * @param options - Optional parser configuration (e.g., for GFM extensions)
 *
 * @example
 * Basic usage:
 * ```typescript
 * import { EditorView, basicSetup } from "codemirror";
 * import { markdown } from "lezer-markdown";
 *
 * new EditorView({
 *   extensions: [basicSetup, markdown()],
 *   parent: document.body
 * });
 * ```
 *
 * @example
 * With GFM extensions:
 * ```typescript
 * import { gfm } from "micromark-extension-gfm";
 * import { gfmFromMarkdown } from "mdast-util-gfm";
 * import { markdown } from "lezer-markdown";
 *
 * new EditorView({
 *   extensions: [
 *     basicSetup,
 *     markdown({
 *       extensions: [gfm()],
 *       mdastExtensions: [gfmFromMarkdown()]
 *     })
 *   ],
 *   parent: document.body
 * });
 * ```
 */
export function markdown(options?: ParserOptions): LanguageSupport {
  const language = options ? createMarkdownLanguage(options) : markdownLanguage;
  return new LanguageSupport(language);
}
