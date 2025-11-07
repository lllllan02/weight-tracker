const express = require('express');
const router = express.Router();
const { readData, getAllWeightRecords, getAllExerciseRecords } = require('../utils/dataManager');

// 获取日历数据（从新的 dailyRecords 结构构建）
router.get('/', (req, res) => {
  const data = readData();
  
  const timeSlots = [
    { key: 'morning', label: '早上', hour: 8, minute: 0, color: '#52c41a' },
    { key: 'night', label: '睡前', hour: 23, minute: 0, color: '#722ed1' }
  ];

  const dayRecords = {};
  const exerciseRecordsMap = {};
  
  // 从 dailyRecords 构建日历数据
  Object.keys(data.dailyRecords || {}).forEach(dateKey => {
    const dayData = data.dailyRecords[dateKey];
    
    // 处理体重记录
    if (dayData.weights && dayData.weights.length > 0) {
      dayRecords[dateKey] = {};
      
      dayData.weights.forEach(weight => {
        const timeSlot = weight.time; // 'morning' or 'night'
        dayRecords[dateKey][timeSlot] = {
          id: weight.id,
          date: weight.timestamp,
          weight: weight.weight,
          fasting: weight.fasting
        };
      });
    }
    
    // 处理运动记录
    if (dayData.exercises && dayData.exercises.length > 0) {
      const totalDuration = dayData.exercises.reduce((sum, ex) => sum + (ex.duration || 0), 0);
      if (totalDuration > 0) {
        exerciseRecordsMap[dateKey] = {
          exercise: true,
          duration: totalDuration
        };
      }
    }
  });

  res.json({
    timeSlots,
    dayRecords,
    exerciseRecords: exerciseRecordsMap
  });
});

module.exports = router; 