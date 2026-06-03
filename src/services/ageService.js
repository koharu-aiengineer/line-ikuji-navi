// ========================================
// 月齢計算サービス
// ========================================
// 生年月日と現在日付から「何ヶ月と何日」かを計算します。
//
// 【月齢の数え方】
// 例: 1月17日生まれ → 6月3日時点
//   → 5月17日で「4ヶ月」に達し、そこから17日経過
//   → { months: 4, days: 17 }
//
// 【月末日の扱い】
// 1月31日生まれの場合、2月には31日が存在しないため、
// 「2月28日」を1ヶ月の到達点として扱います。

/**
 * 月齢を計算する
 * @param {string} birthDateStr - 生年月日 (例: "2026-01-17")
 * @param {Date} [today=new Date()] - 基準日（省略時は今日）
 * @returns {{ months: number, days: number }}
 */
export function calcAge(birthDateStr, today = new Date()) {
  // "2026-01-17" をパース（タイムゾーンずれを防ぐためT00:00:00を付ける）
  const birth = new Date(birthDateStr + 'T00:00:00');

  if (isNaN(birth.getTime())) {
    throw new Error(`無効な日付です: ${birthDateStr}`);
  }

  const by = birth.getFullYear();
  const bm = birth.getMonth(); // 0始まり (1月=0)
  const bd = birth.getDate();

  const ty = today.getFullYear();
  const tm = today.getMonth();
  const td = today.getDate();

  if (birth > today) {
    throw new Error('生年月日が現在日付より未来です');
  }

  // まず月の差を出す
  let months = (ty - by) * 12 + (tm - bm);

  // 今月の末日を求め、誕生日の「今月版」を計算する
  // （例: 1月31日生まれ→6月は30日までしかないので30日扱い）
  const lastDayOfTodayMonth = new Date(ty, tm + 1, 0).getDate();
  const effectiveBdInTodayMonth = Math.min(bd, lastDayOfTodayMonth);

  let days;

  if (td < effectiveBdInTodayMonth) {
    // 今月はまだ誕生日が来ていない → 1ヶ月分戻す
    months -= 1;

    // 先月の末日と、先月における誕生日の有効な日を使って端数日を求める
    const lastDayOfPrevMonth = new Date(ty, tm, 0).getDate();
    const effectiveBdInPrevMonth = Math.min(bd, lastDayOfPrevMonth);

    // 「先月の誕生日」から今日までの日数
    days = (lastDayOfPrevMonth - effectiveBdInPrevMonth) + td;
  } else {
    // 今月すでに誕生日が来ている
    days = td - effectiveBdInTodayMonth;
  }

  return { months, days };
}
