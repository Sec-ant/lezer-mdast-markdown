#!/usr/bin/env tsx

import { compareStructures } from "./tests/utils/compareStructures";

// Test simple cases to see what broke
const testCases = ["foo", "# heading", "*foo*"];

testCases.forEach((markdown, i) => {
  console.log(`\n--- Test ${i + 1}: ${JSON.stringify(markdown)} ---`);

  try {
    const result = compareStructures(markdown);
    console.log("Matches:", result.matches);
    console.log("Issues:", result.differences.join("; "));
  } catch (error) {
    console.log("Error:", error.message);
  }
});
