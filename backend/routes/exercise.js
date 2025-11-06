const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { readData, writeData } = require('../utils/dataManager');
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
 * 获取所有运动记录
 */
router.get('/', async (req, res) => {
  try {
    const { date, startDate, endDate } = req.query;
    const data = readData();
    let exerciseRecords = data.exerciseRecords || [];
    
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
    const exerciseRecords = data.exerciseRecords || [];
    
    // 创建运动记录
    const exerciseData = {
      id: generateId(),
      date: date || new Date().toISOString(),
      duration: manualDuration ? Number(manualDuration) : (duration ? Number(duration) : 0),
      description: description || '',
      images: imageUrls,
      estimatedCalories: null,
      aiAnalysis: null,
      createdAt: new Date().toISOString()
    };
    
    // 如果用户手动输入了时长
    if (manualDuration && !isNaN(Number(manualDuration))) {
      exerciseData.duration = Number(manualDuration);
      // 如果是AI预测且未修改，标记为AI预测
      if (aiPredicted === 'true') {
        exerciseData.aiAnalysis = 'AI预测';
      }
    }
    
    // 如果用户手动输入了热量
    if (manualCalories && !isNaN(Number(manualCalories))) {
      exerciseData.estimatedCalories = Number(manualCalories);
    }
    
    exerciseRecords.push(exerciseData);
    data.exerciseRecords = exerciseRecords;
    writeData(data);
    
    // 如果用户手动输入了时长或要求跳过AI，则不进行AI分析
    if (skipAI === 'true' || aiPredicted === 'true' || (manualDuration && !isNaN(Number(manualDuration)))) {
      return res.json({
        success: true,
        exercise: exerciseData,
        message: '运动记录已创建'
      });
    }
    
    // 异步进行AI分析
    analyzeExercise(description || '', imagePaths)
      .then(analysis => {
        if (analysis.success) {
          // 更新记录
          const data = readData();
          const recordIndex = data.exerciseRecords.findIndex(r => r.id === exerciseData.id);
          if (recordIndex >= 0) {
            data.exerciseRecords[recordIndex] = {
              ...data.exerciseRecords[recordIndex],
              duration: analysis.duration,
              estimatedCalories: analysis.calories,
              aiAnalysis: analysis.analysis,
              details: analysis.details
            };
            writeData(data);
          }
        }
      })
      .catch(err => {
        console.error('[运动记录] AI分析失败:', err.message);
      });
    
    res.json({
      success: true,
      exercise: exerciseData,
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
    const exerciseRecords = data.exerciseRecords || [];
    
    const recordIndex = exerciseRecords.findIndex(record => record.id === id);
    if (recordIndex === -1) {
      return res.status(404).json({
        success: false,
        error: '运动记录不存在'
      });
    }
    
    const existingRecord = exerciseRecords[recordIndex];
    
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
      date: date || existingRecord.date,
      description: description !== undefined ? description : existingRecord.description,
      images: newImageUrls
    };
    
    // 如果用户手动输入了时长
    if (manualDuration && !isNaN(Number(manualDuration))) {
      updates.duration = Number(manualDuration);
      // 如果是AI预测且未修改，标记为AI预测
      if (aiPredicted === 'true') {
        updates.aiAnalysis = 'AI预测';
      } else {
        // 清除原有的aiAnalysis，因为是用户手动输入或修改
        updates.aiAnalysis = null;
      }
    }
    
    // 如果用户手动输入了热量
    if (manualCalories && !isNaN(Number(manualCalories))) {
      updates.estimatedCalories = Number(manualCalories);
    }
    
    exerciseRecords[recordIndex] = {
      ...existingRecord,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    data.exerciseRecords = exerciseRecords;
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
            const recordIndex = data.exerciseRecords.findIndex(r => r.id === id);
            if (recordIndex >= 0) {
              data.exerciseRecords[recordIndex] = {
                ...data.exerciseRecords[recordIndex],
                duration: analysis.duration,
                estimatedCalories: analysis.calories,
                aiAnalysis: analysis.analysis,
                details: analysis.details
              };
              writeData(data);
            }
          }
        })
        .catch(err => {
          console.error('[运动记录] AI分析失败:', err.message);
        });
    }
    
    res.json({
      success: true,
      exercise: exerciseRecords[recordIndex],
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
    const exerciseRecords = data.exerciseRecords || [];
    
    const recordIndex = exerciseRecords.findIndex(record => record.id === id);
    if (recordIndex === -1) {
      return res.status(404).json({
        success: false,
        error: '运动记录不存在'
      });
    }
    
    // 删除关联的图片文件
    const record = exerciseRecords[recordIndex];
    if (record.images && record.images.length > 0) {
      record.images.forEach(imageUrl => {
        const filename = path.basename(imageUrl);
        const imagePath = path.join(uploadDir, filename);
        if (fs.existsSync(imagePath)) {
          fs.unlinkSync(imagePath);
        }
      });
    }
    
    exerciseRecords.splice(recordIndex, 1);
    data.exerciseRecords = exerciseRecords;
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
    const exerciseRecords = data.exerciseRecords || [];
    
    const record = exerciseRecords.find(r => r.id === id);
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
      const recordIndex = exerciseRecords.findIndex(r => r.id === id);
      if (recordIndex >= 0) {
        exerciseRecords[recordIndex] = {
          ...exerciseRecords[recordIndex],
          duration: analysis.duration,
          estimatedCalories: analysis.calories,
          aiAnalysis: analysis.analysis,
          details: analysis.details,
          updatedAt: new Date().toISOString()
        };
        data.exerciseRecords = exerciseRecords;
        writeData(data);
        
        res.json({
          success: true,
          exercise: exerciseRecords[recordIndex],
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
