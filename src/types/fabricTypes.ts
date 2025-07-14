import * as fabric from "fabric";

export interface TreeNode {
  id: string;
  object: fabric.Object;
  children: TreeNode[];
}

export interface FabricObjectWithId extends fabric.Object {
  customId?: string;
}
