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
  Image,
  ArrowUp,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ZoomIn,
  ZoomOut,
  AlignLeft,
  AlignCenter,
  AlignRight,
} from "lucide-react";
import { createShape } from "../utils/fabric/createShape";
import { addChildToTree } from "../utils/tree/treeUtils";

import RenderTree from "../components/treeVisual/TreeRenderer";
import { treeToCode } from "../utils/export/treeToCode";
import { getCombinedTree } from "../utils/export/getCombinedTree";
import { createImage } from "../utils/fabric/createImage";
import { handleSelfAlign } from "../utils/array/objectAlign";
import { moveDown, moveUp, showZIndexOrder } from "../utils/array/objectOrder";
import { downloadHtmlFile } from "../utils/export/downloadHtmlFile";
import { clearCanvas } from "../utils/fabric/clearCanvas";
import {
  deleteSelected,
  registerDeleteKey,
} from "../utils/handlers/deleteSelectedObject";
import { updateProperty } from "../utils/fabric/changeObjectProperty";
import { useInitCanvas } from "../hooks/fabricEventHooks";
interface TreeNode {
  id: string; // customId
  object: fabric.Object;
  children: TreeNode[];
}

export default function Editor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvas = useRef<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<any | null>(
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

  // 계층관계 트리 로직생성
  const treeRef = useRef<TreeNode[]>([]);
  const [tree, setTree] = useState<TreeNode[]>([]);

  useEffect(() => {
    treeRef.current = tree;
  }, [tree]);

  // 레이아웃 관리
  const layoutListRef = useRef<fabric.Rect[]>([]);

  // 실제 img selector 크기 저장
  const scalingTargetValueRef = useRef<Record<string, [number, number]>>({});

  // fabric의 대부분의 이벤트 관리
  useInitCanvas({
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
  });

  // object 생성
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

  // object 속성 변경
  const handlePropertyChange = (property: string, value: string | number) => {
    updateProperty(
      selectedObject,
      fabricCanvas,
      setObjectProperties,
      property,
      value
    );
  };

  // delete키 입력시 object 삭제
  useEffect(() => {
    const cleanup = registerDeleteKey(() => {
      deleteSelected(selectedObject, fabricCanvas, setTree, setSelectedObject);
    });

    return cleanup;
  }, [selectedObject]);

  // 순서 zindex 변경
  const [objectOrder, setObjectOrder] = useState<fabric.Object[]>([]);

  useEffect(() => {
    showZIndexOrder(fabricCanvas, setObjectOrder);
  }, [selectedObject]);

  // 파일 다운로드 로직
  const [exportFile, setExportFile] = useState("");
  useEffect(() => {
    if (exportFile === "") return;
    downloadHtmlFile(exportFile, "test.html");
  }, [exportFile]);

  // 나중에 export 할때 계층 아닌것도 포함할거임 ㅇㅇ
  const treeNodes = fabricCanvas.current
    ? getCombinedTree(fabricCanvas.current, tree, "tree")
    : [];
  const unlinkedNodes = fabricCanvas.current
    ? getCombinedTree(fabricCanvas.current, tree, "unlinked")
    : [];

  // 애니메이션
  const applyAnimation = (ani: string) => {
    if (!selectedObject) return;
    selectedObject.set("animation", ani);
    setObjectProperties((prev) => ({
      ...prev,
      animation: ani,
    }));
    fabricCanvas.current?.requestRenderAll();
  };

  return (
    <div className="h-screen bg-[#1a1a1a] flex flex-col">
      {/* 상단 툴바 */}
      <header className="bg-[#1a1a1a] border-b border-[#000000] px-4 py-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-[#28e0b2] rounded-lg flex items-center justify-center">
                <Palette size={16} className="text-white" />
              </div>
              <h1 className="text-xl font-bold text-white">Leaf</h1>
            </div>

            <div className="flex items-center space-x-1">
              <button className="px-3 py-1.5 bg-[#28e0b2] text-white rounded-md hover:bg-[#259478] transition-colors text-sm flex items-center space-x-1">
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
                      overflow: auto;
                    ">
                      ${code}
                    </div>

                  <script>
                    document.addEventListener('DOMContentLoaded', () => {
                      const observer = new IntersectionObserver((entries) => {
                        entries.forEach(entry => {
                          if (!entry.isIntersecting) return;

                          const el = entry.target;
                          const animation = el.getAttribute('data-animation');
                          if (!animation) return;

                          if (el.dataset.animated === 'true') return;
                          el.dataset.animated = 'true';

                          el.style.transition = 'all 0.8s ease';

                          switch (animation) {
                            case 'fadeIn':
                              el.style.opacity = '1';
                              break;
                            case 'up':
                              el.style.transform = 'translateY(0)';
                              el.style.opacity = '1';
                              break;
                            case 'down':
                              el.style.transform = 'translateY(0)';
                              el.style.opacity = '1';
                              break;
                            case 'left':
                              el.style.transform = 'translateX(0)';
                              el.style.opacity = '1';
                              break;
                            case 'right':
                              el.style.transform = 'translateX(0)';
                              el.style.opacity = '1';
                              break;
                            case 'scaleUp':
                              el.style.transform = 'scale(1)';
                              el.style.opacity = '1';
                              break;
                            case 'scaleDown':
                              el.style.transform = 'scale(1)';
                              el.style.opacity = '1';
                              break;
                            case 'fixed':
                              // 일단 대기
                              break;
                          }
                        });
                      }, { threshold: 0.1 });

                      document.querySelectorAll('[data-animation]').forEach(el => {
                        const animation = el.getAttribute('data-animation');
                        el.style.opacity = '0';

                        switch (animation) {
                          case 'up':
                            el.style.transform = 'translateY(70px)';
                            break;
                          case 'down':
                            el.style.transform = 'translateY(-70px)';
                            break;
                          case 'left':
                            el.style.transform = 'translateX(70px)';
                            break;
                          case 'right':
                            el.style.transform = 'translateX(-70px)';
                            break;
                          case 'scaleUp':
                            el.style.transform = 'scale(0.7)';
                            break;
                          case 'scaleDown':
                            el.style.transform = 'scale(1.4)';
                            break;
                          case 'fadeIn':
                            break;
                          case 'fixed':
                            el.style.opacity = '1'; // 일단대기
                            return; 
                        }

                        observer.observe(el);
                      });
                    });
                  </script>
                  </body>
                  </html>
                  `);

                }}
                className="px-3 py-1.5 bg-[#1a1a1a] text-gray-200 rounded-md hover:bg-[#252525] transition-colors text-sm flex items-center space-x-1"
              >
                <Download size={14} />
                <span>Export</span>
              </button>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => clearCanvas(fabricCanvas)}
              className="px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md transition-colors text-sm"
            >
              Clear All
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* 왼쪽 사이드바 */}
        <div className="w-64 bg-[#1a1a1a] border-r border-[#000000] flex flex-col">
          {/* 탭 네비게이션 */}
          <div className="flex border-b border-[#000000]">
            <button
              onClick={() => setActiveTab("shapes")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === "shapes"
                  ? "bg-[#1a1a1a] text-white border-b-2 border-[#28e0b2]"
                  : "text-gray-400 hover:text-white hover:bg-[#252525]"
              }`}
            >
              Elements
            </button>
            <button
              onClick={() => setActiveTab("layers")}
              className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
                activeTab === "layers"
                  ? "bg-[#1a1a1a] text-white border-b-2 border-[#28e0b2]"
                  : "text-gray-400 hover:text-white hover:bg-[#252525]"
              }`}
            >
              Layers
            </button>
          </div>

          {/* 컨텐츠 영역 */}
          <div className="flex-1 p-4">
            {activeTab === "shapes" ? (
              <div className="space-y-3">
                {/* 레이아웃 */}
                <h3 className="text-sm font-semibold text-gray-300 mb-3">
                  Frame
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => addShape("layout")}
                    className="p-3 bg-[#303030] hover:bg-[#252525] rounded-lg transition-colors flex flex-col items-center space-y-1 group"
                  >
                    <Layers
                      size={20}
                      className="text-blue-400 group-hover:text-blue-300"
                    />
                    <span className="text-xs text-gray-300">Layout</span>
                  </button>
                </div>
                {/* 기초 도형 */}
                <h3 className="text-sm font-semibold text-gray-300 mb-3">
                  Basic Shapes
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => addShape("circle")}
                    className="p-3 bg-[#303030] hover:bg-[#252525] rounded-lg transition-colors flex flex-col items-center space-y-1 group"
                  >
                    <Circle
                      size={20}
                      className="text-blue-400 group-hover:text-blue-300"
                    />
                    <span className="text-xs text-gray-300">Circle</span>
                  </button>

                  <button
                    onClick={() => addShape("rectangle")}
                    className="p-3 bg-[#303030] hover:bg-[#252525] rounded-lg transition-colors flex flex-col items-center space-y-1 group"
                  >
                    <Square
                      size={20}
                      className="text-red-400 group-hover:text-red-300"
                    />
                    <span className="text-xs text-gray-300">Rectangle</span>
                  </button>

                  <button
                    onClick={() => addShape("triangle")}
                    className="p-3 bg-[#303030] hover:bg-[#252525] rounded-lg transition-colors flex flex-col items-center space-y-1 group"
                  >
                    <Triangle
                      size={20}
                      className="text-green-400 group-hover:text-green-300"
                    />
                    <span className="text-xs text-gray-300">Triangle</span>
                  </button>

                  <button
                    onClick={() => addShape("text")}
                    className="p-3 bg-[#303030] hover:bg-[#252525] rounded-lg transition-colors flex flex-col items-center space-y-1 group"
                  >
                    <Type
                      size={20}
                      className="text-purple-400 group-hover:text-purple-300"
                    />
                    <span className="text-xs text-gray-300">Text</span>
                  </button>
                </div>
                <h3 className="text-sm font-semibold text-gray-300 mb-3">
                  Additional elements
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => createImage(fabricCanvas.current)}
                    className="p-3 bg-[#303030] hover:bg-[#252525] rounded-lg transition-colors flex flex-col items-center space-y-1 group"
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
        <div className="flex-1 flex items-center justify-center bg-[#1a1a1a] p-8">
          <div className="bg-white shadow-xl">
            <canvas
              ref={canvasRef}
              style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.1)" }}
            />
          </div>
        </div>

        {/* 오른쪽 속성 패널 */}
        <div className="w-80 bg-[#1a1a1a] border-l border-[#000000] flex flex-col">
          <div className="p-4 border-b border-[#000000]">
            <h2 className="text-lg font-semibold text-white">Properties</h2>
          </div>

          <div className="flex-1 p-4">
            {selectedObject ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-3 h-3 bg-[#28e0b2] rounded-full"></div>
                    <span className="text-sm font-medium text-gray-300">
                      Selected Object
                    </span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <button className="p-1.5 text-gray-400 hover:text-white hover:bg-[#252525] rounded transition-colors">
                      <Copy size={14} />
                    </button>
                    <button
                      onClick={() =>
                        deleteSelected(
                          selectedObject,
                          fabricCanvas,
                          setTree,
                          setSelectedObject
                        )
                      }
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
                      onChange={(e) =>
                        handlePropertyChange("fill", e.target.value)
                      }
                      className="w-10 h-10 rounded-lg border border-gray-600 bg-[#303030]"
                    />
                    <input
                      type="text"
                      value={objectProperties.fill}
                      onChange={(e) =>
                        handlePropertyChange("fill", e.target.value)
                      }
                      className="flex-1 px-3 py-2 bg-[#303030] border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#28e0b2]"
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
                      onChange={(e) =>
                        handlePropertyChange("stroke", e.target.value)
                      }
                      className="w-10 h-10 rounded-lg border border-gray-600 bg-[#303030]"
                    />
                    <input
                      type="text"
                      value={objectProperties.stroke}
                      onChange={(e) =>
                        handlePropertyChange("stroke", e.target.value)
                      }
                      className="flex-1 px-3 py-2 bg-[#303030] border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#28e0b2]"
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
                        handlePropertyChange(
                          "strokeWidth",
                          parseInt(e.target.value)
                        )
                      }
                      className="w-full h-2 bg-[#303030] rounded-lg appearance-none cursor-pointer slider"
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
                      handlePropertyChange(
                        "opacity",
                        parseFloat(e.target.value)
                      )
                    }
                    className="w-full h-2 bg-[#303030] rounded-lg appearance-none cursor-pointer slider"
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
                        handlePropertyChange("angle", parseInt(e.target.value))
                      }
                      className="w-full h-2 bg-[#303030] rounded-lg appearance-none cursor-pointer slider"
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
                            onClick={() => handleSelfAlign(pos, fabricCanvas, tree)}
                            className="flex flex-1 items-center justify-center gap-1 py-2 bg-[#303030] hover:bg-[#252525] rounded-md text-sm text-gray-200 transition-all"
                          >
                            {pos === "left" && <AlignLeft size={16} />}
                            {pos === "center" && <AlignCenter size={16} />}
                            {pos === "right" && <AlignRight size={16} />}
                            {pos}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Animation */}
                <div className="space-y-4 text-white">
                  <h3 className="text-sm font-medium text-gray-300">Animation</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px]">
                    <button
                      onClick={() => applyAnimation('up')}
                      className={`flex justify-evenly items-center gap-1 px-2 h-[55px] rounded-lg font-medium transition transform hover:scale-105 bg-green-600 hover:bg-green-500
                        ${selectedObject?.animation === 'up' ? 'ring-2 ring-white scale-105 shadow-lg' : ''}`}
                    >
                      <ArrowUp size={12} />
                      Up
                    </button>
                    <button
                      onClick={() => applyAnimation('down')}
                      className={`flex justify-evenly items-center gap-1 px-2 h-[55px] rounded-lg font-medium transition transform hover:scale-105 bg-blue-600 hover:bg-blue-500
                        ${selectedObject?.animation === 'down' ? 'ring-2 ring-white scale-105 shadow-lg' : ''}`}
                    >
                      <ArrowDown size={12} />
                      Down
                    </button>

                    <button
                      onClick={() => applyAnimation('right')}
                      className={`flex justify-evenly items-center gap-1 px-2 h-[55px] rounded-lg font-medium transition transform hover:scale-105 bg-orange-600 hover:bg-orange-500
                        ${selectedObject?.animation === 'right' ? 'ring-2 ring-white scale-105 shadow-lg' : ''}`}
                    >
                      <ArrowRight size={12} />
                      Right
                    </button>

                    <button
                      onClick={() => applyAnimation('left')}
                      className={`flex justify-evenly items-center gap-1 px-2 h-[55px] rounded-lg font-medium transition transform hover:scale-105 bg-yellow-600 hover:bg-yellow-500
                        ${selectedObject?.animation === 'left' ? 'ring-2 ring-white scale-105 shadow-lg' : ''}`}
                    >
                      <ArrowLeft size={12} />
                      Left
                    </button>

                    <button
                      onClick={() => applyAnimation('scaleUp')}
                      className={`flex justify-evenly items-center gap-1 px-2 h-[55px] rounded-lg font-medium transition transform hover:scale-105 bg-purple-600 hover:bg-purple-500
                        ${selectedObject?.animation === 'scaleUp' ? 'ring-2 ring-white scale-105 shadow-lg' : ''}`}
                    >
                      <ZoomIn size={12} />
                      Scale Up
                    </button>

                    <button
                      onClick={() => applyAnimation('scaleDown')}
                      className={`flex justify-evenly items-center gap-1 px-2 h-[55px] rounded-lg font-medium transition transform hover:scale-105 bg-pink-600 hover:bg-pink-500
                        ${selectedObject?.animation === 'scaleDown' ? 'ring-2 ring-white scale-105 shadow-lg' : ''}`}
                    >
                      <ZoomOut size={12} />
                      Scale Down
                    </button>

                    <button
                      onClick={() => applyAnimation('fadeIn')}
                      className={`flex justify-evenly items-center gap-1 px-2 h-[55px] rounded-lg font-medium transition transform hover:scale-105 bg-gray-400 hover:bg-gray-500
                        ${selectedObject?.animation === 'fadeIn' ? 'ring-2 ring-white scale-105 shadow-lg' : ''}`}
                    >
                      <ZoomOut size={12} />
                      Fade In
                    </button>

                    <button
                      onClick={() => applyAnimation('fixed')}
                      className={`flex justify-evenly items-center gap-1 px-2 h-[55px] rounded-lg font-medium transition transform hover:scale-105 bg-gray-600 hover:bg-gray-500
                        ${selectedObject?.animation === 'fixed' ? 'ring-2 ring-white scale-105 shadow-lg' : ''}`}
                    >
                      <Move size={12} />
                      Fixed
                    </button>
                  </div>
                </div>

                {/* Zindex */}
                <div className="space-y-4 text-white">
                  <h3 className="text-sm font-medium text-gray-300">z-index</h3>
                  <ul className="space-y-1 mt-2 max-h-[250px]">
                    {objectOrder.map((obj, index) => {
                      const isSelected = selectedObject === obj;

                      return (
                        <li
                          key={(obj as any).id || (obj as any).name || index}
                          className={`flex items-center justify-between bg-[#303030] px-3 py-2 rounded
                            ${
                              isSelected
                                ? "ring-2  ring-[#28e0b2]"
                                : ""
                            }
                          `}
                          tabIndex={isSelected ? 0 : -1} // 선택된 아이템에만 tab 포커스 가능
                        >
                          <div>
                            {index}: {obj.type} (
                            {(obj as any).name || (obj as any).id || "unnamed"})
                          </div>
                          <div className="flex gap-2">
                            <button
                              disabled={index === 0}
                              onClick={() =>
                                moveUp(
                                  index,
                                  objectOrder,
                                  setObjectOrder,
                                  fabricCanvas
                                )
                              }
                              className={`px-2 py-1 rounded bg-[#28e0b2] hover:bg-[#259478] disabled:opacity-10`}
                            >
                              ▲
                            </button>
                            <button
                              disabled={index === objectOrder.length - 1}
                              onClick={() =>
                                moveDown(
                                  index,
                                  objectOrder,
                                  setObjectOrder,
                                  fabricCanvas
                                )
                              }
                              className={`px-2 py-1 rounded bg-[#28e0b2] hover:bg-[#259478] disabled:opacity-10`}
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
