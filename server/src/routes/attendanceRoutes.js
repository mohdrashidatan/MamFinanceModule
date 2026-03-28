'use strict';

const express = require('express');
const { authenticateToken } = require('../middlewares/authMiddleware');
const { getDashboard, getHeatmap } = require('../controllers/attendanceDashboardController');

const router = express.Router();

router.get('/dashboard', authenticateToken, getDashboard);
router.get('/heatmap', authenticateToken, getHeatmap);

module.exports = router;
