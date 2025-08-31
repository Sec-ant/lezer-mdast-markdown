#!/usr/bin/env npx tsx

// Debug script to understand list item events
import { debugRawMicromarkEvents } from "./src/micromark-integration";

const text = "- Item 1\n- Item 2";

console.log(`Text: ${JSON.stringify(text)}`);
console.log("Raw micromark events:");
const events = debugRawMicromarkEvents(text);
for (const event of events) {
  console.log(
    `  ${event.type} ${event.tokenType} [${event.start}-${event.end}] "${event.value}"`,
  );
}
