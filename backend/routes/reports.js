const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../utils/dataManager');
const { generateWeeklyReport, generateMonthlyReport } = require('../utils/reports');
const { generateAIWeeklyReport, generateAIMonthlyReport, generateAIAllTimeReport } = require('../utils/aiReports');

// 生成报告的唯一键（基于时间段）
function getReportKey(period, type) {
  if (type === 'weekly') {
    // 周报：使用年份-周数格式，如 "2025-W42"
    const date = new Date(period.split(' - ')[0]);
    const year = date.getFullYear();
    const weekNumber = getWeekNumber(date);
    return `${year}-W${String(weekNumber).padStart(2, '0')}`;
  } else {
    // 月报：使用年份-月份格式，如 "2025-10"
    const match = period.match(/(\d{4})年(\d{1,2})月/);
    if (match) {
      return `${match[1]}-${String(match[2]).padStart(2, '0')}`;
    }
  }
  return null;
}

// 计算周数
function getWeekNumber(date) {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
}

// 获取所有有数据的周列表
router.get('/available-weeks', (req, res) => {
  try {
    const data = readData();
    const weeks = new Set();
    
    data.records.forEach(record => {
      const date = new Date(record.date);
      const weekStart = new Date(date);
      // 计算到周一的天数（周一为一周的开始）
      const dayOfWeek = date.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      weekStart.setDate(date.getDate() - daysToMonday);
      weekStart.setHours(0, 0, 0, 0);
      // 使用本地日期格式，避免时区问题
      const year = weekStart.getFullYear();
      const month = String(weekStart.getMonth() + 1).padStart(2, '0');
      const day = String(weekStart.getDate()).padStart(2, '0');
      const weekKey = `${year}-${month}-${day}`;
      weeks.add(weekKey);
    });
    
    res.json(Array.from(weeks).sort());
  } catch (error) {
    console.error('获取可用周列表失败:', error);
    res.status(500).json({ error: '获取可用周列表失败' });
  }
});

// 获取所有有数据的月列表
router.get('/available-months', (req, res) => {
  try {
    const data = readData();
    const months = new Set();
    
    data.records.forEach(record => {
      const date = new Date(record.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    });
    
    res.json(Array.from(months).sort());
  } catch (error) {
    console.error('获取可用月列表失败:', error);
    res.status(500).json({ error: '获取可用月列表失败' });
  }
});

// 获取全部历史报告
router.get('/all-time', (req, res) => {
  const data = readData();
  
  if (data.records.length === 0) {
    return res.json({
      period: '暂无数据',
      type: 'all-time',
      records: [],
      stats: {
        startWeight: 0,
        endWeight: 0,
        change: 0,
        average: 0,
        min: 0,
        max: 0,
        bmi: 0,
        exerciseCount: 0,
        exerciseDuration: 0
      },
      insights: ['暂无记录']
    });
  }

  const sortedRecords = data.records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const startRecord = sortedRecords[0];
  const endRecord = sortedRecords[sortedRecords.length - 1];
  const startDate = new Date(startRecord.date);
  const endDate = new Date(endRecord.date);
  
  const startWeight = startRecord.weight;
  const endWeight = endRecord.weight;
  const change = Number((endWeight - startWeight).toFixed(1));
  const weights = data.records.map(r => r.weight);
  const average = Number((weights.reduce((sum, w) => sum + w, 0) / weights.length).toFixed(1));
  const min = Math.min(...weights);
  const max = Math.max(...weights);

  // 计算 BMI（endWeight 单位为斤，需转换为公斤）
  const heightInMeters = data.profile.height / 100;
  const endWeightInKg = endWeight / 2; // 斤转公斤
  const bmi = Number((endWeightInKg / (heightInMeters * heightInMeters)).toFixed(1));

  // 统计运动数据（全时段）
  const periodExerciseRecords = data.exerciseRecords.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate >= startDate && recordDate <= endDate;
  });
  const exerciseCount = periodExerciseRecords.length;
  const exerciseDuration = periodExerciseRecords.reduce((sum, r) => sum + (r.duration || 0), 0);

  const insights = [];
  const daysDiff = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
  
  insights.push(`共记录 ${daysDiff} 天，${data.records.length} 次`);
  
  if (change !== 0) {
    insights.push(`总体变化 ${change > 0 ? '+' : ''}${change}kg`);
  }
  
  if (exerciseCount > 0) {
    insights.push(`运动 ${exerciseCount} 次，共 ${exerciseDuration} 分钟`);
  }
  
  if (data.profile.targetWeight) {
    const toTarget = Number((data.profile.targetWeight - endWeight).toFixed(1));
    if (toTarget !== 0) {
      insights.push(`距离目标还有 ${toTarget > 0 ? '+' : ''}${toTarget}kg`);
    } else {
      insights.push('已达到目标体重！');
    }
  }

  const allTimeReport = {
    period: `${startDate.toLocaleDateString('zh-CN')} - ${endDate.toLocaleDateString('zh-CN')}`,
    type: 'all-time',
    records: sortedRecords,
    stats: {
      startWeight,
      endWeight,
      change,
      average,
      min,
      max,
      bmi,
      exerciseCount,
      exerciseDuration
    },
    insights
  };

  // 如果有已保存的 AI 分析，附加到报告中
  const reportKey = 'all-time';
  if (data.aiReports && data.aiReports.allTime) {
    allTimeReport.aiAnalysis = data.aiReports.allTime;
  }
  
  res.json(allTimeReport);
});

// 获取周报
router.get('/weekly', (req, res) => {
  const { date } = req.query; // 可选参数：指定日期
  const data = readData();
  
  let targetDate = date ? new Date(date) : new Date();
  const weeklyReport = generateWeeklyReportForDate(data.records, data.profile, targetDate, data.exerciseRecords);
  
  // 如果有已保存的 AI 分析，附加到报告中
  const reportKey = getReportKey(weeklyReport.period, 'weekly');
  if (reportKey && data.aiReports && data.aiReports.weekly && data.aiReports.weekly[reportKey]) {
    weeklyReport.aiAnalysis = data.aiReports.weekly[reportKey];
  }
  
  res.json(weeklyReport);
});

// 获取月报
router.get('/monthly', (req, res) => {
  const { year, month } = req.query; // 可选参数：指定年月
  const data = readData();
  
  let targetYear = year ? parseInt(year) : new Date().getFullYear();
  let targetMonth = month ? parseInt(month) : new Date().getMonth() + 1;
  
  const monthlyReport = generateMonthlyReportForMonth(data.records, data.profile, targetYear, targetMonth, data.exerciseRecords);
  
  // 如果有已保存的 AI 分析，附加到报告中
  const reportKey = getReportKey(monthlyReport.period, 'monthly');
  if (reportKey && data.aiReports && data.aiReports.monthly && data.aiReports.monthly[reportKey]) {
    monthlyReport.aiAnalysis = data.aiReports.monthly[reportKey];
  }
  
  res.json(monthlyReport);
});

// 生成指定日期的周报
function generateWeeklyReportForDate(records, profile, targetDate, exerciseRecords = []) {
  const weekStart = new Date(targetDate);
  // 计算到周一的天数（周一为一周的开始）
  const dayOfWeek = targetDate.getDay();
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  weekStart.setDate(targetDate.getDate() - daysToMonday);
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
        bmi: 0,
        exerciseCount: 0,
        exerciseDuration: 0
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

  // 计算 BMI（endWeight 单位为斤，需转换为公斤）
  const heightInMeters = profile.height / 100;
  const endWeightInKg = endWeight / 2; // 斤转公斤
  const bmi = Number((endWeightInKg / (heightInMeters * heightInMeters)).toFixed(1));

  // 统计运动数据（本周）
  const weekExerciseRecords = exerciseRecords.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate >= weekStart && recordDate <= weekEnd;
  });
  const exerciseCount = weekExerciseRecords.length;
  const exerciseDuration = weekExerciseRecords.reduce((sum, r) => sum + (r.duration || 0), 0);

  const insights = [];
  if (change > 0) {
    insights.push(`本周体重增加了 ${change}kg`);
  } else if (change < 0) {
    insights.push(`本周体重减少了 ${Math.abs(change)}kg`);
  } else {
    insights.push('本周体重保持稳定');
  }

  if (exerciseCount > 0) {
    insights.push(`本周运动 ${exerciseCount} 次，共 ${exerciseDuration} 分钟`);
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
      bmi,
      exerciseCount,
      exerciseDuration
    },
    insights
  };
}

// 生成指定年月的月报
function generateMonthlyReportForMonth(records, profile, year, month, exerciseRecords = []) {
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);

  const monthRecords = records.filter(r => {
    const recordDate = new Date(r.date);
    return recordDate >= monthStart && recordDate <= monthEnd;
  });

  if (monthRecords.length === 0) {
    return {
      period: `${year}年${month}月`,
      type: 'monthly',
      records: [],
      stats: {
        startWeight: 0,
        endWeight: 0,
        change: 0,
        average: 0,
        min: 0,
        max: 0,
        bmi: 0,
        exerciseCount: 0,
        exerciseDuration: 0,
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

  // 计算 BMI（endWeight 单位为斤，需转换为公斤）
  const heightInMeters = profile.height / 100;
  const endWeightInKg = endWeight / 2; // 斤转公斤
  const bmi = Number((endWeightInKg / (heightInMeters * heightInMeters)).toFixed(1));

  // 统计运动数据（本月）
  const monthExerciseRecords = exerciseRecords.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate >= monthStart && recordDate <= monthEnd;
  });
  const exerciseCount = monthExerciseRecords.length;
  const exerciseDuration = monthExerciseRecords.reduce((sum, r) => sum + (r.duration || 0), 0);

  // 计算每周平均体重
  const weeklyAverages = [];
  for (let i = 0; i < 5; i++) {
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

  if (exerciseCount > 0) {
    insights.push(`本月运动 ${exerciseCount} 次，共 ${exerciseDuration} 分钟`);
  }

  return {
    period: `${year}年${month}月`,
    type: 'monthly',
    records: monthRecords,
    stats: {
      startWeight,
      endWeight,
      change,
      average,
      min,
      max,
      bmi,
      exerciseCount,
      exerciseDuration,
      weeklyAverages
    },
    insights
  };
}

// 生成周报 AI 分析
router.post('/weekly/ai', async (req, res) => {
  try {
    const { force = false, date } = req.body;
    const data = readData();
    
    // 根据日期参数生成报告
    let targetDate = date ? new Date(date) : new Date();
    const weeklyReport = generateWeeklyReportForDate(data.records, data.profile, targetDate, data.exerciseRecords);
    const reportKey = getReportKey(weeklyReport.period, 'weekly');
    
    // 检查是否已有分析（如果不是强制重新生成）
    if (!force && reportKey && data.aiReports.weekly[reportKey]) {
      return res.json(data.aiReports.weekly[reportKey]);
    }
    
    const aiAnalysis = await generateAIWeeklyReport(weeklyReport, data.profile, data.exerciseRecords);
    
    if (aiAnalysis.success) {
      // 保存 AI 分析结果
      const analysisData = {
        ...aiAnalysis.data,
        generatedAt: new Date().toISOString()
      };
      
      if (reportKey) {
        if (!data.aiReports.weekly) {
          data.aiReports.weekly = {};
        }
        data.aiReports.weekly[reportKey] = analysisData;
        writeData(data);
      }
      
      res.json(analysisData);
    } else {
      res.status(500).json({ error: aiAnalysis.error });
    }
  } catch (error) {
    res.status(500).json({ error: '生成 AI 分析失败' });
  }
});

// 生成全时段 AI 分析
router.post('/all-time/ai', async (req, res) => {
  try {
    const { force = false } = req.body;
    const data = readData();
    
    // 检查是否已有分析（如果不是强制重新生成）
    if (!force && data.aiReports.allTime) {
      return res.json(data.aiReports.allTime);
    }
    
    // 生成全时段报告
    if (data.records.length === 0) {
      return res.status(400).json({ error: '暂无体重记录' });
    }

    const sortedRecords = data.records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const startRecord = sortedRecords[0];
    const endRecord = sortedRecords[sortedRecords.length - 1];
    const startDate = new Date(startRecord.date);
    const endDate = new Date(endRecord.date);
    
    const startWeight = startRecord.weight;
    const endWeight = endRecord.weight;
    const change = Number((endWeight - startWeight).toFixed(1));
    const weights = data.records.map(r => r.weight);
    const average = Number((weights.reduce((sum, w) => sum + w, 0) / weights.length).toFixed(1));
    const min = Math.min(...weights);
    const max = Math.max(...weights);

    const allTimeReport = {
      period: `${startDate.toLocaleDateString('zh-CN')} - ${endDate.toLocaleDateString('zh-CN')}`,
      type: 'all-time',
      records: sortedRecords,
      stats: {
        startWeight,
        endWeight,
        change,
        average,
        min,
        max,
        recordCount: data.records.length
      }
    };
    
    const aiAnalysis = await generateAIAllTimeReport(allTimeReport, data.profile, data.exerciseRecords);
    
    if (aiAnalysis.success) {
      const analysisData = {
        ...aiAnalysis.data,
        generatedAt: new Date().toISOString()
      };
      
      if (!data.aiReports.allTime) {
        data.aiReports.allTime = null;
      }
      data.aiReports.allTime = analysisData;
      writeData(data);
      
      res.json(analysisData);
    } else {
      res.status(500).json({ error: aiAnalysis.error });
    }
  } catch (error) {
    res.status(500).json({ error: '生成 AI 分析失败' });
  }
});

// 生成月报 AI 分析
router.post('/monthly/ai', async (req, res) => {
  try {
    const { force = false, year, month } = req.body;
    const data = readData();
    
    // 根据年月参数生成报告
    let targetYear = year || new Date().getFullYear();
    let targetMonth = month || new Date().getMonth() + 1;
    const monthlyReport = generateMonthlyReportForMonth(data.records, data.profile, targetYear, targetMonth, data.exerciseRecords);
    const reportKey = getReportKey(monthlyReport.period, 'monthly');
    
    // 检查是否已有分析（如果不是强制重新生成）
    if (!force && reportKey && data.aiReports.monthly[reportKey]) {
      return res.json(data.aiReports.monthly[reportKey]);
    }
    
    const aiAnalysis = await generateAIMonthlyReport(monthlyReport, data.profile, data.exerciseRecords);
    
    if (aiAnalysis.success) {
      // 保存 AI 分析结果
      const analysisData = {
        ...aiAnalysis.data,
        generatedAt: new Date().toISOString()
      };
      
      if (reportKey) {
        if (!data.aiReports.monthly) {
          data.aiReports.monthly = {};
        }
        data.aiReports.monthly[reportKey] = analysisData;
        writeData(data);
      }
      
      res.json(analysisData);
    } else {
      res.status(500).json({ error: aiAnalysis.error });
    }
  } catch (error) {
    res.status(500).json({ error: '生成 AI 分析失败' });
  }
});

module.exports = router; 