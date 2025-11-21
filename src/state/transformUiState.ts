type TransformUiListener = () => void;

let isPositionInputFocused = false;
const transformUiEventTarget = new EventTarget();

const emitTransformUiSync = (): void => {
  transformUiEventTarget.dispatchEvent(new Event("transform-ui-sync"));
};

const subscribeTransformUiSync = (listener: TransformUiListener): (() => void) => {
  const handler = () => listener();
  transformUiEventTarget.addEventListener("transform-ui-sync", handler);
  return () => transformUiEventTarget.removeEventListener("transform-ui-sync", handler);
};

const setPositionInputFocused = (focused: boolean): void => {
  isPositionInputFocused = focused;
};

const isPositionInputFocusedState = (): boolean => isPositionInputFocused;

export {
  emitTransformUiSync,
  subscribeTransformUiSync,
  setPositionInputFocused,
  isPositionInputFocusedState,
  type TransformUiListener,
};
