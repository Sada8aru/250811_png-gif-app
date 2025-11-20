import { projectState } from "../state/projectState";
import { getDomRefs } from "./domRefs";
import { syncPositionInputs, nudgePosition } from "./controlPanel";
import { getGlobalArrowDelta } from "./positionKeymap";
import {
  updatePreview,
  showBoundingBoxTemporarily,
  updateBoundingBox,
  updateCropBox,
  calculateTransparentImagePosition,
  isCropModeEnabled,
  setBoundingBoxSelected,
  isBoundingBoxActive,
  getAspectRatio,
} from "../render/previewRenderer";
import { getDisplayMetrics } from "../render/displayMetrics";

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

const MIN_CROP_SIZE = 50;

const clamp = (value, min, max) => {
  let result = value;
  if (typeof min === "number") {
    result = Math.max(min, result);
  }
  if (typeof max === "number") {
    result = Math.min(max, result);
  }
  return result;
};

const getHandleType = (handleClass = "") => {
  if (handleClass.includes("--nw")) return "nw";
  if (handleClass.includes("--ne")) return "ne";
  if (handleClass.includes("--sw")) return "sw";
  if (handleClass.includes("--se")) return "se";
  if (handleClass.includes("--n")) return "north";
  if (handleClass.includes("--s")) return "south";
  if (handleClass.includes("--w")) return "west";
  if (handleClass.includes("--e")) return "east";
  return null;
};

const clampSizeToLimits = (width, height, ratio, maxWidth, maxHeight) => {
  let nextWidth = Math.max(MIN_CROP_SIZE, width);
  let nextHeight = Math.max(MIN_CROP_SIZE, height);

  if (typeof maxWidth === "number" && nextWidth > maxWidth) {
    nextWidth = maxWidth;
    nextHeight = nextWidth / ratio;
  }

  if (typeof maxHeight === "number" && nextHeight > maxHeight) {
    nextHeight = maxHeight;
    nextWidth = nextHeight * ratio;

    if (typeof maxWidth === "number" && nextWidth > maxWidth) {
      nextWidth = maxWidth;
      nextHeight = nextWidth / ratio;
    }
  }

  nextWidth = Math.max(MIN_CROP_SIZE, nextWidth);
  nextHeight = Math.max(MIN_CROP_SIZE, nextHeight);

  return { width: nextWidth, height: nextHeight };
};

const getMaxDimensionsForHandle = (handleType, prevArea, imageWidth, imageHeight) => {
  const right = prevArea.x + prevArea.width;
  const bottom = prevArea.y + prevArea.height;
  const centerX = prevArea.x + prevArea.width / 2;
  const centerY = prevArea.y + prevArea.height / 2;

  switch (handleType) {
    case "nw":
      return { maxWidth: right, maxHeight: bottom };
    case "ne":
      return { maxWidth: imageWidth - prevArea.x, maxHeight: bottom };
    case "sw":
      return { maxWidth: right, maxHeight: imageHeight - prevArea.y };
    case "se":
      return { maxWidth: imageWidth - prevArea.x, maxHeight: imageHeight - prevArea.y };
    case "north":
      return {
        maxWidth: 2 * Math.min(centerX, imageWidth - centerX),
        maxHeight: bottom,
      };
    case "south":
      return {
        maxWidth: 2 * Math.min(centerX, imageWidth - centerX),
        maxHeight: imageHeight - prevArea.y,
      };
    case "west":
      return {
        maxWidth: right,
        maxHeight: 2 * Math.min(centerY, imageHeight - centerY),
      };
    case "east":
      return {
        maxWidth: imageWidth - prevArea.x,
        maxHeight: 2 * Math.min(centerY, imageHeight - centerY),
      };
    default:
      return { maxWidth: undefined, maxHeight: undefined };
  }
};

const positionCropAreaByHandle = (handleType, width, height, prevArea) => {
  const right = prevArea.x + prevArea.width;
  const bottom = prevArea.y + prevArea.height;
  const centerX = prevArea.x + prevArea.width / 2;
  const centerY = prevArea.y + prevArea.height / 2;

  switch (handleType) {
    case "nw":
      return { x: right - width, y: bottom - height };
    case "ne":
      return { x: prevArea.x, y: bottom - height };
    case "sw":
      return { x: right - width, y: prevArea.y };
    case "se":
      return { x: prevArea.x, y: prevArea.y };
    case "north":
      return { x: centerX - width / 2, y: bottom - height };
    case "south":
      return { x: centerX - width / 2, y: prevArea.y };
    case "west":
      return { x: right - width, y: centerY - height / 2 };
    case "east":
      return { x: prevArea.x, y: centerY - height / 2 };
    default:
      return { x: prevArea.x, y: prevArea.y };
  }
};

const enforceCropAspectRatio = (
  handleClass,
  prevArea,
  cropArea,
  resizeX,
  resizeY,
  imageWidth,
  imageHeight,
) => {
  const ratioKey = projectState.transformState.aspectRatio;
  if (!ratioKey || ratioKey === "free") return;

  const targetRatio = getAspectRatio(ratioKey);
  if (!targetRatio) return;

  const handleType = getHandleType(handleClass);
  if (!handleType) return;

  const isCornerHandle = ["nw", "ne", "sw", "se"].includes(handleType);
  let width = cropArea.width;
  let height = cropArea.height;

  if (isCornerHandle) {
    const preferWidth = Math.abs(resizeX) >= Math.abs(resizeY);
    if (preferWidth) {
      width = Math.max(MIN_CROP_SIZE, cropArea.width);
      height = width / targetRatio;
    } else {
      height = Math.max(MIN_CROP_SIZE, cropArea.height);
      width = height * targetRatio;
    }
  } else if (handleType === "north" || handleType === "south") {
    height = Math.max(MIN_CROP_SIZE, cropArea.height);
    width = height * targetRatio;
  } else if (handleType === "east" || handleType === "west") {
    width = Math.max(MIN_CROP_SIZE, cropArea.width);
    height = width / targetRatio;
  } else {
    return;
  }

  const { maxWidth, maxHeight } = getMaxDimensionsForHandle(
    handleType,
    prevArea,
    imageWidth,
    imageHeight,
  );

  const size = clampSizeToLimits(width, height, targetRatio, maxWidth, maxHeight);
  const position = positionCropAreaByHandle(handleType, size.width, size.height, prevArea);

  cropArea.x = clamp(position.x, 0, imageWidth - size.width);
  cropArea.y = clamp(position.y, 0, imageHeight - size.height);
  cropArea.width = size.width;
  cropArea.height = size.height;
};

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
    const metrics = getDisplayMetrics({ bgSize: bg.metadata, cropArea, canvasRect });

    const moveX = deltaX / metrics.scale;
    const moveY = deltaY / metrics.scale;

    projectState.transformState.position.x += moveX;
    projectState.transformState.position.y += moveY;

    updatePreview();
    syncPositionInputs();
  } else if (isResizing && resizeHandle) {
    const handleClass = resizeHandle.className;
    let scaleDelta = 0;

    if (handleClass.includes("--nw") || handleClass.includes("--sw")) {
      scaleDelta = -deltaX;
    } else if (handleClass.includes("--ne") || handleClass.includes("--se")) {
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
    const metrics = getDisplayMetrics({ bgSize: bg.metadata, cropArea: null, canvasRect });

    const moveX = deltaX / metrics.scale;
    const moveY = deltaY / metrics.scale;

    const cropArea = projectState.transformState.cropArea;
    if (!cropArea) return;

    const newX = Math.max(0, Math.min(bg.metadata.width - cropArea.width, cropArea.x + moveX));
    const newY = Math.max(0, Math.min(bg.metadata.height - cropArea.height, cropArea.y + moveY));

    projectState.transformState.cropArea.x = newX;
    projectState.transformState.cropArea.y = newY;

    updateCropBox();
  } else if (isCropResizing && cropResizeHandle) {
    const bg = projectState.backgroundImage;
    const cropArea = projectState.transformState.cropArea;
    const canvasRect = previewCanvas.getBoundingClientRect();

    if (!cropArea) return;

    const metrics = getDisplayMetrics({ bgSize: bg.metadata, cropArea: null, canvasRect });

    const resizeX = deltaX / metrics.scale;
    const resizeY = deltaY / metrics.scale;

    const handleClass = cropResizeHandle.className;
    const prevArea = { ...cropArea };

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

    enforceCropAspectRatio(
      handleClass,
      prevArea,
      cropArea,
      resizeX,
      resizeY,
      bg.metadata.width,
      bg.metadata.height,
    );

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

    const imagePos = calculateTransparentImagePosition(transparentImg, scale, pos, bg, cropArea);
    const metrics = getDisplayMetrics({
      bgSize: bg.metadata,
      cropArea: cropArea ?? null,
      canvasRect,
    });

    const displayX = imagePos.x * metrics.scale + metrics.offsetX;
    const displayY = imagePos.y * metrics.scale + metrics.offsetY;
    const displayWidth = imagePos.width * metrics.scale;
    const displayHeight = imagePos.height * metrics.scale;

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
  setupKeyboardPositionControls();
};

const isPositionInputActive = () => {
  const refs = getDomRefs();
  const activeElement = document.activeElement;
  return activeElement === refs.positionInputX || activeElement === refs.positionInputY;
};

const handleGlobalArrowKeyDown = (e) => {
  if (
    e.defaultPrevented ||
    isCropModeEnabled() ||
    isPositionInputActive() ||
    !isBoundingBoxActive()
  ) {
    return;
  }

  if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
    return;
  }

  if (!projectState.backgroundImage || projectState.transparentImages.length === 0) {
    return;
  }

  const delta = getGlobalArrowDelta(e.key, e.shiftKey);
  if (!delta) return;

  e.preventDefault();
  nudgePosition(delta.axis, delta.delta);
};

const setupKeyboardPositionControls = () => {
  window.addEventListener("keydown", handleGlobalArrowKeyDown);
};

export { setupInteractionControls };
