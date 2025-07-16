const express = require('express');
const router = express.Router();
const { readData, writeData, validateRecord } = require('../utils/dataManager');

// 获取所有记录（原始数据）
router.get('/', (req, res) => {
  const data = readData();
  res.json(data.records || []);
});

// 添加记录
router.post('/', (req, res) => {
  try {
    const data = readData();
    const record = req.body;
    
    if (!validateRecord(record)) {
      return res.status(400).json({ error: 'Invalid record data' });
    }
    
    data.records = data.records || [];
    data.records.push(record);
    writeData(data);
    
    res.json({ success: true });
  } catch (error) {
    console.error('添加记录失败:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 更新记录
router.put('/:id', (req, res) => {
  try {
    const data = readData();
    const id = req.params.id;
    const updatedRecord = req.body;
    
    const recordIndex = data.records.findIndex(r => r.id === id);
    if (recordIndex === -1) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
    // 合并现有记录和更新数据
    const mergedRecord = { ...data.records[recordIndex], ...updatedRecord };
    
    if (!validateRecord(mergedRecord)) {
      return res.status(400).json({ error: 'Invalid record data' });
    }
    
    data.records[recordIndex] = mergedRecord;
    writeData(data);
    
    res.json({ success: true });
  } catch (error) {
    console.error('更新记录失败:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 删除记录
router.delete('/:id', (req, res) => {
  const data = readData();
  const id = req.params.id;
  
  data.records = (data.records || []).filter(r => r.id !== id);
  writeData(data);
  
  res.json({ success: true });
});

module.exports = router; 