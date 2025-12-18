const { getAllWeightRecords } = require('./dataManager');
const { calculateBMR } = require('./calculations');

/**
 * 计算皮尔逊相关系数
 * @param {number[]} x - 第一个变量数组
 * @param {number[]} y - 第二个变量数组
 * @returns {number|null} 相关系数，如果无法计算则返回null
 */
function calculatePearsonCorrelation(x, y) {
  if (x.length !== y.length || x.length < 2) {
    return null;
  }

  const n = x.length;
  
  // 计算均值
  const meanX = x.reduce((sum, val) => sum + val, 0) / n;
  const meanY = y.reduce((sum, val) => sum + val, 0) / n;

  // 计算协方差和方差
  let covariance = 0;
  let varianceX = 0;
  let varianceY = 0;

  for (let i = 0; i < n; i++) {
    const diffX = x[i] - meanX;
    const diffY = y[i] - meanY;
    covariance += diffX * diffY;
    varianceX += diffX * diffX;
    varianceY += diffY * diffY;
  }

  // 计算相关系数
  const denominator = Math.sqrt(varianceX * varianceY);
  if (denominator === 0) {
    return null;
  }

  return covariance / denominator;
}

/**
 * 获取指定日期范围内的每日热量数据
 * @param {Object} data - 数据对象
 * @param {Date} startDate - 开始日期
 * @param {Date} endDate - 结束日期
 * @returns {Array} 每日热量数据数组
 */
function getDailyCalorieData(data, startDate, endDate) {
  const dailyData = [];
  const dailyRecords = data.dailyRecords || {};

  // 遍历日期范围内的每一天
  const currentDate = new Date(startDate);
  while (currentDate <= endDate) {
    const dateStr = currentDate.toISOString().split('T')[0];
    const dayData = dailyRecords[dateStr];

    if (dayData) {
      // 获取当天的体重记录（使用平均体重）
      const weights = dayData.weights || [];
      const avgWeight = weights.length > 0
        ? weights.reduce((sum, w) => sum + w.weight, 0) / weights.length
        : null;

      // 获取当天的饮食记录
      const meals = dayData.meals || [];
      const caloriesIn = meals.reduce((sum, meal) => sum + (meal.estimatedCalories || 0), 0);

      // 获取当天的运动记录
      const exercises = dayData.exercises || [];
      // 支持两种字段名：estimatedCalories 和 caloriesBurned（兼容旧数据）
      const caloriesOut = exercises.reduce((sum, ex) => sum + (ex.estimatedCalories || ex.caloriesBurned || 0), 0);

      // 计算基础代谢（使用当天的平均体重）
      let bmr = null;
      if (avgWeight && data.profile && data.profile.height && data.profile.birthYear && data.profile.gender) {
        bmr = calculateBMR(avgWeight, data.profile.height, data.profile.birthYear, data.profile.gender);
      }

      // 计算每日净热量：摄入 - (基础代谢 + 运动消耗)
      // 净热量为负值表示热量缺口（deficit），正值表示热量盈余（surplus）
      const netCalories = bmr !== null ? caloriesIn - (bmr + caloriesOut) : null;

      dailyData.push({
        date: dateStr,
        weight: avgWeight,
        caloriesIn,
        caloriesOut,
        bmr,
        netCalories,
        isComplete: dayData.isComplete || false
      });
    }

    // 移动到下一天
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dailyData;
}

/**
 * 计算每周的热量缺口和体重变化
 * @param {Object} data - 数据对象
 * @returns {Array} 每周数据数组
 */
function calculateWeeklyDeficitAndWeightChange(data) {
  const records = getAllWeightRecords(data);
  if (records.length < 2) {
    return [];
  }

  const sortedRecords = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const firstDate = new Date(sortedRecords[0].date);
  const lastDate = new Date(sortedRecords[sortedRecords.length - 1].date);

  // 找到第一周的周一
  const firstMonday = new Date(firstDate);
  const dayOfWeek = firstMonday.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  firstMonday.setDate(firstMonday.getDate() - daysToMonday);
  firstMonday.setHours(0, 0, 0, 0);

  const weeklyData = [];
  let currentWeekStart = new Date(firstMonday);

  while (currentWeekStart <= lastDate) {
    const weekEnd = new Date(currentWeekStart);
    weekEnd.setDate(currentWeekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    // 获取本周的每日热量数据
    const weekDailyData = getDailyCalorieData(data, currentWeekStart, weekEnd);

    // 计算本周的体重变化
    const weekRecords = sortedRecords.filter(r => {
      const recordDate = new Date(r.date);
      return recordDate >= currentWeekStart && recordDate <= weekEnd;
    });

    // 获取上周最后一条记录作为起始体重
    const previousRecord = sortedRecords
      .filter(r => new Date(r.date) < currentWeekStart)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    let startWeight = null;
    let endWeight = null;
    let weightChange = null;

    if (weekRecords.length > 0) {
      if (previousRecord) {
        startWeight = previousRecord.weight;
      } else {
        startWeight = weekRecords[0].weight;
      }
      endWeight = weekRecords[weekRecords.length - 1].weight;
      weightChange = Number((endWeight - startWeight).toFixed(2));
    }

    // 计算本周的总热量缺口（累计净热量，负值表示缺口）
    // 只使用标记为完整的日期
    const completeCalorieDays = weekDailyData.filter(d => d.isComplete && d.netCalories !== null);
    const totalNetCalories = completeCalorieDays.length > 0
      ? completeCalorieDays.reduce((sum, d) => sum + d.netCalories, 0)
      : null;

    // 计算平均每日热量缺口（只基于完整记录）
    const validDays = completeCalorieDays.length;
    const avgDailyDeficit = validDays > 0 && totalNetCalories !== null ? Number((totalNetCalories / validDays).toFixed(0)) : null;

    // 计算完整记录的天数
    const completeDays = weekDailyData.filter(d => d.isComplete).length;

    // 生成周标签
    const startMonth = currentWeekStart.getMonth() + 1;
    const startDay = currentWeekStart.getDate();
    const endMonth = weekEnd.getMonth() + 1;
    const endDay = weekEnd.getDate();
    const weekLabel = `${startMonth}.${String(startDay).padStart(2, '0')}-${endMonth}.${String(endDay).padStart(2, '0')}`;

    weeklyData.push({
      weekLabel,
      startDate: currentWeekStart.toISOString().split('T')[0],
      endDate: weekEnd.toISOString().split('T')[0],
      startWeight,
      endWeight,
      weightChange,
      totalNetCalories: totalNetCalories !== null ? Number(totalNetCalories.toFixed(0)) : null,
      avgDailyDeficit,
      validDays,
      completeDays,
      totalDays: 7
    });

    // 移动到下一周
    currentWeekStart.setDate(currentWeekStart.getDate() + 7);
  }

  // 反转数组，让最新的周显示在前面
  return weeklyData.reverse();
}

/**
 * 计算每月的热量缺口和体重变化
 * @param {Object} data - 数据对象
 * @returns {Array} 每月数据数组
 */
function calculateMonthlyDeficitAndWeightChange(data) {
  const records = getAllWeightRecords(data);
  if (records.length < 2) {
    return [];
  }

  const sortedRecords = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const firstDate = new Date(sortedRecords[0].date);
  const lastDate = new Date(sortedRecords[sortedRecords.length - 1].date);

  const monthlyData = [];
  let currentMonth = new Date(firstDate.getFullYear(), firstDate.getMonth(), 1);

  while (currentMonth <= lastDate) {
    const monthStart = new Date(currentMonth);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0, 23, 59, 59, 999);

    // 获取本月的每日热量数据
    const monthDailyData = getDailyCalorieData(data, monthStart, monthEnd);

    // 计算本月的体重变化
    const monthRecords = sortedRecords.filter(r => {
      const recordDate = new Date(r.date);
      return recordDate >= monthStart && recordDate <= monthEnd;
    });

    // 获取上月最后一条记录作为起始体重
    const previousRecord = sortedRecords
      .filter(r => new Date(r.date) < monthStart)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

    let startWeight = null;
    let endWeight = null;
    let weightChange = null;

    if (monthRecords.length > 0) {
      if (previousRecord) {
        startWeight = previousRecord.weight;
      } else {
        startWeight = monthRecords[0].weight;
      }
      endWeight = monthRecords[monthRecords.length - 1].weight;
      weightChange = Number((endWeight - startWeight).toFixed(2));
    }

    // 计算本月的总热量缺口（累计净热量，负值表示缺口）
    // 只使用标记为完整的日期
    const completeCalorieDays = monthDailyData.filter(d => d.isComplete && d.netCalories !== null);
    const totalNetCalories = completeCalorieDays.length > 0
      ? completeCalorieDays.reduce((sum, d) => sum + d.netCalories, 0)
      : null;

    // 计算平均每日热量缺口（只基于完整记录）
    const validDays = completeCalorieDays.length;
    const avgDailyDeficit = validDays > 0 && totalNetCalories !== null ? Number((totalNetCalories / validDays).toFixed(0)) : null;

    // 计算完整记录的天数
    const completeDays = monthDailyData.filter(d => d.isComplete).length;

    // 生成月标签
    const monthLabel = `${currentMonth.getFullYear()}年${currentMonth.getMonth() + 1}月`;

    monthlyData.push({
      monthLabel,
      year: currentMonth.getFullYear(),
      month: currentMonth.getMonth() + 1,
      startDate: monthStart.toISOString().split('T')[0],
      endDate: monthEnd.toISOString().split('T')[0],
      startWeight,
      endWeight,
      weightChange,
      totalNetCalories: totalNetCalories !== null ? Number(totalNetCalories.toFixed(0)) : null,
      avgDailyDeficit,
      validDays,
      completeDays,
      totalDays: new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate()
    });

    // 移动到下一月
    currentMonth.setMonth(currentMonth.getMonth() + 1);
  }

  // 反转数组，让最新的月显示在前面
  return monthlyData.reverse();
}

/**
 * 分析热量缺口和体重变化的相关性
 * @param {Array} periodData - 周期数据数组（周或月）
 * @returns {Object} 分析结果
 */
function analyzeCorrelation(periodData) {
  // 过滤出有效数据（需要同时有热量缺口和体重变化的数据）
  const validData = periodData.filter(d => 
    d.totalNetCalories !== null && 
    d.weightChange !== null &&
    d.validDays > 0
  );

  if (validData.length < 2) {
    return {
      correlation: null,
      correlationStrength: null,
      interpretation: '数据不足，无法计算相关性（至少需要2个有效周期）',
      dataPoints: validData.length,
      analysis: []
    };
  }

  // 提取热量缺口和体重变化数组
  // 注意：热量缺口为负值表示缺口，正值表示盈余
  // 体重变化：负值表示下降，正值表示上升
  // 理论上，热量缺口越大（负值越大），体重应该下降越多（负值越大），所以应该是正相关
  const deficits = validData.map(d => d.totalNetCalories);
  const weightChanges = validData.map(d => d.weightChange);

  // 计算相关系数
  const correlation = calculatePearsonCorrelation(deficits, weightChanges);

  if (correlation === null) {
    return {
      correlation: null,
      correlationStrength: null,
      interpretation: '无法计算相关性',
      dataPoints: validData.length,
      analysis: []
    };
  }

  // 判断相关性强度
  let correlationStrength = '无相关';
  let interpretation = '';

  const absCorrelation = Math.abs(correlation);
  if (absCorrelation >= 0.7) {
    correlationStrength = '强相关';
  } else if (absCorrelation >= 0.4) {
    correlationStrength = '中等相关';
  } else if (absCorrelation >= 0.2) {
    correlationStrength = '弱相关';
  }

  // 解释相关性
  if (correlation > 0) {
    interpretation = `热量缺口与体重变化呈正相关（r=${correlation.toFixed(3)}）。这意味着热量缺口越大（负值越大），体重下降越多（负值越大），符合预期。`;
    if (absCorrelation < 0.4) {
      interpretation += ' 但相关性较弱，可能原因：1) 热量记录不准确；2) 体重测量存在波动；3) 其他因素（如水分、肌肉量变化）影响体重。';
    }
  } else if (correlation < 0) {
    interpretation = `热量缺口与体重变化呈负相关（r=${correlation.toFixed(3)}）。这不符合预期，可能原因：1) 热量记录不准确；2) 存在代谢适应；3) 数据记录不完整。`;
  } else {
    interpretation = '热量缺口与体重变化无线性关系。';
  }

  // 计算理论体重变化与实际体重变化的对比
  // 1kg脂肪约等于7700kcal，体重单位为斤，需转换为公斤
  const analysis = validData.map(d => {
    // 理论体重变化（公斤）= 总热量缺口（kcal） / 7700
    // 转换为斤
    const theoreticalWeightChange = d.totalNetCalories !== null
      ? Number(((d.totalNetCalories / 7700) * 2).toFixed(2))
      : null;

    // 实际体重变化
    const actualWeightChange = d.weightChange;

    // 计算准确度（理论值接近实际值表示准确度高）
    let accuracy = null;
    if (theoreticalWeightChange !== null && actualWeightChange !== null) {
      // 如果理论值和实际值符号相同，计算差异百分比
      if ((theoreticalWeightChange < 0 && actualWeightChange < 0) || 
          (theoreticalWeightChange > 0 && actualWeightChange > 0)) {
        const diff = Math.abs(theoreticalWeightChange - actualWeightChange);
        const avg = (Math.abs(theoreticalWeightChange) + Math.abs(actualWeightChange)) / 2;
        if (avg > 0) {
          accuracy = Number((100 - (diff / avg) * 100).toFixed(1));
        }
      }
    }

    return {
      ...d,
      theoreticalWeightChange,
      actualWeightChange,
      accuracy
    };
  });

  return {
    correlation: Number(correlation.toFixed(3)),
    correlationStrength,
    interpretation,
    dataPoints: validData.length,
    analysis
  };
}

module.exports = {
  calculateWeeklyDeficitAndWeightChange,
  calculateMonthlyDeficitAndWeightChange,
  analyzeCorrelation
};
