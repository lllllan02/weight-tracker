const fs = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data.json');

// 读取数据
function readData() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      return { 
        dailyRecords: {},
        profile: { height: 170, targetWeight: 65, theme: 'light' },
        aiReports: { weekly: {}, monthly: {}, allTime: null }
      };
    }
    
    const data = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
    
    // 确保数据结构完整
    return {
      dailyRecords: data.dailyRecords || {},
      profile: data.profile || { height: 170, targetWeight: 65, theme: 'light' },
      aiReports: data.aiReports || { weekly: {}, monthly: {}, allTime: null }
    };
  } catch (error) {
    console.error('读取数据文件失败，使用默认数据:', error.message);
    return { 
      dailyRecords: {},
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
      dailyRecords: data.dailyRecords || {},
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
  
  // 验证出生年份（可选字段）
  if (profile.birthYear !== undefined && profile.birthYear !== null) {
    const currentYear = new Date().getFullYear();
    if (typeof profile.birthYear !== 'number' || profile.birthYear < 1900 || profile.birthYear > currentYear) {
      return false;
    }
  }
  
  // 验证性别（可选字段）
  if (profile.gender !== undefined && profile.gender !== null) {
    if (profile.gender !== 'male' && profile.gender !== 'female') {
      return false;
    }
  }
  
  return true;
}

// 辅助函数：确保日期记录存在
function ensureDailyRecord(dailyRecords, dateKey) {
  if (!dailyRecords[dateKey]) {
    dailyRecords[dateKey] = {
      weights: [],
      exercises: [],
      meals: [],
      isComplete: false
    };
  }
  return dailyRecords[dateKey];
}

// 辅助函数：将旧格式的体重记录转换为日期格式
function formatDateKey(dateString) {
  const dayjs = require('dayjs');
  return dayjs(dateString).format('YYYY-MM-DD');
}

// 辅助函数：获取所有体重记录（兼容旧API）
function getAllWeightRecords(data) {
  const records = [];
  Object.keys(data.dailyRecords || {}).forEach(dateKey => {
    const dayRecord = data.dailyRecords[dateKey];
    if (dayRecord && dayRecord.weights && Array.isArray(dayRecord.weights)) {
      dayRecord.weights.forEach(weight => {
        records.push({
          id: weight.id,
          date: weight.timestamp,
          weight: weight.weight,
          fasting: weight.fasting
        });
      });
    }
  });
  // 按时间排序
  return records.sort((a, b) => new Date(a.date) - new Date(b.date));
}

// 辅助函数：获取所有运动记录（兼容旧API）
function getAllExerciseRecords(data) {
  const records = [];
  Object.keys(data.dailyRecords || {}).forEach(dateKey => {
    const dayRecord = data.dailyRecords[dateKey];
    if (dayRecord && dayRecord.exercises && Array.isArray(dayRecord.exercises)) {
      dayRecord.exercises.forEach(exercise => {
        records.push({
          id: exercise.id,
          date: exercise.timestamp,
          duration: exercise.duration,
          description: exercise.description,
          images: exercise.images,
          estimatedCalories: exercise.estimatedCalories,
          aiAnalysis: exercise.aiAnalysis,
          createdAt: exercise.createdAt,
          updatedAt: exercise.updatedAt
        });
      });
    }
  });
  // 按时间排序
  return records.sort((a, b) => new Date(a.date) - new Date(b.date));
}

// 辅助函数：获取所有饮食记录（兼容旧API）
function getAllMealRecords(data) {
  const records = [];
  Object.keys(data.dailyRecords || {}).forEach(dateKey => {
    const dayRecord = data.dailyRecords[dateKey];
    if (dayRecord && dayRecord.meals && Array.isArray(dayRecord.meals)) {
      dayRecord.meals.forEach(meal => {
        records.push({
          id: meal.id,
          date: meal.timestamp,
          mealType: meal.mealType,
          description: meal.description,
          images: meal.images,
          estimatedCalories: meal.estimatedCalories,
          aiAnalysis: meal.aiAnalysis,
          createdAt: meal.createdAt,
          updatedAt: meal.updatedAt
        });
      });
    }
  });
  // 按时间排序
  return records.sort((a, b) => new Date(a.date) - new Date(b.date));
}

// 辅助函数：获取所有完整记录日期（兼容旧API）
function getCompleteRecords(data) {
  return Object.keys(data.dailyRecords || {}).filter(
    dateKey => data.dailyRecords[dateKey] && data.dailyRecords[dateKey].isComplete
  );
}

module.exports = {
  readData,
  writeData,
  validateRecord,
  validateExerciseRecord,
  validateProfile,
  ensureDailyRecord,
  formatDateKey,
  getAllWeightRecords,
  getAllExerciseRecords,
  getAllMealRecords,
  getCompleteRecords,
  DATA_FILE
}; 