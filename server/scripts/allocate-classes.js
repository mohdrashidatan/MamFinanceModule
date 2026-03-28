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
