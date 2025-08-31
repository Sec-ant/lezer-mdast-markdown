#!/usr/bin/env tsx

import { debugRawMicromarkEvents } from "./src/micromark-integration";

// Test HTML blocks
const testCases = [
  "<div>\nfoo\n</div>",
  "<table>\n  <tr>\n    <td>foo</td>\n  </tr>\n</table>",
  "<!-- comment -->\nfoo",
];

testCases.forEach((markdown, i) => {
  console.log(`\n--- Test ${i + 1}: ${JSON.stringify(markdown)} ---`);

  const events = debugRawMicromarkEvents(markdown);
  events.forEach((event, j) => {
    console.log(
      `${j}: ${event.type} ${event.tokenType} [${event.start}-${event.end}]: "${event.value?.replace(/\n/g, "\\n")}"`,
    );
  });
});
