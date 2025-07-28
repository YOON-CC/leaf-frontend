/* eslint-disable @typescript-eslint/no-explicit-any */

export const clearCanvas = (fabricCanvasRef: any) => {
  if (!fabricCanvasRef.current) return;

  const canvas = fabricCanvasRef.current;
  canvas.clear();
  canvas.backgroundColor = "#ffffff";
  canvas.renderAll();
};
