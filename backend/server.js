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
      thisWeek: 0
    };
  }

  const sortedRecords = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const current = sortedRecords[sortedRecords.length - 1].weight;
  const previous = sortedRecords.length > 1 ? sortedRecords[sortedRecords.length - 2].weight : current;
  
  const weights = records.map(r => r.weight);
  const average = Number((weights.reduce((sum, w) => sum + w, 0) / weights.length).toFixed(1));
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const bmi = calculateBMI(current, safeProfile.height);
  const change = Number((current - previous).toFixed(1));

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

  return {
    current,
    average,
    min,
    max,
    bmi,
    change,
    totalRecords: records.length,
    thisMonth,
    thisWeek
  };
}

// 计算图表数据
function calculateChartData(records) {
  if (records.length === 0) {
    return { labels: [], datasets: [] };
  }

  const sortedRecords = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  return {
    labels: sortedRecords.map(r => formatDate(r.date)),
    datasets: [{
      label: '体重 (kg)',
      data: sortedRecords.map(r => r.weight),
      borderColor: '#0ea5e9',
      backgroundColor: 'rgba(14, 165, 233, 0.1)',
      tension: 0.1,
      fill: true
    }]
  };
}

// 计算日历数据
function calculateCalendarData(records) {
  const timeSlots = [
    { key: 'morning', label: '早上', hour: 8, minute: 0, color: '#52c41a' },
    { key: 'night', label: '睡前', hour: 23, minute: 0, color: '#722ed1' }
  ];

  const dayRecords = {};
  
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
    }
  });

  return {
    timeSlots,
    dayRecords
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
  const chartData = calculateChartData(data.records);
  res.json(chartData);
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

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Available APIs:');
  console.log('- GET  /api/health   - 健康检查');
  console.log('- GET  /api/calendar - 日历面板数据');
  console.log('- GET  /api/stats    - 统计面板数据');
  console.log('- GET  /api/chart    - 图表面板数据');
  console.log('- GET  /api/profile  - 用户资料');
  console.log('- PUT  /api/profile  - 更新用户资料');
  console.log('- GET  /api/records  - 获取所有记录');
  console.log('- POST /api/records  - 添加记录');
  console.log('- PUT  /api/records/:id - 更新记录');
  console.log('- DELETE /api/records/:id - 删除记录');
}); 