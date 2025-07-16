const express = require('express');
const router = express.Router();
const { readData } = require('../utils/dataManager');
const { generateWeeklyReport, generateMonthlyReport } = require('../utils/reports');

// 获取周报
router.get('/weekly', (req, res) => {
  const data = readData();
  const weeklyReport = generateWeeklyReport(data.records, data.profile);
  res.json(weeklyReport);
});

// 获取月报
router.get('/monthly', (req, res) => {
  const data = readData();
  const monthlyReport = generateMonthlyReport(data.records, data.profile);
  res.json(monthlyReport);
});

module.exports = router; 