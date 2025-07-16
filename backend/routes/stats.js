const express = require('express');
const router = express.Router();
const { readData } = require('../utils/dataManager');
const { calculateStats } = require('../utils/calculations');

// 获取统计数据（包含所有统计指标）
router.get('/', (req, res) => {
  const data = readData();
  const stats = calculateStats(data.records, data.profile);
  res.json(stats);
});

module.exports = router; 