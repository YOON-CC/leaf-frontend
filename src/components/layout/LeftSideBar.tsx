/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from "react";
import { Layers, Square, Type, Image } from "lucide-react";
import RenderTree from "../treeVisual/TreeRenderer";

export default function LeftSideBar({
  fabricCanvas,
  addShape,
  createImage,
  tree,
  setTree,
}: {
  fabricCanvas: any;
  addShape: (shape: string) => void;
  createImage: (canvas: any) => void;
  tree: any;
  setTree: (tree: any) => void;
}) {
  const [activeTab, setActiveTab] = useState<"shapes" | "layers">("shapes");

  return (
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
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Frame</h3>
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
            <h3 className="text-sm font-semibold text-gray-300 mb-3">Layers</h3>

            <div className="text-sm">
              <div className="text-sm">
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
  );
}
