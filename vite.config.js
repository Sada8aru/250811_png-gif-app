import { resolve } from "path";
import { defineConfig } from "vite";

const root = resolve(__dirname, "src");

// production であれば GitHub Pages のプロジェクトページ用の base を使う
const isProd = process.env.NODE_ENV === "production";
const basePath = isProd ? "/250811_png-gif-app/" : "./";
// 出力先を環境変数で上書き可能にする（デフォルトは dist）
const outDirName = process.env.OUT_DIR ? process.env.OUT_DIR : "docs";

export default defineConfig({
  root,
  build: {
    outDir: resolve(__dirname, outDirName),
    rollupOptions: {
      input: resolve(root, "index.html"),
    },
  },
  base: basePath,
});
