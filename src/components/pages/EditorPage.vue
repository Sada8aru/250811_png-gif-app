<template>
  <section class="tab-panel" role="tabpanel">
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
