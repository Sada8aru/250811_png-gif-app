<template>
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
</template>

<script lang="ts">
import { defineComponent } from "vue";

export const UploadSection = defineComponent({
  name: "UploadSection",
});

export default UploadSection;
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
