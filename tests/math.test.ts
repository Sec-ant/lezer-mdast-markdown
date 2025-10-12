/// <reference types="vite/client" />

import { basename } from "node:path";
import { lowerCase } from "es-toolkit";
import { fromMarkdown } from "mdast-util-from-markdown";
import { mathFromMarkdown } from "mdast-util-math";
import { math } from "micromark-extension-math";
import { describe, expect, test } from "vitest";
import { createNodePropConfig, createParser, metaProp } from "../src";
import type { Fixture } from "./types";
import { collectLezer } from "./utils/collectLezer";
import { collectMdast } from "./utils/collectMdast";

// Test Math (inline and block)
describe("Math Tests", () => {
  const modules = import.meta.glob("./fixtures/math/*.json", {
    import: "default",
    eager: true,
  }) as Record<string, Fixture[]>;

  // Configure parser with math extensions and node props
  const mathParser = createParser({
    extensions: [math()],
    mdastExtensions: [mathFromMarkdown()],
    nodeProps: [
      // Block math node with optional meta (reuse built-in metaProp)
      createNodePropConfig("math", {
        meta: metaProp,
      }),
      // Inline math node (no extra props)
      createNodePropConfig("inlineMath", {}),
    ],
  });

  // Custom props config for test utils
  const mathPropsConfig = {
    math: [{ key: "meta", prop: metaProp }],
    inlineMath: [],
  };

  for (const [path, fixtures] of Object.entries(modules)) {
    const sectionName = lowerCase(basename(path, ".json"));

    describe(`${sectionName}: ${fixtures.length} fixtures`, () => {
      for (const { markdown } of fixtures) {
        test(JSON.stringify(markdown), () => {
          const mdastRaw = fromMarkdown(markdown, {
            extensions: [math()],
            mdastExtensions: [mathFromMarkdown()],
          });
          const lezerRaw = mathParser.parse(markdown);

          // Pass custom props config to both collect functions
          expect(collectLezer(lezerRaw.cursor(), mathPropsConfig)).toEqual(
            collectMdast(mdastRaw, mathPropsConfig),
          );
        });
      }
    });
  }
});
