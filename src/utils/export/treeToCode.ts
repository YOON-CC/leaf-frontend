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

      const left = (node.object as any).left || 0;
      const top = (node.object as any).top || 0;
      // left, top은 지금 임시고,
      // 이거 나중에 mt, ml, mr,mb,
      // flex, justify-center,justify-between, items-center 필요하고
      // 위의 요소가 적용되면, 이후 세부 움직임은, margin으로 가져가야할듯 ㅇㅇ
      // ✅ 정렬 속성 가져오기 (fabric.Object에 저장해둔 값)
      const alignSelf = (node.object as any).alignSelf || "none";
      const justifyChildren = (node.object as any).justifyChildren || "none";
      const itemsChildren = (node.object as any).itemsChildren || "center";
      console.log(alignSelf, justifyChildren, itemsChildren);

      const style = `
        position: relative;
        width: ${width}px;
        height: ${height}px;
        background-color: ${fill};
        border: 1px solid ${stroke};
        left: ${left}px;
        top: ${top}px;
      `
        .trim()
        .replace(/\s+/g, " ");

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
