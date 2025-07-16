const fs = require('fs');
const path = require('path');
const { readData, writeData, validateRecord, validateProfile } = require('./dataManager');

// 获取北京时间
function getBeijingTime() {
  const now = new Date();
  // 北京时间是 UTC+8
  const beijingTime = new Date(now.getTime() + 8 * 60 * 60 * 1000);
  return beijingTime;
}

// 格式化北京时间为文件名友好的格式
function formatBeijingTimeForFilename() {
  const beijingTime = getBeijingTime();
  return beijingTime.toISOString().replace(/[:.]/g, '-');
}

// 获取北京时间的ISO字符串
function getBeijingTimeISO() {
  const beijingTime = getBeijingTime();
  return beijingTime.toISOString();
}

// 导出数据
function exportData() {
  try {
    const data = readData();
    const exportData = {
      ...data,
      exportInfo: {
        timestamp: getBeijingTimeISO(),
        version: '1.0',
        recordCount: data.records ? data.records.length : 0
      }
    };
    
    return exportData;
  } catch (error) {
    console.error('导出数据失败:', error.message);
    throw new Error('导出数据失败');
  }
}

// 创建备份
function createBackup(reason = 'manual_backup') {
  try {
    const currentData = readData();
    const backupData = {
      ...currentData,
      backupInfo: {
        timestamp: getBeijingTimeISO(),
        reason: reason
      }
    };
    
    // 确保备份目录存在
    const backupDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // 保存备份
    const backupPath = path.join(backupDir, `backup-${formatBeijingTimeForFilename()}.json`);
    fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
    
    return { 
      success: true, 
      message: '备份创建成功',
      timestamp: getBeijingTimeISO(),
      backupPath: backupPath
    };
  } catch (error) {
    console.error('创建备份失败:', error.message);
    throw new Error('创建备份失败');
  }
}

// 导入数据
function importData(importData) {
  try {
    // 验证导入数据的结构
    if (!importData || typeof importData !== 'object') {
      throw new Error('无效的数据格式');
    }
    
    // 验证记录数据
    if (importData.records && Array.isArray(importData.records)) {
      for (const record of importData.records) {
        if (!validateRecord(record)) {
          throw new Error('记录数据格式无效');
        }
      }
    }
    
    // 验证用户资料
    if (importData.profile && !validateProfile(importData.profile)) {
      throw new Error('用户资料格式无效');
    }
    
    // 备份当前数据
    const backupResult = createBackup('import_backup');
    
    // 写入新数据
    const newData = {
      records: importData.records || [],
      profile: importData.profile || {}
    };
    writeData(newData);
    
    return { 
      success: true, 
      message: '数据导入成功',
      backupPath: backupResult.backupPath,
      importedRecords: newData.records.length
    };
  } catch (error) {
    console.error('导入数据失败:', error.message);
    throw error;
  }
}

module.exports = {
  createBackup,
  exportData,
  importData
}; 