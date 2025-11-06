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
  birthYear?: number; // 出生年份
  gender?: "male" | "female"; // 性别
}

export interface PredictionMethod {
  method: string;
  methodKey: 'linear' | 'exponentialDecay' | 'dynamicBMR' | 'ai';
  daysRemaining: number;
  predictedDate: string;
  dailyChange: number;
  confidence: 'low' | 'medium' | 'high';
  avgCalorieDeficit?: number; // 平均每日热量赤字（仅dynamicBMR）
  decayFactor?: number; // 衰减系数（仅exponentialDecay）
  description?: string; // 模型描述
}

export interface PredictionPoint {
  day: number;
  weight: number;
}

export interface PredictionResult {
  method: string;
  predictions: PredictionPoint[];
  dailyChange: number;
  slope?: number;
  intercept?: number;
  windowSize?: number;
  decayFactor?: number; // 指数衰减系数
  initialRate?: number; // 初始速率
  avgCalorieDeficit?: number; // 平均每日热量赤字
}

export interface TargetPrediction {
  achieved: boolean;
  currentWeight?: number;
  targetWeight?: number;
  weightDifference?: number;
  daysRemaining?: number;
  predictedDate?: string;
  predictions?: PredictionMethod[];
  linearPrediction?: PredictionResult;
  exponentialDecayPrediction?: PredictionResult;
  dynamicBMRPrediction?: PredictionResult;
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
  currentBMR?: number; // 当前体重的基础代谢
  targetBMR?: number; // 目标体重的基础代谢
  targetPrediction?: TargetPrediction; // 目标达成预测
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
  bmi: number;
  exerciseCount: number;
  exerciseDuration: number;
  weeklyAverages?: number[];
}

export interface AIAnalysis {
  summary: string;
  insights: string[];
  suggestions: string[];
  generatedAt?: string;
}

export interface Report {
  period: string;
  type: "weekly" | "monthly" | "all-time";
  records: WeightRecord[];
  stats: ReportStats;
  insights: string[];
  aiAnalysis?: AIAnalysis;
}

// 运动效果分析相关类型
export interface WeightChangeAfterExercise {
  date: string;
  duration: number;
  timeSlot: 'morning' | 'afternoon' | 'evening';
  beforeWeight: number;
  afterWeight: number;
  weightChange: number;
  effectiveness: 'positive' | 'negative';
}

export interface ExerciseEfficiencyScore {
  score: number;
  factors: {
    frequency: number;
    consistency: number;
    weightImpact: number;
  };
  level: 'none' | 'poor' | 'fair' | 'good' | 'excellent';
  description: string;
  exerciseDaysPerWeek?: number;
}

export interface TimeSlotAnalysis {
  count: number;
  avgChange: number;
  effectiveness: number;
  score: number;
}

export interface BestTimeSlotAnalysis {
  bestTimeSlot: 'morning' | 'afternoon' | 'evening' | null;
  analysis: {
    morning: TimeSlotAnalysis;
    afternoon: TimeSlotAnalysis;
    evening: TimeSlotAnalysis;
  };
  recommendation: string;
  timeSlotNames?: {
    morning: string;
    afternoon: string;
    evening: string;
  };
  dataQuality?: 'good' | 'insufficient';
}

export interface WeeklyFrequencyData {
  week: number;
  startDate: string;
  exerciseCount: number;
  totalDuration: number;
  weightChange: number;
  avgWeight: number;
}

export interface FrequencyImpactAnalysis {
  periods: WeeklyFrequencyData[];
  correlation: number | null;
  insight: string;
  summary: {
    totalWeeks: number;
    avgExercisePerWeek: number;
    avgWeightChangePerWeek: number;
  };
}

export interface ExerciseAnalysis {
  weightChangeAfterExercise: {
    data: WeightChangeAfterExercise[];
    summary: {
      total: number;
      positive: number;
      avgChange: number;
    };
  };
  efficiencyScore: ExerciseEfficiencyScore;
  bestTimeSlot: BestTimeSlotAnalysis;
  frequencyImpact: FrequencyImpactAnalysis;
  generatedAt: string;
}

// 饮食记录相关类型
export interface MealRecord {
  id: string;
  date: string;
  description: string;
  images: string[]; // 图片URL数组
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'other';
  estimatedCalories: number | null;
  aiAnalysis: string | null;
  details?: {
    confidence?: 'high' | 'medium' | 'low';
    breakdown?: Array<{
      food: string;
      amount: string;
      calories: number;
    }>;
    nutrients?: {
      protein: number;
      carbs: number;
      fat: number;
    };
  };
  createdAt: string;
  updatedAt?: string;
}

export interface DailyCalories {
  date: string;
  totalCalories: number;
  mealCount: number;
  meals: Array<{
    id: string;
    mealType: string;
    description: string;
    calories: number | null;
  }>;
}
