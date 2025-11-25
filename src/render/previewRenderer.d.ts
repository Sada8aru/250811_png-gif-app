import { type CropArea, type Point, type ProjectImage } from "../types/media";

export type AlignmentKey =
  | "top-left"
  | "top-center"
  | "top-right"
  | "middle-left"
  | "middle-center"
  | "middle-right"
  | "bottom-left"
  | "bottom-center"
  | "bottom-right";

export type TransparentImagePosition = {
  x: number;
  y: number;
  width: number;
  height: number;
  baseX?: number;
  baseY?: number;
  cropOffsetX?: number;
  cropOffsetY?: number;
};

export const initRendererDomRefs: () => void;
export const calculateTransparentImagePosition: (
  transparentImg: ProjectImage,
  scale: number,
  pos: Point,
  bg: ProjectImage,
  cropArea?: CropArea | null,
  options?: { useCropAreaOffset?: boolean },
) => TransparentImagePosition;
export const renderCropModePreview: () => void;
export const updatePreview: () => void;
export const updateExportButtons: () => void;
export const showBoundingBoxTemporarily: (duration: number) => void;
export const alignTransparentLayer: (alignmentKey: AlignmentKey | string) => void;
export const updateBoundingBox: () => void;
export const updateCropBox: () => void;
export const getAspectRatio: (ratioKey: string) => number | null;
export const setBoundingBoxSelected: (selected: boolean) => void;
export const isBoundingBoxActive: () => boolean;
export const generatePreviewDataUrl: () => string;
