// Debug micromark events for failing emphasis case
import { debugRawMicromarkEvents } from "./src/micromark-integration";

const failingCase = "foo*bar*";
console.log(`Testing micromark events for: ${JSON.stringify(failingCase)}`);

const events = debugRawMicromarkEvents(failingCase);
console.log("\nMicromark events:");
events.forEach((event, i) => {
  console.log(`${i}: ${event.type} ${event.tokenType} [${event.start}-${event.end}]: "${event.value?.replace(/\n/g, "\\n")}"`);
});