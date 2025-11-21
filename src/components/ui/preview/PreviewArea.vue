<template>
  <section class="preview-section">
    <div class="preview-container" id="previewContainer">
      <canvas id="previewCanvas" class="preview-canvas"></canvas>
      <div class="preview-placeholder" id="previewPlaceholder">
        <p>画像をアップロードするとプレビューが表示されます</p>
      </div>

      <div
        id="boundingBox"
        class="bounding-box"
        style="display: none"
        data-template="bounding-box"
      ></div>

      <div id="cropBox" class="crop-box" style="display: none" data-template="crop-box"></div>
    </div>
  </section>
</template>

<script lang="ts">
import { defineComponent } from "vue";

export const PreviewArea = defineComponent({
  name: "PreviewArea",
});

export default PreviewArea;
</script>

<style>
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

.bounding-box__handle--nw {
  top: -6px;
  left: -6px;
  cursor: nw-resize;
}

.bounding-box__handle--ne {
  top: -6px;
  right: -6px;
  cursor: ne-resize;
}

.bounding-box__handle--sw {
  bottom: -6px;
  left: -6px;
  cursor: sw-resize;
}

.bounding-box__handle--se {
  right: -6px;
  bottom: -6px;
  cursor: se-resize;
}

.bounding-box__border {
  position: absolute;
  background-color: transparent;
}

.bounding-box__border--top,
.bounding-box__border--bottom {
  right: 0;
  left: 0;
  cursor: ns-resize;
  height: 4px;
}

.bounding-box__border--top {
  top: -2px;
}

.bounding-box__border--bottom {
  bottom: -2px;
}

.bounding-box__border--left,
.bounding-box__border--right {
  top: 0;
  bottom: 0;
  cursor: ew-resize;
  width: 4px;
}

.bounding-box__border--left {
  left: -2px;
}

.bounding-box__border--right {
  right: -2px;
}

.bounding-box__handle:hover {
  transform: scale(1.2);
  background-color: #1991db;
}

.bounding-box:hover {
  border-color: #1991db;
  background-color: rgb(29 161 242 / 0.15);
}

.crop-box {
  position: absolute;
  z-index: 5;
  cursor: move;
  border: 2px solid #ff6b35;
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
</style>
