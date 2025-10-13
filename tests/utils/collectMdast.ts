import { pascalCase } from "es-toolkit";
import type { Node, Parent } from "mdast";
import type { PascalCase } from "type-fest";
import type { NodePropMaps } from "../../src/index";
import { NODE_PROP_DEFS } from "../../src/node-definitions";
import type { NormalizedNode } from "../types";

export function collectMdast(
  node: Node | Parent,
  customMaps?: NodePropMaps,
): NormalizedNode {
  const normalized: NormalizedNode = {
    type: pascalCase(node.type),
    from: node.position?.start?.offset || 0,
    to: node.position?.end?.offset || 0,
    children: [],
  };

  // Merge built-in and custom props maps
  const allMaps = customMaps
    ? {
        ...(NODE_PROP_DEFS as NodePropMaps),
        ...customMaps,
      }
    : (NODE_PROP_DEFS as NodePropMaps);

  // Collect props from node based on node type
  // MDAST uses camelCase, but our config keys are PascalCase
  const props: Record<string, unknown> = {};
  const propMap = allMaps[pascalCase(node.type) as PascalCase<string>];
  if (propMap) {
    for (const key of Object.keys(propMap)) {
      const value = (node as unknown as Record<string, unknown>)[key];
      if (value !== undefined && value !== null) {
        props[key] = value;
      }
    }
  }
  if (Object.keys(props).length > 0) {
    normalized.props = props;
  }

  if ("children" in node && Array.isArray(node.children)) {
    normalized.children = node.children.map((child) =>
      collectMdast(child, customMaps),
    );
  }

  return normalized;
}
