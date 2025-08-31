#!/usr/bin/env tsx

import { debugRawMicromarkEvents } from "./src/micromark-integration";

// Test emphasis and text segmentation
const testCases = [
  "*foo*",
  "**foo**",
  "*foo* bar *baz*",
  "foo *bar* baz",
  "[foo](/url)",
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
