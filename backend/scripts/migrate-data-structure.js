const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');

const DATA_FILE = path.join(__dirname, '..', 'data.json');
const BACKUP_FILE = path.join(__dirname, '..', 'data.backup.json');

/**
 * 数据结构迁移脚本
 * 将分散的 records, exerciseRecords, mealRecords 合并为按日期组织的 dailyRecords
 */

function migrateData() {
  console.log('🚀 开始数据迁移...\n');

  // 1. 读取旧数据
  console.log('📖 读取旧数据...');
  if (!fs.existsSync(DATA_FILE)) {
    console.error('❌ 数据文件不存在:', DATA_FILE);
    process.exit(1);
  }

  const oldData = JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
  
  // 2. 备份旧数据
  console.log('💾 备份旧数据到', BACKUP_FILE);
  fs.writeFileSync(BACKUP_FILE, JSON.stringify(oldData, null, 2), 'utf-8');

  // 3. 创建新的数据结构
  console.log('🔨 转换数据结构...\n');
  const newData = {
    dailyRecords: {},
    profile: oldData.profile || {},
    aiReports: oldData.aiReports || {}
  };

  const dailyRecords = {};

  // 处理体重记录
  console.log(`  处理 ${oldData.records?.length || 0} 条体重记录...`);
  (oldData.records || []).forEach(record => {
    const dateKey = dayjs(record.date).format('YYYY-MM-DD');
    
    if (!dailyRecords[dateKey]) {
      dailyRecords[dateKey] = {
        weights: [],
        exercises: [],
        meals: [],
        isComplete: false
      };
    }

    // 判断是早上还是晚上的体重
    // 如果时间是 00:00-11:59，认为是早上；12:00-23:59 认为是晚上
    const hour = dayjs(record.date).hour();
    const time = hour < 12 ? 'morning' : 'night';

    dailyRecords[dateKey].weights.push({
      id: record.id,
      time: time,
      weight: record.weight,
      fasting: record.fasting || null,
      timestamp: record.date
    });
  });

  // 处理运动记录
  console.log(`  处理 ${oldData.exerciseRecords?.length || 0} 条运动记录...`);
  (oldData.exerciseRecords || []).forEach(record => {
    const dateKey = dayjs(record.date).format('YYYY-MM-DD');
    
    if (!dailyRecords[dateKey]) {
      dailyRecords[dateKey] = {
        weights: [],
        exercises: [],
        meals: [],
        isComplete: false
      };
    }

    dailyRecords[dateKey].exercises.push({
      id: record.id,
      duration: record.duration,
      description: record.description || null,
      images: record.images || [],
      estimatedCalories: record.estimatedCalories || null,
      isAiPredicted: record.aiAnalysis === 'AI预测',
      aiAnalysisText: (record.aiAnalysis && record.aiAnalysis !== 'AI预测') ? record.aiAnalysis : null,
      timestamp: record.date,
      createdAt: record.createdAt || record.date,
      updatedAt: record.updatedAt || null
    });
  });

  // 处理饮食记录
  console.log(`  处理 ${oldData.mealRecords?.length || 0} 条饮食记录...`);
  (oldData.mealRecords || []).forEach(record => {
    const dateKey = dayjs(record.date).format('YYYY-MM-DD');
    
    if (!dailyRecords[dateKey]) {
      dailyRecords[dateKey] = {
        weights: [],
        exercises: [],
        meals: [],
        isComplete: false
      };
    }

    dailyRecords[dateKey].meals.push({
      id: record.id,
      mealType: record.mealType,
      description: record.description,
      images: record.images || [],
      estimatedCalories: record.estimatedCalories || null,
      isAiPredicted: record.aiAnalysis === 'AI预测',
      aiAnalysisText: (record.aiAnalysis && record.aiAnalysis !== 'AI预测') ? record.aiAnalysis : null,
      timestamp: record.date,
      createdAt: record.createdAt || record.date,
      updatedAt: record.updatedAt || null
    });
  });

  // 处理完整记录标记
  console.log(`  处理 ${oldData.completeRecords?.length || 0} 个完整记录标记...`);
  (oldData.completeRecords || []).forEach(dateKey => {
    if (dailyRecords[dateKey]) {
      dailyRecords[dateKey].isComplete = true;
    }
  });

  // 对每一天的数据进行排序
  Object.keys(dailyRecords).forEach(dateKey => {
    // 按时间戳排序体重记录
    dailyRecords[dateKey].weights.sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    // 按时间戳排序运动记录
    dailyRecords[dateKey].exercises.sort((a, b) => 
      new Date(a.timestamp) - new Date(b.timestamp)
    );
    // 按餐次类型排序饮食记录
    const mealOrder = { breakfast: 1, lunch: 2, dinner: 3, other: 4 };
    dailyRecords[dateKey].meals.sort((a, b) => 
      (mealOrder[a.mealType] || 5) - (mealOrder[b.mealType] || 5)
    );
  });

  newData.dailyRecords = dailyRecords;

  // 4. 写入新数据
  console.log('\n💾 保存新数据结构...');
  fs.writeFileSync(DATA_FILE, JSON.stringify(newData, null, 2), 'utf-8');

  // 5. 输出统计信息
  console.log('\n✅ 数据迁移完成！\n');
  console.log('📊 统计信息:');
  console.log(`  - 共迁移 ${Object.keys(dailyRecords).length} 天的数据`);
  console.log(`  - 体重记录: ${oldData.records?.length || 0} 条`);
  console.log(`  - 运动记录: ${oldData.exerciseRecords?.length || 0} 条`);
  console.log(`  - 饮食记录: ${oldData.mealRecords?.length || 0} 条`);
  console.log(`  - 完整标记: ${oldData.completeRecords?.length || 0} 天`);
  console.log(`\n💾 旧数据已备份到: ${BACKUP_FILE}`);
  console.log(`📁 新数据已保存到: ${DATA_FILE}\n`);

  // 6. 展示部分新数据结构示例
  const sampleDate = Object.keys(dailyRecords).sort().pop();
  if (sampleDate) {
    console.log('📋 新数据结构示例 (最近一天):');
    console.log(JSON.stringify({ [sampleDate]: dailyRecords[sampleDate] }, null, 2));
  }
}

// 运行迁移
try {
  migrateData();
} catch (error) {
  console.error('\n❌ 迁移失败:', error.message);
  console.error(error.stack);
  process.exit(1);
}

