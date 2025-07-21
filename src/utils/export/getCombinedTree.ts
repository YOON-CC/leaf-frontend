/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TreeNode } from "../../types/fabricTypes";

export type ExportMode = "tree" | "unlinked" | "combined";

export const getCombinedTree = (
  fabricCanvas: any,
  tree: TreeNode[],
  mode: ExportMode = "combined"
): TreeNode[] => {
  if (!fabricCanvas) {
    if (mode === "tree") return tree;
    return [];
  }
  const flattenTreeIds = (node: TreeNode): string[] => {
    return [node.id, ...node.children.flatMap(flattenTreeIds)];
  };

  const treeIds = new Set(tree.flatMap(flattenTreeIds));

  const unlinkedNodes = fabricCanvas
    .getObjects()
    .filter((obj: any) => obj.customId && !treeIds.has(obj.customId))
    .map((obj: any) => ({
      id: obj.customId,
      object: obj,
      children: [],
    }));

  switch (mode) {
    case "tree":
      return tree;
    case "unlinked":
      return unlinkedNodes;
    case "combined":
    default:
      return [...tree, ...unlinkedNodes];
  }
};
