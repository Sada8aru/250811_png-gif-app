/**
 * プレビューキャンバス上で背景（もしくはクロップ領域）がどのスケールとオフセットで描画されているかを算出する。
 * @param {{ bgSize: { width: number; height: number }; cropArea: { x: number; y: number; width: number; height: number } | null; canvasRect: DOMRect }} params
 * @returns {{ scale: number; offsetX: number; offsetY: number; targetWidth: number; targetHeight: number }}
 */
const getDisplayMetrics = ({ bgSize, cropArea, canvasRect }) => {
  const targetWidth = cropArea ? cropArea.width : bgSize.width;
  const targetHeight = cropArea ? cropArea.height : bgSize.height;

  const scaleX = canvasRect.width / targetWidth;
  const scaleY = canvasRect.height / targetHeight;
  const scale = Math.min(scaleX, scaleY);

  const offsetX = (canvasRect.width - targetWidth * scale) / 2;
  const offsetY = (canvasRect.height - targetHeight * scale) / 2;

  return { scale, offsetX, offsetY, targetWidth, targetHeight };
};

/**
 * 論理座標系の矩形を、画面上の表示座標系に変換する。
 * @param {{ x: number; y: number; width: number; height: number }} rect
 * @param {{ scale: number; offsetX: number; offsetY: number }} metrics
 * @returns {{ x: number; y: number; width: number; height: number }}
 */
const toDisplayRect = (rect, metrics) => ({
  x: rect.x * metrics.scale + metrics.offsetX,
  y: rect.y * metrics.scale + metrics.offsetY,
  width: rect.width * metrics.scale,
  height: rect.height * metrics.scale,
});

export { getDisplayMetrics, toDisplayRect };
