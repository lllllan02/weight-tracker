const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data.json');

// 读取数据
function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return { 
        records: [], 
        exerciseRecords: [],
        profile: { height: 170, targetWeight: 65, theme: 'light' },
        aiReports: { weekly: {}, monthly: {}, allTime: null }
      };
    }
    
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    
    // 确保数据结构完整
    return {
      records: data.records || [],
      exerciseRecords: data.exerciseRecords || [],
      profile: data.profile || { height: 170, targetWeight: 65, theme: 'light' },
      aiReports: data.aiReports || { weekly: {}, monthly: {}, allTime: null }
    };
  } catch (error) {
    console.error('读取数据文件失败，使用默认数据:', error.message);
    return { 
      records: [], 
      exerciseRecords: [],
      profile: { height: 170, targetWeight: 65, theme: 'light' },
      aiReports: { weekly: {}, monthly: {}, allTime: null }
    };
  }
}

// 写入数据
function writeData(data) {
  try {
    // 确保只写入核心数据
    const coreData = {
      records: data.records || [],
      exerciseRecords: data.exerciseRecords || [],
      profile: data.profile || { height: 170, targetWeight: 65, theme: 'light' },
      aiReports: data.aiReports || { weekly: {}, monthly: {}, allTime: null }
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

// 验证运动记录
function validateExerciseRecord(record) {
  if (!record || typeof record !== 'object') {
    return false;
  }
  
  if (!record.id || !record.date || typeof record.exercise !== 'boolean') {
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

module.exports = {
  readData,
  writeData,
  validateRecord,
  validateExerciseRecord,
  validateProfile,
  DATA_FILE
}; 