const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../utils/dataManager');

// 标记某天的记录为完整
router.post('/mark', (req, res) => {
  try {
    const { date } = req.body;
    
    if (!date) {
      return res.status(400).json({ error: '日期不能为空' });
    }

    const data = readData();
    
    // 初始化 completeRecords 字段
    if (!data.completeRecords) {
      data.completeRecords = [];
    }

    // 检查是否已存在
    const dateStr = new Date(date).toISOString().split('T')[0];
    if (!data.completeRecords.includes(dateStr)) {
      data.completeRecords.push(dateStr);
      writeData(data);
    }

    res.json({ 
      success: true, 
      message: '已标记为完整记录',
      date: dateStr 
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
    
    if (!data.completeRecords) {
      data.completeRecords = [];
    }

    const dateStr = new Date(date).toISOString().split('T')[0];
    data.completeRecords = data.completeRecords.filter(d => d !== dateStr);
    writeData(data);

    res.json({ 
      success: true, 
      message: '已取消完整记录标记',
      date: dateStr 
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
    const dateStr = new Date(date).toISOString().split('T')[0];
    const isComplete = data.completeRecords && data.completeRecords.includes(dateStr);

    res.json({ 
      success: true, 
      isComplete,
      date: dateStr 
    });
  } catch (error) {
    console.error('查询失败:', error);
    res.status(500).json({ error: '查询失败' });
  }
});

// 获取所有完整记录的日期
router.get('/all', (req, res) => {
  try {
    const data = readData();
    const completeRecords = data.completeRecords || [];

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

