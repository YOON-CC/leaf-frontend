/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  ArrowUp,
  ArrowDown,
  ArrowRight,
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  Move,
} from "lucide-react";

const animationList = [
  {
    key: "up",
    label: "Up",
    icon: ArrowUp,
    color: "bg-green-600",
    hover: "hover:bg-green-500",
  },
  {
    key: "down",
    label: "Down",
    icon: ArrowDown,
    color: "bg-blue-600",
    hover: "hover:bg-blue-500",
  },
  {
    key: "right",
    label: "Right",
    icon: ArrowRight,
    color: "bg-orange-600",
    hover: "hover:bg-orange-500",
  },
  {
    key: "left",
    label: "Left",
    icon: ArrowLeft,
    color: "bg-yellow-600",
    hover: "hover:bg-yellow-500",
  },
  {
    key: "scaleUp",
    label: "Scale Up",
    icon: ZoomIn,
    color: "bg-purple-600",
    hover: "hover:bg-purple-500",
  },
  {
    key: "scaleDown",
    label: "Scale Down",
    icon: ZoomOut,
    color: "bg-pink-600",
    hover: "hover:bg-pink-500",
  },
  {
    key: "fadeIn",
    label: "Fade In",
    icon: Eye,
    color: "bg-gray-400",
    hover: "hover:bg-gray-500",
  },
  {
    key: "fadeOut",
    label: "Fade Out",
    icon: EyeOff,
    color: "bg-orange-800",
    hover: "hover:bg-orange-700",
  },
  {
    key: "sticky",
    label: "sticky",
    icon: Move,
    color: "bg-gray-800",
    hover: "hover:bg-gray-700",
  },
  {
    key: "stickyGently",
    label: "sticky gently",
    icon: Move,
    color: "bg-gray-600",
    hover: "hover:bg-gray-500",
  },
  {
    key: "stickyLater",
    label: "sticky later",
    icon: Move,
    color: "bg-gray-400",
    hover: "hover:bg-gray-300",
  },
];

export default function AnimationButtons({
  applyAnimation,
  selectedObject,
}: any) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 text-[11px]">
      {animationList.map(({ key, label, icon: Icon, color, hover }) => (
        <button
          key={key}
          onClick={() => applyAnimation(key)}
          className={`flex justify-center items-center gap-1 px-2 h-[40px] rounded-lg font-medium transition transform hover:scale-105 ${color} ${hover}
            ${
              selectedObject?.animation === key
                ? "ring-2 ring-white scale-105 shadow-lg"
                : ""
            }`}
        >
          <Icon size={10} />
          {label}
        </button>
      ))}
    </div>
  );
}
