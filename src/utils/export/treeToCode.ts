/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TreeNode } from "../../types/fabricTypes";

export const treeToCode = (
  treeNodes: TreeNode[],
  unlinkedNodes?: TreeNode[],
  imageData?: any,
  indent = 0,
  parentLeft = 0,
  parentTop = 0,
  scaleX = 1,
  scaleY = 1
): string => {
  const linkedCode = treeNodes
    .map((node) =>
      generateTreeNodeCode(
        node,
        indent,
        parentLeft,
        parentTop,
        scaleX,
        scaleY,
        imageData
      )
    )
    .join("\n");

  const unlinkedCode = (unlinkedNodes ?? [])
    .map((node) =>
      generateUnlinkedNodeCode(node, indent, scaleX, scaleY, imageData)
    )
    .join("\n");

  return [linkedCode, unlinkedCode].filter(Boolean).join("\n");
};

// 계층없는 노드 관리
const generateUnlinkedNodeCode = (
  node: TreeNode,
  indent: number,
  scaleX: number,
  scaleY: number,
  imageData: any
): string => {
  const object = node.object as any;
  console.log(object.shapeType, object, imageData[node.id]);

  // 애니메이션 출력
  const animation = object.animation || "";
  const animationAttr = `data-animation="${animation}"`;

  // 이미지의 경우
  if (object.shapeType === "image") {
    const indentSpace = " ".repeat(indent * 2);
    const id = node.id;
    const width = (imageData[node.id][0] || 0) * scaleX;
    const height = (imageData[node.id][1] || 0) * scaleY;
    const left = (object.left || 0) * scaleX;
    const top = (object.top || 0) * scaleY;

    const style = `
    position: absolute;
    width: ${width}px;
    height: ${height}px;
    margin-left: ${left}px;
    margin-top: ${top}px;
  `
      .trim()
      .replace(/\s+/g, " ");

    const divStart = `${indentSpace}<img id="${id}" src="${object.src}" style="${style}"  ${animationAttr}/>`;

    return [divStart].join("\n");
  }

  // 이미지가 아닌경우
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
    margin-left: ${left}px;
    margin-top: ${top}px;
  `
    .trim()
    .replace(/\s+/g, " ");

  const divStart = `${indentSpace}<div id="${id}" style="${style}"  ${animationAttr}>`;
  const divEnd = `${indentSpace}</div>`;

  return [divStart, divEnd].join("\n");
};

// 계층 코드 관리
// 계층 코드 관리
const generateTreeNodeCode = (
  node: TreeNode,
  indent: number,
  parentLeft: number,
  parentTop: number,
  scaleX: number,
  scaleY: number,
  imageData?: any
): string => {
  const indentSpace = " ".repeat(indent * 2);
  const id = node.id;

  const object = node.object as any;

  const width = (object.width ?? 0) * scaleX;
  const height = (object.height ?? 0) * scaleY;
  const fill = object.fill || "transparent";
  const stroke = object.stroke || "none";
  const left = (object.left ?? 0) * scaleX;
  const top = (object.top ?? 0) * scaleY;

  const animation = object.animation || "";
  const animationAttr = animation ? ` data-animation="${animation}"` : "";

  const isRoot = indent === 0;

  let style = "";

  if (isRoot) {
    style = `
      position: absolute;
      width: ${width}px;
      height: ${height}px;
      background-color: ${fill};
      border: 1px solid ${stroke};
      margin-left: ${left}px;
      margin-top: ${top}px;
    `;
  } else {
    const childrenLeft = left - parentLeft;
    const childrenTop = top - parentTop;

    if (object.shapeType === "image") {
      const imageWidth = (imageData[node.id]?.[0] || 0) * scaleX;
      const imageHeight = (imageData[node.id]?.[1] || 0) * scaleY;
      style = `
        position: absolute;
        width: ${imageWidth}px;
        height: ${imageHeight}px;
        margin-left: ${childrenLeft}px;
        margin-top: ${childrenTop}px;
      `;
    } else {
      style = `
        position: absolute;
        width: ${width}px;
        height: ${height}px;
        background-color: ${fill};
        border: 1px solid ${stroke};
        margin-left: ${childrenLeft}px;
        margin-top: ${childrenTop}px;
      `;
    }
  }

  style = style.trim().replace(/\s+/g, " ");

  // 이미지 태그 처리
  if (object.shapeType === "image") {
    const divStart = `${indentSpace}<img id="${id}" src="${object.src}" style="${style}"${animationAttr}/>`;
    const childrenCode = (node.children || [])
      .map((child) =>
        generateTreeNodeCode(
          child,
          indent + 1,
          left,
          top,
          scaleX,
          scaleY,
          imageData
        )
      )
      .join("\n");
    return [divStart, childrenCode].join("\n");
  }

  // div 태그 처리
  const divStart = `${indentSpace}<div id="${id}" style="${style}"${animationAttr}>`;
  const childrenCode = (node.children || [])
    .map((child) =>
      generateTreeNodeCode(
        child,
        indent + 1,
        left,
        top,
        scaleX,
        scaleY,
        imageData
      )
    )
    .join("\n");
  const divEnd = `${indentSpace}</div>`;

  return [divStart, childrenCode, divEnd].join("\n");
};
