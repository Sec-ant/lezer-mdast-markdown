/**
 * Lezer Tree Compatibility Test
 * Ensures generated trees work properly with Lezer/CodeMirror systems
 */

import {
  defaultHighlightStyle,
  Language,
  LanguageSupport,
  LRLanguage,
  syntaxHighlighting,
} from "@codemirror/language";
import { EditorState } from "@codemirror/state";
import { Tree } from "@lezer/common";
import { describe, expect, test } from "vitest";
import { parser } from "../src";

describe("Lezer Tree Compatibility", () => {
  test("should create valid Lezer Trees", () => {
    const markdown = "# Hello\n\nThis is **bold** and `code`.";
    const tree = parser.parse(markdown);

    // Basic Lezer tree properties
    expect(tree).toBeInstanceOf(Tree);
    expect(tree.type.name).toBe("Root");
    expect(tree.length).toBe(markdown.length);
    expect(tree.topNode).toBeDefined();
  });

  test("should have proper tree structure", () => {
    const markdown = "Hello *world*";
    const tree = parser.parse(markdown);

    // Test tree navigation
    const cursor = tree.cursor();
    const nodeTypes = [];

    do {
      nodeTypes.push(cursor.type.name);
    } while (cursor.next());

    expect(nodeTypes).toContain("Root");
    expect(nodeTypes).toContain("Paragraph");
    expect(nodeTypes).toContain("Text");
    expect(nodeTypes).toContain("Emphasis");
  });

  test("should work with basic Tree operations", () => {
    const markdown = "## Heading\n\n- List item\n- Another item";

    // Test that our trees can be used in basic Lezer operations
    const tree = parser.parse(markdown);

    // Test basic tree operations that CodeMirror would use
    expect(tree).toBeInstanceOf(Tree);
    expect(tree.type.name).toBe("Root");
    expect(tree.length).toBe(markdown.length);

    // Test cursor operations
    const cursor = tree.cursor();
    expect(cursor).toBeDefined();
    expect(cursor.node).toBeDefined();

    // Test iteration which is core to CodeMirror functionality
    let nodeCount = 0;
    tree.iterate({
      enter: () => {
        nodeCount++;
      },
    });
    expect(nodeCount).toBeGreaterThan(0);
  });

  test("should handle cursor navigation correctly", () => {
    const markdown = "Text with [link](url) and more text.";
    const tree = parser.parse(markdown);

    // Test cursor iteration
    const cursor = tree.cursor();
    const nodes = [];

    cursor.iterate((node) => {
      nodes.push({
        type: node.type.name,
        from: node.from,
        to: node.to,
        content: markdown.slice(node.from, node.to),
      });
    });

    expect(nodes.length).toBeGreaterThan(0);
    expect(nodes[0].type).toBe("Root");
    expect(nodes[0].content).toBe(markdown);
  });

  test("should maintain position consistency", () => {
    const markdown = "# Title\n\nParagraph with **bold** text.";
    const tree = parser.parse(markdown);

    // Test that all positions are within bounds and consistent
    tree.iterate({
      enter: (node) => {
        expect(node.from).toBeLessThanOrEqual(node.to);
        expect(node.from).toBeGreaterThanOrEqual(0);
        expect(node.to).toBeLessThanOrEqual(markdown.length);
      },
    });
  });

  test("should handle empty input", () => {
    const tree = parser.parse("");
    expect(tree).toBeInstanceOf(Tree);
    expect(tree.type.name).toBe("Root");
    expect(tree.length).toBe(0);
  });

  test("should handle large documents", () => {
    // Create a reasonably large markdown document
    const lines = [];
    for (let i = 0; i < 100; i++) {
      lines.push(`## Section ${i}`);
      lines.push("");
      lines.push(
        `This is paragraph ${i} with some **bold** and *italic* text.`,
      );
      lines.push("");
      lines.push("- List item 1");
      lines.push("- List item 2");
      lines.push("");
    }
    const markdown = lines.join("\n");

    const tree = parser.parse(markdown);
    expect(tree).toBeInstanceOf(Tree);
    expect(tree.length).toBe(markdown.length);

    // Verify tree can be navigated without errors
    let nodeCount = 0;
    tree.iterate({
      enter: () => {
        nodeCount++;
      },
    });

    expect(nodeCount).toBeGreaterThan(300); // Should have many nodes
  });
});
