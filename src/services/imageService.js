import { GifReader } from "omggif";
import { parseGIF, decompressFrames } from "gifuct-js";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/gif",
  "image/webp",
];

const validateImageFile = (file, { onInvalid } = {}) => {
  if (!IMAGE_TYPES.includes(file.type)) {
    onInvalid?.(
      "対応していないファイル形式です。PNG、JPEG、GIF、WebPファイルを選択してください。"
    );
    return false;
  }

  if (file.size > MAX_FILE_SIZE) {
    onInvalid?.("ファイルサイズが大きすぎます。10MB以下のファイルを選択してください。");
    return false;
  }

  return true;
};

const isGifFile = (file) => file.type === "image/gif";

const loadImage = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error("画像の読み込みに失敗しました"));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error("ファイルの読み込みに失敗しました"));
    reader.readAsDataURL(file);
  });

const createImageData = (file, image) => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d", { willReadFrequently: true });

  canvas.width = image.width;
  canvas.height = image.height;
  ctx.drawImage(image, 0, 0);

  return {
    id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
    file,
    image,
    canvas,
    metadata: {
      width: image.width,
      height: image.height,
      type: file.type,
    },
  };
};

const extractGifFrames = async (file, { fullFrame = true } = {}) => {
  const arrayBuffer = await file.arrayBuffer();
  if (fullFrame) {
    return decodeGif(arrayBuffer);
  }
  return parseGifFrames(arrayBuffer);
};

const assembleFullFrames = async (
  frames,
  gifWidth,
  gifHeight,
  backgroundColor = null
) => {
  const canvas = document.createElement("canvas");
  canvas.width = gifWidth;
  canvas.height = gifHeight;
  const ctx = canvas.getContext("2d");

  if (backgroundColor !== null) {
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, gifWidth, gifHeight);
  } else {
    ctx.clearRect(0, 0, gifWidth, gifHeight);
  }

  const result = [];
  let previousImageData = null;

  for (let i = 0; i < frames.length; i++) {
    const frame = frames[i];

    if (frame.disposalType === 3) {
      previousImageData = ctx.getImageData(0, 0, gifWidth, gifHeight);
    }

    const patchW = frame.dims.width;
    const patchH = frame.dims.height;
    if (patchW > 0 && patchH > 0) {
      const imageData = new ImageData(
        new Uint8ClampedArray(frame.patch),
        patchW,
        patchH
      );

      if (window.createImageBitmap) {
        const bitmap = await createImageBitmap(imageData);
        ctx.drawImage(bitmap, frame.dims.left, frame.dims.top);
        bitmap.close?.();
      } else {
        const tmp = document.createElement("canvas");
        tmp.width = patchW;
        tmp.height = patchH;
        const tctx = tmp.getContext("2d");
        tctx.putImageData(imageData, 0, 0);
        ctx.drawImage(tmp, frame.dims.left, frame.dims.top);
      }
    }

    const frameImage = await new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = canvas.toDataURL("image/png");
    });

    result.push({
      image: frameImage,
      delay: frame.delay ?? 100,
      disposal: frame.disposalType ?? frame.disposal,
    });

    switch (frame.disposalType) {
      case 2:
        if (backgroundColor !== null) {
          ctx.fillStyle = backgroundColor;
          ctx.fillRect(frame.dims.left, frame.dims.top, frame.dims.width, frame.dims.height);
        } else {
          ctx.clearRect(frame.dims.left, frame.dims.top, frame.dims.width, frame.dims.height);
        }
        break;
      case 3:
        if (previousImageData) {
          ctx.putImageData(previousImageData, 0, 0);
        } else {
          ctx.clearRect(frame.dims.left, frame.dims.top, frame.dims.width, frame.dims.height);
        }
        break;
      default:
        break;
    }
  }

  return result;
};

const decodeGif = async (arrayBuffer) => {
  const gif = parseGIF(arrayBuffer);
  const frames = decompressFrames(gif, true);
  const fullFrames = await assembleFullFrames(
    frames,
    gif.lsd.width,
    gif.lsd.height,
    null
  );

  return fullFrames.map((frame) => ({
    image: frame.image,
    delay: frame.delay,
    disposal: frame.disposal,
  }));
};

const parseGifFrames = async (arrayBuffer) => {
  try {
    const uint8Array = new Uint8Array(arrayBuffer);
    const reader = new GifReader(uint8Array);

    const frames = [];
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = reader.width;
    canvas.height = reader.height;

    for (let i = 0; i < reader.numFrames(); i++) {
      const frameInfo = reader.frameInfo(i);
      const imageData = ctx.createImageData(canvas.width, canvas.height);
      reader.decodeAndBlitFrameRGBA(i, imageData.data);
      ctx.putImageData(imageData, 0, 0);

      const frameImage = new Image();
      await new Promise((resolve, reject) => {
        frameImage.onload = resolve;
        frameImage.onerror = reject;
        frameImage.src = canvas.toDataURL("image/png");
      });

      frames.push({
        image: frameImage,
        delay: frameInfo.delay * 10,
        disposal: frameInfo.disposal,
      });
    }

    return frames;
  } catch (error) {
    console.error("GIF解析エラー:", error);
    return parseGifFramesFallback(arrayBuffer);
  }
};

const parseGifFramesFallback = async (arrayBuffer) => {
  const blob = new Blob([arrayBuffer], { type: "image/gif" });
  const url = URL.createObjectURL(blob);

  try {
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);

    const frameImage = new Image();
    await new Promise((resolve, reject) => {
      frameImage.onload = resolve;
      frameImage.onerror = reject;
      frameImage.src = canvas.toDataURL("image/png");
    });

    return [
      {
        image: frameImage,
        delay: 500,
        disposal: 0,
      },
    ];
  } catch (error) {
    console.error("フォールバックGIF処理エラー:", error);
    throw error;
  } finally {
    URL.revokeObjectURL(url);
  }
};

export {
  validateImageFile,
  isGifFile,
  loadImage,
  createImageData,
  extractGifFrames,
};
