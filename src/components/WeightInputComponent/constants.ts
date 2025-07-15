export const TIME_SLOTS = [
  { key: 'morning', label: '早上', hour: 8, minute: 0, color: '#52c41a' },
  { key: 'night', label: '睡前', hour: 23, minute: 0, color: '#722ed1' },
];

export type TimeSlot = typeof TIME_SLOTS[0]; 