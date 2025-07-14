import React, { useState, useEffect } from 'react';
import { Layout, Typography, message } from 'antd';
import { DashboardOutlined } from '@ant-design/icons';
import { WeightRecord, UserProfile } from './types';
import { calculateStats } from './utils/helpers';
import { getRecords, getProfile, updateProfile } from './utils/api';
import { WeightInput } from './components/WeightInput';
import { StatsCard } from './components/StatsCard';
import { WeightChart } from './components/WeightChart';
import { WeightList } from './components/WeightList';
import { Settings } from './components/Settings';

const { Header, Content } = Layout;
const { Title, Paragraph } = Typography;

function App() {
  const [records, setRecords] = useState<WeightRecord[]>([]);
  const [profile, setProfile] = useState<UserProfile>({ height: 170, theme: 'light' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [savedRecords, savedProfile] = await Promise.all([
        getRecords(),
        getProfile()
      ]);
      setRecords(savedRecords);
      setProfile(savedProfile);
    } catch (error) {
      console.error('加载数据失败:', error);
      message.error('连接后端服务失败，请确保后端服务已启动');
    }
  };

  const handleAddRecord = async () => {
    try {
      const newRecords = await getRecords();
      setRecords(newRecords);
      message.success('体重记录添加成功');
    } catch (error) {
      message.error('添加记录失败');
    }
  };

  const handleDeleteRecord = async () => {
    try {
      const newRecords = await getRecords();
      setRecords(newRecords);
      message.success('体重记录删除成功');
    } catch (error) {
      message.error('删除记录失败');
    }
  };

  const handleProfileChange = async (newProfile: UserProfile) => {
    try {
      await updateProfile(newProfile);
      setProfile(newProfile);
      message.success('用户资料更新成功');
    } catch (error) {
      message.error('更新用户资料失败');
    }
  };

  const stats = calculateStats(records, profile.height);

  return (
    <Layout className="app-container">
      <Header style={{ 
        background: '#fff', 
        padding: '32px 0 16px 0',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        minHeight: 'unset',
        height: 'auto',
        display: 'block',
      }}>
        <div className="header">
          <Title level={2} style={{ margin: 0, color: '#1890ff', wordBreak: 'break-all', whiteSpace: 'normal' }}>
            <DashboardOutlined style={{ marginRight: 12 }} />
            体重记录
          </Title>
          <Paragraph style={{ margin: 0, color: '#666', fontSize: 16 }}>
            简单记录，科学管理你的体重变化
          </Paragraph>
        </div>
      </Header>
      
      <Content style={{ padding: 0, background: '#f5f5f5' }}>
        <div className="main-content">
          {/* 设置和数据管理 */}
          <Settings profile={profile} onProfileChange={handleProfileChange} />

          {/* 体重输入 */}
          <WeightInput onAdd={handleAddRecord} />

          {/* 统计卡片 */}
          {records.length > 0 && (
            <StatsCard stats={stats} height={profile.height} />
          )}

          {/* 体重图表 */}
          <WeightChart records={records} />

          {/* 体重记录列表 */}
          <WeightList records={records} onDelete={handleDeleteRecord} />

          {/* 页脚 */}
          <div className="footer">
            <Paragraph style={{ textAlign: 'center', color: '#666', marginTop: 32 }}>
              数据存储在本地 JSON 文件中，实时同步
            </Paragraph>
          </div>
        </div>
      </Content>
    </Layout>
  );
}

export default App;
