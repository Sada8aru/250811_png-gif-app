import { resolve } from "path";
import { defineConfig } from "vite";

const root = resolve(__dirname, "src");

export default defineConfig({
  root,
  build: {
    outDir: resolve(__dirname, "dist"),
    rollupOptions: {
      input: resolve(root, "index.html"),
    },
  },
  base: process.env.BASE_PATH ? "/250811_png-gif-app/" : "./",
});
