/**
 * もろもろのDOM要素
 */
export type DomRefs = {
  previewContainer: HTMLElement | null;
  previewCanvas: HTMLCanvasElement;
  previewPlaceholder: HTMLElement | null;
  boundingBox: HTMLElement;
  cropBox: HTMLElement;
  aspectRatioSelect: HTMLSelectElement | null;
  animationSpeedInput: HTMLInputElement | null;
  animationSpeedValue: HTMLElement | null;
  exportPngButton: HTMLButtonElement;
  exportGifButton: HTMLButtonElement;
  errorMessage: HTMLElement | null;
  alignmentButtons: NodeListOf<HTMLButtonElement> | null;
};
