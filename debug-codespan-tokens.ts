import { parseMicromark } from "./src/micromark-integration";

const markdown = "`foo`";
console.log("Testing:", JSON.stringify(markdown));

const result = parseMicromark(markdown);
console.log("\nTokens generated:");
result.tokens.forEach((token, i) => {
  console.log(
    `${i}: ${token.type} [${token.start}-${token.end}]: "${token.value}"`,
  );
});
