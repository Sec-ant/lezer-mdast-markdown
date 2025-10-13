/**
 * Tests for custom node property extension
 */
import { NodeProp } from "@lezer/common";
import { describe, expect, it } from "vitest";
import { createParser } from "../src";

// Define custom properties
const customValueProp = new NodeProp<string>({ perNode: true });
const customCountProp = new NodeProp<number>({ perNode: true });

describe("Custom node property extension", () => {
  it("should accept custom node configurations", () => {
    // This should compile without errors
    const parser = createParser({
      nodeProps: {
        Custom: {
          value: customValueProp,
          count: customCountProp,
        },
      },
    });

    expect(parser).toBeDefined();
    expect(parser.nodeSet).toBeDefined();
  });

  it("should create parser with custom nodeProps option", () => {
    const parser = createParser({
      nodeProps: {
        Custom: {
          value: customValueProp,
          count: customCountProp,
        },
      },
    });

    expect(parser).toBeDefined();
    expect(parser.nodeSet).toBeDefined();
  });

  it("should register custom node types in nodeSet", () => {
    const parser = createParser({
      nodeProps: {
        Custom: {
          value: customValueProp,
        },
      },
    });

    // Node types use PascalCase (Custom)
    const hasCustomType = parser.nodeSet.types.some(
      (type) => type.name === "Custom",
    );
    expect(hasCustomType).toBe(true);
  });

  it("should work with multiple custom node types", () => {
    const propA = new NodeProp<string>({ perNode: true });
    const propB = new NodeProp<number>({ perNode: true });

    const parser = createParser({
      nodeProps: {
        NodeA: { propA },
        NodeB: { propB },
      },
    });

    // Node types use PascalCase
    const nodeAExists = parser.nodeSet.types.some(
      (type) => type.name === "NodeA",
    );
    const nodeBExists = parser.nodeSet.types.some(
      (type) => type.name === "NodeB",
    );

    expect(nodeAExists).toBe(true);
    expect(nodeBExists).toBe(true);
  });

  it("should allow empty nodeProps object", () => {
    const parser = createParser({
      nodeProps: {},
    });

    expect(parser).toBeDefined();
  });

  it("should allow undefined nodeProps", () => {
    const parser = createParser({
      nodeProps: undefined,
    });

    expect(parser).toBeDefined();
  });

  it("should work without options", () => {
    // Parser should work without any options
    const parser = createParser();
    expect(parser).toBeDefined();

    // Parser should work with other options
    const parser2 = createParser({
      extensions: [],
      mdastExtensions: [],
    });
    expect(parser2).toBeDefined();
  });
});
