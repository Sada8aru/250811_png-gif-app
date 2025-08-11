// グローバル状態
let projectState = {
    transparentImages: [],
    transformState: {
        scale: 1,
        position: { x: 0, y: 0 }
    },
    outputSettings: {
        format: 'PNG',
        maxWidth: 1200,
        maxHeight: 675
    },
    animationSettings: {
        frameDelay: 500 // ミリ秒単位でのフレーム間隔
    }
};

// DOM要素の取得
const backgroundDropzone = document.getElementById('backgroundDropzone');
const transparentDropzone = document.getElementById('transparentDropzone');
const backgroundButton = document.getElementById('backgroundButton');
const transparentButton = document.getElementById('transparentButton');
const backgroundInput = document.getElementById('backgroundInput');
const transparentInput = document.getElementById('transparentInput');
const previewContainer = document.getElementById('previewContainer');
const previewCanvas = document.getElementById('previewCanvas');
const previewPlaceholder = document.getElementById('previewPlaceholder');
const boundingBox = document.getElementById('boundingBox');
const cropBox = document.getElementById('cropBox');
const cropModeToggle = document.getElementById('cropModeToggle');
const cropControls = document.getElementById('cropControls');
const scaleInput = document.getElementById('scaleInput');
const aspectRatioSelect = document.getElementById('aspectRatioSelect');
const animationSpeedInput = document.getElementById('animationSpeedInput');
const animationSpeedValue = document.getElementById('animationSpeedValue');
const exportPngButton = document.getElementById('exportPngButton');
const exportGifButton = document.getElementById('exportGifButton');
const errorMessage = document.getElementById('errorMessage');

// エラー表示関数
const showError = (message) => {
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    setTimeout(() => {
        errorMessage.style.display = 'none';
    }, 5000);
};

// ドラッグ&ドロップイベントハンドラー
const setupDragAndDrop = () => {
    // 背景画像のドラッグ&ドロップ
    backgroundDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        backgroundDropzone.classList.add('upload-area__dropzone--dragover');
    });

    backgroundDropzone.addEventListener('dragleave', () => {
        backgroundDropzone.classList.remove('upload-area__dropzone--dragover');
    });

    backgroundDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        backgroundDropzone.classList.remove('upload-area__dropzone--dragover');
        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            handleBackgroundImageUpload(files[0]);
        }
    });

    // 透過画像のドラッグ&ドロップ
    transparentDropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        transparentDropzone.classList.add('upload-area__dropzone--dragover');
    });

    transparentDropzone.addEventListener('dragleave', () => {
        transparentDropzone.classList.remove('upload-area__dropzone--dragover');
    });

    transparentDropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        transparentDropzone.classList.remove('upload-area__dropzone--dragover');
        const files = e.dataTransfer?.files;
        if (files && files.length > 0) {
            handleTransparentImageUpload(files);
        }
    });
};

// ファイル選択ボタンのイベントハンドラー
const setupFileInputs = () => {
    backgroundButton.addEventListener('click', () => {
        backgroundInput.click();
    });

    transparentButton.addEventListener('click', () => {
        transparentInput.click();
    });

    backgroundInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleBackgroundImageUpload(files[0]);
        }
        // ファイル入力をリセット（同じファイルを再選択可能にする）
        e.target.value = '';
    });

    transparentInput.addEventListener('change', (e) => {
        const files = e.target.files;
        if (files && files.length > 0) {
            handleTransparentImageUpload(files);
        }
        // ファイル入力をリセット（同じファイルを再選択可能にする）
        e.target.value = '';
    });
};

// 画像ファイルの検証
const validateImageFile = (file) => {
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
    if (!validTypes.includes(file.type)) {
        showError('対応していないファイル形式です。PNG、JPEG、GIF、WebPファイルを選択してください。');
        return false;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
        showError('ファイルサイズが大きすぎます。10MB以下のファイルを選択してください。');
        return false;
    }

    return true;
};

// GIFファイルかどうかを判定
const isGifFile = (file) => {
    return file.type === 'image/gif';
};

// 画像読み込み関数
const loadImage = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                resolve(img);
            };
            img.onerror = () => {
                reject(new Error('画像の読み込みに失敗しました'));
            };
            img.src = e.target.result;
        };
        reader.onerror = () => {
            reject(new Error('ファイルの読み込みに失敗しました'));
        };
        reader.readAsDataURL(file);
    });
};

// ImageDataオブジェクトの作成
const createImageData = (file, image) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    canvas.width = image.width;
    canvas.height = image.height;
    ctx.drawImage(image, 0, 0);

    return {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 11),
        file: file,
        image: image,
        canvas: canvas,
        metadata: {
            width: image.width,
            height: image.height,
            type: file.type
        }
    };
};

// GIFファイルからフレームを抽出する関数
const extractGifFrames = async (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const arrayBuffer = e.target.result;
                const frames = await parseGifFrames(arrayBuffer);
                resolve(frames);
            } catch (error) {
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('GIFファイルの読み込みに失敗しました'));
        reader.readAsArrayBuffer(file);
    });
};

// GIFフレームをパースする関数（本格実装）
const parseGifFrames = async (arrayBuffer) => {
    try {
        const uint8Array = new Uint8Array(arrayBuffer);
        const reader = new GifReader(uint8Array);

        const frames = [];
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        canvas.width = reader.width;
        canvas.height = reader.height;

        // 各フレームを抽出
        for (let i = 0; i < reader.numFrames(); i++) {
            const frameInfo = reader.frameInfo(i);
            const imageData = ctx.createImageData(canvas.width, canvas.height);

            // フレームデータを取得
            reader.decodeAndBlitFrameRGBA(i, imageData.data);

            // キャンバスに描画
            ctx.putImageData(imageData, 0, 0);

            // フレームをImageオブジェクトとして保存
            const frameImage = new Image();
            await new Promise((resolve, reject) => {
                frameImage.onload = resolve;
                frameImage.onerror = reject;
                frameImage.src = canvas.toDataURL('image/png');
            });

            frames.push({
                image: frameImage,
                delay: frameInfo.delay * 10, // centiseconds to milliseconds
                disposal: frameInfo.disposal
            });

            console.log(`フレーム ${i + 1}/${reader.numFrames()} 抽出完了 (delay: ${frameInfo.delay * 10}ms)`);
        }

        return frames;
    } catch (error) {
        console.error('GIF解析エラー:', error);
        // フォールバック：通常の画像として処理
        return await parseGifFramesFallback(arrayBuffer);
    }
};

// フォールバック用の簡易GIF処理
const parseGifFramesFallback = async (arrayBuffer) => {
    const blob = new Blob([arrayBuffer], { type: 'image/gif' });
    const url = URL.createObjectURL(blob);

    try {
        const img = new Image();
        await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = url;
        });

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        const frameImage = new Image();
        await new Promise((resolve, reject) => {
            frameImage.onload = resolve;
            frameImage.onerror = reject;
            frameImage.src = canvas.toDataURL('image/png');
        });

        return [{
            image: frameImage,
            delay: 500, // デフォルト500ms
            disposal: 0
        }];
    } catch (error) {
        console.error('フォールバックGIF処理エラー:', error);
        throw error;
    } finally {
        URL.revokeObjectURL(url);
    }
};

// アニメーションプレビュー用の変数
let animationInterval = null;
let currentFrameIndex = 0;

// バウンディングボックス操作用の変数
let isDragging = false;
let isResizing = false;
let dragStartX = 0;
let dragStartY = 0;
let resizeHandle = null;
let originalBounds = null;
let accumulatedScale = 0; // 累積的なスケール変化を追跡

// トリミング操作用の変数
let isCropDragging = false;
let isCropResizing = false;
let cropResizeHandle = null;
let cropOriginalBounds = null;
let cropAccumulatedDelta = { x: 0, y: 0 }; // 累積的な変化を追跡

// 操作モード管理
let isCropMode = false;

// バウンディングボックスの選択状態管理
let isBoundingBoxSelected = false;
let boundingBoxFadeTimer = null;

// モード切り替え機能
const toggleCropMode = () => {
    isCropMode = !isCropMode;

    if (isCropMode) {
        cropModeToggle.textContent = '✏️ 編集モード';
        cropModeToggle.classList.add('active');
        cropControls.style.display = 'block';

        // バウンディングボックスを非表示し、選択状態をリセット
        boundingBox.style.display = 'none';
        isBoundingBoxSelected = false;

        // トリミングモード開始時：背景画像サイズを固定してプレビューを表示
        const bg = projectState.backgroundImage;
        if (bg) {
            previewCanvas.width = bg.metadata.width;
            previewCanvas.height = bg.metadata.height;

            // 背景画像と透過画像を表示
            renderCropModePreview();
        }

        // トリミング枠を表示
        updateCropBox();
    } else {
        cropModeToggle.textContent = '📐 トリミングモード';
        cropModeToggle.classList.remove('active');
        cropControls.style.display = 'none';

        // トリミング枠を非表示
        cropBox.style.display = 'none';

        // 編集モードに戻る時：トリミングを確定してプレビューを更新
        console.log('トリミングを確定しました');

        // 編集モードに戻る時は選択状態をリセット
        isBoundingBoxSelected = false;

        // バウンディングボックスを更新（選択状態に応じて表示・非表示）
        updateBoundingBox();
        updatePreview();
    }
};

// バウンディングボックスを一時的に表示する関数
const showBoundingBoxTemporarily = (duration = 1000) => {
    // 既存のタイマーをクリア
    if (boundingBoxFadeTimer) {
        clearTimeout(boundingBoxFadeTimer);
        boundingBoxFadeTimer = null;
    }

    // バウンディングボックスを表示
    isBoundingBoxSelected = true;
    updateBoundingBox();

    // 指定時間後に非表示
    boundingBoxFadeTimer = setTimeout(() => {
        isBoundingBoxSelected = false;
        updateBoundingBox();
        boundingBoxFadeTimer = null;
    }, duration);
};

// バウンディングボックスの表示・更新
const updateBoundingBox = () => {
    if (!projectState.backgroundImage || projectState.transparentImages.length === 0 || isCropMode || !isBoundingBoxSelected) {
        boundingBox.style.display = 'none';
        return;
    }

    const bg = projectState.backgroundImage;
    const transparentImg = projectState.transparentImages[0]; // 最初の透過画像を基準
    const scale = projectState.transformState.scale;
    const pos = projectState.transformState.position;
    const cropArea = projectState.transformState.cropArea;

    // プレビューコンテナのサイズを取得
    const canvasRect = previewCanvas.getBoundingClientRect();

    // 統一的な位置計算を使用（透過画像と同じロジック）
    const imagePos = calculateTransparentImagePosition(transparentImg, scale, pos, bg, cropArea);

    // トリミング領域を考慮したキャンバス表示設定
    let actualScale, canvasOffsetX, canvasOffsetY;

    if (cropArea) {
        // トリミング後の場合
        const scaleX = canvasRect.width / cropArea.width;
        const scaleY = canvasRect.height / cropArea.height;
        actualScale = Math.min(scaleX, scaleY);

        // キャンバスの位置オフセットを計算
        canvasOffsetX = (canvasRect.width - cropArea.width * actualScale) / 2;
        canvasOffsetY = (canvasRect.height - cropArea.height * actualScale) / 2;
    } else {
        // トリミングなしの場合
        const scaleX = canvasRect.width / bg.metadata.width;
        const scaleY = canvasRect.height / bg.metadata.height;
        actualScale = Math.min(scaleX, scaleY);

        // キャンバスの位置オフセットを計算
        canvasOffsetX = (canvasRect.width - bg.metadata.width * actualScale) / 2;
        canvasOffsetY = (canvasRect.height - bg.metadata.height * actualScale) / 2;
    }

    // プレビューコンテナ内での位置とサイズに変換
    const displayX = imagePos.x * actualScale;
    const displayY = imagePos.y * actualScale;
    const displayWidth = imagePos.width * actualScale;
    const displayHeight = imagePos.height * actualScale;

    // バウンディングボックスの位置とサイズを設定
    boundingBox.style.display = 'block';
    boundingBox.style.left = (displayX + canvasOffsetX) + 'px';
    boundingBox.style.top = (displayY + canvasOffsetY) + 'px';
    boundingBox.style.width = displayWidth + 'px';
    boundingBox.style.height = displayHeight + 'px';
};

// バウンディングボックスのドラッグ開始
const startDrag = (e) => {
    if (e.target.classList.contains('bounding-box__handle')) {
        // リサイズハンドルの場合
        isResizing = true;
        resizeHandle = e.target;
        originalBounds = {
            left: parseInt(boundingBox.style.left),
            top: parseInt(boundingBox.style.top),
            width: parseInt(boundingBox.style.width),
            height: parseInt(boundingBox.style.height)
        };
    } else {
        // バウンディングボックス本体の場合（移動）
        isDragging = true;
    }

    dragStartX = e.clientX;
    dragStartY = e.clientY;

    e.preventDefault();
    e.stopPropagation();
};

// バウンディングボックスのドラッグ処理
const handleDrag = (e) => {
    if (!isDragging && !isResizing) return;

    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;

    if (isDragging) {
        // 位置の移動
        const bg = projectState.backgroundImage;
        const cropArea = projectState.transformState.cropArea;
        const canvasRect = previewCanvas.getBoundingClientRect();

        // スケール比率を計算（トリミング考慮）
        let actualScale;
        if (cropArea) {
            const scaleX = canvasRect.width / cropArea.width;
            const scaleY = canvasRect.height / cropArea.height;
            actualScale = Math.min(scaleX, scaleY);
        } else {
            const scaleX = canvasRect.width / bg.metadata.width;
            const scaleY = canvasRect.height / bg.metadata.height;
            actualScale = Math.min(scaleX, scaleY);
        }

        // 実際の画像座標での移動量に変換
        const moveX = deltaX / actualScale;
        const moveY = deltaY / actualScale;

        // 位置を更新
        projectState.transformState.position.x += moveX;
        projectState.transformState.position.y += moveY;

        // プレビューを更新
        updatePreview();

    } else if (isResizing && resizeHandle) {
        // サイズの変更 - ハンドルの種類に応じた処理
        const bg = projectState.backgroundImage;
        const transparentImg = projectState.transparentImages[0];
        const canvasRect = previewCanvas.getBoundingClientRect();

        // スケール比率を計算
        const scaleX = canvasRect.width / bg.metadata.width;
        const scaleY = canvasRect.height / bg.metadata.height;
        const actualScale = Math.min(scaleX, scaleY);

        // ハンドルの種類を判定
        const handleClass = resizeHandle.className;
        let scaleDelta = 0;

        if (handleClass.includes('--nw')) {
            // 左上ハンドル: 左に引っ張ると拡大、右に引っ張ると縮小
            scaleDelta = -deltaX;
        } else if (handleClass.includes('--ne')) {
            // 右上ハンドル: 右に引っ張ると拡大、左に引っ張ると縮小
            scaleDelta = deltaX;
        } else if (handleClass.includes('--sw')) {
            // 左下ハンドル: 左に引っ張ると拡大、右に引っ張ると縮小
            scaleDelta = -deltaX;
        } else if (handleClass.includes('--se')) {
            // 右下ハンドル: 右に引っ張ると拡大、左に引っ張ると縮小
            scaleDelta = deltaX;
        }

        // 累積的なスケール変化を追跡
        const sensitivity = 0.1; // 感度を上げる
        accumulatedScale += scaleDelta * sensitivity;

        // 整数倍率に変換
        const baseScale = projectState.transformState.scale;
        const targetScale = Math.max(1, Math.round(baseScale + accumulatedScale));

        // 倍率を更新
        if (targetScale !== projectState.transformState.scale) {
            projectState.transformState.scale = targetScale;
            scaleInput.value = targetScale;
            updatePreview();

            // 累積値をリセット（整数倍率に達したら）
            accumulatedScale = 0;
        }
    }

    dragStartX = e.clientX;
    dragStartY = e.clientY;
};

// バウンディングボックスのドラッグ終了
const endDrag = () => {
    isDragging = false;
    isResizing = false;
    resizeHandle = null;
    originalBounds = null;
    accumulatedScale = 0; // 累積値をリセット
};

// バウンディングボックスのイベントリスナー設定
const setupBoundingBox = () => {
    boundingBox.addEventListener('mousedown', startDrag);

    document.addEventListener('mousemove', handleDrag);
    document.addEventListener('mouseup', endDrag);

    // タッチイベントにも対応
    boundingBox.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        startDrag(mouseEvent);
        e.preventDefault();
    });

    document.addEventListener('touchmove', (e) => {
        if (isDragging || isResizing) {
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            handleDrag(mouseEvent);
            e.preventDefault();
        }
    });

    document.addEventListener('touchend', endDrag);
};

// アスペクト比の計算
const getAspectRatio = (ratio) => {
    switch (ratio) {
        case '1:1': return 1;
        case '16:9': return 16 / 9;
        case '4:3': return 4 / 3;
        case 'free': return null; // 自由形式は比率なし
        case 'original':
        default:
            return projectState.backgroundImage ?
                projectState.backgroundImage.metadata.width / projectState.backgroundImage.metadata.height : 1;
    }
};

// トリミング枠の表示・更新（表示のみ、背景画像は変更しない）
const updateCropBox = () => {
    if (!projectState.backgroundImage || !isCropMode) {
        cropBox.style.display = 'none';
        return;
    }

    const bg = projectState.backgroundImage;
    const canvasRect = previewCanvas.getBoundingClientRect();

    // キャンバス内での実際のサイズ比率を計算
    const scaleX = canvasRect.width / bg.metadata.width;
    const scaleY = canvasRect.height / bg.metadata.height;
    const actualScale = Math.min(scaleX, scaleY);

    // 既存のトリミング領域があるかチェック
    let cropArea = projectState.transformState.cropArea;

    // トリミング領域がない場合、アスペクト比に応じて初期化
    if (!cropArea) {
        if (projectState.transformState.aspectRatio === 'original' || projectState.transformState.aspectRatio === 'free') {
            // 背景画像全体をトリミング領域とする
            cropArea = {
                x: 0,
                y: 0,
                width: bg.metadata.width,
                height: bg.metadata.height
            };
        } else {
            // 固定アスペクト比の場合、中央に配置
            const targetRatio = getAspectRatio(projectState.transformState.aspectRatio);
            const bgRatio = bg.metadata.width / bg.metadata.height;

            let cropWidth, cropHeight;
            if (targetRatio > bgRatio) {
                cropWidth = bg.metadata.width;
                cropHeight = cropWidth / targetRatio;
            } else {
                cropHeight = bg.metadata.height;
                cropWidth = cropHeight * targetRatio;
            }

            cropArea = {
                x: (bg.metadata.width - cropWidth) / 2,
                y: (bg.metadata.height - cropHeight) / 2,
                width: cropWidth,
                height: cropHeight
            };
        }

        // 状態に保存
        projectState.transformState.cropArea = cropArea;
    }

    // プレビューコンテナ内での位置とサイズに変換
    const displayX = cropArea.x * actualScale;
    const displayY = cropArea.y * actualScale;
    const displayWidth = cropArea.width * actualScale;
    const displayHeight = cropArea.height * actualScale;

    // キャンバスの位置オフセットを計算
    const canvasOffsetX = (canvasRect.width - bg.metadata.width * actualScale) / 2;
    const canvasOffsetY = (canvasRect.height - bg.metadata.height * actualScale) / 2;

    // トリミング枠の位置とサイズを設定
    cropBox.style.display = 'block';
    cropBox.style.left = (displayX + canvasOffsetX) + 'px';
    cropBox.style.top = (displayY + canvasOffsetY) + 'px';
    cropBox.style.width = displayWidth + 'px';
    cropBox.style.height = displayHeight + 'px';
};

// トリミング枠のドラッグ開始
const startCropDrag = (e) => {
    if (e.target.classList.contains('crop-box__handle')) {
        // リサイズハンドルの場合
        isCropResizing = true;
        cropResizeHandle = e.target;
        cropOriginalBounds = {
            left: parseInt(cropBox.style.left),
            top: parseInt(cropBox.style.top),
            width: parseInt(cropBox.style.width),
            height: parseInt(cropBox.style.height)
        };
    } else {
        // トリミング枠本体の場合（移動）
        isCropDragging = true;
    }

    dragStartX = e.clientX;
    dragStartY = e.clientY;

    e.preventDefault();
    e.stopPropagation();
};

// トリミング枠のドラッグ処理
const handleCropDrag = (e) => {
    if (!isCropDragging && !isCropResizing) return;

    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;

    if (isCropDragging) {
        // 位置の移動
        const bg = projectState.backgroundImage;
        const canvasRect = previewCanvas.getBoundingClientRect();

        // スケール比率を計算
        const scaleX = canvasRect.width / bg.metadata.width;
        const scaleY = canvasRect.height / bg.metadata.height;
        const actualScale = Math.min(scaleX, scaleY);

        // 実際の画像座標での移動量に変換
        const moveX = deltaX / actualScale;
        const moveY = deltaY / actualScale;

        // 現在のトリミング領域を取得
        const cropArea = projectState.transformState.cropArea;
        if (!cropArea) return;

        // 新しい位置を計算（境界チェック付き）
        const newX = Math.max(0, Math.min(bg.metadata.width - cropArea.width, cropArea.x + moveX));
        const newY = Math.max(0, Math.min(bg.metadata.height - cropArea.height, cropArea.y + moveY));

        // トリミング領域を更新
        projectState.transformState.cropArea.x = newX;
        projectState.transformState.cropArea.y = newY;

        // トリミング枠の表示を更新し、透過画像も再描画
        updateCropBox();
        renderCropModePreview();

    } else if (isCropResizing && cropResizeHandle) {
        // サイズの変更 - アスペクト比に応じて動作を分岐
        const bg = projectState.backgroundImage;
        const canvasRect = previewCanvas.getBoundingClientRect();
        const aspectRatio = projectState.transformState.aspectRatio;

        // スケール比率を計算
        const scaleX = canvasRect.width / bg.metadata.width;
        const scaleY = canvasRect.height / bg.metadata.height;
        const actualScale = Math.min(scaleX, scaleY);

        // 感度を調整（より精密な操作のため）
        const sensitivity = 1.2;
        const adjustedDeltaX = deltaX * sensitivity;
        const adjustedDeltaY = deltaY * sensitivity;

        // ハンドルの種類を取得
        const handleClass = cropResizeHandle.className;
        const cropArea = projectState.transformState.cropArea;
        if (!cropArea) return;

        // 実際の画像座標での変化量に変換
        const deltaRealX = adjustedDeltaX / actualScale;
        const deltaRealY = adjustedDeltaY / actualScale;

        if (aspectRatio === 'free') {
            // 自由形式モード: ハンドルに応じて自由にリサイズ
            let newX = cropArea.x;
            let newY = cropArea.y;
            let newWidth = cropArea.width;
            let newHeight = cropArea.height;

            if (handleClass.includes('--nw')) {
                // 左上ハンドル: 自由に移動
                newX = Math.max(0, cropArea.x + deltaRealX);
                newY = Math.max(0, cropArea.y + deltaRealY);
                newWidth = Math.max(20, cropArea.width - deltaRealX);
                newHeight = Math.max(20, cropArea.height - deltaRealY);
            } else if (handleClass.includes('--ne')) {
                // 右上ハンドル: 自由に移動
                newY = Math.max(0, cropArea.y + deltaRealY);
                newWidth = Math.max(20, cropArea.width + deltaRealX);
                newHeight = Math.max(20, cropArea.height - deltaRealY);
            } else if (handleClass.includes('--sw')) {
                // 左下ハンドル: 自由に移動
                newX = Math.max(0, cropArea.x + deltaRealX);
                newWidth = Math.max(20, cropArea.width - deltaRealX);
                newHeight = Math.max(20, cropArea.height + deltaRealY);
            } else if (handleClass.includes('--se')) {
                // 右下ハンドル: 自由に移動
                newWidth = Math.max(20, cropArea.width + deltaRealX);
                newHeight = Math.max(20, cropArea.height + deltaRealY);
            } else if (handleClass.includes('--n')) {
                // 上辺ハンドル: 垂直方向のみ
                newY = Math.max(0, cropArea.y + deltaRealY);
                newHeight = Math.max(20, cropArea.height - deltaRealY);
            } else if (handleClass.includes('--s')) {
                // 下辺ハンドル: 垂直方向のみ
                newHeight = Math.max(20, cropArea.height + deltaRealY);
            } else if (handleClass.includes('--w')) {
                // 左辺ハンドル: 水平方向のみ
                newX = Math.max(0, cropArea.x + deltaRealX);
                newWidth = Math.max(20, cropArea.width - deltaRealX);
            } else if (handleClass.includes('--e')) {
                // 右辺ハンドル: 水平方向のみ
                newWidth = Math.max(20, cropArea.width + deltaRealX);
            }

            // 境界チェック
            newX = Math.max(0, newX);
            newY = Math.max(0, newY);
            newWidth = Math.min(newWidth, bg.metadata.width - newX);
            newHeight = Math.min(newHeight, bg.metadata.height - newY);

            // トリミング領域を更新
            projectState.transformState.cropArea = {
                x: newX,
                y: newY,
                width: newWidth,
                height: newHeight
            };

        } else {
            // 固定アスペクト比モード: 反対側のハンドルに向かって拡縮
            const targetRatio = getAspectRatio(aspectRatio);
            const centerX = cropArea.x + cropArea.width / 2;
            const centerY = cropArea.y + cropArea.height / 2;

            // 変化量の大きい方向を基準にサイズを決定
            let sizeChange = 0;
            if (handleClass.includes('--nw')) {
                // 左上ハンドル: 左上に引っ張ると拡大
                sizeChange = -(deltaRealX + deltaRealY) / 2;
            } else if (handleClass.includes('--ne')) {
                // 右上ハンドル: 右に引っ張って上に引っ張ると拡大
                sizeChange = (deltaRealX - deltaRealY) / 2;
            } else if (handleClass.includes('--sw')) {
                // 左下ハンドル: 左に引っ張って下に引っ張ると拡大
                sizeChange = (-deltaRealX + deltaRealY) / 2;
            } else if (handleClass.includes('--se')) {
                // 右下ハンドル: 右下に引っ張ると拡大
                sizeChange = (deltaRealX + deltaRealY) / 2;
            } else if (handleClass.includes('--n')) {
                // 上辺ハンドル: 上に引っ張ると拡大
                sizeChange = -deltaRealY;
            } else if (handleClass.includes('--s')) {
                // 下辺ハンドル: 下に引っ張ると拡大
                sizeChange = deltaRealY;
            } else if (handleClass.includes('--w')) {
                // 左辺ハンドル: 左に引っ張ると拡大
                sizeChange = -deltaRealX;
            } else if (handleClass.includes('--e')) {
                // 右辺ハンドル: 右に引っ張ると拡大
                sizeChange = deltaRealX;
            }

            // 新しいサイズを計算（より精密な操作のため倍率を調整）
            let newWidth = Math.max(20, cropArea.width + sizeChange);
            let newHeight = newWidth / targetRatio;

            // 境界チェック
            newWidth = Math.min(newWidth, bg.metadata.width);
            newHeight = Math.min(newHeight, bg.metadata.height);

            // アスペクト比を維持
            if (newWidth / newHeight > targetRatio) {
                newWidth = newHeight * targetRatio;
            } else {
                newHeight = newWidth / targetRatio;
            }

            // 中央を基準に位置を調整
            const newX = Math.max(0, Math.min(bg.metadata.width - newWidth, centerX - newWidth / 2));
            const newY = Math.max(0, Math.min(bg.metadata.height - newHeight, centerY - newHeight / 2));

            // トリミング領域を更新
            projectState.transformState.cropArea = {
                x: newX,
                y: newY,
                width: newWidth,
                height: newHeight
            };
        }

        // トリミング枠の表示を更新し、透過画像も再描画
        updateCropBox();
        renderCropModePreview();
    }

    dragStartX = e.clientX;
    dragStartY = e.clientY;
};

// トリミング枠のドラッグ終了
const endCropDrag = () => {
    isCropDragging = false;
    isCropResizing = false;
    cropResizeHandle = null;
    cropOriginalBounds = null;
    cropAccumulatedDelta = { x: 0, y: 0 }; // 累積値をリセット

    // トリミングモード中はプレビューを更新しない（背景画像サイズ固定のため）
    // 編集モードに戻った時に確定される
};

// トリミング枠のイベントリスナー設定
const setupCropBox = () => {
    cropBox.addEventListener('mousedown', startCropDrag);

    document.addEventListener('mousemove', handleCropDrag);
    document.addEventListener('mouseup', endCropDrag);

    // タッチイベントにも対応
    cropBox.addEventListener('touchstart', (e) => {
        const touch = e.touches[0];
        const mouseEvent = new MouseEvent('mousedown', {
            clientX: touch.clientX,
            clientY: touch.clientY
        });
        startCropDrag(mouseEvent);
        e.preventDefault();
    });

    document.addEventListener('touchmove', (e) => {
        if (isCropDragging || isCropResizing) {
            const touch = e.touches[0];
            const mouseEvent = new MouseEvent('mousemove', {
                clientX: touch.clientX,
                clientY: touch.clientY
            });
            handleCropDrag(mouseEvent);
            e.preventDefault();
        }
    });

    document.addEventListener('touchend', endCropDrag);
};

// プレビューキャンバスのクリック処理
const setupCanvasClick = () => {
    previewCanvas.addEventListener('click', (e) => {
        // トリミングモード中は処理しない
        if (isCropMode) return;

        // 透過画像がない場合は処理しない
        if (projectState.transparentImages.length === 0) return;

        const canvasRect = previewCanvas.getBoundingClientRect();
        const clickX = e.clientX - canvasRect.left;
        const clickY = e.clientY - canvasRect.top;

        // 透過画像の位置とサイズを取得
        const bg = projectState.backgroundImage;
        const transparentImg = projectState.transparentImages[0];
        const scale = projectState.transformState.scale;
        const pos = projectState.transformState.position;
        const cropArea = projectState.transformState.cropArea;

        if (!bg || !transparentImg) return;

        // 統一的な位置計算を使用
        const imagePos = calculateTransparentImagePosition(transparentImg, scale, pos, bg, cropArea);

        // キャンバス表示スケールを計算
        let actualScale;
        if (cropArea) {
            const scaleX = canvasRect.width / cropArea.width;
            const scaleY = canvasRect.height / cropArea.height;
            actualScale = Math.min(scaleX, scaleY);
        } else {
            const scaleX = canvasRect.width / bg.metadata.width;
            const scaleY = canvasRect.height / bg.metadata.height;
            actualScale = Math.min(scaleX, scaleY);
        }

        // キャンバスオフセットを計算
        let canvasOffsetX, canvasOffsetY;
        if (cropArea) {
            canvasOffsetX = (canvasRect.width - cropArea.width * actualScale) / 2;
            canvasOffsetY = (canvasRect.height - cropArea.height * actualScale) / 2;
        } else {
            canvasOffsetX = (canvasRect.width - bg.metadata.width * actualScale) / 2;
            canvasOffsetY = (canvasRect.height - bg.metadata.height * actualScale) / 2;
        }

        // 透過画像の表示位置とサイズ
        const displayX = imagePos.x * actualScale + canvasOffsetX;
        const displayY = imagePos.y * actualScale + canvasOffsetY;
        const displayWidth = imagePos.width * actualScale;
        const displayHeight = imagePos.height * actualScale;

        // クリック位置が透過画像内かチェック
        const isInsideImage = clickX >= displayX && clickX <= displayX + displayWidth &&
            clickY >= displayY && clickY <= displayY + displayHeight;

        if (isInsideImage) {
            // 透過画像をクリックした場合：バウンディングボックスを表示
            isBoundingBoxSelected = true;
        } else {
            // 透過画像以外をクリックした場合：バウンディングボックスを非表示
            isBoundingBoxSelected = false;
        }

        // バウンディングボックスを更新
        updateBoundingBox();
    });
};

// ウィンドウリサイズ処理
const setupWindowResize = () => {
    let resizeTimeout;

    const handleResize = () => {
        // デバウンス処理：リサイズイベントが連続で発生するのを防ぐ
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            console.log('ウィンドウリサイズ検出 - UI要素を更新中...');

            // 画像が読み込まれている場合のみ更新処理を実行
            if (projectState.backgroundImage) {
                // プレビューを更新（キャンバスサイズの再計算）
                updatePreview();

                // バウンディングボックスの位置を再計算
                if (projectState.transparentImages.length > 0) {
                    // リサイズ時は一時的にバウンディングボックスを表示して位置確認を可能にする
                    const wasSelected = isBoundingBoxSelected;
                    if (!isCropMode && !wasSelected) {
                        showBoundingBoxTemporarily(2000); // 2秒間表示
                    } else {
                        updateBoundingBox();
                    }
                }

                // トリミングモード中の場合、トリミング枠も更新
                if (isCropMode) {
                    updateCropBox();
                }
            }

            console.log('ウィンドウリサイズ対応完了');
        }, 150); // 150ms後に実行（デバウンス時間を少し長めに）
    };

    // リサイズイベントリスナーを追加
    window.addEventListener('resize', handleResize);

    // オリエンテーション変更にも対応（モバイル対応）
    window.addEventListener('orientationchange', () => {
        // オリエンテーション変更後は少し遅延してから処理
        setTimeout(handleResize, 300);
    });
};

// 透過画像の位置を統一的に計算する関数
const calculateTransparentImagePosition = (transparentImg, scale, pos, bg, cropArea = null) => {
    const scaledWidth = transparentImg.metadata.width * scale;
    const scaledHeight = transparentImg.metadata.height * scale;

    console.log('calculateTransparentImagePosition:', {
        posX: pos.x,
        posY: pos.y,
        bgWidth: bg.metadata.width,
        bgHeight: bg.metadata.height,
        scaledWidth: scaledWidth,
        scaledHeight: scaledHeight,
        cropArea: cropArea
    });

    // 背景画像の元の座標系を基準とした位置計算
    // pos.x, pos.yは中央からのオフセット値
    const baseX = pos.x + (bg.metadata.width - scaledWidth) / 2;
    const baseY = pos.y + (bg.metadata.height - scaledHeight) / 2;

    console.log('basePosition:', { baseX, baseY });

    // トリミング領域がある場合は、その領域内での相対位置に変換
    if (cropArea) {
        // トリミング領域内での相対位置を計算
        const relativeX = baseX - cropArea.x;
        const relativeY = baseY - cropArea.y;

        console.log('cropAreaCalculation:', {
            baseX, baseY,
            cropX: cropArea.x, cropY: cropArea.y,
            relativeX, relativeY
        });

        return {
            x: relativeX,
            y: relativeY,
            width: scaledWidth,
            height: scaledHeight,
            // デバッグ用の情報も含める
            baseX: baseX,
            baseY: baseY,
            cropOffsetX: cropArea.x,
            cropOffsetY: cropArea.y
        };
    }

    return {
        x: baseX,
        y: baseY,
        width: scaledWidth,
        height: scaledHeight
    };
};

// トリミングモード専用のプレビュー描画
const renderCropModePreview = () => {
    if (!projectState.backgroundImage) return;

    const bg = projectState.backgroundImage;
    const ctx = previewCanvas.getContext('2d', { willReadFrequently: true });

    // キャンバスをクリア
    ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

    // 背景画像を描画
    ctx.drawImage(bg.image, 0, 0);

    // 透過画像がある場合は描画
    if (projectState.transparentImages.length > 0) {
        const transparentImg = projectState.transparentImages[0]; // 最初の透過画像を使用
        const scale = projectState.transformState.scale;
        const pos = projectState.transformState.position;
        const cropArea = projectState.transformState.cropArea;

        // トリミングモード専用の位置計算
        const scaledWidth = transparentImg.metadata.width * scale;
        const scaledHeight = transparentImg.metadata.height * scale;

        // pos.x, pos.yは中央からのオフセット値
        // 背景画像の元座標系での絶対位置を計算
        const absoluteX = pos.x + (bg.metadata.width - scaledWidth) / 2;
        const absoluteY = pos.y + (bg.metadata.height - scaledHeight) / 2;

        console.log('トリミングモード描画:', {
            posX: pos.x,
            posY: pos.y,
            bgWidth: bg.metadata.width,
            bgHeight: bg.metadata.height,
            scaledWidth: scaledWidth,
            scaledHeight: scaledHeight,
            absoluteX: absoluteX,
            absoluteY: absoluteY,
            cropArea: cropArea
        });

        // ピクセルパーフェクト描画の設定
        ctx.imageSmoothingEnabled = false;

        ctx.drawImage(
            transparentImg.image,
            absoluteX, absoluteY,
            scaledWidth, scaledHeight
        );
    }
};

// プレビューの更新
const updatePreview = () => {
    if (!projectState.backgroundImage) {
        // 背景画像がない場合はプレースホルダーを表示
        previewCanvas.style.display = 'none';
        previewPlaceholder.style.display = 'flex';

        // エクスポートボタンを無効化
        exportPngButton.disabled = true;
        exportGifButton.disabled = true;
        return;
    }

    const bg = projectState.backgroundImage;
    const ctx = previewCanvas.getContext('2d', { willReadFrequently: true });
    const cropArea = projectState.transformState.cropArea;

    // キャンバスサイズの設定
    if (isCropMode) {
        // トリミングモード中は背景画像の元サイズを完全に固定
        previewCanvas.width = bg.metadata.width;
        previewCanvas.height = bg.metadata.height;

        // トリミングモード中は専用の描画関数を使用
        renderCropModePreview();
        return;
    } else {
        // 編集モード中はトリミング領域がある場合はそのサイズに調整
        if (cropArea) {
            previewCanvas.width = cropArea.width;
            previewCanvas.height = cropArea.height;
        } else {
            previewCanvas.width = bg.metadata.width;
            previewCanvas.height = bg.metadata.height;
        }
    }

    // 既存のアニメーションを停止
    if (animationInterval) {
        clearInterval(animationInterval);
        animationInterval = null;
    }

    // 透過画像が複数ある場合はアニメーション
    if (projectState.transparentImages.length > 1) {
        currentFrameIndex = 0;

        const renderFrame = () => {
            // キャンバスをクリア
            ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

            // 背景画像を描画
            if (isCropMode) {
                // トリミングモード中は元の背景画像をそのまま描画
                ctx.drawImage(bg.image, 0, 0);
            } else {
                // 編集モード中はトリミング考慮
                if (cropArea) {
                    ctx.drawImage(
                        bg.image,
                        cropArea.x, cropArea.y, cropArea.width, cropArea.height,
                        0, 0, previewCanvas.width, previewCanvas.height
                    );
                } else {
                    ctx.drawImage(bg.image, 0, 0);
                }
            }

            // 現在のフレームの透過画像を描画
            const currentFrame = projectState.transparentImages[currentFrameIndex];
            if (currentFrame) {
                const scale = projectState.transformState.scale;
                const pos = projectState.transformState.position;

                // 統一的な位置計算を使用
                const imagePos = calculateTransparentImagePosition(currentFrame, scale, pos, bg, cropArea);

                // ピクセルパーフェクト描画の設定
                ctx.imageSmoothingEnabled = false;

                ctx.drawImage(
                    currentFrame.image,
                    imagePos.x, imagePos.y,
                    imagePos.width, imagePos.height
                );
            }

            // 次のフレームに進む
            currentFrameIndex = (currentFrameIndex + 1) % projectState.transparentImages.length;
        };

        // 初回描画
        renderFrame();

        // アニメーション開始（設定された間隔）
        animationInterval = setInterval(renderFrame, projectState.animationSettings.frameDelay);

    } else if (projectState.transparentImages.length === 1) {
        // 単一の透過画像の場合
        ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

        // 背景画像を描画（トリミング考慮）
        if (cropArea) {
            ctx.drawImage(
                bg.image,
                cropArea.x, cropArea.y, cropArea.width, cropArea.height,
                0, 0, previewCanvas.width, previewCanvas.height
            );
        } else {
            ctx.drawImage(bg.image, 0, 0);
        }

        const transparentImg = projectState.transparentImages[0];
        const scale = projectState.transformState.scale;
        const pos = projectState.transformState.position;

        // 統一的な位置計算を使用
        const imagePos = calculateTransparentImagePosition(transparentImg, scale, pos, bg, cropArea);

        // ピクセルパーフェクト描画の設定
        ctx.imageSmoothingEnabled = false;

        ctx.drawImage(
            transparentImg.image,
            imagePos.x, imagePos.y,
            imagePos.width, imagePos.height
        );
    } else {
        // 透過画像がない場合は背景のみ
        ctx.clearRect(0, 0, previewCanvas.width, previewCanvas.height);

        // 背景画像を描画（トリミング考慮）
        if (cropArea) {
            ctx.drawImage(
                bg.image,
                cropArea.x, cropArea.y, cropArea.width, cropArea.height,
                0, 0, previewCanvas.width, previewCanvas.height
            );
        } else {
            ctx.drawImage(bg.image, 0, 0);
        }
    }

    // プレビューを表示
    previewCanvas.style.display = 'block';
    previewPlaceholder.style.display = 'none';

    // エクスポートボタンを有効化
    updateExportButtons();

    // モードに応じて表示を更新
    if (isCropMode) {
        // トリミングモード：トリミング枠のみ表示
        setTimeout(() => updateCropBox(), 100);
    } else {
        // 編集モード：バウンディングボックスのみ表示（透過画像がある場合）
        if (projectState.transparentImages.length > 0) {
            setTimeout(() => updateBoundingBox(), 100);
        }
    }
};

// エクスポートボタンの状態更新
const updateExportButtons = () => {
    const hasBackground = !!projectState.backgroundImage;
    const hasTransparent = projectState.transparentImages.length > 0;

    // PNG: 背景画像があれば有効
    exportPngButton.disabled = !hasBackground;

    // GIF: 背景画像と複数の透過画像があれば有効
    exportGifButton.disabled = !(hasBackground && projectState.transparentImages.length > 1);
};

// 背景画像のアップロード処理
const handleBackgroundImageUpload = async (file) => {
    if (!validateImageFile(file)) return;

    try {
        console.log('背景画像読み込み開始:', file.name);
        const image = await loadImage(file);

        // ImageDataオブジェクトを作成
        const imageData = createImageData(file, image);

        // 状態を更新
        projectState.backgroundImage = imageData;

        // トリミング状態をリセット
        projectState.transformState.cropArea = null;
        projectState.transformState.aspectRatio = 'original';

        // アスペクト比選択を元の比率に戻す
        aspectRatioSelect.value = 'original';

        // トリミングモードの場合は編集モードに戻す
        if (isCropMode) {
            toggleCropMode();
        }

        // ドロップゾーンの表示を更新
        backgroundDropzone.innerHTML = `
            <div class="upload-area__icon">✅</div>
            <p class="upload-area__text">背景画像: ${file.name}</p>
            <p class="upload-area__subtext">${image.width} × ${image.height}px</p>
            <button class="upload-area__button" type="button" onclick="backgroundInput.click()">変更</button>
        `;

        // プレビューを更新
        updatePreview();

        console.log('背景画像読み込み完了');
    } catch (error) {
        console.error('背景画像読み込みエラー:', error);
        showError('背景画像の読み込みに失敗しました: ' + error.message);
    }
};

// 透過画像のアップロード処理
const handleTransparentImageUpload = async (files) => {
    const validFiles = Array.from(files).filter(validateImageFile);
    if (validFiles.length === 0) return;

    try {
        console.log('透過画像読み込み開始:', validFiles.map(f => f.name));

        // 既存の透過画像をクリア
        projectState.transparentImages = [];

        // 透過画像の位置をリセット
        projectState.transformState.position = { x: 0, y: 0 };
        projectState.transformState.scale = 1;
        scaleInput.value = 1;

        // 各ファイルを順番に読み込み
        for (const file of validFiles) {
            if (isGifFile(file)) {
                // GIFファイルの場合、フレームを抽出
                console.log('GIFファイルを処理中:', file.name);
                try {
                    const frames = await extractGifFrames(file);

                    // GIFの元のフレーム間隔を保存
                    const originalDelays = frames.map(frame => frame.delay);
                    const avgDelay = originalDelays.reduce((sum, delay) => sum + delay, 0) / originalDelays.length;
                    const minDelay = Math.min(...originalDelays);
                    const maxDelay = Math.max(...originalDelays);

                    // アニメーション設定を更新（GIFの平均フレーム間隔を使用）
                    if (avgDelay > 0) {
                        const roundedAvgDelay = Math.round(avgDelay);

                        // スライダーの範囲を動的に調整
                        const currentMin = parseInt(animationSpeedInput.min);
                        const currentMax = parseInt(animationSpeedInput.max);
                        const newMin = Math.min(currentMin, Math.max(10, Math.round(minDelay))); // 最小10ms
                        const newMax = Math.max(currentMax, Math.round(maxDelay));

                        animationSpeedInput.min = newMin;
                        animationSpeedInput.max = newMax;

                        // ステップサイズも調整（より細かい調整を可能に）
                        if (roundedAvgDelay < 100) {
                            animationSpeedInput.step = 10;
                        } else {
                            animationSpeedInput.step = 50;
                        }

                        projectState.animationSettings.frameDelay = roundedAvgDelay;
                        animationSpeedInput.value = roundedAvgDelay;
                        animationSpeedValue.textContent = `${roundedAvgDelay}ms`;

                        console.log(`GIFの元フレーム間隔を適用: ${roundedAvgDelay}ms (範囲: ${newMin}-${newMax}ms)`);
                        console.log(`フレーム間隔の詳細:`, originalDelays);
                    }

                    for (let i = 0; i < frames.length; i++) {
                        const frame = frames[i];
                        const frameFile = new File([file], `${file.name}_frame_${i + 1}`, { type: 'image/png' });
                        const imageData = createImageData(frameFile, frame.image);

                        // フレーム固有の情報を追加
                        imageData.frameInfo = {
                            delay: frame.delay,
                            disposal: frame.disposal,
                            isFromGif: true,
                            originalIndex: i
                        };

                        projectState.transparentImages.push(imageData);
                    }
                    console.log(`GIFから ${frames.length} フレームを抽出しました`);
                } catch (error) {
                    console.error('GIF処理エラー:', error);
                    showError(`GIFファイル ${file.name} の処理に失敗しました: ${error.message}`);
                    // エラーの場合は通常の画像として処理を試行
                    const image = await loadImage(file);
                    const imageData = createImageData(file, image);
                    projectState.transparentImages.push(imageData);
                }
            } else {
                // 通常の画像ファイルの場合
                const image = await loadImage(file);
                const imageData = createImageData(file, image);
                projectState.transparentImages.push(imageData);
            }
        }

        // 通常の静止画のみの場合、スライダー設定をデフォルトに戻す
        const hasGifFrames = projectState.transparentImages.some(img => img.frameInfo?.isFromGif);
        if (!hasGifFrames && validFiles.length > 1) {
            // 複数の静止画の場合、デフォルト設定に戻す
            animationSpeedInput.min = 50;
            animationSpeedInput.max = 2000;
            animationSpeedInput.step = 50;
            animationSpeedInput.value = 500;
            animationSpeedValue.textContent = '500ms';
            projectState.animationSettings.frameDelay = 500;
            console.log('静止画アニメーション用にデフォルト設定を適用');
        }

        // ドロップゾーンの表示を更新
        const totalFrames = projectState.transparentImages.length;
        const hasGif = validFiles.some(f => isGifFile(f));
        const isAnimation = totalFrames > 1;

        let description = '';
        if (hasGif) {
            description = `GIF含む ${validFiles.length}ファイル → ${totalFrames}フレーム`;
        } else {
            description = validFiles.map(f => f.name).join(', ');
        }

        transparentDropzone.innerHTML = `
            <div class="upload-area__icon">${isAnimation ? '🎬' : '✅'}</div>
            <p class="upload-area__text">${isAnimation ? 'アニメーション用画像' : '透過画像'}: ${totalFrames}フレーム</p>
            <p class="upload-area__subtext">${description}</p>
            <button class="upload-area__button" type="button" onclick="transparentInput.click()">変更</button>
        `;

        // プレビューを更新
        updatePreview();

        // 透過画像アップロード時はバウンディングボックスを表示
        if (!isCropMode) {
            isBoundingBoxSelected = true;
            updateBoundingBox();
        }

        console.log('透過画像読み込み完了');
    } catch (error) {
        console.error('透過画像読み込みエラー:', error);
        showError('透過画像の読み込みに失敗しました: ' + error.message);
    }
};

// 拡大後のサイズチェック
const checkScaleWarning = () => {
    if (!projectState.backgroundImage || projectState.transparentImages.length === 0) return;

    const bg = projectState.backgroundImage;
    const transparentImg = projectState.transparentImages[0];
    const scale = projectState.transformState.scale;

    // 拡大後のサイズを計算
    const scaledWidth = transparentImg.metadata.width * scale;
    const scaledHeight = transparentImg.metadata.height * scale;

    // 出力サイズを超える場合は警告
    if (scaledWidth > projectState.outputSettings.maxWidth ||
        scaledHeight > projectState.outputSettings.maxHeight) {
        showError(`拡大後のサイズ（${scaledWidth}×${scaledHeight}px）が出力サイズ制限（${projectState.outputSettings.maxWidth}×${projectState.outputSettings.maxHeight}px）を超えています。`);
    }
};

// コントロールパネルのイベントハンドラー
const setupControls = () => {
    scaleInput.addEventListener('input', (e) => {
        const scale = parseInt(e.target.value);
        projectState.transformState.scale = scale;
        console.log('拡大倍率変更:', scale);
        updatePreview();
        checkScaleWarning();

        // 倍率変更時はバウンディングボックスを一時的に表示
        if (!isCropMode && projectState.transparentImages.length > 0) {
            showBoundingBoxTemporarily(1000);
        }
    });

    cropModeToggle.addEventListener('click', toggleCropMode);

    // アニメーション速度の調整
    animationSpeedInput.addEventListener('input', (e) => {
        const speed = parseInt(e.target.value);
        projectState.animationSettings.frameDelay = speed;
        animationSpeedValue.textContent = `${speed}ms`;
        console.log('アニメーション速度変更:', speed + 'ms');

        // プレビューのアニメーションを更新
        if (projectState.transparentImages.length > 1) {
            updatePreview();
        }
    });

    aspectRatioSelect.addEventListener('change', (e) => {
        const ratio = e.target.value;
        projectState.transformState.aspectRatio = ratio;
        console.log('アスペクト比変更:', ratio);

        if (isCropMode) {
            // トリミングモード中は、トリミング領域をリセットして枠のみ更新
            // 背景画像のサイズは固定のまま
            projectState.transformState.cropArea = null;
            updateCropBox();
        } else {
            // 編集モード中は通常通りプレビューを更新
            updatePreview();
        }
    });

    exportPngButton.addEventListener('click', () => {
        console.log('PNG エクスポート開始');
        exportAsPNG();
    });

    exportGifButton.addEventListener('click', () => {
        console.log('GIF エクスポート開始');
        exportAsGIF();
    });
};

// アプリケーションの初期化
const initializeApp = () => {
    console.log('X用ポスト画像生成ツール - 初期化開始');

    setupDragAndDrop();
    setupFileInputs();
    setupControls();
    setupBoundingBox();
    setupCropBox();
    setupCanvasClick();
    setupWindowResize();

    console.log('初期化完了');
};

// PNG エクスポート機能
const exportAsPNG = () => {
    if (!projectState.backgroundImage || projectState.transparentImages.length === 0) {
        showError('背景画像と透過画像の両方が必要です');
        return;
    }

    try {
        // エクスポート用のキャンバスを作成
        const exportCanvas = document.createElement('canvas');
        const ctx = exportCanvas.getContext('2d', { willReadFrequently: true });

        const bg = projectState.backgroundImage;
        const transparentImg = projectState.transparentImages[0]; // 最初の透過画像を使用
        const scale = projectState.transformState.scale;
        const pos = projectState.transformState.position;
        const cropArea = projectState.transformState.cropArea;

        // キャンバスサイズを設定
        if (cropArea) {
            exportCanvas.width = cropArea.width;
            exportCanvas.height = cropArea.height;
        } else {
            exportCanvas.width = bg.metadata.width;
            exportCanvas.height = bg.metadata.height;
        }

        // 背景画像を描画
        if (cropArea) {
            ctx.drawImage(
                bg.image,
                cropArea.x, cropArea.y, cropArea.width, cropArea.height,
                0, 0, exportCanvas.width, exportCanvas.height
            );
        } else {
            ctx.drawImage(bg.image, 0, 0);
        }

        // 透過画像の位置を計算
        const imagePos = calculateTransparentImagePosition(transparentImg, scale, pos, bg, cropArea);

        // ピクセルパーフェクト描画の設定
        ctx.imageSmoothingEnabled = false;

        // 透過画像を描画
        ctx.drawImage(
            transparentImg.image,
            imagePos.x, imagePos.y,
            imagePos.width, imagePos.height
        );

        // PNG として保存
        exportCanvas.toBlob((blob) => {
            if (blob) {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `x-post-image-${Date.now()}.png`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                console.log('PNG エクスポート完了');
                showSuccess('PNG画像をダウンロードしました');
            } else {
                throw new Error('PNG生成に失敗しました');
            }
        }, 'image/png');

    } catch (error) {
        console.error('PNG エクスポートエラー:', error);
        showError('PNG エクスポートに失敗しました: ' + error.message);
    }
};

// GIF エクスポート機能
const exportAsGIF = () => {
    if (!projectState.backgroundImage || projectState.transparentImages.length === 0) {
        showError('背景画像と透過画像の両方が必要です');
        return;
    }

    if (projectState.transparentImages.length === 1) {
        showError('GIF生成には複数の透過画像が必要です。単一画像の場合はPNGをご利用ください。');
        return;
    }

    try {
        console.log('GIF生成開始...');

        const bg = projectState.backgroundImage;
        const scale = projectState.transformState.scale;
        const pos = projectState.transformState.position;
        const cropArea = projectState.transformState.cropArea;

        // キャンバスサイズを決定
        let canvasWidth, canvasHeight;
        if (cropArea) {
            canvasWidth = cropArea.width;
            canvasHeight = cropArea.height;
        } else {
            canvasWidth = bg.metadata.width;
            canvasHeight = bg.metadata.height;
        }

        // GIF生成器を初期化（ローカルワーカー使用）
        const gif = new GIF({
            workers: 2, // ワーカーを使用
            quality: 15, // 品質を調整
            width: canvasWidth,
            height: canvasHeight,
            repeat: 0, // 無限ループ
            workerScript: './gif.worker.js' // ローカルワーカースクリプトを指定
        });

        // 各フレーム用のキャンバスを作成
        const frameCanvas = document.createElement('canvas');
        const ctx = frameCanvas.getContext('2d', { willReadFrequently: true });
        frameCanvas.width = canvasWidth;
        frameCanvas.height = canvasHeight;

        // 各透過画像をフレームとして追加
        projectState.transparentImages.forEach((transparentImg, index) => {
            try {
                // キャンバスをクリア
                ctx.clearRect(0, 0, canvasWidth, canvasHeight);

                // 背景画像を描画
                if (cropArea) {
                    ctx.drawImage(
                        bg.image,
                        cropArea.x, cropArea.y, cropArea.width, cropArea.height,
                        0, 0, canvasWidth, canvasHeight
                    );
                } else {
                    ctx.drawImage(bg.image, 0, 0);
                }

                // 透過画像の位置を計算
                const imagePos = calculateTransparentImagePosition(transparentImg, scale, pos, bg, cropArea);

                // ピクセルパーフェクト描画の設定
                ctx.imageSmoothingEnabled = false;

                // 透過画像を描画
                ctx.drawImage(
                    transparentImg.image,
                    imagePos.x, imagePos.y,
                    imagePos.width, imagePos.height
                );

                // フレームをGIFに追加（設定された間隔）
                gif.addFrame(frameCanvas, { copy: true, delay: projectState.animationSettings.frameDelay });

                console.log(`フレーム ${index + 1}/${projectState.transparentImages.length} 追加完了`);
            } catch (frameError) {
                console.error(`フレーム ${index + 1} の処理でエラー:`, frameError);
                throw frameError;
            }
        });

        // GIF生成完了時の処理
        gif.on('finished', (blob) => {
            try {
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = url;
                link.download = `x-post-animation-${Date.now()}.gif`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                URL.revokeObjectURL(url);

                console.log('GIF エクスポート完了');
                showSuccess('GIFアニメーションをダウンロードしました');
            } catch (downloadError) {
                console.error('GIF ダウンロードエラー:', downloadError);
                showError('GIF ダウンロードに失敗しました');
            }
        });

        // GIF生成エラー時の処理
        gif.on('error', (error) => {
            console.error('GIF生成エラー:', error);
            showError('GIF生成中にエラーが発生しました: ' + error.message);
        });

        // GIF生成進捗の表示
        gif.on('progress', (progress) => {
            const percentage = Math.round(progress * 100);
            console.log(`GIF生成進捗: ${percentage}%`);
            if (percentage % 25 === 0) { // 25%刻みでメッセージ更新
                showSuccess(`GIF生成中... ${percentage}%`);
            }
        });

        // タイムアウト処理（30秒）
        const timeout = setTimeout(() => {
            console.error('GIF生成がタイムアウトしました');
            showError('GIF生成に時間がかかりすぎています。画像サイズを小さくするか、フレーム数を減らしてください。');
        }, 30000);

        // GIF生成完了時にタイムアウトをクリア
        gif.on('finished', () => {
            clearTimeout(timeout);
        });

        // GIF生成開始
        gif.render();

        console.log('GIF生成処理を開始しました...');
        showSuccess('GIF生成中です。しばらくお待ちください...');

    } catch (error) {
        console.error('GIF エクスポートエラー:', error);
        showError('GIF エクスポートに失敗しました: ' + error.message);
    }
};

// 成功メッセージ表示関数
const showSuccess = (message) => {
    // エラーメッセージ要素を一時的に成功メッセージとして使用
    errorMessage.textContent = message;
    errorMessage.style.display = 'block';
    errorMessage.style.backgroundColor = '#4CAF50';
    errorMessage.style.color = 'white';
    setTimeout(() => {
        errorMessage.style.display = 'none';
        errorMessage.style.backgroundColor = '#f44336';
        errorMessage.style.color = 'white';
    }, 3000);
};

// DOMContentLoaded イベントでアプリケーションを初期化
document.addEventListener('DOMContentLoaded', initializeApp);