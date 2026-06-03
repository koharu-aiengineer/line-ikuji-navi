// ========================================
// LINE コマンド処理サービス
// ========================================
// 受け取ったメッセージを解析し、
// 適切な返答を組み立てて返します。

import { messagingApi } from '@line/bot-sdk';
import { saveUser, saveHokatsuTarget, getUser } from './sheetsService.js';
import { calcAge } from './ageService.js';
import { getMilestonesWithHokatsu } from './hokatsuService.js';

// LINE への返信クライアント（アクセストークンで認証）
const client = new messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});

/**
 * LINE イベントを受け取り、コマンドに応じて返答する
 * @param {object} event - LINE webhook イベント
 */
export async function handleEvent(event) {
  // 友だち追加イベント
  if (event.type === 'follow') {
    return reply(event.replyToken,
      `LINE育児ナビへようこそ！\n\nお子さんの月齢に合わせた情報をお届けします。\n\nまずは生年月日を登録してください。\n\n登録 YYYY-MM-DD\n例）登録 2026-01-01\n\n─────────────\n【コマンド一覧】\n\n今日\n→ 今の月齢と今月の目安\n\n来月\n→ 来月の情報\n\n保活 YYYY-MM\n→ 入園希望月を設定\n例）保活 2027-04`
    );
  }

  // テキストメッセージ以外は無視
  if (event.type !== 'message' || event.message.type !== 'text') return;

  const { replyToken, source, message } = event;
  const lineUserId = source.userId;
  const text = message.text.trim();

  // ── コマンド振り分け ─────────────────────

  // 「登録 YYYY-MM-DD」
  const registerMatch = text.match(/^登録\s+(\d{4}-\d{2}-\d{2})$/);
  if (registerMatch) {
    return handleRegister(replyToken, lineUserId, registerMatch[1]);
  }

  // 「保活 YYYY-MM」
  const hokatsuMatch = text.match(/^保活\s+(\d{4}-\d{2})$/);
  if (hokatsuMatch) {
    return handleHokatsu(replyToken, lineUserId, hokatsuMatch[1]);
  }

  // 「今日」
  if (text === '今日') {
    return handleToday(replyToken, lineUserId);
  }

  // 「来月」
  if (text === '来月') {
    return handleNextMonth(replyToken, lineUserId);
  }

  // どのコマンドにも該当しない
  return reply(replyToken, 'コマンドは以下の4つです。\n\n登録 YYYY-MM-DD\n保活 YYYY-MM\n今日\n来月');
}

// ── 各コマンドの処理 ──────────────────────

async function handleRegister(replyToken, lineUserId, birthday) {
  const date = new Date(birthday + 'T00:00:00');
  if (isNaN(date.getTime()) || date > new Date()) {
    return reply(replyToken, '日付が正しくありません。\n例: 登録 2026-01-17');
  }

  await saveUser(lineUserId, birthday);
  return reply(replyToken, `登録しました！\n生年月日: ${birthday}`);
}

async function handleHokatsu(replyToken, lineUserId, targetDate) {
  // YYYY-MM の簡易バリデーション
  const [y, m] = targetDate.split('-').map(Number);
  if (y < 2024 || m < 1 || m > 12) {
    return reply(replyToken, '年月が正しくありません。\n例: 保活 2027-04');
  }

  await saveHokatsuTarget(lineUserId, targetDate);
  return reply(replyToken, `入園希望月を設定しました！\n${targetDate}\n\n「今日」または「来月」で保活スケジュールを確認できます。`);
}

async function handleToday(replyToken, lineUserId) {
  const user = await getUser(lineUserId);
  if (!user) return replyNotRegistered(replyToken);

  const age = calcAge(user.birthday);
  const data = getMonthData(user.birthday, age.months, user.hokatsuTarget);

  const text = [
    `生後${age.months}ヶ月${age.days}日`,
    '',
    '【今月の目安】',
    ...data.current.map(t => `・${t}`),
    '',
    '【来月の見通し】',
    ...data.next.map(t => `・${t}`),
  ].join('\n');

  return reply(replyToken, text);
}

async function handleNextMonth(replyToken, lineUserId) {
  const user = await getUser(lineUserId);
  if (!user) return replyNotRegistered(replyToken);

  const age = calcAge(user.birthday);
  const nextMonths = Math.min(age.months + 1, 12);
  const data = getMonthData(user.birthday, nextMonths, user.hokatsuTarget);

  const text = [
    `生後${nextMonths}ヶ月の情報`,
    '',
    '【今月の目安】',
    ...data.current.map(t => `・${t}`),
    '',
    '【来月の見通し】',
    ...data.next.map(t => `・${t}`),
  ].join('\n');

  return reply(replyToken, text);
}

// ── ヘルパー ────────────────────────────

function getMonthData(birthday, months, hokatsuTarget) {
  const all = getMilestonesWithHokatsu(birthday, hokatsuTarget);
  return all[String(months)];
}

function replyNotRegistered(replyToken) {
  return reply(replyToken, '生年月日が未登録です。\n「登録 YYYY-MM-DD」で登録してください。\n例: 登録 2026-01-17');
}

function reply(replyToken, text) {
  return client.replyMessage({
    replyToken,
    messages: [{ type: 'text', text }],
  });
}
