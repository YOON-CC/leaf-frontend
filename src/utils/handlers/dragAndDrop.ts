/* eslint-disable @typescript-eslint/no-explicit-any */

import type { TreeNode } from "../../types/fabricTypes";
import { findNodeByIdInTree } from "../tree/treeUtils";

// 드래그 시작
export const handleDragStart =
  (nodeId: string, setDraggedNodeId: any) => (e: React.DragEvent) => {
    setDraggedNodeId(nodeId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", nodeId);
  };

// 드래그 오버
export const handleDragOver =
  (nodeId: string, draggedNodeId: any, setDragOverNodeId: any) =>
  (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedNodeId) return;

    // 자기자신 제외
    if (nodeId === draggedNodeId) {
      setDragOverNodeId(null);
      return;
    }

    setDragOverNodeId(nodeId);
  };

// 드래그 오버 아님
export const handleDragLeave =
  (nodeId: string, dragOverNodeId: any, setDragOverNodeId: any) =>
  (e: React.DragEvent) => {
    e.preventDefault();
    if (dragOverNodeId === nodeId) {
      setDragOverNodeId(null);
    }
  };

// 드래그 드랍
export const handleDrop =
  (
    targetNodeId: string,
    shapeType: string,
    dragOverNodeId: any,
    draggedNodeId: any,
    setTree: any,
    unlinkedNodes: any,
    setDraggedNodeId: any
  ) =>
  (e: React.DragEvent) => {
    e.preventDefault();
    console.log("드랍", targetNodeId, shapeType, dragOverNodeId);
    if (!draggedNodeId) return;
    if (!dragOverNodeId) return;

    setTree((prevTree: TreeNode[]) => {
      const combinedTree = [...prevTree, ...unlinkedNodes];
      // 이동 하는 객체
      const draggedNode = findNodeByIdInTree(combinedTree, draggedNodeId);
      if (!draggedNode) return prevTree;

      // 이동 목적지
      const targetNode = findNodeByIdInTree(combinedTree, targetNodeId);
      if (!targetNode) return prevTree;

      // 이동목적지가 layout이어야함
      const isTargetLayout = shapeType === "layout";
      console.log("이동 목적지", isTargetLayout);
      if (!isTargetLayout) {
        // layout이 아니면 트리 변경하지 않고 이전 상태 유지
        return prevTree;
      }

      // 🔒🔒🔒🔒🔒🔒🔒🔒🔒 순환 방지 체크
      const isDescendant = (
        parentNode: TreeNode,
        targetId: string
      ): boolean => {
        if (!parentNode) return false;

        return parentNode.children.some(
          (child) => child.id === targetId || isDescendant(child, targetId)
        );
      };

      const bothAreLayouts =
        shapeType === "layout" &&
        draggedNode.object.get("shapeType") === "layout";

      if (bothAreLayouts && isDescendant(draggedNode, targetNodeId)) {
        return prevTree;
      }

      // 이동한 노드의 부모 제거
      const removeNodeById = (nodes: TreeNode[], id: string): TreeNode[] => {
        return nodes
          .filter((node) => node.id !== id)
          .map((node) => ({
            ...node,
            children: removeNodeById(node.children, id),
          }));
      };

      // let newTree = removeNodeById(prevTree, draggedNodeId);
      let newTree = removeNodeById(combinedTree, draggedNodeId);
      console.log("트리거1111111");
      // 새로운 자식 추가
      const insertNodeToParent = (
        nodes: TreeNode[],
        parentId: string,
        nodeToInsert: TreeNode
      ): TreeNode[] => {
        return nodes.map((node) => {
          if (node.id === parentId) {
            return {
              ...node,
              children: [...node.children, nodeToInsert],
            };
          } else {
            return {
              ...node,
              children: insertNodeToParent(
                node.children,
                parentId,
                nodeToInsert
              ),
            };
          }
        });
      };
      console.log("트리거2323232323", newTree, targetNodeId, draggedNode);

      newTree = insertNodeToParent(newTree, targetNodeId, draggedNode);

      console.log("트리거2222222222", newTree);
      return newTree;
    });

    setDraggedNodeId(null);
  };
