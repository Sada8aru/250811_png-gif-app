import { refreshDomRefs, getDomRefs } from "./domRefs";
import { setupUploadControls } from "./uploadControls";
import { setupControls } from "./controlPanel";
import { setupInteractionControls } from "./interactionControls";
import { setupExportButtons } from "../export/exporters";
import { injectBoundingBoxTemplate, injectCropBoxTemplate } from "../templates/previewHandles";
import { initRendererDomRefs } from "../render/previewRenderer";

const initializeApp = () => {
  console.log("X用ポスト画像生成ツール - 初期化開始");

  refreshDomRefs();
  initRendererDomRefs();

  const refs = getDomRefs();
  injectBoundingBoxTemplate(refs.boundingBox);
  injectCropBoxTemplate(refs.cropBox);

  setupUploadControls();
  setupControls();
  setupInteractionControls();
  setupExportButtons();

  console.log("初期化完了");
};

export { initializeApp };
