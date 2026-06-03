// ========================================
// Webhook ルート（LINEからのメッセージ受信口）
// ========================================
// LINE が POST してくるリクエストをここで受け取ります。
// middleware() が署名を検証し、改ざんされたリクエストを弾きます。

import { Router } from 'express';
import { middleware } from '@line/bot-sdk';
import { handleEvent } from '../services/lineService.js';

const router = Router();

// POST /webhook
router.post('/', (req, res, next) => {
  console.log('Webhook 受信');
  const secret = process.env.LINE_CHANNEL_SECRET;
  if (!secret) {
    console.error('LINE_CHANNEL_SECRET が未設定です');
    return res.sendStatus(500);
  }
  // 署名検証エラーを next に渡してログに出す
  return middleware({ channelSecret: process.env.LINE_CHANNEL_SECRET })(req, res, (err) => {
    if (err) {
      console.error('署名検証エラー:', err.message);
      return res.sendStatus(400);
    }
    next();
  });
}, async (req, res) => {
  try {
    console.log('イベント数:', req.body.events.length);
    await Promise.all(req.body.events.map(handleEvent));
    res.sendStatus(200);
  } catch (err) {
    console.error('Webhook エラー:', err.message, err.stack);
    res.sendStatus(500);
  }
});

export default router;
