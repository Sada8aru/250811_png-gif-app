<template>
  <section class="tab-panel" role="tabpanel">
    <!-- ファイルアップロードエリア -->
    <section class="upload-section">
      <div class="upload-area">
        <div class="upload-area__background">
          <div class="upload-area__dropzone" id="backgroundDropzone">
            <span class="upload-area__icon">🖼️</span>
            <p class="upload-area__text">背景画像をドラッグ&ドロップ</p>
            <p class="upload-area__subtext">または</p>
            <button class="upload-area__button" type="button" id="backgroundButton">
              <span class="upload-area__buttonStyle"> ファイルを選択 </span>
            </button>
            <input type="file" id="backgroundInput" accept="image/*" style="display: none" />
          </div>
        </div>

        <div class="upload-area__transparent">
          <div class="upload-area__dropzone" id="transparentDropzone">
            <span class="upload-area__icon">✨</span>
            <p class="upload-area__text">透過画像をドラッグ&ドロップ</p>
            <p class="upload-area__subtext">複数PNG/JPG選択 または GIF1ファイル</p>
            <button class="upload-area__button" type="button" id="transparentButton">
              <span class="upload-area__buttonStyle"> ファイルを選択 </span>
            </button>
            <input
              type="file"
              id="transparentInput"
              accept="image/*"
              multiple
              style="display: none"
            />
          </div>
        </div>
      </div>
    </section>

    <!-- プレビューエリア -->
    <section class="preview-section">
      <div class="preview-container" id="previewContainer">
        <canvas id="previewCanvas" class="preview-canvas"></canvas>
        <div class="preview-placeholder" id="previewPlaceholder">
          <p>画像をアップロードするとプレビューが表示されます</p>
        </div>

        <!-- バウンディングボックス -->
        <div
          id="boundingBox"
          class="bounding-box"
          style="display: none"
          data-template="bounding-box"
        ></div>

        <!-- トリミング枠 -->
        <div id="cropBox" class="crop-box" style="display: none" data-template="crop-box"></div>
      </div>
    </section>

    <!-- コントロールパネル -->
    <section class="control-section">
      <div class="control-panel">
        <div class="control-group">
          <h3 class="control-group__title">操作モード</h3>
          <div class="control-item control-item__mode-toggle">
            <div class="mode-toggle" role="group" aria-label="操作モード">
              <button
                id="modeToggleEdit"
                class="mode-toggle__button mode-toggle__button--active"
                type="button"
                aria-pressed="true"
                data-mode="edit"
              >
                ✏️ 編集
              </button>
              <button
                id="modeToggleCrop"
                class="mode-toggle__button"
                type="button"
                aria-pressed="false"
                data-mode="crop"
              >
                背景トリミング
              </button>
            </div>
          </div>
        </div>

        <div class="control-group" id="cropControls" style="display: none">
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

        <div class="control-group" data-mode-panel="edit">
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

        <div class="control-group" data-mode-panel="edit">
          <div class="control-group_row">
            <div class="control-group_rowBlock">
              <h4 class="control-group__subTitle">整列</h4>
              <div class="control-item control-item__align-grid">
                <div class="alignment-grid" role="group" aria-label="透過レイヤー整列">
                  <button
                    type="button"
                    class="alignment-grid__button"
                    data-align-target="top-left"
                    aria-label="左上に整列"
                  >
                    ↖︎
                  </button>
                  <button
                    type="button"
                    class="alignment-grid__button"
                    data-align-target="top-center"
                    aria-label="上中央に整列"
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    class="alignment-grid__button"
                    data-align-target="top-right"
                    aria-label="右上に整列"
                  >
                    ↗︎
                  </button>
                  <button
                    type="button"
                    class="alignment-grid__button"
                    data-align-target="middle-left"
                    aria-label="左中央に整列"
                  >
                    ←
                  </button>
                  <button
                    type="button"
                    class="alignment-grid__button"
                    data-align-target="middle-center"
                    aria-label="中央に整列"
                  >
                    十
                  </button>
                  <button
                    type="button"
                    class="alignment-grid__button"
                    data-align-target="middle-right"
                    aria-label="右中央に整列"
                  >
                    →
                  </button>
                  <button
                    type="button"
                    class="alignment-grid__button"
                    data-align-target="bottom-left"
                    aria-label="左下に整列"
                  >
                    ↙︎
                  </button>
                  <button
                    type="button"
                    class="alignment-grid__button"
                    data-align-target="bottom-center"
                    aria-label="下中央に整列"
                  >
                    ↓
                  </button>
                  <button
                    type="button"
                    class="alignment-grid__button"
                    data-align-target="bottom-right"
                    aria-label="右下に整列"
                  >
                    ↘︎
                  </button>
                </div>
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

        <div class="control-group" data-mode-panel="edit">
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
  </section>
</template>

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

.preview-section {
  display: flex;
  grid-area: preview;
  justify-content: center;
  height: 100%;
  max-height: calc(100vh - 20px);
}

.preview-container {
  position: relative;
  border: 2px solid #d1d1da;
  border-radius: 10px;
  background-color: #fafafe;
  width: 100%;
  max-width: 1000px;
  min-height: 400px;
  overflow: hidden;
}

.preview-canvas {
  display: none;
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.preview-placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  min-height: inherit;
  color: #999;
  font-size: 1.1rem;
  text-align: center;
}

.bounding-box {
  position: absolute;
  cursor: move;
  border: 2px dashed #1da1f2;
  background-color: rgb(29 161 242 / 0.1);
  user-select: none;
}

.bounding-box__handle {
  position: absolute;
  z-index: 10;
  cursor: pointer;
  border: 2px solid white;
  border-radius: 50%;
  background-color: #1da1f2;
  width: 12px;
  height: 12px;
}

.crop-box {
  position: absolute;
  cursor: move;
  border: 2px dashed #ff6b35;
  background-color: transparent;
  user-select: none;
}

.crop-box__handle {
  position: absolute;
  z-index: 10;
  border: 2px solid white;
  background-color: #ff6b35;
}

.crop-box__handle--nw,
.crop-box__handle--ne,
.crop-box__handle--sw,
.crop-box__handle--se {
  border-radius: 50%;
  width: 12px;
  height: 12px;
}

.crop-box__handle--nw {
  top: -6px;
  left: -6px;
  cursor: nw-resize;
}

.crop-box__handle--ne {
  top: -6px;
  right: -6px;
  cursor: ne-resize;
}

.crop-box__handle--sw {
  bottom: -6px;
  left: -6px;
  cursor: sw-resize;
}

.crop-box__handle--se {
  right: -6px;
  bottom: -6px;
  cursor: se-resize;
}

.crop-box__handle--n,
.crop-box__handle--s {
  left: 50%;
  transform-origin: center;
  translate: -50% 0;
  cursor: ns-resize;
  border-radius: 4px;
  width: 12px;
  height: 8px;

  &::after {
    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    width: 20px;
    height: 20px;
    content: "";
  }
}

.crop-box__handle--n {
  top: -4px;
}

.crop-box__handle--s {
  bottom: -4px;
}

.crop-box__handle--e,
.crop-box__handle--w {
  top: 50%;
  translate: 0 -50%;
  cursor: ew-resize;
  border-radius: 4px;
  width: 8px;
  height: 12px;

  &::after {
    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    width: 20px;
    height: 20px;
    content: "";
  }
}

.crop-box__handle--e {
  right: -4px;
}

.crop-box__handle--w {
  left: -4px;
}

.crop-box__overlay {
  position: absolute;
  background-color: rgb(0 0 0 / 0.5);
  pointer-events: none;
}

.crop-box__overlay--top {
  top: -1000px;
  right: -1000px;
  bottom: 100%;
  left: -1000px;
}

.crop-box__overlay--bottom {
  top: 100%;
  right: -1000px;
  bottom: -1000px;
  left: -1000px;
}

.crop-box__overlay--left {
  top: 0;
  right: 100%;
  bottom: 0;
  left: -1000px;
}

.crop-box__overlay--right {
  top: 0;
  right: -1000px;
  bottom: 0;
  left: 100%;
}

.crop-box__handle:hover {
  transform: scale(1.2);
  background-color: #e55a2b;
}

.crop-box:hover {
  border-color: #e55a2b;
}

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

.alignment-grid {
  display: grid;
  grid-template-columns: repeat(3, 30px);
  gap: 4px;
  width: fit-content;
}

.alignment-grid__button {
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid #cfd8e3;
  border-radius: 6px;
  background-color: #fbfbff;
  height: 30px;
  color: #334155;
  font-weight: 600;
  font-size: 1rem;
}

.alignment-grid__button:hover {
  border-color: #1da1f2;
  background-color: #e2ecf7;
  color: #1d4ed8;
}

.alignment-grid__button:focus-visible {
  outline: 2px solid rgb(29 161 242 / 0.4);
  outline-offset: 2px;
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
