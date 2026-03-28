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

      const inserted = await insertRosterRows(conn, assignments, today);

      totalAssigned += inserted;
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
