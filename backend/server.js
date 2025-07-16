const express = require('express');
const cors = require('cors');

// 导入路由模块
const calendarRoutes = require('./routes/calendar');
const statsRoutes = require('./routes/stats');
const chartRoutes = require('./routes/chart');
const reportsRoutes = require('./routes/reports');
const profileRoutes = require('./routes/profile');
const recordsRoutes = require('./routes/records');
const exerciseRoutes = require('./routes/exercise');
const backupRoutes = require('./routes/backup');
const healthRoutes = require('./routes/health');

const app = express();
const PORT = 3001;

// 中间件配置
app.use(cors());
app.use(express.json());

// 路由配置
app.use('/api/calendar', calendarRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/chart', chartRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/exercise', exerciseRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/health', healthRoutes);

// 启动服务器
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
  console.log('Available APIs:');
  console.log('- GET  /api/health   - 健康检查');
  console.log('- GET  /api/calendar - 日历面板数据');
  console.log('- GET  /api/stats    - 统计面板数据');
  console.log('- GET  /api/chart    - 图表面板数据');
  console.log('- GET  /api/reports/weekly  - 周报');
  console.log('- GET  /api/reports/monthly - 月报');
  console.log('- GET  /api/profile  - 用户资料');
  console.log('- PUT  /api/profile  - 更新用户资料');
  console.log('- GET  /api/records  - 获取所有记录');
  console.log('- POST /api/records  - 添加记录');
  console.log('- PUT  /api/records/:id - 更新记录');
  console.log('- DELETE /api/records/:id - 删除记录');
  console.log('- GET  /api/exercise  - 获取所有运动记录');
  console.log('- POST /api/exercise  - 添加运动记录');
  console.log('- PUT  /api/exercise/:id - 更新运动记录');
  console.log('- DELETE /api/exercise/:id - 删除运动记录');
  console.log('- POST /api/backup   - 创建数据备份');
  console.log('- GET  /api/backup/export   - 导出数据备份');
  console.log('- POST /api/backup/import   - 导入数据备份');
}); 