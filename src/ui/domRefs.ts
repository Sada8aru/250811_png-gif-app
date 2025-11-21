import { DomRefs } from "./domRefsType";

const queryDomRefs = () => ({
  previewContainer: document.getElementById("previewContainer"),
  previewCanvas: document.getElementById("previewCanvas"),
  previewPlaceholder: document.getElementById("previewPlaceholder"),
  boundingBox: document.getElementById("boundingBox"),
  cropBox: document.getElementById("cropBox"),
  modeToggleEdit: document.getElementById("modeToggleEdit"),
  modeToggleCrop: document.getElementById("modeToggleCrop"),
  cropControls: document.getElementById("cropControls"),
  editModeControls: document.querySelectorAll('[data-mode-panel="edit"]'),
  scaleInput: document.getElementById("scaleInput"),
  aspectRatioSelect: document.getElementById("aspectRatioSelect"),
  animationSpeedInput: document.getElementById("animationSpeedInput"),
  animationSpeedValue: document.getElementById("animationSpeedValue"),
  exportPngButton: document.getElementById("exportPngButton"),
  exportGifButton: document.getElementById("exportGifButton"),
  errorMessage: document.getElementById("errorMessage"),
  alignmentButtons: document.querySelectorAll("[data-align-target]"),
  positionInputX: document.getElementById("positionInputX"),
  positionInputY: document.getElementById("positionInputY"),
});

let domRefs: DomRefs;

const refreshDomRefs = (): DomRefs => {
  domRefs = queryDomRefs() as DomRefs; // 型エラーの解決は面倒なのでasで保証
  return domRefs;
};

const getDomRefs = (): DomRefs => domRefs ?? refreshDomRefs();

export { getDomRefs, refreshDomRefs };
