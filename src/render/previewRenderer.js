import { projectState } from "../state/projectState";
import { getDomRefs } from "../ui/domRefs";

let previewCanvas;
let previewPlaceholder;
let boundingBox;
let cropBox;
let cropModeToggle;
let cropControls;
let exportPngButton;
let exportGifButton;

const initRendererDomRefs = () => {
  const refs = getDomRefs();
  previewCanvas = refs.previewCanvas;
  previewPlaceholder = refs.previewPlaceholder;
  boundingBox = refs.boundingBox;
  cropBox = refs.cropBox;
  cropModeToggle = refs.cropModeToggle;
  cropControls = refs.cropControls;
  exportPngButton = refs.exportPngButton;
  exportGifButton = refs.exportGifButton;
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

  const imagePos = calculateTransparentImagePosition(transparentImg, scale, pos, bg, cropArea);

  const scaleFactor = (() => {
    if (cropArea) {
      const scaleX = canvasRect.width / cropArea.width;
      const scaleY = canvasRect.height / cropArea.height;
      return Math.min(scaleX, scaleY);
    }
    const scaleX = canvasRect.width / bg.metadata.width;
    const scaleY = canvasRect.height / bg.metadata.height;
    return Math.min(scaleX, scaleY);
  })();

  const canvasOffsetX = cropArea
    ? (canvasRect.width - cropArea.width * scaleFactor) / 2
    : (canvasRect.width - bg.metadata.width * scaleFactor) / 2;
  const canvasOffsetY = cropArea
    ? (canvasRect.height - cropArea.height * scaleFactor) / 2
    : (canvasRect.height - bg.metadata.height * scaleFactor) / 2;

  const displayX = imagePos.x * scaleFactor + canvasOffsetX;
  const displayY = imagePos.y * scaleFactor + canvasOffsetY;
  const displayWidth = imagePos.width * scaleFactor;
  const displayHeight = imagePos.height * scaleFactor;

  boundingBox.style.display = "block";
  boundingBox.style.left = displayX + "px";
  boundingBox.style.top = displayY + "px";
  boundingBox.style.width = displayWidth + "px";
  boundingBox.style.height = displayHeight + "px";
};

const getAspectRatio = (ratio) => {
  switch (ratio) {
    case "1:1":
      return 1;
    case "16:9":
      return 16 / 9;
    case "4:3":
      return 4 / 3;
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

  const scaleX = canvasRect.width / bg.metadata.width;
  const scaleY = canvasRect.height / bg.metadata.height;
  const actualScale = Math.min(scaleX, scaleY);

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

  const displayX = cropArea.x * actualScale;
  const displayY = cropArea.y * actualScale;
  const displayWidth = cropArea.width * actualScale;
  const displayHeight = cropArea.height * actualScale;

  const canvasOffsetX = (canvasRect.width - bg.metadata.width * actualScale) / 2;
  const canvasOffsetY = (canvasRect.height - bg.metadata.height * actualScale) / 2;

  cropBox.style.display = "block";
  cropBox.style.left = displayX + canvasOffsetX + "px";
  cropBox.style.top = displayY + canvasOffsetY + "px";
  cropBox.style.width = displayWidth + "px";
  cropBox.style.height = displayHeight + "px";
};

const toggleCropMode = () => {
  isCropMode = !isCropMode;

  if (isCropMode) {
    cropModeToggle.textContent = "✏️ 編集モード";
    cropModeToggle.classList.add("active");
    cropControls.style.display = "block";

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
    cropModeToggle.textContent = "📐 トリミングモード";
    cropModeToggle.classList.remove("active");
    cropControls.style.display = "none";

    cropBox.style.display = "none";
    isBoundingBoxSelected = false;

    updateBoundingBox();
    updatePreview();
  }
};

const isCropModeEnabled = () => isCropMode;

export {
  initRendererDomRefs,
  calculateTransparentImagePosition,
  renderCropModePreview,
  updatePreview,
  updateExportButtons,
  showBoundingBoxTemporarily,
  updateBoundingBox,
  updateCropBox,
  toggleCropMode,
  isCropModeEnabled,
  setBoundingBoxSelected,
  isBoundingBoxActive,
};
