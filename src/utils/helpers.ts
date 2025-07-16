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