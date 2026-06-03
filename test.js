// 使い方:
//   node test.js <生年月日>
//   node test.js <生年月日> <入園希望月>
//
// 例:
//   node test.js 2026-01-17
//   node test.js 2026-01-17 2027-04

import { calcAge } from './src/services/ageService.js';
import { calcHokatsuSchedule, getMilestonesWithHokatsu } from './src/services/hokatsuService.js';

const birthDate   = process.argv[2];
const targetDate  = process.argv[3] ?? null; // 省略可

if (!birthDate) {
  console.log('使い方: node test.js <生年月日> [入園希望月]');
  console.log('例:     node test.js 2026-01-17 2027-04');
  process.exit(1);
}

const today = new Date().toISOString().slice(0, 10);

// ── 月齢 ────────────────────────────────
const age = calcAge(birthDate);
console.log('');
console.log('━━━ 月齢 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log(`生年月日 : ${birthDate}`);
console.log(`今日     : ${today}`);
console.log(`月齢     : ${age.months}ヶ月 ${age.days}日`);

// ── 今月の milestones ───────────────────
const milestones = getMilestonesWithHokatsu(birthDate, targetDate);
const current = milestones[String(age.months)];

console.log('');
console.log(`━━━ 生後${age.months}ヶ月の情報 ━━━━━━━━━━━━━━━━━━━━━`);
console.log('【今月の目安】');
current.current.forEach(t => console.log(`  ・${t}`));
console.log('【来月の見通し】');
current.next.forEach(t => console.log(`  ・${t}`));

// ── 保活スケジュール ─────────────────────
if (targetDate) {
  const schedule = calcHokatsuSchedule(birthDate, targetDate);
  console.log('');
  console.log(`━━━ 保活スケジュール（入園希望: ${targetDate}）━━━━━`);
  if (Object.keys(schedule).length === 0) {
    console.log('  ※ 0〜12ヶ月の範囲に保活タスクはありません');
  } else {
    for (const [month, tasks] of Object.entries(schedule).sort((a, b) => Number(a[0]) - Number(b[0]))) {
      const mark = Number(month) === age.months ? ' ← 今ここ' : '';
      console.log(`  生後${month}ヶ月${mark}`);
      tasks.forEach(t => console.log(`    ・${t}`));
    }
  }
} else {
  console.log('');
  console.log('💡 保活情報を表示するには入園希望月を追加してください');
  console.log(`   例: node test.js ${birthDate} 2027-04`);
}

console.log('');
