# プロジェクト概要

手前の透過レイヤー（GIF or 連番PNG、連番JPG）と背景レイヤー(JPG or PNG)を合成し、静止画PNGかアニメーションGIFとして書き出す、シングルページのWebアプリケーションです。

## 仕様

大きく二つの画面を持ちタブで切り替え可能
- 編集画面：　notes/edit-panel.md
- Xプレビュー画面: notes/x-preview-panel.md

## 使い方

1. 依存インストール

```bash
npm install
```

2. 開発サーバー起動

```bash
npm run dev
```

3. ビルド

```bash
npm run build
```

4. ビルド結果の確認

```bash
npm run preview
```

GitHub Pages 配信用にビルドする場合はベースパスを付与するため、環境変数を指定して実行してください。

```bash
GH_PAGES=true npm run build
```
