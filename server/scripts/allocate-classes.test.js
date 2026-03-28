'use strict';

const assert = require('assert');

// ─── Stubs (paste implementations here when Task 2 is done) ───────────────────
// Replace these stubs with the real imports once allocate-classes.js exists:
// const { shuffle, allocateStudents } = require('./allocate-classes');

function shuffle(arr) { throw new Error('not implemented'); }
function allocateStudents(students, classes) { throw new Error('not implemented'); }
// ─────────────────────────────────────────────────────────────────────────────

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    passed++;
  } catch (e) {
    console.error(`  ✗ ${name}: ${e.message}`);
    failed++;
  }
}

// ── shuffle ───────────────────────────────────────────────────────────────────

test('shuffle: returns array of same length', () => {
  const input = [1, 2, 3, 4, 5];
  const result = shuffle(input);
  assert.strictEqual(result.length, input.length);
});

test('shuffle: contains all original elements', () => {
  const input = [10, 20, 30, 40, 50];
  const result = shuffle(input);
  assert.deepStrictEqual([...result].sort((a, b) => a - b), [...input].sort((a, b) => a - b));
});

test('shuffle: does not mutate original array', () => {
  const input = [1, 2, 3];
  const copy = [...input];
  shuffle(input);
  assert.deepStrictEqual(input, copy);
});

// ── allocateStudents ──────────────────────────────────────────────────────────

test('allocateStudents: assigns students to first class up to cap', () => {
  const students = [
    { studentid: 1 }, { studentid: 2 }, { studentid: 3 },
  ];
  const classes = [
    { class_id: 10, class_name: 'Primary 1 Empathy', classcap: 2 },
    { class_id: 11, class_name: 'Primary 1 Respect', classcap: 2 },
  ];
  const result = allocateStudents(students, classes);
  assert.strictEqual(result.length, 3);
  const inClass10 = result.filter(r => r.class_id === 10);
  const inClass11 = result.filter(r => r.class_id === 11);
  assert.strictEqual(inClass10.length, 2);
  assert.strictEqual(inClass11.length, 1);
});

test('allocateStudents: skips students when all classes are full', () => {
  const students = [
    { studentid: 1 }, { studentid: 2 }, { studentid: 3 },
  ];
  const classes = [
    { class_id: 10, class_name: 'Primary 1 Empathy', classcap: 1 },
    { class_id: 11, class_name: 'Primary 1 Respect', classcap: 1 },
  ];
  const result = allocateStudents(students, classes);
  assert.strictEqual(result.length, 2);
});

test('allocateStudents: returns empty array when no classes', () => {
  const students = [{ studentid: 1 }];
  const result = allocateStudents(students, []);
  assert.strictEqual(result.length, 0);
});

test('allocateStudents: returns empty array when no students', () => {
  const classes = [{ class_id: 10, class_name: 'P1', classcap: 30 }];
  const result = allocateStudents([], classes);
  assert.strictEqual(result.length, 0);
});

test('allocateStudents: each result has class_id and studentid', () => {
  const students = [{ studentid: 42 }];
  const classes = [{ class_id: 10, class_name: 'P1', classcap: 30 }];
  const result = allocateStudents(students, classes);
  assert.strictEqual(result[0].class_id, 10);
  assert.strictEqual(result[0].studentid, 42);
});

// ── Summary ───────────────────────────────────────────────────────────────────
console.log('');
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed > 0) process.exit(1);
