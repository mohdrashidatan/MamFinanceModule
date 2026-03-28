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
      ? row.date.toISOString().slice(0, 10)
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

module.exports = { getAttendanceDashboard, buildResponse };
