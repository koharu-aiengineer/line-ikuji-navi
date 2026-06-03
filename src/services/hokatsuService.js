// ========================================
// 保活スケジュール計算サービス
// ========================================
// 入園希望月（例: "2027-04"）と生年月日から、
// 「何ヶ月時点で何をするか」を逆算します。

import { milestones } from '../data/milestones.js';
import { hokatsuTimeline } from '../data/hokatsuTimeline.js';

/**
 * 入園希望月から逆算し、月齢→保活タスクのマップを作る
 * @param {string} birthDateStr  - 生年月日 (例: "2026-01-17")
 * @param {string} targetDateStr - 入園希望月 (例: "2027-04")
 * @returns {Object} { '2': ['保活スタート', ...], '5': [...], ... }
 */
export function calcHokatsuSchedule(birthDateStr, targetDateStr) {
  const birth = new Date(birthDateStr + 'T00:00:00');

  // "2027-04" → year=2027, month=4 (1始まり)
  const [targetYear, targetMonth] = targetDateStr.split('-').map(Number);

  const schedule = {};

  for (const { monthsBefore, tasks } of hokatsuTimeline) {
    // この保活タスクを実施すべき実際の年月を求める
    // 例: 2027-04 の 12ヶ月前 → 2026-04
    const taskDate = new Date(targetYear, targetMonth - 1 - monthsBefore, 1);

    // そのとき赤ちゃんは何ヶ月か
    const babyMonths =
      (taskDate.getFullYear() - birth.getFullYear()) * 12 +
      (taskDate.getMonth() - birth.getMonth());

    // 0〜12ヶ月の範囲外は無視
    if (babyMonths < 0 || babyMonths > 12) continue;

    const key = String(babyMonths);
    schedule[key] = schedule[key] ? [...schedule[key], ...tasks] : [...tasks];
  }

  return schedule;
}

/**
 * milestones に保活タスクを差し込んで返す
 * @param {string} birthDateStr  - 生年月日 (例: "2026-01-17")
 * @param {string} targetDateStr - 入園希望月 (例: "2027-04") / 未設定なら null
 * @returns {Object} 保活タスクを含む milestones オブジェクト
 */
export function getMilestonesWithHokatsu(birthDateStr, targetDateStr) {
  // 保活設定がなければ元のデータをそのまま返す
  if (!targetDateStr) return milestones;

  const schedule = calcHokatsuSchedule(birthDateStr, targetDateStr);
  const result = {};

  for (let i = 0; i <= 12; i++) {
    const key = String(i);
    const base = milestones[key];
    const hokatsuTasks = schedule[key] ?? [];

    result[key] = {
      current: [...base.current, ...hokatsuTasks],
      next: base.next,
    };
  }

  return result;
}
