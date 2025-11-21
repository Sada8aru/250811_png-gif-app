/**
 * もろもろのDOM要素
 */
export type DomRefs = {
  backgroundDropzone: HTMLElement | null;
  transparentDropzone: HTMLElement | null;
  backgroundButton: HTMLButtonElement | null;
  transparentButton: HTMLButtonElement | null;
  backgroundInput: HTMLInputElement | null;
  transparentInput: HTMLInputElement | null;
  previewContainer: HTMLElement | null;
  previewCanvas: HTMLCanvasElement;
  previewPlaceholder: HTMLElement | null;
  boundingBox: HTMLElement;
  cropBox: HTMLElement;
  modeToggleEdit: HTMLButtonElement | null;
  modeToggleCrop: HTMLButtonElement | null;
  cropControls: HTMLElement | null;
  editModeControls: NodeListOf<HTMLElement> | null;
  scaleInput: HTMLInputElement | null;
  aspectRatioSelect: HTMLSelectElement | null;
  animationSpeedInput: HTMLInputElement | null;
  animationSpeedValue: HTMLElement | null;
  exportPngButton: HTMLButtonElement;
  exportGifButton: HTMLButtonElement;
  errorMessage: HTMLElement | null;
  alignmentButtons: NodeListOf<HTMLButtonElement> | null;
  positionInputX: HTMLInputElement | null;
  positionInputY: HTMLInputElement | null;
};
