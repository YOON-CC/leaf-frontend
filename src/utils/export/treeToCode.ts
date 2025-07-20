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

      // children이 없으면 재귀 호출 안 함 (unlinked 처리)
      if (node.children && node.children.length > 0) {
        childrenCode = treeToCode(node.children, indent + 1);
      }

      const divEnd = `${indentSpace}</div>`;

      return [divStart, divLabel, childrenCode, divEnd].join("\n");
    })
    .join("\n");
};
// export const treeToCode = (nodes: TreeNode[], indent = 0): string => {
//   return nodes
//     .map((node) => {
//       const shapeType = node.object.get?.("shapeType") || node.object.type;
//       const label =
//         (node.object as any).name || (node.object as any).label || shapeType;

//       const indentSpace = " ".repeat(indent * 2);

//       const id = node.id;

//       // 스타일 정보 가져오기
//       const width = node.object.get?.("width");
//       const height = node.object.get?.("height");
//       const fill = node.object.get?.("fill");
//       const stroke = node.object.get?.("stroke");

//       const styleParts = [];
//       if (width) styleParts.push(`width: ${width}px`);
//       if (height) styleParts.push(`height: ${height}px`);
//       if (fill) styleParts.push(`background-color: ${fill}`);
//       if (stroke) styleParts.push(`border: 1px solid ${stroke}`);

//       const styleAttr =
//         styleParts.length > 0 ? ` style="${styleParts.join("; ")}"` : "";

//       const divStart = `${indentSpace}<div id="${id}"${styleAttr}>`;
//       const divLabel = `${indentSpace}  ${label}`;

//       let childrenCode = "";
//       if (node.children.length > 0) {
//         childrenCode = treeToCode(node.children, indent + 1);
//       }

//       const divEnd = `${indentSpace}</div>`;

//       return [divStart, divLabel, childrenCode, divEnd].join("\n");
//     })
//     .join("\n");
// };
