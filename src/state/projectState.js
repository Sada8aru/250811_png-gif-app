const defaultTransformState = () => ({
  scale: 1,
  position: { x: 0, y: 0 },
  cropArea: null,
  aspectRatio: "original",
});

const projectState = {
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

const resetTransformState = () => {
  projectState.transformState = defaultTransformState();
};

const clearProjectState = () => {
  projectState.backgroundImage = null;
  projectState.transparentImages = [];
  resetTransformState();
};

export { projectState, resetTransformState, clearProjectState };
