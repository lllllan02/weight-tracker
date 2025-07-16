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

module.exports = {
  calculateBMI,
  formatDate,
  calculateStats,
  calculateChartData,
  calculateCalendarData
}; 