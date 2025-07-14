const API_BASE = 'http://localhost:3001';

// 体重记录相关 API
export async function getRecords() {
  try {
    const res = await fetch(`${API_BASE}/records`);
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
    const res = await fetch(`${API_BASE}/records`, {
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

export async function deleteRecord(id: string) {
  try {
    const res = await fetch(`${API_BASE}/records/${id}`, { 
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

// 用户资料相关 API
export async function getProfile() {
  try {
    const res = await fetch(`${API_BASE}/profile`);
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
    const res = await fetch(`${API_BASE}/profile`, {
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