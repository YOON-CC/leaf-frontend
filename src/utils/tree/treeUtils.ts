import * as fabric from "fabric";
import type { FabricObjectWithId, TreeNode } from "../../types/fabricTypes";

// 🟢🟢🟢🟢🟢🟢🟢🟢 레이아웃에 추가
export const addChildToTree = (
  setTree: React.Dispatch<React.SetStateAction<TreeNode[]>>,
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

  setTree((prevTree) => {
    let movingNode: TreeNode = {
      id: childId,
      object: movingObject,
      children: [],
    };

    // movingNode를 트리에서 잘라내기
    const removeNode = (nodes: TreeNode[]): TreeNode[] =>
      nodes
        .map((node) => {
          if (node.id === childId) {
            movingNode = node; // 기존 자식까지 유지
            return null;
          }
          return { ...node, children: removeNode(node.children) };
        })
        .filter(Boolean) as TreeNode[];

    const updatedTree = removeNode(prevTree);

    // parentId를 찾아서 자식으로 넣기
    const insertNode = (nodes: TreeNode[]): TreeNode[] =>
      nodes.map((node) =>
        node.id === parentId
          ? { ...node, children: [...node.children, movingNode] }
          : { ...node, children: insertNode(node.children) }
      );

    const parentExists = JSON.stringify(updatedTree).includes(parentId);

    return parentExists
      ? insertNode(updatedTree)
      : [
          ...updatedTree,
          {
            id: parentId,
            object: layoutObject,
            children: [movingNode],
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

// 🟢🟢🟢🟢🟢🟢🟢🟢 특정 노드가 본인의 하위인지 체크
export const isDescendant = (
  parentNode: TreeNode,
  targetId: string
): boolean => {
  if (!parentNode) return false;

  return parentNode.children.some(
    (child) => child.id === targetId || isDescendant(child, targetId)
  );
};
