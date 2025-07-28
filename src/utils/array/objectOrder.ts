/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fabric from "fabric";

export const showZIndexOrder = (
  fabricCanvasRef: any,
  setObjectOrder: (objects: fabric.Object[]) => void
) => {
  if (!fabricCanvasRef.current) return;
  const objects = fabricCanvasRef.current.getObjects();
  setObjectOrder([...objects]);
};

export const moveUp = (
  index: number,
  objectOrder: fabric.Object[],
  setObjectOrder: (objects: fabric.Object[]) => void,
  fabricCanvasRef: any
) => {
  if (index === 0) return;

  const newOrder = [...objectOrder];
  [newOrder[index - 1], newOrder[index]] = [
    newOrder[index],
    newOrder[index - 1],
  ];
  setObjectOrder(newOrder);
  updateCanvasOrder(newOrder, fabricCanvasRef);
};

export const moveDown = (
  index: number,
  objectOrder: fabric.Object[],
  setObjectOrder: (objects: fabric.Object[]) => void,
  fabricCanvasRef: any
) => {
  if (index === objectOrder.length - 1) return;

  const newOrder = [...objectOrder];
  [newOrder[index + 1], newOrder[index]] = [
    newOrder[index],
    newOrder[index + 1],
  ];
  setObjectOrder(newOrder);
  updateCanvasOrder(newOrder, fabricCanvasRef);
};

export const updateCanvasOrder = (
  newOrder: fabric.Object[],
  fabricCanvasRef: any
) => {
  const canvas = fabricCanvasRef.current;
  if (!canvas) return;

  const selected = canvas.getActiveObject();
  canvas.clear();

  newOrder.forEach((obj) => {
    canvas.add(obj);
  });

  canvas.renderAll();

  if (selected) {
    canvas.setActiveObject(selected);
  }
};
