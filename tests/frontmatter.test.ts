/// <reference types="vite/client" />

import { basename } from "node:path";
import { Tree } from "@lezer/common";
import { lowerCase } from "es-toolkit";
import { fromMarkdown } from "mdast-util-from-markdown";
import { frontmatterFromMarkdown } from "mdast-util-frontmatter";
import { frontmatter } from "micromark-extension-frontmatter";
import { describe, expect, test } from "vitest";
import { parser } from "../src";
import type { Fixture } from "./types";
import { collectLezer } from "./utils/collectLezer";
import { collectMdast } from "./utils/collectMdast";

// Test YAML frontmatter
describe("Frontmatter (YAML) Tests", () => {
  const modules = import.meta.glob("./fixtures/frontmatter/*.json", {
    import: "default",
    eager: true,
  }) as Record<string, Fixture[]>;

  // Configure parser with frontmatter extensions
  const frontmatterParser = parser.configure({
    extensions: [frontmatter(["yaml"])],
    mdastExtensions: [frontmatterFromMarkdown(["yaml"])],
  });

  for (const [path, fixtures] of Object.entries(modules)) {
    const sectionName = lowerCase(basename(path, ".json"));

    describe(`${sectionName}: ${fixtures.length} fixtures`, () => {
      for (const { markdown } of fixtures) {
        test(JSON.stringify(markdown), () => {
          const mdastRaw = fromMarkdown(markdown, {
            extensions: [frontmatter(["yaml"])],
            mdastExtensions: [frontmatterFromMarkdown(["yaml"])],
          });
          const lezerRaw = frontmatterParser.parse(markdown);

          expect(lezerRaw).toBeInstanceOf(Tree);

          expect(collectLezer(lezerRaw.cursor())).toEqual(
            collectMdast(mdastRaw),
          );
        });
      }
    });
  }
});
