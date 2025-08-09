/* eslint-disable @typescript-eslint/no-explicit-any */
import { Menu, Palette, Save, Download, ChevronLeft } from "lucide-react";

export default function Header({
  exportCanvas,
  clearCanvas,
  fabricCanvas,
  treeToCode,
  treeNodes,
  unlinkedNodes,
  scalingTargetValueRef,
  canvasBackgroundColor,
  setExportFile,
}: any) {
  return (
    <header className="bg-[#1a1a1a] border-b border-[#000000] px-3 sm:px-4 py-2 sm:py-3 flex-shrink-0">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-1 ">
          {/* 모바일 메뉴 토글 */}
          <button className="lg:hidden p-2 text-white hover:bg-[#252525] rounded-md transition-colors">
            <Menu size={20} />
          </button>

          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-[#28e0b2] rounded-lg flex items-center justify-center flex-shrink-0">
              <Palette size={16} className="text-white" />
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white">Leaf</h1>
          </div>

          {/* 액션 버튼들 - 모바일에서 숨김 */}
          <div className="hidden sm:flex items-center space-x-2">
            <button className="ml-4 px-3 py-1.5 bg-[#28e0b2] text-white rounded-md hover:bg-[#259478] transition-colors text-sm flex items-center space-x-1">
              <Save size={14} />
              <span className="hidden md:inline">Save</span>
            </button>
            <button
              onClick={() =>
                exportCanvas({
                  fabricCanvas,
                  treeToCode,
                  treeNodes,
                  unlinkedNodes,
                  scalingTargetValueRef,
                  canvasBackgroundColor,
                  setExportFile,
                })
              }
              className="px-3 py-1.5 bg-[#1a1a1a] text-gray-200 rounded-md hover:bg-[#252525] transition-colors text-sm flex items-center space-x-1"
            >
              <Download size={14} />
              <span className="hidden md:inline">Export</span>
            </button>
          </div>
        </div>

        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* 모바일 액션 버튼들 */}
          <div className="flex sm:hidden items-center space-x-1">
            <button className="p-2 bg-[#28e0b2] text-white rounded-md hover:bg-[#259478] transition-colors">
              <Save size={16} />
            </button>
            <button
              className="p-2 bg-[#1a1a1a] text-gray-200 rounded-md hover:bg-[#252525] transition-colors"
              onClick={() =>
                exportCanvas({
                  fabricCanvas,
                  treeToCode,
                  treeNodes,
                  unlinkedNodes,
                  scalingTargetValueRef,
                  canvasBackgroundColor,
                  setExportFile,
                })
              }
            >
              <Download size={16} />
            </button>
          </div>

          {/* 속성 패널 토글 (모바일) */}
          <button className="lg:hidden p-2 text-white hover:bg-[#252525] rounded-md transition-colors">
            <ChevronLeft size={20} />
          </button>

          <button
            onClick={() => clearCanvas(fabricCanvas)}
            className="px-2 sm:px-3 py-1.5 text-red-400 hover:text-red-300 hover:bg-red-900/20 rounded-md transition-colors text-sm"
          >
            <span className="hidden sm:inline">Clear All</span>
            <span className="sm:hidden">Clear</span>
          </button>
        </div>
      </div>
    </header>
  );
}
