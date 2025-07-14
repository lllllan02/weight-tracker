export interface WeightRecord {
  id: string;
  date: string;
  weight: number;
  note?: string;
  fasting: '空腹' | '非空腹';
}

export interface UserProfile {
  height: number;
  targetWeight?: number;
  theme: 'light' | 'dark';
}

export interface WeightStats {
  current: number;
  average: number;
  min: number;
  max: number;
  bmi: number;
  change: number;
} 