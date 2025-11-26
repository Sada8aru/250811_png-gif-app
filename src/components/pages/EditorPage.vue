<template>
  <section class="editor-panel" role="tabpanel">
    <UploadSection />
    <PreviewArea />
    <ControlPanel />
  </section>
</template>

<script setup lang="ts">
import ControlPanel from "../ui/control/ControlPanel.vue";
import PreviewArea from "../ui/preview/PreviewArea.vue";
import UploadSection from "../ui/upload/UploadSection.vue";
</script>

<style scoped>
.editor-panel {
  display: grid;
  grid-template:
    "upload preview control" 1fr /
    200px 1fr 320px;
  align-items: start;
  gap: 12px;
  padding: 24px 12px 12px;
  width: 100%;
  height: 100%;
  @media (width <= 1000px) {
    grid-template:
      "preview control" 1fr
      "upload control" 230px /
      1fr 320px;
    min-height: 100vh;
  }
}
</style>
