<template>
  <section class="preview-panel" role="tabpanel">
    <div class="x-timeline" :data-theme="theme">
      <div class="x-timeline__rail">
        <div class="x-timeline__skeleton">
          <div class="x-timeline__skeleton-avatar"></div>
          <div class="x-timeline__skeleton-lines">
            <div class="x-timeline__skeleton-line x-timeline__skeleton-line--wide"></div>
            <div class="x-timeline__skeleton-line"></div>
          </div>
        </div>

        <div class="x-timeline__skeleton">
          <div class="x-timeline__skeleton-avatar"></div>
          <div class="x-timeline__skeleton-lines">
            <div class="x-timeline__skeleton-line"></div>
            <div class="x-timeline__skeleton-line x-timeline__skeleton-line--short"></div>
          </div>
        </div>

        <article class="x-card" aria-label="X プレビューカード">
          <header class="x-card__header">
            <div class="x-card__avatar" aria-hidden="true">P</div>
            <div class="x-card__meta">
              <div class="x-card__name">Preview Account</div>
              <div class="x-card__handle">@preview_account · 1m</div>
            </div>
            <span class="x-card__brand" aria-hidden="true">…</span>
          </header>

          <div class="x-card__body">
            <div
              v-if="!isEditing"
              class="x-card__text"
              role="button"
              tabindex="0"
              @dblclick="startEdit"
              @keydown.enter.prevent="startEdit"
            >
              {{ postText }}
            </div>
            <div v-else class="x-card__text-input">
              <textarea
                ref="textInputRef"
                v-model="editingDraft"
                maxlength="144"
                rows="3"
                class="x-card__textarea"
                @input="handleInput"
                @keydown.escape.prevent="cancelEdit"
                @blur="applyDraft"
              ></textarea>
              <span class="x-card__counter">{{ editingDraft.length }}/144</span>
            </div>

            <div class="x-card__media">
              <div class="x-card__media-header">
                <span v-if="mediaState.canAnimate" class="x-card__label">GIF</span>
              </div>
              <template v-if="mediaState.canAnimate">
                <canvas
                  ref="timelineCanvasRef"
                  class="x-card__canvas"
                  aria-label="編集結果プレビュー"
                ></canvas>
              </template>
              <template v-else-if="mediaState.hasSnapshot">
                <img :src="previewImage" alt="編集結果プレビュー" class="x-card__image" />
              </template>
              <template v-else>
                <div class="x-card__placeholder">編集タブで画像を読み込むと表示されます</div>
              </template>
            </div>
          </div>
        </article>

        <div class="x-timeline__skeleton">
          <div class="x-timeline__skeleton-avatar"></div>
          <div class="x-timeline__skeleton-lines">
            <div class="x-timeline__skeleton-line"></div>
            <div class="x-timeline__skeleton-line x-timeline__skeleton-line--short"></div>
          </div>
        </div>

        <div class="x-timeline__skeleton">
          <div class="x-timeline__skeleton-avatar"></div>
          <div class="x-timeline__skeleton-lines">
            <div class="x-timeline__skeleton-line"></div>
            <div class="x-timeline__skeleton-line x-timeline__skeleton-line--short"></div>
          </div>
        </div>
      </div>

      <div class="x-timeline__toolbar">
        <button type="button" class="x-timeline__toggle" @click="toggleTheme">
          {{ theme === "light" ? "ライト" : "ダーク" }}
        </button>
      </div>
    </div>
  </section>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from "vue";
import { calculateTransparentImagePosition } from "../../render/previewRenderer";
import { projectState } from "../../state/projectState";

type Theme = "light" | "dark";

const props = defineProps<{
  previewDataUrl?: string;
}>();

const theme = ref<Theme>("light");
const postText = ref("画像の編集結果プレビュー");
const isEditing = ref(false);
const editingDraft = ref(postText.value);
const textInputRef = ref<HTMLTextAreaElement | null>(null);
const timelineCanvasRef = ref<HTMLCanvasElement | null>(null);
const previewImage = computed(() => props.previewDataUrl ?? "");

const mediaState = reactive({
  hasSnapshot: false,
  canAnimate: false,
});

const playbackHandle = ref<number | null>(null);
const currentFrameIndex = ref(0);

const toggleTheme = () => {
  theme.value = theme.value === "light" ? "dark" : "light";
};

const handleInput = (event: Event) => {
  const target = event.target as HTMLTextAreaElement;
  if (target.value.length > 144) {
    target.value = target.value.slice(0, 144);
  }
  editingDraft.value = target.value;
};

const startEdit = async () => {
  editingDraft.value = postText.value;
  isEditing.value = true;
  await nextTick();
  textInputRef.value?.focus();
};

const cancelEdit = () => {
  isEditing.value = false;
  editingDraft.value = postText.value;
};

const applyDraft = () => {
  postText.value = editingDraft.value.slice(0, 144);
  isEditing.value = false;
};

const clearPlayback = () => {
  if (playbackHandle.value !== null) {
    window.clearTimeout(playbackHandle.value);
    playbackHandle.value = null;
  }
};

const drawFrame = (frameIndex: number) => {
  const canvas = timelineCanvasRef.value;
  const bg = projectState.backgroundImage;
  if (!canvas || !bg) return;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;

  const cropArea = projectState.transformState.cropArea;
  const width = cropArea ? cropArea.width : bg.metadata.width;
  const height = cropArea ? cropArea.height : bg.metadata.height;

  canvas.width = width;
  canvas.height = height;

  ctx.clearRect(0, 0, width, height);

  if (cropArea) {
    ctx.drawImage(
      bg.image,
      cropArea.x,
      cropArea.y,
      cropArea.width,
      cropArea.height,
      0,
      0,
      width,
      height,
    );
  } else {
    ctx.drawImage(bg.image, 0, 0);
  }

  const frames = projectState.transparentImages;
  const frame = frames.length > 0 ? frames[frameIndex % frames.length] : null;
  if (frame) {
    const scale = projectState.transformState.scale;
    const pos = projectState.transformState.position;
    const imagePos = calculateTransparentImagePosition(frame, scale, pos, bg, cropArea, {
      useCropAreaOffset: true,
    });

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(frame.image, imagePos.x, imagePos.y, imagePos.width, imagePos.height);
  }
};

const scheduleNextFrame = () => {
  if (!mediaState.canAnimate) return;
  const frames = projectState.transparentImages;
  if (frames.length === 0) return;

  const delay =
    frames[currentFrameIndex.value]?.frameInfo?.delay ??
    projectState.animationSettings.frameDelay ??
    500;

  playbackHandle.value = window.setTimeout(() => {
    currentFrameIndex.value = (currentFrameIndex.value + 1) % frames.length;
    drawFrame(currentFrameIndex.value);
    scheduleNextFrame();
  }, delay);
};

const syncPreviewMedia = () => {
  mediaState.hasSnapshot = Boolean(previewImage.value);
  mediaState.canAnimate =
    Boolean(projectState.backgroundImage) && projectState.transparentImages.length > 1;

  currentFrameIndex.value = 0;
  clearPlayback();

  if (!mediaState.canAnimate) {
    return;
  }

  drawFrame(0);
  scheduleNextFrame();
};

watch(
  previewImage,
  () => {
    syncPreviewMedia();
  },
  { immediate: true },
);

onMounted(() => {
  syncPreviewMedia();
});

onBeforeUnmount(() => {
  clearPlayback();
});
</script>

<style scoped>
.preview-panel {
  height: 100%;
}

.x-timeline {
  display: flex;
  justify-content: center;
  height: 100%;
}

.x-timeline[data-theme="dark"] {
  background: rgb(18 24 35);
}

.x-timeline__rail {
  display: flex;
  flex-direction: column;
  width: min(480px, 100%);
  height: 100%;
  overflow-y: auto;
}

.x-timeline__toolbar {
  display: flex;
  position: fixed;
  top: 2px;
  right: 4px;
  justify-content: space-between;
  align-items: center;
  padding: 8px 4px;
}

.x-timeline__toggle {
  transition:
    background-color 0.2s ease,
    border-color 0.2s ease;
  cursor: pointer;
  border: 1px solid rgb(209 219 230);
  border-radius: 999px;
  background-color: rgb(255 255 255);
  padding: 6px 12px;
  color: rgb(42 52 68);
}

.x-timeline__toggle:hover {
  border-color: rgb(179 193 209);
  background-color: rgb(244 248 252);
}

.x-timeline[data-theme="dark"] .x-timeline__toggle {
  border-color: rgb(62 75 95);
  background-color: rgb(32 41 58);
  color: rgb(226 233 245);
}

.x-timeline[data-theme="dark"] .x-timeline__toggle:hover {
  border-color: rgb(82 98 120);
  background-color: rgb(46 57 75);
}

.x-timeline__skeleton {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  border: 1px solid rgb(233 238 244);
  background-color: white;
  padding: 12px 16px;
}

.x-timeline__skeleton-avatar {
  border-radius: 50%;
  background: linear-gradient(90deg, rgb(225 231 239), rgb(235 240 247));
  width: 44px;
  height: 44px;
}

.x-timeline__skeleton-lines {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.x-timeline__skeleton-line {
  border-radius: 999px;
  background: linear-gradient(90deg, rgb(225 231 239), rgb(235 240 247));
  height: 10px;
}

.x-timeline__skeleton-line--wide {
  width: 80%;
}

.x-timeline__skeleton-line--short {
  width: 50%;
}

.x-timeline[data-theme="dark"] .x-timeline__skeleton {
  border-color: rgb(46 58 77);
  background: rgb(27 34 47);
}

.x-timeline[data-theme="dark"] .x-timeline__skeleton-avatar,
.x-timeline[data-theme="dark"] .x-timeline__skeleton-line {
  background: linear-gradient(90deg, rgb(54 66 85), rgb(65 79 99));
}

.x-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  border: 1px solid rgb(231 236 241);
  border-radius: 0;
  background-color: rgb(255 255 255);
  padding: 14px 16px 16px;
}

.x-timeline[data-theme="dark"] .x-card {
  border-color: rgb(47 58 77);
  background-color: rgb(25 32 45);
}

.x-card__header {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
}

.x-card__avatar {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  background: linear-gradient(135deg, rgb(14 165 233), rgb(37 99 235));
  width: 44px;
  height: 44px;
  color: rgb(255 255 255);
  font-weight: 800;
}

.x-card__meta {
  display: flex;
  flex-direction: row;
}

.x-card__name {
  color: rgb(15 20 25);
  font-weight: 700;
  font-size: 15px;
  line-height: 1.5;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.x-card__handle {
  color: rgb(83, 100, 113);
  font-size: 0.9rem;
  font-size: 15px;
  line-height: 1.5;
}

.x-card__brand {
  color: rgb(83, 100, 113);
  font-weight: 800;
  font-size: 0.95rem;
  letter-spacing: 0.08em;
}

.x-timeline[data-theme="dark"] .x-card__name {
  color: rgb(235 240 247);
}

.x-timeline[data-theme="dark"] .x-card__handle,
.x-timeline[data-theme="dark"] .x-card__brand {
  color: rgb(162 177 198);
}

.x-card__body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: rgb(15 23 42);
  font-size: 1rem;
  line-height: 1.6;
}

.x-timeline[data-theme="dark"] .x-card__body {
  color: rgb(225 232 245);
}

.x-card__text {
  transition: background-color 0.15s ease;
  cursor: text;
  margin: 0;
  border-radius: 10px;
  padding: 6px 8px;
  white-space: pre-wrap;
  word-break: break-word;
}

.x-card__text:hover {
  background-color: rgb(245 248 250);
}

.x-timeline[data-theme="dark"] .x-card__text:hover {
  background-color: rgb(39 49 68);
}

.x-card__text-input {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.x-card__textarea {
  flex: 1;
  outline: none;
  border: 1px solid rgb(214 222 231);
  border-radius: 10px;
  background-color: rgb(255 255 255);
  padding: 10px 12px;
  min-height: 96px;
  resize: vertical;
  color: rgb(15 23 42);
  font-size: 1rem;
}

.x-card__textarea:focus {
  box-shadow: 0 0 0 3px rgb(59 130 246 / 0.2);
  border-color: rgb(59 130 246);
}

.x-card__counter {
  color: rgb(120 130 145);
  font-size: 0.85rem;
}

.x-timeline[data-theme="dark"] .x-card__textarea {
  border-color: rgb(57 70 90);
  background-color: rgb(32 41 58);
  color: rgb(235 240 247);
}

.x-timeline[data-theme="dark"] .x-card__counter {
  color: rgb(169 183 203);
}

.x-card__media {
  position: relative;
  border: 1px solid rgb(230 235 241);
  border-radius: 16px;
}

.x-card__media-header {
  display: flex;
  position: absolute;
  bottom: 12px;
  left: 12px;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  color: rgb(105 116 134);
  font-size: 0.9rem;
}

.x-card__label {
  display: inline;
  position: relative;
  gap: 6px;
  border: 0 solid black;
  border-top-right-radius: 4px;
  border-bottom-right-radius: 4px;
  background-color: rgba(0, 0, 0, 0.3);
  padding: 0 8px;
  color: rgb(255 255 255);
  font-weight: 700;
  font-size: 13px;
  line-height: 16px;
  text-align: center;
  white-space: pre-wrap;
}

.x-card__canvas,
.x-card__image {
  display: block;
  border-radius: 12px;
  background-color: rgb(0 0 0);
  width: 100%;
}

.x-card__canvas {
  object-fit: contain;
}

.x-card__placeholder {
  display: grid;
  place-items: center;
  border-radius: 12px;
  background:
    repeating-linear-gradient(
      -45deg,
      rgb(245 248 251),
      rgb(245 248 251) 12px,
      rgb(238 242 248) 12px,
      rgb(238 242 248) 24px
    ),
    linear-gradient(180deg, rgb(248 251 254), rgb(244 248 252));
  min-height: 260px;
  color: rgb(130 139 152);
  font-size: 0.95rem;
}

.x-timeline[data-theme="dark"] .x-card__media {
  border-color: rgb(51 63 83);
  background-color: rgb(29 38 53);
}

.x-timeline[data-theme="dark"] .x-card__media-header {
  color: rgb(172 186 205);
}

.x-timeline[data-theme="dark"] .x-card__placeholder {
  background:
    repeating-linear-gradient(
      -45deg,
      rgb(34 44 60),
      rgb(34 44 60) 12px,
      rgb(39 50 68) 12px,
      rgb(39 50 68) 24px
    ),
    linear-gradient(180deg, rgb(26 34 48), rgb(22 29 42));
  color: rgb(156 170 189);
}

@media (width <= 640px) {
  .x-timeline__rail {
    gap: 0;
  }

  .x-card {
    border-radius: 0;
  }
}
</style>
