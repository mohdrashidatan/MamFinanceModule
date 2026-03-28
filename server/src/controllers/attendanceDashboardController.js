'use strict';

const { getAttendanceDashboard, getAttendanceHeatmap } = require('../models/attendanceDashboardModel');
const { asyncHandler } = require('../middlewares/responseHandler');

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

/** Returns true only for real calendar dates in YYYY-MM-DD format. Uses UTC to avoid timezone shift. */
function isValidDate(str) {
  const d = new Date(str + 'T00:00:00Z');
  return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === str;
}

/** Returns the number of calendar days between two YYYY-MM-DD strings (UTC, inclusive). */
function diffInDays(from, to) {
  return Math.round((new Date(to + 'T00:00:00Z') - new Date(from + 'T00:00:00Z')) / 86400000);
}

/** Shared date param validation for dashboard endpoints. Returns an error string or null. */
function validateDateRange(from, to) {
  if (!from || !to) return 'Query params "from" and "to" are required (YYYY-MM-DD)';
  if (!DATE_REGEX.test(from) || !DATE_REGEX.test(to)) return '"from" and "to" must be in YYYY-MM-DD format';
  if (!isValidDate(from) || !isValidDate(to)) return '"from" and "to" must be valid calendar dates';
  if (from > to) return '"from" must be before or equal to "to"';
  if (diffInDays(from, to) > 90) return 'Date range cannot exceed 90 days';
  return null;
}

/**
 * GET /api/attendance/dashboard
 * @query {string} from  Start date YYYY-MM-DD (inclusive)
 * @query {string} to    End date YYYY-MM-DD (inclusive), max 90 days from `from`
 */
const getDashboard = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const err = validateDateRange(from, to);
  if (err) return res.error(err, 400);

  const data = await getAttendanceDashboard(from, to);
  return res.success(data);
});

/**
 * GET /api/attendance/heatmap
 * @query {string} from  Start date YYYY-MM-DD (inclusive)
 * @query {string} to    End date YYYY-MM-DD (inclusive), max 90 days from `from`
 */
const getHeatmap = asyncHandler(async (req, res) => {
  const { from, to } = req.query;
  const err = validateDateRange(from, to);
  if (err) return res.error(err, 400);

  const data = await getAttendanceHeatmap(from, to);
  return res.success(data);
});

module.exports = { getDashboard, getHeatmap };
