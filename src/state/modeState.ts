export type ModeChangeListener = (isCropMode: boolean) => void;

let isCropMode = false;
const modeEventTarget = new EventTarget();

/**
 * トリミングモードを取得する。
 */
export const isCropModeEnabled = (): boolean => isCropMode;

/**
 * トリミングモードを設定し、必要に応じてリスナーへ通知する。
 * @param {boolean} nextState 有効にする場合は true
 */
export const setCropMode = (nextState: boolean): void => {
  const normalized = Boolean(nextState);
  if (isCropMode === normalized) return;
  isCropMode = normalized;
  modeEventTarget.dispatchEvent(
    new CustomEvent("mode-change", {
      detail: { isCropMode },
    }),
  );
};

/**
 * トリミングモード変更イベントを購読する。
 * @param {ModeChangeListener} listener 変更時のコールバック
 * @returns {() => void} 登録解除の関数
 */

export const subscribeModeChange = (listener: ModeChangeListener): (() => void) => {
  const handler = (event: Event): void => {
    if (!(event instanceof CustomEvent)) return;
    listener(Boolean(event.detail?.isCropMode));
  };
  modeEventTarget.addEventListener("mode-change", handler);
  return () => modeEventTarget.removeEventListener("mode-change", handler);
};
