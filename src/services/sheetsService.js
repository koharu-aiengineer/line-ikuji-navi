// ========================================
// Google Sheets サービス
// ========================================
// スプレッドシートへの読み書きを担当します。
// 認証にはサービスアカウントを使用します。

import { google } from 'googleapis';

// 必要なスコープ（スプレッドシートの読み書き権限）
const SCOPES = ['https://www.googleapis.com/auth/spreadsheets'];

/**
 * 認証済みの Google Sheets クライアントを返す
 * @returns {import('googleapis').sheets_v4.Sheets}
 */
function getClient() {
  const { GOOGLE_SERVICE_ACCOUNT_EMAIL, GOOGLE_PRIVATE_KEY } = process.env;

  if (!GOOGLE_SERVICE_ACCOUNT_EMAIL || !GOOGLE_PRIVATE_KEY) {
    throw new Error(
      '.env に GOOGLE_SERVICE_ACCOUNT_EMAIL と GOOGLE_PRIVATE_KEY が必要です'
    );
  }

  const auth = new google.auth.JWT({
    email: GOOGLE_SERVICE_ACCOUNT_EMAIL,
    // Base64エンコード版を優先、なければ従来の \n 変換で処理
    key: process.env.GOOGLE_PRIVATE_KEY_BASE64
      ? Buffer.from(process.env.GOOGLE_PRIVATE_KEY_BASE64, 'base64').toString('utf8')
      : GOOGLE_PRIVATE_KEY.replace(/^["']|["']$/g, '').replace(/\\n/g, '\n'),
    scopes: SCOPES,
  });

  return google.sheets({ version: 'v4', auth });
}

/**
 * 全ユーザーを取得する（通知ジョブ用）
 * @returns {Promise<Array<{lineUserId, birthday, hokatsuTarget}>>}
 */
export async function getAllUsers() {
  const sheets = getClient();
  const sheetId = process.env.GOOGLE_SHEET_ID;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'シート1!A:D',
  });

  const rows = res.data.values ?? [];

  // ユーザーIDごとに最新の birthday / hokatsuTarget を集約
  const map = new Map();
  for (const [lineUserId, birthday, hokatsuTarget] of rows) {
    if (!lineUserId) continue;
    if (!map.has(lineUserId)) {
      map.set(lineUserId, { lineUserId, birthday: null, hokatsuTarget: null });
    }
    const u = map.get(lineUserId);
    if (birthday) u.birthday = birthday;
    if (hokatsuTarget) u.hokatsuTarget = hokatsuTarget;
  }

  // birthday が未登録のユーザーは除外
  return [...map.values()].filter(u => u.birthday);
}

/**
 * 接続確認: スプレッドシートのタイトルを取得して返す
 * @returns {Promise<string>} スプレッドシートのタイトル
 */
export async function checkConnection() {
  const sheets = getClient();
  const sheetId = process.env.GOOGLE_SHEET_ID;

  if (!sheetId) {
    throw new Error('.env に GOOGLE_SHEET_ID が必要です');
  }

  const res = await sheets.spreadsheets.get({ spreadsheetId: sheetId });
  return res.data.properties.title;
}

/**
 * lineUserId でユーザーを検索して返す（複数登録の場合は最新を返す）
 * @param {string} lineUserId
 * @returns {Promise<{lineUserId: string, birthday: string} | null>}
 */
export async function getUser(lineUserId) {
  const sheets = getClient();
  const sheetId = process.env.GOOGLE_SHEET_ID;

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: 'シート1!A:D',
  });

  const rows = res.data.values ?? [];
  const userRows = rows.filter(row => row[0] === lineUserId);
  if (userRows.length === 0) return null;

  // B列（birthday）が空でない最新行
  const birthdayRow = [...userRows].reverse().find(row => row[1]);
  if (!birthdayRow) return null;

  // C列（hokatsuTarget）が空でない最新行
  const hokatsuRow = [...userRows].reverse().find(row => row[2]);

  return {
    lineUserId,
    birthday: birthdayRow[1],
    // ユーザー設定 → .env のフォールバック → null の順で使用
    hokatsuTarget: hokatsuRow?.[2] ?? process.env.HOKATSU_TARGET_DATE ?? null,
  };
}

/**
 * ユーザー情報をスプレッドシートに追記する
 * @param {string} lineUserId - LINE のユーザーID
 * @param {string} birthday   - 生年月日 (例: "2026-01-17")
 */
export async function saveUser(lineUserId, birthday) {
  const sheets = getClient();
  const sheetId = process.env.GOOGLE_SHEET_ID;

  // A: lineUserId / B: birthday / C: hokatsuTarget(空) / D: timestamp
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'シート1!A:D',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[lineUserId, birthday, '', new Date().toISOString()]],
    },
  });
}

/**
 * 入園希望月をスプレッドシートに保存する
 * @param {string} lineUserId
 * @param {string} targetDate - 入園希望月 (例: "2027-04")
 */
export async function saveHokatsuTarget(lineUserId, targetDate) {
  const sheets = getClient();
  const sheetId = process.env.GOOGLE_SHEET_ID;

  // A: lineUserId / B: birthday(空) / C: hokatsuTarget / D: timestamp
  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: 'シート1!A:D',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [[lineUserId, '', targetDate, new Date().toISOString()]],
    },
  });
}
