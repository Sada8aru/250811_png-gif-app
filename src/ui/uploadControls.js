import { projectState } from "../state/projectState";
import { getDomRefs } from "./domRefs";
import { showError } from "./notifications";
import {
  validateImageFile,
  isGifFile,
  loadImage,
  createImageData,
  extractGifFrames,
} from "../services/imageService";
import {
  updatePreview,
  updateExportButtons,
  setCropMode,
  isCropModeEnabled,
  updateBoundingBox,
  setBoundingBoxSelected,
} from "../render/previewRenderer";

let backgroundDropzone;
let transparentDropzone;
let backgroundButton;
let transparentButton;
let backgroundInput;
let transparentInput;
let scaleInput;
let aspectRatioSelect;
let animationSpeedInput;
let animationSpeedValue;
const DEFAULT_FRAME_DELAY = 500;
const getCurrentAnimationType = () => {
  if (projectState.transparentImages.length === 0) return null;
  const hasGifFrame = projectState.transparentImages.some((img) => img.frameInfo?.isFromGif);
  if (hasGifFrame) return "gif";
  if (projectState.transparentImages.length > 1) return "sequence";
  return null;
};

const detectIncomingAnimationType = (files) => {
  if (files.some((file) => isGifFile(file))) return "gif";
  if (files.length > 1) return "sequence";
  return null;
};

const updateDropzoneStatus = (dropzone, { icon, text, subtext }) => {
  const iconEl = dropzone.querySelector(".upload-area__icon");
  if (iconEl && icon) {
    iconEl.textContent = icon;
  }

  const textEl = dropzone.querySelector(".upload-area__text");
  if (textEl) {
    textEl.textContent = text;
  }

  const subtextEl = dropzone.querySelector(".upload-area__subtext");
  if (subtextEl) {
    subtextEl.textContent = subtext;
  }
};

const initUploadDomRefs = () => {
  const refs = getDomRefs();
  backgroundDropzone = refs.backgroundDropzone;
  transparentDropzone = refs.transparentDropzone;
  backgroundButton = refs.backgroundButton;
  transparentButton = refs.transparentButton;
  backgroundInput = refs.backgroundInput;
  transparentInput = refs.transparentInput;
  scaleInput = refs.scaleInput;
  aspectRatioSelect = refs.aspectRatioSelect;
  animationSpeedInput = refs.animationSpeedInput;
  animationSpeedValue = refs.animationSpeedValue;
};

const setupDragAndDrop = () => {
  const setupDropzone = (dropzone, handler) => {
    dropzone.addEventListener("dragover", (e) => {
      e.preventDefault();
      dropzone.classList.add("upload-area__dropzone--dragover");
    });
    dropzone.addEventListener("dragleave", () => {
      dropzone.classList.remove("upload-area__dropzone--dragover");
    });
    dropzone.addEventListener("drop", (e) => {
      e.preventDefault();
      dropzone.classList.remove("upload-area__dropzone--dragover");
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) handler(files);
    });
  };

  setupDropzone(backgroundDropzone, (files) => handleBackgroundImageUpload(files[0]));
  setupDropzone(transparentDropzone, handleTransparentImageUpload);
};

const setupFileInputs = () => {
  backgroundButton.addEventListener("click", () => {
    backgroundInput.click();
  });

  transparentButton.addEventListener("click", () => {
    transparentInput.click();
  });

  backgroundInput.addEventListener("change", (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleBackgroundImageUpload(files[0]);
    }
    e.target.value = "";
  });

  transparentInput.addEventListener("change", (e) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleTransparentImageUpload(files);
    }
    e.target.value = "";
  });
};

const handleBackgroundImageUpload = async (file) => {
  if (!validateImageFile(file, { onInvalid: showError })) return;

  try {
    console.log("背景画像読み込み開始:", file.name);
    const image = await loadImage(file);
    const imageData = createImageData(file, image);

    projectState.backgroundImage = imageData;
    projectState.transformState.cropArea = null;
    projectState.transformState.aspectRatio = "original";
    aspectRatioSelect.value = "original";

    if (isCropModeEnabled()) {
      setCropMode(false);
    }

    updateDropzoneStatus(backgroundDropzone, {
      icon: "✅",
      text: `背景画像: ${file.name}`,
      subtext: `${image.width} × ${image.height}px`,
    });

    updatePreview();

    console.log("背景画像読み込み完了");
  } catch (error) {
    console.error("背景画像読み込みエラー:", error);
    showError("背景画像の読み込みに失敗しました: " + error.message);
  }
};

const handleTransparentImageUpload = async (files) => {
  const validFiles = Array.from(files).filter((file) =>
    validateImageFile(file, { onInvalid: showError }),
  );
  if (validFiles.length === 0) return;

  try {
    console.log(
      "透過画像読み込み開始:",
      validFiles.map((f) => f.name),
    );

    const hadTransparentImages = projectState.transparentImages.length > 0;
    const previousAnimationType = getCurrentAnimationType();
    const incomingAnimationType = detectIncomingAnimationType(validFiles);

    projectState.transparentImages = [];

    if (!hadTransparentImages) {
      projectState.transformState.position = { x: 0, y: 0 };
    }

    const shouldKeepScale =
      hadTransparentImages &&
      previousAnimationType === "sequence" &&
      incomingAnimationType === "sequence";

    if (!shouldKeepScale) {
      projectState.transformState.scale = 1;
      scaleInput.value = 1;
    } else {
      scaleInput.value = projectState.transformState.scale;
    }

    for (const file of validFiles) {
      if (isGifFile(file)) {
        console.log("GIFファイルを処理中:", file.name);
        try {
          const frames = await extractGifFrames(file, { fullFrame: true });
          const originalDelays = frames.map((frame) => frame.delay);
          const avgDelay =
            originalDelays.reduce((sum, delay) => sum + delay, 0) / originalDelays.length;
          const minDelay = Math.min(...originalDelays);
          const maxDelay = Math.max(...originalDelays);

          if (avgDelay > 0) {
            const roundedAvgDelay = Math.round(avgDelay);
            const currentMin = parseInt(animationSpeedInput.min, 10);
            const currentMax = parseInt(animationSpeedInput.max, 10);
            const newMin = Math.min(currentMin, Math.max(10, Math.round(minDelay)));
            const newMax = Math.max(currentMax, Math.round(maxDelay));

            animationSpeedInput.min = newMin;
            animationSpeedInput.max = newMax;
            animationSpeedInput.step = roundedAvgDelay < 100 ? 10 : 50;

            projectState.animationSettings.frameDelay = roundedAvgDelay;
            animationSpeedInput.value = roundedAvgDelay;
            animationSpeedValue.textContent = `${roundedAvgDelay}ms`;

            console.log(
              `GIFの元フレーム間隔を適用: ${roundedAvgDelay}ms (範囲: ${newMin}-${newMax}ms)`,
            );
            console.log(`フレーム間隔の詳細:`, originalDelays);
          } else {
            animationSpeedInput.min = 50;
            animationSpeedInput.max = 2000;
            animationSpeedInput.step = 50;
            projectState.animationSettings.frameDelay = DEFAULT_FRAME_DELAY;
            animationSpeedInput.value = DEFAULT_FRAME_DELAY;
            animationSpeedValue.textContent = `${DEFAULT_FRAME_DELAY}ms`;
            console.log("GIFのディレイ情報が欠落していたため、デフォルト500msを適用");
          }

          for (let i = 0; i < frames.length; i++) {
            const frame = frames[i];
            const frameFile = new File([file], `${file.name}_frame_${i + 1}`, {
              type: "image/png",
            });
            const imageData = createImageData(frameFile, frame.image);

            imageData.frameInfo = {
              delay: frame.delay,
              disposal: frame.disposal,
              isFromGif: true,
              originalIndex: i,
            };

            projectState.transparentImages.push(imageData);
          }
          console.log(`GIFから ${frames.length} フレームを抽出しました`);
        } catch (error) {
          console.error("GIF処理エラー:", error);
          showError(`GIFファイル ${file.name} の処理に失敗しました: ${error.message}`);
          const image = await loadImage(file);
          const imageData = createImageData(file, image);
          projectState.transparentImages.push(imageData);
        }
      } else {
        const image = await loadImage(file);
        const imageData = createImageData(file, image);
        projectState.transparentImages.push(imageData);
      }
    }

    const hasGifFrames = projectState.transparentImages.some((img) => img.frameInfo?.isFromGif);
    if (incomingAnimationType === "sequence" && !hasGifFrames) {
      animationSpeedInput.min = 50;
      animationSpeedInput.max = 2000;
      animationSpeedInput.step = 50;

      const shouldKeepSequenceSpeed =
        previousAnimationType === "sequence" && incomingAnimationType === "sequence";

      if (shouldKeepSequenceSpeed) {
        const currentDelay = projectState.animationSettings.frameDelay;
        animationSpeedInput.value = currentDelay;
        animationSpeedValue.textContent = `${currentDelay}ms`;
        console.log("連番PNGどうしの差し替え: 再生速度を維持");
      } else {
        projectState.animationSettings.frameDelay = DEFAULT_FRAME_DELAY;
        animationSpeedInput.value = DEFAULT_FRAME_DELAY;
        animationSpeedValue.textContent = `${DEFAULT_FRAME_DELAY}ms`;
        console.log("連番PNGアニメーションをデフォルト500msに設定");
      }
    }

    const totalFrames = projectState.transparentImages.length;
    const hasGif = validFiles.some((f) => isGifFile(f));

    let description = "";
    if (hasGif) {
      description = `GIF含む ${validFiles.length}ファイル → ${totalFrames}フレーム`;
    } else {
      description = validFiles.map((f) => f.name).join(", ");
    }

    updateDropzoneStatus(transparentDropzone, {
      icon: "✨",
      text: `透過画像: ${description}`,
      subtext: `総フレーム数: ${totalFrames}`,
    });

    updatePreview();
    updateExportButtons();

    if (!isCropModeEnabled() && projectState.transparentImages.length > 0) {
      setBoundingBoxSelected(true);
      updateBoundingBox();
    }

    console.log("透過画像読み込み完了");
  } catch (error) {
    console.error("透過画像読み込みエラー:", error);
    showError("透過画像の読み込みに失敗しました: " + error.message);
  }
};

const setupUploadControls = () => {
  initUploadDomRefs();
  setupDragAndDrop();
  setupFileInputs();
};

export { setupUploadControls, handleBackgroundImageUpload, handleTransparentImageUpload };
