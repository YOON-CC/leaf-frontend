/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect } from "react";
import * as fabric from "fabric";
import { syncObjectToState } from "../utils/fabric/syncObjectToState";
import {
  findNodeByIdInTree,
  isDescendant,
  moveSubtreeInTree,
} from "../utils/tree/treeUtils";
import type { TreeNode } from "../types/fabricTypes";

export const useInitCanvas = ({
  canvasRef,
  fabricCanvas,
  setSelectedObject,
  setObjectProperties,
  scalingTargetValueRef,
  treeRef,
  layoutListRef,
  isIntersectingRef,
  layoutObjectRef,
  movingObjectRef,
  setMenuPosition,
  setHoveredLayout,
  menuTimeoutRef,
}: any) => {
  useEffect(() => {
    if (!canvasRef.current) return;

    fabricCanvas.current = new fabric.Canvas(canvasRef.current, {
      backgroundColor: "#ffffff",
      width: 1200,
      height: 800,
    });

    const canvas = fabricCanvas.current;

    canvas.on("selection:created", (e: any) => {
      const selected = e.selected[0];
      setSelectedObject(selected);
      syncObjectToState(selected, setObjectProperties, scalingTargetValueRef);
    });

    canvas.on("selection:updated", (e: any) => {
      const selected = e.selected[0];
      setSelectedObject(selected);
      syncObjectToState(selected, setObjectProperties, scalingTargetValueRef);
    });

    canvas.on("object:scaling", (e: any) => {
      const obj = e.target;
      if (!obj) return;
      syncObjectToState(obj, setObjectProperties, scalingTargetValueRef);
    });

    canvas.on("selection:cleared", () => {
      setSelectedObject(null);
    });

    canvas.on("object:moving", (e: any) => {
      const movingObj = e.target;
      if (!movingObj) return;

      const shapeType = movingObj.get?.("shapeType");
      if (shapeType === "layout") {
        const layoutId = movingObj.get("customId");
        if (!layoutId) return;

        const prevLeft = movingObj.get("prevLeft") ?? movingObj.left!;
        const prevTop = movingObj.get("prevTop") ?? movingObj.top!;

        const dx = movingObj.left! - prevLeft;
        const dy = movingObj.top! - prevTop;

        const node = findNodeByIdInTree(treeRef.current, layoutId);

        if (node && canvas) {
          moveSubtreeInTree(node, dx, dy);
          canvas.requestRenderAll();
        }

        movingObj.set("prevLeft", movingObj.left);
        movingObj.set("prevTop", movingObj.top);
      }

      let intersecting = false;
      let collidedLayout: fabric.Rect | null = null;

      layoutListRef.current.forEach((layout: any) => {
        if (movingObj === layout) return;

        const movingId = movingObj.get("customId");
        const movingNode = findNodeByIdInTree(treeRef.current, movingId);
        const layoutId = layout.get("customId");
        if (movingNode && isDescendant(movingNode, layoutId)) return;

        if (movingObj.intersectsWithObject(layout)) {
          layout.set("fill", "rgba(0, 145, 255, 0.1)");
          intersecting = true;
          collidedLayout = layout;
        } else {
          layout.set("fill", "rgba(255, 255, 255, 0.1)");
        }
      });

      isIntersectingRef.current = intersecting;
      layoutObjectRef.current = collidedLayout;
      movingObjectRef.current = movingObj;

      canvas.renderAll();

      const childId = movingObj.get("customId");

      const hasParent = (nodes: TreeNode[], childId: string): boolean => {
        for (const node of nodes) {
          const childExists = node.children.some(
            (child) => child.id === childId
          );
          if (childExists) return true;
          if (hasParent(node.children, childId)) return true;
        }
        return false;
      };

      if (
        intersecting &&
        collidedLayout &&
        canvas &&
        !hasParent(treeRef.current, childId)
      ) {
        const canvasRect = canvas.getElement().getBoundingClientRect();
        const layoutMenu = collidedLayout as fabric.Rect;
        const center = {
          x: (layoutMenu.left ?? 0) + (layoutMenu.width ?? 0) / 2,
          y: (layoutMenu.top ?? 0) + (layoutMenu.height ?? 0) / 2,
        };

        setMenuPosition({
          x: canvasRect.left + center.x,
          y: canvasRect.top + center.y,
        });

        setHoveredLayout(collidedLayout);

        if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current);
        menuTimeoutRef.current = setTimeout(() => {
          setHoveredLayout(null);
          setMenuPosition(null);
        }, 2000);
      } else {
        setHoveredLayout(null);
        setMenuPosition(null);
        if (menuTimeoutRef.current) {
          clearTimeout(menuTimeoutRef.current);
          menuTimeoutRef.current = null;
        }
      }
    });

    canvas.on("object:modified", () => {
      if (isIntersectingRef.current) {
        layoutListRef.current.forEach((layout: any) => {
          layout.set("fill", "rgba(255, 255, 255, 0.1)");
        });
        canvas.renderAll();
      }
      isIntersectingRef.current = false;
    });

    return () => {
      canvas.dispose();
      fabricCanvas.current = null;
    };
  }, []);
};
