import type { TreeCursor } from "@lezer/common";
import { collectNodeProps, type NodePropMaps } from "../../src/index";
import type { NormalizedNode } from "../types";

export function collectLezer(cursor: TreeCursor, customMaps?: NodePropMaps) {
  const normalized: NormalizedNode = {
    type: cursor.type.name,
    from: cursor.from,
    to: cursor.to,
    children: [],
  };

  // Collect props from the tree node
  const tree = cursor.tree;
  if (tree) {
    const props = collectNodeProps(
      {
        type: cursor.type,
        tree,
      },
      customMaps,
    );

    if (Object.keys(props).length > 0) {
      normalized.props = props;
    }
  }

  if (cursor.firstChild()) {
    do {
      normalized.children.push(collectLezer(cursor, customMaps));
    } while (cursor.nextSibling());
    cursor.parent();
  }

  return normalized;
}
