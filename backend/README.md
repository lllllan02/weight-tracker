# 体重追踪器后端服务

这是一个体重追踪应用的后端服务，采用模块化架构设计，提供完整的体重记录管理和数据分析功能。

## 项目结构

```
backend/
├── server.js              # 主服务器文件
├── data.json              # 数据存储文件
├── package.json           # 项目依赖配置
├── README.md              # 项目说明文档
├── utils/                 # 工具模块
│   ├── dataManager.js     # 数据管理工具
│   ├── calculations.js    # 计算工具
│   ├── reports.js         # 报告生成工具
│   └── backup.js          # 数据备份工具
└── routes/                # 路由模块
    ├── calendar.js        # 日历相关接口
    ├── stats.js           # 统计相关接口
    ├── chart.js           # 图表相关接口
    ├── reports.js         # 报告相关接口
    ├── profile.js         # 用户资料接口
    ├── records.js         # 记录管理接口
    ├── backup.js          # 数据备份接口
    └── health.js          # 健康检查接口
```

## 模块说明

### 工具模块 (utils/)

#### dataManager.js
- **功能**: 数据读写和验证
- **主要函数**:
  - `readData()`: 读取数据文件
  - `writeData(data)`: 写入数据文件
  - `validateRecord(record)`: 验证记录数据
  - `validateProfile(profile)`: 验证用户资料

#### calculations.js
- **功能**: 各种计算功能
- **主要函数**:
  - `calculateBMI(weight, height)`: 计算BMI
  - `calculateStats(records, profile)`: 计算统计数据
  - `calculateChartData(records, profile)`: 计算图表数据
  - `calculateCalendarData(records)`: 计算日历数据
  - `formatDate(dateString)`: 格式化日期

#### reports.js
- **功能**: 报告生成
- **主要函数**:
  - `generateWeeklyReport(records, profile)`: 生成周报
  - `generateMonthlyReport(records, profile)`: 生成月报

#### backup.js
- **功能**: 数据备份和导入导出
- **主要函数**:
  - `createBackup()`: 创建数据备份
  - `exportData()`: 导出数据
  - `importData(importData)`: 导入数据

### 路由模块 (routes/)

#### calendar.js
- `GET /api/calendar` - 获取日历数据

#### stats.js
- `GET /api/stats` - 获取统计数据

#### chart.js
- `GET /api/chart` - 获取图表数据

#### reports.js
- `GET /api/reports/weekly` - 获取周报
- `GET /api/reports/monthly` - 获取月报

#### profile.js
- `GET /api/profile` - 获取用户资料
- `PUT /api/profile` - 更新用户资料

#### records.js
- `GET /api/records` - 获取所有记录
- `POST /api/records` - 添加记录
- `PUT /api/records/:id` - 更新记录
- `DELETE /api/records/:id` - 删除记录

#### backup.js
- `POST /api/backup` - 创建数据备份
- `GET /api/backup/export` - 导出数据备份
- `POST /api/backup/import` - 导入数据备份

#### health.js
- `GET /api/health` - 健康检查

## 启动服务

```bash
# 安装依赖
npm install

# 启动服务器
node server.js
```

服务器将在 `http://localhost:3001` 启动。

## 数据格式

### 记录数据格式
```json
{
  "id": "唯一标识符",
  "date": "2024-01-01T08:00:00.000Z",
  "weight": 65.5,
  "fasting": "空腹",
  "exercise": true
}
```

### 用户资料格式
```json
{
  "height": 170,
  "targetWeight": 65,
  "theme": "light"
}
```

## 重构优势

1. **模块化设计**: 按功能将代码分离到不同模块，便于维护和扩展
2. **代码复用**: 工具函数可以在多个路由中复用
3. **清晰的结构**: 每个模块职责单一，代码结构清晰
4. **易于测试**: 模块化设计便于单元测试
5. **可维护性**: 代码分散到多个文件，降低了单个文件的复杂度

## 扩展建议

- 可以添加数据库支持（如SQLite、MongoDB）
- 可以添加用户认证和授权
- 可以添加数据验证中间件
- 可以添加日志记录功能
- 可以添加API文档生成 