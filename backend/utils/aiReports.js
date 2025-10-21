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

// 生成 AI 周报分析
async function generateAIWeeklyReport(report, profile, exerciseRecords = []) {
  const { apiKey, baseUrl, model } = getApiConfig();
  
  // 筛选本周的运动记录
  const weekStart = new Date(report.period.split(' - ')[0]);
  const weekEnd = new Date(report.period.split(' - ')[1]);
  const weekExercises = exerciseRecords.filter(e => {
    const exerciseDate = new Date(e.date);
    return exerciseDate >= weekStart && exerciseDate <= weekEnd;
  });
  
  // 计算运动统计
  const exerciseDays = weekExercises.length;
  const totalDuration = weekExercises.reduce((sum, e) => sum + e.duration, 0);
  const avgDuration = exerciseDays > 0 ? Math.round(totalDuration / exerciseDays) : 0;
  
  // 构建提示词
  const prompt = `你是一位专业的健康管理顾问，请根据以下体重和运动数据生成一份详细的周报分析。

【基本信息】
- 用户姓名：${profile.name || '未设置'}
- 目标体重：${profile.targetWeight ? profile.targetWeight + 'kg' : '未设置'}
- 报告周期：${report.period}

【本周体重数据】
- 记录次数：${report.stats.recordCount}次
- 起始体重：${report.stats.startWeight}kg
- 结束体重：${report.stats.endWeight}kg
- 体重变化：${report.stats.change}kg
- 平均体重：${report.stats.average}kg
- 最高体重：${report.stats.max}kg
- 最低体重：${report.stats.min}kg

【本周运动数据】
- 运动天数：${exerciseDays}天
- 总运动时长：${totalDuration}分钟
- 平均每次时长：${avgDuration}分钟
${exerciseDays > 0 ? `\n【运动记录详情】\n${weekExercises.map(e => {
  const date = new Date(e.date);
  return `- ${date.getMonth() + 1}月${date.getDate()}日：${e.duration}分钟`;
}).join('\n')}` : '- 本周暂无运动记录'}

【体重记录详情】
${report.records.map(r => {
  const date = new Date(r.date);
  return `- ${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')} ${r.weight}kg (${r.fasting})`;
}).join('\n')}

请生成一份专业且有建设性的分析报告，包括：
1. 本周体重变化总结（50字以内）
2. 体重与运动关联分析（体重变化与运动量的关系）
3. 趋势分析（体重变化是否符合健康标准）
4. 目标进度（如果设置了目标体重）
5. 具体建议（3-5条，结合体重和运动数据，包括饮食、运动强度/频率、作息等方面）

要求：
- 分析要专业、客观、有数据支撑
- 建议要具体、可操作
- 语气友好、鼓励为主
- 使用中文
- **重要**：综合体重和运动数据进行分析，给出运动与体重变化的关联性洞察
- **重要**：基于现有数据进行分析，不要批评或提及数据缺失、时间范围不完整、记录频率不够等问题
- 专注于已有数据的趋势和建议，而不是数据本身的完整性
- **必须**以纯JSON格式返回，不要包含任何其他文字说明，只返回JSON对象
- JSON格式如下：
{
  "summary": "总结（一句话）",
  "insights": ["洞察1", "洞察2", "洞察3", ...],
  "suggestions": ["建议1", "建议2", "建议3", ...]
}`;

  try {
    const response = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model: model,
        messages: [
          {
            role: 'system',
            content: '你是一位专业的健康管理顾问，擅长综合分析体重和运动数据并提供科学的健康建议。你的回复必须是纯JSON格式，不包含任何其他说明文字。重要：综合体重和运动数据进行深度关联分析，评估运动效果，只基于现有数据进行正面分析，绝不批评数据的完整性、记录频率或时间范围等问题。'
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
    console.error('AI 周报生成失败:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('详细错误:', JSON.stringify(error.response.data, null, 2));
    }
    return {
      success: false,
      error: error.response?.data?.error?.message || '生成 AI 分析失败，请稍后重试'
    };
  }
}

// 生成 AI 月报分析
async function generateAIMonthlyReport(report, profile, exerciseRecords = []) {
  const { apiKey, baseUrl, model } = getApiConfig();
  
  // 筛选本月的运动记录
  const monthMatch = report.period.match(/(\d{4})年(\d{1,2})月/);
  const year = parseInt(monthMatch[1]);
  const month = parseInt(monthMatch[2]);
  const monthStart = new Date(year, month - 1, 1);
  const monthEnd = new Date(year, month, 0, 23, 59, 59, 999);
  
  const monthExercises = exerciseRecords.filter(e => {
    const exerciseDate = new Date(e.date);
    return exerciseDate >= monthStart && exerciseDate <= monthEnd;
  });
  
  // 计算运动统计
  const exerciseDays = monthExercises.length;
  const totalDuration = monthExercises.reduce((sum, e) => sum + e.duration, 0);
  const avgDuration = exerciseDays > 0 ? Math.round(totalDuration / exerciseDays) : 0;
  
  // 按周统计运动
  const weeklyExercise = [0, 0, 0, 0, 0]; // 最多5周
  monthExercises.forEach(e => {
    const exerciseDate = new Date(e.date);
    const weekOfMonth = Math.floor((exerciseDate.getDate() - 1) / 7);
    if (weekOfMonth < 5) {
      weeklyExercise[weekOfMonth]++;
    }
  });
  
  // 构建提示词
  const prompt = `你是一位专业的健康管理顾问，请根据以下体重和运动数据生成一份详细的月报分析。

【基本信息】
- 用户姓名：${profile.name || '未设置'}
- 目标体重：${profile.targetWeight ? profile.targetWeight + 'kg' : '未设置'}
- 报告周期：${report.period}

【本月体重数据】
- 记录次数：${report.stats.recordCount}次
- 起始体重：${report.stats.startWeight}kg
- 结束体重：${report.stats.endWeight}kg
- 体重变化：${report.stats.change}kg
- 平均体重：${report.stats.average}kg
- 最高体重：${report.stats.max}kg
- 最低体重：${report.stats.min}kg
- 每周平均体重：${report.stats.weeklyAverages.map((w, i) => `第${i+1}周: ${w > 0 ? w + 'kg' : '无数据'}`).join(', ')}

【本月运动数据】
- 运动天数：${exerciseDays}天
- 总运动时长：${totalDuration}分钟
- 平均每次时长：${avgDuration}分钟
- 每周运动天数：${weeklyExercise.map((days, i) => `第${i+1}周: ${days}天`).filter((_, i) => i < 4 || weeklyExercise[i] > 0).join(', ')}
${exerciseDays > 0 ? `\n【运动记录详情】（显示前10条和后10条）\n${monthExercises.slice(0, 10).map(e => {
  const date = new Date(e.date);
  return `- ${date.getMonth() + 1}月${date.getDate()}日：${e.duration}分钟`;
}).join('\n')}${monthExercises.length > 20 ? `\n... (中间省略 ${monthExercises.length - 20} 条记录) ...` : ''}${monthExercises.length > 10 ? '\n' + monthExercises.slice(-10).map(e => {
  const date = new Date(e.date);
  return `- ${date.getMonth() + 1}月${date.getDate()}日：${e.duration}分钟`;
}).join('\n') : ''}` : '- 本月暂无运动记录'}

【体重记录详情】（仅显示前10条和后10条）
${report.records.slice(0, 10).map(r => {
  const date = new Date(r.date);
  return `- ${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')} ${r.weight}kg (${r.fasting})`;
}).join('\n')}
${report.records.length > 20 ? `\n... (中间省略 ${report.records.length - 20} 条记录) ...\n` : ''}
${report.records.length > 10 ? report.records.slice(-10).map(r => {
  const date = new Date(r.date);
  return `- ${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')} ${r.weight}kg (${r.fasting})`;
}).join('\n') : ''}

请生成一份专业且有建设性的分析报告，包括：
1. 本月体重变化总结（80字以内）
2. 体重与运动关联分析（体重变化与运动量的关系，运动效果评估）
3. 趋势分析（分析每周体重变化趋势，是否稳定）
4. 目标进度（如果设置了目标体重，评估完成进度）
5. 亮点分析（本月做得好的地方，包括体重和运动方面）
6. 具体建议（5-8条，结合体重和运动数据，包括饮食、运动强度/频率/类型、作息、心理等方面）

要求：
- 分析要专业、客观、有数据支撑
- 建议要具体、可操作
- 语气友好、鼓励为主
- 使用中文
- **重要**：综合体重和运动数据进行深度分析，给出运动效果评估和优化建议
- **重要**：基于现有数据进行分析，不要批评或提及数据缺失、时间范围不完整、记录频率不够、首尾周无数据等问题
- 专注于已有数据的趋势和建议，而不是数据本身的完整性
- **必须**以纯JSON格式返回，不要包含任何其他文字说明，只返回JSON对象
- JSON格式如下：
{
  "summary": "总结（一到两句话）",
  "insights": ["洞察1", "洞察2", "洞察3", ...],
  "suggestions": ["建议1", "建议2", "建议3", ...]
}`;

  try {
    const response = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model: model,
        messages: [
          {
            role: 'system',
            content: '你是一位专业的健康管理顾问，擅长综合分析体重和运动数据并提供科学的健康建议。你的回复必须是纯JSON格式，不包含任何其他说明文字。重要：综合体重和运动数据进行深度关联分析，评估运动效果，只基于现有数据进行正面分析，绝不批评数据的完整性、记录频率或时间范围等问题。'
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
    console.error('AI 月报生成失败:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('详细错误:', JSON.stringify(error.response.data, null, 2));
    }
    return {
      success: false,
      error: error.response?.data?.error?.message || '生成 AI 分析失败，请稍后重试'
    };
  }
}

// 生成全时段报告的 AI 分析
async function generateAIAllTimeReport(report, profile, exerciseRecords = []) {
  try {
    const { apiKey, baseUrl, model } = getApiConfig();

    // 筛选全时段的运动记录
    const sortedRecords = report.records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const startDate = new Date(sortedRecords[0].date);
    const endDate = new Date(sortedRecords[sortedRecords.length - 1].date);
    
    const periodExerciseRecords = exerciseRecords.filter(record => {
      const recordDate = new Date(record.date);
      return recordDate >= startDate && recordDate <= endDate;
    });

    // 统计运动数据
    let exerciseDataText = '';
    if (periodExerciseRecords.length > 0) {
      const totalExerciseDays = new Set(periodExerciseRecords.map(r => r.date.split('T')[0])).size;
      const totalExercises = periodExerciseRecords.length;
      
      const exerciseTypeCount = {};
      periodExerciseRecords.forEach(record => {
        exerciseTypeCount[record.type] = (exerciseTypeCount[record.type] || 0) + 1;
      });
      
      exerciseDataText = `
【运动记录】
- 总运动天数: ${totalExerciseDays} 天
- 总运动次数: ${totalExercises} 次
- 运动类型分布: ${Object.entries(exerciseTypeCount).map(([type, count]) => `${type} ${count}次`).join(', ')}
`;
    } else {
      exerciseDataText = '\n【运动记录】\n- 该时间段内暂无运动记录\n';
    }

    const daysDiff = Math.floor((endDate - startDate) / (1000 * 60 * 60 * 24)) + 1;

    const prompt = `你是一位专业的健康管理顾问，请根据以下全时段体重和运动数据生成一份详细的综合分析报告。

【基本信息】
- 记录时间段: ${report.period}
- 总天数: ${daysDiff} 天
- 记录次数: ${report.stats.recordCount} 次
- 起始体重: ${report.stats.startWeight}kg
- 当前体重: ${report.stats.endWeight}kg
- 总体变化: ${report.stats.change > 0 ? '+' : ''}${report.stats.change}kg
- 平均体重: ${report.stats.average}kg
- 最低体重: ${report.stats.min}kg
- 最高体重: ${report.stats.max}kg
- 身高: ${profile.height}cm
${profile.targetWeight ? `- 目标体重: ${profile.targetWeight}kg` : ''}

${exerciseDataText}

【体重记录详情（仅显示前10条和后10条）】
前10条:
${report.records.slice(0, 10).map(r => {
  const date = new Date(r.date);
  return `- ${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')} ${r.weight}kg (${r.fasting})`;
}).join('\n')}

后10条:
${report.records.slice(-10).map(r => {
  const date = new Date(r.date);
  return `- ${date.getMonth() + 1}月${date.getDate()}日 ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')} ${r.weight}kg (${r.fasting})`;
}).join('\n')}

请生成一份专业且有建设性的全时段综合分析报告，包括：
1. 总体评价（50字以内）
2. 体重与运动关联分析（长期体重变化与运动的关系）
3. 趋势分析（整体变化趋势是否健康、有什么阶段性特点）
4. 目标完成度评价（如果设置了目标体重）
5. 具体建议（3-5条，结合体重和运动数据，包括饮食、运动强度/频率、作息等方面）

要求：
- 分析要专业、客观、有数据支撑
- 建议要具体、可操作
- 语气友好、鼓励为主
- 使用中文
- **重要**：综合体重和运动数据进行长期趋势分析
- **重要**：基于现有数据进行分析，不要批评或提及数据缺失、时间范围不完整、记录频率不够等问题
- 专注于已有数据的趋势和建议，而不是数据本身的完整性
- **必须**以纯JSON格式返回，不要包含任何其他文字说明，只返回JSON对象
- JSON格式如下：
{
  "summary": "总结（一句话）",
  "insights": ["洞察1", "洞察2", "洞察3", ...],
  "suggestions": ["建议1", "建议2", "建议3", ...]
}`;

    const systemMessage = `你是一位专业的健康管理顾问，擅长分析长期体重和运动数据。你需要基于用户的全时段数据，提供专业、客观、有建设性的分析。请务必返回纯JSON格式，不要包含任何markdown标记或额外说明。`;

    const response = await axios.post(
      `${baseUrl}/chat/completions`,
      {
        model: model,
        messages: [
          {
            role: 'system',
            content: systemMessage
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
    console.error('AI 全时段报告生成失败:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('详细错误:', JSON.stringify(error.response.data, null, 2));
    }
    return {
      success: false,
      error: error.response?.data?.error?.message || '生成 AI 分析失败，请稍后重试'
    };
  }
}

module.exports = {
  generateAIWeeklyReport,
  generateAIMonthlyReport,
  generateAIAllTimeReport
};

