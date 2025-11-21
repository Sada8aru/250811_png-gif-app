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
      <EditorPage v-show="isEditTab" />

      <section class="tab-panel tab-panel--preview" v-show="isPreviewTab" role="tabpanel">
        <XPreviewPage :previewDataUrl="previewDataUrl" />
      </section>
    </main>

    <div id="errorMessage" class="error-message" style="display: none"></div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import EditorPage from "./components/pages/EditorPage.vue";
import { XPreviewPage } from "./components/pages/XPreviewPage.vue";
import { generatePreviewDataUrl } from "./render/previewRenderer";
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
  previewDataUrl.value = generatePreviewDataUrl();
};

const appClass = computed(() => ({
  "app--preview": isPreviewTab.value,
}));

onMounted(() => {
  initializeApp();
});
</script>
