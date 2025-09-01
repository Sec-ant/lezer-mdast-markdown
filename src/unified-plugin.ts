/**
 * Unified/remark plugin for mdast-to-lezer transformation
 *
 * This implements a standard way to define the mdast-to-lezer parser
 * using the unified plugin architecture as requested.
 */

import { type NodeSet, type NodeType, Tree } from "@lezer/common";
import type { Node, Parent } from "mdast";
import type { Plugin } from "unified";
import { visit } from "unist-util-visit";

// Define the plugin interface
export interface MdastToLezerOptions {
  nodeTypes?: NodeType[];
  nodeSet?: NodeSet;
}

// Unified plugin for transforming mdast to Lezer-compatible format
export const remarkLezer: Plugin<[MdastToLezerOptions?], Node, void> = (
  options = {},
) => {
  return (tree, file) => {
    // Store the processed mdast tree for later Lezer tree construction
    file.data.mdastTree = tree;

    // Optional: Store additional metadata for Lezer tree construction
    const nodeMap = new Map<
      string,
      {
        type: string;
        content?: string;
        position?: any;
      }
    >();

    visit(tree, (node, index, parent) => {
      const key = `${node.position?.start?.offset}-${node.position?.end?.offset}`;
      nodeMap.set(key, {
        type: node.type,
        content: "value" in node ? (node.value as string) : undefined,
        position: node.position,
      });
    });

    file.data.lezerNodeMap = nodeMap;
  };
};

// Helper function to create a standardized mdast-to-lezer transformer
export function createMdastToLezerTransformer(
  options: MdastToLezerOptions = {},
) {
  return {
    plugin: remarkLezer,
    options,
    // Additional helper methods could be added here
    transformTree: (mdastTree: Node, originalText: string) => {
      // This could contain the actual tree transformation logic
      // For now, it's a placeholder that would be implemented based on our existing logic
      return null; // Would return a Lezer Tree
    },
  };
}

export default remarkLezer;
