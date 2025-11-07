const express = require('express');
const router = express.Router();
const { readData, writeData, ensureDailyRecord, formatDateKey, getCompleteRecords } = require('../utils/dataManager');

// 标记某天的记录为完整
router.post('/mark', (req, res) => {
  try {
    const { date } = req.body;
    
    if (!date) {
      return res.status(400).json({ error: '日期不能为空' });
    }

    const data = readData();
    const dateKey = formatDateKey(date);
    
    // 确保日期记录存在
    ensureDailyRecord(data.dailyRecords, dateKey);
    
    // 标记为完整
    data.dailyRecords[dateKey].isComplete = true;
    writeData(data);

    res.json({ 
      success: true, 
      message: '已标记为完整记录',
      date: dateKey 
    });
  } catch (error) {
    console.error('标记完整记录失败:', error);
    res.status(500).json({ error: '标记失败' });
  }
});

// 取消某天的完整记录标记
router.delete('/mark', (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: '日期不能为空' });
    }

    const data = readData();
    const dateKey = formatDateKey(date);
    
    // 如果日期记录存在，取消完整标记
    if (data.dailyRecords[dateKey]) {
      data.dailyRecords[dateKey].isComplete = false;
      writeData(data);
    }

    res.json({ 
      success: true, 
      message: '已取消完整记录标记',
      date: dateKey 
    });
  } catch (error) {
    console.error('取消标记失败:', error);
    res.status(500).json({ error: '取消标记失败' });
  }
});

// 获取某天是否标记为完整记录
router.get('/check', (req, res) => {
  try {
    const { date } = req.query;
    
    if (!date) {
      return res.status(400).json({ error: '日期不能为空' });
    }

    const data = readData();
    const dateKey = formatDateKey(date);
    const isComplete = data.dailyRecords[dateKey]?.isComplete || false;

    res.json({ 
      success: true, 
      isComplete,
      date: dateKey 
    });
  } catch (error) {
    console.error('查询失败:', error);
    res.status(500).json({ error: '查询失败' });
  }
});

// 获取所有完整记录的日期（兼容旧API）
router.get('/all', (req, res) => {
  try {
    const data = readData();
    const completeRecords = getCompleteRecords(data);

    res.json({ 
      success: true, 
      completeRecords 
    });
  } catch (error) {
    console.error('获取完整记录列表失败:', error);
    res.status(500).json({ error: '获取失败' });
  }
});

module.exports = router;

