import { projectState } from "../state/projectState";
import { getDomRefs } from "./domRefs";
import {
  updatePreview,
  showBoundingBoxTemporarily,
  updateCropBox,
  alignTransparentLayer,
} from "../render/previewRenderer";
import { isCropModeEnabled } from "../state/modeState";
import { emitTransformUiSync } from "../state/transformUiState";

let animationSpeedInput;
let animationSpeedValue;
let aspectRatioSelect;
let alignmentButtons = [];

const initControlDomRefs = () => {
  const refs = getDomRefs();
  animationSpeedInput = refs.animationSpeedInput;
  animationSpeedValue = refs.animationSpeedValue;
  aspectRatioSelect = refs.aspectRatioSelect;
  alignmentButtons = Array.from(refs.alignmentButtons ?? []);
};

const canAdjustPosition = () =>
  Boolean(projectState.backgroundImage && projectState.transparentImages.length > 0);

const getPositionContext = () => {
  if (!canAdjustPosition()) return null;

  const bg = projectState.backgroundImage;
  const baseImage = projectState.transparentImages[0];
  if (!baseImage?.metadata) return null;

  const scale = projectState.transformState.scale;
  const overlayWidth = baseImage.metadata.width * scale;
  const overlayHeight = baseImage.metadata.height * scale;

  const cropArea = projectState.transformState.cropArea;
  const bounds = cropArea
    ? { x: cropArea.x, y: cropArea.y, width: cropArea.width, height: cropArea.height }
    : { x: 0, y: 0, width: bg.metadata.width, height: bg.metadata.height };

  const absoluteX = projectState.transformState.position.x + (bg.metadata.width - overlayWidth) / 2;
  const absoluteY =
    projectState.transformState.position.y + (bg.metadata.height - overlayHeight) / 2;

  return {
    bg,
    bounds,
    overlaySize: { width: overlayWidth, height: overlayHeight },
    absoluteX,
    absoluteY,
  };
};

const clampToBounds = (value, size, boundsStart, boundsSize) => {
  const min = boundsStart;
  const max = boundsStart + boundsSize - size;
  if (max < min) {
    return boundsStart + (boundsSize - size) / 2;
  }
  return Math.min(Math.max(value, min), max);
};

const commitAbsolutePosition = (context, nextAbsoluteX, nextAbsoluteY) => {
  const clampedX = clampToBounds(
    nextAbsoluteX,
    context.overlaySize.width,
    context.bounds.x,
    context.bounds.width,
  );
  const clampedY = clampToBounds(
    nextAbsoluteY,
    context.overlaySize.height,
    context.bounds.y,
    context.bounds.height,
  );

  projectState.transformState.position.x =
    clampedX - (context.bg.metadata.width - context.overlaySize.width) / 2;
  projectState.transformState.position.y =
    clampedY - (context.bg.metadata.height - context.overlaySize.height) / 2;

  updatePreview();
  showBoundingBoxTemporarily(1000);
  emitTransformUiSync();
};

const nudgePosition = (axis, delta) => {
  const context = getPositionContext();
  if (!context) return;

  const nextAbsoluteX = axis === "x" ? context.absoluteX + delta : context.absoluteX;
  const nextAbsoluteY = axis === "y" ? context.absoluteY + delta : context.absoluteY;
  commitAbsolutePosition(context, nextAbsoluteX, nextAbsoluteY);
};

/**
 * 調整パネルのコントロールを初期化する。
 */
const setupControls = () => {
  initControlDomRefs();

  animationSpeedInput.addEventListener("input", (e) => {
    const speed = parseInt(e.target.value, 10);
    projectState.animationSettings.frameDelay = speed;
    animationSpeedValue.textContent = `${speed}ms`;
    console.log("アニメーション速度変更:", speed + "ms");

    if (projectState.transparentImages.length > 1) {
      updatePreview();
    }
  });

  aspectRatioSelect.addEventListener("change", (e) => {
    const ratio = e.target.value;
    projectState.transformState.aspectRatio = ratio;
    console.log("アスペクト比変更:", ratio);

    if (isCropModeEnabled()) {
      projectState.transformState.cropArea = null;
      updateCropBox();
    } else {
      updatePreview();
    }
  });

  alignmentButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const alignmentKey = button.getAttribute("data-align-target");
      if (!alignmentKey) return;
      console.log("整列ボタン押下:", alignmentKey);
      alignTransparentLayer(alignmentKey);
      emitTransformUiSync();
    });
  });
};

export { setupControls, nudgePosition };
