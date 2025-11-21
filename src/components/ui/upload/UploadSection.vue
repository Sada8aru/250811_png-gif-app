<template>
  <section class="upload-section">
    <div class="upload-area">
      <div class="upload-area__background">
        <div
          class="upload-area__dropzone"
          :class="{ 'upload-area__dropzone--dragover': isBackgroundDragover }"
          @dragover.prevent="handleBackgroundDragOver"
          @dragleave.prevent="handleBackgroundDragLeave"
          @drop.prevent="handleBackgroundDrop"
        >
          <span class="upload-area__icon">{{ backgroundStatus.icon }}</span>
          <p class="upload-area__text">{{ backgroundStatus.text }}</p>
          <p class="upload-area__subtext">{{ backgroundStatus.subtext }}</p>
          <button class="upload-area__button" type="button" @click="openBackgroundPicker">
            <span class="upload-area__buttonStyle"> ファイルを選択 </span>
          </button>
          <input
            ref="backgroundInputRef"
            type="file"
            accept="image/*"
            style="display: none"
            @change="handleBackgroundInputChange"
          />
        </div>
      </div>

      <div class="upload-area__transparent">
        <div
          class="upload-area__dropzone"
          :class="{ 'upload-area__dropzone--dragover': isTransparentDragover }"
          @dragover.prevent="handleTransparentDragOver"
          @dragleave.prevent="handleTransparentDragLeave"
          @drop.prevent="handleTransparentDrop"
        >
          <span class="upload-area__icon">{{ transparentStatus.icon }}</span>
          <p class="upload-area__text">{{ transparentStatus.text }}</p>
          <p class="upload-area__subtext">{{ transparentStatus.subtext }}</p>
          <button class="upload-area__button" type="button" @click="openTransparentPicker">
            <span class="upload-area__buttonStyle"> ファイルを選択 </span>
          </button>
          <input
            ref="transparentInputRef"
            type="file"
            accept="image/*"
            multiple
            style="display: none"
            @change="handleTransparentInputChange"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { projectState } from "../../../state/projectState";
import { showError } from "../../../ui/notifications";
import {
  validateImageFile,
  isGifFile,
  loadImage,
  createImageData,
  extractGifFrames,
} from "../../../services/imageService";
import {
  updatePreview,
  updateExportButtons,
  updateBoundingBox,
  setBoundingBoxSelected,
} from "../../../render/previewRenderer";
import { setCropMode, isCropModeEnabled } from "../../../state/modeState";
import { getDomRefs } from "../../../ui/domRefs";
import { emitTransformUiSync } from "../../../state/transformUiState";

defineOptions({ name: "UploadSection" });

type DropzoneStatus = {
  icon: string;
  text: string;
  subtext: string;
};

const DEFAULT_FRAME_DELAY = 200;

const backgroundStatus = ref<DropzoneStatus>({
  icon: "🖼️",
  text: "背景画像をドラッグ&ドロップ",
  subtext: "または",
});
const transparentStatus = ref<DropzoneStatus>({
  icon: "✨",
  text: "透過画像をドラッグ&ドロップ",
  subtext: "複数PNG/JPG選択 または GIF1ファイル",
});

const backgroundInputRef = ref<HTMLInputElement | null>(null);
const transparentInputRef = ref<HTMLInputElement | null>(null);
const isBackgroundDragover = ref(false);
const isTransparentDragover = ref(false);

const getCurrentAnimationType = () => {
  if (projectState.transparentImages.length === 0) return null;
  const hasGifFrame = projectState.transparentImages.some((img) => img.frameInfo?.isFromGif);
  if (hasGifFrame) return "gif";
  if (projectState.transparentImages.length > 1) return "sequence";
  return null;
};

const detectIncomingAnimationType = (files: File[]) => {
  if (files.some((file) => isGifFile(file))) return "gif";
  if (files.length > 1) return "sequence";
  return null;
};

const updateDropzoneStatus = (
  target: "background" | "transparent",
  status: Partial<DropzoneStatus>,
) => {
  if (target === "background") {
    backgroundStatus.value = { ...backgroundStatus.value, ...status };
  } else {
    transparentStatus.value = { ...transparentStatus.value, ...status };
  }
};

const openBackgroundPicker = () => {
  backgroundInputRef.value?.click();
};

const openTransparentPicker = () => {
  transparentInputRef.value?.click();
};

const handleBackgroundDragOver = () => {
  isBackgroundDragover.value = true;
};

const handleBackgroundDragLeave = () => {
  isBackgroundDragover.value = false;
};

const handleTransparentDragOver = () => {
  isTransparentDragover.value = true;
};

const handleTransparentDragLeave = () => {
  isTransparentDragover.value = false;
};

const resetInput = (inputEl: HTMLInputElement | null) => {
  if (inputEl) inputEl.value = "";
};

const handleBackgroundDrop = (e: DragEvent) => {
  isBackgroundDragover.value = false;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    void handleBackgroundImageUpload(files[0]);
  }
};

const handleTransparentDrop = (e: DragEvent) => {
  isTransparentDragover.value = false;
  const files = e.dataTransfer?.files;
  if (files && files.length > 0) {
    void handleTransparentImageUpload(Array.from(files));
  }
};

const handleBackgroundInputChange = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const files = input.files;
  if (files && files.length > 0) {
    void handleBackgroundImageUpload(files[0]);
  }
  resetInput(input);
};

const handleTransparentInputChange = (e: Event) => {
  const input = e.target as HTMLInputElement;
  const files = input.files;
  if (files && files.length > 0) {
    void handleTransparentImageUpload(Array.from(files));
  }
  resetInput(input);
};

const handleBackgroundImageUpload = async (file: File) => {
  if (!validateImageFile(file, { onInvalid: showError })) return;

  try {
    console.log("背景画像読み込み開始:", file.name);
    const image = await loadImage(file);
    const imageData = createImageData(file, image);

    projectState.backgroundImage = imageData;
    projectState.transformState.cropArea = null;
    projectState.transformState.aspectRatio = "original";

    const { aspectRatioSelect } = getDomRefs();
    if (aspectRatioSelect) {
      aspectRatioSelect.value = "original";
    }

    if (isCropModeEnabled()) {
      setCropMode(false);
    }

    updateDropzoneStatus("background", {
      icon: "✅",
      text: `背景画像: ${file.name}`,
      subtext: `${image.width} × ${image.height}px`,
    });

    updatePreview();
    emitTransformUiSync();
    updateExportButtons();

    console.log("背景画像読み込み完了");
  } catch (error) {
    console.error("背景画像読み込みエラー:", error);
    showError("背景画像の読み込みに失敗しました: " + (error as Error).message);
  }
};

const handleTransparentImageUpload = async (files: File[]) => {
  const validFiles = files.filter((file) => validateImageFile(file, { onInvalid: showError }));
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

    const { animationSpeedInput, animationSpeedValue } = getDomRefs();

    if (!shouldKeepScale) {
      projectState.transformState.scale = 1;
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
            const currentMin = animationSpeedInput ? parseInt(animationSpeedInput.min, 10) : 10;
            const currentMax = animationSpeedInput ? parseInt(animationSpeedInput.max, 10) : 1000;
            const newMin = Math.min(currentMin, Math.max(10, Math.round(minDelay)));
            const newMax = Math.max(currentMax, Math.round(maxDelay));

            if (animationSpeedInput) {
              animationSpeedInput.min = String(newMin);
              animationSpeedInput.max = String(newMax);
              animationSpeedInput.step = roundedAvgDelay < 100 ? "10" : "50";
              animationSpeedInput.value = String(roundedAvgDelay);
            }

            projectState.animationSettings.frameDelay = roundedAvgDelay;
            if (animationSpeedValue) {
              animationSpeedValue.textContent = `${roundedAvgDelay}ms`;
            }

            console.log(
              `GIFの元フレーム間隔を適用: ${roundedAvgDelay}ms (範囲: ${newMin}-${newMax}ms)`,
            );
            console.log(`フレーム間隔の詳細:`, originalDelays);
          } else {
            if (animationSpeedInput) {
              animationSpeedInput.min = "50";
              animationSpeedInput.max = "2000";
              animationSpeedInput.step = "50";
              animationSpeedInput.value = String(DEFAULT_FRAME_DELAY);
            }
            projectState.animationSettings.frameDelay = DEFAULT_FRAME_DELAY;
            if (animationSpeedValue) {
              animationSpeedValue.textContent = `${DEFAULT_FRAME_DELAY}ms`;
            }
            console.log(
              `GIFのディレイ情報が欠落していたため、デフォルト${DEFAULT_FRAME_DELAY}msを適用`,
            );
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
          showError(`GIFファイル ${file.name} の処理に失敗しました: ${(error as Error).message}`);
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
      if (animationSpeedInput) {
        animationSpeedInput.min = "10";
        animationSpeedInput.max = "1000";
        animationSpeedInput.step = "10";
      }

      const shouldKeepSequenceSpeed =
        previousAnimationType === "sequence" && incomingAnimationType === "sequence";

      if (shouldKeepSequenceSpeed) {
        const currentDelay = projectState.animationSettings.frameDelay;
        if (animationSpeedInput) animationSpeedInput.value = String(currentDelay);
        if (animationSpeedValue) animationSpeedValue.textContent = `${currentDelay}ms`;
        console.log("連番PNGどうしの差し替え: 再生速度を維持");
      } else {
        projectState.animationSettings.frameDelay = DEFAULT_FRAME_DELAY;
        if (animationSpeedInput) animationSpeedInput.value = String(DEFAULT_FRAME_DELAY);
        if (animationSpeedValue) animationSpeedValue.textContent = `${DEFAULT_FRAME_DELAY}ms`;
        console.log("連番PNGアニメーションをデフォルト200msに設定");
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

    updateDropzoneStatus("transparent", {
      icon: "✨",
      text: `透過画像: ${description}`,
      subtext: `総フレーム数: ${totalFrames}`,
    });

    updatePreview();
    emitTransformUiSync();
    updateExportButtons();

    if (!isCropModeEnabled() && projectState.transparentImages.length > 0) {
      setBoundingBoxSelected(true);
      updateBoundingBox();
    }

    console.log("透過画像読み込み完了");
  } catch (error) {
    console.error("透過画像読み込みエラー:", error);
    showError("透過画像の読み込みに失敗しました: " + (error as Error).message);
  }
};
</script>

<style scoped>
.upload-section {
  display: flex;
  grid-area: upload;
  flex-direction: column;
  gap: 20px;
  @media (width <= 1000px) {
    gap: 16px;
  }
}

.upload-area {
  display: grid;
  grid-template-rows: auto auto;
  gap: 16px;
  @media (width <= 1000px) {
    grid-template-rows: auto;
    grid-template-columns: 1fr 1fr;
  }
}

.upload-area__dropzone {
  display: flex;
  position: relative;
  flex-direction: column;
  justify-content: space-between;
  transition: all 0.3s ease;
  cursor: pointer;
  border: 2px dashed #d1d1da;
  border-radius: 10px;
  background-color: #fafafe;
  padding: 20px;
  max-width: 200px;
  text-align: center;
  @media (width <= 1000px) {
    padding: 14px;
    max-width: unset;
    height: 100%;
    min-height: 200px;
  }

  &:hover {
    border-color: #1da1f2;
    background-color: #f0f8ff;
  }
}

.upload-area__dropzone--dragover {
  transform: scale(1.02);
  border-color: #1da1f2;
  background-color: #e6f3ff;
}

.upload-area__button {
  cursor: pointer;

  &::after {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    content: "";
  }
}

.upload-area__icon {
  font-size: 2rem;
}

.upload-area__text {
  display: -webkit-box;
  margin-bottom: 8px;
  max-height: 150px;
  overflow: hidden;
  color: #333;
  font-weight: 600;
  font-size: 1.1rem;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-height: 1.3;

  @media (width <= 1000px) {
    max-height: 80px;
    font-size: 1rem;
  }
}

.upload-area__subtext {
  margin-bottom: 15px;
  color: #666;
  font-size: 0.9rem;
  line-height: 1.2;
  @media (width <= 1000px) {
    font-size: 0.8rem;
  }
}

.upload-area__buttonStyle {
  display: block;
  border-radius: 6px;
  background-color: #1da1f2;
  padding: 8px 24px;
  color: white;
  font-weight: 600;
  font-size: 1rem;
  white-space: nowrap;
}
</style>
