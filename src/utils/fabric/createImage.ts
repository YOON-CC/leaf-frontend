import * as fabric from "fabric";

export const createImage = (canvas: fabric.Canvas | null): void => {
  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/*";

  input.addEventListener("change", (event) => {
    const target = event.target as HTMLInputElement;
    const files = target.files;

    if (files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();

      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;

        const imgElement = new Image();
        imgElement.crossOrigin = "anonymous";
        imgElement.src = imageUrl;

        imgElement.onload = () => {
          const origWidth = imgElement.naturalWidth;
          const origHeight = imgElement.naturalHeight;

          const maxSize = 100;
          const scale = Math.min(maxSize / origWidth, maxSize / origHeight);

          const fabricImg = new fabric.Image(imgElement, {
            left: Math.random() * 200,
            top: Math.random() * 200,
            selectable: true,
            width: origWidth,
            height: origHeight,
            scaleX: scale,
            scaleY: scale,
          });

          if (canvas) {
            canvas.add(fabricImg);
            canvas.renderAll();
          }
        };

        imgElement.onerror = () => {
          console.error("이미지 로딩 실패");
        };
      };

      reader.readAsDataURL(file);
    }
  });

  input.click();
};
