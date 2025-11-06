const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');

// 初始化 OpenAI 客户端
const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || 'sk-d2b0c8e5d70c4cbfb8d0c8e5d70c4cbf',
  baseURL: process.env.OPENAI_BASE_URL || 'https://dashscope.aliyuncs.com/compatible-mode/v1'
});

/**
 * 根据文字描述估算热量
 */
async function estimateCaloriesFromText(description, mealType = 'other') {
  try {
    const mealTypeNames = {
      breakfast: '早餐',
      lunch: '午餐',
      dinner: '晚餐',
      snack: '零食',
      other: '其他'
    };
    
    const prompt = `你是一位专业的营养师。请根据以下饮食描述，估算总热量和提供营养分析。

餐次：${mealTypeNames[mealType] || '未指定'}
食物描述：${description}

请按照以下JSON格式返回（只返回JSON，不要其他文字）：
{
  "calories": 500,  // 估算的总热量（千卡）
  "confidence": "high",  // 估算置信度：high/medium/low
  "breakdown": [  // 食物分解（如果能识别出多种食物）
    {
      "food": "米饭",
      "amount": "150克",
      "calories": 180
    }
  ],
  "nutrients": {  // 营养素估算（可选）
    "protein": 20,  // 蛋白质（克）
    "carbs": 60,    // 碳水化合物（克）
    "fat": 10       // 脂肪（克）
  },
  "analysis": "这是一份包含米饭、青菜和鸡胸肉的健康餐食，热量适中，营养均衡。"
}`;

    const response = await client.chat.completions.create({
      model: 'qwen-plus',
      messages: [
        {
          role: 'system',
          content: '你是一位专业的营养师，擅长根据食物描述估算热量和营养成分。你的回答应该准确、专业，并且只返回JSON格式的数据。'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7
    });

    const content = response.choices[0].message.content.trim();
    
    // 尝试解析JSON（移除可能的markdown代码块标记）
    let jsonStr = content;
    if (content.startsWith('```')) {
      jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }
    
    const result = JSON.parse(jsonStr);
    
    return {
      success: true,
      calories: result.calories,
      analysis: result.analysis || '',
      details: {
        confidence: result.confidence,
        breakdown: result.breakdown || [],
        nutrients: result.nutrients || null
      }
    };
  } catch (error) {
    console.error('[热量估算] 文字分析失败:', error.message);
    return {
      success: false,
      error: error.message,
      calories: 0,
      analysis: '无法估算热量，请稍后重试。'
    };
  }
}

/**
 * 根据图片估算热量
 */
async function estimateCaloriesFromImage(imagePath, description = '', mealType = 'other') {
  try {
    // 读取图片并转换为base64
    const imageBuffer = fs.readFileSync(imagePath);
    const base64Image = imageBuffer.toString('base64');
    const ext = path.extname(imagePath).toLowerCase();
    
    // 判断图片类型
    let mimeType = 'image/jpeg';
    if (ext === '.png') mimeType = 'image/png';
    else if (ext === '.jpg' || ext === '.jpeg') mimeType = 'image/jpeg';
    else if (ext === '.webp') mimeType = 'image/webp';
    
    const mealTypeNames = {
      breakfast: '早餐',
      lunch: '午餐',
      dinner: '晚餐',
      snack: '零食',
      other: '其他'
    };
    
    const prompt = `你是一位专业的营养师。请根据图片中的食物，估算总热量和提供营养分析。

${description ? `用户描述：${description}\n` : ''}餐次：${mealTypeNames[mealType] || '未指定'}

请仔细观察图片中的食物种类、数量和份量，然后按照以下JSON格式返回（只返回JSON，不要其他文字）：
{
  "calories": 500,  // 估算的总热量（千卡）
  "confidence": "high",  // 估算置信度：high/medium/low
  "breakdown": [  // 识别出的食物及热量分解
    {
      "food": "米饭",
      "amount": "约150克",
      "calories": 180
    }
  ],
  "nutrients": {  // 营养素估算
    "protein": 20,  // 蛋白质（克）
    "carbs": 60,    // 碳水化合物（克）
    "fat": 10       // 脂肪（克）
  },
  "analysis": "图片中是一份包含米饭、青菜和鸡胸肉的餐食，份量适中，营养均衡。"
}`;

    const response = await client.chat.completions.create({
      model: 'qwen-vl-max',  // 使用支持视觉的模型
      messages: [
        {
          role: 'system',
          content: '你是一位专业的营养师，擅长根据食物图片估算热量和营养成分。你的回答应该准确、专业，并且只返回JSON格式的数据。'
        },
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: {
                url: `data:${mimeType};base64,${base64Image}`
              }
            },
            {
              type: 'text',
              text: prompt
            }
          ]
        }
      ],
      temperature: 0.7
    });

    const content = response.choices[0].message.content.trim();
    
    // 尝试解析JSON（移除可能的markdown代码块标记）
    let jsonStr = content;
    if (content.startsWith('```')) {
      jsonStr = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    }
    
    const result = JSON.parse(jsonStr);
    
    return {
      success: true,
      calories: result.calories,
      analysis: result.analysis || '',
      details: {
        confidence: result.confidence,
        breakdown: result.breakdown || [],
        nutrients: result.nutrients || null
      }
    };
  } catch (error) {
    console.error('[热量估算] 图片分析失败:', error.message);
    return {
      success: false,
      error: error.message,
      calories: 0,
      analysis: '无法识别图片中的食物，请稍后重试。'
    };
  }
}

/**
 * 综合分析饮食记录（文字+图片）
 */
async function analyzeMeal(description, imagePaths = [], mealType = 'other') {
  try {
    // 如果有图片，优先使用图片分析
    if (imagePaths && imagePaths.length > 0) {
      // 目前只分析第一张图片
      const imagePath = imagePaths[0];
      return await estimateCaloriesFromImage(imagePath, description, mealType);
    }
    
    // 否则使用文字描述分析
    if (description) {
      return await estimateCaloriesFromText(description, mealType);
    }
    
    return {
      success: false,
      error: '请提供食物描述或图片',
      calories: 0,
      analysis: '无法估算热量。'
    };
  } catch (error) {
    console.error('[热量估算] 综合分析失败:', error.message);
    return {
      success: false,
      error: error.message,
      calories: 0,
      analysis: '分析失败，请稍后重试。'
    };
  }
}

module.exports = {
  estimateCaloriesFromText,
  estimateCaloriesFromImage,
  analyzeMeal
};

