'use strict';

const assert = require('assert');
const { buildResponse } = require('./attendanceDashboardModel');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try { fn(); console.log(`  ✓ ${name}`); passed++; }
  catch (e) { console.error(`  ✗ ${name}: ${e.message}`); failed++; }
}

const currentRows = [
  { date: '2026-03-15', status: 'present',  count: 30 },
  { date: '2026-03-15', status: 'absent',   count: 3  },
  { date: '2026-03-15', status: 'late',     count: 2  },
  { date: '2026-03-16', status: 'present',  count: 28 },
  { date: '2026-03-16', status: 'absent',   count: 5  },
  { date: '2026-03-16', status: 'on_leave', count: 1  },
];

const previousRows = [
  { status: 'present', count: 25 },
  { status: 'absent',  count: 6  },
  { status: 'late',    count: 4  },
];

test('buildResponse: chart has one entry per unique date', () => {
  const { chart } = buildResponse(currentRows, previousRows);
  assert.strictEqual(chart.length, 2);
});

test('buildResponse: chart entries are sorted by date', () => {
  const { chart } = buildResponse(currentRows, previousRows);
  assert.strictEqual(chart[0].date, '2026-03-15');
  assert.strictEqual(chart[1].date, '2026-03-16');
});

test('buildResponse: chart entry has all 5 status keys', () => {
  const { chart } = buildResponse(currentRows, previousRows);
  const keys = ['present', 'absent', 'late', 'excused', 'onLeave'];
  for (const key of keys) assert.ok(key in chart[0], `missing key: ${key}`);
});

test('buildResponse: on_leave maps to onLeave in chart', () => {
  const { chart } = buildResponse(currentRows, previousRows);
  assert.strictEqual(chart[1].onLeave, 1);
});

test('buildResponse: kpi.overallRate is correct (1 decimal)', () => {
  const { kpi } = buildResponse(currentRows, previousRows);
  // present = 30+28 = 58, total = 30+3+2+28+5+1 = 69
  assert.strictEqual(kpi.overallRate, Math.round((58 / 69) * 1000) / 10);
});

test('buildResponse: kpi.totalAbsent sums absent entries', () => {
  const { kpi } = buildResponse(currentRows, previousRows);
  assert.strictEqual(kpi.totalAbsent, 8); // 3+5
});

test('buildResponse: deltaAbsent is current minus previous', () => {
  const { kpi } = buildResponse(currentRows, previousRows);
  assert.strictEqual(kpi.deltaAbsent, 8 - 6); // cur=8, prev=6
});

test('buildResponse: returns zero kpi when both row arrays empty', () => {
  const { kpi, chart } = buildResponse([], []);
  assert.strictEqual(kpi.overallRate, 0);
  assert.strictEqual(kpi.totalAbsent, 0);
  assert.strictEqual(chart.length, 0);
});

console.log('');
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
