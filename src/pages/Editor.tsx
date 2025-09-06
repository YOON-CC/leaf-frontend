/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState } from "react";
import * as fabric from "fabric";
import { Move, Trash2, AlignLeft, AlignCenter, AlignRight } from "lucide-react";
import { createShape } from "../utils/fabric/createShape";
import { addChildToTree } from "../utils/tree/treeUtils";

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
import {
  defaultShadowBlur,
  defaultShadowColor,
  defaultShadowOffset,
  handleBlurChange,
  handleColorChange,
  handleShadowClick,
  shadows,
  syncShadowFromObject,
} from "../utils/fabric/shadowUtils";
import { exportCanvas } from "../utils/export/exportCanvas";
import Header from "../components/layout/Header";
import AnimationButtons from "../components/ui/AnnimationButtons";
import LeftSideBar from "../components/layout/LeftSideBar";
interface TreeNode {
  id: string; // customId
  object: fabric.Object;
  children: TreeNode[];
}

export default function Editor() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricCanvas = useRef<fabric.Canvas | null>(null);
  const [selectedObject, setSelectedObject] = useState<any | null>(null);
  const [objectProperties, setObjectProperties] = useState({
    fill: "#ff0000",
    strokeWidth: 0,
    stroke: "#000000",
    opacity: 1,
    rx: 0,
    ry: 0,
    angle: 0,
    scaleX: 1,
    scaleY: 1,
    fontSize: 16,
  });

  // canvas 배경색 설정
  const [canvasBackgroundColor, setCanvasBackgroundColor] = useState("#ffffff");
  useEffect(() => {
    if (!fabricCanvas.current) return;

    fabricCanvas.current.backgroundColor = canvasBackgroundColor;
    fabricCanvas.current.renderAll();
  }, [canvasBackgroundColor]);

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

  // 그림자
  const [shadowColor, setShadowColor] = useState(defaultShadowColor);
  const [shadowBlur, setShadowBlur] = useState(defaultShadowBlur);
  const [shadowOffset, setShadowOffset] = useState(defaultShadowOffset);
  useEffect(() => {
    syncShadowFromObject(
      selectedObject,
      setShadowColor,
      setShadowBlur,
      setShadowOffset
    );
  }, [selectedObject]);
  console.log(tree);

  return (
    <div className="h-screen bg-[#1a1a1a] flex flex-col">
      {/* 헤더 */}
      <Header
        exportCanvas={exportCanvas}
        clearCanvas={clearCanvas}
        fabricCanvas={fabricCanvas}
        treeToCode={treeToCode}
        treeNodes={treeNodes}
        unlinkedNodes={unlinkedNodes}
        scalingTargetValueRef={scalingTargetValueRef}
        canvasBackgroundColor={canvasBackgroundColor}
        setExportFile={setExportFile}
      />

      <div className="flex-1 flex">
        {/* 왼쪽 사이드바 */}
        <LeftSideBar
          fabricCanvas={fabricCanvas}
          addShape={addShape}
          createImage={createImage}
          tree={tree}
          setTree={setTree}
        />

        {/* 중앙 캔버스 영역 */}
        <div className="flex-1 flex flex-col bg-[#1a1a1a] min-w-0">
          {/* 캔버스 컨트롤 */}
          <div className="p-3 sm:p-4 border-b border-[#000000] flex justify-center">
            <div className="flex items-center space-x-3 sm:space-x-4">
              <label className="text-sm text-gray-300 hidden sm:inline">
                Background:
              </label>
              <input
                id="bgcolor"
                type="color"
                value={canvasBackgroundColor}
                onChange={(e) => setCanvasBackgroundColor(e.target.value)}
                className="w-10 h-8 sm:w-12 sm:h-10 rounded border border-gray-600 cursor-pointer"
              />
            </div>
          </div>

          {/* 캔버스 */}
          <div className="flex-1 flex items-center justify-center bg-[#1a1a1a]  overflow-auto">
            <div className="bg-white shadow-2xl max-h-[calc(100vh-200px)] max-w-[calc(100vw-40px)] sm:max-w-[calc(100vw-80px)] lg:max-w-[90%] overflow-auto">
              <canvas
                ref={canvasRef}
                className="max-w-full max-h-full block"
                style={{ boxShadow: "0 0 0 1px rgba(0,0,0,0.1)" }}
              />
            </div>
          </div>
        </div>

        {/* 오른쪽 속성 패널 */}
        <div className="w-80 bg-[#1a1a1a] border-l border-[#000000] flex flex-col max-h-[calc(100vh-60px)] overflow-auto">
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
                {selectedObject.shapeType !== "layout" && (
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
                )}
                {selectedObject.shapeType === "text" && (
                  <div className="space-y-3">
                    <label className="block text-sm font-medium text-gray-300">
                      Text Size
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={200}
                      value={
                        objectProperties.fontSize ||
                        selectedObject.fontSize ||
                        16
                      } // 기본값 16
                      onChange={(e) => {
                        const newSize = parseInt(e.target.value, 10);
                        handlePropertyChange("fontSize", newSize);

                        if (selectedObject) {
                          selectedObject.set("fontSize", newSize);
                          selectedObject.canvas?.renderAll();
                        }
                      }}
                      className="w-full px-3 py-2 bg-[#303030] border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#28e0b2]"
                    />

                    <label className="block text-sm font-medium text-gray-300 mt-4">
                      Text Content
                    </label>
                    <input
                      value={selectedObject.text || ""}
                      onChange={(e) => {
                        const newText = e.target.value;
                        handlePropertyChange("text", newText);

                        if (selectedObject) {
                          selectedObject.set("text", newText);
                          selectedObject.canvas?.renderAll();
                        }
                      }}
                      className="w-full px-3 py-2 bg-[#303030] border border-gray-600 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#28e0b2]"
                    />
                  </div>
                )}

                {/* Stroke */}
                {selectedObject.shapeType !== "text" &&
                  selectedObject.shapeType !== "layout" && (
                    <div className="space-y-3">
                      <label className="block text-sm font-medium text-gray-300">
                        Stroke
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="color"
                          value={objectProperties.stroke || "#000000"}
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
                  )}

                {/* Rounded */}
                {selectedObject.shapeType !== "text" &&
                  selectedObject.shapeType !== "layout" && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-300">
                          Rounded
                        </span>
                        <span className="text-sm text-gray-300">
                          {selectedObject?.rx ?? 0}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        step="1"
                        value={selectedObject?.rx ?? 0}
                        onChange={(e) => {
                          const value = parseInt(e.target.value);
                          handlePropertyChange("rx", value);
                          handlePropertyChange("ry", value); // 둥글기 대칭 적용
                        }}
                        className="w-full h-2 bg-[#303030] rounded-lg appearance-none cursor-pointer slider"
                      />
                    </div>
                  )}

                {/* Opacity */}
                {selectedObject.shapeType !== "text" &&
                  selectedObject.shapeType !== "layout" && (
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
                  )}
                {/* Shadow */}
                {selectedObject.shapeType !== "text" &&
                  selectedObject.shapeType !== "layout" && (
                    <div className="space-y-4">
                      <h3 className="text-sm font-medium text-gray-300">
                        Shadow
                      </h3>

                      {/* 색상 & Blur 선택 */}
                      <div className="flex items-center gap-4 text-white text-sm">
                        <input
                          type="color"
                          value={shadowColor}
                          onChange={(e) =>
                            handleColorChange(
                              e.target.value,
                              shadowBlur,
                              shadowOffset,
                              selectedObject,
                              fabricCanvas.current,
                              setShadowColor,
                              setObjectProperties
                            )
                          }
                        />
                        <label className="flex items-center gap-2">
                          Blur:
                          <input
                            type="range"
                            min={0}
                            max={50}
                            value={shadowBlur}
                            onChange={(e) =>
                              handleBlurChange(
                                Number(e.target.value),
                                shadowColor,
                                shadowOffset,
                                selectedObject,
                                fabricCanvas.current,
                                setShadowBlur,
                                setObjectProperties
                              )
                            }
                          />
                          <span className="w-6 text-right">{shadowBlur}px</span>
                        </label>
                      </div>

                      {/* 그림자 offset 버튼들 */}
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                        {shadows.map((s) => {
                          const isActive =
                            shadowOffset.x === s.x && shadowOffset.y === s.y;
                          return (
                            <button
                              key={s.name}
                              onClick={() =>
                                handleShadowClick(
                                  s.x,
                                  s.y,
                                  shadowColor,
                                  shadowBlur,
                                  selectedObject,
                                  fabricCanvas.current,
                                  setShadowOffset,
                                  setObjectProperties
                                )
                              }
                              className={`flex justify-center items-center h-[40px] rounded-lg font-medium transition-all transform hover:scale-105
                                ${
                                  isActive
                                    ? "bg-[#259478] text-white"
                                    : "bg-[#303030] text-gray-300 hover:bg-[#252525]"
                                }
                              `}
                              style={{
                                boxShadow: `${s.x}px ${s.y}px ${shadowBlur}px ${shadowColor}`,
                              }}
                            >
                              {s.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

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
                  <h3 className="text-sm font-medium text-gray-300">
                    Animation
                  </h3>
                  <AnimationButtons
                    applyAnimation={applyAnimation}
                    selectedObject={selectedObject}
                  />
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
                            ${isSelected ? "ring-2  ring-[#28e0b2]" : ""}
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
