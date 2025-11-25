import { Axis } from "./controlPanel";

export const FINE_STEP = 1;
export const COARSE_STEP = 10;

const getKeyboardStep = (shouldUseCoarse: boolean) => (shouldUseCoarse ? COARSE_STEP : FINE_STEP);

export type ArrowKey = "ArrowUp" | "ArrowDown" | "ArrowLeft" | "ArrowRight";

export const getInputKeyDelta = (key: ArrowKey, withShift: boolean) => {
  switch (key) {
    case "ArrowUp":
      return getKeyboardStep(withShift);
    case "ArrowDown":
      return -getKeyboardStep(withShift);
    default:
      return null;
  }
};

export const getGlobalArrowDelta = (
  key: ArrowKey,
  withShift: boolean,
): { axis: Axis; delta: number } | null => {
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
