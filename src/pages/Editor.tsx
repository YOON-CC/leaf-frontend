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
import { createShape } from "../utils/fabric/createShape";
import {
  addChildToTree,
  findNodeByIdInTree,
  moveSubtreeInTree,
} from "../utils/tree/treeUtils";
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
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const menuTimeoutRef = useRef<any>(null);

  // 🍎
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

  // console.log(tree);

  // 🍎
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
    setSelectedObject(null);
  };

  // 🍎
  const clearCanvas = () => {
    if (!fabricCanvas.current) return;
    fabricCanvas.current.clear();
    fabricCanvas.current.backgroundColor = "#ffffff";
    fabricCanvas.current.renderAll();
  };

  // 🦖🦖🦖🦖🦖🦖🦖🦖🦖🦖🦖🦖🦖🦖🦖🦖🦖🦖🦖🦖🦖🦖 드래그 로직
  const [draggedNodeId, setDraggedNodeId] = useState<string | null>(null);

  // 드래그 시작 이벤트 핸들러
  const handleDragStart = (nodeId: string) => (e: React.DragEvent) => {
    setDraggedNodeId(nodeId);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", nodeId);
  };

  // 드롭 이벤트 핸들러
  const handleDrop =
    (targetNodeId: string, shapeType: string) => (e: React.DragEvent) => {
      e.preventDefault();
      console.log("드랍", targetNodeId, shapeType, dragOverNodeId);
      if (!draggedNodeId) return;
      if (!dragOverNodeId) return;

      setTree((prevTree: TreeNode[]) => {
        const combinedTree = [...prevTree, ...unlinkedNodes];
        // 이동 하는 객체
        const draggedNode = findNodeByIdInTree(combinedTree, draggedNodeId);
        if (!draggedNode) return prevTree;

        // 이동 목적지
        const targetNode = findNodeByIdInTree(combinedTree, targetNodeId);
        if (!targetNode) return prevTree;

        // 이동목적지가 layout이어야함
        const isTargetLayout = shapeType === "layout";
        console.log("이동 목적지", isTargetLayout);
        if (!isTargetLayout) {
          // layout이 아니면 트리 변경하지 않고 이전 상태 유지
          return prevTree;
        }

        // 이동한 노드의 부모 제거
        const removeNodeById = (nodes: TreeNode[], id: string): TreeNode[] => {
          return nodes
            .filter((node) => node.id !== id)
            .map((node) => ({
              ...node,
              children: removeNodeById(node.children, id),
            }));
        };

        // let newTree = removeNodeById(prevTree, draggedNodeId);
        let newTree = removeNodeById(combinedTree, draggedNodeId);
        console.log("트리거1111111");
        // 새로운 자식 추가
        const insertNodeToParent = (
          nodes: TreeNode[],
          parentId: string,
          nodeToInsert: TreeNode
        ): TreeNode[] => {
          return nodes.map((node) => {
            if (node.id === parentId) {
              return {
                ...node,
                children: [...node.children, nodeToInsert],
              };
            } else {
              return {
                ...node,
                children: insertNodeToParent(
                  node.children,
                  parentId,
                  nodeToInsert
                ),
              };
            }
          });
        };
        console.log("트리거2323232323", newTree, targetNodeId, draggedNode);

        newTree = insertNodeToParent(newTree, targetNodeId, draggedNode);

        console.log("트리거2222222222", newTree);
        return newTree;
      });

      setDraggedNodeId(null);
    };

  // 드래그 오버
  const [dragOverNodeId, setDragOverNodeId] = useState<string | null>(null);
  // over 중임 => drop을 하더라도 정상동작할거
  const handleDragOver = (nodeId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    if (!draggedNodeId) return;

    // 자기자신 제외
    if (nodeId === draggedNodeId) {
      setDragOverNodeId(null);
      return;
    }

    setDragOverNodeId(nodeId);
  };

  // over 떠남
  const handleDragLeave = (nodeId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    if (dragOverNodeId === nodeId) {
      setDragOverNodeId(null);
    }
  };

  const flattenTreeIds = (node: TreeNode): string[] => {
    return [node.id, ...node.children.flatMap(flattenTreeIds)];
  };

  const treeIds = new Set(tree.flatMap(flattenTreeIds));

  const unlinkedNodes: TreeNode[] = (fabricCanvas.current?.getObjects() || [])
    .filter((obj) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const id = (obj as any).customId;
      return id && !treeIds.has(id);
    })
    .map((obj) => ({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      id: (obj as any).customId,
      object: obj,
      children: [],
    }));

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
                draggable
                onDragStart={handleDragStart(node.id)}
                onDrop={handleDrop(node.id, shapeType)}
                onDragOver={handleDragOver(node.id)}
                onDragLeave={handleDragLeave(node.id)}
                className="flex items-center gap-2 cursor-pointer select-none rounded-md text-gray-100 text-sm hover:bg-gray-700 p-1 text-white"
                style={{ paddingLeft: level === 0 ? 4 : undefined }}
              >
                {getIcon(node.object.type, shapeType)}
                <span>
                  {label}
                  {node.id}
                </span>
              </div>
              {node.children.length > 0 && renderTree(node.children, level + 1)}
            </li>
          );
        })}
      </ul>
    );
  };

  function getIcon(type: string, shapeType?: string) {
    if (shapeType === "layout") {
      return <Layers size={16} className="text-blue-400" />;
    }

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
  }

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

                <div className="text-sm">
                  <div className="text-sm">
                    {renderTree([...tree, ...unlinkedNodes])}
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
