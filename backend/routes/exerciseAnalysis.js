const express = require('express');
const router = express.Router();
const { readData } = require('../utils/dataManager');
const { generateComprehensiveExerciseAnalysis } = require('../utils/exerciseAnalysis');

// 获取综合运动效果分析
router.get('/', (req, res) => {
  try {
    const data = readData();
    const analysis = generateComprehensiveExerciseAnalysis(
      data.exerciseRecords || [],
      data.records || []
    );
    res.json(analysis);
  } catch (error) {
    console.error('获取运动效果分析失败:', error);
    res.status(500).json({ error: '获取运动效果分析失败' });
  }
});

module.exports = router;

