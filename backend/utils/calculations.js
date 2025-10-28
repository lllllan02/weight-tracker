// 计算BMI
function calculateBMI(weight, height) {
  const heightInMeters = height / 100;
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
}

// 计算基础代谢率 (BMR)
// 使用 Mifflin-St Jeor 公式
// 男性：BMR = 10 × 体重(kg) + 6.25 × 身高(cm) - 5 × 年龄(岁) + 5
// 女性：BMR = 10 × 体重(kg) + 6.25 × 身高(cm) - 5 × 年龄(岁) - 161
function calculateBMR(weight, height, birthYear, gender) {
  if (!birthYear || birthYear <= 0) {
    return null; // 如果没有出生年份信息，返回 null
  }
  
  // 根据出生年份计算当前年龄
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;
  
  if (age <= 0 || age > 150) {
    return null; // 年龄不合理
  }
  
  const baseBMR = 10 * weight + 6.25 * height - 5 * age;
  
  if (gender === 'male') {
    return Math.round(baseBMR + 5);
  } else if (gender === 'female') {
    return Math.round(baseBMR - 161);
  }
  
  return null; // 如果没有性别信息，返回 null
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

  // 计算目标进度 - 使用阶段目标中最小的作为最终目标
  let targetProgress = 0;
  let targetRemaining = 0;
  
  // 优先使用阶段目标，如果没有则使用旧的 targetWeight
  let targetWeight = safeProfile.targetWeight;
  if (safeProfile.milestones && safeProfile.milestones.length > 0) {
    // 找到最小的目标体重（最终目标）
    targetWeight = Math.min(...safeProfile.milestones.map(m => m.targetWeight));
  }
  
  if (targetWeight && targetWeight > 0) {
    // 计算目标进度
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

  // 计算当前体重和目标体重的基础代谢率
  let currentBMR = null;
  let targetBMR = null;
  
  if (safeProfile.birthYear && safeProfile.gender) {
    currentBMR = calculateBMR(current, safeProfile.height, safeProfile.birthYear, safeProfile.gender);
    
    if (targetWeight && targetWeight > 0) {
      targetBMR = calculateBMR(targetWeight, safeProfile.height, safeProfile.birthYear, safeProfile.gender);
    }
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
    initialWeight: records.length > 0 ? sortedRecords[0].weight : 0,
    currentBMR,
    targetBMR
  };
}

// 计算图表数据
function calculateChartData(records, profile) {
  if (records.length === 0) {
    return { labels: [], datasets: [] };
  }

  const sortedRecords = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // 计算体重变化
  const weightChanges = sortedRecords.map((record, index) => {
    if (index === 0) return 0;
    return Number((record.weight - sortedRecords[index - 1].weight).toFixed(2));
  });
  
  return {
    labels: sortedRecords.map(r => formatDate(r.date)),
    datasets: [
      {
        type: 'line',
        label: '体重 (kg)',
        data: sortedRecords.map(r => r.weight),
        borderColor: '#3b82f6',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        borderWidth: 2,
        pointRadius: 2,
        pointHoverRadius: 4,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#3b82f6',
        pointBorderWidth: 1.5,
        tension: 0.4,
        fill: {
          target: 'origin',
          above: 'rgba(14, 165, 233, 0.1)',
          below: 'rgba(14, 165, 233, 0.1)'
        },
        yAxisID: 'y'
      },
      {
        type: 'bar',
        label: '体重变化',
        data: weightChanges,
        backgroundColor: weightChanges.map(change => 
          change > 0 ? 'rgba(239, 68, 68, 0.7)' : // 红色表示增加
          change < 0 ? 'rgba(34, 197, 94, 0.7)' : // 绿色表示减少
          'rgba(156, 163, 175, 0.7)' // 灰色表示无变化
        ),
        borderColor: weightChanges.map(change => 
          change > 0 ? 'rgb(239, 68, 68)' : // 红色表示增加
          change < 0 ? 'rgb(34, 197, 94)' : // 绿色表示减少
          'rgb(156, 163, 175)' // 灰色表示无变化
        ),
        borderWidth: 1,
        yAxisID: 'y2'
      }
    ]
  };
}

// 计算日历数据
function calculateCalendarData(records, exerciseRecords = []) {
  const timeSlots = [
    { key: 'morning', label: '早上', hour: 8, minute: 0, color: '#52c41a' },
    { key: 'night', label: '睡前', hour: 23, minute: 0, color: '#722ed1' }
  ];

  const dayRecords = {};
  const exerciseRecordsMap = {};
  
  // 处理体重记录
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

  // 处理运动记录（只有有时长的才算运动）
  exerciseRecords.forEach(record => {
    if (record.duration && record.duration > 0) {
      const dateKey = new Date(record.date).toISOString().split('T')[0];
      exerciseRecordsMap[dateKey] = {
        exercise: true,
        duration: record.duration
      };
    }
  });

  return {
    timeSlots,
    dayRecords,
    exerciseRecords: exerciseRecordsMap
  };
}

module.exports = {
  calculateBMI,
  calculateBMR,
  formatDate,
  calculateStats,
  calculateChartData,
  calculateCalendarData
}; 