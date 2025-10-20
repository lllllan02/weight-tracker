const API_BASE = "http://localhost:3001";

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
    console.error("获取日历数据失败:", error);
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
    console.error("获取统计数据失败:", error);
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
    console.error("获取图表数据失败:", error);
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
    console.error("获取用户资料失败:", error);
    throw error;
  }
}

export async function updateProfile(profile: any) {
  try {
    const res = await fetch(`${API_BASE}/api/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(profile),
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("更新用户资料失败:", error);
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
    console.error("获取体重记录失败:", error);
    throw error;
  }
}

export async function addRecord(record: any) {
  try {
    const res = await fetch(`${API_BASE}/api/records`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("添加体重记录失败:", error);
    throw error;
  }
}

export async function updateRecord(id: string, record: any) {
  try {
    const res = await fetch(`${API_BASE}/api/records/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("更新体重记录失败:", error);
    throw error;
  }
}

export async function deleteRecord(id: string) {
  try {
    const res = await fetch(`${API_BASE}/api/records/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("删除体重记录失败:", error);
    throw error;
  }
}

// ===== 运动记录 API =====
// 获取所有运动记录
export async function getExerciseRecords() {
  try {
    const res = await fetch(`${API_BASE}/api/exercise`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("获取运动记录失败:", error);
    throw error;
  }
}

// 添加运动记录
export async function addExerciseRecord(record: any) {
  try {
    const res = await fetch(`${API_BASE}/api/exercise`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("添加运动记录失败:", error);
    throw error;
  }
}

// 更新运动记录
export async function updateExerciseRecord(id: string, record: any) {
  try {
    const res = await fetch(`${API_BASE}/api/exercise/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("更新运动记录失败:", error);
    throw error;
  }
}

// 删除运动记录
export async function deleteExerciseRecord(id: string) {
  try {
    const res = await fetch(`${API_BASE}/api/exercise/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("删除运动记录失败:", error);
    throw error;
  }
}

// ===== 报告 API =====
// 获取所有有数据的周列表
export async function getAvailableWeeks() {
  try {
    const res = await fetch(`${API_BASE}/api/reports/available-weeks`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("获取可用周列表失败:", error);
    throw error;
  }
}

// 获取所有有数据的月列表
export async function getAvailableMonths() {
  try {
    const res = await fetch(`${API_BASE}/api/reports/available-months`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("获取可用月列表失败:", error);
    throw error;
  }
}

// 获取周报
export async function getWeeklyReport(date?: string) {
  try {
    const url = date
      ? `${API_BASE}/api/reports/weekly?date=${date}`
      : `${API_BASE}/api/reports/weekly`;
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("获取周报失败:", error);
    throw error;
  }
}

// 获取月报
export async function getMonthlyReport(year?: number, month?: number) {
  try {
    let url = `${API_BASE}/api/reports/monthly`;
    if (year && month) {
      url += `?year=${year}&month=${month}`;
    }
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("获取月报失败:", error);
    throw error;
  }
}

// 生成周报 AI 分析
export async function generateWeeklyAIAnalysis(force = false, date?: string) {
  try {
    const res = await fetch(`${API_BASE}/api/reports/weekly/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force, date }),
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("生成周报 AI 分析失败:", error);
    throw error;
  }
}

// 生成月报 AI 分析
export async function generateMonthlyAIAnalysis(force = false, year?: number, month?: number) {
  try {
    const res = await fetch(`${API_BASE}/api/reports/monthly/ai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ force, year, month }),
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("生成月报 AI 分析失败:", error);
    throw error;
  }
}

// ===== 数据备份 API =====
// 创建备份
export async function createBackup() {
  try {
    const res = await fetch(`${API_BASE}/api/backup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("创建备份失败:", error);
    throw error;
  }
}

// 导出数据
export async function exportData() {
  try {
    const res = await fetch(`${API_BASE}/api/backup/export`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    // 获取文件名
    const contentDisposition = res.headers.get("Content-Disposition");
    let filename = "weight-tracker-backup.json";
    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="(.+)"/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);

    return { success: true, filename };
  } catch (error) {
    console.error("导出数据失败:", error);
    throw error;
  }
}

// 导入数据
export async function importData(file: File) {
  try {
    const fileContent = await file.text();
    const importData = JSON.parse(fileContent);

    const res = await fetch(`${API_BASE}/api/backup/import`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(importData),
    });

    if (!res.ok) {
      const errorData = await res.json();
      throw new Error(errorData.error || `HTTP error! status: ${res.status}`);
    }

    return await res.json();
  } catch (error) {
    console.error("导入数据失败:", error);
    throw error;
  }
}
