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
import { getCombinedTree } from "../../utils/export/getCombinedTree";

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

  // 캔버스 전체
  const combinedTree = useMemo(
    () => getCombinedTree(fabricCanvas, tree, "combined"),
    [fabricCanvas, tree]
  );

  // unlinkedNodes
  const unlinkedNodes = useMemo(
    () => getCombinedTree(fabricCanvas, tree, "unlinked"),
    [fabricCanvas, tree]
  );

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
    <ul className={`${level === 0 ? "pl-0" : "pl-4"} space-y-1`}>
      {nodes.map((node) => {
        const shapeType = node.object.get?.("shapeType") || undefined;
        const label =
          (node.object as any).name ||
          (node.object as any).label ||
          (shapeType ?? node.object.type);

        // 드래그 오버 효과
        const isDragOver = node.id === dragOverNodeId;
        const isLayout = shapeType === "layout";
        const bgColor =
          isDragOver && isLayout && draggedNodeId !== null
            ? "bg-[#999999]"
            : "hover:bg-gray-700";
        // console.log("✅✅✅", draggedNodeId, dragOverNodeId);
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
              className={`flex items-center gap-2 cursor-pointer select-none rounded-md text-sm p-1 text-white ${bgColor}`}
              style={{ paddingLeft: level === 0 ? 4 : undefined }}
            >
              {getIcon(node.object.type, shapeType)}
              <span>
                {label}
                {/* {node.id} */}
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
