const express = require('express');
const router = express.Router();
const { readData, writeData, validateProfile } = require('../utils/dataManager');

// 获取用户资料
router.get('/', (req, res) => {
  const data = readData();
  res.json(data.profile || {});
});

// 更新用户资料
router.put('/', (req, res) => {
  try {
    const data = readData();
    const profile = req.body;
    
    if (!validateProfile(profile)) {
      return res.status(400).json({ error: 'Invalid profile data' });
    }
    
    data.profile = profile;
    writeData(data);
    res.json({ success: true });
  } catch (error) {
    console.error('更新用户资料失败:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router; 