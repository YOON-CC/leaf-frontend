/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useMemo } from "react";
import { Circle, Layers, Square, Triangle } from "lucide-react";
import type { TreeNode } from "../../types/fabricTypes";
import {
  handleDragLeave,
  handleDragOver,
  handleDragStart,
  handleDrop,
} from "../../utils/handlers/dragAndDrop";

type RenderTreeProps = {
  tree: TreeNode[];
  setTree: React.Dispatch<React.SetStateAction<TreeNode[]>>;
  fabricCanvas: any;
};

export default function RenderTree({
  tree,
  setTree,
  fabricCanvas,
}: RenderTreeProps) {
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);

  // 트리 flatten
  const flattenTreeIds = (node: TreeNode): string[] => {
    return [node.id, ...node.children.flatMap(flattenTreeIds)];
  };

  const treeIds = useMemo(() => new Set(tree.flatMap(flattenTreeIds)), [tree]);

  // unlinkedNodes 계산
  const unlinkedNodes: TreeNode[] = useMemo(() => {
    if (!fabricCanvas) return [];
    return (fabricCanvas.getObjects() || [])
      .filter((obj: any) => {
        const id = (obj as any).customId;
        return id && !treeIds.has(id);
      })
      .map((obj: any) => ({
        id: (obj as any).customId,
        object: obj,
        children: [],
      }));
  }, [fabricCanvas, treeIds]);

  const combinedTree = [...tree, ...unlinkedNodes];

  function getIcon(type: string, shapeType?: string) {
    if (shapeType === "layout") {
      return <Layers size={16} className="text-blue-400" />;
    }

    switch (type) {
      case "rect":
        return <Square size={16} className="text-green-400" />;
      case "circle":
        return <Circle size={16} className="text-pink-400" />;
      case "triangle":
        return <Triangle size={16} className="text-yellow-400" />;
      default:
        return <Layers size={16} className="text-gray-400" />;
    }
  }

  const render = (nodes: TreeNode[], level = 0) => (
    <ul className={`${level === 0 ? "pl-0" : "pl-6"} space-y-1`}>
      {nodes.map((node) => {
        const shapeType = node.object.get?.("shapeType") || undefined;
        const label =
          (node.object as any).name ||
          (node.object as any).label ||
          (shapeType ?? node.object.type);

        return (
          <li key={node.id}>
            <div
              draggable
              onDragStart={handleDragStart(node.id, setDraggedNodeId)}
              onDrop={handleDrop(
                node.id,
                shapeType,
                dragOverNodeId,
                draggedNodeId,
                setTree,
                unlinkedNodes,
                setDraggedNodeId
              )}
              onDragOver={handleDragOver(
                node.id,
                draggedNodeId,
                setDragOverNodeId
              )}
              onDragLeave={handleDragLeave(
                node.id,
                draggedNodeId,
                setDragOverNodeId
              )}
              className="flex items-center gap-2 cursor-pointer select-none rounded-md text-gray-100 text-sm hover:bg-gray-700 p-1 text-white"
              style={{ paddingLeft: level === 0 ? 4 : undefined }}
            >
              {getIcon(node.object.type, shapeType)}
              <span>
                {label} {node.id}
              </span>
            </div>

            {node.children.length > 0 && render(node.children, level + 1)}
          </li>
        );
      })}
    </ul>
  );

  return render(combinedTree);
}
