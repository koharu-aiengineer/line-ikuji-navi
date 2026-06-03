// ========================================
// アプリのエントリーポイント（起動ファイル）
// ========================================
// このファイルがアプリの出発点です。
// サーバーを起動し、ルーティングを登録します。

// dotenv: .env ファイルの環境変数を読み込む
import 'dotenv/config';

// express: Webサーバーを簡単に作れるフレームワーク
import express from 'express';

// 各ルート（URLのパスごとの処理）を読み込む
import webhookRouter from './routes/webhook.js';
import healthRouter from './routes/health.js';
import { startNotificationJob } from './services/notificationService.js';

// Expressアプリのインスタンスを作成
const app = express();

// ポート番号を環境変数から取得（なければ3000を使用）
const PORT = process.env.PORT || 3000;

// ----------------------------------------
// ルーティングの登録
// ----------------------------------------
// /health → JSON解析してから死活確認
app.use('/health', express.json(), healthRouter);

// /webhook → LINE署名検証のため express.json() を通さず直接渡す
//            署名検証はルート内の LINE middleware が行う
app.use('/webhook', webhookRouter);

// ----------------------------------------
// サーバーの起動
// ----------------------------------------
app.listen(PORT, () => {
  console.log(`サーバーが起動しました: http://localhost:${PORT}`);
  console.log(`環境: ${process.env.NODE_ENV || 'development'}`);
  startNotificationJob();
});
