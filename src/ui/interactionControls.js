import { projectState } from "../state/projectState";
import { getDomRefs } from "./domRefs";
import {
  updatePreview,
  showBoundingBoxTemporarily,
  updateBoundingBox,
  updateCropBox,
  calculateTransparentImagePosition,
  isCropModeEnabled,
  setBoundingBoxSelected,
} from "../render/previewRenderer";

let previewCanvas;
let boundingBox;
let cropBox;

let isDragging = false;
let isResizing = false;
let dragStartX = 0;
let dragStartY = 0;
let resizeHandle = null;
let accumulatedScale = 0;
let isCropDragging = false;
let isCropResizing = false;
let cropResizeHandle = null;
let cropOriginalBounds = null;
let cropAccumulatedDelta = { x: 0, y: 0 };

const initInteractionDomRefs = () => {
  const refs = getDomRefs();
  previewCanvas = refs.previewCanvas;
  boundingBox = refs.boundingBox;
  cropBox = refs.cropBox;
};

const startDrag = (e) => {
  if (e.target.classList.contains("bounding-box__handle")) {
    isResizing = true;
    resizeHandle = e.target;
  } else {
    isDragging = true;
  }

  dragStartX = e.clientX;
  dragStartY = e.clientY;

  e.preventDefault();
  e.stopPropagation();
};

const handleDrag = (e) => {
  if (!isDragging && !isResizing) return;

  const deltaX = e.clientX - dragStartX;
  const deltaY = e.clientY - dragStartY;

  if (isDragging) {
    const bg = projectState.backgroundImage;
    const cropArea = projectState.transformState.cropArea;
    const canvasRect = previewCanvas.getBoundingClientRect();

    let actualScale;
    if (cropArea) {
      const scaleX = canvasRect.width / cropArea.width;
      const scaleY = canvasRect.height / cropArea.height;
      actualScale = Math.min(scaleX, scaleY);
    } else {
      const scaleX = canvasRect.width / bg.metadata.width;
      const scaleY = canvasRect.height / bg.metadata.height;
      actualScale = Math.min(scaleX, scaleY);
    }

    const moveX = deltaX / actualScale;
    const moveY = deltaY / actualScale;

    projectState.transformState.position.x += moveX;
    projectState.transformState.position.y += moveY;

    updatePreview();
  } else if (isResizing && resizeHandle) {
    const bg = projectState.backgroundImage;
    const canvasRect = previewCanvas.getBoundingClientRect();

    const scaleX = canvasRect.width / bg.metadata.width;
    const scaleY = canvasRect.height / bg.metadata.height;
    const actualScale = Math.min(scaleX, scaleY);

    const handleClass = resizeHandle.className;
    let scaleDelta = 0;

    if (handleClass.includes("--nw") || handleClass.includes("--sw")) {
      scaleDelta = -deltaX;
    } else if (
      handleClass.includes("--ne") ||
      handleClass.includes("--se")
    ) {
      scaleDelta = deltaX;
    }

    const sensitivity = 0.1;
    accumulatedScale += scaleDelta * sensitivity;

    const baseScale = projectState.transformState.scale;
    const targetScale = Math.max(1, Math.round(baseScale + accumulatedScale));

    if (targetScale !== projectState.transformState.scale) {
      projectState.transformState.scale = targetScale;
      const { scaleInput } = getDomRefs();
      scaleInput.value = targetScale;
      updatePreview();
      accumulatedScale = 0;
    }
  }

  dragStartX = e.clientX;
  dragStartY = e.clientY;
};

const endDrag = () => {
  isDragging = false;
  isResizing = false;
  resizeHandle = null;
  accumulatedScale = 0;
};

const setupBoundingBox = () => {
  initInteractionDomRefs();

  boundingBox.addEventListener("mousedown", startDrag);
  document.addEventListener("mousemove", handleDrag);
  document.addEventListener("mouseup", endDrag);

  boundingBox.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent("mousedown", {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    startDrag(mouseEvent);
    e.preventDefault();
  });

  document.addEventListener("touchmove", (e) => {
    if (isDragging || isResizing) {
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent("mousemove", {
        clientX: touch.clientX,
        clientY: touch.clientY,
      });
      handleDrag(mouseEvent);
      e.preventDefault();
    }
  });

  document.addEventListener("touchend", endDrag);
};

const startCropDrag = (e) => {
  if (e.target.classList.contains("crop-box__handle")) {
    isCropResizing = true;
    cropResizeHandle = e.target;
    cropOriginalBounds = {
      left: parseInt(cropBox.style.left, 10),
      top: parseInt(cropBox.style.top, 10),
      width: parseInt(cropBox.style.width, 10),
      height: parseInt(cropBox.style.height, 10),
    };
  } else {
    isCropDragging = true;
  }

  dragStartX = e.clientX;
  dragStartY = e.clientY;

  e.preventDefault();
  e.stopPropagation();
};

const handleCropDrag = (e) => {
  if (!isCropDragging && !isCropResizing) return;

  const deltaX = e.clientX - dragStartX;
  const deltaY = e.clientY - dragStartY;

  if (isCropDragging) {
    const bg = projectState.backgroundImage;
    const canvasRect = previewCanvas.getBoundingClientRect();

    const scaleX = canvasRect.width / bg.metadata.width;
    const scaleY = canvasRect.height / bg.metadata.height;
    const actualScale = Math.min(scaleX, scaleY);

    const moveX = deltaX / actualScale;
    const moveY = deltaY / actualScale;

    const cropArea = projectState.transformState.cropArea;
    if (!cropArea) return;

    const newX = Math.max(
      0,
      Math.min(bg.metadata.width - cropArea.width, cropArea.x + moveX)
    );
    const newY = Math.max(
      0,
      Math.min(bg.metadata.height - cropArea.height, cropArea.y + moveY)
    );

    projectState.transformState.cropArea.x = newX;
    projectState.transformState.cropArea.y = newY;

    updateCropBox();
  } else if (isCropResizing && cropResizeHandle) {
    const bg = projectState.backgroundImage;
    const cropArea = projectState.transformState.cropArea;
    const canvasRect = previewCanvas.getBoundingClientRect();

    if (!cropArea) return;

    const scaleX = canvasRect.width / bg.metadata.width;
    const scaleY = canvasRect.height / bg.metadata.height;
    const actualScale = Math.min(scaleX, scaleY);

    const resizeX = deltaX / actualScale;
    const resizeY = deltaY / actualScale;

    const handleClass = cropResizeHandle.className;

    if (handleClass.includes("--nw")) {
      cropArea.x = Math.max(0, cropArea.x + resizeX);
      cropArea.y = Math.max(0, cropArea.y + resizeY);
      cropArea.width = Math.max(50, cropArea.width - resizeX);
      cropArea.height = Math.max(50, cropArea.height - resizeY);
    } else if (handleClass.includes("--ne")) {
      cropArea.y = Math.max(0, cropArea.y + resizeY);
      cropArea.width = Math.max(50, cropArea.width + resizeX);
      cropArea.height = Math.max(50, cropArea.height - resizeY);
    } else if (handleClass.includes("--sw")) {
      cropArea.x = Math.max(0, cropArea.x + resizeX);
      cropArea.width = Math.max(50, cropArea.width - resizeX);
      cropArea.height = Math.max(50, cropArea.height + resizeY);
    } else if (handleClass.includes("--se")) {
      cropArea.width = Math.max(50, cropArea.width + resizeX);
      cropArea.height = Math.max(50, cropArea.height + resizeY);
    } else if (handleClass.includes("--n")) {
      cropArea.y = Math.max(0, cropArea.y + resizeY);
      cropArea.height = Math.max(50, cropArea.height - resizeY);
    } else if (handleClass.includes("--s")) {
      cropArea.height = Math.max(50, cropArea.height + resizeY);
    } else if (handleClass.includes("--w")) {
      cropArea.x = Math.max(0, cropArea.x + resizeX);
      cropArea.width = Math.max(50, cropArea.width - resizeX);
    } else if (handleClass.includes("--e")) {
      cropArea.width = Math.max(50, cropArea.width + resizeX);
    }

    updateCropBox();
  }

  dragStartX = e.clientX;
  dragStartY = e.clientY;
};

const endCropDrag = () => {
  isCropDragging = false;
  isCropResizing = false;
  cropResizeHandle = null;
  cropAccumulatedDelta = { x: 0, y: 0 };
};

const setupCropBox = () => {
  cropBox.addEventListener("mousedown", startCropDrag);
  document.addEventListener("mousemove", handleCropDrag);
  document.addEventListener("mouseup", endCropDrag);

  cropBox.addEventListener("touchstart", (e) => {
    const touch = e.touches[0];
    const mouseEvent = new MouseEvent("mousedown", {
      clientX: touch.clientX,
      clientY: touch.clientY,
    });
    startCropDrag(mouseEvent);
    e.preventDefault();
  });

  document.addEventListener("touchmove", (e) => {
    if (isCropDragging || isCropResizing) {
      const touch = e.touches[0];
      const mouseEvent = new MouseEvent("mousemove", {
        clientX: touch.clientX,
        clientY: touch.clientY,
      });
      handleCropDrag(mouseEvent);
      e.preventDefault();
    }
  });

  document.addEventListener("touchend", endCropDrag);
};

const setupCanvasClick = () => {
  previewCanvas.addEventListener("click", (e) => {
    if (isCropModeEnabled()) return;
    if (projectState.transparentImages.length === 0) return;

    const transparentImg = projectState.transparentImages[0];
    const bg = projectState.backgroundImage;
    const scale = projectState.transformState.scale;
    const pos = projectState.transformState.position;
    const cropArea = projectState.transformState.cropArea;

    const canvasRect = previewCanvas.getBoundingClientRect();
    const clickX = e.clientX - canvasRect.left;
    const clickY = e.clientY - canvasRect.top;

    const imagePos = calculateTransparentImagePosition(
      transparentImg,
      scale,
      pos,
      bg,
      cropArea
    );

    const scaleX = canvasRect.width /
      (cropArea ? cropArea.width : bg.metadata.width);
    const scaleY = canvasRect.height /
      (cropArea ? cropArea.height : bg.metadata.height);
    const actualScale = Math.min(scaleX, scaleY);

    const offsetX = cropArea
      ? (canvasRect.width - cropArea.width * actualScale) / 2
      : (canvasRect.width - bg.metadata.width * actualScale) / 2;
    const offsetY = cropArea
      ? (canvasRect.height - cropArea.height * actualScale) / 2
      : (canvasRect.height - bg.metadata.height * actualScale) / 2;

    const displayX = imagePos.x * actualScale + offsetX;
    const displayY = imagePos.y * actualScale + offsetY;
    const displayWidth = imagePos.width * actualScale;
    const displayHeight = imagePos.height * actualScale;

    if (
      clickX >= displayX &&
      clickX <= displayX + displayWidth &&
      clickY >= displayY &&
      clickY <= displayY + displayHeight
    ) {
      setBoundingBoxSelected(true);
      updateBoundingBox();
    } else {
      setBoundingBoxSelected(false);
      updateBoundingBox();
    }
  });
};

const setupWindowResize = () => {
  let resizeTimeout = null;

  const handleResize = () => {
    if (!projectState.backgroundImage) return;

    updatePreview();
    updateBoundingBox();

    if (isCropModeEnabled()) {
      updateCropBox();
    }

    if (!isCropModeEnabled()) {
      showBoundingBoxTemporarily(2000);
    }
  };

  window.addEventListener("resize", () => {
    if (resizeTimeout) {
      clearTimeout(resizeTimeout);
    }
    resizeTimeout = setTimeout(() => {
      handleResize();
    }, 150);
  });

  window.addEventListener("orientationchange", () => {
    setTimeout(handleResize, 300);
  });
};

const setupInteractionControls = () => {
  initInteractionDomRefs();
  setupBoundingBox();
  setupCropBox();
  setupCanvasClick();
  setupWindowResize();
};

export { setupInteractionControls };
