const express = require('express');
const router = express.Router();
const { readData, validateProfile } = require('../utils/dataManager');

// 健康检查接口
router.get('/', (req, res) => {
  try {
    const data = readData();
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      dataIntegrity: {
        recordsCount: data.records.length,
        profileExists: !!data.profile,
        hasValidProfile: validateProfile(data.profile)
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

module.exports = router; 