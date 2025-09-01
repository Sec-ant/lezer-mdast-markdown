import { parse, postprocess, preprocess } from "micromark";

/**
 * Micromark 集成模块
 *
 * 负责：
 * 1. 使用 micromark 解析 CommonMark 文本
 * 2. 通过自定义编译器捕获解析过程
 * 3. 转换为 lezer 兼容的 token 流
 */

// Lezer token 接口
export interface LezerToken {
  type: string;
  start: number;
  end: number;
  value?: string;
}

// 解析事件接口
export interface ParseEvent {
  type: "enter" | "exit";
  tokenType: string;
  start: number;
  end: number;
  value?: string;
}

export function parseMicromark(text: string) {
  const parser = parse();
  const chunks = preprocess()(text, undefined, true);
  const raw = parser.document().write(chunks);
  const processed = postprocess(raw);
  const rawEvents: ParseEvent[] = processed.map((e) => {
    const phase = e[0];
    const tok = e[1];
    const end = tok.end ? tok.end.offset : tok.start.offset;
    return {
      type: phase,
      tokenType: tok.type,
      start: tok.start.offset,
      end,
      value: text.slice(tok.start.offset, end),
    } as ParseEvent;
  });
  const structural = synthesizeStructuralEvents(rawEvents, text);
  const tokens = structural.filter((e) => e.type === "exit");
  return {
    events: structural,
    tokens: tokens.map((t) => ({
      type: t.tokenType,
      start: t.start,
      end: t.end,
      value: t.value,
    })),
  };
}

// Debug helper to inspect raw micromark events (no structural synthesis)
export function debugRawMicromarkEvents(text: string): ParseEvent[] {
  const parser = parse();
  const chunks = preprocess()(text, undefined, true);
  const raw = parser.document().write(chunks);
  const processed = postprocess(raw);
  return processed.map((e) => {
    const phase = e[0];
    const tok = e[1];
    const end = tok.end ? tok.end.offset : tok.start.offset;
    return {
      type: phase,
      tokenType: tok.type,
      start: tok.start.offset,
      end,
      value: text.slice(tok.start.offset, end),
    } as ParseEvent;
  });
}

// New interface for paragraph content tracking
interface ParagraphInfo {
  start: number;
  end: number;
  inlineElements: Array<{
    type: string;
    start: number;
    end: number;
    openSize?: number;
    closeSize?: number;
  }>;
}

/**
 * NEW APPROACH: Generate proper phrasing tokens for entire paragraph content
 * This ensures that a paragraph remains as a single block with mixed phrasing content
 */
function generateParagraphPhrasingTokens(
  paragraph: ParagraphInfo,
  allEvents: ParseEvent[],
  text: string,
  out: ParseEvent[],
): void {
  // Find all inline elements within this paragraph
  const inlineEvents = allEvents
    .filter(
      (e) =>
        e.start >= paragraph.start &&
        e.end <= paragraph.end &&
        e.type === "exit" &&
        (e.tokenType === "emphasis" ||
          e.tokenType === "strong" ||
          e.tokenType === "codeText" ||
          e.tokenType === "link" ||
          e.tokenType === "image" ||
          e.tokenType === "autolink" ||
          e.tokenType === "characterEscape"),
    )
    .sort((a, b) => a.start - b.start);

  // Check if paragraph has any valid inline elements
  const hasValidInlines = inlineEvents.length > 0;

  if (!hasValidInlines) {
    // Simple paragraph - just generate paragraphText token for the entire content
    const paragraphContent = text.slice(paragraph.start, paragraph.end).trim();
    if (paragraphContent.length > 0) {
      out.push({
        type: "exit",
        tokenType: "paragraphText",
        start: paragraph.start,
        end: paragraph.end,
        value: paragraphContent,
      });
    }
    return;
  }

  // Complex paragraph with inline elements - generate phrasing tokens
  let currentPos = paragraph.start;

  for (const inlineEvent of inlineEvents) {
    // Generate textContent token for text before this inline element
    if (currentPos < inlineEvent.start) {
      const textContent = text.slice(currentPos, inlineEvent.start);
      if (textContent.trim().length > 0) {
        out.push({
          type: "exit",
          tokenType: "textContent",
          start: currentPos,
          end: inlineEvent.start,
          value: textContent,
        });
      }
    }

    // Generate tokens for the inline element itself
    generateInlineElementTokens(inlineEvent, text, out);

    currentPos = inlineEvent.end;
  }

  // Generate textContent token for remaining text after last inline element
  if (currentPos < paragraph.end) {
    const remainingText = text.slice(currentPos, paragraph.end);
    if (remainingText.trim().length > 0) {
      out.push({
        type: "exit",
        tokenType: "textContent",
        start: currentPos,
        end: paragraph.end,
        value: remainingText,
      });
    }
  }
}

/**
 * Generate tokens for a specific inline element (emphasis, strong, etc.)
 */
function generateInlineElementTokens(
  event: ParseEvent,
  text: string,
  out: ParseEvent[],
): void {
  const tt = event.tokenType;

  if (tt === "emphasis") {
    // Generate emphasis open, content, close tokens
    out.push({
      type: "exit",
      tokenType: "emphasisOpen",
      start: event.start,
      end: event.start + 1,
      value: "*",
    });

    const content = text.slice(event.start + 1, event.end - 1);
    if (content.length > 0) {
      out.push({
        type: "exit",
        tokenType: "emphasisText",
        start: event.start + 1,
        end: event.end - 1,
        value: content,
      });
    }

    out.push({
      type: "exit",
      tokenType: "emphasisClose",
      start: event.end - 1,
      end: event.end,
      value: "*",
    });
  } else if (tt === "strong") {
    // Generate strong open, content, close tokens
    out.push({
      type: "exit",
      tokenType: "strongOpen",
      start: event.start,
      end: event.start + 2,
      value: "**",
    });

    const content = text.slice(event.start + 2, event.end - 2);
    if (content.length > 0) {
      out.push({
        type: "exit",
        tokenType: "strongText",
        start: event.start + 2,
        end: event.end - 2,
        value: content,
      });
    }

    out.push({
      type: "exit",
      tokenType: "strongClose",
      start: event.end - 2,
      end: event.end,
      value: "**",
    });
  } else if (tt === "codeText") {
    // Generate inline code tokens
    out.push({
      type: "exit",
      tokenType: "inlineCodeOpen",
      start: event.start,
      end: event.start + 1,
      value: "`",
    });

    const content = text.slice(event.start + 1, event.end - 1);
    if (content.length > 0) {
      out.push({
        type: "exit",
        tokenType: "inlineCodeText",
        start: event.start + 1,
        end: event.end - 1,
        value: content,
      });
    }

    out.push({
      type: "exit",
      tokenType: "inlineCodeClose",
      start: event.end - 1,
      end: event.end,
      value: "`",
    });
  } else if (tt === "link" || tt === "autolink") {
    // Generate link tokens
    const openMarker = tt === "autolink" ? "<" : "[";
    const closeMarker = tt === "autolink" ? ">" : "]";
    const openSize = openMarker.length;
    const closeSize = closeMarker.length;

    out.push({
      type: "exit",
      tokenType: "linkOpen",
      start: event.start,
      end: event.start + openSize,
      value: openMarker,
    });

    const content = text.slice(event.start + openSize, event.end - closeSize);
    if (content.length > 0) {
      out.push({
        type: "exit",
        tokenType: "linkText",
        start: event.start + openSize,
        end: event.end - closeSize,
        value: content,
      });
    }

    out.push({
      type: "exit",
      tokenType: "linkClose",
      start: event.end - closeSize,
      end: event.end,
      value: closeMarker,
    });
  } else if (tt === "image") {
    // Generate image tokens
    out.push({
      type: "exit",
      tokenType: "imageOpen",
      start: event.start,
      end: event.start + 2,
      value: "![",
    });

    const fullText = text.slice(event.start, event.end);
    const textMatch = fullText.match(/^!\[([^\]]*)\]/);
    if (textMatch && textMatch[1].length > 0) {
      out.push({
        type: "exit",
        tokenType: "imageText",
        start: event.start + 2,
        end: event.start + 2 + textMatch[1].length,
        value: textMatch[1],
      });
    }

    out.push({
      type: "exit",
      tokenType: "imageClose",
      start: event.end - 1,
      end: event.end,
      value: "]",
    });
  } else if (tt === "characterEscape") {
    out.push({
      type: "exit",
      tokenType: "characterEscape",
      start: event.start,
      end: event.end,
      value: text.slice(event.start, event.end),
    });
  }
}

export function synthesizeStructuralEvents(
  events: ParseEvent[],
  text: string,
): ParseEvent[] {
  const out: ParseEvent[] = [];
  interface FenceState {
    openStart: number;
    info?: { start: number; end: number };
    content: { start: number; end: number }[];
    langIndex?: number;
  }
  let fence: FenceState | null = null;
  let lastEmittedEnd = 0;

  // Track paragraph content as complete units
  let currentParagraph: ParagraphInfo | null = null;

  function flushFenceClose(closePos: number) {
    if (!fence) return;
    if (fence.content.length > 0) {
      const first = fence.content[0];
      const last = fence.content[fence.content.length - 1];
      out.push({
        type: "exit",
        tokenType: "codeContent",
        start: first.start,
        end: last.end,
        value: text.slice(first.start, last.end),
      });
      lastEmittedEnd = Math.max(lastEmittedEnd, last.end);
    }
    const closeStart = Math.max(lastEmittedEnd, closePos - 1);
    const closeEnd = closePos;
    if (closeEnd > closeStart) {
      out.push({
        type: "exit",
        tokenType: "codeFenceClose",
        start: closeStart,
        end: closeEnd,
        value: text.slice(closeStart, closeEnd),
      });
      lastEmittedEnd = Math.max(lastEmittedEnd, closeEnd);
    }
    fence = null;
  }

  for (const ev of events) {
    const tt = ev.tokenType;

    if (tt === "blockQuote") {
      if (ev.type === "enter") {
        // Generate single blockQuoteMarker token for the entire blockquote
        out.push({
          type: "exit",
          tokenType: "blockQuoteMarker",
          start: ev.start,
          end: ev.start + 2, // "> " marker
          value: "> ",
        });
        lastEmittedEnd = Math.max(lastEmittedEnd, ev.start + 2);
      } else {
        // Handle exit - the content will be handled by child events
        // but we need to ensure proper content generation for blockquote children
      }
      continue;
    }

    // Skip individual blockQuoteMarker events, but generate whitespace tokens
    // for internal markers to avoid parse warnings
    if (tt === "blockQuoteMarker" && ev.type === "exit") {
      // Skip the first blockQuoteMarker (already handled in blockQuote enter)
      // Generate whitespace tokens for subsequent markers to consume them
      if (ev.start > 0) {
        const nextEvent = events.find(
          (e, i) =>
            events.indexOf(ev) < i &&
            e.tokenType === "blockQuotePrefixWhitespace" &&
            e.start === ev.end,
        );
        const fullEnd = nextEvent ? nextEvent.end : ev.end;

        out.push({
          type: "exit",
          tokenType: "whitespace",
          start: ev.start,
          end: fullEnd,
          value: text.slice(ev.start, fullEnd),
        });
        lastEmittedEnd = Math.max(lastEmittedEnd, fullEnd);
      }
      continue;
    }

    // Special handling for content inside blockquotes
    if (tt === "atxHeading" || tt === "setextHeading") {
      if (ev.type === "exit") {
        let end = ev.end;
        if (text[end - 1] === "\n") end--;

        // Check if this heading is inside a blockquote by examining the text
        const headingText = text.slice(ev.start, end);
        const isInBlockquote = events.some(
          (e) =>
            e.tokenType === "blockQuote" &&
            e.type === "enter" &&
            e.start <= ev.start &&
            e.end >= ev.end,
        );

        if (isInBlockquote && tt === "atxHeading") {
          // Generate blockquote-specific heading tokens
          const match = headingText.match(/^(#+)(\s*)(.*)$/);
          if (match) {
            const markers = match[1]; // "##"
            const spaces = match[2]; // "  "
            const textContent = match[3]; // "foo"

            let currentPos = ev.start;

            // Generate blockQuoteHeadingMarkers token for the "##" part
            if (markers) {
              out.push({
                type: "exit",
                tokenType: "blockQuoteHeadingMarkers",
                start: currentPos,
                end: currentPos + markers.length,
                value: markers,
              });
              currentPos += markers.length;
              lastEmittedEnd = Math.max(lastEmittedEnd, currentPos);
            }

            // Skip spaces
            currentPos += spaces.length;

            // Generate blockQuoteHeadingText token for the text content
            if (textContent?.trim()) {
              const textStart = currentPos;
              const textEnd = textStart + textContent.length;
              out.push({
                type: "exit",
                tokenType: "blockQuoteHeadingText",
                start: textStart,
                end: textEnd,
                value: textContent,
              });
              lastEmittedEnd = Math.max(lastEmittedEnd, textEnd);
            }
          }
        } else {
          // Regular heading processing (existing logic)
          // Extract heading text without the markers for ATX headings
          if (tt === "atxHeading") {
            const headingFullText = text.slice(ev.start, end);
            const match = headingFullText.match(/^(#+)(\s*)(.*)$/);
            if (match) {
              const markers = match[1]; // "##"
              const spaces = match[2]; // "  "
              const textContent = match[3]; // "foo"

              let currentPos = ev.start;

              // Generate headingMarkers token for the "##" part
              if (markers) {
                out.push({
                  type: "exit",
                  tokenType: "headingMarkers",
                  start: currentPos,
                  end: currentPos + markers.length,
                  value: markers,
                });
                currentPos += markers.length;
                lastEmittedEnd = Math.max(lastEmittedEnd, currentPos);
              }

              // Skip spaces
              currentPos += spaces.length;

              // Generate headingText token for the text content
              if (textContent?.trim()) {
                const textStart = currentPos;
                const textEnd = textStart + textContent.length;
                out.push({
                  type: "exit",
                  tokenType: "headingText",
                  start: textStart,
                  end: textEnd,
                  value: textContent,
                });
                lastEmittedEnd = Math.max(lastEmittedEnd, textEnd);
              }
            }
          } else if (tt === "setextHeading") {
            // Handle setext headings like "Foo\n==="
            const headingFullText = text.slice(ev.start, end);
            const lines = headingFullText.split("\n");
            if (lines.length >= 2) {
              const textContent = lines[0]; // "Foo"
              const markers = lines[1]; // "==="

              // Generate headingText token for the text content
              if (textContent?.trim()) {
                out.push({
                  type: "exit",
                  tokenType: "headingText",
                  start: ev.start,
                  end: ev.start + textContent.length,
                  value: textContent,
                });
                lastEmittedEnd = Math.max(
                  lastEmittedEnd,
                  ev.start + textContent.length,
                );
              }

              // Generate headingMarkers token for the underline
              if (markers?.trim()) {
                const markersStart = ev.start + textContent.length + 1; // +1 for \n
                out.push({
                  type: "exit",
                  tokenType: "headingMarkers",
                  start: markersStart,
                  end: markersStart + markers.length,
                  value: markers,
                });
                lastEmittedEnd = Math.max(
                  lastEmittedEnd,
                  markersStart + markers.length,
                );
              }
            }
          }
        }
      }
      continue;
    }
    if (tt === "listOrdered" || tt === "listUnordered") {
      if (ev.type === "enter") {
        // Generate listOpen token at the start
        out.push({
          type: "exit",
          tokenType: "listOpen",
          start: ev.start,
          end: ev.start + 1,
          value: text.slice(ev.start, ev.start + 1),
        });
        lastEmittedEnd = Math.max(lastEmittedEnd, ev.start + 1);
      } else {
        // Generate listClose token at the end
        out.push({
          type: "exit",
          tokenType: "listClose",
          start: ev.end,
          end: ev.end,
          value: "",
        });
        lastEmittedEnd = Math.max(lastEmittedEnd, ev.end);
      }
      continue;
    }
    // Handle list item prefixes to create list items
    if (tt === "listItemPrefix" && ev.type === "exit") {
      // Generate listItemOpen token after the prefix
      out.push({
        type: "exit",
        tokenType: "listItemOpen",
        start: ev.end,
        end: ev.end,
        value: "",
      });
      lastEmittedEnd = Math.max(lastEmittedEnd, ev.end);
      continue;
    }
    if (tt === "paragraph") {
      if (ev.type === "enter") {
        currentParagraph = {
          start: ev.start,
          end: ev.end,
          inlineElements: [],
        };
      } else if (ev.type === "exit") {
        // Complete paragraph processing - this is the key change
        if (currentParagraph) {
          // Update the paragraph end position to the actual exit position
          currentParagraph.end = ev.end;

          // Check if this paragraph is inside a list
          const isInList = events.some(
            (e) =>
              (e.tokenType === "listOrdered" ||
                e.tokenType === "listUnordered") &&
              e.type === "enter" &&
              e.start <= ev.start &&
              e.end >= ev.end,
          );

          if (isInList) {
            // Generate listItemClose after the content
            out.push({
              type: "exit",
              tokenType: "listItemClose",
              start: ev.end,
              end: ev.end,
              value: "",
            });
            lastEmittedEnd = Math.max(lastEmittedEnd, ev.end);
          } else {
            // NEW APPROACH: Generate proper phrasing tokens for the entire paragraph
            generateParagraphPhrasingTokens(
              currentParagraph,
              events,
              text,
              out,
            );
            lastEmittedEnd = Math.max(lastEmittedEnd, ev.end);
          }
        }

        currentParagraph = null;
      }
      continue;
    }
    if (tt === "thematicBreak" && ev.type === "exit") {
      out.push({
        type: "exit",
        tokenType: "thematicBreak",
        start: ev.start,
        end: ev.end,
        value: text.slice(ev.start, ev.end),
      });
      continue;
    }
    if (tt === "codeIndented" && ev.type === "exit") {
      // Extract the actual code content removing exactly 4 spaces from each line
      const fullText = text.slice(ev.start, ev.end);
      const lines = fullText.split("\n");
      const codeLines = lines.map((line) => {
        // Remove exactly 4 spaces/characters of indentation, but preserve original structure
        if (line.startsWith("    ")) {
          return line.slice(4);
        } else if (line.startsWith("\t")) {
          return line.slice(1);
        } else {
          // Handle mixed spaces/tabs or different indentation
          return line.replace(/^[ ]{1,4}/, "");
        }
      });
      const codeContent = codeLines.join("\n").replace(/\n+$/, ""); // Remove trailing newlines

      // For indented code blocks, we need to generate codeBlockText token
      if (codeContent.trim().length > 0) {
        out.push({
          type: "exit",
          tokenType: "codeBlockText",
          start: ev.start,
          end: ev.end,
          value: codeContent,
        });
      }
      continue;
    }
    if (tt === "codeFencedFence" || tt === "codeFencedFenceSequence") {
      if (ev.type === "exit") {
        if (!fence) {
          fence = { openStart: ev.start, content: [] };
          out.push({
            type: "exit",
            tokenType: "codeFenceOpen",
            start: ev.start,
            end: ev.end,
            value: text.slice(ev.start, ev.end),
          });
        } else {
          flushFenceClose(ev.end);
        }
      }
      continue;
    }
    if (tt === "codeFencedFenceInfo" && ev.type === "exit") {
      if (fence) {
        fence.info = { start: ev.start, end: ev.end };
        out.push({
          type: "exit",
          tokenType: "codeLanguage",
          start: ev.start,
          end: ev.end,
          value: text.slice(ev.start, ev.end),
        });
        fence.langIndex = out.length - 1;
        lastEmittedEnd = Math.max(lastEmittedEnd, ev.end);
      }
      continue;
    }
    if (tt === "codeFencedFenceMeta" && ev.type === "exit") {
      if (fence?.info) {
        fence.info.end = ev.end;
        if (fence.langIndex != null) {
          const tok = out[fence.langIndex];
          tok.end = ev.end;
          tok.value = text.slice(tok.start, tok.end);
          lastEmittedEnd = Math.max(lastEmittedEnd, tok.end);
        }
      }
      continue;
    }
    if (tt === "codeFencedValue" && ev.type === "exit") {
      if (fence) fence.content.push({ start: ev.start, end: ev.end });
    }
    // Handle inline elements with hierarchical structure - REMOVED
    // All inline element processing now happens within generateParagraphPhrasingTokens

    // Skip all individual inline element events - they will be processed as part of paragraph content
    if (
      tt === "emphasis" ||
      tt === "strong" ||
      tt === "codeText" ||
      tt === "link" ||
      tt === "autolink" ||
      tt === "image" ||
      tt === "codeTextData"
    ) {
      continue;
    }
    if (tt === "characterEscape" && ev.type === "exit") {
      out.push({
        type: "exit",
        tokenType: "characterEscape",
        start: ev.start,
        end: ev.end,
        value: text.slice(ev.start, ev.end),
      });
      continue;
    }
    if (tt === "htmlFlow" && ev.type === "enter") {
      continue;
    }
    if (tt === "htmlFlow" && ev.type === "exit") {
      out.push({
        type: "exit",
        tokenType: "htmlContent",
        start: ev.start,
        end: ev.end,
        value: text.slice(ev.start, ev.end),
      });
      lastEmittedEnd = Math.max(lastEmittedEnd, ev.end);
      continue;
    }
    // Handle text data - REMOVED old approach that fragmented paragraphs
    // Text content is now handled within generateParagraphPhrasingTokens
    if (tt === "data") {
    }
  }

  if (fence)
    flushFenceClose(
      fence.content.length
        ? fence.content[fence.content.length - 1].end
        : fence.openStart,
    );

  return out.sort((a, b) => a.start - b.start || a.end - b.end);
}

// Basic mapper (placeholder – currently only needed for potential future block classification integration)
export function mapMicromarkType(_t: string): string | null {
  return null;
}
