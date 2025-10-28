const axios = require('axios');
const { readFileSync } = require('fs');
const { homedir } = require('os');
const { join } = require('path');

// 从 ~/.zshrc 读取 API 配置
function getApiConfig() {
  try {
    const zshrcPath = join(homedir(), '.zshrc');
    const zshrcContent = readFileSync(zshrcPath, 'utf-8');
    
    // 提取 OPENAI_API_KEY
    const apiKeyMatch = zshrcContent.match(/export OPENAI_API_KEY\s*=\s*"(.+)"/);
    const apiKey = apiKeyMatch ? apiKeyMatch[1] : null;
    
    // 提取 OPENAI_BASE_URL
    const baseUrlMatch = zshrcContent.match(/export OPENAI_BASE_URL\s*=\s*"(.+)"/);
    let baseUrl = baseUrlMatch ? baseUrlMatch[1] : null;
    
    // 移除末尾的斜杠
    if (baseUrl && baseUrl.endsWith('/')) {
      baseUrl = baseUrl.slice(0, -1);
    }
    
    // 提取 OPENAI_MODEL
    const modelMatch = zshrcContent.match(/export OPENAI_MODEL\s*=\s*"(.+)"/);
    const model = modelMatch ? modelMatch[1] : 'qwen-plus'; // 默认值
    
    if (!apiKey || !baseUrl) {
      throw new Error('无法从 ~/.zshrc 读取 API 配置');
    }
    
    return { apiKey, baseUrl, model };
  } catch (error) {
    console.error('读取 API 配置失败:', error.message);
    throw error;
  }
}

// 格式化日期时间
function formatDateTime(dateStr) {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
}

// 格式化日期
function formatDate(dateStr) {
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

// 分析体重波动
function analyzeFluctuations(records) {
  if (!records || records.length === 0) {
    return null;
  }

  const sortedRecords = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // 周末 vs 工作日分析
  const weekendWeights = [];
  const weekdayWeights = [];
  
  sortedRecords.forEach(record => {
    const date = new Date(record.date);
    const dayOfWeek = date.getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) {
      weekendWeights.push(record.weight);
    } else {
      weekdayWeights.push(record.weight);
    }
  });

  let weekendAvg = 0;
  let weekdayAvg = 0;
  let weekendPattern = '';

  if (weekendWeights.length > 0 && weekdayWeights.length > 0) {
    weekendAvg = (weekendWeights.reduce((sum, w) => sum + w, 0) / weekendWeights.length).toFixed(1);
    weekdayAvg = (weekdayWeights.reduce((sum, w) => sum + w, 0) / weekdayWeights.length).toFixed(1);
    
    const diff = weekendAvg - weekdayAvg;
    if (Math.abs(diff) > 0.3) {
      if (diff > 0) {
        weekendPattern = `周末体重平均比工作日高 ${diff.toFixed(1)}kg`;
      } else {
        weekendPattern = `工作日体重平均比周末高 ${Math.abs(diff).toFixed(1)}kg`;
      }
    }
  }

  // 异常波动统计
  const anomalyDetails = [];
  let maxIncrease = 0;
  let maxDecrease = 0;
  
  for (let i = 1; i < sortedRecords.length; i++) {
    const change = sortedRecords[i].weight - sortedRecords[i - 1].weight;
    
    // 记录异常波动
    if (Math.abs(change) > 2) {
      anomalyDetails.push({
        date: sortedRecords[i].date,
        change: change,
      });
    }
    
    // 记录最大变化
    if (change > maxIncrease) maxIncrease = change;
    if (change < maxDecrease) maxDecrease = change;
  }

  return {
    weekendPattern,
    weekendAvg,
    weekdayAvg,
    anomalyCount: anomalyDetails.length,
    anomalyDetails,
    maxIncrease,
    maxDecrease: Math.abs(maxDecrease),
  };
}

// 提取运动数据（周报）
function extractWeeklyExerciseData(exerciseRecords, report) {
  const weekStart = new Date(report.period.split(' - ')[0]);
  const weekEnd = new Date(report.period.split(' - ')[1]);
  
  const weekExercises = exerciseRecords.filter(e => {
    const exerciseDate = new Date(e.date);
    return exerciseDate >= weekStart && exerciseDate <= weekEnd;
  });
  
  const exerciseDays = weekExercises.length;
  const totalDuration = weekExercises.reduce((sum, e) => sum + e.duration, 0);
  const avgDuration = exerciseDays > 0 ? Math.round(totalDuration / exerciseDays) : 0;
  
  const detailText = exerciseDays > 0 
    ? `\n【运动记录详情】\n${weekExercises.map(e => `- ${formatDate(e.date)}：${e.duration}分钟`).join('\n')}`
    : '- 本周暂无运动记录';
  
  return {
    text: `【本周运动数据】
- 运动天数：${exerciseDays}天
- 总运动时长：${totalDuration}分钟
- 平均每次时长：${avgDuration}分钟${detailText}`,
    stats: { exerciseDays, totalDuration, avgDuration }
  };
}

// 提取运动数据（月报）
function extractMonthlyExerciseData(exerciseRecords, report) {
  const monthMatch = report.period.match(/(\d{4})年(\d{1,2})月/);
  const year = parseInt(monthMatch[1]);
  const month = parseInt(monthMatch[2]);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);
  
  const monthExercises = exerciseRecords.filter(e => {
    const exerciseDate = new Date(e.date);
    return exerciseDate >= monthStart && exerciseDate <= monthEnd;
  });
  
  const exerciseDays = monthExercises.length;
  const totalDuration = monthExercises.reduce((sum, e) => sum + e.duration, 0);
  const avgDuration = exerciseDays > 0 ? Math.round(totalDuration / exerciseDays) : 0;
  
  // 按周统计运动
  const weeklyExercise = [0, 0, 0, 0, 0];
  monthExercises.forEach(e => {
    const exerciseDate = new Date(e.date);
    const weekOfMonth = Math.floor((exerciseDate.getDate() - 1) / 7);
    if (weekOfMonth < 5) {
      weeklyExercise[weekOfMonth]++;
    }
  });
  
  const detailText = exerciseDays > 0 
    ? `\n【运动记录详情】（显示前10条和后10条）\n${monthExercises.slice(0, 10).map(e => 
        `- ${formatDate(e.date)}：${e.duration}分钟`
      ).join('\n')}${monthExercises.length > 20 ? `\n... (中间省略 ${monthExercises.length - 20} 条记录) ...` : ''}${
        monthExercises.length > 10 ? '\n' + monthExercises.slice(-10).map(e => 
          `- ${formatDate(e.date)}：${e.duration}分钟`
        ).join('\n') : ''
      }`
    : '- 本月暂无运动记录';
  
  return {
    text: `【本月运动数据】
- 运动天数：${exerciseDays}天
- 总运动时长：${totalDuration}分钟
- 平均每次时长：${avgDuration}分钟
- 每周运动天数：${weeklyExercise.map((days, i) => `第${i+1}周: ${days}天`).filter((_, i) => i < 4 || weeklyExercise[i] > 0).join(', ')}${detailText}`,
    stats: { exerciseDays, totalDuration, avgDuration, weeklyExercise }
  };
}

// 提取运动数据（全时段）
function extractAllTimeExerciseData(exerciseRecords, report) {
  const sortedRecords = report.records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const startDate = new Date(sortedRecords[0].date);
  const endDate = new Date(sortedRecords[sortedRecords.length - 1].date);
  
  const periodExerciseRecords = exerciseRecords.filter(record => {
    const recordDate = new Date(record.date);
    return recordDate >= startDate && recordDate <= endDate;
  });
  
  if (periodExerciseRecords.length === 0) {
    return {
      text: '\n【运动记录】\n- 该时间段内暂无运动记录\n',
      stats: {}
    };
  }
  
  const totalExerciseDays = new Set(periodExerciseRecords.map(r => r.date.split('T')[0])).size;
  const totalExercises = periodExerciseRecords.length;
  
  const exerciseTypeCount = {};
  periodExerciseRecords.forEach(record => {
    exerciseTypeCount[record.type] = (exerciseTypeCount[record.type] || 0) + 1;
  });
  
  return {
    text: `
【运动记录】
- 总运动天数: ${totalExerciseDays} 天
- 总运动次数: ${totalExercises} 次
- 运动类型分布: ${Object.entries(exerciseTypeCount).map(([type, count]) => `${type} ${count}次`).join(', ')}`,
    stats: { totalExerciseDays, totalExercises, exerciseTypeCount }
  };
}

// 格式化体重记录（全部显示）
function formatAllWeightRecords(records) {
  return records.map(r => 
    `- ${formatDateTime(r.date)} ${r.weight}kg (${r.fasting})`
  ).join('\n');
}

// 通用提示词模板生成器
function generatePromptTemplate(reportType, report, profile, exerciseData) {
  // 报告类型的中文名称和时间范围描述
  const typeConfig = {
    weekly: { name: '周报', period: '本周', summaryLength: '50字以内', suggestions: '3-5条' },
    monthly: { name: '月报', period: '本月', summaryLength: '80字以内', suggestions: '5-8条' },
    'all-time': { name: '全时段综合', period: '全时段', summaryLength: '50字以内', suggestions: '3-5条' }
  };
  
  const config = typeConfig[reportType];
  
  // 计算波动分析数据
  const fluctuationData = analyzeFluctuations(report.records);
  
  // 构建波动分析文本
  let fluctuationText = '';
  if (fluctuationData) {
    fluctuationText = `\n\n=== 【体重波动分析】（重要数据，必须在分析中体现） ===`;
    
    // 异常波动
    fluctuationText += `\n📊 异常波动次数：${fluctuationData.anomalyCount}次（单日变化>2kg）`;
    if (fluctuationData.anomalyDetails.length > 0) {
      fluctuationText += `\n   详情：${fluctuationData.anomalyDetails.map(a => `${formatDate(a.date)}变化${a.change > 0 ? '+' : ''}${a.change.toFixed(1)}kg`).join('、')}`;
      fluctuationText += `\n   ⚠️ 请在洞察中分析异常波动的可能原因！`;
    }
    
    // 周期性规律
    if (fluctuationData.weekendPattern) {
      fluctuationText += `\n\n📅 周期性规律发现：${fluctuationData.weekendPattern}`;
      fluctuationText += `\n   · 工作日平均体重：${fluctuationData.weekdayAvg}kg`;
      fluctuationText += `\n   · 周末平均体重：${fluctuationData.weekendAvg}kg`;
      fluctuationText += `\n   · 差值：${Math.abs(fluctuationData.weekendAvg - fluctuationData.weekdayAvg).toFixed(1)}kg`;
      fluctuationText += `\n   ⚠️ 请在洞察和建议中针对这个周期性规律给出具体建议！`;
    }
    
    // 最大波动幅度
    if (fluctuationData.maxIncrease > 0 || fluctuationData.maxDecrease > 0) {
      fluctuationText += `\n\n📈 波动幅度统计：`;
      if (fluctuationData.maxIncrease > 0) {
        fluctuationText += `\n   · 最大单日增幅：+${fluctuationData.maxIncrease.toFixed(1)}kg`;
      }
      if (fluctuationData.maxDecrease > 0) {
        fluctuationText += `\n   · 最大单日降幅：-${fluctuationData.maxDecrease.toFixed(1)}kg`;
      }
    }
    
    fluctuationText += `\n===============================================\n`;
  }
  
  // 构建基本信息
  let basicInfo = `【基本信息】
- 用户姓名：${profile.name || '未设置'}
- 目标体重：${profile.targetWeight ? profile.targetWeight + 'kg' : '未设置'}
- 报告周期：${report.period}`;

  // 全时段报告的额外信息
  if (reportType === 'all-time') {
    const sortedRecords = report.records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const startDate = new Date(sortedRecords[0].date);
    const endDate = new Date(sortedRecords[sortedRecords.length - 1].date);
    const daysDiff = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;
    
    basicInfo = `【基本信息】
- 记录时间段: ${report.period}
- 总天数: ${daysDiff} 天
- 记录次数: ${report.records.length} 次
- 起始体重: ${report.stats.startWeight}kg
- 当前体重: ${report.stats.endWeight}kg
- 总体变化: ${report.stats.change > 0 ? '+' : ''}${report.stats.change}kg
- 平均体重: ${report.stats.average}kg
- 最低体重: ${report.stats.min}kg
- 最高体重: ${report.stats.max}kg
- 身高: ${profile.height}cm
${profile.targetWeight ? `- 目标体重: ${profile.targetWeight}kg` : ''}`;
  }
  
  // 构建体重数据部分
  let weightData = `【${config.period}体重数据】
- 记录次数：${report.records.length}次
- 起始体重：${report.stats.startWeight}kg
- 结束体重：${report.stats.endWeight}kg
- 体重变化：${report.stats.change}kg
- 平均体重：${report.stats.average}kg
- 最高体重：${report.stats.max}kg
- 最低体重：${report.stats.min}kg${fluctuationText}`;

  // 月报添加每周平均
  if (reportType === 'monthly' && report.stats.weeklyAverages) {
    weightData += `\n- 每周平均体重：${report.stats.weeklyAverages.map((w, i) => `第${i+1}周: ${w > 0 ? w + 'kg' : '无数据'}`).join(', ')}`;
  }
  
  // 构建体重记录详情 - 所有报告都显示对应时间段内的全部数据
  const weightRecords = `【体重记录详情】
${formatAllWeightRecords(report.records)}`;
  
  // 构建分析要求
  const analysisPoints = reportType === 'monthly'
    ? `1. ${config.period}体重变化总结（${config.summaryLength}）
2. 体重与运动关联分析（体重变化与运动量的关系，运动效果评估）
3. 趋势分析（分析每周体重变化趋势，是否稳定）
4. **波动分析（必须包含）**：
   - 如果有异常波动（单日变化>2kg），明确指出次数、日期和可能原因
   - 如果有周末vs工作日差异，明确指出具体数值和建议
   - 如果有最大增减幅，分析是否正常
5. 目标进度（如果设置了目标体重，评估完成进度）
6. 亮点分析（${config.period}做得好的地方，包括体重和运动方面）
7. 具体建议（${config.suggestions}，结合体重、运动和波动数据，包括饮食、运动强度/频率/类型、作息、心理等方面）`
    : reportType === 'all-time'
    ? `1. 总体评价（${config.summaryLength}）
2. 体重与运动关联分析（长期体重变化与运动的关系）
3. 趋势分析（整体变化趋势是否健康、有什么阶段性特点）
4. **波动分析（必须包含）**：
   - 如果有异常波动，明确指出并分析
   - 如果有周期性规律（如周末体重变化），明确指出并给建议
   - 长期波动幅度是否合理
5. 目标完成度评价（如果设置了目标体重）
6. 具体建议（${config.suggestions}，结合体重、运动和波动数据，包括饮食、运动强度/频率、作息等方面）`
    : `1. ${config.period}体重变化总结（${config.summaryLength}）
2. 体重与运动关联分析（体重变化与运动量的关系）
3. 趋势分析（体重变化是否符合健康标准）
4. **波动分析（必须包含）**：
   - 如果有异常波动（>2kg），明确说明
   - 如果有周末工作日差异，明确指出并建议
   - 最大增减幅是否需要关注
5. 目标进度（如果设置了目标体重）
6. 具体建议（${config.suggestions}，结合体重、运动和波动数据，包括饮食、运动强度/频率、作息等方面）`;
  
  // 组装完整提示词
  return `你是一位专业的健康管理顾问，请根据以下体重和运动数据生成一份详细的${config.name}分析。

${reportType === 'all-time' ? basicInfo : `${basicInfo}

${weightData}`}

${exerciseData.text}

${weightRecords}

请生成一份专业且有建设性的分析报告，包括：
${analysisPoints}

要求：
- 分析要专业、客观、有数据支撑
- 建议要具体、可操作
- 语气友好、鼓励为主
- 使用中文
- **重要**：综合体重和运动数据进行${reportType === 'all-time' ? '长期' : ''}分析${reportType === 'monthly' ? '，给出运动效果评估和优化建议' : '，给出运动与体重变化的关联性洞察'}
- **重要**：基于现有数据进行分析，不要批评或提及数据缺失、时间范围不完整、记录频率不够${reportType === 'monthly' ? '、首尾周无数据' : ''}等问题
- **重要**：如果【体重波动分析】中有异常波动或周期性规律数据，必须在"洞察"中明确提及并分析原因
- **重要**：如果发现周末体重与工作日体重有差异，必须在"洞察"和"建议"中明确指出并给出针对性建议
- 专注于已有数据的趋势和建议，而不是数据本身的完整性
- **必须**以纯JSON格式返回，不要包含任何其他文字说明，只返回JSON对象
- JSON格式如下：
{
  "summary": "总结（${reportType === 'monthly' ? '一到两句话' : '一句话'}）",
  "insights": ["洞察1", "洞察2", "洞察3", ...],
  "suggestions": ["建议1", "建议2", "建议3", ...]
}`;
}

// 通用的系统消息
const COMMON_SYSTEM_MESSAGE = '你是一位专业的健康管理顾问，擅长综合分析体重和运动数据并提供科学的健康建议。你的回复必须是纯JSON格式，不包含任何其他说明文字。重要：综合体重和运动数据进行深度关联分析，评估运动效果，只基于现有数据进行正面分析，绝不批评数据的完整性、记录频率或时间范围等问题。特别注意：如果数据中包含【体重波动分析】信息（异常波动、周期性规律等），必须在洞察中明确提及并给出具体建议。';

// 报告类型配置（简化版）
const reportTypeConfigs = {
  weekly: {
    extractExerciseData: extractWeeklyExerciseData,
  },
  monthly: {
    extractExerciseData: extractMonthlyExerciseData,
  },
  'all-time': {
    extractExerciseData: extractAllTimeExerciseData,
  }
};

// 通用的 AI 报告生成函数
async function generateAIReport(reportType, report, profile, exerciseRecords = []) {
  try {
    const { apiKey, baseUrl, model } = getApiConfig();
    const config = reportTypeConfigs[reportType];
    
    if (!config) {
      throw new Error(`不支持的报告类型: ${reportType}`);
    }
    
    // 提取运动数据
    const exerciseData = config.extractExerciseData(exerciseRecords, report);
    
    // 生成提示词（使用通用模板）
    const prompt = generatePromptTemplate(reportType, report, profile, exerciseData);
    
    // 调用 AI API
    const response = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model: model,
        messages: [
          {
            role: 'system',
            content: COMMON_SYSTEM_MESSAGE
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.7
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );

    let content = response.data.choices[0].message.content;
    
    // 移除可能的 markdown 代码块标记
    content = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
    
    const aiResponse = JSON.parse(content);
    return {
      success: true,
      data: {
        summary: aiResponse.summary,
        insights: aiResponse.insights || [],
        suggestions: aiResponse.suggestions || []
      }
    };
  } catch (error) {
    console.error(`AI ${reportType} 报告生成失败:`, error.response?.data || error.message);
    if (error.response?.data) {
      console.error('详细错误:', JSON.stringify(error.response.data, null, 2));
    }
    return {
      success: false,
      error: error.response?.data?.error?.message || '生成 AI 分析失败，请稍后重试'
    };
  }
}

// 向后兼容的包装函数
async function generateAIWeeklyReport(report, profile, exerciseRecords = []) {
  return generateAIReport('weekly', report, profile, exerciseRecords);
}

async function generateAIMonthlyReport(report, profile, exerciseRecords = []) {
  return generateAIReport('monthly', report, profile, exerciseRecords);
}

async function generateAIAllTimeReport(report, profile, exerciseRecords = []) {
  return generateAIReport('all-time', report, profile, exerciseRecords);
}

module.exports = {
  generateAIWeeklyReport,
  generateAIMonthlyReport,
  generateAIAllTimeReport,
  generateAIReport // 导出通用函数
};
