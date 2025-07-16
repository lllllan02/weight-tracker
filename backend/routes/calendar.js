const express = require('express');
const router = express.Router();
const { readData } = require('../utils/dataManager');
const { calculateCalendarData } = require('../utils/calculations');

// 获取日历数据（包含时间段配置和按日期组织的记录）
router.get('/', (req, res) => {
  const data = readData();
  const calendarData = calculateCalendarData(
    data.records || [], 
    data.exerciseRecords || []
  );
  res.json(calendarData);
});

module.exports = router; 