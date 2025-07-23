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

  const width = (object.width || 0) * scaleX;
  const height = (object.height || 0) * scaleY;
  const left = (object.left || 0) * scaleX;
  const top = (object.top || 0) * scaleY;
  const fill = object.fill || "transparent";
  const stroke = object.stroke || "none";

  const style = `
    position: absolute;
    width: ${width}px;
    height: ${height}px;
    background-color: ${fill};
    border: 1px solid ${stroke};
    left: ${left}px;
    top: ${top}px;
  `.trim().replace(/\s+/g, " ");

  const divStart = `${indentSpace}<div id="${id}" style="${style}">`;
  const divEnd = `${indentSpace}</div>`;

  return [divStart, divEnd].join("\n");
};



// 계층 코드 관리
const generateTreeNodeCode = (
  node: TreeNode,
  indent: number,
  parentLeft: number,
  parentTop: number,
  scaleX: number,
  scaleY: number
): string => {
  const indentSpace = " ".repeat(indent * 2);
  const id = node.id;

  // 원래 값을 any로 접근
  const object = node.object as any;

  // 스케일 적용 (width/left 는 scaleX, height/top 은 scaleY)
  const width = (object.width ?? 0) * scaleX;
  const height = (object.height ?? 0) * scaleY;
  const fill = object.fill || "transparent";
  const stroke = object.stroke || "none";
  const left = (object.left ?? 0) * scaleX;
  const top = (object.top ?? 0) * scaleY;

  const isRoot = indent === 0;

  let style = "";
  if (isRoot) {
    style = `
      position: absolute;
      width: ${width}px;
      height: ${height}px;
      background-color: ${fill};
      border: 1px solid ${stroke};
      left: ${left}px;
      top: ${top}px;
    `;
  } else {
    // 부모 위치 차이 계산 시에도 scaleX, scaleY 반영
    const childrenLeft = left - parentLeft;
    const childrenTop = top - parentTop;
    style = `
      position: absolute;
      width: ${width}px;
      height: ${height}px;
      background-color: ${fill};
      border: 1px solid ${stroke};
      left: ${childrenLeft}px;
      top: ${childrenTop}px;
    `;
  }

  style = style.trim().replace(/\s+/g, " ");
  const divStart = `${indentSpace}<div id="${id}" style="${style}">`;

  let childrenCode = "";
  if (node.children && node.children.length > 0) {
    childrenCode = node.children
      .map((child) =>
        generateTreeNodeCode(child, indent + 1, left, top, scaleX, scaleY)
      )
      .join("\n");
  }

  const divEnd = `${indentSpace}</div>`;
  return [divStart, childrenCode, divEnd].join("\n");
};
