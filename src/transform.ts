/**
 * MDAST to Lezer Tree transformer with property preservation
 */
import { type NodeProp, type NodeSet, Tree } from "@lezer/common";
import type { Nodes, Root } from "mdast";
import { collectProps, type PropConfig } from "./node-definitions";

/**
 * Convert MDAST tree to Lezer Tree with preserved properties
 */
export function mdastToLezerTree(
  mdast: Root,
  text: string,
  nodeSet: NodeSet,
  encoder: (type: string) => number,
  customPropConfigs?: PropConfig[],
): Tree {
  // Build custom property maps if provided
  const customMaps = customPropConfigs
    ? Object.fromEntries(
        customPropConfigs.map((config) => [config.nodeType, config.props]),
      )
    : undefined;

  /**
   * Recursively build Tree from MDAST node
   */
  function visit(node: Nodes): Tree {
    const typeId = encoder(node.type);
    const nodeType = nodeSet.types[typeId];
    const start = node.position?.start.offset ?? 0;
    const end = node.position?.end.offset ?? text.length;

    // Build children
    const children: Tree[] = [];
    const positions: number[] = [];
    if ("children" in node && Array.isArray(node.children)) {
      for (const child of node.children) {
        const childTree = visit(child);
        const childStart = child.position?.start.offset ?? start;
        children.push(childTree);
        positions.push(childStart - start); // Relative position
      }
    }

    // Collect node properties (built-in + custom)
    const props = collectProps(
      node,
      customMaps as Record<string, Record<string, NodeProp<unknown>>>,
    );

    return new Tree(
      nodeType,
      children,
      positions,
      end - start,
      props.length > 0 ? props : undefined,
    );
  }

  // Build root tree
  const children: Tree[] = [];
  const positions: number[] = [];
  if (mdast.children) {
    for (const child of mdast.children) {
      const childTree = visit(child);
      const childStart = child.position?.start.offset ?? 0;
      children.push(childTree);
      positions.push(childStart);
    }
  }

  return new Tree(
    nodeSet.types[encoder("root")],
    children,
    positions,
    text.length,
  );
}
