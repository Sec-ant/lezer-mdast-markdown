/**
 * Node properties tests
 */
import { gfmFromMarkdown } from "mdast-util-gfm";
import { gfm } from "micromark-extension-gfm";
import { describe, expect, test } from "vitest";
import {
  alignProp,
  checkedProp,
  depthProp,
  identifierProp,
  labelProp,
  langProp,
  metaProp,
  orderedProp,
  parser,
  spreadProp,
  startProp,
  titleProp,
  urlProp,
} from "../src/index";
import { NODE_TYPE_IDS } from "../src/node-definitions";

// Configure parser with GFM extensions for table and task list tests
const gfmParser = parser.configure({
  extensions: [gfm()],
  mdastExtensions: [gfmFromMarkdown()],
});

describe("Node Properties", () => {
  test("Heading depth property", () => {
    const tree = parser.parse("# H1\n\n## H2\n\n### H3");
    const depths: number[] = [];

    tree.iterate({
      enter(node) {
        if (node.type.id === NODE_TYPE_IDS.Heading) {
          const depth = node.tree?.prop(depthProp);
          if (depth) depths.push(depth);
        }
      },
    });

    expect(depths).toEqual([1, 2, 3]);
  });

  test("Code lang and meta properties", () => {
    const tree = parser.parse(
      '```javascript title="app.js"\nconsole.log("hello");\n```',
    );
    let lang: string | null | undefined;
    let meta: string | null | undefined;

    tree.iterate({
      enter(node) {
        if (node.type.id === NODE_TYPE_IDS.Code) {
          lang = node.tree?.prop(langProp);
          meta = node.tree?.prop(metaProp);
        }
      },
    });

    expect(lang).toBe("javascript");
    expect(meta).toBe('title="app.js"');
  });

  test("List ordered and start properties", () => {
    const tree = parser.parse("5. First\n6. Second");
    let ordered: boolean | null | undefined;
    let start: number | null | undefined;

    tree.iterate({
      enter(node) {
        if (node.type.id === NODE_TYPE_IDS.List) {
          ordered = node.tree?.prop(orderedProp);
          start = node.tree?.prop(startProp);
        }
      },
    });

    expect(ordered).toBe(true);
    expect(start).toBe(5);
  });

  test("List spread property", () => {
    const tree = parser.parse("- Item 1\n\n- Item 2");
    let spread: boolean | null | undefined;

    tree.iterate({
      enter(node) {
        if (node.type.id === NODE_TYPE_IDS.List) {
          spread = node.tree?.prop(spreadProp);
        }
      },
    });

    expect(spread).toBe(true);
  });

  test("Task list checked property", () => {
    const tree = gfmParser.parse("- [ ] Todo\n- [x] Done");
    const checked: Array<boolean | null | undefined> = [];

    tree.iterate({
      enter(node) {
        if (node.type.id === NODE_TYPE_IDS.ListItem) {
          checked.push(node.tree?.prop(checkedProp));
        }
      },
    });

    expect(checked).toEqual([false, true]);
  });

  test("Link url and title properties", () => {
    const tree = parser.parse('[Text](https://example.com "Title")');
    let url: string | null | undefined;
    let title: string | null | undefined;

    tree.iterate({
      enter(node) {
        if (node.type.id === NODE_TYPE_IDS.Link) {
          url = node.tree?.prop(urlProp);
          title = node.tree?.prop(titleProp);
        }
      },
    });

    expect(url).toBe("https://example.com");
    expect(title).toBe("Title");
  });

  test("Definition identifier and label properties", () => {
    const tree = parser.parse('[foo]: https://example.com "Title"\n\n[foo]');
    let identifier: string | null | undefined;
    let label: string | null | undefined;

    tree.iterate({
      enter(node) {
        if (node.type.name === "Definition") {
          identifier = node.tree?.prop(identifierProp);
          label = node.tree?.prop(labelProp);
        }
      },
    });

    expect(identifier).toBe("foo");
    expect(label).toBe("foo");
  });

  test("Table align property", () => {
    const tree = gfmParser.parse(
      "| Left | Center | Right |\n| :--- | :----: | ----: |\n| A | B | C |",
    );
    let align: Array<"left" | "right" | "center" | null> | null | undefined;

    tree.iterate({
      enter(node) {
        if (node.type.name === "Table") {
          align = node.tree?.prop(alignProp);
        }
      },
    });

    expect(align).toEqual(["left", "center", "right"]);
  });

  test("Nodes without properties should have no props", () => {
    const tree = parser.parse("Plain paragraph text.");
    let hasProps = false;

    tree.iterate({
      enter(node) {
        if (node.type.name === "Paragraph") {
          // Check if any prop exists
          hasProps =
            node.tree?.prop(depthProp) !== undefined ||
            node.tree?.prop(langProp) !== undefined;
        }
      },
    });

    expect(hasProps).toBe(false);
  });
});
