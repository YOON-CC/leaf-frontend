/* eslint-disable @typescript-eslint/no-explicit-any */
import * as fabric from "fabric";

export interface ShadowOffset {
  x: number;
  y: number;
}

export const defaultShadowColor = "#000000";
export const defaultShadowBlur = 3;
export const defaultShadowOffset: ShadowOffset = { x: 3, y: 3 };

export const shadows = [
  { name: "shadow 1", x: -4, y: -4 },
  { name: "shadow 2", x: 0, y: -4 },
  { name: "shadow 3", x: 4, y: -4 },
  { name: "shadow 4", x: -4, y: 0 },
  { name: "shadow 5", x: 0, y: 0 },
  { name: "shadow 6", x: 4, y: 0 },
  { name: "shadow 7", x: -4, y: 4 },
  { name: "shadow 8", x: 0, y: 4 },
  { name: "shadow 9", x: 4, y: 4 },
];

/** 그림자 적용 */
export function applyShadow(
  object: fabric.Object | null,
  color: string,
  blur: number,
  offsetX: number,
  offsetY: number,
  canvas?: fabric.Canvas | null
) {
  if (!object) return;

  const shadow = new fabric.Shadow({
    color,
    blur,
    offsetX,
    offsetY,
  });

  object.set("shadow", shadow);
  canvas?.renderAll();
}

/** 색상 변경 핸들러 */
export function handleColorChange(
  color: string,
  shadowBlur: number,
  shadowOffset: ShadowOffset,
  selectedObject: fabric.Object | null,
  fabricCanvas: fabric.Canvas | null,
  setShadowColor: (color: string) => void,
  setObjectProperties: React.Dispatch<React.SetStateAction<any>>
) {
  setShadowColor(color);
  applyShadow(
    selectedObject,
    color,
    shadowBlur,
    shadowOffset.x,
    shadowOffset.y,
    fabricCanvas
  );
  setObjectProperties((prev: any) => ({
    ...prev,
    shadowColor: color,
    shadowBlur,
    shadowOffsetX: shadowOffset.x,
    shadowOffsetY: shadowOffset.y,
  }));
}

/** 블러 변경 핸들러 */
export function handleBlurChange(
  blur: number,
  shadowColor: string,
  shadowOffset: ShadowOffset,
  selectedObject: fabric.Object | null,
  fabricCanvas: fabric.Canvas | null,
  setShadowBlur: (blur: number) => void,
  setObjectProperties: React.Dispatch<React.SetStateAction<any>>
) {
  setShadowBlur(blur);
  applyShadow(
    selectedObject,
    shadowColor,
    blur,
    shadowOffset.x,
    shadowOffset.y,
    fabricCanvas
  );
  setObjectProperties((prev: any) => ({
    ...prev,
    shadowColor,
    shadowBlur: blur,
    shadowOffsetX: shadowOffset.x,
    shadowOffsetY: shadowOffset.y,
  }));
}

/** 오프셋 변경 핸들러 */
export function handleShadowClick(
  x: number,
  y: number,
  shadowColor: string,
  shadowBlur: number,
  selectedObject: fabric.Object | null,
  fabricCanvas: fabric.Canvas | null,
  setShadowOffset: (offset: ShadowOffset) => void,
  setObjectProperties: React.Dispatch<React.SetStateAction<any>>
) {
  setShadowOffset({ x, y });
  applyShadow(selectedObject, shadowColor, shadowBlur, x, y, fabricCanvas);
  setObjectProperties((prev: any) => ({
    ...prev,
    shadowColor,
    shadowBlur,
    shadowOffsetX: x,
    shadowOffsetY: y,
  }));
}

/** 선택된 객체에서 그림자 값 가져오기 */
export function syncShadowFromObject(
  selectedObject: fabric.Object | null,
  setShadowColor: (color: string) => void,
  setShadowBlur: (blur: number) => void,
  setShadowOffset: (offset: ShadowOffset) => void
) {
  if (!selectedObject) {
    setShadowColor(defaultShadowColor);
    setShadowBlur(0);
    setShadowOffset(defaultShadowOffset);
    return;
  }

  const shadow = selectedObject.shadow as fabric.Shadow | null;
  if (shadow) {
    setShadowColor(shadow.color ?? defaultShadowColor);
    setShadowBlur(shadow.blur ?? 0);
    setShadowOffset({
      x: shadow.offsetX ?? defaultShadowOffset.x,
      y: shadow.offsetY ?? defaultShadowOffset.y,
    });
  } else {
    setShadowColor(defaultShadowColor);
    setShadowBlur(0);
    setShadowOffset(defaultShadowOffset);
  }
}
