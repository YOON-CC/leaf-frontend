/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import {
  Circle,
  Square,
  Triangle,
  Type,
  Palette,
  Move,
  Trash2,
  Save,
  Download,
  Layers,
  Copy,
  Grid,
  ZoomIn,
  ZoomOut,
  Image,
} from "lucide-react";
import { createShape } from "../utils/fabric/createShape";
import {
  addChildToTree,
  findNodeByIdInTree,
  isDescendant,
  moveSubtreeInTree,
} from "../utils/tree/treeUtils";

import RenderTree from "../components/treeVisual/TreeRenderer";
import { treeToCode } from "../utils/export/treeToCode";
import { getCombinedTree } from "../utils/export/getCombinedTree";
import { createImage } from "../utils/fabric/createImage";
interface TreeNode {
  id: string; // customId
  object: fabric.Object;
  children: TreeNode[];
}

export default function Editor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvas = useRef<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<fabric.Object | null>(
    null
  );
  const [activeTab, setActiveTab] = useState("shapes");
  const [objectProperties, setObjectProperties] = useState({
    fill: "#ff0000",
    strokeWidth: 0,
    stroke: "#000000",
    opacity: 1,
    angle: 0,
    scaleX: 1,
    scaleY: 1,
  });

  // 충돌 중인지 저장하는 ref (렌더링과 무관하게 상태 저장용)
  const isIntersectingRef = useRef(false);
  const layoutObjectRef = useRef<fabric.Object | null>(null);
  const movingObjectRef = useRef<fabric.Object | null>(null);
  const [hoveredLayout, setHoveredLayout] = useState<fabric.Object | null>(
    null
  );
  const [menuPosition, setMenuPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const menuTimeoutRef = useRef<any>(null);

  // 🍎
  const scalingTargetValueRef = useRef<Record<string, [number, number]>>({}); // 실제 img selector 크기 저장

  useEffect(() => {
    if (!canvasRef.current) return;

    fabricCanvas.current = new fabric.Canvas(canvasRef.current, {
      backgroundColor: "#ffffff",
      width: 1200,
      height: 800,
    });

    fabricCanvas.current.on("selection:created", (e) => {
      const selected = e.selected[0];
      setSelectedObject(selected);
      syncObjectToState(selected, setObjectProperties);
    });

    fabricCanvas.current.on("selection:updated", (e) => {
      const selected = e.selected[0];
      setSelectedObject(selected);
      syncObjectToState(selected, setObjectProperties);
    });

    // 도형 스케일 적용
    fabricCanvas.current.on("object:scaling", (e) => {
      const obj = e.target;
      if (!obj) return;

      syncObjectToState(obj, setObjectProperties);
    });

    fabricCanvas.current.on("selection:cleared", () => {
      setSelectedObject(null);
    });

    fabricCanvas.current.on("object:moving", (e) => {
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

        if (node && fabricCanvas.current) {
          moveSubtreeInTree(node, dx, dy);
          fabricCanvas.current.requestRenderAll();
        }

        movingObj.set("prevLeft", movingObj.left);
        movingObj.set("prevTop", movingObj.top);
      }

      let intersecting = false;
      let collidedLayout: fabric.Rect | null = null;

      layoutListRef.current.forEach((layout) => {
        // 자신 제외
        if (movingObj === layout) return;

        // 이쪽에서, 부모의 노드가, 자식의 노드로 들어가는 상황을 방지
        const movingId = movingObj.get("customId");
        const movingNode = findNodeByIdInTree(treeRef.current, movingId);
        const layoutId = layout.get("customId");
        if (movingNode && isDescendant(movingNode, layoutId)) {
          return;
        }

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

      fabricCanvas.current?.renderAll();

      // 이미 계층인거는, layout 이동은 layers에서만 할수있도록
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
        fabricCanvas.current &&
        !hasParent(treeRef.current, childId)
      ) {
        const canvasRect = fabricCanvas.current
          .getElement()
          .getBoundingClientRect();
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

    fabricCanvas.current.on("object:modified", () => {
      if (isIntersectingRef.current) {
        // creatingRelationShip(layoutObjectRef.current, movingObjectRef.current);

        // layout 색상 원래대로 복구
        layoutListRef.current.forEach((layout) => {
          layout.set("fill", "rgba(255, 255, 255, 0.1)");
        });

        fabricCanvas.current?.renderAll();
      }
      isIntersectingRef.current = false;
    });

    return () => {
      fabricCanvas.current?.dispose();
      fabricCanvas.current = null;
    };
  }, []);

  // 계층관계 생성
  const treeRef = useRef<TreeNode[]>([]);
  const [tree, setTree] = useState<TreeNode[]>([]);

  // tree 상태 업데이트시 ref도 업데이트
  useEffect(() => {
    treeRef.current = tree;
  }, [tree]);

  // console.log(tree);

  // 🍎
  const syncObjectToState = (
    obj: fabric.Object,
    setProps: React.Dispatch<React.SetStateAction<any>>
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

  const layoutListRef = useRef<fabric.Rect[]>([]);

  const addShape = (type: string) => {
    if (!fabricCanvas.current) return;

    const shape = createShape(type);
    if (!shape) return;

    // layout일 경우 따로 관리
    if (type === "layout" && shape instanceof fabric.Rect) {
      layoutListRef.current.push(shape);
    }

    fabricCanvas.current.add(shape);
    fabricCanvas.current.setActiveObject(shape);
    fabricCanvas.current.requestRenderAll();
  };

  // 🍎
  const updateProperty = (property: string, value: string | number) => {
    if (!selectedObject || !fabricCanvas.current) return;

    selectedObject.set(property, value);
    fabricCanvas.current.renderAll();

    setObjectProperties((prev) => ({
      ...prev,
      [property]: value,
    }));
  };

  // 🍎
  const deleteSelected = () => {
    if (!selectedObject || !fabricCanvas.current) return;

    fabricCanvas.current.remove(selectedObject);

    setTree((prevTree) =>
      prevTree.filter((node) => node.object !== selectedObject)
    );

    setSelectedObject(null);
  };
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Delete") {
        deleteSelected();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [deleteSelected]);

  // 🍎 순서 변경
  const [objectOrder, setObjectOrder] = useState<fabric.Object[]>([]);

  const showZIndexOrder = () => {
    if (!fabricCanvas.current) return;
    const objects = fabricCanvas.current.getObjects();
    setObjectOrder([...objects]);
  };

  useEffect(() => {
    showZIndexOrder();
  }, [selectedObject]);

  const moveUp = (index: number) => {
    if (index === 0) return; // 맨 위면 이동 불가
    const newOrder = [...objectOrder];
    [newOrder[index - 1], newOrder[index]] = [
      newOrder[index],
      newOrder[index - 1],
    ];
    setObjectOrder(newOrder);
    updateCanvasOrder(newOrder);
  };

  const moveDown = (index: number) => {
    if (index === objectOrder.length - 1) return; // 맨 아래면 이동 불가
    const newOrder = [...objectOrder];
    [newOrder[index + 1], newOrder[index]] = [
      newOrder[index],
      newOrder[index + 1],
    ];
    setObjectOrder(newOrder);
    updateCanvasOrder(newOrder);
  };

  const updateCanvasOrder = (newOrder: fabric.Object[]) => {
    if (!fabricCanvas.current) return;

    const canvas = fabricCanvas.current;

    // 현재 선택 객체 저장
    const selected = canvas.getActiveObject();

    canvas.clear();

    newOrder.forEach((obj) => {
      canvas.add(obj);
    });

    canvas.renderAll();

    // 선택 객체가 있으면 다시 선택 상태로 설정
    if (selected) {
      canvas.setActiveObject(selected);
    }
  };

  // 🍎
  const clearCanvas = () => {
    if (!fabricCanvas.current) return;
    fabricCanvas.current.clear();
    fabricCanvas.current.backgroundColor = "#ffffff";
    fabricCanvas.current.renderAll();
  };

  // 나중에 export 할때 계층 아닌것도 포함할거임 ㅇㅇ
  const treeNodes = fabricCanvas.current
    ? getCombinedTree(fabricCanvas.current, tree, "tree")
    : [];
  const unlinkedNodes = fabricCanvas.current
    ? getCombinedTree(fabricCanvas.current, tree, "unlinked")
    : [];
  // const combinedNodes = fabricCanvas.current
  // ? getCombinedTree(fabricCanvas.current, tree, "tree")
  // : [];

  // 파일 다운로드 로직
  const [exportFile, setExportFile] = useState("");
  useEffect(() => {
    if (exportFile === "") return;
    console.log(exportFile);
    const blob = new Blob([exportFile], { type: "text/html" });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "test.html";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [exportFile]);

  // 정렬
  const handleSelfAlign = (pos: any, fabricCanvas: any, tree: TreeNode[]) => {
    if (!fabricCanvas.current) return;

    const canvas = fabricCanvas.current;
    const activeObject = canvas.getActiveObject();

    if (!activeObject) {
      alert("도형을 선택하세요.");
      return;
    }

    const findParentNode = (
      nodes: TreeNode[],
      childId: string,
      parent: TreeNode | null = null
    ): TreeNode | null => {
      for (const node of nodes) {
        if (node.id === childId) return parent;
        const found = findParentNode(node.children, childId, node);
        if (found) return found;
      }
      return null;
    };

    const activeId =
      (activeObject as any).customId ?? activeObject?.toObject()?.id;

    const parentNode = findParentNode(tree, activeId);

    // 1) 위치 계산 (새로운 left 값)
    const calculateNewLeft = (
      pos: "left" | "center" | "right",
      containerLeft: number,
      containerWidth: number,
      objectWidth: number
    ): number => {
      switch (pos) {
        case "left":
          return containerLeft;
        case "center":
          return containerLeft + (containerWidth - objectWidth) / 2;
        case "right":
          return containerLeft + containerWidth - objectWidth;
        default:
          return containerLeft;
      }
    };

    // 2) 선택 도형이 레이아웃인지 확인
    const shapeType = activeObject.get?.("shapeType") || activeObject.type;
    const isLayout = shapeType === "layout";

    if (!parentNode) {
      // 부모 없으면 캔버스 기준 정렬
      const canvasWidth = canvas.getWidth();
      const objectWidth = activeObject.getScaledWidth();
      const newLeft = calculateNewLeft(pos, 0, canvasWidth, objectWidth);

      // 만약 선택 도형이 layout이면 자식도 이동
      if (isLayout) {
        moveChildren(tree, activeObject, newLeft - (activeObject.left ?? 0));
      }

      activeObject.set({ left: newLeft });
    } else {
      // 부모 기준 정렬
      const parentObject = parentNode.object;
      const parentLeft = parentObject.left ?? 0;
      const parentWidth = parentObject.getScaledWidth();

      const objectWidth = activeObject.getScaledWidth();
      const newLeft = calculateNewLeft(
        pos,
        parentLeft,
        parentWidth,
        objectWidth
      );

      if (isLayout) {
        moveChildren(tree, activeObject, newLeft - (activeObject.left ?? 0));
      }

      activeObject.set({ left: newLeft });
    }

    activeObject.setCoords();
    canvas.requestRenderAll();
  };

  // 자식 도형들 위치 이동 함수 (x축 이동량 만큼 좌표 이동)
  const moveChildren = (
    tree: TreeNode[],
    parentObject: fabric.Object,
    deltaX: number
  ) => {
    // 부모 노드 id
    const parentId =
      (parentObject as any).customId ?? parentObject?.toObject()?.id;
    if (!parentId) return;

    // 재귀로 자식 노드 찾고 이동
    const findAndMove = (nodes: TreeNode[]) => {
      for (const node of nodes) {
        if (node.id === parentId) {
          // 이 노드의 자식들을 이동시킨다.
          moveNodeChildren(node.children, deltaX);
          break;
        } else {
          findAndMove(node.children);
        }
      }
    };

    const moveNodeChildren = (children: TreeNode[], deltaX: number) => {
      children.forEach((child) => {
        const obj = child.object;
        if (!obj) return;
        const oldLeft = obj.left ?? 0;
        obj.set({ left: oldLeft + deltaX });
        obj.setCoords();

        // 자식이 더 있으면 재귀 이동
        if (child.children.length > 0) {
          moveNodeChildren(child.children, deltaX);
        }
      });
    };

    findAndMove(tree);
  };

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* 상단 툴바 */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Palette size={16} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Leaf</h1>
            </div>

            <div className="flex items-center space-x-1">
              <button className="px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors text-sm flex items-center space-x-1">
                <Save size={14} />
                <span>Save</span>
              </button>
              <button
                onClick={() => {
                  if (!fabricCanvas.current) return;
                  const canvasWidth = fabricCanvas.current.getWidth();
                  const canvasHeight = fabricCanvas.current.getHeight();
                  const screenWidth = window.screen.width;
                  const screenHeight = window.screen.height;
                  console.log(screenWidth, screenHeight);
                  const scaleX = screenWidth / canvasWidth;
                  const scaleY = screenHeight / canvasHeight;

                  const code = treeToCode(
                    treeNodes,
                    unlinkedNodes,
                    scalingTargetValueRef.current,
                    0,
                    0,
                    0,
                    scaleX,
                    scaleY
                  );
                  // console.log("최종출력코드", code);
                  setExportFile(`
                    <!DOCTYPE html>
                    <html lang="en">
                    <head>
                      <meta charset="UTF-8" />
                      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                      <title>Exported Tree</title>
                      <style>
                        body {
                          position: relative;
                          width: 100%;
                          height: 100vh;
                          margin: 0;
                          background-color: gray;
                        }
                      </style>
                    </head>
                    <body>
                      <div style="
                        position: absolute;
                        top: 50%;
                        left: 50%;
                        transform: translate(-50%, -50%);
                        background-color: white;
                        height: 100vh;
                        width: ${screenWidth}px;
                      ">
                        ${code}
                      </div>
                    </body>
                    </html>
                  `);
                }}
                className="px-3 py-1.5 bg-gray-700 text-gray-200 rounded-md hover:bg-gray-600 transition-colors text-sm flex items-center space-x-1"
              >
                <Download size={14} />
                <span>Export</span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-1 bg-gray-700 rounded-lg p-1">
              <button className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors">
                <ZoomOut size={16} />
              </button>
              <span className="text-sm text-gray-300 px-2">100%</span>
              <button className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-600 rounded transition-colors">
                <ZoomIn size={16} />
              </button>
            </div>

            <button className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
              <Grid size={16} />
            </button>

            <button
              onClick={clearCanvas}
              className="px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md transition-colors text-sm"
            >
              Clear All
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* 왼쪽 사이드바 */}
        <div className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
          {/* 탭 네비게이션 */}
          <div className="flex border-b border-gray-700">
            <button
              onClick={() => setActiveTab("shapes")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === "shapes"
                  ? "bg-gray-700 text-white border-b-2 border-blue-500"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              Shapes
            </button>
            <button
              onClick={() => setActiveTab("layers")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === "layers"
                  ? "bg-gray-700 text-white border-b-2 border-blue-500"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              Layers
            </button>
          </div>

          {/* 컨텐츠 영역 */}
          <div className="flex-1 p-4">
            {activeTab === "shapes" ? (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">
                  Basic Shapes
                </h3>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => addShape("layout")}
                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex flex-col items-center space-y-1 group"
                  >
                    <Layers
                      size={20}
                      className="text-blue-400 group-hover:text-blue-300"
                    />
                    <span className="text-xs text-gray-300">Layout</span>
                  </button>
                  <button
                    onClick={() => addShape("circle")}
                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex flex-col items-center space-y-1 group"
                  >
                    <Circle
                      size={20}
                      className="text-blue-400 group-hover:text-blue-300"
                    />
                    <span className="text-xs text-gray-300">Circle</span>
                  </button>

                  <button
                    onClick={() => addShape("rectangle")}
                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex flex-col items-center space-y-1 group"
                  >
                    <Square
                      size={20}
                      className="text-red-400 group-hover:text-red-300"
                    />
                    <span className="text-xs text-gray-300">Rectangle</span>
                  </button>

                  <button
                    onClick={() => addShape("triangle")}
                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex flex-col items-center space-y-1 group"
                  >
                    <Triangle
                      size={20}
                      className="text-green-400 group-hover:text-green-300"
                    />
                    <span className="text-xs text-gray-300">Triangle</span>
                  </button>

                  <button
                    onClick={() => addShape("text")}
                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex flex-col items-center space-y-1 group"
                  >
                    <Type
                      size={20}
                      className="text-purple-400 group-hover:text-purple-300"
                    />
                    <span className="text-xs text-gray-300">Text</span>
                  </button>
                  <button
                    onClick={() => createImage(fabricCanvas.current)}
                    className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors flex flex-col items-center space-y-1 group"
                  >
                    <Image
                      size={20}
                      className="text-yellow-400 group-hover:text-red-300"
                    />
                    <span className="text-xs text-gray-300">Image</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">
                  Layers
                </h3>

                <div className="text-sm">
                  <div className="text-sm">
                    {/* <RenderTree
                      nodes = [...tree, ...unlinkedNodes]
                      setDraggedNodeId,
                      dragOverNodeId,
                      draggedNodeId,
                      setTree,
                      unlinkedNodes,
                      setDragOverNodeId,
                      // getIcon,
                      /> */}
                    <RenderTree
                      tree={tree}
                      setTree={setTree}
                      fabricCanvas={fabricCanvas.current}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 중앙 캔버스 영역 */}
        <div className="flex-1 flex items-center justify-center bg-gray-900 p-8">
          <div className="bg-white shadow-xl">
            <canvas
              ref={canvasRef}
              style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.1)" }}
            />
          </div>
        </div>

        {/* 오른쪽 속성 패널 */}
        <div className="w-80 bg-gray-800 border-l border-gray-700 flex flex-col">
          <div className="p-4 border-b border-gray-700">
            <h2 className="text-lg font-semibold text-white">Properties</h2>
          </div>

          <div className="flex-1 p-4">
            {selectedObject ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                    <span className="text-sm font-medium text-gray-300">
                      Selected Object
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors">
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={deleteSelected}
                      className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Fill */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300">
                    Fill
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={objectProperties.fill}
                      onChange={(e) => updateProperty("fill", e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-600 bg-gray-700"
                    />
                    <input
                      type="text"
                      value={objectProperties.fill}
                      onChange={(e) => updateProperty("fill", e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                {/* Stroke */}
                <div className="space-y-3">
                  <label className="block text-sm font-medium text-gray-300">
                    Stroke
                  </label>
                  <div className="flex items-center space-x-2">
                    <input
                      type="color"
                      value={objectProperties.stroke}
                      onChange={(e) => updateProperty("stroke", e.target.value)}
                      className="w-10 h-10 rounded-lg border border-gray-600 bg-gray-700"
                    />
                    <input
                      type="text"
                      value={objectProperties.stroke}
                      onChange={(e) => updateProperty("stroke", e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Width</span>
                      <span className="text-sm text-gray-300">
                        {objectProperties.strokeWidth}px
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="10"
                      value={objectProperties.strokeWidth}
                      onChange={(e) =>
                        updateProperty("strokeWidth", parseInt(e.target.value))
                      }
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                </div>

                {/* Opacity */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-300">
                      Opacity
                    </span>
                    <span className="text-sm text-gray-300">
                      {Math.round(objectProperties.opacity * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={objectProperties.opacity}
                    onChange={(e) =>
                      updateProperty("opacity", parseFloat(e.target.value))
                    }
                    className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>

                {/* Transform */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-300">
                    Transform
                  </h3>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Rotation</span>
                      <span className="text-sm text-gray-300">
                        {Math.round(objectProperties.angle)}°
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="360"
                      value={objectProperties.angle}
                      onChange={(e) =>
                        updateProperty("angle", parseInt(e.target.value))
                      }
                      className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                </div>

                {/* Array */}
                <div className="space-y-4">
                  <h3 className="text-sm font-medium text-gray-300">Array</h3>
                  <div className="space-y-3">
                    {/* Self Array */}
                    <div>
                      <span className="text-sm text-gray-400 block mb-2">
                        Self Align
                      </span>
                      <div className="flex gap-2">
                        {["left", "center", "right"].map((pos) => (
                          <button
                            key={pos}
                            onClick={() =>
                              handleSelfAlign(pos, fabricCanvas, tree)
                            }
                            className="flex-1 py-2 bg-gray-700 hover:bg-gray-600 rounded-md text-sm text-gray-200 transition-all"
                          >
                            {pos}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Zindex */}
                <div className="space-y-4 text-white">
                  <h3 className="text-sm font-medium text-gray-300">z-index</h3>
                  <ul className="space-y-1 mt-2">
                    {objectOrder.map((obj, index) => {
                      const isSelected = selectedObject === obj;

                      return (
                        <li
                          key={obj.id || obj.name || index}
                          className={`flex items-center justify-between bg-gray-700 px-3 py-2 rounded
                            ${
                              isSelected
                                ? "ring-2 ring-offset-2 ring-purple-400"
                                : ""
                            }
                          `}
                          tabIndex={isSelected ? 0 : -1} // 선택된 아이템에만 tab 포커스 가능
                        >
                          <div>
                            {index}: {obj.type} (
                            {obj.name || obj.id || "unnamed"})
                          </div>
                          <div className="flex gap-2">
                            <button
                              disabled={index === 0}
                              onClick={() => moveUp(index)}
                              className={`px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50`}
                            >
                              ▲
                            </button>
                            <button
                              disabled={index === objectOrder.length - 1}
                              onClick={() => moveDown(index)}
                              className={`px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 disabled:opacity-50`}
                            >
                              ▼
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <Move size={48} className="mx-auto mb-4 text-gray-600" />
                <p className="text-sm">Select an object to</p>
                <p className="text-sm">edit its properties</p>
              </div>
            )}
          </div>
        </div>
      </div>
      {hoveredLayout && menuPosition && (
        <div
          style={{
            position: "absolute",
            top: menuPosition.y,
            left: menuPosition.x,
            transform: "translate(-50%, -100%)",
            backgroundColor: "white",
            border: "1px solid #ccc",
            padding: "8px",
            borderRadius: "8px",
            boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
            zIndex: 999,
          }}
        >
          <button
            onClick={() => {
              addChildToTree(setTree, hoveredLayout, movingObjectRef.current);
              setHoveredLayout(null);
              setMenuPosition(null);
            }}
          >
            레이아웃에 추가
          </button>
        </div>
      )}
    </div>
  );
}
