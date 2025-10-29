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

  // 计算趋势预测
  let targetPrediction = null;
  if (targetWeight && targetWeight > 0) {
    targetPrediction = predictTargetDate(records, targetWeight, safeProfile);
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
    targetBMR,
    targetPrediction
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

// 线性回归预测
function linearRegression(records, daysToPredict = 30) {
  if (records.length < 2) return null;

  const sortedRecords = [...records].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // 使用最近30条记录或全部记录（取较小值）
  const recentRecords = sortedRecords.slice(-Math.min(30, sortedRecords.length));
  
  if (recentRecords.length < 2) return null;

  const startDate = new Date(recentRecords[0].date).getTime();
  
  // 转换为天数和体重数组
  const data = recentRecords.map(record => ({
    day: (new Date(record.date).getTime() - startDate) / (1000 * 60 * 60 * 24),
    weight: record.weight
  }));

  // 计算线性回归参数
  const n = data.length;
  const sumX = data.reduce((sum, point) => sum + point.day, 0);
  const sumY = data.reduce((sum, point) => sum + point.weight, 0);
  const sumXY = data.reduce((sum, point) => sum + point.day * point.weight, 0);
  const sumX2 = data.reduce((sum, point) => sum + point.day * point.day, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // 生成预测数据
  const lastDay = data[data.length - 1].day;
  const predictions = [];
  
  for (let i = 1; i <= daysToPredict; i++) {
    const day = lastDay + i;
    const predictedWeight = slope * day + intercept;
    predictions.push({
      day,
      weight: Number(predictedWeight.toFixed(1))
    });
  }

  return {
    method: 'linear',
    slope,
    intercept,
    predictions,
    dailyChange: Number(slope.toFixed(3)) // 每日平均变化
  };
}

// 指数衰减预测（考虑减重速度逐渐放缓）
function exponentialDecayPredict(records, daysToPredict = 30) {
  if (records.length < 5) return null;

  const sortedRecords = [...records].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const recentRecords = sortedRecords.slice(-Math.min(30, sortedRecords.length));
  if (recentRecords.length < 5) return null;

  const startDate = new Date(recentRecords[0].date).getTime();
  
  // 计算每日变化率
  const dailyChanges = [];
  for (let i = 1; i < recentRecords.length; i++) {
    const daysDiff = (new Date(recentRecords[i].date).getTime() - new Date(recentRecords[i-1].date).getTime()) / (1000 * 60 * 60 * 24);
    if (daysDiff > 0) {
      const change = (recentRecords[i].weight - recentRecords[i-1].weight) / daysDiff;
      dailyChanges.push(change);
    }
  }

  if (dailyChanges.length < 2) return null;

  // 计算初始速率和衰减系数
  const initialRate = dailyChanges.slice(0, Math.ceil(dailyChanges.length / 3)).reduce((sum, c) => sum + c, 0) / Math.ceil(dailyChanges.length / 3);
  const recentRate = dailyChanges.slice(-Math.ceil(dailyChanges.length / 3)).reduce((sum, c) => sum + c, 0) / Math.ceil(dailyChanges.length / 3);
  
  // 估算衰减系数（越接近1表示衰减越慢）
  const decayFactor = Math.abs(recentRate / initialRate);
  const adjustedDecayFactor = Math.max(0.85, Math.min(0.98, decayFactor)); // 限制在合理范围内

  // 生成预测数据
  const lastWeight = recentRecords[recentRecords.length - 1].weight;
  const lastDay = (new Date(recentRecords[recentRecords.length - 1].date).getTime() - startDate) / (1000 * 60 * 60 * 24);
  const predictions = [];
  
  let currentWeight = lastWeight;
  let currentRate = recentRate;

  for (let i = 1; i <= daysToPredict; i++) {
    // 每天应用衰减因子
    currentRate = currentRate * adjustedDecayFactor;
    currentWeight += currentRate;
    
    predictions.push({
      day: lastDay + i,
      weight: Number(currentWeight.toFixed(1))
    });
  }

  return {
    method: 'exponentialDecay',
    predictions,
    dailyChange: Number(recentRate.toFixed(3)),
    decayFactor: Number(adjustedDecayFactor.toFixed(3)),
    initialRate: Number(initialRate.toFixed(3))
  };
}

// 动态BMR模型预测（考虑体重变化导致的代谢率变化）
function dynamicBMRPredict(records, profile, targetWeight, daysToPredict = 365) {
  if (records.length < 2 || !profile || !profile.birthYear || !profile.gender || !profile.height) {
    return null;
  }

  const sortedRecords = [...records].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const recentRecords = sortedRecords.slice(-Math.min(30, sortedRecords.length));
  if (recentRecords.length < 2) return null;

  // 计算历史平均每日热量赤字
  const totalWeightChange = recentRecords[recentRecords.length - 1].weight - recentRecords[0].weight;
  const daysDiff = (new Date(recentRecords[recentRecords.length - 1].date).getTime() - 
                   new Date(recentRecords[0].date).getTime()) / (1000 * 60 * 60 * 24);
  
  if (daysDiff <= 0) return null;

  // 1kg脂肪约等于7700kcal
  const avgDailyCalorieDeficit = (totalWeightChange * 7700) / daysDiff;

  // 如果热量赤字太小（接近维持），则无法预测
  if (Math.abs(avgDailyCalorieDeficit) < 50) return null;

  const startDate = new Date(recentRecords[0].date).getTime();
  const lastWeight = recentRecords[recentRecords.length - 1].weight;
  const lastDay = (new Date(recentRecords[recentRecords.length - 1].date).getTime() - startDate) / (1000 * 60 * 60 * 24);
  
  const currentYear = new Date().getFullYear();
  const age = currentYear - profile.birthYear;

  const predictions = [];
  let currentWeight = lastWeight;

  // 模拟每天的体重变化
  for (let i = 1; i <= daysToPredict; i++) {
    // 计算当前体重的BMR
    const currentBMR = calculateBMR(currentWeight, profile.height, profile.birthYear, profile.gender);
    
    if (!currentBMR) break;

    // 假设活动系数为1.2（轻度活动）
    const tdee = currentBMR * 1.2;
    
    // 计算净热量赤字（考虑TDEE变化）
    const effectiveDeficit = avgDailyCalorieDeficit;
    
    // 计算体重变化（考虑代谢适应，实际效果会打折扣）
    const metabolicAdaptation = 0.9; // 代谢适应系数，实际消耗会降低约10%
    const weightChange = (effectiveDeficit * metabolicAdaptation) / 7700;
    
    currentWeight += weightChange;
    
    // 如果已经接近或超过目标，停止预测
    if (targetWeight) {
      const isLosingWeight = avgDailyCalorieDeficit < 0;
      if ((isLosingWeight && currentWeight <= targetWeight) || 
          (!isLosingWeight && currentWeight >= targetWeight)) {
        predictions.push({
          day: lastDay + i,
          weight: Number(currentWeight.toFixed(1))
        });
        break;
      }
    }
    
    predictions.push({
      day: lastDay + i,
      weight: Number(currentWeight.toFixed(1))
    });
  }

  return {
    method: 'dynamicBMR',
    predictions,
    dailyChange: Number((avgDailyCalorieDeficit / 7700).toFixed(3)),
    avgCalorieDeficit: Math.round(avgDailyCalorieDeficit)
  };
}

// AI 预测（使用大语言模型进行智能预测）
async function aiPredict(records, targetWeight, profile) {
  if (records.length < 5 || !targetWeight || targetWeight <= 0) {
    return null;
  }

  try {
    // 导入 AI 配置（延迟加载，避免循环依赖）
    const { readFileSync } = require('fs');
    const { homedir } = require('os');
    const { join } = require('path');
    const axios = require('axios');
    
    // 读取 API 配置
    let apiKey, baseUrl, model;
    try {
      const zshrcPath = join(homedir(), '.zshrc');
      const zshrcContent = readFileSync(zshrcPath, 'utf-8');
      
      const apiKeyMatch = zshrcContent.match(/export OPENAI_API_KEY\s*=\s*"(.+)"/);
      apiKey = apiKeyMatch ? apiKeyMatch[1] : null;
      
      const baseUrlMatch = zshrcContent.match(/export OPENAI_BASE_URL\s*=\s*"(.+)"/);
      baseUrl = baseUrlMatch ? baseUrlMatch[1] : null;
      if (baseUrl && baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
      }
      
      const modelMatch = zshrcContent.match(/export OPENAI_MODEL\s*=\s*"(.+)"/);
      model = modelMatch ? modelMatch[1] : 'qwen-plus';
      
      if (!apiKey || !baseUrl) {
        console.log('[AI预测] 未找到 API 配置，跳过 AI 预测');
        return null;
      }
    } catch (error) {
      console.log('[AI预测] 读取 API 配置失败，跳过 AI 预测');
      return null;
    }

    const sortedRecords = [...records].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    // 使用最近30条记录
    const recentRecords = sortedRecords.slice(-Math.min(30, sortedRecords.length));
    const currentWeight = sortedRecords[sortedRecords.length - 1].weight;
    const weightDifference = targetWeight - currentWeight;
    
    if (Math.abs(weightDifference) < 0.5) {
      return null; // 已达到目标
    }
    
    // 计算一些统计数据
    const daysDiff = (new Date(recentRecords[recentRecords.length - 1].date).getTime() - 
                     new Date(recentRecords[0].date).getTime()) / (1000 * 60 * 60 * 24);
    const totalChange = recentRecords[recentRecords.length - 1].weight - recentRecords[0].weight;
    const avgDailyChange = totalChange / daysDiff;
    
    // 构建提示词
    const prompt = `你是一位专业的健康数据分析师。请根据以下体重记录数据，智能预测达到目标体重的时间。

【用户资料】
- 当前体重：${currentWeight}kg
- 目标体重：${targetWeight}kg
- 需要${weightDifference > 0 ? '增重' : '减重'}：${Math.abs(weightDifference).toFixed(1)}kg
${profile.birthYear ? `- 年龄：${new Date().getFullYear() - profile.birthYear}岁` : ''}
${profile.gender ? `- 性别：${profile.gender === 'male' ? '男' : '女'}` : ''}
${profile.height ? `- 身高：${profile.height}cm` : ''}

【最近体重数据】（最近${recentRecords.length}条记录，时间跨度${Math.round(daysDiff)}天）
${recentRecords.map(r => {
  const date = new Date(r.date);
  return `- ${date.getMonth() + 1}月${date.getDate()}日：${r.weight}kg`;
}).join('\n')}

【统计数据】
- 平均每日变化：${avgDailyChange.toFixed(3)}kg
- 总变化量：${totalChange > 0 ? '+' : ''}${totalChange.toFixed(1)}kg

请根据以上数据进行智能分析，综合考虑：
1. 历史体重变化趋势
2. 变化速度的波动和规律
3. 健康减重/增重的速度建议（减重建议每周0.5-1kg，增重建议每周0.25-0.5kg）
4. 可能出现的平台期和速度放缓
5. 用户的年龄、性别、身高等因素（如有）

**要求**：
- 必须以纯JSON格式返回，不要包含任何其他文字
- 预测要合理且符合健康标准
- 给出具体的天数和日期
- 提供简短的预测依据说明（50字以内）

**JSON格式**：
{
  "daysRemaining": 预计还需天数（整数）,
  "dailyChange": 预测的平均每日变化（保留3位小数，如-0.123）,
  "confidence": "预测置信度（high/medium/low）",
  "reasoning": "预测依据简述（50字以内）"
}`;

    // 调用 AI API
    const response = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model: model,
        messages: [
          {
            role: 'system',
            content: '你是一位专业的健康数据分析师，擅长基于历史数据进行智能预测。你的回复必须是纯JSON格式。'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // 较低的温度使预测更稳定
        timeout: 30000
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        timeout: 30000
      }
    );

    let content = response.data.choices[0].message.content;
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    const aiResponse = JSON.parse(content);
    
    // 验证返回数据
    if (!aiResponse.daysRemaining || aiResponse.daysRemaining <= 0 || aiResponse.daysRemaining > 3650) {
      console.log('[AI预测] AI返回的天数不合理:', aiResponse.daysRemaining);
      return null;
    }
    
    // 计算预测日期
    const lastDate = new Date(sortedRecords[sortedRecords.length - 1].date);
    const predictedDate = new Date(lastDate);
    predictedDate.setDate(lastDate.getDate() + Math.ceil(aiResponse.daysRemaining));
    
    console.log('[AI预测] 成功生成预测:', {
      daysRemaining: aiResponse.daysRemaining,
      predictedDate: predictedDate.toISOString().split('T')[0],
      reasoning: aiResponse.reasoning
    });
    
    return {
      method: 'ai',
      predictions: [], // AI 预测不提供逐日预测点
      daysRemaining: Math.ceil(aiResponse.daysRemaining),
      predictedDate: predictedDate.toISOString().split('T')[0],
      dailyChange: Number(aiResponse.dailyChange.toFixed(3)),
      confidence: aiResponse.confidence || 'medium',
      reasoning: aiResponse.reasoning || 'AI智能分析'
    };
  } catch (error) {
    console.error('[AI预测] 生成失败:', error.response?.data || error.message);
    return null;
  }
}

// 计算达到目标的预计日期
function predictTargetDate(records, targetWeight, profile) {
  if (records.length < 2 || !targetWeight || targetWeight <= 0) {
    return null;
  }

  const sortedRecords = [...records].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  const currentWeight = sortedRecords[sortedRecords.length - 1].weight;
  const weightDifference = targetWeight - currentWeight;

  // 如果已经达到目标
  if (Math.abs(weightDifference) < 0.5) {
    return {
      achieved: true,
      daysRemaining: 0,
      predictedDate: new Date().toISOString().split('T')[0]
    };
  }

  // 1. 线性回归预测（基础模型）
  const linearPred = linearRegression(records, 365);

  // 2. 指数衰减预测（考虑减重速度放缓）
  const expPred = exponentialDecayPredict(records, 365);

  // 3. 动态BMR预测（最科学的模型，需要个人资料）
  const dynamicPred = profile ? dynamicBMRPredict(records, profile, targetWeight, 365) : null;

  const predictions = [];

  // 动态BMR预测（推荐使用，最科学）
  if (dynamicPred && dynamicPred.predictions && dynamicPred.predictions.length > 0) {
    const lastPrediction = dynamicPred.predictions[dynamicPred.predictions.length - 1];
    const daysToTarget = lastPrediction.day - 
      (new Date(sortedRecords[sortedRecords.length - 1].date).getTime() - new Date(records[0].date).getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysToTarget > 0 && daysToTarget < 3650) {
      const lastDate = new Date(sortedRecords[sortedRecords.length - 1].date);
      const predictedDate = new Date(lastDate);
      predictedDate.setDate(lastDate.getDate() + Math.ceil(daysToTarget));
      
      predictions.push({
        method: '动态代谢模型',
        methodKey: 'dynamicBMR',
        daysRemaining: Math.ceil(daysToTarget),
        predictedDate: predictedDate.toISOString().split('T')[0],
        dailyChange: dynamicPred.dailyChange,
        confidence: 'high',
        avgCalorieDeficit: dynamicPred.avgCalorieDeficit,
        description: '考虑体重变化导致的代谢率变化（最科学）'
      });
    }
  }

  // 指数衰减预测
  if (expPred && expPred.predictions && expPred.predictions.length > 0) {
    // 找到最接近目标体重的预测点
    let closestIndex = -1;
    let minDiff = Infinity;
    
    for (let i = 0; i < expPred.predictions.length; i++) {
      const diff = Math.abs(expPred.predictions[i].weight - targetWeight);
      if (diff < minDiff) {
        minDiff = diff;
        closestIndex = i;
      }
    }
    
    if (closestIndex >= 0 && minDiff < 2) { // 找到接近目标的点
      const daysToTarget = closestIndex + 1;
      const lastDate = new Date(sortedRecords[sortedRecords.length - 1].date);
      const predictedDate = new Date(lastDate);
      predictedDate.setDate(lastDate.getDate() + daysToTarget);
      
      predictions.push({
        method: '指数衰减模型',
        methodKey: 'exponentialDecay',
        daysRemaining: daysToTarget,
        predictedDate: predictedDate.toISOString().split('T')[0],
        dailyChange: expPred.dailyChange,
        confidence: 'high',
        decayFactor: expPred.decayFactor,
        description: '考虑减重速度逐渐放缓'
      });
    }
  }

  // 线性回归预测
  if (linearPred && Math.abs(linearPred.dailyChange) > 0.001) {
    const daysToTarget = weightDifference / linearPred.dailyChange;
    
    if (daysToTarget > 0 && daysToTarget < 3650) {
      const lastDate = new Date(sortedRecords[sortedRecords.length - 1].date);
      const predictedDate = new Date(lastDate);
      predictedDate.setDate(lastDate.getDate() + Math.ceil(daysToTarget));
      
      predictions.push({
        method: '线性回归',
        methodKey: 'linear',
        daysRemaining: Math.ceil(daysToTarget),
        predictedDate: predictedDate.toISOString().split('T')[0],
        dailyChange: linearPred.dailyChange,
        confidence: 'medium',
        description: '基于历史趋势线预测'
      });
    }
  }

  if (predictions.length === 0) {
    return null;
  }

  return {
    achieved: false,
    currentWeight,
    targetWeight,
    weightDifference: Number(weightDifference.toFixed(1)),
    predictions,
    linearPrediction: linearPred,
    exponentialDecayPrediction: expPred,
    dynamicBMRPrediction: dynamicPred
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
  calculateCalendarData,
  linearRegression,
  exponentialDecayPredict,
  dynamicBMRPredict,
  predictTargetDate,
  aiPredict
}; 