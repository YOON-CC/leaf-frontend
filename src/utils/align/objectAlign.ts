/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fabric from "fabric";

export interface TreeNode {
  id: string;
  object: fabric.Object;
  children: TreeNode[];
}

// 도형 정렬 함수
export const handleSelfAlign = (
  pos: any,
  fabricCanvas: any,
  tree: TreeNode[]
) => {
  if (!fabricCanvas.current) return;

  const canvas = fabricCanvas.current;
  const activeObject = canvas.getActiveObject();

  if (!activeObject) {
    alert("도형을 선택하세요.");
    return;
  }

  const activeId =
    (activeObject as any).customId ?? activeObject?.toObject()?.id;

  const parentNode = findParentNode(tree, activeId);

  const calculateNewLeft = (
    pos: "left" | "center" | "right",
    containerLeft: number,
    containerWidth: number,
    objectWidth: number
  ): number => {
    switch (pos) {
      case "left":
        return containerLeft;
      case "center":
        return containerLeft + (containerWidth - objectWidth) / 2;
      case "right":
        return containerLeft + containerWidth - objectWidth;
      default:
        return containerLeft;
    }
  };

  const shapeType = activeObject.get?.("shapeType") || activeObject.type;
  const isLayout = shapeType === "layout";

  if (!parentNode) {
    const canvasWidth = canvas.getWidth();
    const objectWidth = activeObject.getScaledWidth();
    const newLeft = calculateNewLeft(pos, 0, canvasWidth, objectWidth);

    if (isLayout) {
      moveChildren(tree, activeObject, newLeft - (activeObject.left ?? 0));
    }

    activeObject.set({ left: newLeft });
  } else {
    const parentObject = parentNode.object;
    const parentLeft = parentObject.left ?? 0;
    const parentWidth = parentObject.getScaledWidth();
    const objectWidth = activeObject.getScaledWidth();

    const newLeft = calculateNewLeft(pos, parentLeft, parentWidth, objectWidth);

    if (isLayout) {
      moveChildren(tree, activeObject, newLeft - (activeObject.left ?? 0));
    }

    activeObject.set({ left: newLeft });
  }

  activeObject.setCoords();
  canvas.requestRenderAll();
};

// 부모 노드 찾기
const findParentNode = (
  nodes: TreeNode[],
  childId: string,
  parent: TreeNode | null = null
): TreeNode | null => {
  for (const node of nodes) {
    if (node.id === childId) return parent;
    const found = findParentNode(node.children, childId, node);
    if (found) return found;
  }
  return null;
};

// 자식 도형 이동
export const moveChildren = (
  tree: TreeNode[],
  parentObject: fabric.Object,
  deltaX: number
) => {
  const parentId =
    (parentObject as any).customId ?? parentObject?.toObject()?.id;
  if (!parentId) return;

  const findAndMove = (nodes: TreeNode[]) => {
    for (const node of nodes) {
      if (node.id === parentId) {
        moveNodeChildren(node.children, deltaX);
        break;
      } else {
        findAndMove(node.children);
      }
    }
  };

  const moveNodeChildren = (children: TreeNode[], deltaX: number) => {
    children.forEach((child) => {
      const obj = child.object;
      if (!obj) return;
      const oldLeft = obj.left ?? 0;
      obj.set({ left: oldLeft + deltaX });
      obj.setCoords();

      if (child.children.length > 0) {
        moveNodeChildren(child.children, deltaX);
      }
    });
  };

  findAndMove(tree);
};
