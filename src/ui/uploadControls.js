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
  toggleCropMode,
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
      toggleCropMode();
    }

    backgroundDropzone.innerHTML = `
      <div class="upload-area__icon">✅</div>
      <p class="upload-area__text">背景画像: ${file.name}</p>
      <p class="upload-area__subtext">${image.width} × ${image.height}px</p>
      <small class="upload-area__hint">「ファイルを選択」から変更できます</small>
    `;

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

    projectState.transparentImages = [];
    projectState.transformState.position = { x: 0, y: 0 };
    projectState.transformState.scale = 1;
    scaleInput.value = 1;

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
            const currentMin = parseInt(animationSpeedInput.min);
            const currentMax = parseInt(animationSpeedInput.max);
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
    if (!hasGifFrames && validFiles.length > 1) {
      animationSpeedInput.min = 50;
      animationSpeedInput.max = 2000;
      animationSpeedInput.step = 50;
      animationSpeedInput.value = 500;
      animationSpeedValue.textContent = "500ms";
      projectState.animationSettings.frameDelay = 500;
      console.log("静止画アニメーション用にデフォルト設定を適用");
    }

    const totalFrames = projectState.transparentImages.length;
    const hasGif = validFiles.some((f) => isGifFile(f));

    let description = "";
    if (hasGif) {
      description = `GIF含む ${validFiles.length}ファイル → ${totalFrames}フレーム`;
    } else {
      description = validFiles.map((f) => f.name).join(", ");
    }

    transparentDropzone.innerHTML = `
      <div class="upload-area__icon">✨</div>
      <p class="upload-area__text">透過画像: ${description}</p>
      <p class="upload-area__subtext">総フレーム数: ${totalFrames}</p>
      <small class="upload-area__hint">「ファイルを選択」から変更できます</small>
    `;

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
