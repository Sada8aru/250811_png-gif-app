const FINE_STEP = 1;
const COARSE_STEP = 10;

const getKeyboardStep = (shouldUseCoarse) => (shouldUseCoarse ? COARSE_STEP : FINE_STEP);

const getInputKeyDelta = (key, withShift) => {
  switch (key) {
    case "ArrowUp":
      return getKeyboardStep(withShift);
    case "ArrowDown":
      return -getKeyboardStep(withShift);
    default:
      return null;
  }
};

const getGlobalArrowDelta = (key, withShift) => {
  const step = getKeyboardStep(withShift);

  switch (key) {
    case "ArrowLeft":
      return { axis: "x", delta: -step };
    case "ArrowRight":
      return { axis: "x", delta: step };
    case "ArrowUp":
      return { axis: "y", delta: -step };
    case "ArrowDown":
      return { axis: "y", delta: step };
    default:
      return null;
  }
};

export { FINE_STEP, COARSE_STEP, getInputKeyDelta, getGlobalArrowDelta };
