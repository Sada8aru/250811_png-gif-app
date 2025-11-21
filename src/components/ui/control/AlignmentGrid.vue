<template>
  <div class="alignment-grid" role="group" aria-label="透過レイヤー整列">
    <button
      v-for="item in alignTargets"
      :key="item.target"
      type="button"
      class="alignment-grid__button"
      :data-align-target="item.target"
      :aria-label="item.label"
    >
      {{ item.symbol }}
    </button>
  </div>
</template>

<script lang="ts">
import { defineComponent, type PropType } from "vue";

type AlignTarget = {
  target: string;
  label: string;
  symbol: string;
};

const defaultTargets: AlignTarget[] = [
  { target: "top-left", label: "左上に整列", symbol: "↖︎" },
  { target: "top-center", label: "上中央に整列", symbol: "↑" },
  { target: "top-right", label: "右上に整列", symbol: "↗︎" },
  { target: "middle-left", label: "左中央に整列", symbol: "←" },
  { target: "middle-center", label: "中央に整列", symbol: "十" },
  { target: "middle-right", label: "右中央に整列", symbol: "→" },
  { target: "bottom-left", label: "左下に整列", symbol: "↙︎" },
  { target: "bottom-center", label: "下中央に整列", symbol: "↓" },
  { target: "bottom-right", label: "右下に整列", symbol: "↘︎" },
];

const AlignmentGrid = defineComponent({
  name: "AlignmentGrid",
  props: {
    alignTargets: {
      type: Array as PropType<AlignTarget[]>,
      required: false,
      default: () => defaultTargets,
    },
  },
});

export { AlignmentGrid };
export default AlignmentGrid;
</script>

<style scoped>
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
</style>
