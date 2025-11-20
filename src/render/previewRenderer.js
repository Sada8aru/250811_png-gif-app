import { projectState } from "../state/projectState";
import { getDomRefs } from "../ui/domRefs";
import { getDisplayMetrics, toDisplayRect } from "./displayMetrics";

let previewCanvas;
let previewPlaceholder;
let boundingBox;
let cropBox;
let modeToggleEditButton;
let modeToggleCropButton;
let cropControls;
let editModeControlGroups = [];
let exportPngButton;
let exportGifButton;

const initRendererDomRefs = () => {
  const refs = getDomRefs();
  previewCanvas = refs.previewCanvas;
  previewPlaceholder = refs.previewPlaceholder;
  boundingBox = refs.boundingBox;
  cropBox = refs.cropBox;
  modeToggleEditButton = refs.modeToggleEdit;
  modeToggleCropButton = refs.modeToggleCrop;
  cropControls = refs.cropControls;
  editModeControlGroups = Array.from(refs.editModeControls ?? []);
  exportPngButton = refs.exportPngButton;
  exportGifButton = refs.exportGifButton;
  updateModeToggleAppearance();
  setEditModeControlsVisibility(!isCropMode);
};

let animationInterval = null;
let currentFrameIndex = 0;
let isDragging = false;
let isResizing = false;
let dragStartX = 0;
let dragStartY = 0;
let resizeHandle = null;
let originalBounds = null;
let accumulatedScale = 0;
let isCropMode = false;
let isBoundingBoxSelected = false;
let boundingBoxFadeTimer = null;
const setBoundingBoxSelected = (selected) => {
  isBoundingBoxSelected = selected;
};
const isBoundingBoxActive = () => isBoundingBoxSelected;

const updateModeToggleAppearance = () => {
  if (!modeToggleEditButton || !modeToggleCropButton) return;

  if (isCropMode) {
    modeToggleCropButton.classList.add("mode-toggle__button--active");
    modeToggleCropButton.setAttribute("aria-pressed", "true");
    modeToggleEditButton.classList.remove("mode-toggle__button--active");
    modeToggleEditButton.setAttribute("aria-pressed", "false");
  } else {
    modeToggleEditButton.classList.add("mode-toggle__button--active");
    modeToggleEditButton.setAttribute("aria-pressed", "true");
    modeToggleCropButton.classList.remove("mode-toggle__button--active");
    modeToggleCropButton.setAttribute("aria-pressed", "false");
  }
};

const setEditModeControlsVisibility = (shouldShow) => {
  editModeControlGroups.forEach((group) => {
    if (!group) return;
    group.style.display = shouldShow ? "" : "none";
    group.setAttribute("aria-hidden", shouldShow ? "false" : "true");
  });
};

const calculateTransparentImagePosition = (
  transparentImg,
  scale,
  pos,
  bg,
  cropArea = null,
  options = {},
) => {
  const { useCropAreaOffset = true } = options;
  const scaledWidth = transparentImg.metadata.width * scale;
  const scaledHeight = transparentImg.metadata.height * scale;
  const baseX = pos.x + (bg.metadata.width - scaledWidth) / 2;
  const baseY = pos.y + (bg.metadata.height - scaledHeight) / 2;

  if (cropArea && useCropAreaOffset) {
    const relativeX = baseX - cropArea.x;
    const relativeY = baseY - cropArea.y;

    return {
      x: relativeX,
      y: relativeY,
      width: scaledWidth,
      height: scaledHeight,
      baseX,
      baseY,
      cropOffsetX: cropArea.x,
      cropOffsetY: cropArea.y,
    };
  }

  return {
    x: baseX,
    y: baseY,
    width: scaledWidth,
    height: scaledHeight,
  };
};

const renderCropModePreview = () => {
  if (!projectState.backgroundImage) return;

  const bg = projectState.backgroundImage;
  const ctx = previewCanvas.getContext("2d", { willReadFrequently: true });

  ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  ctx.drawImage(bg.image, 0, 0);

  if (projectState.transparentImages.length > 0) {
    const transparentImg = projectState.transparentImages[0];
    const scale = projectState.transformState.scale;
    const pos = projectState.transformState.position;

    const scaledWidth = transparentImg.metadata.width * scale;
    const scaledHeight = transparentImg.metadata.height * scale;
    const absoluteX = pos.x + (bg.metadata.width - scaledWidth) / 2;
    const absoluteY = pos.y + (bg.metadata.height - scaledHeight) / 2;

    console.log("トリミングモード描画:", {
      posX: pos.x,
      posY: pos.y,
      bgWidth: bg.metadata.width,
      bgHeight: bg.metadata.height,
      scaledWidth,
      scaledHeight,
      absoluteX,
      absoluteY,
      cropArea: projectState.transformState.cropArea,
    });

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(transparentImg.image, absoluteX, absoluteY, scaledWidth, scaledHeight);
  }
};

const updateExportButtons = () => {
  const hasBackground = !!projectState.backgroundImage;
  const hasTransparent = projectState.transparentImages.length > 0;

  exportPngButton.disabled = !hasBackground;
  exportGifButton.disabled = !(hasBackground && projectState.transparentImages.length > 1);
};

const updatePreview = () => {
  if (!projectState.backgroundImage) {
    previewCanvas.style.display = "none";
    previewPlaceholder.style.display = "flex";
    exportPngButton.disabled = true;
    exportGifButton.disabled = true;
    return;
  }

  const bg = projectState.backgroundImage;
  const ctx = previewCanvas.getContext("2d", { willReadFrequently: true });
  const cropArea = projectState.transformState.cropArea;

  if (isCropMode) {
    previewCanvas.width = bg.metadata.width;
    previewCanvas.height = bg.metadata.height;
    renderCropModePreview();
    return;
  }

  if (cropArea) {
    previewCanvas.width = cropArea.width;
    previewCanvas.height = cropArea.height;
  } else {
    previewCanvas.width = bg.metadata.width;
    previewCanvas.height = bg.metadata.height;
  }

  if (animationInterval) {
    clearInterval(animationInterval);
    animationInterval = null;
  }

  if (projectState.transparentImages.length > 1) {
    currentFrameIndex = 0;

    const renderFrame = () => {
      ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

      if (isCropMode) {
        ctx.drawImage(bg.image, 0, 0);
      } else if (cropArea) {
        ctx.drawImage(
          bg.image,
          cropArea.x,
          cropArea.y,
          cropArea.width,
          cropArea.height,
          0,
          0,
          previewCanvas.width,
          previewCanvas.height,
        );
      } else {
        ctx.drawImage(bg.image, 0, 0);
      }

      const currentFrame = projectState.transparentImages[currentFrameIndex];
      if (currentFrame) {
        const scale = projectState.transformState.scale;
        const pos = projectState.transformState.position;
        const imagePos = calculateTransparentImagePosition(currentFrame, scale, pos, bg, cropArea, {
          useCropAreaOffset: !isCropMode,
        });

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(currentFrame.image, imagePos.x, imagePos.y, imagePos.width, imagePos.height);
      }

      currentFrameIndex = (currentFrameIndex + 1) % projectState.transparentImages.length;
    };

    renderFrame();

    animationInterval = setInterval(renderFrame, projectState.animationSettings.frameDelay);
  } else if (projectState.transparentImages.length === 1) {
    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    if (cropArea) {
      ctx.drawImage(
        bg.image,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        previewCanvas.width,
        previewCanvas.height,
      );
    } else {
      ctx.drawImage(bg.image, 0, 0);
    }

    const transparentImg = projectState.transparentImages[0];
    const scale = projectState.transformState.scale;
    const pos = projectState.transformState.position;
    const imagePos = calculateTransparentImagePosition(transparentImg, scale, pos, bg, cropArea, {
      useCropAreaOffset: !isCropMode,
    });

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(transparentImg.image, imagePos.x, imagePos.y, imagePos.width, imagePos.height);
  } else {
    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    if (cropArea) {
      ctx.drawImage(
        bg.image,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        previewCanvas.width,
        previewCanvas.height,
      );
    } else {
      ctx.drawImage(bg.image, 0, 0);
    }
  }

  previewCanvas.style.display = "block";
  previewPlaceholder.style.display = "none";

  updateExportButtons();

  if (isCropMode) {
    setTimeout(() => updateCropBox(), 100);
  } else if (projectState.transparentImages.length > 0) {
    setTimeout(() => updateBoundingBox(), 100);
  }
};

const showBoundingBoxTemporarily = (duration = 1000) => {
  if (boundingBoxFadeTimer) {
    clearTimeout(boundingBoxFadeTimer);
    boundingBoxFadeTimer = null;
  }

  isBoundingBoxSelected = true;
  updateBoundingBox();

  boundingBoxFadeTimer = setTimeout(() => {
    isBoundingBoxSelected = false;
    updateBoundingBox();
    boundingBoxFadeTimer = null;
  }, duration);
};

const alignmentMatrix = {
  "top-left": { horizontal: "start", vertical: "start" },
  "top-center": { horizontal: "center", vertical: "start" },
  "top-right": { horizontal: "end", vertical: "start" },
  "middle-left": { horizontal: "start", vertical: "center" },
  "middle-center": { horizontal: "center", vertical: "center" },
  "middle-right": { horizontal: "end", vertical: "center" },
  "bottom-left": { horizontal: "start", vertical: "end" },
  "bottom-center": { horizontal: "center", vertical: "end" },
  "bottom-right": { horizontal: "end", vertical: "end" },
};

const clampWithinBounds = (value, size, boundsStart, boundsSize) => {
  const min = boundsStart;
  const max = boundsStart + boundsSize - size;

  if (max < min) {
    return boundsStart + (boundsSize - size) / 2;
  }

  return Math.min(Math.max(value, min), max);
};

const resolveAlignmentPosition = (alignment, boundsStart, boundsSize, overlaySize) => {
  switch (alignment) {
    case "start":
      return boundsStart;
    case "end":
      return boundsStart + boundsSize - overlaySize;
    case "center":
    default:
      return boundsStart + (boundsSize - overlaySize) / 2;
  }
};

const alignTransparentLayer = (alignmentKey) => {
  if (!alignmentMatrix[alignmentKey]) return;
  if (!projectState.backgroundImage || projectState.transparentImages.length === 0) return;

  const bg = projectState.backgroundImage;
  const transparentImg = projectState.transparentImages[0];
  const scale = projectState.transformState.scale;
  const cropArea = projectState.transformState.cropArea;

  const scaledWidth = transparentImg.metadata.width * scale;
  const scaledHeight = transparentImg.metadata.height * scale;

  const bounds = cropArea
    ? { x: cropArea.x, y: cropArea.y, width: cropArea.width, height: cropArea.height }
    : { x: 0, y: 0, width: bg.metadata.width, height: bg.metadata.height };

  const targetDefinition = alignmentMatrix[alignmentKey];

  const desiredX = resolveAlignmentPosition(
    targetDefinition.horizontal,
    bounds.x,
    bounds.width,
    scaledWidth,
  );
  const desiredY = resolveAlignmentPosition(
    targetDefinition.vertical,
    bounds.y,
    bounds.height,
    scaledHeight,
  );

  const alignedX = clampWithinBounds(desiredX, scaledWidth, bounds.x, bounds.width);
  const alignedY = clampWithinBounds(desiredY, scaledHeight, bounds.y, bounds.height);

  projectState.transformState.position.x = alignedX - (bg.metadata.width - scaledWidth) / 2;
  projectState.transformState.position.y = alignedY - (bg.metadata.height - scaledHeight) / 2;

  setBoundingBoxSelected(true);
  updatePreview();
  showBoundingBoxTemporarily(1200);
};

const updateBoundingBox = () => {
  if (
    !projectState.backgroundImage ||
    projectState.transparentImages.length === 0 ||
    isCropMode ||
    !isBoundingBoxSelected
  ) {
    boundingBox.style.display = "none";
    return;
  }

  const bg = projectState.backgroundImage;
  const transparentImg = projectState.transparentImages[0];
  const scale = projectState.transformState.scale;
  const pos = projectState.transformState.position;
  const cropArea = projectState.transformState.cropArea;

  const canvasRect = previewCanvas.getBoundingClientRect();
  const metrics = getDisplayMetrics({ bgSize: bg.metadata, cropArea, canvasRect });

  const imagePos = calculateTransparentImagePosition(transparentImg, scale, pos, bg, cropArea);
  const displayRect = toDisplayRect(
    {
      x: imagePos.x,
      y: imagePos.y,
      width: imagePos.width,
      height: imagePos.height,
    },
    metrics,
  );

  boundingBox.style.display = "block";
  boundingBox.style.left = displayRect.x + "px";
  boundingBox.style.top = displayRect.y + "px";
  boundingBox.style.width = displayRect.width + "px";
  boundingBox.style.height = displayRect.height + "px";
};

const getAspectRatio = (ratio) => {
  switch (ratio) {
    case "1:1":
      return 1;
    case "16:9":
      return 16 / 9;
    case "9:16":
      return 9 / 16;
    case "4:3":
      return 4 / 3;
    case "3:4":
      return 3 / 4;
    case "free":
      return null;
    case "original":
    default:
      return projectState.backgroundImage
        ? projectState.backgroundImage.metadata.width / projectState.backgroundImage.metadata.height
        : 1;
  }
};

const updateCropBox = () => {
  if (!projectState.backgroundImage || !isCropMode) {
    cropBox.style.display = "none";
    return;
  }

  const bg = projectState.backgroundImage;
  const canvasRect = previewCanvas.getBoundingClientRect();
  const metrics = getDisplayMetrics({ bgSize: bg.metadata, cropArea: null, canvasRect });

  let cropArea = projectState.transformState.cropArea;

  if (!cropArea) {
    if (
      projectState.transformState.aspectRatio === "original" ||
      projectState.transformState.aspectRatio === "free"
    ) {
      cropArea = {
        x: 0,
        y: 0,
        width: bg.metadata.width,
        height: bg.metadata.height,
      };
    } else {
      const targetRatio = getAspectRatio(projectState.transformState.aspectRatio);
      const bgRatio = bg.metadata.width / bg.metadata.height;

      let cropWidth;
      let cropHeight;
      if (targetRatio > bgRatio) {
        cropWidth = bg.metadata.width;
        cropHeight = cropWidth / targetRatio;
      } else {
        cropHeight = bg.metadata.height;
        cropWidth = cropHeight * targetRatio;
      }

      cropArea = {
        x: (bg.metadata.width - cropWidth) / 2,
        y: (bg.metadata.height - cropHeight) / 2,
        width: cropWidth,
        height: cropHeight,
      };
    }

    projectState.transformState.cropArea = cropArea;
  }

  const displayRect = toDisplayRect(cropArea, metrics);

  cropBox.style.display = "block";
  cropBox.style.left = displayRect.x + "px";
  cropBox.style.top = displayRect.y + "px";
  cropBox.style.width = displayRect.width + "px";
  cropBox.style.height = displayRect.height + "px";
};

/**
 * 操作モードを切り替える。
 * @param {boolean} shouldEnableCrop トリミングモードを有効にする場合はtrue
 */
const setCropMode = (shouldEnableCrop) => {
  const nextState = Boolean(shouldEnableCrop);

  if (isCropMode === nextState) {
    updateModeToggleAppearance();
    return;
  }

  isCropMode = nextState;

  if (isCropMode) {
    cropControls.style.display = "block";
    setEditModeControlsVisibility(false);

    boundingBox.style.display = "none";
    isBoundingBoxSelected = false;

    const bg = projectState.backgroundImage;
    if (bg) {
      previewCanvas.width = bg.metadata.width;
      previewCanvas.height = bg.metadata.height;
      renderCropModePreview();
    }

    updateCropBox();
  } else {
    cropControls.style.display = "none";
    setEditModeControlsVisibility(true);

    cropBox.style.display = "none";
    isBoundingBoxSelected = false;

    updateBoundingBox();
    updatePreview();
  }

  updateModeToggleAppearance();
};

/**
 * トグル操作用のヘルパー。
 */
const toggleCropMode = () => {
  setCropMode(!isCropMode);
};

const isCropModeEnabled = () => isCropMode;

export {
  initRendererDomRefs,
  calculateTransparentImagePosition,
  renderCropModePreview,
  updatePreview,
  updateExportButtons,
  showBoundingBoxTemporarily,
  alignTransparentLayer,
  updateBoundingBox,
  updateCropBox,
  getAspectRatio,
  setCropMode,
  toggleCropMode,
  isCropModeEnabled,
  setBoundingBoxSelected,
  isBoundingBoxActive,
};
