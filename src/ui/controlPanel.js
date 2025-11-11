import { projectState } from "../state/projectState";
import { getDomRefs } from "./domRefs";
import { showError } from "./notifications";
import {
  updatePreview,
  showBoundingBoxTemporarily,
  updateCropBox,
  isCropModeEnabled,
  setCropMode,
} from "../render/previewRenderer";

let scaleInput;
let modeToggleEdit;
let modeToggleCrop;
let animationSpeedInput;
let animationSpeedValue;
let aspectRatioSelect;

const initControlDomRefs = () => {
  const refs = getDomRefs();
  scaleInput = refs.scaleInput;
  modeToggleEdit = refs.modeToggleEdit;
  modeToggleCrop = refs.modeToggleCrop;
  animationSpeedInput = refs.animationSpeedInput;
  animationSpeedValue = refs.animationSpeedValue;
  aspectRatioSelect = refs.aspectRatioSelect;
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

const setupControls = () => {
  initControlDomRefs();

  scaleInput.addEventListener("input", (e) => {
    const scale = parseInt(e.target.value, 10);
    projectState.transformState.scale = scale;
    console.log("拡大倍率変更:", scale);
    updatePreview();
    checkScaleWarning();

    if (!isCropModeEnabled() && projectState.transparentImages.length > 0) {
      showBoundingBoxTemporarily(1000);
    }
  });

  modeToggleEdit.addEventListener("click", () => {
    setCropMode(false);
  });

  modeToggleCrop.addEventListener("click", () => {
    setCropMode(true);
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
};

export { setupControls };
