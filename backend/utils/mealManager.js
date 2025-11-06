const { readData, writeData } = require('./dataManager');
const { generateId } = require('./helpers');

/**
 * 添加饮食记录
 */
function addMeal(mealData) {
  const data = readData();
  
  const newMeal = {
    id: generateId(),
    date: mealData.date || new Date().toISOString(),
    description: mealData.description || '',
    images: mealData.images || [],
    mealType: mealData.mealType || 'other', // breakfast, lunch, dinner, snack, other
    estimatedCalories: mealData.estimatedCalories !== undefined ? mealData.estimatedCalories : null,
    aiAnalysis: mealData.aiAnalysis || null,
    createdAt: new Date().toISOString()
  };
  
  if (!data.mealRecords) {
    data.mealRecords = [];
  }
  
  data.mealRecords.push(newMeal);
  writeData(data);
  
  return newMeal;
}

/**
 * 获取指定日期范围的饮食记录
 */
function getMealsByDateRange(startDate, endDate) {
  const data = readData();
  
  if (!data.mealRecords) {
    return [];
  }
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return data.mealRecords.filter(meal => {
    const mealDate = new Date(meal.date);
    return mealDate >= start && mealDate <= end;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * 获取指定日期的饮食记录
 */
function getMealsByDate(date) {
  const data = readData();
  
  if (!data.mealRecords) {
    return [];
  }
  
  // 将日期字符串转换为 YYYY-MM-DD 格式进行比较
  const targetDateStr = new Date(date).toISOString().split('T')[0];
  
  return data.mealRecords.filter(meal => {
    const mealDateStr = new Date(meal.date).toISOString().split('T')[0];
    return mealDateStr === targetDateStr;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * 更新饮食记录的AI分析结果
 */
function updateMealAnalysis(mealId, analysis) {
  const data = readData();
  
  if (!data.mealRecords) {
    return null;
  }
  
  const mealIndex = data.mealRecords.findIndex(m => m.id === mealId);
  
  if (mealIndex === -1) {
    return null;
  }
  
  data.mealRecords[mealIndex].estimatedCalories = analysis.calories;
  data.mealRecords[mealIndex].aiAnalysis = analysis.analysis;
  data.mealRecords[mealIndex].updatedAt = new Date().toISOString();
  
  writeData(data);
  
  return data.mealRecords[mealIndex];
}

/**
 * 更新饮食记录
 */
function updateMeal(mealId, updates) {
  const data = readData();
  
  if (!data.mealRecords) {
    return null;
  }
  
  const mealIndex = data.mealRecords.findIndex(m => m.id === mealId);
  
  if (mealIndex === -1) {
    return null;
  }
  
  // 更新允许的字段
  if (updates.description !== undefined) {
    data.mealRecords[mealIndex].description = updates.description;
  }
  if (updates.mealType !== undefined) {
    data.mealRecords[mealIndex].mealType = updates.mealType;
  }
  if (updates.images !== undefined) {
    data.mealRecords[mealIndex].images = updates.images;
  }
  if (updates.estimatedCalories !== undefined) {
    data.mealRecords[mealIndex].estimatedCalories = updates.estimatedCalories;
  }
  if (updates.aiAnalysis !== undefined) {
    data.mealRecords[mealIndex].aiAnalysis = updates.aiAnalysis;
  }
  
  data.mealRecords[mealIndex].updatedAt = new Date().toISOString();
  
  writeData(data);
  
  return data.mealRecords[mealIndex];
}

/**
 * 删除饮食记录
 */
function deleteMeal(mealId) {
  const data = readData();
  
  if (!data.mealRecords) {
    return false;
  }
  
  const initialLength = data.mealRecords.length;
  data.mealRecords = data.mealRecords.filter(m => m.id !== mealId);
  
  if (data.mealRecords.length < initialLength) {
    writeData(data);
    return true;
  }
  
  return false;
}

/**
 * 获取指定日期的总热量
 */
function getDailyCalories(date) {
  const meals = getMealsByDate(date);
  
  const totalCalories = meals.reduce((sum, meal) => {
    return sum + (meal.estimatedCalories || 0);
  }, 0);
  
  return {
    date,
    totalCalories,
    mealCount: meals.length,
    meals: meals.map(m => ({
      id: m.id,
      mealType: m.mealType,
      description: m.description,
      calories: m.estimatedCalories
    }))
  };
}

module.exports = {
  addMeal,
  getMealsByDateRange,
  getMealsByDate,
  updateMeal,
  updateMealAnalysis,
  deleteMeal,
  getDailyCalories
};

