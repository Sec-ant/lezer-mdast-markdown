/**
 * Tests for custom node property extension
 */
import { NodeProp } from "@lezer/common";
import { describe, expect, it } from "vitest";
import { createNodePropConfig, createParser } from "../src";

// Define mock custom node type
interface CustomNode {
  type: "custom";
  value: string;
  count: number;
  children?: never;
}

// Define custom properties
const customValueProp = new NodeProp<string>({ perNode: true });
const customCountProp = new NodeProp<number>({ perNode: true });

describe("Custom node property extension", () => {
  it("should accept custom node configurations", () => {
    // This should compile without errors
    const config = createNodePropConfig<CustomNode>("custom", {
      value: customValueProp,
      count: customCountProp,
    });

    expect(config.nodeType).toBe("custom");
    expect(config.props).toHaveProperty("value");
    expect(config.props).toHaveProperty("count");
  });

  it("should create parser with custom nodeProps option", () => {
    const parser = createParser({
      nodeProps: [
        createNodePropConfig<CustomNode>("custom", {
          value: customValueProp,
          count: customCountProp,
        }),
      ],
    });

    expect(parser).toBeDefined();
    expect(parser.nodeSet).toBeDefined();
  });

  it("should register custom node types in nodeSet", () => {
    const parser = createParser({
      nodeProps: [
        createNodePropConfig<CustomNode>("custom", {
          value: customValueProp,
        }),
      ],
    });

    // Node types are converted to PascalCase (custom -> Custom)
    const hasCustomType = parser.nodeSet.types.some(
      (type) => type.name === "Custom",
    );
    expect(hasCustomType).toBe(true);
  });

  it("should preserve type safety with generic parameter", () => {
    // This test mainly validates TypeScript compilation
    // Invalid property names should cause compile errors

    // ✅ Valid: 'value' and 'count' are properties of CustomNode
    const validConfig = createNodePropConfig<CustomNode>("custom", {
      value: customValueProp,
      count: customCountProp,
    });

    expect(validConfig).toBeDefined();

    // ❌ Invalid: uncomment to see TypeScript error
    // const invalidConfig = createNodePropConfig<CustomNode>("custom", {
    //   invalidProp: customValueProp, // Should error: Property doesn't exist
    // });
  });

  it("should work with multiple custom node types", () => {
    interface NodeA {
      type: "nodeA";
      propA: string;
    }

    interface NodeB {
      type: "nodeB";
      propB: number;
    }

    const propA = new NodeProp<string>({ perNode: true });
    const propB = new NodeProp<number>({ perNode: true });

    const parser = createParser({
      nodeProps: [
        createNodePropConfig<NodeA>("nodeA", { propA }),
        createNodePropConfig<NodeB>("nodeB", { propB }),
      ],
    });

    // Node types are converted to PascalCase
    const nodeAExists = parser.nodeSet.types.some(
      (type) => type.name === "NodeA",
    );
    const nodeBExists = parser.nodeSet.types.some(
      (type) => type.name === "NodeB",
    );

    expect(nodeAExists).toBe(true);
    expect(nodeBExists).toBe(true);
  });

  it("should allow empty nodeProps array", () => {
    const parser = createParser({
      nodeProps: [],
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
