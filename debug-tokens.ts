#!/usr/bin/env npx tsx

// Debug script to understand micromark tokenization
import { debugRawMicromarkEvents } from "./src/micromark-integration";

const testCases = [
  {
    name: "Emphasis",
    text: "*emphasized text*",
  },
  {
    name: "Strong",
    text: "**strong text**",
  },
  {
    name: "InlineCode",
    text: "`inline code`",
  },
  {
    name: "Link",
    text: "[link text](http://example.com)",
  },
  {
    name: "Image",
    text: "![alt text](image.jpg)",
  },
  {
    name: "List",
    text: "- Item 1\n- Item 2\n- Item 3",
  },
  {
    name: "Numbered list",
    text: "1. First\n2. Second\n3. Third",
  },
  {
    name: "Backslash escapes",
    text: "\\*not emphasized\\*",
  },
  {
    name: "Html block",
    text: "<div>\nHtml content\n</div>",
  },
  {
    name: "Fenced code",
    text: "```javascript\nconsole.log('hello');\n```",
  },
];

for (const testCase of testCases) {
  console.log(`\n=== ${testCase.name} ===`);
  console.log(`Text: ${JSON.stringify(testCase.text)}`);

  try {
    const events = debugRawMicromarkEvents(testCase.text);
    console.log("Raw micromark events:");
    for (const event of events) {
      console.log(
        `  ${event.type} ${event.tokenType} [${event.start}-${event.end}] "${event.value}"`,
      );
    }
  } catch (error) {
    console.error("Error:", error);
  }
}
