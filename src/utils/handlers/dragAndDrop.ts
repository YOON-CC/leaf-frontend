/* eslint-disable @typescript-eslint/no-explicit-any */

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
