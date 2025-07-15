const API_BASE = 'http://localhost:3001';

// ===== 日历面板 API =====
// 获取日历数据（包含时间段配置和按日期组织的记录）
export async function getCalendarData() {
  try {
    const res = await fetch(`${API_BASE}/api/calendar`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error('获取日历数据失败:', error);
    throw error;
  }
}

// ===== 统计面板 API =====
// 获取统计数据（包含所有统计指标）
export async function getStats() {
  try {
    const res = await fetch(`${API_BASE}/api/stats`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error('获取统计数据失败:', error);
    throw error;
  }
}

// ===== 图表面板 API =====
// 获取图表数据（包含标签和数据集）
export async function getChartData() {
  try {
    const res = await fetch(`${API_BASE}/api/chart`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error('获取图表数据失败:', error);
    throw error;
  }
}

// ===== 用户资料 API =====
export async function getProfile() {
  try {
    const res = await fetch(`${API_BASE}/api/profile`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error('获取用户资料失败:', error);
    throw error;
  }
}

export async function updateProfile(profile: any) {
  try {
    const res = await fetch(`${API_BASE}/api/profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile),
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error('更新用户资料失败:', error);
    throw error;
  }
}

// ===== 记录管理 API =====
// 获取所有记录（原始数据）
export async function getRecords() {
  try {
    const res = await fetch(`${API_BASE}/api/records`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error('获取体重记录失败:', error);
    throw error;
  }
}

export async function addRecord(record: any) {
  try {
    const res = await fetch(`${API_BASE}/api/records`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error('添加体重记录失败:', error);
    throw error;
  }
}

export async function updateRecord(id: string, record: any) {
  try {
    const res = await fetch(`${API_BASE}/api/records/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record),
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error('更新体重记录失败:', error);
    throw error;
  }
}

export async function deleteRecord(id: string) {
  try {
    const res = await fetch(`${API_BASE}/api/records/${id}`, { 
      method: 'DELETE' 
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error('删除体重记录失败:', error);
    throw error;
  }
} 