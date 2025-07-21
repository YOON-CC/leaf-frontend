/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TreeNode } from "../../types/fabricTypes";

export const treeToCode = (nodes: TreeNode[], indent = 0): string => {
  return nodes
    .map((node) => {
      const shapeType = node.object.get?.("shapeType") || node.object.type;
      const label =
        (node.object as any).name || (node.object as any).label || shapeType;

      const indentSpace = " ".repeat(indent * 2);
      const id = node.id;

      const width = (node.object as any).width || 0;
      const height = (node.object as any).height || 0;
      const fill = (node.object as any).fill || "transparent";
      const stroke = (node.object as any).stroke || "none";

      const style = `width:${width}px; height:${height}px; background-color:${fill}; border: 1px solid ${stroke};`;
      console.log("✅✅", style);
      const divStart = `${indentSpace}<div id="${id}" style="${style}">`;
      const divLabel = `${indentSpace}  ${label}`;

      let childrenCode = "";
      if (node.children && node.children.length > 0) {
        childrenCode = treeToCode(node.children, indent + 1);
      }

      const divEnd = `${indentSpace}</div>`;

      return [divStart, divLabel, childrenCode, divEnd].join("\n");
    })
    .join("\n");
};
