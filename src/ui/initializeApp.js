import { refreshDomRefs, getDomRefs } from "./domRefs";
import { setupControls } from "./controlPanel";
import { setupInteractionControls } from "./interactionControls";
import { setupExportButtons } from "../export/exporters";
import { injectBoundingBoxTemplate, injectCropBoxTemplate } from "../templates/previewHandles";
import { initRendererDomRefs } from "../render/previewRenderer";

const initializeApp = () => {
  refreshDomRefs();
  initRendererDomRefs();

  const refs = getDomRefs();
  injectBoundingBoxTemplate(refs.boundingBox);
  injectCropBoxTemplate(refs.cropBox);

  setupControls();
  setupInteractionControls();
  setupExportButtons();
};

export { initializeApp };
