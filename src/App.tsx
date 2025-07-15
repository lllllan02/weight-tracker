import React, { useState, useEffect } from 'react';
import { Layout, Typography, message } from 'antd';
import { DashboardOutlined } from '@ant-design/icons';
import { WeightRecord, UserProfile, WeightStats, CalendarData, ChartData } from './types';
import { getCalendarData, getStats, getChartData, getProfile, updateProfile } from './utils/api';
import { WeightInput } from './components/WeightInput';
import { StatsCard } from './components/StatsCard';
import { WeightChart } from './components/WeightChart';

const { Header, Content } = Layout;
const { Title, Paragraph } = Typography;

function App() {
  const [calendarData, setCalendarData] = useState<CalendarData>({ timeSlots: [], dayRecords: {} });
  const [stats, setStats] = useState<WeightStats>({ current: 0, average: 0, min: 0, max: 0, bmi: 0, change: 0, totalRecords: 0, thisMonth: 0, thisWeek: 0 });
  const [chartData, setChartData] = useState<ChartData>({ labels: [], datasets: [] });
  const [profile, setProfile] = useState<UserProfile>({ height: 170, theme: 'light' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [calendar, statsData, chart, profileData] = await Promise.all([
        getCalendarData(),
        getStats(),
        getChartData(),
        getProfile()
      ]);
      setCalendarData(calendar);
      setStats(statsData);
      setChartData(chart);
      setProfile(profileData);
    } catch (error) {
      console.error('加载数据失败:', error);
      message.error('连接后端服务失败，请确保后端服务已启动');
    }
  };

  const handleAddRecord = async () => {
    try {
      // 重新加载所有数据，因为后端会自动更新所有计算数据
      await loadData();
      message.success('体重记录添加成功');
    } catch (error) {
      message.error('添加记录失败');
    }
  };

  const handleProfileChange = async (newProfile: UserProfile) => {
    try {
      await updateProfile(newProfile);
      // 重新加载所有数据，因为后端会自动更新所有计算数据
      await loadData();
      message.success('用户资料更新成功');
    } catch (error) {
      message.error('更新用户资料失败');
    }
  };

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
          {/* 体重输入 */}
          <WeightInput 
            onAdd={handleAddRecord} 
            profile={profile} 
            onProfileChange={handleProfileChange}
            calendarData={calendarData}
          />

          {/* 统计卡片 */}
          {stats.current > 0 && (
            <StatsCard stats={stats} height={profile.height} />
          )}

          {/* 体重图表 */}
          <WeightChart chartData={chartData} />

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
