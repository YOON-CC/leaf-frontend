/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fabric from "fabric";
import type { FabricObjectWithId, TreeNode } from "../../types/fabricTypes";

// 🟢🟢🟢🟢🟢🟢🟢🟢 레이아웃에 추가
export const addChildToTree = (
  setTree: any,
  layoutObject: fabric.Object | null,
  movingObject: fabric.Object | null
) => {
  if (!layoutObject || !movingObject) return;

  const parentId = (layoutObject as FabricObjectWithId).customId;
  const childId = (movingObject as FabricObjectWithId).customId;

  if (!parentId || !childId) {
    console.warn("customId가 없습니다.");
    return;
  }

  setTree((prevTree: any) => {
    // 부모 찾기 함수
    const findAndInsert = (nodes: TreeNode[]): TreeNode[] => {
      return nodes.map((node) => {
        if (node.id === parentId) {
          return {
            ...node,
            children: [
              ...node.children,
              {
                id: childId,
                object: movingObject,
                children: [],
              },
            ],
          };
        } else {
          return {
            ...node,
            children: findAndInsert(node.children),
          };
        }
      });
    };

    // 부모가 기존 트리에 있을 때
    const newTree = findAndInsert(prevTree);

    // 부모가 트리에 없으면 새로 추가
    const parentExists = JSON.stringify(newTree) !== JSON.stringify(prevTree);
    if (parentExists) return newTree;

    // 새로운 부모 노드를 만들어서 추가
    return [
      ...prevTree,
      {
        id: parentId,
        object: layoutObject,
        children: [
          {
            id: childId,
            object: movingObject,
            children: [],
          },
        ],
      },
    ];
  });
};

// 🟢🟢🟢🟢🟢🟢🟢🟢 특정 레이아웃의 자식들 찾기
export function findNodeByIdInTree(
  tree: TreeNode[],
  id: string
): TreeNode | null {
  for (const node of tree) {
    if (node.id === id) return node;
    if (node.children && node.children.length > 0) {
      const found = findNodeByIdInTree(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

// 🟢🟢🟢🟢🟢🟢🟢🟢 노드와 모든 하위 자식 노드들 위치 재귀 이동
export function moveSubtreeInTree(node: TreeNode, dx: number, dy: number) {
  if (!node.children) return;

  node.children.forEach((child) => {
    const obj = child.object;
    if (!obj) return;

    obj.set({
      left: (obj.left ?? 0) + dx,
      top: (obj.top ?? 0) + dy,
    });

    obj.set("prevLeft", obj.left);
    obj.set("prevTop", obj.top);

    obj.setCoords();

    moveSubtreeInTree(child, dx, dy);
  });
}
