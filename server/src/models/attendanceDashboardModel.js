'use strict';

const pool = require('../config/db');

/**
 * Transforms raw query rows into the API response shape.
 * Exported for unit testing.
 *
 * @param {{ date: string, status: string, count: number|string }[]} currentRows
 * @param {{ status: string, count: number|string }[]} previousRows
 * @returns {{ kpi: object, chart: object[] }}
 */
function buildResponse(currentRows, previousRows) {
  // Chart: group by date, pivot status
  const dateMap = {};
  for (const row of currentRows) {
    const d = row.date instanceof Date
      ? `${row.date.getFullYear()}-${String(row.date.getMonth() + 1).padStart(2, '0')}-${String(row.date.getDate()).padStart(2, '0')}`
      : String(row.date).slice(0, 10);
    if (!dateMap[d]) {
      dateMap[d] = { date: d, present: 0, absent: 0, late: 0, excused: 0, onLeave: 0 };
    }
    const key = row.status === 'on_leave' ? 'onLeave' : row.status;
    dateMap[d][key] = (dateMap[d][key] || 0) + Number(row.count);
  }
  const chart = Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));

  // KPI: current period totals
  const cur = { present: 0, absent: 0, late: 0, excused: 0, on_leave: 0 };
  for (const row of currentRows) {
    cur[row.status] = (cur[row.status] || 0) + Number(row.count);
  }
  // on_leave is included in the denominator for overallRate but not exposed as a separate KPI field
  const curTotal = Object.values(cur).reduce((a, b) => a + b, 0);
  const curRate  = curTotal > 0 ? Math.round((cur.present / curTotal) * 1000) / 10 : 0;

  // KPI: previous period totals
  const prev = { present: 0, absent: 0, late: 0, excused: 0, on_leave: 0 };
  for (const row of previousRows) {
    prev[row.status] = (prev[row.status] || 0) + Number(row.count);
  }
  const prevTotal = Object.values(prev).reduce((a, b) => a + b, 0);
  const prevRate  = prevTotal > 0 ? Math.round((prev.present / prevTotal) * 1000) / 10 : 0;

  return {
    kpi: {
      overallRate:  curRate,
      totalAbsent:  cur.absent,
      lateCases:    cur.late,
      excused:      cur.excused,
      deltaRate:    Math.round((curRate - prevRate) * 10) / 10,
      deltaAbsent:  cur.absent  - prev.absent,
      deltaLate:    cur.late    - prev.late,
      deltaExcused: cur.excused - prev.excused,
    },
    chart,
  };
}

/**
 * Fetch attendance data for a date range plus the equivalent previous period.
 * @param {string} from  YYYY-MM-DD
 * @param {string} to    YYYY-MM-DD
 */
async function getAttendanceDashboard(from, to) {
  const periodSql = `
    SELECT
      DATE(s.attendance_date)  AS date,
      e.status                 AS status,
      COUNT(*)                 AS count
    FROM attendance_entry e
    JOIN attendance_session s
      ON s.attendance_session_id = e.attendance_session_id
    WHERE s.attendance_date BETWEEN ? AND ?
      AND e.active = 1
      AND s.active = 1
    GROUP BY DATE(s.attendance_date), e.status
    ORDER BY DATE(s.attendance_date)
  `;

  const totalsSql = `
    SELECT
      e.status  AS status,
      COUNT(*)  AS count
    FROM attendance_entry e
    JOIN attendance_session s
      ON s.attendance_session_id = e.attendance_session_id
    WHERE s.attendance_date BETWEEN ? AND ?
      AND e.active = 1
      AND s.active = 1
    GROUP BY e.status
  `;

  // Previous period: same length, immediately before from
  // Use UTC arithmetic to avoid timezone-related off-by-one day errors
  function addDays(dateStr, n) {
    const [y, m, d] = dateStr.split('-').map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d + n));
    return dt.toISOString().slice(0, 10);
  }

  const fromDate = new Date(from + 'T00:00:00');
  const toDate   = new Date(to   + 'T00:00:00');
  const n        = Math.round((toDate - fromDate) / 86400000) + 1;
  const prevToStr   = addDays(from, -1);
  const prevFromStr = addDays(from, -n);

  const [[currentRows], [previousRows]] = await Promise.all([
    pool.execute(periodSql, [from, to]),
    pool.execute(totalsSql, [prevFromStr, prevToStr]),
  ]);

  return buildResponse(currentRows, previousRows);
}

/**
 * Fetch attendance heatmap data (presence % per class per weekday) for a date range.
 * @param {string} from  YYYY-MM-DD
 * @param {string} to    YYYY-MM-DD
 * @returns {Promise<Array>}
 */
async function getAttendanceHeatmap(from, to) {
  const sql = `
    SELECT
      c.class_id,
      c.class_name,
      c.class_code,
      DAYOFWEEK(s.attendance_date)                                   AS dow,
      COUNT(*)                                                       AS total,
      SUM(CASE WHEN e.status = 'present' THEN 1 ELSE 0 END)         AS present_count
    FROM attendance_entry e
    JOIN attendance_session s
      ON s.attendance_session_id = e.attendance_session_id
    JOIN class c
      ON c.class_id = s.class_id
    WHERE s.attendance_date BETWEEN ? AND ?
      AND e.active = 1
      AND s.active = 1
      AND c.active = 1
    GROUP BY c.class_id, c.class_name, c.class_code, DAYOFWEEK(s.attendance_date)
  `;

  const [rows] = await pool.execute(sql, [from, to]);

  // DOW mapping: MySQL DAYOFWEEK 1=Sun,2=Mon,...,7=Sat
  const dowKey = { 2: 'mon', 3: 'tue', 4: 'wed', 5: 'thu', 6: 'fri' };

  // Build a map keyed by class_id
  const classMap = {};
  for (const row of rows) {
    const id = row.class_id;
    if (!classMap[id]) {
      classMap[id] = {
        classId:   id,
        className: row.class_name,
        classCode: row.class_code,
        mon: null,
        tue: null,
        wed: null,
        thu: null,
        fri: null,
      };
    }
    const key = dowKey[row.dow];
    if (key) { // weekends (dow 1=Sun, 7=Sat) are excluded from the heatmap
      const total        = Number(row.total);
      const presentCount = Number(row.present_count);
      const pct          = total > 0 ? Math.round((presentCount / total) * 1000) / 10 : 0;
      classMap[id][key]  = { pct, total };
    }
  }

  return Object.values(classMap).sort((a, b) => a.className.localeCompare(b.className));
}

module.exports = { getAttendanceDashboard, buildResponse, getAttendanceHeatmap };
