// ========================================
// 月齢通知サービス
// ========================================
// 毎月の誕生日（月齢の切り替わり）に
// 全ユーザーへ自動でPush通知を送ります。

import cron from 'node-cron';
import { messagingApi } from '@line/bot-sdk';
import { getAllUsers } from './sheetsService.js';
import { calcAge } from './ageService.js';
import { getMilestonesWithHokatsu } from './hokatsuService.js';

/**
 * 通知ジョブを起動する（サーバー起動時に1回呼ぶ）
 */
export function startNotificationJob() {
  // 毎日 8:00（日本時間）に実行
  cron.schedule('0 8 * * *', runNotificationJob, {
    timezone: 'Asia/Tokyo',
  });

  console.log('月齢通知ジョブ 起動（毎日8:00 JST）');
}

/**
 * 通知ジョブの本体（テスト用に外部からも呼べる）
 */
export async function runNotificationJob() {
  console.log('月齢通知ジョブ 実行:', new Date().toLocaleString('ja-JP', { timeZone: 'Asia/Tokyo' }));

  const client = new messagingApi.MessagingApiClient({
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
  });

  const today = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Tokyo' }));
  const todayDay = today.getDate();
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  let users;
  try {
    users = await getAllUsers();
  } catch (err) {
    console.error('ユーザー取得エラー:', err.message);
    return;
  }

  console.log(`対象ユーザー数: ${users.length}`);

  for (const user of users) {
    const birthDay = new Date(user.birthday + 'T00:00:00').getDate();
    // 月末日の考慮（例: 31日生まれ→2月は28日に送信）
    const effectiveBirthDay = Math.min(birthDay, lastDayOfMonth);

    if (todayDay !== effectiveBirthDay) continue;

    try {
      const age = calcAge(user.birthday);
      const hokatsuTarget = user.hokatsuTarget ?? process.env.HOKATSU_TARGET_DATE ?? null;
      const all = getMilestonesWithHokatsu(user.birthday, hokatsuTarget);
      const data = all[String(age.months)];

      const text = [
        `生後${age.months}ヶ月になりました！`,
        '',
        '【今月の目安】',
        ...data.current.map(t => `・${t}`),
        '',
        '【来月の見通し】',
        ...data.next.map(t => `・${t}`),
      ].join('\n');

      await client.pushMessage({
        to: user.lineUserId,
        messages: [{ type: 'text', text }],
      });

      console.log(`通知送信: ${user.lineUserId} (生後${age.months}ヶ月)`);
    } catch (err) {
      console.error(`通知失敗 ${user.lineUserId}:`, err.message);
    }
  }
}
