type Size = {
  width: number;
  height: number;
};

type Point = {
  x: number;
  y: number;
};

type CropArea = Point & Size;

type ImageMetadata = Size & {
  type?: string;
};

type FrameInfo = {
  delay?: number;
  disposal?: number;
  isFromGif?: boolean;
  originalIndex?: number;
};

type ProjectImage = {
  id: string;
  image: HTMLImageElement;
  metadata: ImageMetadata;
  file?: File;
  canvas?: HTMLCanvasElement;
  frameInfo?: FrameInfo;
};

type TransformState = {
  scale: number;
  position: Point;
  cropArea: CropArea | null;
  aspectRatio: string;
};

export {
  type CropArea,
  type FrameInfo,
  type ImageMetadata,
  type Point,
  type ProjectImage,
  type Size,
  type TransformState,
};
