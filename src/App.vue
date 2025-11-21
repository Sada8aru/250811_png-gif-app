<template>
  <div class="app" :class="appClass">
    <header class="tab-header">
      <div class="tab-header__buttons" role="tablist" aria-label="表示切り替え">
        <button
          type="button"
          class="tab-header__button"
          :class="{ 'tab-header__button--active': isEditTab }"
          role="tab"
          :aria-selected="isEditTab ? 'true' : 'false'"
          @click="setTab('edit')"
        >
          編集
        </button>
        <button
          type="button"
          class="tab-header__button"
          :class="{ 'tab-header__button--active': isPreviewTab }"
          role="tab"
          :aria-selected="isPreviewTab ? 'true' : 'false'"
          @click="setTab('preview')"
        >
          Xプレビュー
        </button>
      </div>
    </header>

    <main class="app__main">
      <section class="tab-panel" v-show="isEditTab" role="tabpanel">
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
                <small class="control-item__description"
                  >値が小さいほど高速再生（←高速 --- 低速→）<br />
                  ※GIF読み込み時は元の速度に合わせて範囲が自動調整されます</small
                >
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

      <section class="tab-panel tab-panel--preview" v-show="isPreviewTab" role="tabpanel">
        <div class="x-preview">
          <div class="x-preview__header">
            <div class="x-preview__avatar" aria-hidden="true">X</div>
            <div class="x-preview__meta">
              <div class="x-preview__name">Preview Account</div>
              <div class="x-preview__handle">@preview_account · 1m</div>
            </div>
          </div>
          <div class="x-preview__body">
            <p class="x-preview__text">画像の編集結果プレビュー</p>
            <div class="x-preview__media">
              <img
                v-if="previewDataUrl"
                :src="previewDataUrl"
                alt="編集結果プレビュー"
                class="x-preview__image"
              />
              <div v-else class="x-preview__placeholder">
                編集タブで画像を読み込むと表示されます
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <div id="errorMessage" class="error-message" style="display: none"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { initializeApp } from "./ui/initializeApp";

type TabKey = "edit" | "preview";

const activeTab = ref<TabKey>("edit");
const previewDataUrl = ref<string>("");

const isEditTab = computed(() => activeTab.value === "edit");
const isPreviewTab = computed(() => activeTab.value === "preview");

const setTab = (tab: TabKey) => {
  activeTab.value = tab;
  if (tab === "preview") {
    capturePreviewSnapshot();
  }
};

const capturePreviewSnapshot = () => {
  const canvas = document.getElementById("previewCanvas") as HTMLCanvasElement | null;
  if (!canvas) {
    previewDataUrl.value = "";
    return;
  }

  try {
    previewDataUrl.value = canvas.toDataURL("image/png");
  } catch {
    previewDataUrl.value = "";
  }
};

const appClass = computed(() => ({
  "app--preview": isPreviewTab.value,
}));

onMounted(() => {
  initializeApp();
});
</script>
