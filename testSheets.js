// 使い方: node testSheets.js
// .env に GOOGLE_SHEET_ID / GOOGLE_SERVICE_ACCOUNT_EMAIL / GOOGLE_PRIVATE_KEY を設定してから実行

import 'dotenv/config';
import { checkConnection } from './src/services/sheetsService.js';

console.log('Google Sheets 接続確認中...');

try {
  const title = await checkConnection();
  console.log(`✅ 接続成功: "${title}"`);
} catch (err) {
  console.error('❌ 接続失敗:', err.message);
}
