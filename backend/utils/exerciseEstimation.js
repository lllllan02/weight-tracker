const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: 'https://dashscope.aliyuncs.com/compatible-mode/v1'
});

/**
 * 使用AI分析运动记录，估算消耗热量
 * @param {string} description - 运动描述
 * @param {number} duration - 用户输入的运动时长（分钟）
 * @param {Array<string>} imagePaths - 运动图片路径数组
 * @returns {Promise<Object>} 分析结果
 */
async function analyzeExercise(description, duration = null, imagePaths = []) {
  try {
    const messages = [];
    
    // 构建系统消息
    const systemMessage = {
      role: 'system',
      content: duration 
        ? `你是一个专业的运动健身教练和营养师。你的任务是：
1. 根据用户提供的运动时长（${duration}分钟）、运动描述和/或图片，分析运动类型和强度
2. 估算消耗的热量（千卡）
3. 评估运动的有效性

请以JSON格式返回结果，包含：
- calories: 估算的热量消耗（千卡）
- analysis: 简短的分析说明（不超过50字）
- confidence: 置信度（high/medium/low）
- breakdown: 运动分解数组 [{activity: "活动名称", duration: 时长, calories: 热量}]

注意：
- 用户已经提供了运动时长：${duration}分钟
- 根据运动类型、强度和时长来估算热量消耗
- 给出的估算要合理且基于常见运动数据
- 考虑体重70kg的成年人的平均热量消耗`
        : `你是一个专业的运动健身教练和营养师。你的任务是：
1. 根据用户的运动描述和/或图片，分析运动类型、强度和时长
2. 估算消耗的热量（千卡）
3. 评估运动的有效性

请以JSON格式返回结果，包含：
- duration: 估算的运动时长（分钟）
- calories: 估算的热量消耗（千卡）
- analysis: 简短的分析说明（不超过50字）
- confidence: 置信度（high/medium/low）
- breakdown: 运动分解数组 [{activity: "活动名称", duration: 时长, calories: 热量}]

注意：
- 如果只有文字描述，需要推断运动时长和强度
- 如果有图片，结合图片内容进行判断
- 热量消耗要考虑运动类型、强度和时长
- 给出的估算要合理且基于常见运动数据`
    };
    
    // 构建用户消息
    let userContent = [];
    
    if (description && description.trim()) {
      userContent.push({
        type: 'text',
        text: duration 
          ? `运动时长：${duration}分钟\n运动描述：${description}`
          : `运动描述：${description}`
      });
    } else if (duration) {
      userContent.push({
        type: 'text',
        text: `运动时长：${duration}分钟`
      });
    }
    
    // 处理图片（如果有）
    if (imagePaths && imagePaths.length > 0) {
      for (const imagePath of imagePaths) {
        if (fs.existsSync(imagePath)) {
          const imageBuffer = fs.readFileSync(imagePath);
          const base64Image = imageBuffer.toString('base64');
          const ext = path.extname(imagePath).toLowerCase();
          const mimeType = ext === '.png' ? 'image/png' : 
                          ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
                          ext === '.webp' ? 'image/webp' : 'image/jpeg';
          
          userContent.push({
            type: 'image_url',
            image_url: {
              url: `data:${mimeType};base64,${base64Image}`
            }
          });
        }
      }
    }
    
    if (userContent.length === 0) {
      return {
        success: false,
        error: '请提供运动描述或图片'
      };
    }
    
    messages.push(systemMessage);
    messages.push({
      role: 'user',
      content: userContent
    });
    
    // 调用AI
    const response = await client.chat.completions.create({
      model: imagePaths.length > 0 ? 'qwen-vl-max' : 'qwen-plus',
      messages: messages,
      temperature: 0.7,
      max_tokens: 1000
    });
    
    const content = response.choices[0]?.message?.content;
    if (!content) {
      return {
        success: false,
        error: 'AI未返回有效响应'
      };
    }
    
    // 解析AI返回的JSON
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('无法解析AI响应为JSON');
      }
      
      const result = JSON.parse(jsonMatch[0]);
      
      return {
        success: true,
        duration: duration || result.duration || 30,
        calories: result.calories || 200,
        analysis: result.analysis || 'AI分析完成',
        details: {
          confidence: result.confidence || 'medium',
          breakdown: result.breakdown || []
        }
      };
    } catch (parseError) {
      console.error('[运动分析] JSON解析失败:', parseError.message);
      console.log('[运动分析] AI原始响应:', content);
      
      // 返回默认值
      return {
        success: true,
        duration: duration || 30,
        calories: 200,
        analysis: content.substring(0, 100),
        details: {
          confidence: 'low',
          breakdown: []
        }
      };
    }
    
  } catch (error) {
    console.error('[运动分析] 失败:', error);
    return {
      success: false,
      error: error.message || '运动分析失败'
    };
  }
}

module.exports = { analyzeExercise };

