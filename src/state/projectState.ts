import { type ProjectImage, type TransformState } from "../types/media";

type OutputSettings = {
  format: "PNG";
  maxWidth: number;
  maxHeight: number;
};

type AnimationSettings = {
  frameDelay: number;
};

type ProjectState = {
  backgroundImage: ProjectImage | null;
  transparentImages: ProjectImage[];
  transformState: TransformState;
  outputSettings: OutputSettings;
  animationSettings: AnimationSettings;
};

const defaultTransformState = (): TransformState => ({
  scale: 1,
  position: { x: 0, y: 0 },
  cropArea: null,
  aspectRatio: "original",
});

const projectState: ProjectState = {
  backgroundImage: null,
  transparentImages: [],
  transformState: defaultTransformState(),
  outputSettings: {
    format: "PNG",
    maxWidth: 1200,
    maxHeight: 675,
  },
  animationSettings: {
    frameDelay: 500,
  },
};

/**
 * 変換パラメータを初期値に戻す。
 */
const resetTransformState = (): void => {
  projectState.transformState = defaultTransformState();
};

/**
 * プロジェクトの状態をすべてクリアする。
 */
const clearProjectState = (): void => {
  projectState.backgroundImage = null;
  projectState.transparentImages = [];
  resetTransformState();
};

export {
  type ProjectState,
  type AnimationSettings,
  type OutputSettings,
  projectState,
  resetTransformState,
  clearProjectState,
};
