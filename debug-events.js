// Debug micromark events
import { parse, postprocess, preprocess } from "micromark";

const test = "# foo *bar* \\*baz\\*";
console.log("Input:", JSON.stringify(test));

const parser = parse();
const chunks = preprocess()(test, undefined, true);
const events = parser.document().write(chunks);
const processed = postprocess(events);

console.log("\nMicromark Events:");
for (const [eventType, token] of processed) {
  const start = token.start.offset;
  const end = token.end?.offset ?? start;
  const content = test.slice(start, end);
  console.log(`${eventType} ${token.type} [${start}, ${end}] "${content}"`);
}
