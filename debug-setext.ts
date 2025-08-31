#!/usr/bin/env npx tsx

// Debug setext headings
import { debugRawMicromarkEvents } from "./src/micromark-integration";

const text = "Foo\n===\n\nBar\n---";

console.log(`Text: ${JSON.stringify(text)}`);
console.log("Raw micromark events:");
const events = debugRawMicromarkEvents(text);
for (const event of events) {
  console.log(
    `  ${event.type} ${event.tokenType} [${event.start}-${event.end}] "${event.value}"`,
  );
}
