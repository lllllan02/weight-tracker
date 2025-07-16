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
      change: 0,
      totalRecords: 0,
      thisMonth: 0,
      thisWeek: 0,
      targetProgress: 0,
      targetRemaining: 0,
      initialWeight: 0
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

  // 计算本月和本周记录数
  const now = new Date();
  const thisMonth = records.filter(r => {
    const recordDate = new Date(r.date);
    return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
  }).length;

  const thisWeek = records.filter(r => {
    const recordDate = new Date(r.date);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);
    return recordDate >= weekStart && recordDate <= weekEnd;
  }).length;

  return {
    current,
    average,
    min,
    max,
    bmi,
    change,
    totalRecords: records.length,
    thisMonth,
    thisWeek,
    targetProgress: 0,
    targetRemaining: 0,
    initialWeight: 0
  };
};

export const getChartData = (records: WeightRecord[], height: number) => {
  const sortedRecords = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // 计算BMI数据
  const bmiData = sortedRecords.map(r => calculateBMI(r.weight, height));
  
  // 计算体重变化速度 (kg/天)
  const weightChangeRate = sortedRecords.map((record, index) => {
    if (index === 0) return 0; // 第一条记录没有变化速度
    const currentWeight = record.weight;
    const previousWeight = sortedRecords[index - 1].weight;
    const currentDate = new Date(record.date);
    const previousDate = new Date(sortedRecords[index - 1].date);
    const daysDiff = (currentDate.getTime() - previousDate.getTime()) / (1000 * 60 * 60 * 24);
    
    if (daysDiff === 0) return 0;
    return Number(((currentWeight - previousWeight) / daysDiff).toFixed(2));
  });
  
  return {
    labels: sortedRecords.map(r => formatDate(r.date)),
    datasets: [
      {
        label: '体重 (kg)',
        data: sortedRecords.map(r => r.weight),
        borderColor: '#0ea5e9',
        backgroundColor: 'rgba(14, 165, 233, 0.1)',
        tension: 0.1,
        fill: true,
        yAxisID: 'y'
      },
      {
        label: 'BMI',
        data: bmiData,
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.1,
        fill: false,
        yAxisID: 'y1'
      },
      {
        label: '变化速度 (kg/天)',
        data: weightChangeRate,
        borderColor: '#f59e0b',
        backgroundColor: 'rgba(245, 158, 11, 0.1)',
        tension: 0.1,
        fill: false,
        yAxisID: 'y2'
      }
    ]
  };
}; 