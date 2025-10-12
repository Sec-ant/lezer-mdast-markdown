/// <reference types="vite/client" />

import { basename } from "node:path";
import { Tree } from "@lezer/common";
import { lowerCase } from "es-toolkit";
import { fromMarkdown } from "mdast-util-from-markdown";
import { gfmFromMarkdown } from "mdast-util-gfm";
import { gfm } from "micromark-extension-gfm";
import { describe, expect, test } from "vitest";
import { parser } from "../src";
import type { Fixture } from "./types";
import { collectLezer } from "./utils/collectLezer";
import { collectMdast } from "./utils/collectMdast";

// Test all Github flavored markdown fixtures
describe("Github Flavored Markdown Tests", () => {
  const modules = import.meta.glob("./fixtures/gfm/*.json", {
    import: "default",
    eager: true,
  }) as Record<string, Fixture[]>;

  // Configure parser with GFM extensions
  const gfmParser = parser.configure({
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  });

  for (const [path, fixtures] of Object.entries(modules)) {
    const sectionName = lowerCase(basename(path, ".json"));

    describe(`${sectionName}: ${fixtures.length} fixtures`, () => {
      for (const { markdown } of fixtures) {
        test(JSON.stringify(markdown), () => {
          const mdastRaw = fromMarkdown(markdown, {
            extensions: [gfm()],
            mdastExtensions: [gfmFromMarkdown()],
          });
          const lezerRaw = gfmParser.parse(markdown);

          expect(lezerRaw).toBeInstanceOf(Tree);

          expect(collectLezer(lezerRaw.cursor())).toEqual(
            collectMdast(mdastRaw),
          );
        });
      }
    });
  }
});
