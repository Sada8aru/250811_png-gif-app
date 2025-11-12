const queryDomRefs = () => ({
  backgroundDropzone: document.getElementById("backgroundDropzone"),
  transparentDropzone: document.getElementById("transparentDropzone"),
  backgroundButton: document.getElementById("backgroundButton"),
  transparentButton: document.getElementById("transparentButton"),
  backgroundInput: document.getElementById("backgroundInput"),
  transparentInput: document.getElementById("transparentInput"),
  previewContainer: document.getElementById("previewContainer"),
  previewCanvas: document.getElementById("previewCanvas"),
  previewPlaceholder: document.getElementById("previewPlaceholder"),
  boundingBox: document.getElementById("boundingBox"),
  cropBox: document.getElementById("cropBox"),
  modeToggleEdit: document.getElementById("modeToggleEdit"),
  modeToggleCrop: document.getElementById("modeToggleCrop"),
  cropControls: document.getElementById("cropControls"),
  scaleInput: document.getElementById("scaleInput"),
  aspectRatioSelect: document.getElementById("aspectRatioSelect"),
  animationSpeedInput: document.getElementById("animationSpeedInput"),
  animationSpeedValue: document.getElementById("animationSpeedValue"),
  exportPngButton: document.getElementById("exportPngButton"),
  exportGifButton: document.getElementById("exportGifButton"),
  errorMessage: document.getElementById("errorMessage"),
  alignmentButtons: document.querySelectorAll("[data-align-target]"),
});

let domRefs;

const refreshDomRefs = () => {
  domRefs = queryDomRefs();
  return domRefs;
};

const getDomRefs = () => domRefs ?? refreshDomRefs();

export { getDomRefs, refreshDomRefs };
