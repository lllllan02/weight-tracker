const express = require('express');
const router = express.Router();
const dayjs = require('dayjs');
const { 
  readData, 
  writeData, 
  validateRecord,
  getAllWeightRecords,
  ensureDailyRecord,
  formatDateKey
} = require('../utils/dataManager');

// 检查并更新达成的阶段目标
function checkAndUpdateMilestones(data, newWeight, recordDate) {
  if (!data.profile?.milestones || data.profile.milestones.length === 0) {
    return;
  }
  
  // 判断是减重还是增重场景
  const allRecords = getAllWeightRecords(data);
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

// 获取所有记录（兼容旧API）
router.get('/', (req, res) => {
  const data = readData();
  res.json(getAllWeightRecords(data));
});

// 添加记录
router.post('/', (req, res) => {
  try {
    const data = readData();
    const record = req.body;
    
    if (!validateRecord(record)) {
      return res.status(400).json({ error: 'Invalid record data' });
    }
    
    // 获取日期key
    const dateKey = formatDateKey(record.date);
    
    // 确保日期记录存在
    ensureDailyRecord(data.dailyRecords, dateKey);
    
    // 判断是早上还是晚上
    const hour = dayjs(record.date).hour();
    const time = hour < 12 ? 'morning' : 'night';
    
    // 添加体重记录
    data.dailyRecords[dateKey].weights.push({
      id: record.id,
      time: time,
      weight: record.weight,
      fasting: record.fasting || null,
      timestamp: record.date
    });
    
    // 按时间排序
    data.dailyRecords[dateKey].weights.sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
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
    
    // 在所有日期中查找该记录
    let found = false;
    for (const dateKey in data.dailyRecords) {
      const dayRecord = data.dailyRecords[dateKey];
      const weightIndex = dayRecord.weights.findIndex(w => w.id === id);
      
      if (weightIndex !== -1) {
        // 找到记录，合并更新
        const existingWeight = dayRecord.weights[weightIndex];
        const hour = dayjs(updatedRecord.date || existingWeight.timestamp).hour();
        const time = hour < 12 ? 'morning' : 'night';
        
        dayRecord.weights[weightIndex] = {
          ...existingWeight,
          weight: updatedRecord.weight ?? existingWeight.weight,
          fasting: updatedRecord.fasting ?? existingWeight.fasting,
          time: time,
          timestamp: updatedRecord.date || existingWeight.timestamp
        };
        
        // 如果日期改变了，需要移动到新日期
        const newDateKey = formatDateKey(updatedRecord.date || existingWeight.timestamp);
        if (newDateKey !== dateKey) {
          const weightToMove = dayRecord.weights[weightIndex];
          dayRecord.weights.splice(weightIndex, 1);
          
          ensureDailyRecord(data.dailyRecords, newDateKey);
          data.dailyRecords[newDateKey].weights.push(weightToMove);
          data.dailyRecords[newDateKey].weights.sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
          );
        }
        
        // 检查并更新阶段目标
        checkAndUpdateMilestones(data, dayRecord.weights[weightIndex].weight, dayRecord.weights[weightIndex].timestamp);
        
        found = true;
        break;
      }
    }
    
    if (!found) {
      return res.status(404).json({ error: 'Record not found' });
    }
    
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
  
  // 在所有日期中查找并删除该记录
  for (const dateKey in data.dailyRecords) {
    const dayRecord = data.dailyRecords[dateKey];
    const originalLength = dayRecord.weights.length;
    dayRecord.weights = dayRecord.weights.filter(w => w.id !== id);
    
    if (dayRecord.weights.length < originalLength) {
      // 如果该天没有任何记录了，删除整个日期记录
      if (dayRecord.weights.length === 0 && dayRecord.exercises.length === 0 && dayRecord.meals.length === 0) {
        delete data.dailyRecords[dateKey];
      }
      break;
    }
  }
  
  writeData(data);
  res.json({ success: true });
});

module.exports = router; 