import { Milestone } from "../types";

const API_BASE = "http://localhost:3001";

// 获取所有阶段目标
export async function getMilestones(): Promise<Milestone[]> {
  try {
    const res = await fetch(`${API_BASE}/api/milestones`);
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("获取阶段目标失败:", error);
    throw error;
  }
}

// 添加阶段目标
export async function addMilestone(milestone: Omit<Milestone, "id">): Promise<Milestone> {
  try {
    const res = await fetch(`${API_BASE}/api/milestones`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(milestone),
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("添加阶段目标失败:", error);
    throw error;
  }
}

// 更新阶段目标
export async function updateMilestone(id: string, updates: Partial<Milestone>): Promise<Milestone> {
  try {
    const res = await fetch(`${API_BASE}/api/milestones/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
    return await res.json();
  } catch (error) {
    console.error("更新阶段目标失败:", error);
    throw error;
  }
}

// 删除阶段目标
export async function deleteMilestone(id: string): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/api/milestones/${id}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }
  } catch (error) {
    console.error("删除阶段目标失败:", error);
    throw error;
  }
}

