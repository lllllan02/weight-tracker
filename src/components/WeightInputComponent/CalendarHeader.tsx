import React from 'react';
import { Button } from 'antd';
import { SettingOutlined } from '@ant-design/icons';

interface CalendarHeaderProps {
  calendarView: 'date' | 'month' | 'year';
  setCalendarView: (view: 'date' | 'month' | 'year') => void;
  onSettingsClick: () => void;
}

export const CalendarHeader: React.FC<CalendarHeaderProps> = ({
  calendarView,
  setCalendarView,
  onSettingsClick
}) => {
  return (
    <div style={{ 
      display: 'flex', 
      alignItems: 'center', 
      justifyContent: 'space-between',
      width: '100%'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 18, fontWeight: 600 }}>体重记录日历</span>
        <Button 
          icon={<SettingOutlined />} 
          onClick={onSettingsClick}
          size="small"
          style={{
            borderRadius: 6,
            background: '#f5f5f5',
            border: '1px solid #d9d9d9',
            color: '#666',
            height: 28,
            padding: '0 8px'
          }}
        >
          设置
        </Button>
      </div>
      <div style={{ display: 'flex', border: '1px solid #d9d9d9', borderRadius: 6, overflow: 'hidden' }}>
        <Button
          type={calendarView === 'date' ? "primary" : "default"}
          size="small"
          onClick={() => setCalendarView('date')}
          style={{
            borderRadius: 0,
            border: 'none',
            background: calendarView === 'date' ? '#1677ff' : '#fff',
            color: calendarView === 'date' ? '#fff' : '#666',
            transition: 'all 0.2s ease'
          }}
        >
          日期
        </Button>
        <Button
          type={calendarView === 'month' ? "primary" : "default"}
          size="small"
          onClick={() => setCalendarView('month')}
          style={{
            borderRadius: 0,
            border: 'none',
            background: calendarView === 'month' ? '#1677ff' : '#fff',
            color: calendarView === 'month' ? '#fff' : '#666',
            transition: 'all 0.2s ease'
          }}
        >
          月份
        </Button>
        <Button
          type={calendarView === 'year' ? "primary" : "default"}
          size="small"
          onClick={() => setCalendarView('year')}
          style={{
            borderRadius: 0,
            border: 'none',
            background: calendarView === 'year' ? '#1677ff' : '#fff',
            color: calendarView === 'year' ? '#fff' : '#666',
            transition: 'all 0.2s ease'
          }}
        >
          年份
        </Button>
      </div>
    </div>
  );
}; 