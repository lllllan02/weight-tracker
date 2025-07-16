// 生成周报
function generateWeeklyReport(records, profile) {
  const now = new Date();
  const weekStart = new Date(now);
  weekStart.setDate(now.getDate() - now.getDay());
  weekStart.setHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const weekRecords = records.filter(r => {
    const recordDate = new Date(r.date);
    return recordDate >= weekStart && recordDate <= weekEnd;
  });

  if (weekRecords.length === 0) {
    return {
      period: `${weekStart.toLocaleDateString('zh-CN')} - ${weekEnd.toLocaleDateString('zh-CN')}`,
      type: 'weekly',
      records: [],
      stats: {
        startWeight: 0,
        endWeight: 0,
        change: 0,
        average: 0,
        min: 0,
        max: 0,
        recordCount: 0
      },
      insights: ['本周暂无记录']
    };
  }

  const sortedWeekRecords = weekRecords.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const startWeight = sortedWeekRecords[0].weight;
  const endWeight = sortedWeekRecords[sortedWeekRecords.length - 1].weight;
  const change = Number((endWeight - startWeight).toFixed(1));
  const weights = weekRecords.map(r => r.weight);
  const average = Number((weights.reduce((sum, w) => sum + w, 0) / weights.length).toFixed(1));
  const min = Math.min(...weights);
  const max = Math.max(...weights);

  const insights = [];
  if (change > 0) {
    insights.push(`本周体重增加了 ${change}kg`);
  } else if (change < 0) {
    insights.push(`本周体重减少了 ${Math.abs(change)}kg`);
  } else {
    insights.push('本周体重保持稳定');
  }

  if (weekRecords.length >= 5) {
    insights.push('记录频率良好，继续保持！');
  } else if (weekRecords.length >= 3) {
    insights.push('建议增加记录频率');
  } else {
    insights.push('本周记录较少，建议每天称重');
  }

  if (profile.targetWeight) {
    const remaining = Number((profile.targetWeight - endWeight).toFixed(1));
    if (Math.abs(remaining) <= 1) {
      insights.push('接近目标体重！');
    } else if (remaining > 0) {
      insights.push(`距离目标体重还需减重 ${remaining}kg`);
    } else {
      insights.push(`距离目标体重还有 ${Math.abs(remaining)}kg`);
    }
  }

  return {
    period: `${weekStart.toLocaleDateString('zh-CN')} - ${weekEnd.toLocaleDateString('zh-CN')}`,
    type: 'weekly',
    records: weekRecords,
    stats: {
      startWeight,
      endWeight,
      change,
      average,
      min,
      max,
      recordCount: weekRecords.length
    },
    insights
  };
}

// 生成月报
function generateMonthlyReport(records, profile) {
  const now = new Date();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

  const monthRecords = records.filter(r => {
    const recordDate = new Date(r.date);
    return recordDate >= monthStart && recordDate <= monthEnd;
  });

  if (monthRecords.length === 0) {
    return {
      period: `${monthStart.getFullYear()}年${monthStart.getMonth() + 1}月`,
      type: 'monthly',
      records: [],
      stats: {
        startWeight: 0,
        endWeight: 0,
        change: 0,
        average: 0,
        min: 0,
        max: 0,
        recordCount: 0,
        weeklyAverages: []
      },
      insights: ['本月暂无记录']
    };
  }

  const sortedMonthRecords = monthRecords.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const startWeight = sortedMonthRecords[0].weight;
  const endWeight = sortedMonthRecords[sortedMonthRecords.length - 1].weight;
  const change = Number((endWeight - startWeight).toFixed(1));
  const weights = monthRecords.map(r => r.weight);
  const average = Number((weights.reduce((sum, w) => sum + w, 0) / weights.length).toFixed(1));
  const min = Math.min(...weights);
  const max = Math.max(...weights);

  // 计算每周平均体重
  const weeklyAverages = [];
  for (let i = 0; i < 4; i++) {
    const weekStart = new Date(monthStart);
    weekStart.setDate(monthStart.getDate() + i * 7);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    
    const weekRecords = monthRecords.filter(r => {
      const recordDate = new Date(r.date);
      return recordDate >= weekStart && recordDate <= weekEnd;
    });
    
    if (weekRecords.length > 0) {
      const weekAverage = Number((weekRecords.reduce((sum, r) => sum + r.weight, 0) / weekRecords.length).toFixed(1));
      weeklyAverages.push(weekAverage);
    } else {
      weeklyAverages.push(0);
    }
  }

  const insights = [];
  if (change > 0) {
    insights.push(`本月体重增加了 ${change}kg`);
  } else if (change < 0) {
    insights.push(`本月体重减少了 ${Math.abs(change)}kg`);
  } else {
    insights.push('本月体重保持稳定');
  }

  if (monthRecords.length >= 20) {
    insights.push('本月记录非常频繁，数据质量很高！');
  } else if (monthRecords.length >= 15) {
    insights.push('本月记录频率良好');
  } else if (monthRecords.length >= 10) {
    insights.push('建议增加记录频率以获得更准确的数据');
  } else {
    insights.push('本月记录较少，建议每天称重');
  }

  if (profile.targetWeight) {
    const remaining = Number((profile.targetWeight - endWeight).toFixed(1));
    if (Math.abs(remaining) <= 2) {
      insights.push('非常接近目标体重！');
    } else if (remaining > 0) {
      insights.push(`距离目标体重还需减重 ${remaining}kg`);
    } else {
      insights.push(`距离目标体重还有 ${Math.abs(remaining)}kg`);
    }
  }

  // 分析体重变化趋势
  if (weeklyAverages.filter(w => w > 0).length >= 2) {
    const validAverages = weeklyAverages.filter(w => w > 0);
    const trend = validAverages[validAverages.length - 1] - validAverages[0];
    if (trend > 0.5) {
      insights.push('体重呈上升趋势，建议注意饮食控制');
    } else if (trend < -0.5) {
      insights.push('体重呈下降趋势，继续保持！');
    } else {
      insights.push('体重变化平稳');
    }
  }

  return {
    period: `${monthStart.getFullYear()}年${monthStart.getMonth() + 1}月`,
    type: 'monthly',
    records: monthRecords,
    stats: {
      startWeight,
      endWeight,
      change,
      average,
      min,
      max,
      recordCount: monthRecords.length,
      weeklyAverages
    },
    insights
  };
}

module.exports = {
  generateWeeklyReport,
  generateMonthlyReport
}; 