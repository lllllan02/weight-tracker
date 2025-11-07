const dayjs = require('dayjs');
const { 
  readData, 
  writeData,
  getAllMealRecords,
  ensureDailyRecord,
  formatDateKey
} = require('./dataManager');
const { generateId } = require('./helpers');

/**
 * 添加饮食记录
 */
function addMeal(mealData) {
  const data = readData();
  
  const dateKey = formatDateKey(mealData.date || new Date().toISOString());
  
  // 确保日期记录存在
  ensureDailyRecord(data.dailyRecords, dateKey);
  
  const newMeal = {
    id: generateId(),
    mealType: mealData.mealType || 'other', // breakfast, lunch, dinner, other
    description: mealData.description || '',
    images: mealData.images || [],
    estimatedCalories: mealData.estimatedCalories !== undefined ? mealData.estimatedCalories : null,
    isAiPredicted: mealData.isAiPredicted || false,
    aiAnalysisText: mealData.aiAnalysisText || null,
    timestamp: mealData.date || new Date().toISOString(),
    createdAt: new Date().toISOString(),
    updatedAt: null
  };
  
  data.dailyRecords[dateKey].meals.push(newMeal);
  
  // 按餐次类型排序
  const mealOrder = { breakfast: 1, lunch: 2, dinner: 3, other: 4 };
  data.dailyRecords[dateKey].meals.sort((a, b) => 
    (mealOrder[a.mealType] || 5) - (mealOrder[b.mealType] || 5)
  );
  
  writeData(data);
  
  return { ...newMeal, date: newMeal.timestamp };
}

/**
 * 获取指定日期范围的饮食记录
 */
function getMealsByDateRange(startDate, endDate) {
  const data = readData();
  const meals = getAllMealRecords(data);
  
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  return meals.filter(meal => {
    const mealDate = new Date(meal.date);
    return mealDate >= start && mealDate <= end;
  }).sort((a, b) => new Date(b.date) - new Date(a.date));
}

/**
 * 获取指定日期的饮食记录
 */
function getMealsByDate(date) {
  const data = readData();
  const dateKey = formatDateKey(date);
  
  if (!data.dailyRecords[dateKey] || !data.dailyRecords[dateKey].meals) {
    return [];
  }
  
  return data.dailyRecords[dateKey].meals.map(meal => ({
    ...meal,
    date: meal.timestamp
  }));
}

/**
 * 更新饮食记录的AI分析结果
 */
function updateMealAnalysis(mealId, analysis) {
  const data = readData();
  
  // 在所有日期中查找该记录
  for (const dateKey in data.dailyRecords) {
    const dayRecord = data.dailyRecords[dateKey];
    const mealIndex = dayRecord.meals.findIndex(m => m.id === mealId);
    
    if (mealIndex !== -1) {
      dayRecord.meals[mealIndex].estimatedCalories = analysis.calories;
      dayRecord.meals[mealIndex].isAiPredicted = true;
      dayRecord.meals[mealIndex].aiAnalysisText = analysis.analysis;
      dayRecord.meals[mealIndex].updatedAt = new Date().toISOString();
      
      writeData(data);
      
      return { ...dayRecord.meals[mealIndex], date: dayRecord.meals[mealIndex].timestamp };
    }
  }
  
  return null;
}

/**
 * 更新饮食记录
 */
function updateMeal(mealId, updates) {
  const data = readData();
  
  // 在所有日期中查找该记录
  let existingMeal = null;
  let existingDateKey = null;
  
  for (const dateKey in data.dailyRecords) {
    const dayRecord = data.dailyRecords[dateKey];
    const mealIndex = dayRecord.meals.findIndex(m => m.id === mealId);
    
    if (mealIndex !== -1) {
      existingMeal = dayRecord.meals[mealIndex];
      existingDateKey = dateKey;
      
      // 更新记录
      const updatedMeal = {
        ...existingMeal,
        mealType: updates.mealType !== undefined ? updates.mealType : existingMeal.mealType,
        description: updates.description !== undefined ? updates.description : existingMeal.description,
        images: updates.images !== undefined ? updates.images : existingMeal.images,
        estimatedCalories: updates.estimatedCalories !== undefined ? updates.estimatedCalories : existingMeal.estimatedCalories,
        isAiPredicted: updates.isAiPredicted !== undefined ? updates.isAiPredicted : existingMeal.isAiPredicted,
        aiAnalysisText: updates.aiAnalysisText !== undefined ? updates.aiAnalysisText : existingMeal.aiAnalysisText,
        timestamp: updates.date || existingMeal.timestamp,
        updatedAt: new Date().toISOString()
      };
      
      // 如果日期改变了，需要移动到新日期
      const newDateKey = formatDateKey(updatedMeal.timestamp);
      if (newDateKey !== existingDateKey) {
        // 从旧日期删除
        dayRecord.meals.splice(mealIndex, 1);
        
        // 如果旧日期没有记录了，删除整个日期记录
        if (dayRecord.weights.length === 0 && dayRecord.exercises.length === 0 && dayRecord.meals.length === 0) {
          delete data.dailyRecords[existingDateKey];
        }
        
        // 添加到新日期
        ensureDailyRecord(data.dailyRecords, newDateKey);
        data.dailyRecords[newDateKey].meals.push(updatedMeal);
        
        // 按餐次类型排序
        const mealOrder = { breakfast: 1, lunch: 2, dinner: 3, other: 4 };
        data.dailyRecords[newDateKey].meals.sort((a, b) => 
          (mealOrder[a.mealType] || 5) - (mealOrder[b.mealType] || 5)
        );
      } else {
        // 更新现有记录
        dayRecord.meals[mealIndex] = updatedMeal;
        
        // 重新排序
        const mealOrder = { breakfast: 1, lunch: 2, dinner: 3, other: 4 };
        dayRecord.meals.sort((a, b) => 
          (mealOrder[a.mealType] || 5) - (mealOrder[b.mealType] || 5)
        );
      }
      
      writeData(data);
      
      return { ...updatedMeal, date: updatedMeal.timestamp };
    }
  }
  
  return null;
}

/**
 * 删除饮食记录
 */
function deleteMeal(mealId) {
  const data = readData();
  
  // 在所有日期中查找并删除该记录
  for (const dateKey in data.dailyRecords) {
    const dayRecord = data.dailyRecords[dateKey];
    const originalLength = dayRecord.meals.length;
    dayRecord.meals = dayRecord.meals.filter(m => m.id !== mealId);
    
    if (dayRecord.meals.length < originalLength) {
      // 如果该天没有任何记录了，删除整个日期记录
      if (dayRecord.weights.length === 0 && dayRecord.exercises.length === 0 && dayRecord.meals.length === 0) {
        delete data.dailyRecords[dateKey];
      }
      
      writeData(data);
      return true;
    }
  }
  
  return false;
}

/**
 * 获取指定日期的总热量
 */
function getDailyCalories(date) {
  const dateKey = formatDateKey(date);
  const data = readData();
  
  if (!data.dailyRecords[dateKey] || !data.dailyRecords[dateKey].meals) {
    return {
      date: dateKey,
      totalCalories: 0,
      meals: [],
      mealCount: 0
    };
  }
  
  const meals = data.dailyRecords[dateKey].meals.map(meal => ({
    ...meal,
    date: meal.timestamp
  }));
  
  const totalCalories = meals.reduce((sum, meal) => {
    return sum + (meal.estimatedCalories || 0);
  }, 0);
  
  return {
    date: dateKey,
    totalCalories,
    meals,
    mealCount: meals.length
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
