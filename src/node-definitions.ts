/**
 * Node Definitions - Single Source of Truth
 *
 * This file contains all node type and property definitions in one place.
 * All node properties are type-safe and automatically validated against MDAST types.
 *
 * Architecture:
 * 1. Define NodeProp instances with types extracted from MDAST
 * 2. Declare NODE_PROP_DEFS mapping nodes to their props (single source)
 * 3. Auto-generate all derived data (BUILTIN_PROPS, nodePropMaps, etc.)
 */

import { NodeProp, NodeSet, NodeType } from "@lezer/common";
import { pascalCase } from "es-toolkit";
import type {
  Code,
  Definition,
  Heading,
  Image,
  Link,
  LinkReference,
  List,
  ListItem,
  Nodes,
  Table,
} from "mdast";
import type { CamelCase, PascalCase } from "type-fest";
import { markdownHighlighting } from "./highlight";

// ============================================================================
// Type Utilities
// ============================================================================

/**
 * Extract relevant semantic attributes from MDAST node types.
 * Excludes structural properties handled by Lezer Tree.
 */
export type NodeAttributes<T> = Omit<
  T,
  "type" | "position" | "children" | "data"
>;

/**
 * Type-safe property mapping for a specific MDAST node type.
 * Ensures that only valid properties of the node can be mapped.
 */
type NodePropMapping<T> = {
  [K in keyof NodeAttributes<T>]?: NodeProp<NodeAttributes<T>[K]>;
};

/**
 * Node property mappings for multiple node types.
 * Keys are PascalCase node type names (Lezer convention).
 *
 * @example
 * ```ts
 * const customMaps: NodePropMaps = {
 *   TextDirective: { name: directiveNameProp },
 *   Math: { meta: mathMetaProp },
 * };
 * ```
 */
export type NodePropMaps = Record<string, Record<string, NodeProp<unknown>>>;

/**
 * Extract MDAST node type from PascalCase key.
 *
 * Strategy: Convert PascalCase key to camelCase, then extract the matching node from Nodes union.
 * Example: "Heading" → "heading" → Extract<Nodes, { type: "heading" }> → Heading interface
 */
type MdastNodeFromPascalKey<K extends string> = Extract<
  Nodes,
  { type: CamelCase<K> }
>;

/**
 * Type constraint for NODE_PROP_DEFS.
 * Ensures each key (PascalCase) maps to props of the corresponding MDAST node type.
 */
type NodePropDefsConstraint = {
  [K in PascalCase<Nodes["type"]>]?: NodePropMapping<MdastNodeFromPascalKey<K>>;
};

// Base node interface for any MDAST-like node
interface BaseNode {
  type: string;
}

// Configuration for node properties - returned by defineNodeProps helper
export type PropConfig = {
  nodeType: string;
  props: Record<string, NodeProp<unknown>>;
};

/**
 * Helper function for type-safe node property configuration.
 * Used internally for built-in MDAST nodes and exported for user extensions.
 *
 * @example
 * ```ts
 * import { createNodePropConfig } from 'lezer-markdown';
 * import type { TextDirective } from 'mdast-util-directive';
 *
 * const config = createNodePropConfig<TextDirective>('textDirective', {
 *   name: directiveNameProp,
 *   attributes: directiveAttrProp,
 * });
 * ```
 */
export function createNodePropConfig<T extends BaseNode>(
  nodeType: T["type"],
  props: NodePropMapping<T>,
): PropConfig {
  return {
    nodeType,
    props: props as Record<string, NodeProp<unknown>>,
  };
}

// ============================================================================
// NodeProp Instances - Types extracted from MDAST
// ============================================================================

// All NodeProp instances with types automatically extracted from MDAST definitions
// TypeScript ensures these match the actual MDAST node property types

export const depthProp = new NodeProp<NodeAttributes<Heading>["depth"]>({
  perNode: true,
});

export const langProp = new NodeProp<NodeAttributes<Code>["lang"]>({
  perNode: true,
});

export const metaProp = new NodeProp<NodeAttributes<Code>["meta"]>({
  perNode: true,
});

export const orderedProp = new NodeProp<NodeAttributes<List>["ordered"]>({
  perNode: true,
});

export const startProp = new NodeProp<NodeAttributes<List>["start"]>({
  perNode: true,
});

export const spreadProp = new NodeProp<NodeAttributes<List>["spread"]>({
  perNode: true,
});

export const checkedProp = new NodeProp<NodeAttributes<ListItem>["checked"]>({
  perNode: true,
});

export const alignProp = new NodeProp<NodeAttributes<Table>["align"]>({
  perNode: true,
});

export const urlProp = new NodeProp<NodeAttributes<Link>["url"]>({
  perNode: true,
});

export const titleProp = new NodeProp<NodeAttributes<Link>["title"]>({
  perNode: true,
});

export const identifierProp = new NodeProp<
  NodeAttributes<Definition>["identifier"]
>({
  perNode: true,
});

export const labelProp = new NodeProp<NodeAttributes<Definition>["label"]>({
  perNode: true,
});

export const altProp = new NodeProp<NodeAttributes<Image>["alt"]>({
  perNode: true,
});

export const referenceTypeProp = new NodeProp<
  NodeAttributes<LinkReference>["referenceType"]
>({
  perNode: true,
});

// ============================================================================
// Single Source of Truth - Node Property Definitions
// ============================================================================

/**
 * NODE_PROP_DEFS - The single source of truth for all node properties.
 *
 * Maps MDAST node types (PascalCase) to their properties.
 * Used internally by collectProps() and collectNodeProps().
 *
 * @internal
 * Note: This is exported for testing utilities and advanced use cases.
 * For normal usage, import individual NodeProp instances (depthProp, langProp, etc.)
 * which can be reused when defining customMaps.
 *
 * @example
 * ```ts
 * // Preferred: Use individual exported props
 * import { metaProp } from 'lezer-markdown';
 * const customMaps = { Math: { meta: metaProp } };
 * ```
 */
export const NODE_PROP_DEFS = {
  Heading: {
    depth: depthProp,
  },

  Code: {
    lang: langProp,
    meta: metaProp,
  },

  List: {
    ordered: orderedProp,
    start: startProp,
    spread: spreadProp,
  },

  ListItem: {
    spread: spreadProp,
    checked: checkedProp,
  },

  Table: {
    align: alignProp,
  },

  Link: {
    url: urlProp,
    title: titleProp,
  },

  Image: {
    url: urlProp,
    title: titleProp,
    alt: altProp,
  },

  Definition: {
    identifier: identifierProp,
    label: labelProp,
    url: urlProp,
    title: titleProp,
  },

  LinkReference: {
    identifier: identifierProp,
    label: labelProp,
    referenceType: referenceTypeProp,
  },

  ImageReference: {
    identifier: identifierProp,
    label: labelProp,
    referenceType: referenceTypeProp,
    alt: altProp,
  },
} as const satisfies Partial<NodePropDefsConstraint>;

// ============================================================================
// Node Types
// ============================================================================

/**
 * Built-in MDAST node types from CommonMark, GFM, and Frontmatter specifications.
 * TypeScript ensures these are valid MDAST node type names.
 */
export const BUILTIN_MDAST_NODE_TYPES = [
  "root",
  "paragraph",
  "heading",
  "thematicBreak",
  "blockquote",
  "code",
  "list",
  "listItem",
  "html",
  "definition",
  "text",
  "emphasis",
  "strong",
  "inlineCode",
  "break",
  "link",
  "image",
  "linkReference",
  "imageReference",
  "footnoteReference",
  "footnoteDefinition",
  // GFM extensions
  "table",
  "tableRow",
  "tableCell",
  "delete", // strikethrough
  // Frontmatter (YAML only, most common format)
  "yaml",
] as const satisfies ReadonlyArray<Nodes["type"]>;

export type BuiltinMdastNodeType = (typeof BUILTIN_MDAST_NODE_TYPES)[number];

/**
 * Create a NodeSet with dynamic node types support.
 * Allows users to add custom node types for extensions.
 */
export function createNodeSet(additionalTypes: string[] = []): {
  nodeSet: NodeSet;
  encoder: (type: string) => number;
  nodeTypeIds: Record<string, number>;
} {
  // Combine built-in types with additional types
  const allTypes = [...BUILTIN_MDAST_NODE_TYPES, ...additionalTypes];
  // Remove duplicates while preserving order
  const uniqueTypes = Array.from(new Set(allTypes));

  // Create NodeType instances with sequential IDs
  // ID 0 is reserved for error token (Lezer convention)
  const nodeTypes = [
    NodeType.define({ id: 0, name: "⚠", error: true }),
    ...uniqueTypes.map((type, index) =>
      NodeType.define({
        id: index + 1,
        name: pascalCase(type),
        top: type === "root",
      }),
    ),
  ];

  // Create NodeSet with syntax highlighting applied to all nodes
  const nodeSet = new NodeSet(nodeTypes).extend(markdownHighlighting);

  // Create encoder: MDAST type string → NodeType ID
  const typeToId = new Map(uniqueTypes.map((type, index) => [type, index + 1]));
  const encoder = (type: string): number => {
    const id = typeToId.get(type);
    if (id === undefined) {
      // Return error token ID if type not found
      return 0;
    }
    return id;
  };

  // Export node type IDs for reference (including error token)
  const nodeTypeIds = Object.fromEntries(nodeTypes.map((t) => [t.name, t.id]));

  return { nodeSet, encoder, nodeTypeIds };
}

// Default configuration (built-in types only)
const DEFAULT_NODE_CONFIG = createNodeSet();

// Export NodeType IDs as a single object for internal and advanced usage
export const NODE_TYPE_IDS = DEFAULT_NODE_CONFIG.nodeTypeIds;

// ============================================================================
// Utility Functions for Property Collection
// ============================================================================

/**
 * Collect properties from an MDAST node based on configured property mappings.
 * Supports both built-in and user-defined node properties.
 *
 * @param node - MDAST node to extract properties from
 * @param customMaps - Optional custom property mappings for extended node types (PascalCase keys)
 * @returns Array of [NodeProp, value] tuples for Tree constructor
 */
export function collectProps(
  node: Nodes,
  customMaps?: NodePropMaps,
): Array<[NodeProp<unknown>, unknown]> {
  // Convert MDAST camelCase type to PascalCase for lookup
  const pascalKey = pascalCase(node.type);
  const propMap =
    (NODE_PROP_DEFS as Record<string, Record<string, NodeProp<unknown>>>)[
      pascalKey
    ] || customMaps?.[pascalKey];
  if (!propMap) return [];

  const props: Array<[NodeProp<unknown>, unknown]> = [];
  const nodeRecord = node as unknown as Record<string, unknown>;

  for (const [key, nodeProp] of Object.entries(propMap)) {
    const value = nodeRecord[key];
    if (value !== undefined && value !== null) {
      props.push([nodeProp, value]);
    }
  }

  return props;
}

/**
 * Collect node properties from a Lezer tree node.
 * Automatically collects built-in properties and any custom properties provided.
 *
 * @param node - Lezer tree node (from tree.iterate callback)
 * @param customMaps - Optional custom property mappings for extended node types (PascalCase keys)
 * @returns Object with collected property values
 *
 * @example
 * ```ts
 * import { collectNodeProps } from 'lezer-markdown';
 *
 * tree.iterate({
 *   enter(node) {
 *     // Collect built-in props only
 *     const props = collectNodeProps(node);
 *     console.log(props); // { depth: 1 } for Heading nodes
 *
 *     // Collect built-in + custom props
 *     const allProps = collectNodeProps(node, {
 *       TextDirective: { name: directiveNameProp },
 *     });
 *   }
 * });
 * ```
 */
export function collectNodeProps(
  node: {
    type: { name: string };
    tree?: { prop(prop: NodeProp<unknown>): unknown } | null;
  },
  customMaps?: NodePropMaps,
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  // Merge built-in and custom mappings
  const allMaps = customMaps
    ? {
        ...(NODE_PROP_DEFS as Record<
          string,
          Record<string, NodeProp<unknown>>
        >),
        ...customMaps,
      }
    : (NODE_PROP_DEFS as Record<string, Record<string, NodeProp<unknown>>>);

  // Look up props for this node type (already PascalCase)
  const propMap = allMaps[node.type.name];
  if (!propMap || !node.tree) return result;

  // Collect all defined properties
  for (const [key, prop] of Object.entries(propMap)) {
    const value = node.tree.prop(prop);
    if (value !== undefined && value !== null) {
      result[key] = value;
    }
  }

  return result;
}
