import { Layers } from "lucide-react";
import * as fabric from "fabric";

interface TreeNode {
  id: string; // customId
  object: fabric.Object;
  children: TreeNode[];
}
const renderTree = (nodes: TreeNode[]) => {
  return (
    <ul className="pl-4 space-y-2">
      {nodes.map((node) => (
        <li key={node.id}>
          <div className="flex items-center gap-2 text-gray-200">
            <Layers size={16} className="text-blue-400" />
            <span className="font-medium">{node.object.type} ({node.id})</span>
          </div>

          {node.children.length > 0 && renderTree(node.children)}
        </li>
      ))}
    </ul>
  );
};

export default function LayerPanel({ tree }: { tree: TreeNode[] }) {
  return (
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
        <div className="text-sm">
          {renderTree(tree)}
        </div>
      )}
    </div>
  );
}
