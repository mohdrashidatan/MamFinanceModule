'use strict';

const { getAttendanceDashboard } = require('../models/attendanceDashboardModel');
const { asyncHandler } = require('../middlewares/responseHandler');

/**
 * GET /api/attendance/dashboard
 * @query {string} from  Start date YYYY-MM-DD (inclusive)
 * @query {string} to    End date YYYY-MM-DD (inclusive), max 90 days from `from`
 */
const getDashboard = asyncHandler(async (req, res) => {
  const { from, to } = req.query;

  if (!from || !to) {
    return res.error('Query params "from" and "to" are required (YYYY-MM-DD)', 400);
  }

  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(from) || !dateRegex.test(to)) {
    return res.error('"from" and "to" must be in YYYY-MM-DD format', 400);
  }

  function isValidDate(str) {
    const d = new Date(str + 'T00:00:00');
    return !isNaN(d.getTime()) && d.toISOString().slice(0, 10) === str;
  }
  if (!isValidDate(from) || !isValidDate(to)) {
    return res.error('"from" and "to" must be valid calendar dates', 400);
  }

  if (from > to) {
    return res.error('"from" must be before or equal to "to"', 400);
  }

  const diffMs   = new Date(to + 'T00:00:00') - new Date(from + 'T00:00:00');
  const diffDays = Math.round(diffMs / 86400000);
  if (diffDays > 90) {
    return res.error('Date range cannot exceed 90 days', 400);
  }

  const data = await getAttendanceDashboard(from, to);
  return res.success(data);
});

module.exports = { getDashboard };
