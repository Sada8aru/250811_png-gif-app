<template>
  <section class="control-section">
    <div class="control-panel">
      <div class="control-group">
        <h3 class="control-group__title">操作モード</h3>
        <div class="control-item control-item__mode-toggle">
          <div class="mode-toggle" role="group" aria-label="操作モード">
            <button
              id="modeToggleEdit"
              :class="editButtonClass"
              type="button"
              :aria-pressed="editAriaPressed"
              data-mode="edit"
              @click="handleModeClick('edit')"
            >
              ✏️ 編集
            </button>
            <button
              id="modeToggleCrop"
              :class="cropButtonClass"
              type="button"
              :aria-pressed="cropAriaPressed"
              data-mode="crop"
              @click="handleModeClick('crop')"
            >
              背景トリミング
            </button>
          </div>
        </div>
      </div>

      <div
        class="control-group"
        id="cropControls"
        v-show="isCropMode"
        :aria-hidden="isCropMode ? 'false' : 'true'"
      >
        <h3 class="control-group__title">アスペクト比</h3>
        <div class="control-item">
          <select id="aspectRatioSelect" class="control-item__select">
            <option value="original">元の比率</option>
            <option value="free">自由形式</option>
            <option value="1:1">1:1 (正方形)</option>
            <option value="16:9">16:9 (横長)</option>
            <option value="9:16">16:9 (縦長)</option>
            <option value="4:3">4:3 (標準)</option>
            <option value="3:4">3:4 (縦長)</option>
          </select>
        </div>
      </div>

      <div
        class="control-group"
        data-mode-panel="edit"
        v-show="!isCropMode"
        :aria-hidden="isCropMode ? 'true' : 'false'"
      >
        <h3 class="control-group__title">画像</h3>
        <div class="control-item">
          <label for="scaleInput" class="control-group__subTitle">サイズ</label>
          <span class="control-item__inputBox">
            <input
              type="number"
              id="scaleInput"
              class="control-item__input"
              min="1"
              v-model.number="scaleValue"
              :disabled="!canAdjustPosition"
              :aria-valuemin="1"
              @input="() => handleScaleInput(scaleValue)"
              step="1"
            />
            <span class="control-item__unit">倍</span>
          </span>
        </div>
      </div>

      <div
        class="control-group"
        data-mode-panel="edit"
        v-show="!isCropMode"
        :aria-hidden="isCropMode ? 'true' : 'false'"
      >
        <div class="control-group_row">
          <div class="control-group_rowBlock">
            <h4 class="control-group__subTitle">整列</h4>
            <div class="control-item control-item__align-grid">
              <AlignmentGrid />
            </div>
          </div>
          <div class="control-group_rowBlock">
            <div class="control-item control-item__position-grid">
              <div class="position-field">
                <label for="positionInputX" class="control-group__subTitle">X座標</label>
                <div class="position-field__controls">
                  <span class="control-item__inputBox">
                    <input
                      type="number"
                      id="positionInputX"
                      class="control-item__input"
                      data-axis="x"
                      step="1"
                      inputmode="numeric"
                      autocomplete="off"
                      :value="positionXInput"
                      :disabled="!canAdjustPosition"
                      :aria-valuemin="positionAria?.minX ?? undefined"
                      :aria-valuemax="positionAria?.maxX ?? undefined"
                      @input="
                        (e) => commitAbsolutePosition('x', (e.target as HTMLInputElement).value)
                      "
                      @change="
                        (e) => commitAbsolutePosition('x', (e.target as HTMLInputElement).value)
                      "
                      @keydown="(e) => handlePositionKeyDown('x', e as KeyboardEvent)"
                      @focus="handlePositionFocus(true)"
                      @blur="handlePositionFocus(false)"
                    />
                    <span class="control-item__unit position-field__unit">px</span>
                  </span>
                </div>
              </div>
              <div class="position-field">
                <label for="positionInputY" class="control-group__subTitle">Y座標</label>
                <div class="position-field__controls">
                  <span class="control-item__inputBox">
                    <input
                      type="number"
                      id="positionInputY"
                      class="control-item__input"
                      data-axis="y"
                      step="1"
                      inputmode="numeric"
                      autocomplete="off"
                      :value="positionYInput"
                      :disabled="!canAdjustPosition"
                      :aria-valuemin="positionAria?.minY ?? undefined"
                      :aria-valuemax="positionAria?.maxY ?? undefined"
                      @input="
                        (e) => commitAbsolutePosition('y', (e.target as HTMLInputElement).value)
                      "
                      @change="
                        (e) => commitAbsolutePosition('y', (e.target as HTMLInputElement).value)
                      "
                      @keydown="(e) => handlePositionKeyDown('y', e as KeyboardEvent)"
                      @focus="handlePositionFocus(true)"
                      @blur="handlePositionFocus(false)"
                    />
                    <span class="control-item__unit position-field__unit">px</span>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        class="control-group"
        data-mode-panel="edit"
        v-show="!isCropMode"
        :aria-hidden="isCropMode ? 'true' : 'false'"
      >
        <h3 class="control-group__title">アニメーション設定</h3>
        <div class="control-item">
          <label for="animationSpeedInput" class="control-group__subTitle">再生速度</label>
          <input
            type="range"
            id="animationSpeedInput"
            class="control-item__slider"
            min="10"
            max="1000"
            value="200"
            step="10"
          />
          <span class="control-item__unit" id="animationSpeedValue">200ms</span>
        </div>
        <div class="control-item">
          <small class="control-item__description">
            値が小さいほど高速再生（←高速 --- 低速→）<br />
            ※GIF読み込み時は元の速度に合わせて範囲が自動調整されます
          </small>
        </div>
      </div>

      <div class="control-group">
        <h3 class="control-group__title">エクスポート</h3>
        <div class="control-item">
          <button
            id="exportPngButton"
            class="control-item__button control-item__button--primary"
            disabled
          >
            PNG形式
          </button>
          <button
            id="exportGifButton"
            class="control-item__button control-item__button--secondary"
            disabled
          >
            GIF形式
          </button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from "vue";
import AlignmentGrid from "./AlignmentGrid.vue";
import { subscribeModeChange, isCropModeEnabled, setCropMode } from "../../../state/modeState";
import { projectState } from "../../../state/projectState";
import { ArrowKey, getInputKeyDelta } from "../../../ui/positionKeymap";
import { showError } from "../../../ui/notifications";
import { nudgePosition } from "../../../ui/controlPanel";
import { showBoundingBoxTemporarily, updatePreview } from "../../../render/previewRenderer";
import {
  emitTransformUiSync,
  subscribeTransformUiSync,
  setPositionInputFocused,
} from "../../../state/transformUiState";
import { Axis } from "../../../ui/controlPanel";

defineOptions({ name: "ControlPanel" });

const isCropMode = ref<boolean>(isCropModeEnabled());
const scaleValue = ref<number>(projectState.transformState.scale ?? 1);
const positionXInput = ref<string | number>("");
const positionYInput = ref<string | number>("");

type ModeKey = "edit" | "crop";

let unsubscribeModeChange: (() => void) | null = null;
let unsubscribeTransformUi: (() => void) | null = null;

onMounted(() => {
  isCropMode.value = isCropModeEnabled();
  unsubscribeModeChange = subscribeModeChange((nextMode) => {
    isCropMode.value = nextMode;
  });
  refreshTransformInputs();
  unsubscribeTransformUi = subscribeTransformUiSync(() => {
    refreshTransformInputs();
  });
});

onBeforeUnmount(() => {
  unsubscribeModeChange?.();
  unsubscribeTransformUi?.();
});

const handleModeClick = (mode: ModeKey) => {
  setCropMode(mode === "crop");
};

const editButtonClass = computed(() => ({
  "mode-toggle__button": true,
  "mode-toggle__button--active": !isCropMode.value,
}));

const cropButtonClass = computed(() => ({
  "mode-toggle__button": true,
  "mode-toggle__button--active": isCropMode.value,
}));

const editAriaPressed = computed(() => (!isCropMode.value ? "true" : "false"));
const cropAriaPressed = computed(() => (isCropMode.value ? "true" : "false"));

const canAdjustPosition = ref<boolean>(false);
const positionAria = ref<{ minX: number; minY: number; maxX: number; maxY: number } | null>(null);

const getPositionContext = () => {
  const bg = projectState.backgroundImage;
  const baseImage = projectState.transparentImages[0];
  if (!bg || !baseImage?.metadata) return null;

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

const clampToBounds = (value: number, size: number, boundsStart: number, boundsSize: number) => {
  const min = boundsStart;
  const max = boundsStart + boundsSize - size;
  if (max < min) {
    return boundsStart + (boundsSize - size) / 2;
  }
  return Math.min(Math.max(value, min), max);
};

const refreshTransformInputs = () => {
  scaleValue.value = projectState.transformState.scale ?? 1;
  const context = getPositionContext();
  canAdjustPosition.value = Boolean(context);

  if (!context) {
    positionAria.value = null;
    positionXInput.value = "";
    positionYInput.value = "";
    return;
  }

  const maxX = context.bounds.x + context.bounds.width - context.overlaySize.width;
  const maxY = context.bounds.y + context.bounds.height - context.overlaySize.height;
  positionAria.value = {
    minX: Math.round(context.bounds.x),
    minY: Math.round(context.bounds.y),
    maxX: Math.round(maxX),
    maxY: Math.round(maxY),
  };
  positionXInput.value = Math.round(context.absoluteX);
  positionYInput.value = Math.round(context.absoluteY);
};

const handleScaleInput = (value: number) => {
  if (Number.isNaN(value) || value < 1) return;
  projectState.transformState.scale = Math.round(value);
  scaleValue.value = projectState.transformState.scale;
  updatePreview();
  checkScaleWarning();
  emitTransformUiSync();

  if (!isCropMode.value && projectState.transparentImages.length > 0) {
    showBoundingBoxTemporarily(1000);
  }
};

const commitAbsolutePosition = (axis: Axis, rawValue: string | number) => {
  const parsedValue = Number.parseInt(String(rawValue), 10);
  if (Number.isNaN(parsedValue)) {
    refreshTransformInputs();
    return;
  }

  const context = getPositionContext();
  if (!context) {
    refreshTransformInputs();
    return;
  }

  const nextAbsoluteX = axis === "x" ? parsedValue : context.absoluteX;
  const nextAbsoluteY = axis === "y" ? parsedValue : context.absoluteY;

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

  refreshTransformInputs();
  emitTransformUiSync();
  updatePreview();
  showBoundingBoxTemporarily(1000);
};

const handlePositionKeyDown = (axis: Axis, e: KeyboardEvent) => {
  if (!["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
    return;
  }
  const arrowKey = e.key as ArrowKey;
  const delta = getInputKeyDelta(arrowKey, e.shiftKey);
  if (delta === null) return;
  e.preventDefault();
  nudgePosition(axis, delta);
};

const checkScaleWarning = () => {
  if (!projectState.backgroundImage || projectState.transparentImages.length === 0) {
    return;
  }

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

const handlePositionFocus = (focused: boolean) => {
  setPositionInputFocused(focused);
};
</script>

<style scoped>
.control-section {
  display: flex;
  grid-area: control;
  flex-direction: column;
  border: 2px solid #d1d1da;
  border-radius: 10px;
  background-color: #fafafe;
  height: 100%;
  overflow-y: auto;
}

.control-panel {
  border-radius: 10px;
  padding: 16px;
}

.control-group {
  margin-bottom: 16px;
  &:last-child {
    margin-bottom: 0;
  }
}

.control-group__title {
  margin-bottom: 12px;
  border-bottom: 1px solid #e0e0e0;
  color: #333;
  font-weight: 600;
  font-size: 1.1rem;
}

.control-group__subTitle {
  color: #47505b;
  font-weight: 600;
  font-size: 0.85rem;
}

.control-item {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.control-item:last-child {
  margin-bottom: 0;
}

.control-item__inputBox {
  border: 1px solid #ccc;
  border-radius: 6px;
  padding-right: 8px;
  min-width: 60px;
  max-width: 120px;
  input {
    background-color: #fbfbff;
  }
}

.control-item__input,
.control-item__select {
  border: 1px solid #ccc;
  border-radius: 6px;
  padding: 8px 12px;
  min-width: 50px;
  font-size: 1rem;
  text-align: center;
}

.control-item__input[type="number"] {
  border-color: transparent;
  padding: 8px 0px 8px 12px;
  max-width: 80px;
}

.control-item__slider {
  flex: 1;
  outline: none;
  border-radius: 3px;
  background-color: #d1d1da;
  height: 6px;
}

.control-item__slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  cursor: pointer;
  box-shadow: 0 2px 4px rgb(0 0 0 / 0.2);
  border: 2px solid white;
  border-radius: 50%;
  background: #1da1f2;
  width: 20px;
  height: 20px;
}

.control-item__slider::-moz-range-thumb {
  cursor: pointer;
  box-shadow: 0 2px 4px rgb(0 0 0 / 0.2);
  border: 2px solid white;
  border-radius: 50%;
  background: #1da1f2;
  width: 20px;
  height: 20px;
}

.control-item__description {
  margin-top: 6px;
  color: #666;
  font-size: 0.8rem;
  line-height: 1.3;
}

.control-item__input:focus,
.control-item__select:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgb(29 161 242 / 0.2);
  border-color: #1da1f2;
}

.control-item__unit {
  min-width: 30px;
  color: #666;
  font-size: 0.9rem;
}

.control-group_row {
  display: flex;
  gap: 24px;
}

.control-item__align-grid {
  flex-direction: column;
  align-items: stretch;
}

.control-item__position-grid {
  flex-direction: column;
  gap: 4px;
}

.position-field {
  display: flex;
  flex-direction: column;
}

.position-field__controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.position-field__unit {
  color: #666;
  font-size: 0.9rem;
}

.control-item__button {
  transition: all 0.3s ease;
  cursor: pointer;
  border: none;
  border-radius: 6px;
  padding: 12px 20px;
  width: 100%;
  font-weight: 600;
  font-size: 1rem;
}

.control-item__button--primary {
  background-color: #1da1f2;
  color: white;
}

.control-item__button--primary:hover:not(:disabled) {
  background-color: #1991db;
}

.control-item__button--secondary {
  background-color: #17bf63;
  color: white;
}

.control-item__button--secondary:hover:not(:disabled) {
  background-color: #14a85a;
}

.control-item__mode-toggle {
  width: 100%;
}

.mode-toggle {
  display: flex;
  border: 1px solid #dce2e8;
  border-radius: 6px;
  background-color: #fbfbff;
  width: 100%;
}

.mode-toggle__button {
  flex: 1;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  border-radius: 6px;
  background-color: transparent;
  padding: 10px 12px;
  color: #47505b;
  font-weight: 600;
  font-size: 0.95rem;
}

.mode-toggle__button:focus-visible {
  outline: 2px solid rgb(29 161 242 / 0.2);
  outline-offset: 2px;
}

.mode-toggle__button:hover {
  background-color: #e5e5ef;
}

.mode-toggle__button--active:hover {
  cursor: auto;
  background-color: #1991db;
}

.mode-toggle__button--active {
  background-color: #1991db;
  color: #fff;
}

.control-item__button:disabled {
  cursor: not-allowed;
  background-color: #ccc;
  color: #999;
}
</style>
