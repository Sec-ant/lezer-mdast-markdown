#!/usr/bin/env tsx
/**
 * Script to update test fixtures from official sources
 * Supports both CommonMark and GFM test data
 */
import { mkdir, rm, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { commonmark } from "commonmark.json";
import { kebabCase } from "es-toolkit";

interface Fixture {
  markdown: string;
}

interface GitHubContentItem {
  name: string;
  type: "file" | "dir";
}

const FIXTURES_DIR = join(process.cwd(), "tests", "fixtures");

const GFM_REPO_OWNER = "syntax-tree";
const GFM_REPO_NAME = "mdast-util-gfm";
const GFM_VERSION = "3.1.0";
const GFM_FIXTURE_PATH = "test/fixture";

const GFM_API_LIST_URL = `https://api.github.com/repos/${GFM_REPO_OWNER}/${GFM_REPO_NAME}/contents/${GFM_FIXTURE_PATH}?ref=${GFM_VERSION}`;
const GFM_JSDELIVR_BASE = `https://cdn.jsdelivr.net/gh/${GFM_REPO_OWNER}/${GFM_REPO_NAME}@${GFM_VERSION}/${GFM_FIXTURE_PATH}`;

const FRONTMATTER_TEST_URL =
  "https://cdn.jsdelivr.net/gh/micromark/micromark-extension-frontmatter@2.0.0/test/index.js";

const MATH_TEST_URL =
  "https://cdn.jsdelivr.net/gh/micromark/micromark-extension-math@3.1.0/test/index.js";

async function cleanFixturesDir() {
  console.log("\nCleaning fixtures directory...");
  try {
    await rm(FIXTURES_DIR, { recursive: true, force: true });
    console.log(`✓ Cleaned ${FIXTURES_DIR}`);
  } catch (err) {
    console.warn(`⚠ Failed to clean fixtures directory: ${err}`);
  }
}

async function fetchGfmMdFiles(): Promise<Map<string, Fixture[]>> {
  const listResp = await fetch(GFM_API_LIST_URL);
  if (!listResp.ok) {
    throw new Error(
      `Failed to fetch GFM fixtures list: ${listResp.status} ${listResp.statusText}`,
    );
  }

  const files = (await listResp.json()) as GitHubContentItem[];

  const mdFiles = files
    .filter((f) => f.type === "file" && f.name.endsWith(".md"))
    .sort((a, b) => parseInt(a.name, 10) - parseInt(b.name, 10));

  console.log(
    `Found ${mdFiles.length} markdown fixtures, downloading concurrently...`,
  );

  const downloadResults = await Promise.all(
    mdFiles.map(async (file) => {
      const match = /^(\d+)-(.+)\.md$/.exec(file.name);
      if (!match) {
        return {};
      }
      const section = match[2];
      const jsDelivrUrl = `${GFM_JSDELIVR_BASE}/${file.name}`;

      const resp = await fetch(jsDelivrUrl);
      if (!resp.ok) {
        throw new Error(`Fetch failed: ${resp.status} ${resp.statusText}`);
      }

      const markdown = await resp.text();
      return { section, markdown };
    }),
  );

  const fixturesBySection = new Map<string, Fixture[]>();

  for (const { section, markdown } of downloadResults) {
    if (!section || !markdown) {
      continue;
    }
    const list = fixturesBySection.get(section) ?? [];
    list.push({ markdown });
    fixturesBySection.set(section, list);
  }

  return fixturesBySection;
}

async function fetchCommonmarkFixtures() {
  console.log("\nFetching CommonMark fixtures...");

  const fixturesBySection = new Map<string, Fixture[]>();

  for (const { section, markdown } of commonmark) {
    const normalized = kebabCase(section);
    const existing = fixturesBySection.get(normalized) ?? [];
    existing.push({ markdown });
    fixturesBySection.set(normalized, existing);
  }

  const commonmarkDir = join(FIXTURES_DIR, "cm");
  await mkdir(commonmarkDir, { recursive: true });

  for (const [section, fixtures] of fixturesBySection) {
    const filePath = join(commonmarkDir, `${section}.json`);
    await writeFile(filePath, `${JSON.stringify(fixtures, null, 2)}\n`);
    console.log(`✓ Written ${fixtures.length} fixtures to ${section}.json`);
  }

  console.log(`✓ All CommonMark fixtures written to ${commonmarkDir}`);
}

async function fetchGfmFixtures(): Promise<void> {
  console.log("\nFetching GFM test cases from mdast-util-gfm...");

  const fixturesBySection = await fetchGfmMdFiles();
  if (fixturesBySection.size === 0) {
    console.log("No .md fixtures found in GFM directory.");
    return;
  }

  const gfmDir = join(FIXTURES_DIR, "gfm");
  await mkdir(gfmDir, { recursive: true });

  for (const [section, fixtures] of fixturesBySection) {
    const filePath = join(gfmDir, `${section}.json`);
    await writeFile(filePath, `${JSON.stringify(fixtures, null, 2)}\n`);
    console.log(`✓ Written ${fixtures.length} fixtures to ${section}.json`);
  }

  console.log(`✓ All GFM fixtures written to ${gfmDir}`);
}

async function fetchFrontmatterFixtures(): Promise<void> {
  console.log(
    "\nFetching Frontmatter test cases from micromark-extension-frontmatter...",
  );

  const response = await fetch(FRONTMATTER_TEST_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch frontmatter test file: ${response.status} ${response.statusText}`,
    );
  }

  const content = await response.text();
  console.log(`✓ Fetched test file (${content.length} bytes)`);

  // Extract markdown strings from micromark() calls
  // Pattern: micromark('...', { or micromark("...", {
  const fixtures: Fixture[] = [];
  const regex = /micromark\(\s*(['"`])(.+?)\1\s*,\s*\{/gs;

  let match: RegExpExecArray | null;
  // biome-ignore lint: assignment in expression is intentional for regex.exec pattern
  while ((match = regex.exec(content)) !== null) {
    const markdown = match[2]
      // Unescape JavaScript string literals
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\r/g, "\r")
      .replace(/\\\\/g, "\\")
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"');

    // Only include YAML frontmatter tests (starts with ---)
    if (markdown.startsWith("---") || markdown.includes("\n---")) {
      fixtures.push({ markdown });
    }
  }

  console.log(`✓ Extracted ${fixtures.length} YAML frontmatter fixtures`);

  // Remove duplicates
  const uniqueFixtures = Array.from(
    new Map(fixtures.map((f) => [f.markdown, f])).values(),
  );

  console.log(`✓ After deduplication: ${uniqueFixtures.length} fixtures`);

  const frontmatterDir = join(FIXTURES_DIR, "frontmatter");
  await mkdir(frontmatterDir, { recursive: true });

  const filePath = join(frontmatterDir, "yaml.json");
  await writeFile(filePath, `${JSON.stringify(uniqueFixtures, null, 2)}\n`);
  console.log(`✓ Written ${uniqueFixtures.length} fixtures to yaml.json`);

  console.log(`✓ All Frontmatter fixtures written to ${frontmatterDir}`);
}

async function fetchMathFixtures(): Promise<void> {
  console.log("\nFetching Math test cases from micromark-extension-math...");

  const response = await fetch(MATH_TEST_URL);
  if (!response.ok) {
    throw new Error(
      `Failed to fetch math test file: ${response.status} ${response.statusText}`,
    );
  }

  const content = await response.text();
  console.log(`✓ Fetched test file (${content.length} bytes)`);

  // Extract markdown strings from micromark() calls
  const inlineMathFixtures: Fixture[] = [];
  const blockMathFixtures: Fixture[] = [];
  const regex = /micromark\(\s*(['"`])(.+?)\1\s*,\s*\{/gs;

  let match: RegExpExecArray | null;
  // biome-ignore lint: assignment in expression is intentional for regex.exec pattern
  while ((match = regex.exec(content)) !== null) {
    const markdown = match[2]
      // Unescape JavaScript string literals
      .replace(/\\n/g, "\n")
      .replace(/\\t/g, "\t")
      .replace(/\\r/g, "\r")
      .replace(/\\\\/g, "\\")
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"');

    // Categorize by inline ($...$) vs block ($$...$$)
    if (markdown.includes("$$\n") || markdown.match(/^\$\$/m)) {
      // Block math (flow)
      blockMathFixtures.push({ markdown });
    } else if (markdown.includes("$")) {
      // Inline math (text)
      inlineMathFixtures.push({ markdown });
    }
  }

  console.log(
    `✓ Extracted ${inlineMathFixtures.length} inline math and ${blockMathFixtures.length} block math fixtures`,
  );

  // Remove duplicates
  const uniqueInlineFixtures = Array.from(
    new Map(inlineMathFixtures.map((f) => [f.markdown, f])).values(),
  );
  const uniqueBlockFixtures = Array.from(
    new Map(blockMathFixtures.map((f) => [f.markdown, f])).values(),
  );

  console.log(
    `✓ After deduplication: ${uniqueInlineFixtures.length} inline, ${uniqueBlockFixtures.length} block fixtures`,
  );

  const mathDir = join(FIXTURES_DIR, "math");
  await mkdir(mathDir, { recursive: true });

  // Write inline math fixtures
  const inlineFilePath = join(mathDir, "inline-math.json");
  await writeFile(
    inlineFilePath,
    `${JSON.stringify(uniqueInlineFixtures, null, 2)}\n`,
  );
  console.log(
    `✓ Written ${uniqueInlineFixtures.length} fixtures to inline-math.json`,
  );

  // Write block math fixtures
  const blockFilePath = join(mathDir, "block-math.json");
  await writeFile(
    blockFilePath,
    `${JSON.stringify(uniqueBlockFixtures, null, 2)}\n`,
  );
  console.log(
    `✓ Written ${uniqueBlockFixtures.length} fixtures to block-math.json`,
  );

  console.log(`✓ All Math fixtures written to ${mathDir}`);
}

async function main() {
  await cleanFixturesDir();
  await fetchCommonmarkFixtures();
  await fetchGfmFixtures();
  await fetchFrontmatterFixtures();
  await fetchMathFixtures();
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
