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
              value="1"
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

defineOptions({ name: "ControlPanel" });

const isCropMode = ref<boolean>(isCropModeEnabled());

type ModeKey = "edit" | "crop";

let unsubscribeModeChange: (() => void) | null = null;

onMounted(() => {
  isCropMode.value = isCropModeEnabled();
  unsubscribeModeChange = subscribeModeChange((nextMode) => {
    isCropMode.value = nextMode;
  });
});

onBeforeUnmount(() => {
  unsubscribeModeChange?.();
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
