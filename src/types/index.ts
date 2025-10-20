export interface WeightRecord {
  id: string;
  date: string;
  weight: number;
  note?: string;
  fasting: "空腹" | "非空腹";
}

export interface ExerciseRecord {
  id: string;
  date: string;
  duration: number; // 运动时长（分钟），大于0表示有运动
}

export interface Milestone {
  id: string;
  targetWeight: number;
  achievedDate?: string; // 达成日期
  note?: string; // 备注
}

export interface UserProfile {
  height: number;
  targetWeight?: number;
  theme: "light" | "dark";
  milestones?: Milestone[]; // 阶段目标列表
}

export interface WeightStats {
  current: number;
  average: number;
  min: number;
  max: number;
  bmi: number;
  change: number;
  totalRecords: number;
  thisMonth: number;
  thisWeek: number;
  targetProgress: number;
  targetRemaining: number;
  initialWeight: number;
}

export interface TimeSlot {
  key: string;
  label: string;
  hour: number;
  minute: number;
  color: string;
}

export interface CalendarData {
  timeSlots: TimeSlot[];
  dayRecords: {
    [dateKey: string]: {
      [timeSlotKey: string]: WeightRecord;
    };
  };
  exerciseRecords: {
    [dateKey: string]: {
      exercise: boolean;
      duration?: number; // 运动时长（分钟）
    };
  };
}

export interface ChartData {
  labels: string[];
  datasets: Array<{
    label: string;
    data: number[];
    borderColor: string;
    backgroundColor: string;
    tension: number;
    fill: boolean;
  }>;
}

export interface ReportStats {
  startWeight: number;
  endWeight: number;
  change: number;
  average: number;
  min: number;
  max: number;
  recordCount: number;
  weeklyAverages?: number[];
}

export interface Report {
  period: string;
  type: "weekly" | "monthly";
  records: WeightRecord[];
  stats: ReportStats;
  insights: string[];
}
