# Class Allocation Script Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Write a one-shot Node.js script that allocates active students into classes via `class_roster`, matched by age group, randomly distributed, capped by `class.classcap`.

**Architecture:** Single script file with pure functions (shuffle, allocateStudents) and DB functions (soft-delete, fetch, insert). Pure functions are unit-tested with Node's built-in `assert`. Main function orchestrates the full flow and prints a summary.

**Tech Stack:** Node.js (CommonJS), mysql2/promise, dotenv — all already in `server/node_modules`.

---

## File Map

| Action | Path | Responsibility |
|--------|------|---------------|
| Create | `server/scripts/allocate-classes.js` | Main allocation script |
| Create | `server/scripts/allocate-classes.test.js` | Unit tests for pure functions |

---

### Task 1: Create test file with failing tests for pure functions

**Files:**
- Create: `server/scripts/allocate-classes.test.js`

- [ ] **Step 1: Create the test file**

```js
// server/scripts/allocate-classes.test.js
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
  // first 2 go to class 10, third spills to class 11
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
  assert.strictEqual(result.length, 2); // only 2 fit, 1 skipped
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
```

- [ ] **Step 2: Run tests — verify they all fail with "not implemented"**

```bash
cd server && node scripts/allocate-classes.test.js
```

Expected output: all tests marked `✗` with `Error: not implemented`, exit code 1.

---

### Task 2: Create the script with pure function implementations

**Files:**
- Create: `server/scripts/allocate-classes.js`

- [ ] **Step 1: Create the script file with pure functions exported**

```js
// server/scripts/allocate-classes.js
'use strict';

require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const mysql = require('mysql2/promise');

// ── Pure functions (exported for testing) ─────────────────────────────────────

/**
 * Fisher-Yates shuffle. Returns a new array; does not mutate input.
 * @param {Array} arr
 * @returns {Array}
 */
function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Allocates students into classes sequentially, respecting classcap.
 * Fills the first class to its cap, then spills into the next.
 * Returns only the students that were successfully assigned.
 *
 * @param {{ studentid: number }[]} students  - pre-shuffled list
 * @param {{ class_id: number, class_name: string, classcap: number }[]} classes
 * @returns {{ class_id: number, studentid: number }[]}
 */
function allocateStudents(students, classes) {
  const assignments = [];
  let classIdx = 0;
  let countInCurrentClass = 0;

  for (const student of students) {
    // Advance to a class that still has room
    while (classIdx < classes.length && countInCurrentClass >= classes[classIdx].classcap) {
      classIdx++;
      countInCurrentClass = 0;
    }
    if (classIdx >= classes.length) break; // all classes full

    assignments.push({ class_id: classes[classIdx].class_id, studentid: student.studentid });
    countInCurrentClass++;
  }

  return assignments;
}

module.exports = { shuffle, allocateStudents };
```

- [ ] **Step 2: Update test file to import from the real module**

Replace the stub block (lines 7–11) in `server/scripts/allocate-classes.test.js` with:

```js
const { shuffle, allocateStudents } = require('./allocate-classes');
```

Remove these lines:
```js
function shuffle(arr) { throw new Error('not implemented'); }
function allocateStudents(students, classes) { throw new Error('not implemented'); }
```

- [ ] **Step 3: Run tests — verify they all pass**

```bash
cd server && node scripts/allocate-classes.test.js
```

Expected output:
```
  ✓ shuffle: returns array of same length
  ✓ shuffle: contains all original elements
  ✓ shuffle: does not mutate original array
  ✓ allocateStudents: assigns students to first class up to cap
  ✓ allocateStudents: skips students when all classes are full
  ✓ allocateStudents: returns empty array when no classes
  ✓ allocateStudents: returns empty array when no students
  ✓ allocateStudents: each result has class_id and studentid

Results: 8 passed, 0 failed
```

- [ ] **Step 4: Commit**

```bash
cd server && git add scripts/allocate-classes.js scripts/allocate-classes.test.js
git commit -m "feat: add class allocation script with pure function tests"
```

---

### Task 3: Add DB functions to the script

**Files:**
- Modify: `server/scripts/allocate-classes.js`

- [ ] **Step 1: Add the age-to-level map and DB functions after the `module.exports` line**

Append the following to `server/scripts/allocate-classes.js` (after `module.exports = ...`):

```js
// ── Age → level name map ──────────────────────────────────────────────────────

const AGE_LEVEL_MAP = {
  7:  'Primary 1',
  8:  'Primary 2',
  9:  'Primary 3',
  10: 'Primary 4',
  11: 'Primary 5',
  12: 'Primary 6',
  13: 'Secondary 1',
  14: 'Secondary 2',
  15: 'Secondary 3',
  16: 'Secondary 4',
  17: 'Pre-University 1',
  18: 'Pre-University 2',
};

// ── DB functions ──────────────────────────────────────────────────────────────

async function createConnection() {
  return mysql.createConnection({
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT || '3306', 10),
    user:     process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
}

async function softDeleteRoster(conn) {
  const [result] = await conn.query(
    'UPDATE class_roster SET active = 0, is_current = 0, edited_date = NOW()'
  );
  return result.affectedRows;
}

async function fetchClassesByLevel(conn, levelName) {
  const [rows] = await conn.query(
    `SELECT class_id, class_name, classcap
     FROM \`class\`
     WHERE active = 1
       AND class_name LIKE ?
     ORDER BY class_id`,
    [`${levelName} %`]
  );
  return rows;
}

async function fetchStudentsByAge(conn, age) {
  const [rows] = await conn.query(
    `SELECT studentid
     FROM students
     WHERE active = 1
       AND YEAR(CURDATE()) - YEAR(dob) = ?`,
    [age]
  );
  return rows;
}

async function insertRosterRows(conn, assignments, today) {
  if (assignments.length === 0) return 0;
  const values = assignments.map(a => [
    a.class_id,
    a.studentid,
    1,       // is_current
    today,   // start_date
    1,       // entered_by (admin user id)
    1,       // active
  ]);
  const [result] = await conn.query(
    `INSERT INTO class_roster
       (class_id, studentid, is_current, start_date, entered_by, active)
     VALUES ?`,
    [values]
  );
  return result.affectedRows;
}
```

- [ ] **Step 2: Re-run tests to confirm pure functions still pass (DB functions are not tested here)**

```bash
cd server && node scripts/allocate-classes.test.js
```

Expected: `Results: 8 passed, 0 failed`

- [ ] **Step 3: Commit**

```bash
cd server && git add scripts/allocate-classes.js
git commit -m "feat: add DB functions to class allocation script"
```

---

### Task 4: Add main() and run the script

**Files:**
- Modify: `server/scripts/allocate-classes.js`

- [ ] **Step 1: Append the main function to the end of `server/scripts/allocate-classes.js`**

```js
// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  const conn = await createConnection();
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  try {
    // 1. Soft-delete all existing roster entries
    const deleted = await softDeleteRoster(conn);
    console.log(`\nSoft-deleted ${deleted} existing roster entries.`);

    // 2. Allocate per age group
    let totalAssigned = 0;
    let totalSkipped  = 0;

    for (const [ageStr, levelName] of Object.entries(AGE_LEVEL_MAP)) {
      const age = parseInt(ageStr, 10);

      const classes  = await fetchClassesByLevel(conn, levelName);
      const students = await fetchStudentsByAge(conn, age);

      if (students.length === 0) continue;

      const shuffled     = shuffle(students);
      const assignments  = allocateStudents(shuffled, classes);
      const skipped      = shuffled.length - assignments.length;

      await insertRosterRows(conn, assignments, today);

      totalAssigned += assignments.length;
      totalSkipped  += skipped;

      // Per-class summary
      console.log(`\n${levelName} (age ${age}) — ${students.length} students, ${classes.length} classes`);
      const countPerClass = {};
      for (const a of assignments) {
        countPerClass[a.class_id] = (countPerClass[a.class_id] || 0) + 1;
      }
      for (const cls of classes) {
        const count = countPerClass[cls.class_id] || 0;
        console.log(`  ${cls.class_name.padEnd(35)} ${count}/${cls.classcap}`);
      }
      if (skipped > 0) {
        console.log(`  ⚠ ${skipped} student(s) skipped — classes full`);
      }
    }

    console.log(`\n─────────────────────────────────────`);
    console.log(`Total assigned : ${totalAssigned}`);
    console.log(`Total skipped  : ${totalSkipped}`);
    console.log(`─────────────────────────────────────\n`);

  } finally {
    await conn.end();
  }
}

// Only run main() when executed directly (not when required by tests)
if (require.main === module) {
  main().catch(err => {
    console.error('Allocation failed:', err.message);
    process.exit(1);
  });
}
```

- [ ] **Step 2: Run the script (dry preview — check output before confirming)**

```bash
cd server && node scripts/allocate-classes.js
```

Expected output (approximate):
```
Soft-deleted 33 existing roster entries.

Primary 1 (age 7) — 35 students, 2 classes
  Primary 1 Empathy                   35/35
  Primary 1 Respect                   0/35

...

Secondary 1 (age 13) — 60 students, 2 classes
  Secondary 1 Adaptability            30/30
  Secondary 1 Resilience              30/30

...

Primary 6 (age 12) — 185 students, 2 classes
  Primary 6 Empathy                   35/35
  Primary 6 Respect                   35/35
  ⚠ 115 student(s) skipped — classes full

─────────────────────────────────────
Total assigned : 527
Total skipped  : 117
─────────────────────────────────────
```

- [ ] **Step 3: Verify in the DB that class_roster rows were inserted**

```bash
cd server && node -e "
const mysql = require('mysql2/promise');
require('dotenv').config({ path: '.env' });
(async () => {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST, port: process.env.DB_PORT,
    user: process.env.DB_USER, password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  const [rows] = await conn.query(\`
    SELECT c.class_name, COUNT(*) AS enrolled, c.classcap
    FROM class_roster cr
    JOIN \\\`class\\\` c ON c.class_id = cr.class_id
    WHERE cr.is_current = 1 AND cr.active = 1
    GROUP BY cr.class_id
    ORDER BY c.class_id
  \`);
  console.table(rows);
  await conn.end();
})();
"
```

Expected: each class shows enrolled ≤ classcap, total rows match "Total assigned" from script output.

- [ ] **Step 4: Commit**

```bash
cd server && git add scripts/allocate-classes.js
git commit -m "feat: complete class allocation script with main() and summary output"
```

---

## Self-Review

**Spec coverage:**
- ✅ Soft-delete existing entries → Task 4, Step 1 (softDeleteRoster called in main)
- ✅ Age-to-level mapping → AGE_LEVEL_MAP in Task 3
- ✅ classcap enforcement → allocateStudents pure function, tested in Task 2
- ✅ Random distribution → shuffle + allocateStudents, tested in Task 2
- ✅ Skip when full → Task 2 test "skips students when all classes are full"
- ✅ start_date = today → insertRosterRows, today variable in main
- ✅ is_current=1, active=1, entered_by=1 → insertRosterRows values array
- ✅ Print summary → main() loop output
- ✅ "Primary 7" classes ignored → no entry in AGE_LEVEL_MAP for their age group
- ✅ Anomalous ages (0, 20, 25) skipped → not in AGE_LEVEL_MAP, loop never fetches them

**Placeholder scan:** None found.

**Type consistency:** `allocateStudents` takes `{ studentid }[]` and `{ class_id, class_name, classcap }[]` — matches both the test stubs (Task 1) and the DB fetch results (Task 3). Return type `{ class_id, studentid }[]` matches `insertRosterRows` input.
