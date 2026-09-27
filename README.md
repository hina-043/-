# SUKIBI AI

OpenAI API を使った、ブラウザーで動く日本語AIアプリです。

## できること

- 日常会話
- タスク整理・文章作成・アイデア出し
- 会話履歴のブラウザー保存
- 会話モード / タスクモード
- Web検索モード
- レスポンシブUI（PC・スマホ）
- APIキーをサーバー側だけで管理

## 起動

1. Node.js を用意
2. `.env.example` を `.env` にコピー
3. `.env` の `OPENAI_API_KEY` を自分のキーに変更
4. 実行

```bash
npm install
npm start
```

ブラウザーで `http://localhost:3000` を開きます。

## デプロイ

Render / Railway / Fly.io / 自分のNode.jsサーバーなど、環境変数を設定できるホスティングへ配置できます。

`OPENAI_API_KEY` は必ずサーバーの環境変数に入れてください。フロントエンドに埋め込まないでください。
