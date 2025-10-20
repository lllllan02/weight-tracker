const express = require('express');
const router = express.Router();
const { readData, writeData } = require('../utils/dataManager');
const { generateId } = require('../utils/helpers');

// 获取所有阶段目标
router.get('/', async (req, res) => {
  try {
    const data = readData();
    const milestones = data.profile?.milestones || [];
    res.json(milestones);
  } catch (error) {
    console.error('获取阶段目标失败:', error);
    res.status(500).json({ error: '获取阶段目标失败' });
  }
});

// 添加阶段目标
router.post('/', async (req, res) => {
  try {
    const { targetWeight, note } = req.body;
    
    if (!targetWeight || typeof targetWeight !== 'number') {
      return res.status(400).json({ error: '目标体重是必需的且必须是数字' });
    }

    const data = readData();
    if (!data.profile) {
      data.profile = { height: 170, theme: 'light' };
    }
    if (!data.profile.milestones) {
      data.profile.milestones = [];
    }
    
    const milestone = {
      id: generateId(),
      targetWeight,
      note: note || '',
    };
    
    data.profile.milestones.push(milestone);
    
    // 按目标体重排序（从大到小，适合减重场景）
    data.profile.milestones.sort((a, b) => b.targetWeight - a.targetWeight);
    
    writeData(data);
    res.json(milestone);
  } catch (error) {
    console.error('添加阶段目标失败:', error);
    res.status(500).json({ error: '添加阶段目标失败' });
  }
});

// 更新阶段目标
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { targetWeight, note, achievedDate } = req.body;

    const data = readData();
    if (!data.profile?.milestones) {
      return res.status(404).json({ error: '没有找到阶段目标' });
    }
    
    const milestoneIndex = data.profile.milestones.findIndex(m => m.id === id);
    if (milestoneIndex === -1) {
      return res.status(404).json({ error: '阶段目标不存在' });
    }
    
    if (targetWeight !== undefined) {
      data.profile.milestones[milestoneIndex].targetWeight = targetWeight;
    }
    if (note !== undefined) {
      data.profile.milestones[milestoneIndex].note = note;
    }
    if (achievedDate !== undefined) {
      data.profile.milestones[milestoneIndex].achievedDate = achievedDate;
    }
    
    // 重新排序
    data.profile.milestones.sort((a, b) => b.targetWeight - a.targetWeight);
    
    writeData(data);
    res.json(data.profile.milestones[milestoneIndex]);
  } catch (error) {
    console.error('更新阶段目标失败:', error);
    res.status(500).json({ error: '更新阶段目标失败' });
  }
});

// 删除阶段目标
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const data = readData();
    if (!data.profile?.milestones) {
      return res.status(404).json({ error: '没有找到阶段目标' });
    }
    
    const milestoneIndex = data.profile.milestones.findIndex(m => m.id === id);
    if (milestoneIndex === -1) {
      return res.status(404).json({ error: '阶段目标不存在' });
    }
    
    data.profile.milestones.splice(milestoneIndex, 1);
    writeData(data);
    
    res.json({ message: '阶段目标删除成功' });
  } catch (error) {
    console.error('删除阶段目标失败:', error);
    res.status(500).json({ error: '删除阶段目标失败' });
  }
});

module.exports = router;

