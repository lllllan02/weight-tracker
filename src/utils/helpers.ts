import { WeightRecord, WeightStats } from '../types';
import { format, parseISO } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
};

export const formatDate = (date: string): string => {
  return format(parseISO(date), 'MM月dd日 HH:mm', { locale: zhCN });
};

export const formatDateFull = (date: string): string => {
  return format(parseISO(date), 'yyyy年MM月dd日 HH:mm', { locale: zhCN });
};

export const calculateBMI = (weight: number, height: number): number => {
  const heightInMeters = height / 100;
  return Number((weight / (heightInMeters * heightInMeters)).toFixed(1));
};

export const getBMICategory = (bmi: number): string => {
  if (bmi < 18.5) return '偏瘦';
  if (bmi < 24) return '正常';
  if (bmi < 28) return '偏胖';
  return '肥胖';
};

export const calculateStats = (records: WeightRecord[], height: number): WeightStats => {
  if (records.length === 0) {
    return {
      current: 0,
      average: 0,
      min: 0,
      max: 0,
      bmi: 0,
      change: 0
    };
  }

  const sortedRecords = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const current = sortedRecords[sortedRecords.length - 1].weight;
  const previous = sortedRecords.length > 1 ? sortedRecords[sortedRecords.length - 2].weight : current;
  
  const weights = records.map(r => r.weight);
  const average = Number((weights.reduce((sum, w) => sum + w, 0) / weights.length).toFixed(1));
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const bmi = calculateBMI(current, height);
  const change = Number((current - previous).toFixed(1));

  return {
    current,
    average,
    min,
    max,
    bmi,
    change
  };
};

export const getChartData = (records: WeightRecord[]) => {
  const sortedRecords = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  return {
    labels: sortedRecords.map(r => formatDate(r.date)),
    datasets: [{
      label: '体重 (kg)',
      data: sortedRecords.map(r => r.weight),
      borderColor: '#0ea5e9',
      backgroundColor: 'rgba(14, 165, 233, 0.1)',
      tension: 0.1,
      fill: true
    }]
  };
}; 