const express = require('express');
const router = express.Router();
const { readData } = require('../utils/dataManager');
const { aiPredict } = require('../utils/calculations');

// 生成 AI 预测
router.post('/', async (req, res) => {
  try {
    const data = readData();
    const { records, profile } = data;
    
    // 获取目标体重：优先使用阶段目标中的最小值，否则使用 profile.targetWeight
    let targetWeight = profile?.targetWeight;
    if (profile?.milestones && profile.milestones.length > 0) {
      targetWeight = Math.min(...profile.milestones.map(m => m.targetWeight));
    }
    
    if (!targetWeight || targetWeight <= 0) {
      return res.status(400).json({ error: '请先设置目标体重' });
    }
    
    if (!records || records.length < 5) {
      return res.status(400).json({ error: '需要至少5条体重记录才能生成AI预测' });
    }
    
    console.log('[AI预测] 开始生成预测...', { targetWeight });
    const aiPred = await aiPredict(records, targetWeight, profile);
    
    if (!aiPred) {
      return res.status(500).json({ error: 'AI预测生成失败，请稍后重试' });
    }
    
    // 构造符合前端格式的预测结果
    const sortedRecords = [...records].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    const currentWeight = sortedRecords[sortedRecords.length - 1].weight;
    const weightDifference = targetWeight - currentWeight;
    
    const prediction = {
      method: 'AI 智能预测',
      methodKey: 'ai',
      daysRemaining: aiPred.daysRemaining,
      predictedDate: aiPred.predictedDate,
      dailyChange: aiPred.dailyChange,
      confidence: aiPred.confidence,
      description: aiPred.reasoning || '基于历史数据的AI智能分析'
    };
    
    console.log('[AI预测] 生成成功:', prediction);
    
    res.json({
      success: true,
      prediction,
      currentWeight,
      targetWeight,
      weightDifference: Number(weightDifference.toFixed(1))
    });
  } catch (error) {
    console.error('[AI预测] 生成失败:', error.message);
    res.status(500).json({ 
      success: false, 
      error: error.message || 'AI预测生成失败，请稍后重试' 
    });
  }
});

module.exports = router;

