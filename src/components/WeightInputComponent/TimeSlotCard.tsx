import React from 'react';
import { Button } from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { WeightRecord, TimeSlot } from '../../types';

interface TimeSlotCardProps {
  slot: TimeSlot;
  selectedDate: Dayjs;
  hasRecord: boolean;
  record?: WeightRecord;
  onAddRecord: (date: Dayjs, slot: TimeSlot) => void;
  onEditRecord: (date: Dayjs, slot: TimeSlot) => void;
}

export const TimeSlotCard: React.FC<TimeSlotCardProps> = ({
  slot,
  selectedDate,
  hasRecord,
  record,
  onAddRecord,
  onEditRecord
}) => {
  const isToday = selectedDate.isSame(dayjs(), 'day');
  const isPast = selectedDate.isBefore(dayjs(), 'day');

  return (
    <div
      style={{
        border: hasRecord ? `2px solid ${slot.color}` : `1px solid ${slot.color}30`,
        borderRadius: 12,
        background: hasRecord ? `${slot.color}05` : '#fafbfc',
        padding: '16px',
        textAlign: 'center',
        position: 'relative',
        minHeight: 90,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        boxShadow: hasRecord ? `0 4px 12px ${slot.color}15` : '0 2px 8px rgba(0,0,0,0.04)',
        transition: 'all 0.3s ease',
        borderStyle: hasRecord ? 'solid' : 'dashed'
      }}
    >
      <div>
        <div style={{ 
          fontSize: 13, 
          fontWeight: 600, 
          color: slot.color,
          marginBottom: 10,
          letterSpacing: 0.5
        }}>
          {slot.label}
        </div>
        
        {hasRecord ? (
          <div>
            <div style={{ 
              fontSize: 22, 
              fontWeight: 700, 
              color: slot.color,
              marginBottom: 6,
              letterSpacing: 0.5
            }}>
              {record?.weight}
            </div>
            <div style={{ 
              fontSize: 11, 
              color: '#666', 
              marginBottom: 6,
              fontWeight: 500,
              background: 'rgba(255,255,255,0.8)',
              padding: '3px 8px',
              borderRadius: 8,
              display: 'inline-block'
            }}>
              {record?.fasting}
            </div>
            {record?.note && (
              <div style={{ 
                fontSize: 10, 
                color: '#888', 
                fontStyle: 'italic',
                marginBottom: 6,
                padding: '4px 8px',
                background: 'rgba(255,255,255,0.9)',
                borderRadius: 6,
                border: '1px solid #f0f0f0'
              }}>
                {record.note}
              </div>
            )}
          </div>
        ) : (
          <div style={{ 
            fontSize: 14, 
            color: '#ccc',
            fontWeight: 500,
            marginBottom: 6,
            fontStyle: 'italic'
          }}>
            暂无记录
          </div>
        )}
      </div>
      
      <Button
        type={hasRecord ? "primary" : "dashed"}
        size="small"
        icon={hasRecord ? <EditOutlined /> : <PlusOutlined />}
        onClick={() => hasRecord ? onEditRecord(selectedDate, slot) : onAddRecord(selectedDate, slot)}
        disabled={!isPast && !isToday}
        style={{
          borderRadius: 8,
          borderColor: slot.color,
          background: hasRecord ? slot.color : 'transparent',
          color: hasRecord ? '#fff' : slot.color,
          fontWeight: 600,
          height: 32,
          fontSize: 12,
          boxShadow: hasRecord ? `0 2px 8px ${slot.color}25` : 'none',
          borderWidth: hasRecord ? 0 : 1.5
        }}
      >
        {hasRecord ? '编辑' : '添加'}
      </Button>
    </div>
  );
}; 