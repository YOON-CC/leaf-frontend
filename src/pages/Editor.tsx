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
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";
interface TreeNode {
  id: string; // customId
  object: fabric.Object;
  children: TreeNode[];
}
interface FabricObjectWithId extends fabric.Object {
  customId?: string;
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const menuTimeoutRef = useRef<any>(null);

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
      updatePropertiesFromObject(selected);
    });

    fabricCanvas.current.on("selection:updated", (e) => {
      const selected = e.selected[0];
      setSelectedObject(selected);
      updatePropertiesFromObject(selected);
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

        const node = findNodeById(treeRef.current, layoutId);

        if (node && fabricCanvas.current) {
          moveNodeAndDescendants(node, dx, dy);
          fabricCanvas.current.requestRenderAll();
        }

        movingObj.set("prevLeft", movingObj.left);
        movingObj.set("prevTop", movingObj.top);
      }

      let intersecting = false;
      let collidedLayout: fabric.Rect | null = null;

      layoutListRef.current.forEach((layout) => {
        if (movingObj === layout) return;

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

      if (intersecting && collidedLayout && fabricCanvas.current) {
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
  const creatingRelationShip = (
    layoutObject: fabric.Object | null,
    movingObject: fabric.Object | null
  ) => {
    if (!layoutObject || !movingObject) return;

    const parentId = (layoutObject as FabricObjectWithId).customId;
    const childId = (movingObject as FabricObjectWithId).customId;

    if (!parentId || !childId) {
      console.warn("customId가 없습니다.");
      return;
    }

    setTree((prevTree) => {
      // 부모 찾기 함수
      const findAndInsert = (nodes: TreeNode[]): TreeNode[] => {
        return nodes.map((node) => {
          if (node.id === parentId) {
            return {
              ...node,
              children: [
                ...node.children,
                {
                  id: childId,
                  object: movingObject,
                  children: [],
                },
              ],
            };
          } else {
            return {
              ...node,
              children: findAndInsert(node.children),
            };
          }
        });
      };

      // 부모가 기존 트리에 있을 때
      const newTree = findAndInsert(prevTree);

      // 부모가 트리에 없으면 새로 추가
      const parentExists = JSON.stringify(newTree) !== JSON.stringify(prevTree);
      if (parentExists) return newTree;

      // 새로운 부모 노드를 만들어서 추가
      return [
        ...prevTree,
        {
          id: parentId,
          object: layoutObject,
          children: [
            {
              id: childId,
              object: movingObject,
              children: [],
            },
          ],
        },
      ];
    });
  };

  // 트리에서 id에 해당하는 노드 재귀 탐색
  function findNodeById(tree: TreeNode[], id: string): TreeNode | null {
    for (const node of tree) {
      if (node.id === id) return node;
      if (node.children && node.children.length > 0) {
        const found = findNodeById(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  // 노드와 모든 하위 자식 노드들 위치 재귀 이동
  function moveNodeAndDescendants(node: TreeNode, dx: number, dy: number) {
    if (!node.children) return;
    node.children.forEach((child) => {
      const obj = child.object;
      if (!obj) return;

      obj.set({
        left: (obj.left ?? 0) + dx,
        top: (obj.top ?? 0) + dy,
      });
      obj.setCoords();

      moveNodeAndDescendants(child, dx, dy);
    });
  }

  console.log(tree);

  const updatePropertiesFromObject = (obj: fabric.Object) => {
    setObjectProperties({
      fill: (obj.fill as string) || "#ff0000",
      strokeWidth: obj.strokeWidth || 0,
      stroke: (obj.stroke as string) || "#000000",
      opacity: obj.opacity || 1,
      angle: obj.angle || 0,
      scaleX: obj.scaleX || 1,
      scaleY: obj.scaleY || 1,
    });
  };
  const layoutListRef = useRef<fabric.Rect[]>([]);

  const addShape = (type: string) => {
    if (!fabricCanvas.current) return;

    let shape: fabric.Object | null = null;

    switch (type) {
      case "layout": {
        const layout = new fabric.Rect({
          width: 400,
          height: 60,
          fill: "rgba(255, 255, 255, 0.1)", // 거의 흰색, 약간 투명
          left: 100,
          top: 100,
          stroke: "rgba(0, 145, 255, 0.3)", // 연하고 부드러운 파란색 테두리
          strokeWidth: 1,
          strokeDashArray: [2, 2],
          strokeUniform: true,
        });
        layout.set("customId", uuidv4());
        layout.set("shapeType", "layout");
        layoutListRef.current.push(layout);
        shape = layout;
        break;
      }

      case "circle": {
        const circle = new fabric.Circle({
          radius: 50,
          fill: "#3b82f6",
          left: 100,
          top: 100,
        });
        circle.set("customId", uuidv4());
        circle.set("shapeType", "circle");
        shape = circle;
        break;
      }

      case "rectangle": {
        const rect = new fabric.Rect({
          width: 100,
          height: 60,
          fill: "#ef4444",
          left: 100,
          top: 100,
        });
        rect.set("customId", uuidv4());
        rect.set("shapeType", "rectangle");
        shape = rect;
        break;
      }

      case "triangle": {
        const triangle = new fabric.Triangle({
          width: 100,
          height: 100,
          fill: "#10b981",
          left: 100,
          top: 100,
        });
        triangle.set("customId", uuidv4());
        triangle.set("shapeType", "triangle");
        shape = triangle;
        break;
      }

      case "text": {
        const text = new fabric.Text("텍스트", {
          left: 100,
          top: 100,
          fontSize: 24,
          fill: "#1f2937",
        });
        text.set("customId", uuidv4());
        text.set("shapeType", "text");
        shape = text;
        break;
      }
      default:
        return;
    }

    if (!shape) return;

    fabricCanvas.current.add(shape);
    fabricCanvas.current.setActiveObject(shape);
    fabricCanvas.current.requestRenderAll();
  };

  const updateProperty = (property: string, value: string | number) => {
    if (!selectedObject || !fabricCanvas.current) return;

    selectedObject.set(property, value);
    fabricCanvas.current.renderAll();

    setObjectProperties((prev) => ({
      ...prev,
      [property]: value,
    }));
  };

  const deleteSelected = () => {
    if (!selectedObject || !fabricCanvas.current) return;

    fabricCanvas.current.remove(selectedObject);
    setSelectedObject(null);
  };

  const clearCanvas = () => {
    if (!fabricCanvas.current) return;
    fabricCanvas.current.clear();
    fabricCanvas.current.backgroundColor = "#ffffff";
    fabricCanvas.current.renderAll();
  };

  const renderTree = (nodes: TreeNode[], level = 0) => {
    return (
      <ul className={`${level === 0 ? "pl-0" : "pl-6"} space-y-1`}>
        {nodes.map((node) => {
          const shapeType = node.object.get?.("shapeType") || undefined;
          const label =
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (node.object as any).name ||
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (node.object as any).label ||
            (shapeType ?? node.object.type);

          return (
            <li key={node.id}>
              <div
                className={`flex items-center gap-2 cursor-pointer select-none rounded-mdtext-gray-100 text-sm hover:bg-gray-700 p-1 text-white`}
                style={{ paddingLeft: level === 0 ? 4 : undefined }}
              >
                {getIcon(node.object.type, shapeType)}
                <span>{label}</span>
              </div>

              {node.children.length > 0 && renderTree(node.children, level + 1)}
            </li>
          );
        })}
      </ul>
    );
  };

  const getIcon = (type: string, shapeType?: string) => {
    if (shapeType === "layout")
      return <Layers size={16} className="text-blue-400" />;

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
                  const objects = fabricCanvas.current.getObjects();
                  console.log("Canvas Objects:", objects);
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
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-300 mb-3">
                  Layers
                </h3>
                {tree.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Layers size={32} className="mx-auto mb-2 text-gray-600" />
                    <p className="text-sm">No layers yet</p>
                  </div>
                ) : (
                  <div className="text-sm">{renderTree(tree)}</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 중앙 캔버스 영역 */}
        <div className="flex-1 flex items-center justify-center bg-gray-900 p-8">
          <div className="bg-white rounded-lg shadow-xl">
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

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Scale X</span>
                        <span className="text-sm text-gray-300">
                          {objectProperties.scaleX.toFixed(1)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="3"
                        step="0.1"
                        value={objectProperties.scaleX}
                        onChange={(e) =>
                          updateProperty("scaleX", parseFloat(e.target.value))
                        }
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Scale Y</span>
                        <span className="text-sm text-gray-300">
                          {objectProperties.scaleY.toFixed(1)}
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="3"
                        step="0.1"
                        value={objectProperties.scaleY}
                        onChange={(e) =>
                          updateProperty("scaleY", parseFloat(e.target.value))
                        }
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                  </div>
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
              creatingRelationShip(hoveredLayout, movingObjectRef.current);
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
