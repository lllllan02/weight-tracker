import React from 'react';
import { Calendar } from 'antd';
import { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { CalendarData } from '../../../types';

interface DateViewProps {
  currentDate: Dayjs;
  setCurrentDate: (date: Dayjs) => void;
  calendarData: CalendarData;
  onDateSelect: (date: Dayjs) => void;
}

export const DateView: React.FC<DateViewProps> = ({
  currentDate,
  setCurrentDate,
  calendarData,
  onDateSelect
}) => {
  const { dayRecords = {} } = calendarData;

  // 获取当天的早上和睡前体重
  const getDayWeights = (date: Dayjs) => {
    const dateKey = date.format('YYYY-MM-DD');
    const dayData = dayRecords[dateKey];
    if (!dayData) return null;

    // 获取早上和睡前的记录
    const morningRecord = dayData.morning;
    const nightRecord = dayData.night;
    
    return {
      morning: morningRecord?.weight || null,
      night: nightRecord?.weight || null,
      hasAnyRecord: !!(morningRecord || nightRecord)
    };
  };

  // 渲染整个日期单元格
  const dateFullCellRender = (date: Dayjs) => {
    const dayWeights = getDayWeights(date);
    const isToday = date.isSame(dayjs(), 'day');
    const hasRecord = dayWeights?.hasAnyRecord || false;
    const isCurrentMonth = date.month() === currentDate.month();
    
    // 根据状态确定样式
    let backgroundColor = '#fff';
    let borderColor = 'transparent';
    let textColor = '#d9d9d9';
    let fontWeight = 400;
    
    if (isToday) {
      backgroundColor = '#e6f7ff';
      borderColor = '#1677ff';
      textColor = '#1677ff';
      fontWeight = 600;
    } else if (hasRecord && isCurrentMonth) {
      backgroundColor = '#f6ffed';
      borderColor = '#52c41a';
      textColor = '#389e0d';
      fontWeight = 600;
    } else if (isCurrentMonth) {
      textColor = '#333';
      fontWeight = 500;
    }

    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          minHeight: 50,
          minWidth: 80,
          maxWidth: 80,
          maxHeight: 50,
          margin: '3px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: 6,
          background: backgroundColor,
          border: `1px solid ${borderColor}`,
          boxSizing: 'border-box',
          padding: '4px 2px',
          transition: 'all 0.2s ease',
          cursor: 'pointer',
          position: 'relative',
        }}
        onClick={() => onDateSelect(date)}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: fontWeight,
            color: textColor,
            marginBottom: dayWeights?.hasAnyRecord ? 2 : 0,
            lineHeight: 1.1,
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}
        >
          {date.date()}
        </div>
        {dayWeights?.hasAnyRecord ? (
          <div
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: textColor,
              lineHeight: 1.05,
              marginBottom: 0,
              letterSpacing: 0.1,
              whiteSpace: 'nowrap',
              textAlign: 'center',
              opacity: 0.9,
            }}
          >
            {dayWeights.morning ? dayWeights.morning.toFixed(1) : '—'}/{dayWeights.night ? dayWeights.night.toFixed(1) : '—'}
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <Calendar 
      fullscreen={false}
      value={currentDate}
      onPanelChange={(date) => setCurrentDate(date)}
              fullCellRender={dateFullCellRender}
      onSelect={(date) => onDateSelect(date)}
      headerRender={() => null}
      style={{ 
        background: '#fff',
        borderRadius: 8,
        padding: 8
      }}
    />
  );
}; 