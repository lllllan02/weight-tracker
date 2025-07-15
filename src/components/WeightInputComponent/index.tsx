import React, { useState, useEffect } from 'react';
import { Card, Form, message } from 'antd';
import { WeightRecord, UserProfile, CalendarData } from '../../types';
import { generateId } from '../../utils/helpers';
import { addRecord, updateRecord, updateProfile } from '../../utils/api';
import dayjs, { Dayjs } from 'dayjs';

// 导入子组件
import { CalendarView } from './CalendarView';
import { DayRecordCard } from './DayRecordCard';
import { WeightRecordModal } from './WeightRecordModal';
import { SettingsModal } from './SettingsModal';
import { CalendarHeader } from './CalendarHeader';
import { TIME_SLOTS, TimeSlot } from './constants';

interface WeightInputProps {
  onAdd: () => void;
  profile: UserProfile;
  onProfileChange: (profile: UserProfile) => void;
  calendarData: CalendarData;
}

export const WeightInput: React.FC<WeightInputProps> = ({ 
  onAdd, 
  profile, 
  onProfileChange, 
  calendarData 
}) => {
  const [form] = Form.useForm();
  const [settingsForm] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<TimeSlot>(TIME_SLOTS[0]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [calendarView, setCalendarView] = useState<'date' | 'month' | 'year'>('date');
  const [editingRecord, setEditingRecord] = useState<WeightRecord | null>(null);

  // 打开添加记录弹窗
  const handleAddRecord = (date: Dayjs, timeSlot: TimeSlot) => {
    setSelectedDate(date);
    setSelectedTimeSlot(timeSlot);
    setEditingRecord(null); // 设置为新增模式
    setIsModalVisible(true);
    form.resetFields();
  };

  // 编辑记录
  const handleEditRecord = (date: Dayjs, timeSlot: TimeSlot) => {
    const { dayRecords = {} } = calendarData;
    const dateKey = date.format('YYYY-MM-DD');
    const record = dayRecords[dateKey]?.[timeSlot.key] as WeightRecord | undefined;
    
    if (record) {
      setSelectedDate(date);
      setSelectedTimeSlot(timeSlot);
      setEditingRecord(record); // 设置为编辑模式
      setIsModalVisible(true);
      form.setFieldsValue({
        weight: record.weight,
        note: record.note,
        fasting: record.fasting === '空腹'
      });
    }
  };

  // 保存记录
  const handleModalOk = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      const date = selectedDate.hour(selectedTimeSlot.hour).minute(selectedTimeSlot.minute).second(0);
      
      if (editingRecord) {
        // 编辑现有记录
        const updatedRecord: WeightRecord = {
          ...editingRecord,
          date: date.toISOString(),
          weight: values.weight,
          note: values.note?.trim() || undefined,
          fasting: values.fasting ? '空腹' : '非空腹'
        };
        
        await updateRecord(editingRecord.id, updatedRecord);
        message.success('记录更新成功！');
      } else {
        // 新增记录
        const record: WeightRecord = {
          id: generateId(),
          date: date.toISOString(),
          weight: values.weight,
          note: values.note?.trim() || undefined,
          fasting: values.fasting ? '空腹' : '非空腹'
        };
        
        await addRecord(record);
        message.success('记录添加成功！');
      }
      
      form.resetFields();
      setIsModalVisible(false);
      setEditingRecord(null);
      onAdd(); // 通知父组件重新加载数据
    } catch (error) {
      console.error('保存记录失败:', error);
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleModalCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
    setEditingRecord(null);
  };

  // 设置相关函数
  const handleSettingsSave = async () => {
    try {
      const values = await settingsForm.validateFields();
      const newProfile: UserProfile = {
        ...profile,
        height: values.height,
        targetWeight: values.targetWeight || undefined
      };
      await updateProfile(newProfile);
      onProfileChange(newProfile);
      setIsSettingsModalVisible(false);
      message.success('设置保存成功！');
    } catch (error) {
      console.error('保存设置失败:', error);
      message.error('保存设置失败');
    }
  };

  const handleSettingsCancel = () => {
    settingsForm.resetFields();
    setIsSettingsModalVisible(false);
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* 左侧日历 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Card 
            title={
              <CalendarHeader
                calendarView={calendarView}
                setCalendarView={setCalendarView}
                onSettingsClick={() => setIsSettingsModalVisible(true)}
              />
            }
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            styles={{ body: { padding: 0, border: 'none' } }}
          >
            <CalendarView
              currentDate={currentDate}
              setCurrentDate={setCurrentDate}
              calendarView={calendarView}
              setCalendarView={setCalendarView}
              calendarData={calendarData}
              onDateSelect={setSelectedDate}
            />
          </Card>
        </div>

        {/* 右侧当天记录 */}
        <div style={{ width: 260, flexShrink: 0 }}>
          <DayRecordCard
            selectedDate={selectedDate}
            calendarData={calendarData}
            onAddRecord={handleAddRecord}
            onEditRecord={handleEditRecord}
          />
        </div>
      </div>

      {/* 体重记录弹窗 */}
      <WeightRecordModal
        isVisible={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        loading={loading}
        selectedDate={selectedDate}
        selectedTimeSlot={selectedTimeSlot}
        form={form}
        isEditing={!!editingRecord}
      />

      {/* 设置弹窗 */}
      <SettingsModal
        isVisible={isSettingsModalVisible}
        onOk={handleSettingsSave}
        onCancel={handleSettingsCancel}
        profile={profile}
        form={settingsForm}
      />
    </div>
  );
}; 