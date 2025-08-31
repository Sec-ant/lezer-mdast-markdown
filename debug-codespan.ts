#!/usr/bin/env tsx

import { debugRawMicromarkEvents } from "./src/micromark-integration";

// Test code spans
const testCases = ["`foo`", "`` foo ` bar ``", "```foo```"];

testCases.forEach((markdown, i) => {
  console.log(`\n--- Test ${i + 1}: ${JSON.stringify(markdown)} ---`);

  const events = debugRawMicromarkEvents(markdown);
  events.forEach((event, j) => {
    console.log(
      `${j}: ${event.type} ${event.tokenType} [${event.start}-${event.end}]: "${event.value?.replace(/\n/g, "\\n")}"`,
    );
  });
});
