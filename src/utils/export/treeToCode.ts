/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TreeNode } from "../../types/fabricTypes";

export const treeToCode = (
  treeNodes: TreeNode[],
  unlinkedNodes?: TreeNode[],
  indent = 0,
  parentLeft = 0,
  parentTop = 0,
  scaleX = 1,
  scaleY = 1
): string => {
  const linkedCode = treeNodes
    .map((node) =>
      generateTreeNodeCode(node, indent, parentLeft, parentTop, scaleX, scaleY)
    )
    .join("\n");

  const unlinkedCode = (unlinkedNodes ?? [])
    .map((node) => generateUnlinkedNodeCode(node, indent, scaleX, scaleY))
    .join("\n");

  return [linkedCode, unlinkedCode].filter(Boolean).join("\n");
};

// 계층없는 노드 관리
const generateUnlinkedNodeCode = (
  node: TreeNode,
  indent: number,
  scaleX: number,
  scaleY: number
): string => {
  const object = node.object as any;

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


      const style = `
        position: absolute;
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
    childrenCode = node.children
      .map((child) =>
        generateTreeNodeCode(child, indent + 1, left, top, scaleX, scaleY)
      )
      .join("\n");
  }

      const divEnd = `${indentSpace}</div>`;
      
      return [divStart, divLabel, childrenCode, divEnd].join("\n");
    })
    .join("\n");
};
