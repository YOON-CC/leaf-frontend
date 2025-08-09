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
  const animation = object.animation || "";
  const animationAttr = `data-animation="${animation}"`;
  const indentSpace = " ".repeat(indent * 2);
  const id = node.id;
  console.log(object);
  // 그림자 CSS 문자열 생성
  let boxShadowStyle = "";
  if (object.shadow) {
    const {
      color = "rgba(0,0,0,0.5)",
      blur = 3,
      offsetX = 0,
      offsetY = 0,
    } = object.shadow;
    boxShadowStyle = `box-shadow: ${offsetX}px ${offsetY}px ${blur}px ${color};`;
  }

  // 이미지일 경우
  if (object.shapeType === "image") {
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
      ${boxShadowStyle}
    `
      .trim()
      .replace(/\s+/g, " ");

    return `${indentSpace}<img id="${id}" src="${object.src}" style="${style}" ${animationAttr}/>`;
  }

  if (object.shapeType === "text") {
    const left = (object.left || 0) * scaleX;
    const top = (object.top || 0) * scaleY;
    const fontSize = (object.fontSize || 16) * ((scaleX + scaleY) / 2);
    const color = object.fill || "#000000";

    const style = `
    position: absolute;
    margin-left: ${left}px;
    margin-top: ${top}px;
    color: ${color};
    font-size: ${fontSize}px;
    white-space: nowrap;
  `
      .trim()
      .replace(/\s+/g, " ");

    const textContent = object.text || "";

    return `${indentSpace}<div id="${id}" style="${style}" ${animationAttr}>${textContent}</div>`;
  }

  // 일반 도형일 경우
  const width = (object.width || 0) * scaleX;
  const height = (object.height || 0) * scaleY;
  const left = (object.left || 0) * scaleX;
  const top = (object.top || 0) * scaleY;
  const fill = object.fill || "transparent";
  const stroke = object.stroke || "none";

  // border 관련 처리
  const borderWidth = object.strokeWidth;
  console.log(object);
  const borderStyle =
    borderWidth === 0
      ? "border: none;"
      : `border: ${borderWidth}px solid ${stroke};`;

  // rounded 관련 처리
  const rx = object.rx || 0;
  const ry = object.ry || 0;
  const borderRadiusStyle =
    rx || ry ? `border-radius: ${Math.max(rx, ry)}px;` : "";

  const style = `
    position: absolute;
    width: ${width}px;
    height: ${height}px;
    background-color: ${fill};
    ${borderStyle}
    margin-left: ${left}px;
    margin-top: ${top}px;
    ${boxShadowStyle}
    ${borderRadiusStyle}
  `
    .trim()
    .replace(/\s+/g, " ");

  return `${indentSpace}<div id="${id}" style="${style}" ${animationAttr}></div>`;
};

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
  const stroke = object.stroke || "#000000";
  const borderWidth = object.strokeWidth;
  const left = (object.left ?? 0) * scaleX;
  const top = (object.top ?? 0) * scaleY;

  const animation = object.animation || "";
  const animationAttr = animation ? ` data-animation="${animation}"` : "";

  const isRoot = indent === 0;

  // ✅ 그림자 처리
  const shadow = object.shadow;
  let boxShadow = "";
  if (shadow) {
    const shadowOffsetX = (shadow.offsetX ?? 0) * scaleX;
    const shadowOffsetY = (shadow.offsetY ?? 0) * scaleY;
    const shadowBlur = (shadow.blur ?? 0) * Math.max(scaleX, scaleY);
    const shadowColor = shadow.color || "rgba(0,0,0,0.5)";
    boxShadow = `box-shadow: ${shadowOffsetX}px ${shadowOffsetY}px ${shadowBlur}px ${shadowColor};`;
  }

  // ✅ border 처리
  const borderStyle =
    borderWidth === 0
      ? "border: none;"
      : `border: ${borderWidth}px solid ${stroke};`;

  // ✅ rounded 관련 처리
  const rx = object.rx || 0;
  const ry = object.ry || 0;
  const borderRadiusStyle =
    rx || ry ? `border-radius: ${Math.max(rx, ry)}px;` : "";

  let style = "";

  if (isRoot) {
    style = `
      position: absolute;
      width: ${width}px;
      height: ${height}px;
      margin-left: ${left}px;
      margin-top: ${top}px;
    `;
  } else {
    const childrenLeft = left - parentLeft;
    const childrenTop = top - parentTop;

    if (object.shapeType === "image") {
      const imageWidth = (imageData?.[node.id]?.[0] || 0) * scaleX;
      const imageHeight = (imageData?.[node.id]?.[1] || 0) * scaleY;
      style = `
        position: absolute;
        width: ${imageWidth}px;
        height: ${imageHeight}px;
        margin-left: ${childrenLeft}px;
        margin-top: ${childrenTop}px;
        ${boxShadow}
      `;
    } else if (object.shapeType === "text") {
      const fontSize = (object.fontSize || 16) * ((scaleX + scaleY) / 2);
      const color = object.fill || "#000000";
      style = `
      position: absolute;
      margin-left: ${childrenLeft}px;
      margin-top: ${childrenTop}px;
      color: ${color};
      font-size: ${fontSize}px;
      white-space: nowrap;
    `;
    } else if (object.shapeType === "layout") {
      style = `
        position: absolute;
        width: ${width}px;
        height: ${height}px;
        margin-left: ${childrenLeft}px;
        margin-top: ${childrenTop}px;
      `;
    } else {
      style = `
        position: absolute;
        width: ${width}px;
        height: ${height}px;
        background-color: ${fill};
        ${borderStyle}
        margin-left: ${childrenLeft}px;
        margin-top: ${childrenTop}px;
        ${boxShadow}
        ${borderRadiusStyle}
      `;
    }
  }

  style = style.trim().replace(/\s+/g, " ");

  // 이미지 처리
  if (object.shapeType === "image") {
    const imgTag = `${indentSpace}<img id="${id}" src="${object.src}" style="${style}"${animationAttr}/>`;
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
    return [imgTag, childrenCode].join("\n");
  }
  if (object.shapeType === "text") {
    const textContent = object.text || "";
    const divTag = `${indentSpace}<div id="${id}" style="${style}"${animationAttr}>${textContent}</div>`;
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
    return [divTag, childrenCode].join("\n");
  }
  // 일반 div 처리
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
