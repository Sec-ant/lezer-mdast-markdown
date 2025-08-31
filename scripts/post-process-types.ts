import { readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { pathToFileURL } from "node:url";

async function extractTermsWithValues(
  distPath: string,
): Promise<Record<string, number>> {
  try {
    // Import the generated terms module dynamically
    const termsPath = join(process.cwd(), distPath, "index.js");
    const termsModule = await import(pathToFileURL(termsPath).href);

    // Extract all exported term names and their values
    const terms: Record<string, number> = {};
    for (const [key, value] of Object.entries(termsModule)) {
      if (typeof value === "number" && key !== "parser") {
        terms[key] = value;
      }
    }

    return terms;
  } catch {
    console.warn(`⚠️  Could not extract terms from ${distPath}, using fallback`);
    return {};
  }
}

async function generateTermDeclarations(
  terms: Record<string, number>,
): Promise<string> {
  const termNames = Object.keys(terms);

  if (termNames.length === 0) {
    return "// No terms found - using generic export";
  }

  // Sort alphabetically for consistency
  const sortedTermNames = termNames.sort();

  const declarations = sortedTermNames
    .map((name) => `export declare const ${name}: ${terms[name]};`)
    .join("\n");

  return `// Term IDs for CommonMark grammar tokens (auto-generated)\n${declarations}`;
}

async function postProcessTypes() {
  const distPaths = ["dist/es", "dist/cjs"];

  for (const distPath of distPaths) {
    const indexDtsPath = join(distPath, "index.d.ts");

    try {
      // Extract term names and values from the built module
      const terms = await extractTermsWithValues(distPath);
      const termDeclarations = await generateTermDeclarations(terms);

      const content = await readFile(indexDtsPath, "utf-8");

      // Replace generic grammar and terms exports with specific types
      const updatedContent = content
        .replace(
          'export { parser } from "./template-json.grammar";',
          `import type { LRParser } from "@lezer/lr";
export declare const parser: LRParser;`,
        )
        .replace(
          'export * from "./template-json.grammar.terms";',
          termDeclarations,
        );

      await writeFile(indexDtsPath, updatedContent, "utf-8");
      console.log(
        `✅ Post-processed types for ${distPath}/index.d.ts (${Object.keys(terms).length} terms found)`,
      );
    } catch (error) {
      console.error(`❌ Error processing ${indexDtsPath}:`, error);
    }
  }
}

postProcessTypes().catch(console.error);
