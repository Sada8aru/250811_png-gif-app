type BgImageType = {
  bgSize: { width: number; height: number };
  cropArea: { x: number; y: number; width: number; height: number } | null;
  canvasRect: DOMRect;
};

type ReturnType = {
  scale: number;
  offsetX: number;
  offsetY: number;
  targetWidth: number;
  targetHeight: number;
};

/**
 * プレビューキャンバス上で背景（もしくはクロップ領域）がどのスケールとオフセットで描画されているかを算出する。
 */
export const getDisplayMetrics = ({ bgSize, cropArea, canvasRect }: BgImageType): ReturnType => {
  const targetWidth = cropArea ? cropArea.width : bgSize.width;
  const targetHeight = cropArea ? cropArea.height : bgSize.height;

  const scaleX = canvasRect.width / targetWidth;
  const scaleY = canvasRect.height / targetHeight;
  const scale = Math.min(scaleX, scaleY);

  const offsetX = (canvasRect.width - targetWidth * scale) / 2;
  const offsetY = (canvasRect.height - targetHeight * scale) / 2;

  return { scale, offsetX, offsetY, targetWidth, targetHeight };
};

type Rect = { x: number; y: number; width: number; height: number };
type Metrics = { scale: number; offsetX: number; offsetY: number };

/**
 * 論理座標系の矩形を、画面上の表示座標系に変換する。
 */
export const toDisplayRect = (rect: Rect, metrics: Metrics): Rect => ({
  x: rect.x * metrics.scale + metrics.offsetX,
  y: rect.y * metrics.scale + metrics.offsetY,
  width: rect.width * metrics.scale,
  height: rect.height * metrics.scale,
});
