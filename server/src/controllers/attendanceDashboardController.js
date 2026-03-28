'use strict';

const { getAttendanceDashboard } = require('../models/attendanceDashboardModel');

const getDashboard = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: 'Query params "from" and "to" are required (YYYY-MM-DD)',
      });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(from) || !dateRegex.test(to)) {
      return res.status(400).json({
        success: false,
        message: '"from" and "to" must be in YYYY-MM-DD format',
      });
    }

    if (from >= to) {
      return res.status(400).json({
        success: false,
        message: '"from" must be before "to"',
      });
    }

    const diffMs   = new Date(to + 'T00:00:00') - new Date(from + 'T00:00:00');
    const diffDays = Math.round(diffMs / 86400000);
    if (diffDays > 90) {
      return res.status(400).json({
        success: false,
        message: 'Date range cannot exceed 90 days',
      });
    }

    const data = await getAttendanceDashboard(from, to);

    return res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Attendance dashboard error:', error);
    return res.status(500).json({ success: false, message: 'Internal Server Error' });
  }
};

module.exports = { getDashboard };
