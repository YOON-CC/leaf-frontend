/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { Circle, Layers, Square, Triangle } from "lucide-react";
import type { TreeNode } from "../../types/fabricTypes";
import {
  handleDragLeave,
  handleDragOver,
  handleDragStart,
  handleDrop,
} from "../../utils/handlers/dragAndDrop";

type RenderTreeProps = {
  nodes: TreeNode[];
  level?: number;
  setDraggedNodeId: (id: string | null) => void;
  dragOverNodeId: string | null;
  draggedNodeId: string | null;
  setTree: React.Dispatch<React.SetStateAction<TreeNode[]>>;
  unlinkedNodes: TreeNode[];
  setDragOverNodeId: (id: string | null) => void;
};

export default function RenderTree({
  nodes,
  level = 0,
  setDraggedNodeId,
  dragOverNodeId,
  draggedNodeId,
  setTree,
  unlinkedNodes,
  setDragOverNodeId,
}: RenderTreeProps) {
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

  return (
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
              <span>{label}</span>
            </div>

            {node.children.length > 0 && (
              <RenderTree
                nodes={node.children}
                level={level + 1}
                setDraggedNodeId={setDraggedNodeId}
                dragOverNodeId={dragOverNodeId}
                draggedNodeId={draggedNodeId}
                setTree={setTree}
                unlinkedNodes={unlinkedNodes}
                setDragOverNodeId={setDragOverNodeId}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
