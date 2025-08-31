#!/usr/bin/env npx tsx

// Debug list detection
import { debugRawMicromarkEvents } from "./src/micromark-integration";

const text = "- Item 1\n- Item 2";

console.log(`Text: ${JSON.stringify(text)}`);
const events = debugRawMicromarkEvents(text);

// Check list detection logic
const paragraphEvents = events.filter((e) => e.tokenType === "paragraph");
console.log("\nParagraph events:");
for (const pe of paragraphEvents) {
  console.log(`  ${pe.type} paragraph [${pe.start}-${pe.end}] "${pe.value}"`);

  // Check if this paragraph is inside a list
  const isInList = events.some(
    (e) =>
      (e.tokenType === "listOrdered" || e.tokenType === "listUnordered") &&
      e.type === "enter" &&
      e.start <= pe.start &&
      e.end >= pe.end,
  );
  console.log(`    isInList: ${isInList}`);
}
