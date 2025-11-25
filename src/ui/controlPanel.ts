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
import { type ProjectImage, type CropArea } from "../types/media";

type PositionContext = {
  bg: ProjectImage;
  bounds: CropArea;
  overlaySize: { width: number; height: number };
  absoluteX: number;
  absoluteY: number;
};

let animationSpeedInput: HTMLInputElement | null;
let animationSpeedValue: HTMLElement | null;
let aspectRatioSelect: HTMLSelectElement | null;
let alignmentButtons: HTMLButtonElement[] = [];

const initControlDomRefs = (): void => {
  const refs = getDomRefs();
  animationSpeedInput = refs.animationSpeedInput;
  animationSpeedValue = refs.animationSpeedValue;
  aspectRatioSelect = refs.aspectRatioSelect;
  alignmentButtons = Array.from(refs.alignmentButtons ?? []);
};

const canAdjustPosition = (): boolean =>
  Boolean(projectState.backgroundImage && projectState.transparentImages.length > 0);

const toBounds = (cropArea: CropArea | null, bg: ProjectImage): CropArea =>
  cropArea
    ? { x: cropArea.x, y: cropArea.y, width: cropArea.width, height: cropArea.height }
    : { x: 0, y: 0, width: bg.metadata.width, height: bg.metadata.height };

const getPositionContext = (): PositionContext | null => {
  if (!canAdjustPosition() || !projectState.backgroundImage) return null;

  const bg = projectState.backgroundImage;
  const baseImage = projectState.transparentImages[0];
  if (!baseImage?.metadata) return null;

  const scale = projectState.transformState.scale;
  const overlayWidth = baseImage.metadata.width * scale;
  const overlayHeight = baseImage.metadata.height * scale;

  const cropArea = projectState.transformState.cropArea;
  const bounds = toBounds(cropArea, bg);

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

const clampToBounds = (value: number, size: number, boundsStart: number, boundsSize: number) => {
  const min = boundsStart;
  const max = boundsStart + boundsSize - size;
  if (max < min) {
    return boundsStart + (boundsSize - size) / 2;
  }
  return Math.min(Math.max(value, min), max);
};

const commitAbsolutePosition = (
  context: PositionContext,
  nextAbsoluteX: number,
  nextAbsoluteY: number,
): void => {
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

export type Axis = "x" | "y";

/**
 * オーバーレイ画像を指定軸に微移動する。
 */
export const nudgePosition = (axis: Axis, delta: number): void => {
  const context = getPositionContext();
  if (!context) return;

  const nextAbsoluteX = axis === "x" ? context.absoluteX + delta : context.absoluteX;
  const nextAbsoluteY = axis === "y" ? context.absoluteY + delta : context.absoluteY;
  commitAbsolutePosition(context, nextAbsoluteX, nextAbsoluteY);
};

/**
 * 調整パネルのコントロールを初期化する。
 */
export const setupControls = (): void => {
  initControlDomRefs();
  const speedInput = animationSpeedInput;
  const speedValue = animationSpeedValue;
  const ratioSelect = aspectRatioSelect;
  if (!speedInput || !speedValue || !ratioSelect) return;

  speedInput.addEventListener("input", (e: Event) => {
    const target = e.target as HTMLInputElement | null;
    if (!target) return;

    const speed = parseInt(target.value, 10);
    projectState.animationSettings.frameDelay = speed;
    speedValue.textContent = `${speed}ms`;
    console.log("アニメーション速度変更:", speed + "ms");

    if (projectState.transparentImages.length > 1) {
      updatePreview();
    }
  });

  ratioSelect.addEventListener("change", (e: Event) => {
    const target = e.target as HTMLSelectElement | null;
    if (!target) return;

    const ratio = target.value;
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
