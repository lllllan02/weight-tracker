const express = require('express');
const router = express.Router();
const { readData } = require('../utils/dataManager');
const { calculateChartData } = require('../utils/calculations');

// 获取图表数据（包含标签和数据集）
router.get('/', (req, res) => {
  const data = readData();
  const chartData = calculateChartData(data.records, data.profile);
  res.json(chartData);
});

module.exports = router; 