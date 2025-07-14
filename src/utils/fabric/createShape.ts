import * as fabric from "fabric";
import { v4 as uuidv4 } from "uuid";

export function createShape(type: string): fabric.Object | null {
  switch (type) {
    case "layout": {
      const layout = new fabric.Rect({
        width: 400,
        height: 60,
        fill: "rgba(255, 255, 255, 0.1)",
        left: 100,
        top: 100,
        stroke: "rgba(0, 145, 255, 0.3)",
        strokeWidth: 1,
        strokeDashArray: [2, 2],
        strokeUniform: true,
      });
      layout.set("customId", uuidv4());
      layout.set("shapeType", "layout");
      return layout;
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
      return circle;
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
      return rect;
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
      return triangle;
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
      return text;
    }

    default:
      return null;
  }
}
