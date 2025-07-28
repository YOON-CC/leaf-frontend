/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TreeNode } from "../array/objectAlign";
import * as fabric from "fabric";

export const deleteSelected = (
  selectedObject: fabric.Object | null,
  fabricCanvasRef: any,
  setTree: React.Dispatch<React.SetStateAction<TreeNode[]>>,
  setSelectedObject: React.Dispatch<React.SetStateAction<fabric.Object | null>>
) => {
  if (!selectedObject || !fabricCanvasRef.current) return;

  fabricCanvasRef.current.remove(selectedObject);

  setTree((prevTree) =>
    prevTree.filter((node) => node.object !== selectedObject)
  );

  setSelectedObject(null);
};

export const registerDeleteKey = (callback: () => void) => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Delete") {
      callback();
    }
  };

  window.addEventListener("keydown", handleKeyDown);

  return () => window.removeEventListener("keydown", handleKeyDown);
};
