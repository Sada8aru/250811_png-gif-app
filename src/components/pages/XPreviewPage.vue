<template>
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
          v-if="hasPreview"
          :src="previewSrc"
          alt="編集結果プレビュー"
          class="x-preview__image"
        />
        <div v-else class="x-preview__placeholder">編集タブで画像を読み込むと表示されます</div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { computed, defineComponent, toRef } from "vue";

type Props = {
  previewDataUrl?: string;
};

const XPreviewPage = defineComponent({
  name: "XPreviewPage",
  props: {
    previewDataUrl: {
      type: String,
      required: false,
      default: "",
    },
  },
  setup: (props: Props) => {
    const previewSrc = toRef(props, "previewDataUrl");
    const hasPreview = computed(() => previewSrc.value !== "");

    return {
      hasPreview,
      previewSrc,
    };
  },
});

export { XPreviewPage };
export default XPreviewPage;
</script>

<style scoped>
.x-preview {
  margin-inline: auto;
  box-shadow: 0 12px 32px rgb(0 0 0 / 0.04);
  border: 1px solid rgb(225 232 237);
  border-radius: 16px;
  background-color: rgb(255 255 255);
  padding: 16px;
  max-width: 720px;
}

.x-preview__header {
  display: flex;
  align-items: center;
  gap: 12px;
}

.x-preview__avatar {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  background-color: rgb(19 8 140);
  width: 48px;
  height: 48px;
  color: rgb(255 255 255);
  font-weight: 800;
}

.x-preview__meta {
  display: flex;
  flex-direction: column;
  gap: 2px;
  color: rgb(83 100 113);
  font-size: 0.95rem;
}

.x-preview__name {
  color: rgb(20 23 26);
  font-weight: 800;
  font-size: 1rem;
}

.x-preview__handle {
  color: rgb(83 100 113);
  font-size: 0.9rem;
}

.x-preview__body {
  margin-top: 10px;
  color: rgb(15 20 25);
  font-size: 1rem;
  line-height: 1.5;
}

.x-preview__text {
  margin: 0 0 10px;
}

.x-preview__media {
  border: 1px solid rgb(225 232 237);
  border-radius: 12px;
  background-color: rgb(245 248 250);
  overflow: hidden;
}

.x-preview__image {
  display: block;
  background-color: rgb(0 0 0);
  width: 100%;
  height: auto;
  object-fit: contain;
}

.x-preview__placeholder {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 320px;
  color: rgb(107 114 128);
  font-size: 0.95rem;
  text-align: center;
}
</style>
