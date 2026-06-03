// ========================================
// ageService の単体テスト
// ========================================
// Node.js 標準の test ランナーを使います（追加インストール不要）
// 実行: node --test src/services/ageService.test.js

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calcAge } from './ageService.js';

// ----------------------------------------
// 基本ケース
// ----------------------------------------

test('基本: 2026-01-17生まれ → 2026-06-03時点 → 4ヶ月17日', () => {
  const result = calcAge('2026-01-17', new Date('2026-06-03'));
  assert.deepEqual(result, { months: 4, days: 17 });
});

test('誕生日当日 → 0ヶ月0日', () => {
  const result = calcAge('2026-06-03', new Date('2026-06-03'));
  assert.deepEqual(result, { months: 0, days: 0 });
});

test('ちょうど1ヶ月後の誕生日 → 1ヶ月0日', () => {
  const result = calcAge('2026-01-17', new Date('2026-02-17'));
  assert.deepEqual(result, { months: 1, days: 0 });
});

test('ちょうど1ヶ月後の翌日 → 1ヶ月1日', () => {
  const result = calcAge('2026-01-17', new Date('2026-02-18'));
  assert.deepEqual(result, { months: 1, days: 1 });
});

test('1年以上: 2025-01-01生まれ → 2026-06-03 → 17ヶ月2日', () => {
  // Jan→Feb:1, Feb→Mar:2, ..., Jan→Jan:12, Jan→Jun:17
  // 今月(6)の誕生日有効日=1, td(3)>=1 → days=3-1=2
  const result = calcAge('2025-01-01', new Date('2026-06-03'));
  assert.deepEqual(result, { months: 17, days: 2 });
});

// ----------------------------------------
// 月末日の境界ケース
// ----------------------------------------

test('月末: 1月31日生まれ → 2月28日時点 → 1ヶ月0日', () => {
  // 2月に31日は存在しないため2月28日を「1ヶ月到達点」とみなす
  const result = calcAge('2026-01-31', new Date('2026-02-28'));
  assert.deepEqual(result, { months: 1, days: 0 });
});

test('月末: 1月31日生まれ → 3月1日時点 → 1ヶ月1日', () => {
  // 2月28日が1ヶ月到達点なので、そこから1日
  const result = calcAge('2026-01-31', new Date('2026-03-01'));
  assert.deepEqual(result, { months: 1, days: 1 });
});

test('月末: 1月31日生まれ → 3月31日時点 → 2ヶ月0日', () => {
  const result = calcAge('2026-01-31', new Date('2026-03-31'));
  assert.deepEqual(result, { months: 2, days: 0 });
});

test('月末: 12月31日生まれ → 翌年6月3日時点 → 5ヶ月3日', () => {
  // 5月31日で5ヶ月到達、そこから3日
  const result = calcAge('2025-12-31', new Date('2026-06-03'));
  assert.deepEqual(result, { months: 5, days: 3 });
});

// ----------------------------------------
// エラーケース
// ----------------------------------------

test('未来の誕生日 → エラー', () => {
  assert.throws(
    () => calcAge('2030-01-01', new Date('2026-06-03')),
    { message: '生年月日が現在日付より未来です' }
  );
});

test('不正な日付文字列 → エラー', () => {
  assert.throws(
    () => calcAge('not-a-date'),
    { message: '無効な日付です: not-a-date' }
  );
});
