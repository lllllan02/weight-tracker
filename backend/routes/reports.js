const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../utils/dataManager');
const { generateWeeklyReport, generateMonthlyReport } = require('../utils/reports');
const { generateAIWeeklyReport, generateAIMonthlyReport } = require('../utils/aiReports');

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

// 获取周报
router.get('/weekly', (req, res) => {
  const data = readData();
  const weeklyReport = generateWeeklyReport(data.records, data.profile);
  
  // 如果有已保存的 AI 分析，附加到报告中
  const reportKey = getReportKey(weeklyReport.period, 'weekly');
  if (reportKey && data.aiReports && data.aiReports.weekly && data.aiReports.weekly[reportKey]) {
    weeklyReport.aiAnalysis = data.aiReports.weekly[reportKey];
  }
  
  res.json(weeklyReport);
});

// 获取月报
router.get('/monthly', (req, res) => {
  const data = readData();
  const monthlyReport = generateMonthlyReport(data.records, data.profile);
  
  // 如果有已保存的 AI 分析，附加到报告中
  const reportKey = getReportKey(monthlyReport.period, 'monthly');
  if (reportKey && data.aiReports && data.aiReports.monthly && data.aiReports.monthly[reportKey]) {
    monthlyReport.aiAnalysis = data.aiReports.monthly[reportKey];
  }
  
  res.json(monthlyReport);
});

// 生成周报 AI 分析
router.post('/weekly/ai', async (req, res) => {
  try {
    const { force = false } = req.body;
    const data = readData();
    const weeklyReport = generateWeeklyReport(data.records, data.profile);
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

// 生成月报 AI 分析
router.post('/monthly/ai', async (req, res) => {
  try {
    const { force = false } = req.body;
    const data = readData();
    const monthlyReport = generateMonthlyReport(data.records, data.profile);
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