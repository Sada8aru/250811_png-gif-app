import { resolve } from "node:path";
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";

const root = resolve(__dirname, "src");
const isProd = process.env.NODE_ENV === "production";
const basePath = process.env.VITE_PUBLIC_BASE
  ? process.env.VITE_PUBLIC_BASE
  : // GitHub Pages でのホスティング時のみ明示設定。ローカル build/preview は相対パスで崩れないようにする。
    (process.env.GH_PAGES === "true" && isProd ? "/250811_png-gif-app/" : "./");
const outDirName = process.env.OUT_DIR ? process.env.OUT_DIR : "docs";

export default defineConfig({
  plugins: [vue()],
  root,
  build: {
    outDir: resolve(__dirname, outDirName),
    rollupOptions: {
      input: resolve(root, "index.html"),
    },
  },
  base: basePath,
});
