# main.js モジュール分割方針

## 背景
- `src/main.js` が状態管理、DOM参照、画像処理、UI初期化を単一ファイルで抱え、保守性・見通しともに低下している。
- 今後の Astro などへの移行や UI 追加に備え、責務を明示したモジュール構造を先に固める。

## ディレクトリ構成（案）
```
src/
  state/
    projectState.js       # グローバル状態と更新ヘルパー
  services/
    fileValidation.js     # ファイル形式/サイズ検証
    imageLoader.js        # File→Image 読み込み
    gifProcessor.js       # GIFパース・フレーム展開
  render/
    previewCanvas.js      # 合成描画・キャンバス更新
    overlayBoxes.js       # バウンディング/クロップ描画
  ui/
    domRefs.js            # querySelector 一元管理
    dragAndDrop.js        # ドロップゾーン初期化
    controls.js           # スライダー/トグル/セレクト処理
  export/
    pngExporter.js
    gifExporter.js
  workers/
    gif.worker.js         # 既存 worker を継続利用
  templates/
    previewHandles.js     # ハンドルや繰り返しDOMのテンプレート生成
```

## 責務と依存ルール
- `state/` はアプリ全体の単一ソース。外部から直接オブジェクトを書き換えず、`setTransform`, `setAnimationSpeed` などの関数を経由させる。
- `services/` は純粋関数を基本とし、DOM には触れない。ファイル検証→読み込み→デコードまでをここに集約。
- `render/` は `canvas` 描画やプレビュー UI のみ。状態は引数で渡す。
- `ui/` は DOM 取得とイベント登録を担当。必要な処理は `services/` や `render/` を呼び出すだけで、自身ではビジネスロジックを持たない。
- `export/` は PNG/GIF の書き出しユーティリティ。`render/previewCanvas` と連携しつつ、書き出し結果を `Blob`/`URL` として返す。
- 依存方向は `state` ← `services` ← `render` ← `ui` のように循環を避ける。`main.js` はこれらをまとめて初期化するのみとする。

## 初期化フロー
1. `main.js` で `domRefs` を解決し、テンプレート挿入（後述）を実行。
2. `state/projectState` を初期化し、UI・イベント初期化関数に渡す。
3. UI イベントからは `services` / `render` / `export` を呼び出して処理。
4. すべての副作用（DOM操作、キャンバス描画）は専用モジュール内に閉じ込める。

## テンプレート化ルール（index.html）
- 重複する DOM は静的 HTML から除き、`<div data-template="bounding-box"></div>` のようなプレースホルダーを置く。
- `src/templates/*.js` でテンプレート文字列または DOM API を使って要素を生成し、`ui/domRefs` 初期化時に挿入する。
- 生成された要素には `data-role` / `data-handle` などの属性を付与し、イベント委譲で操作する。
- CSS で必要なハック（例: 9999px）を使う場合はコメントを残す。
- 既存と同じ見た目を保つため、テンプレート挿入後に `render/overlayBoxes` でクラス付与やスタイル初期化を実施する。

## 今後のタスクとの紐付け
- Task 2.x でファイルを順次移動する際、このメモのモジュール境界を守る。
- テンプレート化対象（バウンディングハンドル、クロップハンドル、アップロードボックス内テキストなど）を本メモで列挙し、実装時にチェック済みか確認する。
