import { projectState } from "../state/projectState";
import { getDomRefs } from "./domRefs";
import { showError } from "./notifications";
import { getInputKeyDelta } from "./positionKeymap";
import {
  updatePreview,
  showBoundingBoxTemporarily,
  updateCropBox,
  alignTransparentLayer,
} from "../render/previewRenderer";
import { isCropModeEnabled } from "../state/modeState";

let scaleInput;
let animationSpeedInput;
let animationSpeedValue;
let aspectRatioSelect;
let alignmentButtons = [];
let positionInputX;
let positionInputY;

const initControlDomRefs = () => {
  const refs = getDomRefs();
  scaleInput = refs.scaleInput;
  animationSpeedInput = refs.animationSpeedInput;
  animationSpeedValue = refs.animationSpeedValue;
  aspectRatioSelect = refs.aspectRatioSelect;
  alignmentButtons = Array.from(refs.alignmentButtons ?? []);
  positionInputX = refs.positionInputX;
  positionInputY = refs.positionInputY;
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

const setPositionControlsDisabled = (shouldDisable) => {
  [positionInputX, positionInputY].forEach((elem) => {
    if (elem) {
      elem.disabled = shouldDisable;
    }
  });
};

/**
 * 数値入力UIを現在の transform state と同期する。
 */
const syncPositionInputs = () => {
  if (!positionInputX || !positionInputY) return;

  const context = getPositionContext();
  if (!context) {
    setPositionControlsDisabled(true);
    positionInputX.value = "";
    positionInputY.value = "";
    return;
  }

  setPositionControlsDisabled(false);

  positionInputX.value = Math.round(context.absoluteX);
  positionInputY.value = Math.round(context.absoluteY);

  positionInputX.setAttribute("aria-valuemin", `${Math.round(context.bounds.x)}`);
  positionInputY.setAttribute("aria-valuemin", `${Math.round(context.bounds.y)}`);

  const maxX = context.bounds.x + context.bounds.width - context.overlaySize.width;
  const maxY = context.bounds.y + context.bounds.height - context.overlaySize.height;
  positionInputX.setAttribute("aria-valuemax", `${Math.round(maxX)}`);
  positionInputY.setAttribute("aria-valuemax", `${Math.round(maxY)}`);
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
  syncPositionInputs();
};

const nudgePosition = (axis, delta) => {
  const context = getPositionContext();
  if (!context) return;

  const nextAbsoluteX = axis === "x" ? context.absoluteX + delta : context.absoluteX;
  const nextAbsoluteY = axis === "y" ? context.absoluteY + delta : context.absoluteY;
  commitAbsolutePosition(context, nextAbsoluteX, nextAbsoluteY);
};

const updatePositionFromInput = (axis, rawValue) => {
  const parsedValue = Number.parseInt(rawValue, 10);
  if (Number.isNaN(parsedValue)) return;

  const context = getPositionContext();
  if (!context) return;

  const nextAbsoluteX = axis === "x" ? parsedValue : context.absoluteX;
  const nextAbsoluteY = axis === "y" ? parsedValue : context.absoluteY;
  commitAbsolutePosition(context, nextAbsoluteX, nextAbsoluteY);
};

const handlePositionFieldInput = (e) => {
  const axis = e.target.dataset.axis;
  if (!axis) return;
  updatePositionFromInput(axis, e.target.value);
};

const handlePositionFieldBlur = (e) => {
  const axis = e.target.dataset.axis;
  if (!axis) return;
  if (Number.isNaN(Number.parseInt(e.target.value, 10))) {
    syncPositionInputs();
  }
};

const handlePositionFieldKeyDown = (e) => {
  const axis = e.target.dataset.axis;
  if (!axis) return;

  const delta = getInputKeyDelta(e.key, e.shiftKey);
  if (delta === null) return;

  e.preventDefault();
  nudgePosition(axis, delta);
};

const attachPositionControls = () => {
  if (!positionInputX || !positionInputY) return;

  [positionInputX, positionInputY].forEach((input) => {
    input.addEventListener("input", handlePositionFieldInput);
    input.addEventListener("change", handlePositionFieldInput);
    input.addEventListener("blur", handlePositionFieldBlur);
    input.addEventListener("keydown", handlePositionFieldKeyDown);
  });
};

const checkScaleWarning = () => {
  if (!projectState.backgroundImage || projectState.transparentImages.length === 0) {
    return;
  }

  const bg = projectState.backgroundImage;
  const transparentImg = projectState.transparentImages[0];
  const scale = projectState.transformState.scale;

  const scaledWidth = transparentImg.metadata.width * scale;
  const scaledHeight = transparentImg.metadata.height * scale;

  if (
    scaledWidth > projectState.outputSettings.maxWidth ||
    scaledHeight > projectState.outputSettings.maxHeight
  ) {
    showError(
      `拡大後のサイズ（${scaledWidth}×${scaledHeight}px）が出力サイズ制限（${projectState.outputSettings.maxWidth}×${projectState.outputSettings.maxHeight}px）を超えています。`,
    );
  }
};

/**
 * 調整パネルのコントロールを初期化する。
 */
const setupControls = () => {
  initControlDomRefs();

  scaleInput.addEventListener("input", (e) => {
    const scale = parseInt(e.target.value, 10);
    projectState.transformState.scale = scale;
    console.log("拡大倍率変更:", scale);
    updatePreview();
    checkScaleWarning();
    syncPositionInputs();

    if (!isCropModeEnabled() && projectState.transparentImages.length > 0) {
      showBoundingBoxTemporarily(1000);
    }
  });

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
      syncPositionInputs();
    });
  });

  attachPositionControls();
  syncPositionInputs();
};

export { setupControls, syncPositionInputs, nudgePosition };
