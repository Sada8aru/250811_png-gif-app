import GIF from "gif.js";
import { projectState } from "../state/projectState";
import { getDomRefs } from "../ui/domRefs";
import { showError, showSuccess } from "../ui/notifications";
import { calculateTransparentImagePosition } from "../render/previewRenderer";

const exportAsPNG = () => {
  if (
    !projectState.backgroundImage ||
    projectState.transparentImages.length === 0
  ) {
    showError("背景画像と透過画像の両方が必要です");
    return;
  }

  try {
    const exportCanvas = document.createElement("canvas");
    const ctx = exportCanvas.getContext("2d", { willReadFrequently: true });

    const bg = projectState.backgroundImage;
    const transparentImg = projectState.transparentImages[0];
    const scale = projectState.transformState.scale;
    const pos = projectState.transformState.position;
    const cropArea = projectState.transformState.cropArea;

    if (cropArea) {
      exportCanvas.width = cropArea.width;
      exportCanvas.height = cropArea.height;
    } else {
      exportCanvas.width = bg.metadata.width;
      exportCanvas.height = bg.metadata.height;
    }

    if (cropArea) {
      ctx.drawImage(
        bg.image,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        exportCanvas.width,
        exportCanvas.height
      );
    } else {
      ctx.drawImage(bg.image, 0, 0);
    }

    const imagePos = calculateTransparentImagePosition(
      transparentImg,
      scale,
      pos,
      bg,
      cropArea
    );

    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(
      transparentImg.image,
      imagePos.x,
      imagePos.y,
      imagePos.width,
      imagePos.height
    );

    exportCanvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `x-post-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log("PNG エクスポート完了");
        showSuccess("PNG画像をダウンロードしました");
      } else {
        throw new Error("PNG生成に失敗しました");
      }
    }, "image/png");
  } catch (error) {
    console.error("PNG エクスポートエラー:", error);
    showError("PNG エクスポートに失敗しました: " + error.message);
  }
};

const exportAsGIF = () => {
  if (
    !projectState.backgroundImage ||
    projectState.transparentImages.length === 0
  ) {
    showError("背景画像と透過画像の両方が必要です");
    return;
  }

  if (projectState.transparentImages.length === 1) {
    showError(
      "GIF生成には複数の透過画像が必要です。単一画像の場合はPNGをご利用ください。"
    );
    return;
  }

  try {
    console.log("GIF生成開始...");

    const bg = projectState.backgroundImage;
    const scale = projectState.transformState.scale;
    const pos = projectState.transformState.position;
    const cropArea = projectState.transformState.cropArea;

    let canvasWidth;
    let canvasHeight;
    if (cropArea) {
      canvasWidth = cropArea.width;
      canvasHeight = cropArea.height;
    } else {
      canvasWidth = bg.metadata.width;
      canvasHeight = bg.metadata.height;
    }

    const workerScriptUrl = new URL("../gif.worker.js", import.meta.url).href;

    const gif = new GIF({
      workers: 2,
      quality: 15,
      width: canvasWidth,
      height: canvasHeight,
      repeat: 0,
      workerScript: workerScriptUrl,
    });

    const frameCanvas = document.createElement("canvas");
    const ctx = frameCanvas.getContext("2d", { willReadFrequently: true });
    frameCanvas.width = canvasWidth;
    frameCanvas.height = canvasHeight;

    projectState.transparentImages.forEach((transparentImg, index) => {
      try {
        ctx.clearRect(0, 0, canvasWidth, canvasHeight);

        if (cropArea) {
          ctx.drawImage(
            bg.image,
            cropArea.x,
            cropArea.y,
            cropArea.width,
            cropArea.height,
            0,
            0,
            canvasWidth,
            canvasHeight
          );
        } else {
          ctx.drawImage(bg.image, 0, 0);
        }

        const imagePos = calculateTransparentImagePosition(
          transparentImg,
          scale,
          pos,
          bg,
          cropArea
        );

        ctx.imageSmoothingEnabled = false;
        ctx.drawImage(
          transparentImg.image,
          imagePos.x,
          imagePos.y,
          imagePos.width,
          imagePos.height
        );

        gif.addFrame(frameCanvas, {
          copy: true,
          delay: projectState.animationSettings.frameDelay,
        });

        console.log(
          `フレーム ${index + 1}/${projectState.transparentImages.length} 追加完了`
        );
      } catch (frameError) {
        console.error(`フレーム ${index + 1} の処理でエラー:`, frameError);
        throw frameError;
      }
    });

    gif.on("finished", (blob) => {
      try {
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `x-post-animation-${Date.now()}.gif`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        console.log("GIF エクスポート完了");
        showSuccess("GIFアニメーションをダウンロードしました");
      } catch (downloadError) {
        console.error("GIF ダウンロードエラー:", downloadError);
        showError("GIF ダウンロードに失敗しました");
      }
    });

    gif.on("error", (error) => {
      console.error("GIF生成エラー:", error);
      showError("GIF生成中にエラーが発生しました: " + error.message);
    });

    gif.on("progress", (progress) => {
      const percentage = Math.round(progress * 100);
      console.log(`GIF生成進捗: ${percentage}%`);
      if (percentage % 25 === 0) {
        showSuccess(`GIF生成中... ${percentage}%`);
      }
    });

    const timeout = setTimeout(() => {
      console.error("GIF生成がタイムアウトしました");
      showError(
        "GIF生成に時間がかかりすぎています。画像サイズを小さくするか、フレーム数を減らしてください。"
      );
    }, 30000);

    gif.on("finished", () => {
      clearTimeout(timeout);
    });

    gif.render();

    console.log("GIF生成処理を開始しました...");
    showSuccess("GIF生成中です。しばらくお待ちください...");
  } catch (error) {
    console.error("GIF エクスポートエラー:", error);
    showError("GIF エクスポートに失敗しました: " + error.message);
  }
};

const setupExportButtons = () => {
  const { exportPngButton, exportGifButton } = getDomRefs();
  exportPngButton.addEventListener("click", exportAsPNG);
  exportGifButton.addEventListener("click", exportAsGIF);
};

export { exportAsPNG, exportAsGIF, setupExportButtons };
