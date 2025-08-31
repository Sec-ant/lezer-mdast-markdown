import { ExternalTokenizer, type InputStream } from "@lezer/lr";
import * as terms from "./commonmark.grammar.terms";
import { parseMicromark } from "./micromark-integration";

// 定义 token 类型的常量
// IMPORTANT: Numeric ids must match the order of @external tokens list in commonmark.grammar.
// 文档缓存接口
interface DocumentCache {
  text: string;
  tokens: Array<{
    type: string;
    start: number;
    end: number;
    value?: string;
  }>;
  lastAccessPos: number;
}

// 全局文档缓存
let documentCache: DocumentCache | null = null;

/**
 * 增强的 external tokenizer，使用 micromark 解析结果
 */
export const micromarkTokenizer = new ExternalTokenizer(
  (input: InputStream, _stack) => {
    // 1. 重建完整文档文本
    const fullDocument = reconstructFullDocument(input);

    // 2. 检查是否需要重新解析
    if (!documentCache || documentCache.text !== fullDocument) {
      // 解析新文档
      const result = parseMicromark(fullDocument);
      documentCache = {
        text: fullDocument,
        tokens: result.tokens,
        lastAccessPos: input.pos,
      };

      // 调试输出（仅在首次解析时）
      // Debug output suppressed for performance
    } else {
      // 更新缓存的访问位置
      documentCache.lastAccessPos = input.pos;
    }

    // 3. 查找当前位置的 token
    const currentPos = input.pos;
    const token = findTokenAtPosition(currentPos, documentCache.tokens);

    // Debug suppressed

    if (token) {
      // 计算当前位置的相对偏移
      const relativeStart = token.start - currentPos;
      const relativeEnd = token.end - currentPos;

      // 确保 token 从当前位置开始
      if (relativeStart === 0 && relativeEnd > 0) {
        const lezerTokenType = mapToLezerToken(token.type);

        // 计算实际可用的 token 长度，确保不超出剩余输入
        let tokenLength = relativeEnd;

        // 验证剩余输入长度，防止越界
        let maxAvailableLength = 0;
        while (maxAvailableLength < tokenLength) {
          const ch = input.peek(maxAvailableLength);
          if (ch < 0) break; // 到达文件末尾
          maxAvailableLength++;
        }

        tokenLength = Math.min(tokenLength, maxAvailableLength);

        // Accept token
        if (lezerTokenType && tokenLength > 0) {
          input.acceptToken(lezerTokenType, tokenLength);
          return;
        }
      } else {
        // Position mismatch debug suppressed
      }
    }

    // 4. 如果没有找到匹配的 token，处理空白字符或回退
    const ch = input.peek(0);
    // No direct token found; fallback handling

    if (ch >= 0) {
      if (ch === 32 || ch === 9 || ch === 10 || ch === 13) {
        // space, tab, LF, CR
        // whitespace token
        input.acceptToken(terms.whitespace, 1);
        return;
      }

      // No more fallback - let Lezer handle unknown characters
      return;
    }
  },
);

// Determine if current position is inside an open fenced code block (after a codeFenceOpen with no closing fence yet)
// NOTE: Previously we used a character-level hack to treat '>' inside an open fenced code block as whitespace.
// That hack is removed in favor of higher-level event synthesis that absorbs blockQuote markers into fence content.

/**
 * 从 InputStream 重建完整文档文本
 *
 * 修复版本：正确重建完整文档，避免位置计算错误
 */
function reconstructFullDocument(input: InputStream): string {
  let text = "";

  // 首先，从当前位置向前读取到文档开始
  const beforeText: string[] = [];
  for (let i = 1; i <= input.pos; i++) {
    const ch = input.peek(-i);
    if (ch < 0) break;
    beforeText.unshift(String.fromCharCode(ch));
  }

  // 将前面的文本添加到结果中
  text = beforeText.join("");

  // 然后，从当前位置开始读取到文档末尾
  let readPos = 0;
  while (readPos < 50000) {
    // 防止无限循环
    const ch = input.peek(readPos);
    if (ch < 0) break; // 到达文件末尾
    text += String.fromCharCode(ch);
    readPos++;
  }

  return text;
}

/**
 * 查找从指定位置开始的 token
 * 修复版本：查找从当前位置开始的 token，而不是包含当前位置的 token
 */
function findTokenAtPosition(
  position: number,
  tokenList: Array<{
    type: string;
    start: number;
    end: number;
    value?: string;
  }>,
):
  | {
      type: string;
      start: number;
      end: number;
      value?: string;
    }
  | undefined {
  return tokenList.find((token) => token.start === position);
}

/**
 * 将事件类型映射到 lezer token 常量
 */
function mapToLezerToken(tokenType: string): number | null {
  switch (tokenType) {
    case "headingMarkers":
      return terms.headingMarkers;
    case "headingText":
      return terms.headingText;
    case "blockQuoteMarker":
      return terms.blockQuoteMarker;
    case "blockQuoteHeadingMarkers":
      return terms.blockQuoteHeadingMarkers;
    case "blockQuoteHeadingText":
      return terms.blockQuoteHeadingText;
    case "blockQuoteParagraphText":
      return terms.blockQuoteParagraphText;
    case "codeFenceOpen":
      return terms.codeFenceOpen;
    case "codeLanguage":
      return terms.codeLanguage;
    case "codeContent":
      return terms.codeContent;
    case "codeFenceClose":
      return terms.codeFenceClose;
    case "codeBlockText":
      return terms.codeBlockText;
    case "listOpen":
      return terms.listOpen;
    case "listItemOpen":
      return terms.listItemOpen;
    case "listItemText":
      return terms.listItemText;
    case "listItemClose":
      return terms.listItemClose;
    case "listClose":
      return terms.listClose;
    case "htmlContent":
      return terms.htmlContent;
    case "paragraphText":
      return terms.paragraphText;
    case "textContent":
      return terms.textContent;
    case "thematicBreak":
      return terms.thematicBreak;
    case "whitespace":
      return terms.whitespace;
    default:
      return null;
  }
}
