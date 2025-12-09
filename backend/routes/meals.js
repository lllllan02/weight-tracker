const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const {
  addMeal,
  getMealsByDateRange,
  getMealsByDate,
  updateMeal,
  updateMealAnalysis,
  deleteMeal,
  getDailyCalories
} = require('../utils/mealManager');
const { analyzeMeal } = require('../utils/calorieEstimation');

// 确保上传目录存在
const uploadDir = path.join(__dirname, '../uploads/meals');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 配置 multer 用于文件上传
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // 使用时间戳 + 随机数 + 原始扩展名
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'meal-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 限制 5MB
  },
  fileFilter: function (req, file, cb) {
    // 只允许上传图片
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只支持 JPEG、PNG 和 WebP 格式的图片'));
    }
  }
});

/**
 * POST /api/meals
 * 创建饮食记录
 */
router.post('/', (req, res, next) => {
  upload.array('images', 5)(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      console.error('[饮食记录] Multer 错误:', err.message);
      return res.status(400).json({
        success: false,
        error: `上传失败: ${err.message}`
      });
    } else if (err) {
      console.error('[饮食记录] 上传错误:', err.message);
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }
    next();
  });
}, async (req, res) => {
  try {
    const { description, mealType, date, manualCalories, skipAI, aiPredicted } = req.body;
    
    // 获取上传的图片路径
    const imagePaths = req.files ? req.files.map(file => file.path) : [];
    const imageUrls = req.files ? req.files.map(file => `/uploads/meals/${file.filename}`) : [];
    
    // 创建饮食记录
    const mealData = {
      description,
      mealType,
      images: imageUrls,
      date: date || new Date().toISOString()
    };
    
    // 如果用户手动输入了热量
    if (manualCalories && !isNaN(Number(manualCalories))) {
      mealData.estimatedCalories = Number(manualCalories);
      // 如果是AI预测且未修改，标记为AI预测
      if (aiPredicted === 'true') {
        mealData.isAiPredicted = true;
      }
      // 如果是skipAI，说明是纯手动输入，不标记为AI预测
    }
    
    const meal = addMeal(mealData);
    
    // 如果用户手动输入了热量（无论是AI预测还是手动），则不进行AI分析
    if (skipAI === 'true' || aiPredicted === 'true' || (manualCalories && !isNaN(Number(manualCalories)))) {
      return res.json({
        success: true,
        meal,
        message: '饮食记录已创建'
      });
    }
    
    // 异步进行AI分析
    analyzeMeal(description, imagePaths, mealType)
      .then(analysis => {
        if (analysis.success) {
          updateMealAnalysis(meal.id, {
            calories: analysis.calories,
            analysis: analysis.analysis,
            details: analysis.details
          });
        }
      })
      .catch(err => {
        console.error('[饮食记录] AI分析失败:', err.message);
      });
    
    res.json({
      success: true,
      meal,
      message: '饮食记录已创建，AI正在分析中...'
    });
  } catch (error) {
    console.error('[饮食记录] 创建失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/meals
 * 获取饮食记录列表
 * 参数: date (可选) - 指定日期，格式: YYYY-MM-DD
 *      startDate, endDate (可选) - 日期范围
 */
router.get('/', (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    
    let meals;
    if (date) {
      // 获取指定日期的记录
      meals = getMealsByDate(date);
    } else if (startDate && endDate) {
      // 获取日期范围的记录
      meals = getMealsByDateRange(startDate, endDate);
    } else {
      // 默认获取今天的记录
      meals = getMealsByDate(new Date());
    }
    
    res.json({
      success: true,
      meals
    });
  } catch (error) {
    console.error('[饮食记录] 获取失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * GET /api/meals/daily-calories
 * 获取指定日期的总热量
 */
router.get('/daily-calories', (req, res) => {
  try {
    const { date } = req.query;
    const targetDate = date || new Date().toISOString();
    
    const result = getDailyCalories(targetDate);
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('[饮食记录] 获取每日热量失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/meals/:id
 * 更新饮食记录
 */
router.put('/:id', upload.array('images', 5), async (req, res) => {
  try {
    const { id } = req.params;
    const { description, mealType, keepExistingImages, manualCalories, skipAI, aiPredicted } = req.body;
    
    // 获取当前记录
    const { readData, getAllMealRecords } = require('../utils/dataManager');
    const data = readData();
    const allMeals = getAllMealRecords(data);
    const meal = allMeals.find(m => m.id === id);
    
    if (!meal) {
      return res.status(404).json({
        success: false,
        error: '记录不存在'
      });
    }
    
    // 准备更新数据
    const updates = {};
    
    if (description !== undefined) {
      updates.description = description;
    }
    
    if (mealType !== undefined) {
      updates.mealType = mealType;
    }
    
    // 处理图片更新
    let newImageUrls = [];
    
    // 如果保留现有图片
    if (keepExistingImages === 'true') {
      newImageUrls = [...meal.images];
    }
    
    // 添加新上传的图片
    if (req.files && req.files.length > 0) {
      const uploadedUrls = req.files.map(file => `/uploads/meals/${file.filename}`);
      newImageUrls = [...newImageUrls, ...uploadedUrls];
    }
    
    updates.images = newImageUrls;
    
    // 如果用户手动输入了热量
    if (manualCalories && !isNaN(Number(manualCalories))) {
      updates.estimatedCalories = Number(manualCalories);
      // 如果是AI预测且未修改，标记为AI预测
      if (aiPredicted === 'true') {
        updates.isAiPredicted = true;
      } else {
        // 清除AI预测标记，因为是用户手动输入或修改
        updates.isAiPredicted = false;
        updates.aiAnalysisText = null;
      }
    }
    
    // 更新记录
    const updatedMeal = updateMeal(id, updates);
    
    if (!updatedMeal) {
      return res.status(404).json({
        success: false,
        error: '更新失败'
      });
    }
    
    // 如果用户手动输入了热量，则不重新分析
    const shouldSkipAI = skipAI === 'true' || aiPredicted === 'true' || (manualCalories && !isNaN(Number(manualCalories)));
    
    // 如果描述或图片有变化，且没有手动输入热量，重新进行AI分析
    if (!shouldSkipAI && (description !== undefined || (req.files && req.files.length > 0))) {
      const imagePaths = newImageUrls.map(url => {
        const filename = path.basename(url);
        return path.join(uploadDir, filename);
      }).filter(p => fs.existsSync(p));
      
      analyzeMeal(updates.description || meal.description, imagePaths, updatedMeal.mealType)
        .then(analysis => {
          if (analysis.success) {
            updateMealAnalysis(id, {
              calories: analysis.calories,
              analysis: analysis.analysis,
              details: analysis.details
            });
          }
        })
        .catch(err => {
          console.error('[饮食记录] AI分析失败:', err.message);
        });
    }
    
    res.json({
      success: true,
      meal: updatedMeal,
      message: '饮食记录已更新'
    });
  } catch (error) {
    console.error('[饮食记录] 更新失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/meals/:id
 * 删除饮食记录
 */
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    const success = deleteMeal(id);
    
    if (success) {
      res.json({
        success: true,
        message: '饮食记录已删除'
      });
    } else {
      res.status(404).json({
        success: false,
        error: '记录不存在'
      });
    }
  } catch (error) {
    console.error('[饮食记录] 删除失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/meals/predict
 * 预测热量（不保存记录）
 */
router.post('/predict', upload.array('images', 5), async (req, res) => {
  try {
    const { description, mealType } = req.body;
    
    // 获取上传的图片路径
    const imagePaths = req.files ? req.files.map(file => file.path) : [];
    
    if (!description && imagePaths.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请提供食物描述或图片'
      });
    }
    
    // 进行AI分析
    const analysis = await analyzeMeal(description || '', imagePaths, mealType || 'other');
    
    // 删除临时上传的图片
    imagePaths.forEach(imagePath => {
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    });
    
    if (analysis.success) {
      res.json({
        success: true,
        calories: analysis.calories,
        analysis: analysis.analysis,
        details: analysis.details
      });
    } else {
      res.status(500).json({
        success: false,
        error: analysis.error || 'AI分析失败'
      });
    }
  } catch (error) {
    console.error('[饮食预测] 失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/meals/:id/analyze
 * 重新分析饮食记录
 */
router.post('/:id/analyze', async (req, res) => {
  try {
    const { id } = req.params;
    const { readData, getAllMealRecords } = require('../utils/dataManager');
    
    const data = readData();
    const allMeals = getAllMealRecords(data);
    const meal = allMeals.find(m => m.id === id);
    
    if (!meal) {
      return res.status(404).json({
        success: false,
        error: '记录不存在'
      });
    }
    
    // 获取图片的绝对路径
    const imagePaths = meal.images.map(url => {
      const filename = path.basename(url);
      return path.join(uploadDir, filename);
    }).filter(p => fs.existsSync(p));
    
    const analysis = await analyzeMeal(meal.description, imagePaths, meal.mealType);
    
    if (analysis.success) {
      const updatedMeal = updateMealAnalysis(id, {
        calories: analysis.calories,
        analysis: analysis.analysis,
        details: analysis.details
      });
      
      res.json({
        success: true,
        meal: updatedMeal
      });
    } else {
      res.status(500).json({
        success: false,
        error: analysis.error
      });
    }
  } catch (error) {
    console.error('[饮食记录] 重新分析失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;

