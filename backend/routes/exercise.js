const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const dayjs = require('dayjs');
const { 
  readData, 
  writeData, 
  getAllExerciseRecords,
  ensureDailyRecord,
  formatDateKey
} = require('../utils/dataManager');
const { generateId } = require('../utils/helpers');
const { analyzeExercise } = require('../utils/exerciseEstimation');

// 配置图片上传
const uploadDir = path.join(__dirname, '../uploads/exercises');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB
  },
  fileFilter: function (req, file, cb) {
    const allowedTypes = /jpeg|jpg|png|webp/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('只支持 JPG, PNG, WebP 格式的图片'));
    }
  }
});

/**
 * GET /api/exercise
 * 获取所有运动记录（兼容旧API）
 */
router.get('/', async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    const data = readData();
    let exerciseRecords = getAllExerciseRecords(data);
    
    // 按日期过滤
    if (date) {
      const targetDate = new Date(date).toISOString().split('T')[0];
      exerciseRecords = exerciseRecords.filter(record => {
        const recordDate = new Date(record.date).toISOString().split('T')[0];
        return recordDate === targetDate;
      });
    } else if (startDate && endDate) {
      const start = new Date(startDate).getTime();
      const end = new Date(endDate).getTime();
      exerciseRecords = exerciseRecords.filter(record => {
        const recordTime = new Date(record.date).getTime();
        return recordTime >= start && recordTime <= end;
      });
    }
    
    res.json({
      success: true,
      exercises: exerciseRecords
    });
  } catch (error) {
    console.error('[运动记录] 获取失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/exercise/predict
 * 预测运动时长和热量（不保存记录）
 */
router.post('/predict', upload.array('images', 5), async (req, res) => {
  try {
    const { description, duration } = req.body;
    
    // 获取上传的图片路径
    const imagePaths = req.files ? req.files.map(file => file.path) : [];
    
    if (!description && imagePaths.length === 0) {
      return res.status(400).json({
        success: false,
        error: '请提供运动描述或图片'
      });
    }
    
    // 进行AI分析，传递用户输入的运动时长
    const durationNumber = duration ? Number(duration) : null;
    const analysis = await analyzeExercise(description || '', durationNumber, imagePaths);
    
    // 删除临时上传的图片
    imagePaths.forEach(imagePath => {
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    });
    
    if (analysis.success) {
      res.json({
        success: true,
        duration: analysis.duration,
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
    console.error('[运动预测] 失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/exercise
 * 创建运动记录
 */
router.post('/', upload.array('images', 5), async (req, res) => {
  try {
    const { date, duration, description, manualDuration, manualCalories, skipAI, aiPredicted } = req.body;
    
    if (!date) {
      return res.status(400).json({
        success: false,
        error: '日期是必需的'
      });
    }
    
    // 获取上传的图片路径
    const imagePaths = req.files ? req.files.map(file => file.path) : [];
    const imageUrls = req.files ? req.files.map(file => `/uploads/exercises/${file.filename}`) : [];

    const data = readData();
    
    // 获取日期key
    const dateKey = formatDateKey(date);
    
    // 确保日期记录存在
    ensureDailyRecord(data.dailyRecords, dateKey);
    
    // 创建运动记录
    const exerciseData = {
      id: generateId(),
      duration: manualDuration ? Number(manualDuration) : (duration ? Number(duration) : 0),
      description: description || '',
      images: imageUrls,
      estimatedCalories: null,
      isAiPredicted: false,
      aiAnalysisText: null,
      timestamp: date || new Date().toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: null
    };
    
    // 如果用户手动输入了时长
    if (manualDuration && !isNaN(Number(manualDuration))) {
      exerciseData.duration = Number(manualDuration);
      // 如果是AI预测且未修改，标记为AI预测
      if (aiPredicted === 'true') {
        exerciseData.isAiPredicted = true;
      }
    }
    
    // 如果用户手动输入了热量
    if (manualCalories && !isNaN(Number(manualCalories))) {
      exerciseData.estimatedCalories = Number(manualCalories);
    }
    
    // 添加到对应日期
    data.dailyRecords[dateKey].exercises.push(exerciseData);
    
    // 按时间排序
    data.dailyRecords[dateKey].exercises.sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    
    writeData(data);
    
    // 如果用户手动输入了时长或要求跳过AI，则不进行AI分析
    if (skipAI === 'true' || aiPredicted === 'true' || (manualDuration && !isNaN(Number(manualDuration)))) {
      return res.json({
        success: true,
        exercise: { ...exerciseData, date: exerciseData.timestamp },
        message: '运动记录已创建'
      });
    }
    
    // 异步进行AI分析
    analyzeExercise(description || '', imagePaths)
      .then(analysis => {
        if (analysis.success) {
          // 更新记录
          const data = readData();
          const dateKey = formatDateKey(date);
          if (data.dailyRecords[dateKey]) {
            const recordIndex = data.dailyRecords[dateKey].exercises.findIndex(r => r.id === exerciseData.id);
            if (recordIndex >= 0) {
              data.dailyRecords[dateKey].exercises[recordIndex] = {
                ...data.dailyRecords[dateKey].exercises[recordIndex],
                duration: analysis.duration,
                estimatedCalories: analysis.calories,
                isAiPredicted: true,
                aiAnalysisText: analysis.analysis,
                details: analysis.details,
                updatedAt: new Date().toISOString()
              };
              writeData(data);
            }
          }
        }
      })
      .catch(err => {
        console.error('[运动记录] AI分析失败:', err.message);
      });
    
    res.json({
      success: true,
      exercise: { ...exerciseData, date: exerciseData.timestamp },
      message: '运动记录已创建，AI正在分析中...'
    });
  } catch (error) {
    console.error('[运动记录] 创建失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * PUT /api/exercise/:id
 * 更新运动记录
 */
router.put('/:id', upload.array('images', 5), async (req, res) => {
  try {
    const { id } = req.params;
    const { date, duration, description, keepExistingImages, manualDuration, manualCalories, skipAI, aiPredicted } = req.body;
    
    const data = readData();
    
    // 在所有日期中查找该记录
    let existingRecord = null;
    let existingDateKey = null;
    
    for (const dateKey in data.dailyRecords) {
      const dayRecord = data.dailyRecords[dateKey];
      const exerciseIndex = dayRecord.exercises.findIndex(ex => ex.id === id);
      if (exerciseIndex !== -1) {
        existingRecord = dayRecord.exercises[exerciseIndex];
        existingDateKey = dateKey;
        break;
      }
    }
    
    if (!existingRecord) {
      return res.status(404).json({
        success: false,
        error: '运动记录不存在'
      });
    }
    
    // 处理图片
    let newImageUrls = [];
    if (keepExistingImages === 'true' && existingRecord.images) {
      newImageUrls = [...existingRecord.images];
    }
    
    if (req.files && req.files.length > 0) {
      const uploadedUrls = req.files.map(file => `/uploads/exercises/${file.filename}`);
      newImageUrls = [...newImageUrls, ...uploadedUrls];
    }
    
    // 更新记录
    const updates = {
      timestamp: date || existingRecord.timestamp,
      description: description !== undefined ? description : existingRecord.description,
      images: newImageUrls
    };
    
    // 如果用户手动输入了时长
    if (manualDuration && !isNaN(Number(manualDuration))) {
      updates.duration = Number(manualDuration);
      // 如果是AI预测且未修改，标记为AI预测
      if (aiPredicted === 'true') {
        updates.isAiPredicted = true;
      } else {
        // 清除AI预测标记，因为是用户手动输入或修改
        updates.isAiPredicted = false;
        updates.aiAnalysisText = null;
      }
    }
    
    // 如果用户手动输入了热量
    if (manualCalories && !isNaN(Number(manualCalories))) {
      updates.estimatedCalories = Number(manualCalories);
    }
    
    const updatedRecord = {
      ...existingRecord,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    // 如果日期改变了，需要移动到新日期
    const newDateKey = formatDateKey(updates.timestamp);
    if (newDateKey !== existingDateKey) {
      // 从旧日期删除
      data.dailyRecords[existingDateKey].exercises = data.dailyRecords[existingDateKey].exercises.filter(ex => ex.id !== id);
      
      // 如果旧日期没有记录了，删除整个日期记录
      if (data.dailyRecords[existingDateKey].weights.length === 0 && 
          data.dailyRecords[existingDateKey].exercises.length === 0 && 
          data.dailyRecords[existingDateKey].meals.length === 0) {
        delete data.dailyRecords[existingDateKey];
      }
      
      // 添加到新日期
      ensureDailyRecord(data.dailyRecords, newDateKey);
      data.dailyRecords[newDateKey].exercises.push(updatedRecord);
      data.dailyRecords[newDateKey].exercises.sort((a, b) => 
        new Date(a.timestamp) - new Date(b.timestamp)
      );
    } else {
      // 更新现有记录
      const exerciseIndex = data.dailyRecords[existingDateKey].exercises.findIndex(ex => ex.id === id);
      data.dailyRecords[existingDateKey].exercises[exerciseIndex] = updatedRecord;
    }
    
    writeData(data);
    
    // 如果用户手动输入了时长，则不重新分析
    const shouldSkipAI = skipAI === 'true' || aiPredicted === 'true' || (manualDuration && !isNaN(Number(manualDuration)));
    
    // 如果描述或图片有变化，且没有手动输入时长，重新进行AI分析
    if (!shouldSkipAI && (description !== undefined || (req.files && req.files.length > 0))) {
      const imagePaths = newImageUrls.map(url => {
        const filename = path.basename(url);
        return path.join(uploadDir, filename);
      }).filter(p => fs.existsSync(p));
      
      analyzeExercise(updates.description || '', imagePaths)
        .then(analysis => {
          if (analysis.success) {
            const data = readData();
            const dateKey = formatDateKey(updates.timestamp);
            if (data.dailyRecords[dateKey]) {
              const exerciseIndex = data.dailyRecords[dateKey].exercises.findIndex(ex => ex.id === id);
              if (exerciseIndex >= 0) {
                data.dailyRecords[dateKey].exercises[exerciseIndex] = {
                  ...data.dailyRecords[dateKey].exercises[exerciseIndex],
                  duration: analysis.duration,
                  estimatedCalories: analysis.calories,
                  isAiPredicted: true,
                  aiAnalysisText: analysis.analysis,
                  details: analysis.details,
                  updatedAt: new Date().toISOString()
                };
                writeData(data);
              }
            }
          }
        })
        .catch(err => {
          console.error('[运动记录] AI分析失败:', err.message);
        });
    }
    
    res.json({
      success: true,
      exercise: { ...updatedRecord, date: updatedRecord.timestamp },
      message: '运动记录已更新'
    });
  } catch (error) {
    console.error('[运动记录] 更新失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * DELETE /api/exercise/:id
 * 删除运动记录
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const data = readData();
    
    // 在所有日期中查找并删除该记录
    let found = false;
    for (const dateKey in data.dailyRecords) {
      const dayRecord = data.dailyRecords[dateKey];
      const exerciseIndex = dayRecord.exercises.findIndex(ex => ex.id === id);
      
      if (exerciseIndex !== -1) {
        const record = dayRecord.exercises[exerciseIndex];
        
        // 删除关联的图片文件
        if (record.images && record.images.length > 0) {
          record.images.forEach(imageUrl => {
            const filename = path.basename(imageUrl);
            const imagePath = path.join(uploadDir, filename);
            if (fs.existsSync(imagePath)) {
              fs.unlinkSync(imagePath);
            }
          });
        }
        
        // 删除记录
        dayRecord.exercises.splice(exerciseIndex, 1);
        
        // 如果该天没有任何记录了，删除整个日期记录
        if (dayRecord.weights.length === 0 && dayRecord.exercises.length === 0 && dayRecord.meals.length === 0) {
          delete data.dailyRecords[dateKey];
        }
        
        found = true;
        break;
      }
    }
    
    if (!found) {
      return res.status(404).json({
        success: false,
        error: '运动记录不存在'
      });
    }
    
    writeData(data);
    
    res.json({
      success: true,
      message: '运动记录删除成功'
    });
  } catch (error) {
    console.error('[运动记录] 删除失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * POST /api/exercise/:id/analyze
 * 重新分析运动记录
 */
router.post('/:id/analyze', async (req, res) => {
  try {
    const { id } = req.params;
    
    const data = readData();
    
    // 从新数据结构中查找记录
    let record = null;
    let dateKey = null;
    for (const [key, dayRecord] of Object.entries(data.dailyRecords || {})) {
      const found = dayRecord.exercises?.find(r => r.id === id);
      if (found) {
        record = found;
        dateKey = key;
        break;
      }
    }
    
    if (!record) {
      return res.status(404).json({
        success: false,
        error: '运动记录不存在'
      });
    }
    
    if (!record.description && (!record.images || record.images.length === 0)) {
      return res.status(400).json({
        success: false,
        error: '该记录没有描述或图片，无法进行AI分析'
      });
    }
    
    // 获取图片路径
    const imagePaths = (record.images || []).map(url => {
      const filename = path.basename(url);
      return path.join(uploadDir, filename);
    }).filter(p => fs.existsSync(p));
    
    const analysis = await analyzeExercise(record.description || '', imagePaths);
    
    if (analysis.success) {
      const recordIndex = data.dailyRecords[dateKey].exercises.findIndex(r => r.id === id);
      if (recordIndex >= 0) {
        data.dailyRecords[dateKey].exercises[recordIndex] = {
          ...data.dailyRecords[dateKey].exercises[recordIndex],
          duration: analysis.duration,
          estimatedCalories: analysis.calories,
          isAiPredicted: true,
          aiAnalysisText: analysis.analysis,
          details: analysis.details,
          updatedAt: new Date().toISOString()
        };
        writeData(data);
        
        res.json({
          success: true,
          exercise: { ...data.dailyRecords[dateKey].exercises[recordIndex], date: data.dailyRecords[dateKey].exercises[recordIndex].timestamp },
          message: 'AI分析完成'
        });
      }
    } else {
      res.status(500).json({
        success: false,
        error: analysis.error || 'AI分析失败'
      });
    }
  } catch (error) {
    console.error('[运动记录] AI分析失败:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 
