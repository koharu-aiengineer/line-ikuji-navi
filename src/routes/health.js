// ========================================
// ヘルスチェック用ルート
// ========================================
// GET /health にアクセスするとサーバーの状態を返します。
// サーバーが正常に動いているか確認するためのエンドポイントです。

import { Router } from 'express';

// Routerインスタンスを作成（URLごとの処理をまとめるオブジェクト）
const router = Router();

// GET /health
router.get('/', (req, res) => {
  res.json({
    status: 'ok',
    message: 'LINE育児ナビ サーバー稼働中',
    timestamp: new Date().toISOString(),
  });
});

export default router;
