const express = require('express');
const router = express.Router();
const { createBackup, exportData, importData } = require('../utils/backup');

// 创建备份
router.post('/', (req, res) => {
  try {
    const result = createBackup();
    res.json(result);
  } catch (error) {
    console.error('创建备份失败:', error.message);
    res.status(500).json({ error: '创建备份失败' });
  }
});

// 导出数据
router.get('/export', (req, res) => {
  try {
    const exportDataResult = exportData();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="weight-tracker-backup-${new Date().toISOString().split('T')[0]}.json"`);
    res.json(exportDataResult);
  } catch (error) {
    console.error('导出数据失败:', error.message);
    res.status(500).json({ error: '导出数据失败' });
  }
});

// 导入数据
router.post('/import', (req, res) => {
  try {
    const importDataResult = importData(req.body);
    res.json(importDataResult);
  } catch (error) {
    console.error('导入数据失败:', error.message);
    res.status(500).json({ error: '导入数据失败' });
  }
});

module.exports = router; 