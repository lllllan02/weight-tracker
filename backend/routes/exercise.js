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
    const { date, duration } = req.body;
    
    if (!date) {
      return res.status(400).json({ error: '日期是必需的' });
    }

    // 验证运动时长
    if (duration !== undefined && duration !== null) {
      if (typeof duration !== 'number' || duration < 0) {
        return res.status(400).json({ error: '运动时长必须是非负数' });
      }
    }

    const data = readData();
    const exerciseRecords = data.exerciseRecords || [];
    
    // 检查是否已存在该日期的记录
    const existingIndex = exerciseRecords.findIndex(record => 
      record.date.split('T')[0] === date.split('T')[0]
    );
    
    let exerciseRecord;
    
    // 如果时长为 0 或 null/undefined，删除该记录
    if (!duration || duration === 0) {
      if (existingIndex >= 0) {
        exerciseRecords.splice(existingIndex, 1);
      }
      data.exerciseRecords = exerciseRecords;
      writeData(data);
      return res.json({ message: '运动记录已清除' });
    }
    
    if (existingIndex >= 0) {
      // 更新现有记录，保留原有的 id
      exerciseRecord = {
        ...exerciseRecords[existingIndex],
        date: date,
        duration: duration
      };
      exerciseRecords[existingIndex] = exerciseRecord;
    } else {
      // 添加新记录
      exerciseRecord = {
        id: generateId(),
        date: date,
        duration: duration
      };
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
    const { date, duration } = req.body;

    // 验证运动时长
    if (duration !== undefined && duration !== null) {
      if (typeof duration !== 'number' || duration < 0) {
        return res.status(400).json({ error: '运动时长必须是非负数' });
      }
    }

    const data = readData();
    const exerciseRecords = data.exerciseRecords || [];
    
    const recordIndex = exerciseRecords.findIndex(record => record.id === id);
    if (recordIndex === -1) {
      return res.status(404).json({ error: '运动记录不存在' });
    }
    
    // 如果时长为 0 或 null/undefined，删除该记录
    if (!duration || duration === 0) {
      exerciseRecords.splice(recordIndex, 1);
      data.exerciseRecords = exerciseRecords;
      writeData(data);
      return res.json({ message: '运动记录已清除' });
    }
    
    exerciseRecords[recordIndex] = {
      ...exerciseRecords[recordIndex],
      date: date || exerciseRecords[recordIndex].date,
      duration: duration
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