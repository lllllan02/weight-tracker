import React, { useState, useEffect } from 'react';
import { Input, Button, Form, Modal, InputNumber, Space, Switch, message, Calendar, Card, Tag, Tooltip, Row, Col, Divider, Select } from 'antd';
import { PlusOutlined, EditOutlined, CheckOutlined, CloseOutlined, SettingOutlined } from '@ant-design/icons';
import { WeightRecord, UserProfile, CalendarData } from '../types';
import { generateId } from '../utils/helpers';
import { addRecord, getRecords, getProfile, updateProfile } from '../utils/api';
import dayjs, { Dayjs } from 'dayjs';

interface WeightInputProps {
  onAdd: () => void;
  profile: UserProfile;
  onProfileChange: (profile: UserProfile) => void;
  calendarData: CalendarData;
}

const TIME_SLOTS = [
  { key: 'morning', label: '早上', hour: 8, minute: 0, color: '#52c41a' },
  { key: 'night', label: '睡前', hour: 23, minute: 0, color: '#722ed1' },
];

interface DayRecord {
  [dateKey: string]: {
    [timeSlotKey: string]: WeightRecord;
  };
}

export const WeightInput: React.FC<WeightInputProps> = ({ onAdd, profile, onProfileChange, calendarData }) => {
  const [form] = Form.useForm();
  const [settingsForm] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isSettingsModalVisible, setIsSettingsModalVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(TIME_SLOTS[0]);
  const [loading, setLoading] = useState(false);
  const [currentDate, setCurrentDate] = useState<Dayjs>(dayjs());
  const [calendarView, setCalendarView] = useState<'date' | 'month' | 'year'>('date');

  // 使用传入的日历数据
  const { timeSlots = TIME_SLOTS, dayRecords = {} } = calendarData;

  // 检查某个时间段是否已有记录
  const hasRecord = (date: Dayjs, timeSlot: typeof TIME_SLOTS[0]) => {
    const dateKey = date.format('YYYY-MM-DD');
    return dayRecords[dateKey]?.[timeSlot.key];
  };

  // 获取某个时间段的记录
  const getRecord = (date: Dayjs, timeSlot: typeof TIME_SLOTS[0]) => {
    const dateKey = date.format('YYYY-MM-DD');
    return dayRecords[dateKey]?.[timeSlot.key] as WeightRecord | undefined;
  };

  // 获取当天的体重范围
  const getDayWeightRange = (date: Dayjs) => {
    const dateKey = date.format('YYYY-MM-DD');
    const dayData = dayRecords[dateKey];
    if (!dayData || Object.keys(dayData).length === 0) return null;

    const weights = Object.values(dayData).map((record: any) => record.weight);
    if (weights.length === 0) return null;

    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);
    
    return { min: minWeight, max: maxWeight, count: weights.length };
  };

  // 打开添加记录弹窗
  const handleAddRecord = (date: Dayjs, timeSlot: typeof TIME_SLOTS[0]) => {
    setSelectedDate(date);
    setSelectedTimeSlot(timeSlot);
    setIsModalVisible(true);
    form.resetFields();
  };

  // 编辑记录
  const handleEditRecord = (date: Dayjs, timeSlot: typeof TIME_SLOTS[0]) => {
    const record = getRecord(date, timeSlot);
    if (record) {
      setSelectedDate(date);
      setSelectedTimeSlot(timeSlot);
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
      
      const record: WeightRecord = {
        id: generateId(),
        date: date.toISOString(),
        weight: values.weight,
        note: values.note?.trim() || undefined,
        fasting: values.fasting ? '空腹' : '非空腹'
      };
      
      await addRecord(record);
      form.resetFields();
      setIsModalVisible(false);
      onAdd(); // 通知父组件重新加载数据
      message.success('记录保存成功！');
    } catch (error) {
      console.error('添加记录失败:', error);
      message.error('保存失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleModalCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
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

    // 渲染整个日期单元格，包含日期数字和体重信息，并整体高亮（增大方框，减少间距）
  const dateFullCellRender = (date: Dayjs) => {
    const weightRange = getDayWeightRange(date);
    const isToday = date.isSame(dayjs(), 'day');
    const hasRecord = !!weightRange;
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
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: fontWeight,
            color: textColor,
            marginBottom: weightRange ? 2 : 0,
            lineHeight: 1.1,
            whiteSpace: 'nowrap',
            textAlign: 'center',
          }}
        >
          {date.date()}
        </div>
        {weightRange ? (
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
            {weightRange.min}/{weightRange.max}
          </div>
        ) : null}
      </div>
    );
  };

  

  return (
    <div style={{ marginBottom: 24 }}>
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        {/* 左侧日历 */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <Card 
            title={
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
                    onClick={() => setIsSettingsModalVisible(true)}
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
            }
            style={{ borderRadius: 12, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
            bodyStyle={{ padding: 0, border: 'none' }}
          >
            {calendarView === 'date' ? (
              <Calendar 
                fullscreen={false}
                value={currentDate}
                onPanelChange={(date) => setCurrentDate(date)}
                dateFullCellRender={dateFullCellRender}
                onSelect={(date) => setSelectedDate(date)}
                headerRender={() => null}
                style={{ 
                  background: '#fff',
                  borderRadius: 8,
                  padding: 8
                }}
              />
            ) : calendarView === 'month' ? (
              <div style={{ 
                padding: '16px',
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: '12px'
              }}>
                {Array.from({length: 12}, (_, i) => {
                  const month = dayjs().month(i);
                  const isCurrentMonth = month.month() === currentDate.month();
                  const hasRecords = Object.keys(dayRecords).some(dateKey => {
                    const date = dayjs(dateKey);
                    return date.month() === i && date.year() === currentDate.year();
                  });
                  
                  return (
                    <div
                      key={i}
                      onClick={() => {
                        setCurrentDate(currentDate.month(i));
                        setCalendarView('date');
                      }}
                      style={{
                        padding: '16px 8px',
                        textAlign: 'center',
                        borderRadius: 8,
                        background: isCurrentMonth ? '#e6f7ff' : hasRecords ? '#f6ffed' : '#fff',
                        border: `1px solid ${isCurrentMonth ? '#1677ff' : hasRecords ? '#52c41a' : '#f0f0f0'}`,
                        color: isCurrentMonth ? '#1677ff' : hasRecords ? '#389e0d' : '#666',
                        fontWeight: isCurrentMonth || hasRecords ? 600 : 400,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease',
                        fontSize: 14
                      }}
                    >
                      {month.format('MMM')}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ padding: '16px' }}>
                {/* 年份导航 */}
                <div style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between', 
                  alignItems: 'center',
                  marginBottom: '16px',
                  padding: '0 8px'
                }}>
                  <Button
                    type="text"
                    size="small"
                    onClick={() => {
                      const newYear = currentDate.year() - 10;
                      setCurrentDate(currentDate.year(newYear));
                    }}
                    style={{ 
                      fontSize: 12, 
                      color: '#666',
                      padding: '4px 8px'
                    }}
                  >
                    ← 前10年
                  </Button>
                  <span style={{ 
                    fontSize: 14, 
                    fontWeight: 600, 
                    color: '#333',
                    minWidth: '80px',
                    textAlign: 'center'
                  }}>
                    {currentDate.year() - 5} - {currentDate.year() + 4}
                  </span>
                  <Button
                    type="text"
                    size="small"
                    onClick={() => {
                      const newYear = currentDate.year() + 10;
                      setCurrentDate(currentDate.year(newYear));
                    }}
                    style={{ 
                      fontSize: 12, 
                      color: '#666',
                      padding: '4px 8px'
                    }}
                  >
                    后10年 →
                  </Button>
                </div>
                
                {/* 年份网格 */}
                <div style={{ 
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: '12px'
                }}>
                  {Array.from({length: 10}, (_, i) => {
                    const year = currentDate.year() - 5 + i;
                    const isCurrentYear = year === dayjs().year();
                    const isSelectedYear = year === currentDate.year();
                    const hasRecords = Object.keys(dayRecords).some(dateKey => {
                      const date = dayjs(dateKey);
                      return date.year() === year;
                    });
                    
                    return (
                      <div
                        key={i}
                        onClick={() => {
                          setCurrentDate(currentDate.year(year));
                          setCalendarView('month');
                        }}
                        style={{
                          padding: '16px 8px',
                          textAlign: 'center',
                          borderRadius: 8,
                          background: isCurrentYear ? '#e6f7ff' : isSelectedYear ? '#f0f8ff' : hasRecords ? '#f6ffed' : '#fff',
                          border: `1px solid ${isCurrentYear ? '#1677ff' : isSelectedYear ? '#91d5ff' : hasRecords ? '#52c41a' : '#f0f0f0'}`,
                          color: isCurrentYear ? '#1677ff' : isSelectedYear ? '#1677ff' : hasRecords ? '#389e0d' : '#666',
                          fontWeight: isCurrentYear || isSelectedYear || hasRecords ? 600 : 400,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          fontSize: 14,
                          position: 'relative'
                        }}
                      >
                        {year}
                        {isCurrentYear && (
                          <div style={{
                            position: 'absolute',
                            top: -2,
                            right: -2,
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: '#1677ff',
                            border: '2px solid #fff'
                          }} />
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* 快速跳转到今年 */}
                <div style={{ 
                  marginTop: '16px',
                  textAlign: 'center'
                }}>
                  <Button
                    type="text"
                    size="small"
                    onClick={() => {
                      setCurrentDate(dayjs());
                    }}
                    style={{ 
                      fontSize: 12,
                      padding: '6px 16px',
                      borderRadius: 20,
                      background: '#f0f8ff',
                      color: '#1677ff',
                      border: '1px solid #91d5ff',
                      fontWeight: 500,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    回到今年
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* 右侧当天记录 */}
        <div style={{ width: 260, flexShrink: 0 }}>
          <Card 
            title={
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                width: '100%'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 16, fontWeight: 600, color: '#333' }}>
                    {selectedDate.format('MM月DD日')}
                  </span>
                  <span style={{ fontSize: 14, color: '#666', fontWeight: 500 }}>
                    {selectedDate.format('dddd')}
                  </span>
                </div>
                {selectedDate.isSame(dayjs(), 'day') && (
                  <Tag color="#1677ff" style={{ 
                    fontSize: 11, 
                    padding: '2px 8px', 
                    borderRadius: 12,
                    border: 'none',
                    background: '#e6f7ff',
                    color: '#1677ff',
                    fontWeight: 600
                  }}>
                    今天
                  </Tag>
                )}
              </div>
            }
            style={{ 
              borderRadius: 12, 
              boxShadow: '0 2px 12px rgba(0,0,0,0.08)',
              border: selectedDate.isSame(dayjs(), 'day') ? '2px solid #1677ff' : '1px solid #f0f0f0',
              background: '#fff'
            }}
            bodyStyle={{ padding: '16px 12px' }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {TIME_SLOTS.map(slot => {
                const hasRecordForSlot = hasRecord(selectedDate, slot);
                const record = getRecord(selectedDate, slot);
                const isToday = selectedDate.isSame(dayjs(), 'day');
                const isPast = selectedDate.isBefore(dayjs(), 'day');
                
                return (
                  <div
                    key={slot.key}
                    style={{
                      border: hasRecordForSlot ? `2px solid ${slot.color}` : `1px solid ${slot.color}30`,
                      borderRadius: 12,
                      background: hasRecordForSlot ? `${slot.color}05` : '#fafbfc',
                      padding: '16px',
                      textAlign: 'center',
                      position: 'relative',
                      minHeight: 90,
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      boxShadow: hasRecordForSlot ? `0 4px 12px ${slot.color}15` : '0 2px 8px rgba(0,0,0,0.04)',
                      transition: 'all 0.3s ease',
                      borderStyle: hasRecordForSlot ? 'solid' : 'dashed'
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
                      
                      {hasRecordForSlot ? (
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
                      type={hasRecordForSlot ? "primary" : "dashed"}
                      size="small"
                      icon={hasRecordForSlot ? <EditOutlined /> : <PlusOutlined />}
                      onClick={() => hasRecordForSlot ? handleEditRecord(selectedDate, slot) : handleAddRecord(selectedDate, slot)}
                      disabled={!isPast && !isToday}
                      style={{
                        borderRadius: 8,
                        borderColor: slot.color,
                        background: hasRecordForSlot ? slot.color : 'transparent',
                        color: hasRecordForSlot ? '#fff' : slot.color,
                        fontWeight: 600,
                        height: 32,
                        fontSize: 12,
                        boxShadow: hasRecordForSlot ? `0 2px 8px ${slot.color}25` : 'none',
                        borderWidth: hasRecordForSlot ? 0 : 1.5
                      }}
                    >
                      {hasRecordForSlot ? '编辑' : '添加'}
                    </Button>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      </div>

      <Modal
        title={
          <span style={{fontWeight:800, fontSize:24, color:'#1677ff', letterSpacing:1}}>
            添加体重记录 - {selectedDate.format('YYYY-MM-DD')} {selectedTimeSlot.label}
          </span>
        }
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText={<span style={{fontSize:18, fontWeight:600}}>保存</span>}
        cancelText={<span style={{fontSize:16}}>取消</span>}
        bodyStyle={{ padding: 32, paddingTop: 24, borderRadius: 20, background: '#f8fafc' }}
        style={{ borderRadius: 20, boxShadow: '0 8px 32px rgba(22,119,255,0.10)' }}
        okButtonProps={{ 
          style: { height: 44, fontSize: 18, borderRadius: 12, background: '#1677ff', border: 'none' },
          loading: loading
        }}
        cancelButtonProps={{ style: { height: 44, fontSize: 16, borderRadius: 12 } }}
        width={440}
      >
        <Form form={form} layout="vertical" initialValues={{ fasting: false }}>
          {/* 空腹状态精简美化 */}
          <div style={{ marginBottom: 28, display: 'flex', alignItems: 'center' }}>
            <span style={{ fontWeight: 700, fontSize: 16, marginRight: 24, color: '#222' }}>空腹状态</span>
            <Form.Item name="fasting" valuePropName="checked" style={{ marginBottom: 0 }}>
              <Switch
                checkedChildren={<span style={{ color: '#fff', fontWeight: 600 }}>空腹</span>}
                unCheckedChildren={<span style={{ color: '#888', fontWeight: 600 }}>非空腹</span>}
                style={{
                  fontWeight: 600,
                  fontSize: 15,
                  boxShadow: 'none',
                  transition: 'all 0.2s'
                }}
              />
            </Form.Item>
          </div>

          <Form.Item
            name="weight"
            label={<span style={{fontWeight:600}}>体重 (kg)</span>}
            rules={[
              { required: true, message: '请输入体重' },
              { type: 'number', min: 20, max: 300, message: '体重范围应在20-300kg之间' }
            ]}
            style={{ marginBottom: 24 }}
          >
            <InputNumber
              placeholder="例如: 65.5"
              style={{ width: '100%', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', height: 44, fontSize: 16 }}
              precision={1}
              min={20}
              max={300}
            />
          </Form.Item>
          <Form.Item
            name="note"
            label={<span style={{fontWeight:600}}>备注 (可选)</span>}
            style={{ marginBottom: 0 }}
          >
            <Input.TextArea
              placeholder="例如: 运动后"
              style={{ borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.04)', minHeight: 48, fontSize: 15 }}
              autoSize={{ minRows: 2, maxRows: 4 }}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* 设置弹窗 */}
      <Modal
        title={
          <span>
            <SettingOutlined style={{ marginRight: 8 }} />
            个人设置
          </span>
        }
        open={isSettingsModalVisible}
        onOk={handleSettingsSave}
        onCancel={handleSettingsCancel}
        okText="保存"
        cancelText="取消"
      >
        <Form 
          form={settingsForm} 
          layout="vertical"
          initialValues={{
            height: profile.height,
            targetWeight: profile.targetWeight
          }}
        >
          <Form.Item
            name="height"
            label="身高 (cm)"
            rules={[
              { required: true, message: '请输入身高' },
              { type: 'number', min: 100, max: 250, message: '身高范围应在100-250cm之间' }
            ]}
          >
            <InputNumber
              placeholder="例如: 170"
              style={{ width: '100%' }}
              min={100}
              max={250}
            />
          </Form.Item>
          <Form.Item
            name="targetWeight"
            label="目标体重 (kg) - 可选"
          >
            <InputNumber
              placeholder="例如: 65.0"
              style={{ width: '100%' }}
              precision={1}
              min={30}
              max={300}
            />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}; 