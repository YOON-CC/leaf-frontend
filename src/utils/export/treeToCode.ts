/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TreeNode } from "../../types/fabricTypes";
// 일단 on에 끝날듯
export const treeToCode = (nodes: TreeNode[], indent = 0): string => {
  return nodes
    .map((node) => {
      const shapeType = node.object.get?.("shapeType") || node.object.type;
      const label =
        (node.object as any).name || (node.object as any).label || shapeType;

      const indentSpace = " ".repeat(indent * 2);

      const id = node.id;

      const divStart = `${indentSpace}<div id="${id}">`;
      const divLabel = `${indentSpace}  ${label}`;

      let childrenCode = "";
      if (node.children.length > 0) {
        childrenCode = treeToCode(node.children, indent + 1);
      }

      const divEnd = `${indentSpace}</div>`;

      return [divStart, divLabel, childrenCode, divEnd].join("\n");
    })
    .join("\n");
};
