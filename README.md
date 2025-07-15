# 体重记录应用

一个简单的体重记录 Web 应用，数据存储在本地 JSON 文件中。

## 功能特性

- 📊 体重记录管理（增删查）
- 📈 体重变化趋势图表
- 📋 统计信息（当前体重、平均值、BMI、体重范围等）
- 👤 用户资料设置（身高、目标体重）
- 💾 数据实时保存到本地 JSON 文件

## 技术栈

- **前端**: React + TypeScript + Ant Design
- **后端**: Node.js + Express
- **数据存储**: 本地 JSON 文件

## 启动步骤

### 1. 启动后端服务

```bash
cd backend
npm install
npm start
```

后端服务将在 http://localhost:3001 启动

### 2. 启动前端应用

```bash
npm install
npm start
```

前端应用将在 http://localhost:3000 启动

## API 接口

### 面板专用接口
- `GET /api/calendar` - 获取日历面板数据
- `GET /api/stats` - 获取统计面板数据
- `GET /api/chart` - 获取图表面板数据

### 用户资料接口
- `GET /api/profile` - 获取用户资料
- `PUT /api/profile` - 更新用户资料

### 记录管理接口
- `GET /api/records` - 获取所有体重记录
- `POST /api/records` - 添加体重记录
- `PUT /api/records/:id` - 更新体重记录
- `DELETE /api/records/:id` - 删除体重记录

## 数据存储策略

采用**最小化存储**策略，只存储核心数据，其他数据由后端实时计算：

### 核心数据文件 (data.json)

```json
{
  "records": [
    {
      "id": "xxx",
      "date": "2024-01-01T08:00:00.000Z",
      "weight": 65.5,
      "note": "运动后",
      "fasting": "空腹"
    }
  ],
  "profile": {
    "height": 170,
    "targetWeight": 65,
    "theme": "light"
  }
}
```

### 设计优势

- **数据最小化**：只存储不可再生的核心数据
- **实时计算**：所有统计数据、图表数据、日历数据都实时计算
- **可扩展性**：新增功能时只需扩展计算逻辑，无需修改存储结构
- **一致性**：避免存储冗余数据导致的不一致问题

## 数据管理

### 数据备份
项目提供了数据备份和恢复功能：

```bash
# 创建备份
node backend/backup.js create

# 列出所有备份
node backend/backup.js list

# 恢复指定备份
node backend/backup.js restore 1

# 清理旧备份（保留最近10个）
node backend/backup.js cleanup 10
```

### 健康检查
可以通过健康检查接口监控服务状态：

```bash
curl http://localhost:3001/api/health
```

## 注意事项

- 确保后端服务先启动，前端才能正常使用
- 所有数据操作都会实时写入本地 JSON 文件
- 支持 CORS，前端可以正常访问后端 API
- 每个面板都有专门的接口，前端无需处理复杂的数据逻辑
- 数据文件损坏时会自动使用默认数据，确保服务正常运行
