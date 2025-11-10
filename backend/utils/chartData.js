// 图表数据生成工具
// 将前端的计算逻辑移到后端，前端只负责展示

/**
 * 生成图表所需的所有数据
 * @param {Array} records - 记录数组（包含isPrevious标记）
 * @param {Object} reportInfo - 报告信息（type, period等）
 * @param {number} height - 用户身高（厘米）
 * @returns {Object} 图表数据
 */
function generateChartData(records, reportInfo, height = 170) {
  if (!records || records.length === 0) {
    return null;
  }

  const sortedRecords = [...records].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // 分离当前周期和前一周期的数据
  const currentPeriodRecords = sortedRecords.filter(r => !r.isPrevious);
  const previousRecord = sortedRecords.find(r => r.isPrevious);

  // 辅助函数：计算BMI
  const calculateBMI = (weightInJin) => {
    const weightInKg = weightInJin / 2;
    const bmi = weightInKg / Math.pow(height / 100, 2);
    return Number(bmi.toFixed(1));
  };

  // 1. 生成体重数据点（包含BMI）
  const weightData = currentPeriodRecords.map(record => ({
    x: new Date(record.date).getTime(),
    y: record.weight,
    bmi: calculateBMI(record.weight),
  }));

  // 2. 前一周期的点（虚点，包含BMI）
  const previousWeightData = previousRecord ? [{
    x: new Date(previousRecord.date).getTime(),
    y: previousRecord.weight,
    bmi: calculateBMI(previousRecord.weight),
  }] : [];

  // 3. 生成热量数据
  const calorieData = sortedRecords.map(record => {
    const netCalories = record.netCalories;
    const isComplete = record.isComplete;
    
    // 只有标记为完整记录且有净热量数据时才显示
    const displayValue = (isComplete && netCalories !== null && netCalories !== undefined) ? netCalories : null;
    
    return {
      x: new Date(record.date).getTime(),
      y: displayValue,
    };
  });

  // 4. 根据净热量设置颜色
  const calorieColors = calorieData.map(item => {
    if (item.y === null) return "rgba(140, 140, 140, 0.6)"; // 未完整记录 - 灰色
    if (item.y > 0) return "rgba(255, 214, 102, 0.6)"; // 黄色 - 热量盈余
    if (item.y < 0) return "rgba(115, 209, 61, 0.6)"; // 绿色 - 热量亏损
    return "rgba(140, 140, 140, 0.6)"; // 灰色 - 平衡
  });

  // 5. 计算7日移动平均线（包含前一周期的点，包含BMI）
  const allRecordsForAverage = previousRecord 
    ? [previousRecord, ...currentPeriodRecords]
    : currentPeriodRecords;
  
  const movingAverageData = allRecordsForAverage.map((record, index) => {
    const startIndex = Math.max(0, index - 6);
    const recentRecords = allRecordsForAverage.slice(startIndex, index + 1);
    const average = recentRecords.reduce((sum, r) => sum + r.weight, 0) / recentRecords.length;
    const averageWeight = Number(average.toFixed(1));
    return {
      x: new Date(record.date).getTime(),
      y: averageWeight,
      bmi: calculateBMI(averageWeight),
    };
  });

  // 6. 识别异常波动点（单日变化 > 4斤，包含BMI）
  const anomalyPoints = [];
  for (let i = 1; i < currentPeriodRecords.length; i++) {
    const change = Math.abs(currentPeriodRecords[i].weight - currentPeriodRecords[i - 1].weight);
    if (change > 4) {
      anomalyPoints.push({
        x: new Date(currentPeriodRecords[i].date).getTime(),
        y: currentPeriodRecords[i].weight,
        bmi: calculateBMI(currentPeriodRecords[i].weight),
        change: Number(change.toFixed(1)),
      });
    }
  }

  // 7. 计算时间范围
  let chartMinTime, chartMaxTime;

  if (reportInfo.type === 'weekly') {
    // 周报：显示完整的周一到周日
    const periodParts = reportInfo.period.split(' - ');
    if (periodParts.length === 2) {
      const startDate = new Date(periodParts[0].replace(/\//g, '-'));
      const endDate = new Date(periodParts[1].replace(/\//g, '-'));
      if (!isNaN(startDate.getTime()) && !isNaN(endDate.getTime())) {
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        // 如果有前一周期的点，扩展时间范围
        chartMinTime = previousWeightData.length > 0 ? previousWeightData[0].x : startDate.getTime();
        chartMaxTime = endDate.getTime();
      } else {
        chartMinTime = previousWeightData.length > 0 ? previousWeightData[0].x : weightData[0].x;
        chartMaxTime = weightData[weightData.length - 1].x;
      }
    } else {
      chartMinTime = previousWeightData.length > 0 ? previousWeightData[0].x : weightData[0].x;
      chartMaxTime = weightData[weightData.length - 1].x;
    }
  } else if (reportInfo.type === 'monthly') {
    // 月报：显示完整的月份
    const match = reportInfo.period.match(/(\d{4})年(\d{1,2})月/);
    if (match) {
      const year = parseInt(match[1]);
      const month = parseInt(match[2]) - 1;
      const startDate = new Date(year, month, 1, 0, 0, 0, 0);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59, 999);
      chartMinTime = previousWeightData.length > 0 ? previousWeightData[0].x : startDate.getTime();
      chartMaxTime = endDate.getTime();
    } else {
      chartMinTime = previousWeightData.length > 0 ? previousWeightData[0].x : weightData[0].x;
      chartMaxTime = weightData[weightData.length - 1].x;
    }
  } else {
    // 全时段报告
    chartMinTime = weightData[0].x;
    chartMaxTime = weightData[weightData.length - 1].x;
  }

  // 8. 计算自然周边界（周一00:00）
  const weekBoundaries = [];
  const startDate = new Date(chartMinTime);
  const endDate = new Date(chartMaxTime);
  
  // 找到第一个周一
  let currentDate = new Date(startDate);
  const dayOfWeek = currentDate.getDay();
  const daysToMonday = dayOfWeek === 0 ? 1 : dayOfWeek === 1 ? 0 : (8 - dayOfWeek);
  currentDate.setDate(currentDate.getDate() + daysToMonday);
  currentDate.setHours(0, 0, 0, 0);
  
  // 收集所有周一的时间戳
  while (currentDate <= endDate) {
    weekBoundaries.push(currentDate.getTime());
    currentDate.setDate(currentDate.getDate() + 7);
  }

  return {
    weightData,
    previousWeightData,
    calorieData,
    calorieColors,
    movingAverageData,
    anomalyPoints,
    timeRange: {
      min: chartMinTime,
      max: chartMaxTime,
    },
    weekBoundaries,
    anomalyCount: anomalyPoints.length,
  };
}

module.exports = {
  generateChartData,
};

