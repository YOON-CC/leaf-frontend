/* eslint-disable @typescript-eslint/no-explicit-any */

import * as fabric from "fabric";

export const syncObjectToState = (
  obj: fabric.Object,
  setProps: React.Dispatch<React.SetStateAction<any>>,
  scalingTargetValueRef: React.MutableRefObject<
    Record<string, [number, number]>
  >
) => {
  const actualWidth = obj.width! * obj.scaleX!;
  const actualHeight = obj.height! * obj.scaleY!;

  setProps({
    fill: (obj.fill as string) || "#ff0000",
    strokeWidth: obj.strokeWidth || 0,
    stroke: (obj.stroke as string) || "#000000",
    opacity: obj.opacity || 1,
    angle: obj.angle || 0,
    width: actualWidth,
    height: actualHeight,
    scaleX: 1,
    scaleY: 1,
  });

  if (!(obj instanceof fabric.Image)) {
    obj.set({
      width: actualWidth,
      height: actualHeight,
      scaleX: 1,
      scaleY: 1,
    });
  }

  if (obj instanceof fabric.Image) {
    const objectId =
      (obj as any)?.id || (obj as any)?.name || (obj as any)?.customId || "";

    if (objectId) {
      scalingTargetValueRef.current[objectId] = [actualWidth, actualHeight];
    }
  }
};
