import React, { useState } from 'react';
import { Button, Modal, Form, InputNumber, Space, message } from 'antd';
import { 
  SettingOutlined, 
  UserOutlined 
} from '@ant-design/icons';
import { UserProfile } from '../types';

interface SettingsProps {
  profile: UserProfile;
  onProfileChange: (profile: UserProfile) => void;
}

export const Settings: React.FC<SettingsProps> = ({ profile, onProfileChange }) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      const newProfile: UserProfile = {
        ...profile,
        height: values.height,
        targetWeight: values.targetWeight || undefined
      };
      onProfileChange(newProfile);
      setIsModalVisible(false);
    } catch (error) {
      console.error('保存设置失败:', error);
    }
  };



  return (
    <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
      <Button 
        icon={<SettingOutlined />} 
        onClick={() => setIsModalVisible(true)}
        size="small"
        style={{
          borderRadius: 6,
          background: '#f5f5f5',
          border: '1px solid #d9d9d9',
          color: '#666'
        }}
      >
        设置
      </Button>

      <Modal
        title={
          <span>
            <UserOutlined style={{ marginRight: 8 }} />
            个人设置
          </span>
        }
        open={isModalVisible}
        onOk={handleSave}
        onCancel={() => setIsModalVisible(false)}
        okText="保存"
        cancelText="取消"
      >
        <Form 
          form={form} 
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