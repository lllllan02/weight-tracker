const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());

// 读取数据
function readData() {
  if (!fs.existsSync(DATA_FILE)) {
    return { records: [], profile: { height: 170, targetWeight: 65, theme: 'light' } };
  }
  return JSON.parse(fs.readFileSync(DATA_FILE, 'utf-8'));
}

// 写入数据
function writeData(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// 获取所有体重记录
app.get('/records', (req, res) => {
  const data = readData();
  res.json(data.records || []);
});

// 新增体重记录
app.post('/records', (req, res) => {
  const data = readData();
  const record = req.body;
  if (!record || !record.id) {
    return res.status(400).json({ error: 'Invalid record' });
  }
  data.records = data.records || [];
  data.records.push(record);
  writeData(data);
  res.json({ success: true });
});

// 删除体重记录
app.delete('/records/:id', (req, res) => {
  const data = readData();
  const id = req.params.id;
  data.records = (data.records || []).filter(r => r.id !== id);
  writeData(data);
  res.json({ success: true });
});

// 获取用户资料
app.get('/profile', (req, res) => {
  const data = readData();
  res.json(data.profile || {});
});

// 更新用户资料
app.put('/profile', (req, res) => {
  const data = readData();
  data.profile = req.body;
  writeData(data);
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
}); 