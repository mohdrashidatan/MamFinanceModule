'use strict';

const express = require('express');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { getDashboard } = require('../controllers/attendanceDashboardController');

const router = express.Router();

router.get('/dashboard', authenticateToken, getDashboard);

module.exports = router;
