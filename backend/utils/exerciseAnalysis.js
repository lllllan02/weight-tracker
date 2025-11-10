/**
 * 运动效果分析工具
 * 用于评估运动对体重管理的影响
 */

// 格式化日期为 YYYY-MM-DD
function formatDateOnly(dateStr) {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// 获取时段（早上、下午、晚上）
function getTimeSlot(dateStr) {
  const date = new Date(dateStr);
  const hour = date.getHours();
  
  if (hour >= 5 && hour < 12) {
    return 'morning'; // 早上 5:00-12:00
  } else if (hour >= 12 && hour < 18) {
    return 'afternoon'; // 下午 12:00-18:00
  } else {
    return 'evening'; // 晚上 18:00-次日5:00
  }
}

// 分析运动后24小时内的体重变化
function analyzeWeightChangeAfterExercise(exerciseRecords, weightRecords) {
  const analysis = [];
  
  exerciseRecords.forEach(exercise => {
    const exerciseDate = new Date(exercise.date);
    const exerciseTime = exerciseDate.getTime();
    
    // 查找运动前最近的体重记录（24小时内）
    const beforeWeights = weightRecords
      .filter(w => {
        const weightTime = new Date(w.date).getTime();
        return weightTime <= exerciseTime && weightTime >= exerciseTime - 24 * 60 * 60 * 1000;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    // 查找运动后的体重记录（24小时内）
    const afterWeights = weightRecords
      .filter(w => {
        const weightTime = new Date(w.date).getTime();
        return weightTime > exerciseTime && weightTime <= exerciseTime + 24 * 60 * 60 * 1000;
      })
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    if (beforeWeights.length > 0 && afterWeights.length > 0) {
      const beforeWeight = beforeWeights[0].weight;
      const afterWeight = afterWeights[afterWeights.length - 1].weight; // 使用24小时内最后一次测量
      const weightChange = Number((afterWeight - beforeWeight).toFixed(1));
      
      analysis.push({
        date: exercise.date,
        duration: exercise.duration,
        timeSlot: getTimeSlot(exercise.date),
        beforeWeight,
        afterWeight,
        weightChange,
        effectiveness: weightChange <= 0 ? 'positive' : 'negative' // 体重下降为正面效果
      });
    }
  });
  
  return analysis;
}

// 计算运动效率评分（0-100分）
function calculateExerciseEfficiencyScore(exerciseRecords, weightRecords) {
  if (exerciseRecords.length === 0 || weightRecords.length === 0) {
    return {
      score: 0,
      factors: {
        frequency: 0,
        consistency: 0,
        weightImpact: 0
      },
      level: 'none',
      description: '暂无足够数据'
    };
  }
  
  const analysis = analyzeWeightChangeAfterExercise(exerciseRecords, weightRecords);
  
  // 因素1: 运动频率 (0-40分)
  const sortedRecords = [...weightRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const firstDate = new Date(sortedRecords[0].date);
  const lastDate = new Date(sortedRecords[sortedRecords.length - 1].date);
  const totalDays = Math.max(1, Math.floor((lastDate - firstDate) / (1000 * 60 * 60 * 24)) + 1);
  const exerciseDaysPerWeek = (exerciseRecords.length / totalDays) * 7;
  const frequencyScore = Math.min(40, exerciseDaysPerWeek * 8); // 每周5天满分
  
  // 因素2: 运动一致性 (0-30分)
  // 计算运动间隔的标准差，间隔越均匀分数越高
  if (exerciseRecords.length < 2) {
    var consistencyScore = 0;
  } else {
    const sortedExercises = [...exerciseRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const intervals = [];
    for (let i = 1; i < sortedExercises.length; i++) {
      const daysDiff = Math.floor((new Date(sortedExercises[i].date) - new Date(sortedExercises[i-1].date)) / (1000 * 60 * 60 * 24));
      intervals.push(daysDiff);
    }
    const avgInterval = intervals.reduce((sum, v) => sum + v, 0) / intervals.length;
    const variance = intervals.reduce((sum, v) => sum + Math.pow(v - avgInterval, 2), 0) / intervals.length;
    const stdDev = Math.sqrt(variance);
    // 标准差越小，一致性越好（理想间隔1-2天）
    var consistencyScore = Math.max(0, Math.min(30, 30 - stdDev * 3));
  }
  
  // 因素3: 体重影响效果 (0-30分)
  let weightImpactScore = 0;
  if (analysis.length > 0) {
    const positiveEffects = analysis.filter(a => a.effectiveness === 'positive').length;
    const effectivenessRate = positiveEffects / analysis.length;
    weightImpactScore = effectivenessRate * 30;
  }
  
  const totalScore = Math.round(frequencyScore + consistencyScore + weightImpactScore);
  
  // 评级
  let level, description;
  if (totalScore >= 80) {
    level = 'excellent';
    description = '优秀！运动计划非常有效';
  } else if (totalScore >= 60) {
    level = 'good';
    description = '良好，继续保持';
  } else if (totalScore >= 40) {
    level = 'fair';
    description = '尚可，还有提升空间';
  } else if (totalScore >= 20) {
    level = 'poor';
    description = '需要改进运动计划';
  } else {
    level = 'none';
    description = '运动频率较低';
  }
  
  return {
    score: totalScore,
    factors: {
      frequency: Math.round(frequencyScore),
      consistency: Math.round(consistencyScore),
      weightImpact: Math.round(weightImpactScore)
    },
    level,
    description,
    exerciseDaysPerWeek: Number(exerciseDaysPerWeek.toFixed(1))
  };
}

// 检查运动记录是否包含有效的时间信息
function hasValidTimeData(exerciseRecords) {
  if (exerciseRecords.length === 0) return false;
  
  // 检查是否所有记录都是固定的几个时间点（说明没有记录实际运动时间）
  const timeSet = new Set();
  exerciseRecords.forEach(record => {
    const date = new Date(record.date);
    const timeKey = `${date.getHours()}:${date.getMinutes()}`;
    timeSet.add(timeKey);
  });
  
  // 如果只有1-2个不同的时间点，说明是系统默认时间，不是实际运动时间
  return timeSet.size > Math.min(3, exerciseRecords.length * 0.5);
}

// 分析最有效的运动时段
function analyzeBestTimeSlot(exerciseRecords, weightRecords) {
  // 检查是否有有效的时间数据
  if (!hasValidTimeData(exerciseRecords)) {
    return {
      bestTimeSlot: null,
      analysis: {
        morning: { count: 0, avgChange: 0, effectiveness: 0, score: 0 },
        afternoon: { count: 0, avgChange: 0, effectiveness: 0, score: 0 },
        evening: { count: 0, avgChange: 0, effectiveness: 0, score: 0 }
      },
      recommendation: '运动记录未包含具体时间信息，无法分析最佳运动时段。建议在记录运动时标注实际运动时间。',
      dataQuality: 'insufficient'
    };
  }
  
  const analysis = analyzeWeightChangeAfterExercise(exerciseRecords, weightRecords);
  
  if (analysis.length === 0) {
    return {
      bestTimeSlot: null,
      analysis: {
        morning: { count: 0, avgChange: 0, effectiveness: 0, score: 0 },
        afternoon: { count: 0, avgChange: 0, effectiveness: 0, score: 0 },
        evening: { count: 0, avgChange: 0, effectiveness: 0, score: 0 }
      },
      recommendation: '暂无足够数据进行分析',
      dataQuality: 'insufficient'
    };
  }
  
  const timeSlotStats = {
    morning: { exercises: [], totalChange: 0, positiveCount: 0 },
    afternoon: { exercises: [], totalChange: 0, positiveCount: 0 },
    evening: { exercises: [], totalChange: 0, positiveCount: 0 }
  };
  
  analysis.forEach(item => {
    const slot = item.timeSlot;
    timeSlotStats[slot].exercises.push(item);
    timeSlotStats[slot].totalChange += item.weightChange;
    if (item.effectiveness === 'positive') {
      timeSlotStats[slot].positiveCount++;
    }
  });
  
  // 计算每个时段的统计数据
  const slotAnalysis = {};
  let bestSlot = null;
  let bestScore = -Infinity;
  
  Object.keys(timeSlotStats).forEach(slot => {
    const stats = timeSlotStats[slot];
    const count = stats.exercises.length;
    
    if (count > 0) {
      const avgChange = Number((stats.totalChange / count).toFixed(2));
      const effectiveness = Number(((stats.positiveCount / count) * 100).toFixed(1));
      
      // 综合评分：体重下降幅度 + 有效率
      const score = -avgChange * 10 + effectiveness;
      
      slotAnalysis[slot] = {
        count,
        avgChange,
        effectiveness,
        score: Number(score.toFixed(1))
      };
      
      if (score > bestScore && count >= 2) { // 至少2次运动才有参考价值
        bestScore = score;
        bestSlot = slot;
      }
    } else {
      slotAnalysis[slot] = {
        count: 0,
        avgChange: 0,
        effectiveness: 0,
        score: 0
      };
    }
  });
  
  // 生成建议
  let recommendation;
  const timeSlotNames = {
    morning: '早上 (5:00-12:00)',
    afternoon: '下午 (12:00-18:00)',
    evening: '晚上 (18:00-次日5:00)'
  };
  
  if (bestSlot) {
    recommendation = `根据数据分析，${timeSlotNames[bestSlot]}运动效果最佳，平均体重变化${slotAnalysis[bestSlot].avgChange}kg，有效率${slotAnalysis[bestSlot].effectiveness}%`;
  } else {
    recommendation = '建议增加运动次数以获得更准确的时段分析';
  }
  
  return {
    bestTimeSlot: bestSlot,
    analysis: slotAnalysis,
    recommendation,
    timeSlotNames,
    dataQuality: 'good'
  };
}

// 分析运动频率与减重速度的关系
function analyzeExerciseFrequencyImpact(exerciseRecords, weightRecords) {
  if (weightRecords.length < 2) {
    return {
      periods: [],
      correlation: null,
      insight: '体重记录不足，无法分析'
    };
  }
  
  // 按自然周（周一到周日）划分数据
  const sortedWeights = [...weightRecords].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const firstDate = new Date(sortedWeights[0].date);
  const lastDate = new Date(sortedWeights[sortedWeights.length - 1].date);
  
  // 找到第一个周一作为起始日期
  const startDate = new Date(firstDate);
  const dayOfWeek = startDate.getDay(); // 0=周日, 1=周一, ..., 6=周六
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 如果是周日，回退6天；否则计算到周一的天数
  startDate.setDate(startDate.getDate() + daysToMonday);
  startDate.setHours(0, 0, 0, 0);
  
  // 找到最后一个周日作为结束日期
  const endDate = new Date(lastDate);
  const lastDayOfWeek = endDate.getDay();
  const daysToSunday = lastDayOfWeek === 0 ? 0 : 7 - lastDayOfWeek;
  endDate.setDate(endDate.getDate() + daysToSunday);
  endDate.setHours(23, 59, 59, 999);
  
  const totalDays = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  const totalWeeks = Math.ceil(totalDays / 7);
  
  if (totalWeeks < 2) {
    return {
      periods: [],
      correlation: null,
      insight: '数据时间跨度不足，建议至少记录2周'
    };
  }
  
  const weeklyData = [];
  
  for (let week = 0; week < totalWeeks; week++) {
    // 每周从周一开始，到周日结束
    const weekStartDate = new Date(startDate);
    weekStartDate.setDate(startDate.getDate() + week * 7);
    weekStartDate.setHours(0, 0, 0, 0);
    
    const weekEndDate = new Date(weekStartDate);
    weekEndDate.setDate(weekStartDate.getDate() + 6);
    weekEndDate.setHours(23, 59, 59, 999);
    
    // 该周的体重记录
    const weekWeights = sortedWeights.filter(w => {
      const date = new Date(w.date);
      return date >= weekStartDate && date <= weekEndDate;
    });
    
    // 该周的运动记录
    const weekExercises = exerciseRecords.filter(e => {
      const date = new Date(e.date);
      return date >= weekStartDate && date <= weekEndDate;
    });
    
    // 只要有体重记录或运动记录就记录该周数据
    if (weekWeights.length >= 1 || weekExercises.length > 0) {
      const exerciseCount = weekExercises.length;
      const totalDuration = weekExercises.reduce((sum, e) => sum + (e.duration || 0), 0);
      
      // 体重变化需要至少2条记录才能计算
      let weightChange = 0;
      let avgWeight = null;
      
      if (weekWeights.length >= 2) {
        const firstWeight = weekWeights[0].weight;
        const lastWeight = weekWeights[weekWeights.length - 1].weight;
        weightChange = Number((lastWeight - firstWeight).toFixed(1));
        avgWeight = Number((weekWeights.reduce((sum, w) => sum + w.weight, 0) / weekWeights.length).toFixed(1));
      } else if (weekWeights.length === 1) {
        // 只有一条体重记录时，用该记录作为平均值，变化为0
        avgWeight = weekWeights[0].weight;
        weightChange = 0;
      }
      
      // 生成周标签（如"10.28-11.03"）
      const startMonth = weekStartDate.getMonth() + 1;
      const startDay = weekStartDate.getDate();
      const endMonth = weekEndDate.getMonth() + 1;
      const endDay = weekEndDate.getDate();
      const weekLabel = `${startMonth}.${String(startDay).padStart(2, '0')}-${endMonth}.${String(endDay).padStart(2, '0')}`;
      
      weeklyData.push({
        week: week + 1,
        weekLabel,
        startDate: weekStartDate.toISOString().split('T')[0],
        endDate: weekEndDate.toISOString().split('T')[0],
        exerciseCount,
        totalDuration,
        weightChange,
        avgWeight
      });
    }
  }
  
  // 计算相关性（运动次数与体重变化的关系）
  let correlation = null;
  let insight = '';
  
  if (weeklyData.length >= 2) {
    const validData = weeklyData.filter(d => d.exerciseCount > 0);
    
    if (validData.length >= 2) {
      // 简单的相关性分析：运动越多，体重下降越明显
      const avgExerciseCount = validData.reduce((sum, d) => sum + d.exerciseCount, 0) / validData.length;
      const avgWeightChange = validData.reduce((sum, d) => sum + d.weightChange, 0) / validData.length;
      
      let sumXY = 0, sumX2 = 0, sumY2 = 0;
      validData.forEach(d => {
        const x = d.exerciseCount - avgExerciseCount;
        const y = d.weightChange - avgWeightChange;
        sumXY += x * y;
        sumX2 += x * x;
        sumY2 += y * y;
      });
      
      const correlationCoef = sumXY / Math.sqrt(sumX2 * sumY2);
      correlation = Number(correlationCoef.toFixed(3));
      
      if (isNaN(correlation)) {
        correlation = 0;
      }
      
      // 生成洞察
      if (correlation < -0.5) {
        insight = '运动频率与体重下降呈显著正相关，增加运动有助于减重';
      } else if (correlation < -0.2) {
        insight = '运动频率与体重下降有一定关联，保持运动习惯';
      } else if (correlation < 0.2) {
        insight = '运动频率与体重变化关联较弱，可能需要配合饮食调整';
      } else {
        insight = '数据显示运动与体重变化关系不明显，建议检查运动强度和饮食';
      }
    } else {
      insight = '运动周数较少，建议增加运动频率以获得更准确的分析';
    }
  }
  
  // 计算Y轴最大值（用于前端图表配置）
  const maxExerciseCount = weeklyData.length > 0 
    ? Math.max(...weeklyData.map(d => d.exerciseCount))
    : 0;

  return {
    periods: weeklyData,
    correlation,
    insight,
    summary: {
      totalWeeks: weeklyData.length,
      avgExercisePerWeek: weeklyData.length > 0 
        ? Number((weeklyData.reduce((sum, d) => sum + d.exerciseCount, 0) / weeklyData.length).toFixed(1))
        : 0,
      avgWeightChangePerWeek: weeklyData.length > 0
        ? Number((weeklyData.reduce((sum, d) => sum + d.weightChange, 0) / weeklyData.length).toFixed(2))
        : 0
    },
    chartConfig: {
      suggestedMaxY1: maxExerciseCount + 2  // Y1轴（运动次数）的建议最大值
    }
  };
}

// 综合运动效果分析
function generateComprehensiveExerciseAnalysis(exerciseRecords, weightRecords) {
  const weightChangeAnalysis = analyzeWeightChangeAfterExercise(exerciseRecords, weightRecords);
  const efficiencyScore = calculateExerciseEfficiencyScore(exerciseRecords, weightRecords);
  const bestTimeSlot = analyzeBestTimeSlot(exerciseRecords, weightRecords);
  const frequencyImpact = analyzeExerciseFrequencyImpact(exerciseRecords, weightRecords);
  
  return {
    weightChangeAfterExercise: {
      data: weightChangeAnalysis,
      summary: {
        total: weightChangeAnalysis.length,
        positive: weightChangeAnalysis.filter(a => a.effectiveness === 'positive').length,
        avgChange: weightChangeAnalysis.length > 0 
          ? Number((weightChangeAnalysis.reduce((sum, a) => sum + a.weightChange, 0) / weightChangeAnalysis.length).toFixed(2))
          : 0
      }
    },
    efficiencyScore,
    bestTimeSlot,
    frequencyImpact,
    generatedAt: new Date().toISOString()
  };
}

module.exports = {
  analyzeWeightChangeAfterExercise,
  calculateExerciseEfficiencyScore,
  analyzeBestTimeSlot,
  analyzeExerciseFrequencyImpact,
  generateComprehensiveExerciseAnalysis
};

