/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fabric from "fabric";

export const updateProperty = (
  selectedObject: fabric.Object | null,
  fabricCanvasRef: any,
  setObjectProperties: any,
  property: string,
  value: string | number
) => {
  if (!selectedObject || !fabricCanvasRef.current) return;

  selectedObject.set(property, value);
  fabricCanvasRef.current.renderAll();

  setObjectProperties((prev: any) => ({
    ...prev,
    [property]: value,
  }));
};
