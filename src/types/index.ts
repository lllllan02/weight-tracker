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
  totalRecords: number;
  thisMonth: number;
  thisWeek: number;
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