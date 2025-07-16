const express = require('express');
const router = express.Router();
const { readData, writeData, validateExerciseRecord } = require('../utils/dataManager');
const { generateId } = require('../utils/helpers');

// 获取所有运动记录
router.get('/', async (req, res) => {
  try {
    const data = readData();
    res.json(data.exerciseRecords || []);
  } catch (error) {
    console.error('获取运动记录失败:', error);
    res.status(500).json({ error: '获取运动记录失败' });
  }
});

// 添加运动记录
router.post('/', async (req, res) => {
  try {
    const { date, exercise } = req.body;
    
    if (!date) {
      return res.status(400).json({ error: '日期是必需的' });
    }
    
    if (typeof exercise !== 'boolean') {
      return res.status(400).json({ error: '运动状态必须是布尔值' });
    }

    const data = readData();
    const exerciseRecords = data.exerciseRecords || [];
    
    // 检查是否已存在该日期的记录
    const existingIndex = exerciseRecords.findIndex(record => 
      record.date.split('T')[0] === date.split('T')[0]
    );
    
    const exerciseRecord = {
      id: generateId(),
      date: date,
      exercise: exercise
    };
    
    if (existingIndex >= 0) {
      // 更新现有记录
      exerciseRecords[existingIndex] = exerciseRecord;
    } else {
      // 添加新记录
      exerciseRecords.push(exerciseRecord);
    }
    
    data.exerciseRecords = exerciseRecords;
    writeData(data);
    
    res.json(exerciseRecord);
  } catch (error) {
    console.error('添加运动记录失败:', error);
    res.status(500).json({ error: '添加运动记录失败' });
  }
});

// 更新运动记录
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { date, exercise } = req.body;
    
    if (typeof exercise !== 'boolean') {
      return res.status(400).json({ error: '运动状态必须是布尔值' });
    }

    const data = readData();
    const exerciseRecords = data.exerciseRecords || [];
    
    const recordIndex = exerciseRecords.findIndex(record => record.id === id);
    if (recordIndex === -1) {
      return res.status(404).json({ error: '运动记录不存在' });
    }
    
    exerciseRecords[recordIndex] = {
      ...exerciseRecords[recordIndex],
      date: date || exerciseRecords[recordIndex].date,
      exercise: exercise
    };
    
    data.exerciseRecords = exerciseRecords;
    writeData(data);
    
    res.json(exerciseRecords[recordIndex]);
  } catch (error) {
    console.error('更新运动记录失败:', error);
    res.status(500).json({ error: '更新运动记录失败' });
  }
});

// 删除运动记录
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const data = readData();
    const exerciseRecords = data.exerciseRecords || [];
    
    const recordIndex = exerciseRecords.findIndex(record => record.id === id);
    if (recordIndex === -1) {
      return res.status(404).json({ error: '运动记录不存在' });
    }
    
    exerciseRecords.splice(recordIndex, 1);
    data.exerciseRecords = exerciseRecords;
    writeData(data);
    
    res.json({ message: '运动记录删除成功' });
  } catch (error) {
    console.error('删除运动记录失败:', error);
    res.status(500).json({ error: '删除运动记录失败' });
  }
});

module.exports = router; 