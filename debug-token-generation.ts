// Debug token generation for emphasis
import { parseMicromark } from "./src/micromark-integration";

const tests = ["hello world", "`foo`", "foo*bar*"];

for (const markdown of tests) {
  console.log(`\nTesting token generation for: ${JSON.stringify(markdown)}`);
  const result = parseMicromark(markdown);
  console.log("Generated tokens:");
  result.tokens.forEach((token, i) => {
    console.log(`${i}: ${token.type} [${token.start}-${token.end}]: "${token.value}"`);
  });
}