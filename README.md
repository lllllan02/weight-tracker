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

- `GET /records` - 获取所有体重记录
- `POST /records` - 添加体重记录
- `DELETE /records/:id` - 删除体重记录
- `GET /profile` - 获取用户资料
- `PUT /profile` - 更新用户资料

## 数据格式

数据存储在 `backend/data.json` 文件中：

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

## 注意事项

- 确保后端服务先启动，前端才能正常使用
- 所有数据操作都会实时写入本地 JSON 文件
- 支持 CORS，前端可以正常访问后端 API
