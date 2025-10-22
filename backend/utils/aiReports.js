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

// 格式化体重记录（前后各10条）
function formatLimitedWeightRecords(records) {
  const first10 = records.slice(0, 10).map(r => 
    `- ${formatDateTime(r.date)} ${r.weight}kg (${r.fasting})`
  ).join('\n');
  
  if (records.length <= 10) {
    return first10;
  }
  
  const last10 = records.slice(-10).map(r => 
    `- ${formatDateTime(r.date)} ${r.weight}kg (${r.fasting})`
  ).join('\n');
  
  const omitted = records.length > 20 ? `\n... (中间省略 ${records.length - 20} 条记录) ...\n` : '\n';
  
  return first10 + omitted + last10;
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
- 最低体重：${report.stats.min}kg`;

  // 月报添加每周平均
  if (reportType === 'monthly' && report.stats.weeklyAverages) {
    weightData += `\n- 每周平均体重：${report.stats.weeklyAverages.map((w, i) => `第${i+1}周: ${w > 0 ? w + 'kg' : '无数据'}`).join(', ')}`;
  }
  
  // 构建体重记录详情
  let weightRecords = '';
  if (reportType === 'weekly') {
    weightRecords = `【体重记录详情】
${formatAllWeightRecords(report.records)}`;
  } else if (reportType === 'all-time') {
    weightRecords = `【体重记录详情（仅显示前10条和后10条）】
前10条:
${report.records.slice(0, 10).map(r => `- ${formatDateTime(r.date)} ${r.weight}kg (${r.fasting})`).join('\n')}

后10条:
${report.records.slice(-10).map(r => `- ${formatDateTime(r.date)} ${r.weight}kg (${r.fasting})`).join('\n')}`;
  } else {
    weightRecords = `【体重记录详情】（仅显示前10条和后10条）
${formatLimitedWeightRecords(report.records)}`;
  }
  
  // 构建分析要求
  const analysisPoints = reportType === 'monthly'
    ? `1. ${config.period}体重变化总结（${config.summaryLength}）
2. 体重与运动关联分析（体重变化与运动量的关系，运动效果评估）
3. 趋势分析（分析每周体重变化趋势，是否稳定）
4. 目标进度（如果设置了目标体重，评估完成进度）
5. 亮点分析（${config.period}做得好的地方，包括体重和运动方面）
6. 具体建议（${config.suggestions}，结合体重和运动数据，包括饮食、运动强度/频率/类型、作息、心理等方面）`
    : reportType === 'all-time'
    ? `1. 总体评价（${config.summaryLength}）
2. 体重与运动关联分析（长期体重变化与运动的关系）
3. 趋势分析（整体变化趋势是否健康、有什么阶段性特点）
4. 目标完成度评价（如果设置了目标体重）
5. 具体建议（${config.suggestions}，结合体重和运动数据，包括饮食、运动强度/频率、作息等方面）`
    : `1. ${config.period}体重变化总结（${config.summaryLength}）
2. 体重与运动关联分析（体重变化与运动量的关系）
3. 趋势分析（体重变化是否符合健康标准）
4. 目标进度（如果设置了目标体重）
5. 具体建议（${config.suggestions}，结合体重和运动数据，包括饮食、运动强度/频率、作息等方面）`;
  
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
const COMMON_SYSTEM_MESSAGE = '你是一位专业的健康管理顾问，擅长综合分析体重和运动数据并提供科学的健康建议。你的回复必须是纯JSON格式，不包含任何其他说明文字。重要：综合体重和运动数据进行深度关联分析，评估运动效果，只基于现有数据进行正面分析，绝不批评数据的完整性、记录频率或时间范围等问题。';

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
