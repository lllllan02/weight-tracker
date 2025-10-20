const express = require('express');
const router = express.Router();
const { readData, writeData, validateRecord } = require('../utils/dataManager');

// 检查并更新达成的阶段目标
function checkAndUpdateMilestones(data, newWeight, recordDate) {
  if (!data.profile?.milestones || data.profile.milestones.length === 0) {
    return;
  }
  
  // 判断是减重还是增重场景
  const allRecords = data.records || [];
  if (allRecords.length === 0) return;
  
  const sortedRecords = [...allRecords].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const initialWeight = sortedRecords[0].weight;
  
  // 检查每个未达成的目标
  data.profile.milestones.forEach(milestone => {
    // 如果已经达成，跳过
    if (milestone.achievedDate) return;
    
    const targetWeight = milestone.targetWeight;
    
    // 减重场景：新体重 <= 目标体重
    // 增重场景：新体重 >= 目标体重
    const isAchieved = initialWeight > targetWeight
      ? newWeight <= targetWeight
      : newWeight >= targetWeight;
    
    if (isAchieved) {
      milestone.achievedDate = recordDate;
      console.log(`🎉 达成阶段目标：${targetWeight}kg，日期：${recordDate}`);
    }
  });
}

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
    
    // 检查并更新阶段目标
    checkAndUpdateMilestones(data, record.weight, record.date);
    
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
    
    // 检查并更新阶段目标
    checkAndUpdateMilestones(data, mergedRecord.weight, mergedRecord.date);
    
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