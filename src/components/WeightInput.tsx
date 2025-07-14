import React, { useState } from 'react';
import { Input, Button, Form, Modal, InputNumber, Space, Switch, message } from 'antd';
import { PlusOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { WeightRecord } from '../types';
import { generateId } from '../utils/helpers';
import { addRecord } from '../utils/api';
import dayjs from 'dayjs';

interface WeightInputProps {
  onAdd: () => void;
}

const COMMON_TIMES = [
  { label: '早8点', hour: 8, minute: 0 },
  { label: '午12点', hour: 12, minute: 0 },
  { label: '晚6点', hour: 18, minute: 0 },
  { label: '晚11点', hour: 23, minute: 0 },
];

export const WeightInput: React.FC<WeightInputProps> = ({ onAdd }) => {
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [quickWeight, setQuickWeight] = useState<string>('');
  const [loading, setLoading] = useState(false);
  // 日期和时间段
  const [selectedDate, setSelectedDate] = useState(dayjs());
  const [selectedTime, setSelectedTime] = useState<{ hour: number; minute: number }>(COMMON_TIMES[0]);

  // 打开弹窗时，重置为今天和早8点
  const handleOpenModal = () => {
    setIsModalVisible(true);
    setSelectedDate(dayjs());
    setSelectedTime(COMMON_TIMES[0]);
    form.setFieldsValue({ fasting: false });
  };

  // 选择常用时间段
  const handleSelectTime = (hour: number, minute: number) => {
    setSelectedTime({ hour, minute });
  };

  // 日期加减
  const handlePrevDay = () => setSelectedDate(selectedDate.subtract(1, 'day'));
  const handleNextDay = () => setSelectedDate(selectedDate.add(1, 'day'));

  const handleModalOk = async () => {
    try {
      setLoading(true);
      const values = await form.validateFields();
      // 合成日期+时间
      const date = selectedDate.hour(selectedTime.hour).minute(selectedTime.minute).second(0);
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
      onAdd();
    } catch (error) {
      console.error('添加记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleModalCancel = () => {
    form.resetFields();
    setIsModalVisible(false);
  };

  return (
    <div style={{ marginBottom: 24 }}>
      <Space.Compact style={{ width: '100%' }}>
        <Input
          placeholder="输入今日体重 (kg)"
          value={quickWeight}
          onChange={(e) => setQuickWeight(e.target.value)}
          style={{ flex: 1 }}
          disabled={loading}
        />
        <Button 
          icon={<PlusOutlined />} 
          onClick={handleOpenModal}
          disabled={loading}
        >
          详细记录
        </Button>
      </Space.Compact>

      <Modal
        title={<span style={{fontWeight:800, fontSize:24, color:'#1677ff', letterSpacing:1}}>添加体重记录</span>}
        open={isModalVisible}
        onOk={handleModalOk}
        onCancel={handleModalCancel}
        okText={<span style={{fontSize:18, fontWeight:600}}>保存</span>}
        cancelText={<span style={{fontSize:16}}>取消</span>}
        bodyStyle={{ padding: 32, paddingTop: 24, borderRadius: 20, background: '#f8fafc' }}
        style={{ borderRadius: 20, boxShadow: '0 8px 32px rgba(22,119,255,0.10)' }}
        okButtonProps={{ style: { height: 44, fontSize: 18, borderRadius: 12, background: '#1677ff', border: 'none' } }}
        cancelButtonProps={{ style: { height: 44, fontSize: 16, borderRadius: 12 } }}
        width={440}
      >
        <Form form={form} layout="vertical" initialValues={{ fasting: false }}>
          {/* 日期选择区美化 */}
          <Form.Item label={<span style={{fontWeight:600, fontSize:16}}>日期</span>} style={{ marginBottom: 24 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: '#f6f8fa',
                borderRadius: 16,
                padding: '14px 0',
                marginBottom: 4,
                boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
              }}
            >
              <Button
                shape="circle"
                icon={<LeftOutlined />}
                size="large"
                onClick={handlePrevDay}
                style={{
                  border: 'none',
                  background: '#e6f4ff',
                  color: '#1677ff',
                  marginRight: 18,
                  fontSize: 20,
                  boxShadow: '0 1px 4px rgba(22,119,255,0.08)'
                }}
              />
              <span style={{ fontWeight: 700, fontSize: 22, minWidth: 120, textAlign: 'center', color: '#222' }}>
                {selectedDate.format('YYYY-MM-DD')}
              </span>
              <Button
                shape="circle"
                icon={<RightOutlined />}
                size="large"
                onClick={handleNextDay}
                style={{
                  border: 'none',
                  background: '#e6f4ff',
                  color: '#1677ff',
                  marginLeft: 18,
                  fontSize: 20,
                  boxShadow: '0 1px 4px rgba(22,119,255,0.08)'
                }}
              />
            </div>
          </Form.Item>

          {/* 常用时间段按钮美化 */}
          <div style={{ marginBottom: 28, display: 'flex', gap: 22, justifyContent: 'center' }}>
            {COMMON_TIMES.map(t => (
              <Button
                key={t.label}
                type={selectedTime.hour === t.hour && selectedTime.minute === t.minute ? 'primary' : 'default'}
                size="middle"
                style={{
                  borderRadius: 20,
                  background: t.label.includes('晚')
                    ? (selectedTime.hour === t.hour ? '#ffe7ba' : '#fff7e6')
                    : (selectedTime.hour === t.hour ? '#bae0ff' : '#f0f5ff'),
                  color: t.label.includes('晚') ? '#d46b08' : '#1677ff',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: 15,
                  minWidth: 68,
                  boxShadow: selectedTime.hour === t.hour ? '0 2px 8px rgba(22,119,255,0.10)' : 'none',
                  transition: 'all 0.2s',
                }}
                onClick={() => handleSelectTime(t.hour, t.minute)}
              >
                {t.label}
              </Button>
            ))}
          </div>

          {/* 空腹状态精简美化 */}
          <Form.Item name="fasting" valuePropName="checked" style={{ marginBottom: 28 }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ fontWeight: 700, fontSize: 16, marginRight: 24, color: '#222' }}>空腹状态</span>
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
            </div>
          </Form.Item>

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
    </div>
  );
}; 