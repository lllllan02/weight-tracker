const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());

// 读取数据
function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return { 
        records: [], 
        profile: { height: 170, targetWeight: 65, theme: 'light' }
      };
    }
    
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    
    // 确保数据结构完整
    return {
      records: data.records || [],
      profile: data.profile || { height: 170, targetWeight: 65, theme: 'light' }
    };
  } catch (error) {
    console.error('读取数据文件失败，使用默认数据:', error.message);
    return { 
      records: [], 
      profile: { height: 170, targetWeight: 65, theme: 'light' }
    };
  }
}

// 写入数据
function writeData(data) {
  try {
    // 确保只写入核心数据
    const coreData = {
      records: data.records || [],
      profile: data.profile || { height: 170, targetWeight: 65, theme: 'light' }
    };
    
    fs.writeFileSync(DATA_FILE, JSON.stringify(coreData, null, 2), 'utf-8');
  } catch (error) {
    console.error('写入数据文件失败:', error.message);
    throw new Error('数据保存失败');
  }
}

// 验证记录数据
function validateRecord(record) {
  if (!record || typeof record !== 'object') {
    return false;
  }
  
  if (!record.id || !record.date || typeof record.weight !== 'number') {
    return false;
  }
  
  if (record.weight <= 0 || record.weight > 500) {
    return false;
  }
  
  if (!record.fasting || !['空腹', '非空腹'].includes(record.fasting)) {
    return false;
  }
  
  // 运动字段是可选的布尔值
  if (record.exercise !== undefined && typeof record.exercise !== 'boolean') {
    return false;
  }
  
  return true;
}

// 验证用户资料
function validateProfile(profile) {
  if (!profile || typeof profile !== 'object') {
    return false;
  }
  
  if (typeof profile.height !== 'number' || profile.height <= 0 || profile.height > 300) {
    return false;
  }
  
  return true;
}

// 计算BMI
function calculateBMI(weight, height) {
  const heightInMeters = height / 100;
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
}

// 格式化日期
function formatDate(dateString) {
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${month}月${day}日 ${hours}:${minutes}`;
}

// 计算统计数据
function calculateStats(records, profile) {
  // 确保profile存在且有默认值
  const safeProfile = profile || { height: 170, targetWeight: 65, theme: 'light' };
  
  if (records.length === 0) {
    return {
      current: 0,
      average: 0,
      min: 0,
      max: 0,
      bmi: 0,
      change: 0,
      totalRecords: 0,
      thisMonth: 0,
      thisWeek: 0,
      targetProgress: 0,
      targetRemaining: 0
    };
  }

  const sortedRecords = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const current = sortedRecords[sortedRecords.length - 1].weight;
  const initialWeight = sortedRecords[0].weight;
  
  const weights = records.map(r => r.weight);
  const average = Number((weights.reduce((sum, w) => sum + w, 0) / weights.length).toFixed(1));
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const bmi = calculateBMI(current, safeProfile.height);
  const change = Number((current - initialWeight).toFixed(1));

  // 计算本月和本周记录数
  const now = new Date();
  const thisMonth = records.filter(r => {
    const recordDate = new Date(r.date);
    return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
  }).length;

  const thisWeek = records.filter(r => {
    const recordDate = new Date(r.date);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return recordDate >= weekStart && recordDate <= weekEnd;
  }).length;

  // 计算目标进度
  let targetProgress = 0;
  let targetRemaining = 0;
  
  if (safeProfile.targetWeight && safeProfile.targetWeight > 0) {
    // 计算目标进度
    const targetWeight = safeProfile.targetWeight;
    const isLosingWeight = initialWeight > targetWeight; // 初始体重 > 目标体重 = 需要减重
    
    if (isLosingWeight) {
      // 减重情况：从初始体重到目标体重
      const totalChange = initialWeight - targetWeight;
      const currentChange = initialWeight - current;
      
      if (totalChange > 0) {
        targetProgress = Math.min(100, Math.max(0, (currentChange / totalChange) * 100));
      }
    } else {
      // 增重情况：从初始体重到目标体重
      const totalChange = targetWeight - initialWeight;
      const currentChange = current - initialWeight;
      
      if (totalChange > 0) {
        targetProgress = Math.min(100, Math.max(0, (currentChange / totalChange) * 100));
      }
    }
    
    targetRemaining = Number((targetWeight - current).toFixed(1));
  }

  return {
    current,
    average,
    min,
    max,
    bmi,
    change,
    totalRecords: records.length,
    thisMonth,
    thisWeek,
    targetProgress: Number(targetProgress.toFixed(1)),
    targetRemaining,
    initialWeight: records.length > 0 ? sortedRecords[0].weight : 0
  };
}

// 计算图表数据
function calculateChartData(records, profile) {
  if (records.length === 0) {
    return { labels: [], datasets: [] };
  }

  const sortedRecords = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // 计算BMI数据
  const bmiData = sortedRecords.map(r => calculateBMI(r.weight, profile.height));
  
  // 计算体重变化速度 (kg/天)
  const weightChangeRate = sortedRecords.map((record, index) => {
    if (index === 0) return 0; // 第一条记录没有变化速度
    const currentWeight = record.weight;
    const previousWeight = sortedRecords[index - 1].weight;
    const currentDate = new Date(record.date);
    const previousDate = new Date(sortedRecords[index - 1].date);
    const daysDiff = (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff === 0) return 0;
    return Number(((currentWeight - previousWeight) / daysDiff).toFixed(2));
  });
  
  return {
    labels: sortedRecords.map(r => formatDate(r.date)),
    datasets: [
      {
        label: '体重 (kg)',
        data: sortedRecords.map(r => r.weight),
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        tension: 0.1,
        fill: true,
        yAxisID: 'y'
      },
      {
        label: 'BMI',
        data: bmiData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.1,
        fill: false,
        yAxisID: 'y1'
      },
      {
        label: '变化速度 (kg/天)',
        data: weightChangeRate,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.1,
        fill: false,
        yAxisID: 'y2'
      }
    ]
  };
}

// 计算日历数据
function calculateCalendarData(records) {
  const timeSlots = [
    { key: 'morning', label: '早上', hour: 8, minute: 0, color: '#52c41a' },
    { key: 'night', label: '睡前', hour: 23, minute: 0, color: '#722ed1' }
  ];

  const dayRecords = {};
  const exerciseRecords = {};
  
  records.forEach(record => {
    const date = new Date(record.date);
    const hour = date.getHours();
    const timeSlot = timeSlots.find(slot => slot.hour === hour);
    
    if (timeSlot) {
      const dateKey = date.toISOString().split('T')[0];
      if (!dayRecords[dateKey]) {
        dayRecords[dateKey] = {};
      }
      dayRecords[dateKey][timeSlot.key] = record;
      
      // 如果记录中有运动标记，保存到运动记录中
      if (record.exercise) {
        exerciseRecords[dateKey] = true;
      }
    }
  });

  return {
    timeSlots,
    dayRecords,
    exerciseRecords
  };
}

// 生成周报
function generateWeeklyReport(records, profile) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const weekRecords = records.filter(r => {
    const recordDate = new Date(r.date);
    return recordDate >= weekStart && recordDate <= weekEnd;
  });

  if (weekRecords.length === 0) {
    return {
      period: `${weekStart.toLocaleDateString('zh-CN')} - ${weekEnd.toLocaleDateString('zh-CN')}`,
      type: 'weekly',
      records: [],
      stats: {
        startWeight: 0,
        endWeight: 0,
        change: 0,
        average: 0,
        min: 0,
        max: 0,
        recordCount: 0
      },
      insights: ['本周暂无记录']
    };
  }

  const sortedWeekRecords = weekRecords.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const startWeight = sortedWeekRecords[0].weight;
  const endWeight = sortedWeekRecords[sortedWeekRecords.length - 1].weight;
  const change = Number((endWeight - startWeight).toFixed(1));
  const weights = weekRecords.map(r => r.weight);
  const average = Number((weights.reduce((sum, w) => sum + w, 0) / weights.length).toFixed(1));
  const min = Math.min(...weights);
  const max = Math.max(...weights);

  const insights = [];
  if (change > 0) {
    insights.push(`本周体重增加了 ${change}kg`);
  } else if (change < 0) {
    insights.push(`本周体重减少了 ${Math.abs(change)}kg`);
  } else {
    insights.push('本周体重保持稳定');
  }

  if (weekRecords.length >= 5) {
    insights.push('记录频率良好，继续保持！');
  } else if (weekRecords.length >= 3) {
    insights.push('建议增加记录频率');
  } else {
    insights.push('本周记录较少，建议每天称重');
  }

  if (profile.targetWeight) {
    const remaining = Number((profile.targetWeight - endWeight).toFixed(1));
    if (Math.abs(remaining) <= 1) {
      insights.push('接近目标体重！');
    } else if (remaining > 0) {
      insights.push(`距离目标体重还需减重 ${remaining}kg`);
    } else {
      insights.push(`距离目标体重还有 ${Math.abs(remaining)}kg`);
    }
  }

  return {
    period: `${weekStart.toLocaleDateString('zh-CN')} - ${weekEnd.toLocaleDateString('zh-CN')}`,
    type: 'weekly',
    records: weekRecords,
    stats: {
      startWeight,
      endWeight,
      change,
      average,
      min,
      max,
      recordCount: weekRecords.length
    },
    insights
  };
}

// 生成月报
function generateMonthlyReport(records, profile) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const monthRecords = records.filter(r => {
    const recordDate = new Date(r.date);
    return recordDate >= monthStart && recordDate <= monthEnd;
  });

  if (monthRecords.length === 0) {
    return {
      period: `${monthStart.getFullYear()}年${monthStart.getMonth() + 1}月`,
      type: 'monthly',
      records: [],
      stats: {
        startWeight: 0,
        endWeight: 0,
        change: 0,
        average: 0,
        min: 0,
        max: 0,
        recordCount: 0,
        weeklyAverages: []
      },
      insights: ['本月暂无记录']
    };
  }

  const sortedMonthRecords = monthRecords.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const startWeight = sortedMonthRecords[0].weight;
  const endWeight = sortedMonthRecords[sortedMonthRecords.length - 1].weight;
  const change = Number((endWeight - startWeight).toFixed(1));
  const weights = monthRecords.map(r => r.weight);
  const average = Number((weights.reduce((sum, w) => sum + w, 0) / weights.length).toFixed(1));
  const min = Math.min(...weights);
  const max = Math.max(...weights);

  // 计算每周平均体重
  const weeklyAverages = [];
  for (let i = 0; i < 4; i++) {
    const weekStart = new Date(monthStart);
    weekStart.setDate(monthStart.getDate() + i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const weekRecords = monthRecords.filter(r => {
      const recordDate = new Date(r.date);
      return recordDate >= weekStart && recordDate <= weekEnd;
    });
    
    if (weekRecords.length > 0) {
      const weekAverage = Number((weekRecords.reduce((sum, r) => sum + r.weight, 0) / weekRecords.length).toFixed(1));
      weeklyAverages.push(weekAverage);
    } else {
      weeklyAverages.push(0);
    }
  }

  const insights = [];
  if (change > 0) {
    insights.push(`本月体重增加了 ${change}kg`);
  } else if (change < 0) {
    insights.push(`本月体重减少了 ${Math.abs(change)}kg`);
  } else {
    insights.push('本月体重保持稳定');
  }

  if (monthRecords.length >= 20) {
    insights.push('本月记录非常频繁，数据质量很高！');
  } else if (monthRecords.length >= 15) {
    insights.push('本月记录频率良好');
  } else if (monthRecords.length >= 10) {
    insights.push('建议增加记录频率以获得更准确的数据');
  } else {
    insights.push('本月记录较少，建议每天称重');
  }

  if (profile.targetWeight) {
    const remaining = Number((profile.targetWeight - endWeight).toFixed(1));
    if (Math.abs(remaining) <= 2) {
      insights.push('非常接近目标体重！');
    } else if (remaining > 0) {
      insights.push(`距离目标体重还需减重 ${remaining}kg`);
    } else {
      insights.push(`距离目标体重还有 ${Math.abs(remaining)}kg`);
    }
  }

  // 分析体重变化趋势
  if (weeklyAverages.filter(w => w > 0).length >= 2) {
    const validAverages = weeklyAverages.filter(w => w > 0);
    const trend = validAverages[validAverages.length - 1] - validAverages[0];
    if (trend > 0.5) {
      insights.push('体重呈上升趋势，建议注意饮食控制');
    } else if (trend < -0.5) {
      insights.push('体重呈下降趋势，继续保持！');
    } else {
      insights.push('体重变化平稳');
    }
  }

  return {
    period: `${monthStart.getFullYear()}年${monthStart.getMonth() + 1}月`,
    type: 'monthly',
    records: monthRecords,
    stats: {
      startWeight,
      endWeight,
      change,
      average,
      min,
      max,
      recordCount: monthRecords.length,
      weeklyAverages
    },
    insights
  };
}

// ===== 日历面板接口 =====
// 获取日历数据（包含时间段配置和按日期组织的记录）
app.get('/api/calendar', (req, res) => {
  const data = readData();
  const calendarData = calculateCalendarData(data.records);
  res.json(calendarData);
});

// ===== 统计面板接口 =====
// 获取统计数据（包含所有统计指标）
app.get('/api/stats', (req, res) => {
  const data = readData();
  const stats = calculateStats(data.records, data.profile);
  res.json(stats);
});

// ===== 图表面板接口 =====
// 获取图表数据（包含标签和数据集）
app.get('/api/chart', (req, res) => {
  const data = readData();
  const chartData = calculateChartData(data.records, data.profile);
  res.json(chartData);
});

// ===== 报告接口 =====
// 获取周报
app.get('/api/reports/weekly', (req, res) => {
  const data = readData();
  const weeklyReport = generateWeeklyReport(data.records, data.profile);
  res.json(weeklyReport);
});

// 获取月报
app.get('/api/reports/monthly', (req, res) => {
  const data = readData();
  const monthlyReport = generateMonthlyReport(data.records, data.profile);
  res.json(monthlyReport);
});

// ===== 用户资料接口 =====
app.get('/api/profile', (req, res) => {
  const data = readData();
  res.json(data.profile || {});
});

app.put('/api/profile', (req, res) => {
  try {
    const data = readData();
    const profile = req.body;
    
    if (!validateProfile(profile)) {
      return res.status(400).json({ error: 'Invalid profile data' });
    }
    
    data.profile = profile;
    writeData(data);
    res.json({ success: true });
  } catch (error) {
    console.error('更新用户资料失败:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ===== 记录管理接口 =====
// 获取所有记录（原始数据）
app.get('/api/records', (req, res) => {
  const data = readData();
  res.json(data.records || []);
});

// 添加记录
app.post('/api/records', (req, res) => {
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
app.put('/api/records/:id', (req, res) => {
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
app.delete('/api/records/:id', (req, res) => {
  const data = readData();
  const id = req.params.id;
  
  data.records = (data.records || []).filter(r => r.id !== id);
  writeData(data);
  
  res.json({ success: true });
});

// 健康检查接口
app.get('/api/health', (req, res) => {
  try {
    const data = readData();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      dataIntegrity: {
        recordsCount: data.records.length,
        profileExists: !!data.profile,
        hasValidProfile: validateProfile(data.profile)
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// ===== 数据备份接口 =====
// 导出数据
app.get('/api/export', (req, res) => {
  try {
    const data = readData();
    const exportData = {
      ...data,
      exportInfo: {
        timestamp: new Date().toISOString(),
        version: '1.0',
        recordCount: data.records ? data.records.length : 0
      }
    };
    
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="weight-tracker-backup-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(exportData);
  } catch (error) {
    console.error('导出数据失败:', error.message);
    res.status(500).json({ error: '导出数据失败' });
  }
});

// 导入数据
app.post('/api/import', (req, res) => {
  try {
    const importData = req.body;
    
    // 验证导入数据的结构
    if (!importData || typeof importData !== 'object') {
      return res.status(400).json({ error: '无效的数据格式' });
    }
    
    // 验证记录数据
    if (importData.records && Array.isArray(importData.records)) {
      for (const record of importData.records) {
        if (!validateRecord(record)) {
          return res.status(400).json({ error: '记录数据格式无效' });
        }
      }
    }
    
    // 验证用户资料
    if (importData.profile && !validateProfile(importData.profile)) {
      return res.status(400).json({ error: '用户资料格式无效' });
    }
    
    // 备份当前数据
    const currentData = readData();
    const backupData = {
      ...currentData,
      backupInfo: {
        timestamp: new Date().toISOString(),
        reason: 'import_backup'
      }
    };
    
    // 确保备份目录存在
    const backupDir = path.join(__dirname, 'data');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // 保存备份
    const backupPath = path.join(backupDir, `backup-${new Date().toISOString().replace(/[:.]/g, '-')}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    
    // 写入新数据
    const newData = {
      records: importData.records || [],
      profile: importData.profile || {}
    };
    writeData(newData);
    
    res.json({ 
      success: true, 
      message: '数据导入成功',
      backupPath: backupPath,
      importedRecords: newData.records.length
    });
  } catch (error) {
    console.error('导入数据失败:', error.message);
    res.status(500).json({ error: '导入数据失败' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Available APIs:');
  console.log('- GET  /api/health   - 健康检查');
  console.log('- GET  /api/calendar - 日历面板数据');
  console.log('- GET  /api/stats    - 统计面板数据');
  console.log('- GET  /api/chart    - 图表面板数据');
  console.log('- GET  /api/reports/weekly  - 周报');
  console.log('- GET  /api/reports/monthly - 月报');
  console.log('- GET  /api/profile  - 用户资料');
  console.log('- PUT  /api/profile  - 更新用户资料');
  console.log('- GET  /api/records  - 获取所有记录');
  console.log('- POST /api/records  - 添加记录');
  console.log('- PUT  /api/records/:id - 更新记录');
  console.log('- DELETE /api/records/:id - 删除记录');
  console.log('- GET  /api/export   - 导出数据备份');
  console.log('- POST /api/import   - 导入数据备份');
}); 